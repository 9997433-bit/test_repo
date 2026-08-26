import { test } from "node:test";
import assert from "node:assert/strict";
import { MINIGAME_PAYOUTS, PARTNER_SIGN_SHARDS } from "../src/data/balance.js";
import { FASHION_CLIENTS } from "../src/data/copy.js";
import {
  orderTip,
  orderMs,
  rollOrder,
  freshPayout,
  boutiqueScore,
  buildBoard,
  drawBox,
  drawRun,
  tierClass,
  fortuneResult,
  spinOmens,
  expectedSpin,
  OMENS,
  payouts,
  resolvePayouts,
  auditPayouts,
  poolExpectation,
  spinExpectation,
  normalizePool,
  pityFloor,
  fortuneOmens,
  pickWeighted,
  poolWeight,
  chanceOf,
  RTP_LIMIT,
  PAYOUT_FALLBACK,
  PAID_GAMES,
} from "../src/minigames/index.js";
import { createDisposer } from "../src/minigames/runtime.js";

const GAMES = ["fastfood", "fresh", "boutique", "blindbox", "fortune"];

/** 固定序列的伪随机源：让抽卡/起盘在 Node 里完全确定。 */
function seq(...values) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

/**
 * 造一个必定抽中某类档位的随机源。直接写死 rand 值会把测试绑在奖池的数组顺序上，
 * 而奖池顺序正是 F3 可以随手改的东西。
 */
function rollHitting(pool, match) {
  const total = poolWeight(pool);
  let acc = 0;
  for (const item of pool) {
    if (match(item)) {
      const at = (acc + item.w / 2) / total;
      return () => at;
    }
    acc += item.w;
  }
  throw new Error("奖池里没有符合条件的档位");
}

const plainRoll = (pool) => rollHitting(pool, (item) => item.shard === 0);
const rareRoll = (pool) => rollHitting(pool, (item) => item.shard > 0);

/* ══════════════════════════════════════════════════════════════════════
 * 一、F3 数值主权：balance.js 改了，视图必须跟着改
 * ════════════════════════════════════════════════════════════════════ */

test("F3 表的每个键都必须落到视图真正读的键位上（禁止死键）", () => {
  const perturb = (value) => {
    if (typeof value === "number") return value + 1;
    if (Array.isArray(value)) return value.length > 1 ? value.slice(0, -1) : [...value, ...value];
    return value;
  };

  for (const id of GAMES) {
    const entry = MINIGAME_PAYOUTS[id];
    const before = resolvePayouts(id, entry);
    for (const key of Object.keys(entry)) {
      const after = resolvePayouts(id, { ...entry, [key]: perturb(entry[key]) });
      assert.notDeepEqual(
        after,
        before,
        `MINIGAME_PAYOUTS.${id}.${key} 是死键：F3 改它，视图口径的赏金表纹丝不动`,
      );
    }
  }
});

test("F3 的异名键按别名表接到视图键位，异构键按语义换算", () => {
  const f3 = MINIGAME_PAYOUTS;
  // 纯改名：F3 说的是同一件事，只是叫法不同
  assert.equal(payouts("fastfood").orderBase, f3.fastfood.tipBase);
  assert.equal(payouts("fastfood").perItem, f3.fastfood.tipPerItem);
  assert.equal(payouts("fastfood").xpPerOrder, f3.fastfood.xp);
  assert.equal(payouts("fresh").goldPerGood, f3.fresh.goldPerCatch);
  assert.equal(payouts("boutique").perTagHit, f3.boutique.perScore);
  assert.equal(payouts("boutique").xpPerHit, f3.boutique.xpPerScore);
  // 同名直给
  assert.equal(payouts("boutique").base, f3.boutique.base);
  assert.equal(payouts("boutique").xpBase, f3.boutique.xpBase);
  assert.equal(payouts("blindbox").cost, f3.blindbox.cost);
  assert.equal(payouts("fortune").cost, f3.fortune.cost);
  // 单位换算：F3 记「每 N 件 1 阅历」，视图按「每件多少阅历」累加
  assert.equal(payouts("fresh").xpPerGood, 1 / f3.fresh.catchesPerXp);
  assert.equal(freshPayout({ good: f3.fresh.catchesPerXp }).xp, 1);
});

