import * as BALANCE from "../data/balance.js";

/**
 * 小游戏赏金表 —— F3 数值主权与视图键位契约之间的适配层。
 *
 * 数值主权归 F3：`data/balance.js` 的 `MINIGAME_PAYOUTS` 一旦给出某个键，就由它说了算，
 * 这里的 DEFAULTS 只做兜底与补全。但 F3 用的是自己一套语义命名（tipBase / goldPerCatch /
 * perScore / slots…），视图读的是 DEFAULTS 的键位，光靠同名合并会让 F3 的调参静默落空：
 * 值确实进了合并结果，却没有任何视图去读它。ALIASES / CONVERTERS 负责把异名同义的键接上，
 * 让「改 balance.js 就能改玩法」这件事真的成立。
 *
 * 硬约束（SOTA_RUBRIC B6）：付费玩法（盲盒、占卜）的金币期望必须低于入场费，随机产出
 * 只承载碎片与惊喜。`auditPayouts()` 用含保底的长期期望守这条线，越线的覆盖整表退回兜底。
 */

const DEFAULTS = {
  fastfood: {
    orderBase: 12,
    perItem: 7,
    minItems: 2,
    maxItems: 4,
    comboBonus: 0.12,
    comboBonusMax: 0.9,
    streakBonus: 0.15,
    streakBonusMax: 0.75,
    streakNotice: 3,
    mistakeAllowance: 3,
    mistakeTipRatio: 0.35,
    orderSeconds: 6,
    perItemSeconds: 1.6,
    xpPerOrder: 2,
    xpStreakBonus: 1,
  },
  fresh: {
    roundSeconds: 30,
    lives: 3,
    goldPerGood: 9,
    comboBonus: 0.06,
    comboBonusMax: 0.6,
    rottenRate: 0.22,
    spawnStartMs: 820,
    spawnEndMs: 460,
    fallStart: 96,
    fallEnd: 168,
    catchRadius: 46,
    basketSpeed: 12,
    keyStep: 9,
    xpPerGood: 0.34,
  },
  boutique: {
    base: 24,
    perTagHit: 26,
    perLookHit: 18,
    perfectBonus: 60,
    maxPicks: 3,
    probeBudget: 4,
    xpBase: 3,
    xpPerHit: 2,
  },
  blindbox: {
    cost: 60,
    xp: 1,
    pity: 10,
    bulk: 5,
    pool: [
      { id: "r", tier: "R", name: "亚克力小立牌", icon: "🧸", w: 66, gold: 18, shard: 0 },
      { id: "sr", tier: "SR", name: "星光限定闪卡", icon: "🃏", w: 24, gold: 52, shard: 1 },
      { id: "ssr", tier: "SSR", name: "隐藏款手办", icon: "🎎", w: 8.5, gold: 130, shard: 2 },
      { id: "ur", tier: "UR", name: "城主签名典藏", icon: "👑", w: 1.5, gold: 420, shard: 5 },
    ],
  },
  fortune: {
    cost: 30,
    xp: 2,
    goldByBless: [2, 6, 14, 26],
    shardAllBless: 1,
    shardTriple: 2,
    tickMs: 70,
    stopMs: [900, 1300, 1700],
    reels: 3,
    omens: [
      { id: "daji", name: "大吉", icon: "🌟", bless: true },
      { id: "taohua", name: "桃花", icon: "🌸", bless: true },
      { id: "piancai", name: "偏财", icon: "🪙", bless: true },
      { id: "qiyu", name: "奇遇", icon: "🗝️", bless: true },
      { id: "pingwen", name: "平稳", icon: "☁️", bless: false },
      { id: "xiaoxiong", name: "小凶", icon: "🌧️", bless: false },
    ],
  },
};

/** F3 键名 → 视图键名的纯改名映射。F3 没说的，一律由 DEFAULTS 补全。 */
const ALIASES = {
  fastfood: { tipBase: "orderBase", tipPerItem: "perItem", xp: "xpPerOrder" },
  fresh: { goldPerCatch: "goldPerGood" },
  boutique: { perScore: "perTagHit", xpPerScore: "xpPerHit" },
};

/** 需要单位换算而非改名的键：F3 记「每 N 件 1 阅历」，视图按「每件多少阅历」累加。 */
const CONVERTERS = {
  fresh: {
    catchesPerXp: (value) => (value > 0 ? { xpPerGood: 1 / value } : null),
  },
};

/** 数组键的最短长度：短于此长度说明 F3 表形状不对，该键退回兜底而不是让视图越界。 */
const MIN_LENGTH = {
  fortune: { goldByBless: 4, stopMs: 3 },
};

const PAID_GAMES = new Set(["blindbox", "fortune"]);

/** 付费玩法的返奖率上限（SOTA_RUBRIC B6：期望回报必须低于入场费）。 */
export const RTP_LIMIT = 0.85;

const TIER_LADDER = ["R", "SR", "SSR", "UR"];
const TIER_ICONS = { R: "🧸", SR: "🃏", SSR: "🎎", UR: "👑" };