test("改 F3 的数字就能改判定结果，视图不留第二份数值", () => {
  const base = MINIGAME_PAYOUTS.fastfood;
  const rich = resolvePayouts("fastfood", { ...base, tipBase: base.tipBase * 10 });
  const order = { items: 3, combo: 0, streak: 0, mistakes: 0 };
  assert.ok(
    orderTip(order, rich).gold > orderTip(order, payouts("fastfood")).gold,
    "抬高 F3 的 tipBase 必须抬高小费",
  );

  const cheap = resolvePayouts("fresh", { ...MINIGAME_PAYOUTS.fresh, goldPerCatch: 1 });
  assert.equal(freshPayout({ good: 10, bestCombo: 0 }, cheap).gold, 10);

  const generous = resolvePayouts("boutique", { ...MINIGAME_PAYOUTS.boutique, perScore: 100 });
  const need = ["西装", "中性", "利落"];
  assert.equal(
    boutiqueScore({ need, picked: need, lookTags: [] }, generous).gold -
      boutiqueScore({ need, picked: [], lookTags: [] }, generous).gold,
    need.length * 100 + generous.perfectBonus,
    "三个命中应按 F3 的 perScore 计价，另加满堂彩",
  );
});

test("视图口径的赏金表只保留视图契约里的键，schema 外的 F3 键明着不生效", () => {
  for (const id of GAMES) {
    const table = payouts(id);
    assert.deepEqual(
      Object.keys(table).sort(),
      Object.keys(PAYOUT_FALLBACK[id]).sort(),
      `${id} 的赏金表键集必须与视图契约一致`,
    );
  }
  const withJunk = resolvePayouts("fastfood", { ...MINIGAME_PAYOUTS.fastfood, mysteryKnob: 999 });
  assert.equal(withJunk.mysteryKnob, undefined, "视图不认的键不得混进赏金表冒充已接管");
});

test("F3 给坏值时逐键退回兜底，视图永远拿不到 NaN 或越界下标", () => {
  const fallback = PAYOUT_FALLBACK.fastfood;
  const broken = resolvePayouts("fastfood", {
    tipBase: Number.NaN,
    tipPerItem: Number.POSITIVE_INFINITY,
    xp: "12",
    minItems: null,
  });
  assert.equal(broken.orderBase, fallback.orderBase);
  assert.equal(broken.perItem, fallback.perItem);
  assert.equal(broken.xpPerOrder, fallback.xpPerOrder);
  assert.equal(broken.minItems, fallback.minItems);

  // 数组太短会让 fortuneResult 读出 undefined，必须整键退回
  const short = resolvePayouts("fortune", { goldByBless: [1, 2], stopMs: [10] });
  assert.deepEqual(short.goldByBless, PAYOUT_FALLBACK.fortune.goldByBless);
  assert.deepEqual(short.stopMs, PAYOUT_FALLBACK.fortune.stopMs);
  assert.equal(resolvePayouts("fortune", { goldByBless: [] }).goldByBless.length, 4);

  for (const id of GAMES) {
    assert.deepEqual(resolvePayouts(id, null), resolvePayouts(id, {}), `${id} F3 缺席应等于兜底表`);
    for (const [key, value] of Object.entries(resolvePayouts(id, MINIGAME_PAYOUTS[id]))) {
      if (typeof value === "number") assert.ok(Number.isFinite(value), `${id}.${key} 不得为 NaN/Infinity`);
    }
  }
  assert.deepEqual(payouts("nope"), {});
});

/* ══════════════════════════════════════════════════════════════════════
 * 二、B6 无印钞漏洞：付费随机玩法期望必须为负
 * ════════════════════════════════════════════════════════════════════ */

test("付费玩法的长期返奖率守在红线内，且必须真的产出碎片", () => {
  for (const id of PAID_GAMES) {
    const audit = auditPayouts(id);
    assert.equal(audit.ok, true, `${id} 未通过 B6 体检`);
    assert.ok(audit.gold < audit.cost, `${id} 期望回报 ${audit.gold} 不得高于入场费 ${audit.cost}`);
    assert.ok(audit.rtp <= RTP_LIMIT, `${id} RTP ${audit.rtp} 超过上限 ${RTP_LIMIT}`);
    assert.ok(audit.shard > 0, `${id} 必须产出碎片期望，随机玩法只承载碎片`);
    // 攒够一位伙伴的碎片，付出的金币必须远超同样金币能买到的确定收益
    assert.ok((PARTNER_SIGN_SHARDS / audit.shard) * audit.cost > 0);
  }
  for (const id of GAMES) {
    if (!PAID_GAMES.has(id)) assert.equal(auditPayouts(id).paid, false);
  }
});

test("越过 B6 红线的 F3 覆盖会被整表拒收，退回保守兜底", () => {
  const printer = {
    ...MINIGAME_PAYOUTS.blindbox,
    cost: 1,
    pool: MINIGAME_PAYOUTS.blindbox.pool.map((item) => ({ ...item, gold: item.gold * 100 })),
  };
  const audit = auditPayouts("blindbox", resolvePayouts("blindbox", printer));
  assert.equal(audit.ok, false, "正期望奖池必须被体检拦下");
  assert.ok(audit.rtp > RTP_LIMIT);

  const noShard = resolvePayouts("fortune", { ...MINIGAME_PAYOUTS.fortune, shardAllBless: 0, shardTriple: 0 });
  assert.equal(auditPayouts("fortune", noShard).ok, false, "不产碎片的付费玩法只是纯抽水，同样不合格");
});

test("盲盒期望必须按含保底口径核算，只算单抽会低估返奖率", () => {
  const table = payouts("blindbox");
  const plain = poolExpectation(table.pool);
  const withPity = poolExpectation(table.pool, table.pity);
  assert.ok(withPity.gold > plain.gold, "保底只会抬高长期返奖，不会降低");
  assert.ok(withPity.shard > plain.shard);
  assert.equal(poolExpectation(table.pool, 0).gold, plain.gold, "pity=0 即无保底，回落到单抽期望");

  // 保底越紧，长期返奖越高——单调性是这套算法的定义性质
  let last = 0;
  for (const pity of [64, 32, 16, 8, 4, 2]) {
    const gold = poolExpectation(table.pool, pity).gold;
    assert.ok(gold > last, `保底 ${pity} 抽的期望应高于更松的保底`);
    last = gold;
  }
  assert.deepEqual(poolExpectation([], 10), { gold: 0, shard: 0 });
});

test("占卜期望的闭式解与三格全枚举结果一致", () => {
  const table = payouts("fortune");
  const closed = spinExpectation(table, table.omens);
  const brute = expectedSpin(table, table.omens);
  assert.ok(Math.abs(closed.gold - brute.gold) < 1e-9, `闭式 ${closed.gold} vs 枚举 ${brute.gold}`);
  assert.ok(Math.abs(closed.shards - brute.shards) < 1e-9);

  // 换一份吉兆占比不同的名册，两套算法仍须一致
  const grim = resolvePayouts("fortune", {
    ...MINIGAME_PAYOUTS.fortune,
    slots: MINIGAME_PAYOUTS.fortune.slots.map((slot) => ({ ...slot, good: slot.id === "daji" })),
  });
  assert.ok(Math.abs(spinExpectation(grim, grim.omens).gold - expectedSpin(grim, grim.omens).gold) < 1e-9);
  assert.ok(spinExpectation(grim, grim.omens).gold < closed.gold, "吉兆变少，期望回礼必须下降");
  assert.deepEqual(spinExpectation(table, []), { gold: 0, shards: 0 });
});