const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const weightOf = (item) => Math.max(0, num(item?.w));
const goldOf = (item) => Math.max(0, num(item?.gold));
const shardOf = (item) => Math.max(0, num(item?.shard));
const isRareEntry = (item) => shardOf(item) > 0;

function overrideFor(gameId) {
  const table = BALANCE.MINIGAME_PAYOUTS;
  if (!table || typeof table !== "object") return null;
  const entry = table[gameId];
  return entry && typeof entry === "object" ? entry : null;
}

/**
 * 写入一个视图键。DEFAULTS 的键集就是视图契约，schema 外的键一律不落表——
 * 这样 F3 写了个视图不认的键时是「明着没生效」，而不是躺在表里冒充已接管。
 * 值只接受有限数字与够长的数组，坏值继续走兜底，不让视图吃到 NaN 或越界下标。
 */
function assign(target, gameId, key, value) {
  if (!(key in DEFAULTS[gameId])) return false;
  if (typeof value === "number" && Number.isFinite(value)) {
    target[key] = value;
    return true;
  }
  if (Array.isArray(value) && value.length >= (MIN_LENGTH[gameId]?.[key] ?? 1)) {
    target[key] = value;
    return true;
  }
  return false;
}

/**
 * 盲盒奖池归一：F3 的池子只给 id/name/w/gold/shard，视图还要 tier 徽章与图标。
 * 缺档位就按权重从高到低映射到 R→UR 阶梯（越稀有档位越高），缺图标按档位补——
 * 少了这一步，奖池表、手气圆点和结算卡会把字面量 undefined 印给玩家。
 */
export function normalizePool(pool) {
  const clean = (Array.isArray(pool) ? pool : []).filter(
    (item) => item && typeof item === "object" && weightOf(item) > 0,
  );
  if (!clean.length) return [];
  const rank = new Map();
  [...clean].sort((a, b) => weightOf(b) - weightOf(a)).forEach((item, i) => rank.set(item, i));
  return clean.map((item) => {
    const step = Math.floor((rank.get(item) * TIER_LADDER.length) / clean.length);
    const tier =
      typeof item.tier === "string" && item.tier
        ? item.tier
        : TIER_LADDER[Math.min(TIER_LADDER.length - 1, step)];
    return {
      ...item,
      tier,
      icon: item.icon || TIER_ICONS[String(tier).toUpperCase()] || "🎁",
      w: weightOf(item),
      gold: goldOf(item),
      shard: shardOf(item),
    };
  });
}

/**
 * 保底顶替档：权重最高的带碎片档位，即「最低稀有档」。
 * 按权重挑而不是按数组下标挑，这样 F3 重排池子顺序不会悄悄改掉保底价值。
 */
export function pityFloor(pool) {
  let best = null;
  for (const item of pool || []) {
    if (!isRareEntry(item)) continue;
    if (!best || weightOf(item) > weightOf(best)) best = item;
  }
  return best;
}

/** F3 的 fortune.slots 是星象名册（id / name / good），转成视图要的 bless 结构。 */
export function fortuneOmens(slots, fallback = DEFAULTS.fortune.omens) {
  if (!Array.isArray(slots)) return fallback;
  const byId = new Map(fallback.map((omen) => [omen.id, omen]));
  const list = slots
    .filter((slot) => slot && typeof slot === "object" && slot.id)
    .map((slot) => {
      const known = byId.get(String(slot.id));
      return {
        id: String(slot.id),
        name: String(slot.name || known?.name || slot.id),
        icon: slot.icon || known?.icon || "🔮",
        bless: typeof slot.good === "boolean" ? slot.good : Boolean(known?.bless),
      };
    });
  return list.length ? list : fallback;
}

/**
 * 把一份 F3 口径的覆盖表解析成视图口径的赏金表。
 * 顺序：兜底 → 单位换算 → 别名改名 → 同名直给（最具体，最后写）→ 结构归一。
 */
export function resolvePayouts(gameId, override) {
  const base = DEFAULTS[gameId];
  if (!base) return {};
  const merged = { ...base };
  if (gameId === "blindbox") merged.pool = normalizePool(base.pool);

  if (override && typeof override === "object") {
    for (const [key, convert] of Object.entries(CONVERTERS[gameId] || {})) {
      if (!(key in override)) continue;
      const derived = convert(num(override[key]));
      if (!derived) continue;
      for (const [target, value] of Object.entries(derived)) assign(merged, gameId, target, value);
    }
    for (const [key, target] of Object.entries(ALIASES[gameId] || {})) {
      if (key in override) assign(merged, gameId, target, override[key]);
    }
    for (const [key, value] of Object.entries(override)) {
      assign(merged, gameId, key, value);
    }
    if (gameId === "blindbox") merged.pool = normalizePool(merged.pool);
    if (gameId === "fortune" && !Array.isArray(override.omens)) {
      merged.omens = fortuneOmens(override.slots, base.omens);
    }
  }
  return merged;
}

export function poolWeight(pool) {
  return (pool || []).reduce((sum, item) => sum + weightOf(item), 0);
}