/* ══════════════════════════════════════════════════════════════════════
 * 三、星光快餐：小费判定
 * ════════════════════════════════════════════════════════════════════ */

test("小费随订单量、连击、连胜单增，随失误单减", () => {
  const table = payouts("fastfood");
  const at = (over) => orderTip({ items: 2, combo: 0, streak: 0, mistakes: 0, ...over }, table).gold;
  assert.ok(at({ items: 4 }) > at({ items: 2 }));
  assert.ok(at({ combo: 4 }) > at({ combo: 0 }));
  assert.ok(at({ streak: 4 }) > at({ streak: 0 }));
  assert.ok(at({ mistakes: 1 }) < at({ mistakes: 0 }));
  assert.equal(at({ items: 0 }), table.orderBase);
});

test("小费倍率有硬上限，连击连胜刷再久也印不出钞", () => {
  const table = payouts("fastfood");
  const maxed = orderTip({ items: table.maxItems, combo: 1e6, streak: 1e6 }, table);
  assert.equal(maxed.comboMul, 1 + table.comboBonusMax);
  assert.equal(maxed.streakMul, 1 + table.streakBonusMax);
  const ceiling = (table.orderBase + table.maxItems * table.perItem) * maxed.comboMul * maxed.streakMul;
  assert.equal(maxed.gold, Math.round(ceiling));
  assert.equal(orderTip({ items: 2, combo: 1e6 }, table).comboMul, orderTip({ items: 2, combo: 1e9 }, table).comboMul);
});

test("失误足够多时小费归零但绝不为负，阅历只在连胜达标后加档", () => {
  const table = payouts("fastfood");
  assert.equal(orderTip({ items: 4, mistakes: 99 }, table).gold, 0);
  assert.equal(orderTip({ items: 4, mistakes: 99 }, table).keep, 0);
  assert.equal(orderTip({ items: 2, streak: table.streakNotice - 1 }, table).xp, table.xpPerOrder);
  assert.equal(
    orderTip({ items: 2, streak: table.streakNotice }, table).xp,
    table.xpPerOrder + table.xpStreakBonus,
  );
  // 负数输入按 0 处理，不得倒扣或产出 NaN
  const hostile = orderTip({ items: -5, combo: -5, streak: -5, mistakes: -5 }, table);
  assert.equal(hostile.gold, table.orderBase);
  assert.ok(Number.isFinite(hostile.gold) && Number.isFinite(hostile.xp));
});

test("订单规模与限时都落在 F3 表给的区间内", () => {
  const table = payouts("fastfood");
  for (const roll of [0, 0.5, 0.999999]) {
    const order = rollOrder(() => roll, table);
    assert.ok(order.length >= table.minItems && order.length <= table.maxItems);
    assert.ok(order.every((item) => item && item.id));
  }
  assert.ok(orderMs(4, table) > orderMs(2, table));
  assert.equal(orderMs(0, table), table.orderSeconds * 1000);
});

/* ══════════════════════════════════════════════════════════════════════
 * 四、晨光生鲜：抢收结算
 * ════════════════════════════════════════════════════════════════════ */

test("抢收零收获零结算，有收获则单增且连接加成封顶", () => {
  const table = payouts("fresh");
  assert.deepEqual(freshPayout({ good: 0, bestCombo: 0 }, table), { gold: 0, xp: 0, bonus: 1 });
  assert.ok(freshPayout({ good: 9 }, table).gold > freshPayout({ good: 3 }, table).gold);
  assert.ok(freshPayout({ good: 5, bestCombo: 5 }, table).gold > freshPayout({ good: 5 }, table).gold);
  assert.equal(freshPayout({ good: 5, bestCombo: 1e6 }, table).bonus, 1 + table.comboBonusMax);
  assert.equal(freshPayout({ good: 1 }, table).gold, table.goldPerGood);
  // 接到货就至少给 1 点阅历，避免一整轮白干
  assert.equal(freshPayout({ good: 1 }, table).xp, 1);
  assert.equal(freshPayout({ good: -3, bestCombo: -3 }, table).gold, 0);
});