/** 按权重抽一项；rand 注入后逻辑可在 Node 里断言。 */
export function pickWeighted(pool, rand = Math.random) {
  const total = poolWeight(pool);
  if (total <= 0) return pool[0];
  let roll = rand() * total;
  for (const item of pool) {
    roll -= weightOf(item);
    if (roll <= 0) return item;
  }
  return pool[pool.length - 1];
}

/**
 * 奖池期望。不传 pity 时是纯单抽期望；传了 pity 给的是含保底的长期稳态期望。
 *
 * 保底把「连续 pity 次非稀有」的最后一次顶成最低稀有档。稳态下保底计数 c 的分布
 * π_c ∝ r^c（r 为非稀有概率），只有 c = pity−1 那一格会触发顶替，于是
 * E[gold] = E[gold·稀有] + (1−π_last)·E[gold·非稀有] + π_last·r·floor.gold。
 * B6 必须按这个口径核，只算单抽会低估返奖率。
 */
export function poolExpectation(pool, pity = 0) {
  const total = poolWeight(pool);
  if (total <= 0) return { gold: 0, shard: 0 };

  let gold = 0;
  let shard = 0;
  let rareP = 0;
  let rareGold = 0;
  let rareShard = 0;
  for (const item of pool) {
    const p = weightOf(item) / total;
    gold += p * goldOf(item);
    shard += p * shardOf(item);
    if (!isRareEntry(item)) continue;
    rareP += p;
    rareGold += p * goldOf(item);
    rareShard += p * shardOf(item);
  }

  const floor = pityFloor(pool);
  const r = 1 - rareP;
  if (!floor || !Number.isFinite(pity) || pity < 1 || r <= 0) return { gold, shard };

  let sum = 0;
  for (let j = 0; j < pity; j += 1) sum += r ** j;
  const last = r ** (pity - 1) / sum;
  const forced = last * r;
  return {
    gold: rareGold + (gold - rareGold) * (1 - last) + forced * goldOf(floor),
    shard: rareShard + (shard - rareShard) * (1 - last) + forced * shardOf(floor),
  };
}

export function chanceOf(pool, item) {
  const total = poolWeight(pool);
  return total > 0 ? (weightOf(item) / total) * 100 : 0;
}

function binomial(n, k) {
  let out = 1;
  for (let i = 0; i < k; i += 1) out = (out * (n - i)) / (i + 1);
  return out;
}

/**
 * 占卜单次起盘的闭式期望：reels 格独立同分布，吉兆数服从 B(reels, p)；
 * 碎片只来自「全吉」（p^reels）与「全同象」（n·(1/n)^reels）两条规则。
 * fortune.js 里 6³ 全枚举的 `expectedSpin()` 必须与本式一致（测试守护）。
 */
export function spinExpectation(table, omens = table?.omens || []) {
  const n = omens.length;
  const reels = Math.max(1, Math.round(num(table?.reels) || DEFAULTS.fortune.reels));
  if (!n) return { gold: 0, shards: 0 };
  const p = omens.filter((omen) => omen.bless).length / n;
  let gold = 0;
  for (let k = 0; k <= reels; k += 1) {
    gold += binomial(reels, k) * p ** k * (1 - p) ** (reels - k) * num(table?.goldByBless?.[k]);
  }
  const shards =
    p ** reels * num(table?.shardAllBless) + (1 / n) ** (reels - 1) * num(table?.shardTriple);
  return { gold, shards };
}

/**
 * B6 体检：付费玩法的长期金币期望必须低于入场费（RTP ≤ RTP_LIMIT）且确实产出碎片。
 * 技巧型玩法不是印钞口，直接判过。
 */
export function auditPayouts(gameId, table) {
  const cfg = table || payouts(gameId);
  if (!PAID_GAMES.has(gameId)) return { gameId, paid: false, ok: true };
  const cost = num(cfg.cost);
  const ev =
    gameId === "blindbox"
      ? poolExpectation(cfg.pool, cfg.pity)
      : spinExpectation(cfg, cfg.omens || []);
  const gold = num(ev.gold);
  const shard = num(ev.shard ?? ev.shards);
  const rtp = cost > 0 ? gold / cost : Infinity;
  const ok = cost > 0 && rtp <= RTP_LIMIT && shard > 0;
  return { gameId, paid: true, ok, cost, gold, shard, rtp, limit: RTP_LIMIT };
}

const CACHE = new Map();

/** 视图入口：F3 表接管后的最终赏金表。越过 B6 红线的覆盖整表退回兜底。 */
export function payouts(gameId) {
  if (!DEFAULTS[gameId]) return {};
  const hit = CACHE.get(gameId);
  if (hit) return hit;
  const merged = resolvePayouts(gameId, overrideFor(gameId));
  const table = auditPayouts(gameId, merged).ok ? merged : resolvePayouts(gameId, null);
  CACHE.set(gameId, table);
  return table;
}

/** 测试用逃生口：清掉记忆化，让下一次 payouts() 重新读 balance.js。 */
export function resetPayouts() {
  CACHE.clear();
}

export { DEFAULTS as PAYOUT_FALLBACK, ALIASES as F3_ALIASES, PAID_GAMES };