/* ══════════════════════════════════════════════════════════════════════
 * 五、缪斯服装：改造评分
 * ════════════════════════════════════════════════════════════════════ */

test("改造报酬按命中计价，全中触发满堂彩", () => {
  const table = payouts("boutique");
  const need = FASHION_CLIENTS[0].tags;
  const none = boutiqueScore({ need, picked: [], lookTags: [] }, table);
  const partial = boutiqueScore({ need, picked: need.slice(0, 1), lookTags: [] }, table);
  const all = boutiqueScore({ need, picked: need, lookTags: [] }, table);

  assert.equal(none.gold, table.base);
  assert.equal(none.perfect, false);
  assert.equal(partial.gold, table.base + table.perTagHit);
  assert.equal(all.perfect, true);
  assert.equal(all.gold, table.base + need.length * table.perTagHit + table.perfectBonus);
  assert.ok(all.gold > partial.gold && partial.gold > none.gold);
  assert.equal(all.xp, table.xpBase + need.length * table.xpPerHit);
});

test("成衣自带风格词也计分，评级随契合度单增且 ratio 有界", () => {
  const table = payouts("boutique");
  const need = FASHION_CLIENTS[2].tags;
  const bare = boutiqueScore({ need, picked: [], lookTags: [] }, table);
  const dressed = boutiqueScore({ need, picked: [], lookTags: need }, table);
  assert.equal(dressed.lookHits, need.length);
  assert.equal(dressed.gold - bare.gold, need.length * table.perLookHit);

  const best = boutiqueScore({ need, picked: need, lookTags: need }, table);
  assert.equal(best.grade, "S");
  assert.equal(best.ratio, 1);
  assert.ok(bare.ratio > 0 && bare.ratio < 1);
  assert.equal(bare.grade, "C");
  for (const c of FASHION_CLIENTS) {
    const r = boutiqueScore({ need: c.tags, picked: c.tags, lookTags: c.tags }, table);
    assert.ok(r.ratio <= 1, `${c.need} 的契合度不得超过 100%`);
  }
  // 空需求不得判成满堂彩，也不得除零
  const empty = boutiqueScore({ need: [], picked: [], lookTags: [] }, table);
  assert.equal(empty.perfect, false);
  assert.ok(Number.isFinite(empty.ratio));
});

test("标签板一定含齐需求词、无重复、长度固定", () => {
  const need = FASHION_CLIENTS[1].tags;
  for (const roll of [0, 0.42, 0.99]) {
    const board = buildBoard(need, () => roll);
    assert.equal(board.length, 8);
    assert.equal(new Set(board).size, board.length, "标签板不得出现重复词");
    for (const tag of need) assert.ok(board.includes(tag), `需求词 ${tag} 必须出现在板上`);
  }
});

/* ══════════════════════════════════════════════════════════════════════
 * 六、盲盒潮玩：抽卡与保底
 * ════════════════════════════════════════════════════════════════════ */

test("奖池归一后每档都有档位与图标，不会把 undefined 印给玩家", () => {
  const pool = payouts("blindbox").pool;
  assert.equal(pool.length, MINIGAME_PAYOUTS.blindbox.pool.length);
  for (const item of pool) {
    assert.equal(typeof item.tier, "string");
    assert.ok(item.tier.length > 0, `${item.id} 缺档位徽章`);
    assert.ok(item.icon && item.icon.length > 0, `${item.id} 缺图标`);
    assert.ok(Number.isFinite(item.w) && item.w > 0);
    assert.ok(Number.isFinite(item.gold) && item.gold >= 0);
    assert.ok(Number.isFinite(item.shard) && item.shard >= 0);
  }
  // F3 的 id / 赏金 / 碎片原样保留，归一只补视图缺的展示字段
  for (const [i, source] of MINIGAME_PAYOUTS.blindbox.pool.entries()) {
    assert.equal(pool[i].id, source.id);
    assert.equal(pool[i].gold, source.gold);
    assert.equal(pool[i].shard, source.shard);
  }
  // 越稀有档位越高
  const ladder = ["R", "SR", "SSR", "UR"];
  const byWeight = [...pool].sort((a, b) => b.w - a.w);
  assert.deepEqual(byWeight.map((item) => item.tier), ladder);
  assert.deepEqual(normalizePool([{ id: "x", w: 0 }, null, "junk"]), []);
  // 已经标好档位的表不被改写
  assert.equal(normalizePool(PAYOUT_FALLBACK.blindbox.pool)[3].tier, "UR");
});

test("档位样式认赏金表的 tier，缺 tier 时按碎片数兜底", () => {
  assert.equal(tierClass({ tier: "UR" }), "tier-ur");
  assert.equal(tierClass({ tier: "SSR" }), "tier-ssr");
  assert.equal(tierClass({ tier: "R" }), "", "最低档不加高光样式");
  assert.equal(tierClass({ id: "sr" }), "tier-sr", "旧表只有 id 时仍要认得出");
  assert.equal(tierClass({ shard: 5 }), "tier-ur");
  assert.equal(tierClass({ shard: 0 }), "");
  assert.equal(tierClass(null), "");
});

test("加权抽卡命中每一档的权重区间，边界不串档", () => {
  const pool = payouts("blindbox").pool;
  const total = poolWeight(pool);
  let acc = 0;
  for (const item of pool) {
    const mid = (acc + item.w / 2) / total;
    assert.equal(pickWeighted(pool, () => mid).id, item.id, `${item.id} 区间中点应命中自身`);
    acc += item.w;
    assert.equal(
      pickWeighted(pool, () => (acc - 1e-9) / total).id,
      item.id,
      `${item.id} 区间末尾前应留在本档`,
    );
  }
  assert.ok(Math.abs(pool.reduce((s, i) => s + chanceOf(pool, i), 0) - 100) < 1e-9);
  assert.equal(chanceOf([], { w: 1 }), 0);
});

test("保底：连续没出碎片档时第 pity 抽必顶，出了碎片档立刻清零", () => {
  const table = payouts("blindbox");
  const floor = pityFloor(table.pool);
  const common = plainRoll(table.pool);

  let pity = 0;
  for (let i = 1; i < table.pity; i += 1) {
    const draw = drawBox(pity, common, table);
    assert.equal(draw.forced, false, `第 ${i} 抽不该触发保底`);
    assert.equal(draw.pity, i, "未出碎片档时保底计数应递增");
    pity = draw.pity;
  }
  const rescued = drawBox(pity, common, table);
  assert.equal(rescued.forced, true, `第 ${table.pity} 抽必须触发保底`);
  assert.equal(rescued.item.id, floor.id);
  assert.ok(rescued.item.shard > 0, "保底必须顶到带碎片的档位");
  assert.equal(rescued.pity, 0, "保底触发后计数清零");

  // 自然抽到碎片档同样清零，且不标记为保底
  const lucky = drawBox(table.pity - 1, rareRoll(table.pool), table);
  assert.ok(lucky.item.shard > 0);
  assert.equal(lucky.forced, false);
  assert.equal(lucky.pity, 0);
});

test("保底顶替档按权重挑，F3 重排奖池顺序不会悄悄改掉保底价值", () => {
  const table = payouts("blindbox");
  const floor = pityFloor(table.pool);
  const rares = table.pool.filter((item) => item.shard > 0);
  assert.equal(floor.w, Math.max(...rares.map((item) => item.w)), "保底应顶到最常见的稀有档");

  const shuffled = resolvePayouts("blindbox", {
    ...MINIGAME_PAYOUTS.blindbox,
    pool: [...MINIGAME_PAYOUTS.blindbox.pool].reverse(),
  });
  assert.equal(pityFloor(shuffled.pool).id, floor.id);
  const forced = drawBox(table.pity - 1, plainRoll(shuffled.pool), shuffled);
  assert.equal(forced.forced, true);
  assert.equal(forced.item.id, floor.id, "倒序奖池的保底价值必须与正序一致");
  assert.equal(pityFloor([{ id: "a", w: 1, shard: 0 }]), null);
});

test("连开一轮的合计与逐抽一致，保底计数跨抽结转", () => {
  const table = payouts("blindbox");
  const plain = plainRoll(table.pool)();
  const rare = rareRoll(table.pool)();
  const run = drawRun(table.bulk, 0, seq(plain, plain, plain, rare, plain), table);
  assert.equal(run.results.length, table.bulk);
  assert.equal(run.gold, run.results.reduce((s, r) => s + r.item.gold, 0));
  assert.equal(run.shard, run.results.reduce((s, r) => s + r.item.shard, 0));
  assert.equal(run.pity, run.results[run.results.length - 1].pity);
  assert.ok(run.shard > 0, "这一轮里抽到了稀有档，碎片必须落账");
  assert.equal(run.pity, 1, "末抽是普通档，保底计数应从稀有档后重新起算");

  // 跨轮结转：两轮各 5 抽全是普通档，第 10 抽应由保底接住
  const first = drawRun(5, 0, plainRoll(table.pool), table);
  assert.equal(first.pity, 5);
  const second = drawRun(5, first.pity, plainRoll(table.pool), table);
  assert.ok(second.results.some((r) => r.forced), "保底计数必须跨轮结转");
  assert.equal(drawRun(0, 3, plainRoll(table.pool), table).pity, 3);
});

/* ══════════════════════════════════════════════════════════════════════
 * 七、星语占卜：吉凶与碎片
 * ════════════════════════════════════════════════════════════════════ */

test("星象名册来自 F3 的 fortune.slots，吉凶归属由 F3 说了算", () => {
  const slots = MINIGAME_PAYOUTS.fortune.slots;
  assert.deepEqual(OMENS.map((o) => o.id), slots.map((s) => s.id));
  assert.deepEqual(OMENS.map((o) => o.bless), slots.map((s) => s.good));
  for (const omen of OMENS) assert.ok(omen.icon && omen.name, `${omen.id} 缺展示字段`);

  // F3 没给名册时退回兜底；给了脏数据也不能塌成空名册
  assert.deepEqual(fortuneOmens(undefined), PAYOUT_FALLBACK.fortune.omens);
  assert.deepEqual(fortuneOmens([]), PAYOUT_FALLBACK.fortune.omens);
  assert.deepEqual(fortuneOmens([null, {}]), PAYOUT_FALLBACK.fortune.omens);
  assert.equal(fortuneOmens([{ id: "daji" }])[0].icon, "🌟", "认识的星象应补回图标");
  assert.equal(fortuneOmens([{ id: "new", name: "新象", good: true }])[0].bless, true);
});

test("金币看吉兆数量，碎片只认全吉与三同象两条硬规则", () => {
  const table = payouts("fortune");
  const bless = OMENS.filter((o) => o.bless);
  const plain = OMENS.filter((o) => !o.bless);

  for (let k = 0; k <= 3; k += 1) {
    const picks = [...bless.slice(0, k), ...plain.slice(0, 3 - k)].slice(0, 3);
    const padded = picks.length === 3 ? picks : [...picks, ...plain].slice(0, 3);
    const r = fortuneResult(padded, table);
    assert.equal(r.bless, k);
    assert.equal(r.gold, table.goldByBless[k], `${k} 个吉兆应回礼 ${table.goldByBless[k]} 金`);
    assert.equal(r.xp, table.xp);
  }

  const mixed = fortuneResult([bless[0], bless[1], plain[0]], table);
  assert.equal(mixed.shards, 0, "没有全吉也没有同象时不得给碎片");

  const allBless = fortuneResult([bless[0], bless[1], bless[2]], table);
  assert.equal(allBless.allBless, true);
  assert.equal(allBless.triple, false);
  assert.equal(allBless.shards, table.shardAllBless);

  const tripleBad = fortuneResult([plain[0], plain[0], plain[0]], table);
  assert.equal(tripleBad.triple, true);
  assert.equal(tripleBad.allBless, false);
  assert.equal(tripleBad.shards, table.shardTriple);

  const jackpot = fortuneResult([bless[0], bless[0], bless[0]], table);
  assert.equal(jackpot.shards, table.shardAllBless + table.shardTriple, "两条规则可叠加");
  assert.ok(jackpot.shards >= Math.max(...[table.shardAllBless, table.shardTriple]));
});

test("金币回礼随吉兆数单增，起盘永远吐三格", () => {
  const table = payouts("fortune");
  for (let k = 1; k <= 3; k += 1) {
    assert.ok(table.goldByBless[k] > table.goldByBless[k - 1], `${k} 个吉兆应比 ${k - 1} 个值钱`);
  }
  for (const roll of [0, 0.5, 0.999999]) {
    const picks = spinOmens(() => roll, OMENS);
    assert.equal(picks.length, 3);
    assert.ok(picks.every((omen) => OMENS.includes(omen)));
  }
  assert.equal(spinOmens(() => 0, OMENS).every((o) => o.id === OMENS[0].id), true);
  // 空格子不得崩，也不得白送碎片
  const empty = fortuneResult([], table);
  assert.equal(empty.triple, false);
  assert.ok(Number.isFinite(empty.gold));
});

/* ══════════════════════════════════════════════════════════════════════
 * 八、视图生命周期：切页必须收干净副作用
 * ════════════════════════════════════════════════════════════════════ */

test("disposer 在 dispose 后收干所有计时器、监听与额外清理", async () => {
  const d = createDisposer();
  let ticks = 0;
  let events = 0;
  let cleaned = 0;
  const target = new EventTarget();

  d.interval(() => (ticks += 1), 1);
  d.timeout(() => (ticks += 1), 1);
  d.frame(() => (ticks += 1));
  d.on(target, "ping", () => (events += 1));
  d.add(() => (cleaned += 1));

  target.dispatchEvent(new Event("ping"));
  assert.equal(events, 1);

  d.dispose();
  assert.equal(d.disposed, true);
  assert.equal(cleaned, 1);
  target.dispatchEvent(new Event("ping"));
  assert.equal(events, 1, "dispose 后监听器不得再收到事件");

  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(ticks, 0, "dispose 后任何计时器回调都不得再跑");

  // dispose 幂等，且事后申请的计时器直接拒收
  d.dispose();
  assert.equal(cleaned, 1);
  assert.equal(d.interval(() => {}, 1), null);
  assert.equal(d.timeout(() => {}, 1), null);
  assert.equal(d.frame(() => {}), null);
});

test("clearTimer 只撤销指定计时器，坏 id 不炸", () => {
  const d = createDisposer();
  let kept = 0;
  const doomed = d.interval(() => {}, 1);
  d.interval(() => (kept += 1), 1);
  d.clearTimer(doomed);
  d.clearTimer(null);
  d.clearTimer(undefined);
  d.clearTimer(9999);
  assert.equal(d.disposed, false);
  d.dispose();
});

test("单个清理函数抛错不会吃掉后面的清理", () => {
  const d = createDisposer();
  const order = [];
  d.add(() => {
    order.push("a");
    throw new Error("boom");
  });
  d.add(() => order.push("b"));
  d.dispose();
  assert.deepEqual(order, ["a", "b"]);
});
