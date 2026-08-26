import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  CURRENT_VERSION,
  KEY,
  CORRUPT_KEY,
  exportSave,
  importSave,
  migrate,
  toSaveData,
  writeSave,
  readSaveData,
  loadCorruptBackup,
  clearSave,
} from "../src/core/save.js";
import {
  ONLINE_GAP_MAX_SEC,
  advanceGoal,
  defaultState,
  fromSaveData,
  grantGold,
  passiveXpPerSec,
  rollNextGoal,
  settle,
  syncUnlocks,
  tick,
  tryLevelUp,
} from "../src/core/state.js";
import * as actions from "../src/core/actions.js";
import {
  OFFLINE_CAP_HOURS,
  PARTNERS_PER_SHOP_MAX,
  PARTNER_LEVEL_MAX,
  SHOP_LEVEL_MAX,
} from "../src/core/limits.js";
import {
  SHOPS,
  PARTNERS,
  OUTFITS,
  PASSIVE_XP,
  RESEARCH_NODES,
  combinePartnerBonuses,
  hireCost,
  offlineGold,
  partnerShopBonus,
  shopUpgradeCost as curveShopUpgradeCost,
} from "../src/data/balance.js";
import { shopBonusMap, totalOnlinePerSec } from "../src/core/economy.js";

/** 最小内存版 localStorage，用来测边界适配器而不引入依赖。 */
function installStorage() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
  return map;
}

/**
 * v1 旧档原文，用字符串常量固化：派生对象入档、缺少后开的店、带瞬态 toast。
 * 不允许用当前代码生成，否则测不出真实迁移。
 */
const LEGACY_V1 = JSON.stringify({
  v: 1,
  savedAt: 1700000000000,
  data: {
    name: "澄澄",
    introDone: true,
    gold: 1234.5,
    goldEarned: 5000,
    xp: 42,
    level: 2,
    shards: 4,
    outfit: {
      hair: { id: "long", name: "旧文案·蜜茶长卷", charm: 3 },
      top: { id: "blazer", name: "旧文案·玫瑰西装", charm: 3 },
      bottom: { id: "skirt", name: "旧文案·百褶短裙", charm: 3 },
      shoes: { id: "heel", name: "旧文案·细闪高跟", charm: 3 },
      acc: { id: "pearl", name: "旧文案·珍珠耳钉", charm: 3 },
    },
    furniture: ["sofa", "ghost-item"],
    shops: {
      fastfood: { unlocked: true, level: 4, staff: 3, auto: true, assignees: ["lin"] },
      fresh: { unlocked: true, level: 2, staff: 1, auto: false, assignees: [] },
    },
    partners: [
      { id: "lin", name: "旧文案·林澄", specialty: "娱乐", owned: true, level: 3, assigned: "fastfood" },
      { id: "su", name: "旧文案·苏晚", specialty: "休闲", owned: false, level: 1, assigned: null },
    ],
    researchDone: ["line-a"],
    lastTick: 1700000000000,
    goal: { target: 600, until: 1700000480000, done: true },
    toast: "<img src=x onerror=alert(1)>",
  },
});

beforeEach(() => {
  installStorage();
});

test("export/import roundtrip", () => {
  const s = defaultState();
  s.name = "澄澄";
  const json = exportSave(s);
  const back = importSave(json);
  assert.equal(back.name, "澄澄");
});

test("reject bad save", () => {
  assert.throws(() => importSave("{}"));
  assert.throws(() => importSave("not json"));
  assert.throws(() => importSave(JSON.stringify({ v: 99, data: {} })));
});

test("migrate v1 envelope", () => {
  const data = migrate({ v: 1, data: { name: "A" } });
  assert.equal(data.name, "A");
  assert.equal(migrate({ v: 2 }), null);
});

test("level up consumes gates", () => {
  const s = defaultState();
  grantGold(s, 800);
  s.goldEarned = 800;
  s.xp = 20;
  assert.equal(tryLevelUp(s), true);
  assert.equal(s.level, 2);
  assert.equal(s.shops.fresh.unlocked, true);
});

test("v1 legacy save migrates and deep fills by registry", () => {
  const data = migrate(JSON.parse(LEGACY_V1));
  const s = fromSaveData(data, 1700000600000);

  assert.equal(s.name, "澄澄");
  assert.equal(s.level, 2);
  assert.equal(s.shards, 4);

  // 派生对象降为 id 后按当前 OUTFITS 重新解析：老档也吃到最新魅力值与文案。
  assert.equal(s.outfit.hair.id, "long");
  assert.equal(s.outfit.hair.charm, OUTFITS.hair.find((i) => i.id === "long").charm);
  assert.equal(s.outfit.hair.name, OUTFITS.hair.find((i) => i.id === "long").name);

  // 伙伴静态部分回到 PARTNERS 当前表，可变部分保留。
  const lin = s.partners.find((p) => p.id === "lin");
  assert.equal(lin.name, PARTNERS.find((p) => p.id === "lin").name);
  assert.equal(lin.specialty, PARTNERS.find((p) => p.id === "lin").specialty);
  assert.equal(lin.level, 3);
  assert.equal(lin.assigned, "fastfood");
  assert.equal(s.partners.length, PARTNERS.length);

  // 老档没有的店（boutique/blindbox/fortune）按 SHOPS 补默认值，不再 TypeError。
  for (const shop of SHOPS) assert.ok(s.shops[shop.id], `${shop.id} 应被回填`);
  assert.equal(s.shops.fastfood.level, 4);
  assert.equal(s.shops.boutique.level, 1);
  assert.equal(s.shops.boutique.unlocked, false);

  assert.deepEqual(s.furniture, ["sofa"]);
  assert.equal(s.toast, "");
});

test("parseable dirty save is sanitized into a playable current state", () => {
  const now = 1_800_000_000_000;
  const dirty = JSON.stringify({
    v: CURRENT_VERSION,
    data: {
      name: 42,
      gold: "not-a-number",
      goldEarned: {},
      xp: [],
      level: -4,
      shards: -9,
      lastTick: "yesterday",
      outfit: { hair: "ghost", top: { id: "blazer", charm: 99999 } },
      furniture: ["sofa", "sofa", "ghost-item", null],
      researchDone: ["line-a", "line-a", "ghost-node"],
      shops: {
        fastfood: { unlocked: "yes", level: 0, staff: 999, auto: 0, assignees: ["ghost"] },
        fresh: null,
      },
      partners: [
        { id: "lin", owned: true, level: 0, assigned: "ghost-shop" },
        { id: "su", owned: false, level: "bad-level", assigned: "fastfood" },
        { id: "ghost", owned: true, level: 999, assigned: "fastfood" },
      ],
      goal: { target: "bad-target", until: null, reward: { gold: -10, xp: -10 } },
      toast: "<script>dirty transient</script>",
    },
  });

  const s = fromSaveData(importSave(dirty), now);
  assert.equal(s.name, "未命名老板");
  assert.equal(s.gold, 40);
  assert.equal(s.goldEarned, 40);
  assert.equal(s.xp, 0);
  assert.equal(s.level, 1);
  assert.equal(s.shards, 0);
  assert.equal(s.lastTick, now);
  assert.equal(s.outfit.hair.id, OUTFITS.hair[0].id);
  assert.equal(s.outfit.top, OUTFITS.top.find((item) => item.id === "blazer"));
  assert.deepEqual(s.furniture, ["sofa"]);
  assert.deepEqual(s.researchDone, ["line-a"]);
  assert.equal(s.shops.fastfood.level, 1);
  assert.equal(s.shops.fastfood.staff, SHOPS.find((shop) => shop.id === "fastfood").staffSlots);
  assert.equal(s.shops.fresh.level, 1);
  assert.equal(s.partners.length, PARTNERS.length);
  assert.equal(s.partners.find((p) => p.id === "lin").assigned, null);
  assert.deepEqual(s.shops.fastfood.assignees, []);
  assert.ok(Number.isFinite(s.goal.target));
  assert.ok(Number.isFinite(totalOnlinePerSec(s)));
  assert.equal(s.toast, "");
});

test("adding a shop to SHOPS cannot break an old save", () => {
  const data = migrate(JSON.parse(LEGACY_V1));
  delete data.shops.fresh;
  const s = fromSaveData(data);
  assert.doesNotThrow(() => syncUnlocks(s));
  assert.equal(s.shops.fresh.level, 1);
  assert.ok(Number.isFinite(totalOnlinePerSec(s)));
});

test("save file stores ids only and drops transients", () => {
  const s = defaultState();
  s.toast = "不该入档";
  s.gold = 10;
  const data = toSaveData(s);

  assert.equal(data.toast, undefined);
  assert.equal(typeof data.outfit.hair, "string");
  assert.equal(data.outfit.hair, OUTFITS.hair[0].id);
  for (const p of data.partners) {
    assert.deepEqual(Object.keys(p).sort(), ["assigned", "id", "level", "owned"]);
  }
  for (const shop of SHOPS) {
    assert.equal(data.shops[shop.id].assignees, undefined);
  }
  assert.equal(JSON.stringify(data).includes("金牌店长"), false);
});

test("writeSave envelope is v2 and reloads through the pipeline", () => {
  const s = defaultState();
  s.name = "小满";
  s.gold = 999;
  assert.equal(writeSave(s), true);
  const envelope = JSON.parse(localStorage.getItem(KEY));
  assert.equal(envelope.v, CURRENT_VERSION);
  const { data, corrupt } = readSaveData();
  assert.equal(corrupt, false);
  assert.equal(data.name, "小满");
  assert.equal(data.gold, 999);
});

test("corrupt save is backed up, never silently dropped", () => {
  localStorage.setItem(KEY, "{ this is not json");
  const { data, corrupt } = readSaveData();
  assert.equal(data, null);
  assert.equal(corrupt, true);
  const backup = loadCorruptBackup();
  assert.equal(backup.raw, "{ this is not json");
  assert.equal(localStorage.getItem(CORRUPT_KEY) !== null, true);

  localStorage.setItem(KEY, JSON.stringify({ v: 77, data: { name: "future" } }));
  const second = readSaveData();
  assert.equal(second.corrupt, true);
  assert.equal(loadCorruptBackup().reason, "migrate-failed");
});

test("clearSave keeps the corrupt backup", () => {
  localStorage.setItem(KEY, "broken");
  readSaveData();
  clearSave();
  assert.equal(localStorage.getItem(KEY), null);
  assert.ok(loadCorruptBackup());
});

test("settle: short gap is billed online, lastTick advances", () => {
  const s = defaultState(1000);
  s.shops.fastfood.auto = true;
  const rate = totalOnlinePerSec(s);
  const r = settle(s, 1000 + 10_000);
  assert.equal(r.mode, "online");
  assert.equal(s.lastTick, 11_000);
  assert.ok(Math.abs(r.gold - rate * 10) < rate * 0.5 + 1);
});

test("settle: long gap uses the 65% offline rate", () => {
  const base = () => {
    const s = defaultState(0);
    s.shops.fastfood.auto = true;
    s.shops.fastfood.staff = 3;
    return s;
  };
  const online = base();
  const offline = base();
  const rate = totalOnlinePerSec(online);
  const hours = 2;
  const ms = hours * 3600_000;

  const r = settle(offline, ms);
  assert.equal(r.mode, "offline");
  const expected = rate * 0.65 * hours * 3600;
  assert.ok(Math.abs(r.gold - expected) / expected < 0.02, `离线到账应为 65% 档：${r.gold}`);
  assert.ok(r.gold < rate * hours * 3600);
  assert.equal(offline.lastTick, ms);
});

test("settle: background throttling does not lose income", () => {
  const make = () => {
    const s = defaultState(0);
    s.shops.fastfood.auto = true;
    s.goal.target = Number.MAX_SAFE_INTEGER;
    return s;
  };
  const smooth = make();
  const throttled = make();
  // 前台每 250ms 一跳 vs 后台被节流成每 5s 一跳，同样 20 秒。
  for (let t = 250; t <= 20_000; t += 250) settle(smooth, t);
  for (let t = 5000; t <= 20_000; t += 5000) settle(throttled, t);
  assert.ok(Math.abs(smooth.gold - throttled.gold) / smooth.gold < 0.01);
  assert.equal(smooth.lastTick, throttled.lastTick);
});

test("settle: clock rollback grants nothing and unfreezes", () => {
  const s = defaultState(10_000);
  s.shops.fastfood.auto = true;
  const gold = s.gold;
  const r = settle(s, 5_000);
  assert.equal(r.mode, "none");
  assert.equal(r.gold, 0);
  assert.equal(s.gold, gold);
  assert.equal(s.lastTick, 5_000);
  assert.equal(settle(s, 6_000).mode, "online");
});

test("settle: the online/offline boundary is ONLINE_GAP_MAX_SEC", () => {
  const a = defaultState(0);
  a.shops.fastfood.auto = true;
  assert.equal(settle(a, ONLINE_GAP_MAX_SEC * 1000).mode, "online");
  const b = defaultState(0);
  b.shops.fastfood.auto = true;
  assert.equal(settle(b, ONLINE_GAP_MAX_SEC * 1000 + 1).mode, "offline");
});

test("settle: offline is capped at 8 hours", () => {
  const make = () => {
    const s = defaultState(0);
    s.shops.fastfood.auto = true;
    s.shops.fastfood.staff = 3;
    return s;
  };
  const justBefore = settle(make(), 8 * 3600_000 - 1000).gold;
  const eight = settle(make(), 8 * 3600_000).gold;
  const longState = make();
  const twenty = settle(longState, 20 * 3600_000);
  assert.ok(justBefore < eight, "8 小时前一秒仍应累计收益");
  assert.equal(eight, twenty.gold, "超出 8 小时不得继续累计收益");
  assert.equal(longState.lastTick, 20 * 3600_000, "封顶不应阻止结算时钟追到当前时间");
});

test("tick does not touch lastTick — settle owns it", () => {
  const s = defaultState(4242);
  tick(s, 1);
  assert.equal(s.lastTick, 4242);
});

test("goal renews after completion instead of sticking at done", () => {
  const s = defaultState(0);
  const first = { ...s.goal };
  s.goldEarned = first.target;
  const gold = s.gold;
  const notes = advanceGoal(s, 1000);

  assert.equal(s.gold, gold + first.reward.gold);
  assert.equal(s.goal.tier, first.tier + 1);
  assert.ok(s.goal.target > s.goldEarned, "新目标必须高于当前累计营收");
  assert.ok(s.goal.until > 1000);
  assert.equal(notes.length, 1);
});

test("goal downgrades and reopens after a timeout", () => {
  const s = defaultState(0);
  s.goal = rollNextGoal(s, 0, false, true);
  s.goal = rollNextGoal(s, 0, false, true);
  const before = s.goal.tier;
  assert.ok(before >= 2);
  const notes = advanceGoal(s, s.goal.until + 1);
  assert.equal(s.goal.tier, before - 1);
  assert.ok(s.goal.until > s.goal.until - 1);
  assert.ok(notes[0].includes("超时"));
});

test("legacy completed goal renews without paying the reward twice", () => {
  const data = migrate(JSON.parse(LEGACY_V1));
  const s = fromSaveData(data, 1700000600000);
  const gold = s.gold;
  advanceGoal(s, 1700000600000);
  assert.equal(s.gold, gold, "老档已发过的奖励不得重复发放");
  assert.ok(s.goal.target > s.goldEarned);
});

test("actions guard spending and return {ok, reason, toast}", () => {
  const s = defaultState();
  s.gold = 0;
  const denied = actions.upgradeShop(s, "fastfood");
  assert.equal(denied.ok, false);
  assert.equal(denied.reason, "insufficient-gold");
  assert.equal(typeof denied.toast, "string");
  assert.equal(s.shops.fastfood.level, 1);

  s.gold = 10_000;
  const done = actions.upgradeShop(s, "fastfood");
  assert.equal(done.ok, true);
  assert.equal(s.shops.fastfood.level, 2);
  assert.equal(s.gold, 10_000 - actions.shopUpgradeCost("fastfood", 1));

  assert.equal(actions.upgradeShop(s, "nope").reason, "unknown-shop");
  assert.equal(actions.upgradeShop(s, "boutique").reason, "locked");
});

test("shop upgrade rejects one coin short and accepts the exact cost", () => {
  const s = defaultState();
  const cost = actions.shopUpgradeCost("fastfood", s.shops.fastfood.level);

  s.gold = cost - 1;
  const denied = actions.upgradeShop(s, "fastfood");
  assert.equal(denied.reason, "insufficient-gold");
  assert.equal(s.gold, cost - 1, "失败时不得扣款");
  assert.equal(s.shops.fastfood.level, 1, "失败时不得升级");

  s.gold = cost;
  const upgraded = actions.upgradeShop(s, "fastfood");
  assert.equal(upgraded.ok, true);
  assert.equal(s.gold, 0, "精确金额应全部扣清");
  assert.equal(s.shops.fastfood.level, 2);
});

test("hiring fills slots then flips the shop to auto", () => {
  const s = defaultState();
  s.gold = 1e6;
  const slots = SHOPS.find((x) => x.id === "fastfood").staffSlots;
  for (let i = 0; i < slots; i += 1) assert.equal(actions.hireStaff(s, "fastfood").ok, true);
  assert.equal(s.shops.fastfood.auto, true);
  assert.equal(actions.hireStaff(s, "fastfood").reason, "slots-full");
});

test("partner actions respect shards and ownership", () => {
  const s = defaultState();
  s.shards = 2;
  assert.equal(actions.signPartner(s, "su").reason, "insufficient-shards");
  s.shards = 3;
  assert.equal(actions.signPartner(s, "su").ok, true);
  assert.equal(s.shards, 0);
  assert.equal(actions.signPartner(s, "su").reason, "owned");
  assert.equal(actions.signPartner(s, "ghost").reason, "unknown-partner");

  assert.equal(actions.assignPartner(s, "su", "fresh").reason, "locked");
  assert.equal(actions.assignPartner(s, "su", "fastfood").ok, true);
  assert.deepEqual(s.shops.fastfood.assignees.sort(), ["lin", "su"]);
});

test("assignment lives only on the partner, assignees is derived", () => {
  const s = defaultState();
  s.shops.fastfood.assignees = ["ghost", "ghost", "ghost"];
  syncUnlocks(s);
  assert.deepEqual(s.shops.fastfood.assignees, ["lin"]);
  const rate = totalOnlinePerSec(s);
  s.shops.fastfood.assignees = [];
  assert.equal(totalOnlinePerSec(s), rate, "收益只认 partner.assigned");
});

test("unowned and specialty-mismatched partners cannot leak a matching bonus", () => {
  const s = defaultState();
  const lin = s.partners.find((p) => p.id === "lin");
  const su = s.partners.find((p) => p.id === "su");

  const matchedRate = totalOnlinePerSec(s);
  lin.assigned = null;
  su.assigned = "fastfood";
  su.owned = false;
  s.shops.fastfood.assignees = ["su", "ghost"];
  syncUnlocks(s);
  const noPartnerRate = totalOnlinePerSec(s);
  assert.deepEqual(s.shops.fastfood.assignees, []);

  su.owned = true;
  syncUnlocks(s);
  const mismatchedRate = totalOnlinePerSec(s);
  assert.deepEqual(s.shops.fastfood.assignees, ["su"]);
  assert.ok(mismatchedRate > noPartnerRate, "已签约错配伙伴仍应提供基础驻店加成");
  assert.ok(mismatchedRate < matchedRate, "错配伙伴不得获得特长匹配加成");
});

test("importState swaps the live state object in place", () => {
  const donor = defaultState();
  donor.name = "被导入的老板";
  donor.gold = 777;
  donor.introDone = true;
  const json = exportSave(donor);

  const live = defaultState();
  const ref = live;
  assert.equal(actions.importState(live, json).ok, true);
  assert.equal(ref.name, "被导入的老板");
  assert.equal(ref.gold, 777);
  assert.equal(actions.importState(live, "garbage").reason, "invalid-save");
});

test("importing a v1 export still works", () => {
  const data = importSave(LEGACY_V1);
  const s = fromSaveData(data);
  assert.equal(s.name, "澄澄");
  assert.equal(s.shops.fastfood.level, 4);
});

test("settle refuses a non-finite now and leaves lastTick/gold untouched", () => {
  for (const bad of [NaN, Infinity, -Infinity, "later", null]) {
    const s = defaultState(10_000);
    s.shops.fastfood.auto = true;
    const gold = s.gold;
    const r = settle(s, bad);
    assert.equal(r.mode, "none", `now=${String(bad)} 不得进入计酬分支`);
    assert.equal(r.gold, 0);
    assert.equal(r.hours, 0);
    assert.deepEqual(r.notes, []);
    assert.equal(s.gold, gold, "坏时间不得改账");
    assert.equal(s.lastTick, 10_000, "坏时间不得污染 lastTick");
    // 被坏调用打过一次之后，正常结算仍然照常工作（不冻结账目）。
    assert.equal(settle(s, 11_000).mode, "online");
    assert.equal(s.lastTick, 11_000);
  }
});

test("shop and partner levels are capped, so output and cost never reach Infinity", () => {
  const wild = defaultState(0);
  for (const shop of SHOPS) {
    Object.assign(wild.shops[shop.id], {
      unlocked: true,
      auto: true,
      staff: shop.staffSlots,
      level: Number.MAX_SAFE_INTEGER,
    });
  }
  for (const p of wild.partners) {
    p.owned = true;
    p.level = Number.MAX_SAFE_INTEGER;
  }
  assert.ok(Number.isFinite(totalOnlinePerSec(wild)), "满级溢出的存档不得算出 Infinity 收入");

  const s = fromSaveData(toSaveData(wild), 0);
  assert.equal(s.shops.fastfood.level, SHOP_LEVEL_MAX, "读档必须把越界等级钳回帽内");
  assert.equal(s.partners.find((p) => p.id === "lin").level, PARTNER_LEVEL_MAX);

  s.gold = Number.MAX_SAFE_INTEGER;
  assert.equal(actions.upgradeShop(s, "fastfood").reason, "level-max");
  assert.equal(s.shops.fastfood.level, SHOP_LEVEL_MAX, "满级失败不得再加一级");
  assert.equal(s.gold, Number.MAX_SAFE_INTEGER, "满级失败不得扣钱");
  assert.equal(actions.trainPartner(s, "lin").reason, "level-max");

  for (const shop of SHOPS) {
    assert.ok(Number.isFinite(actions.shopUpgradeCost(shop.id, Number.MAX_SAFE_INTEGER)));
    assert.ok(Number.isFinite(actions.shopHireCost(shop, shop.staffSlots)));
  }
  assert.ok(Number.isFinite(actions.partnerTrainCost(Number.MAX_SAFE_INTEGER)));
});

test("action costs read the balance curve for the actual shop", () => {
  for (const shop of SHOPS) {
    assert.equal(actions.shopUpgradeCost(shop.id, 3), curveShopUpgradeCost(shop, 3));
    assert.equal(actions.shopHireCost(shop, 1), hireCost(shop, 1));
  }
  // 后期店不再共用前期店的价目表（ECONOMY §5.1）
  assert.ok(actions.shopUpgradeCost("fortune", 1) > actions.shopUpgradeCost("fastfood", 1));
});

test("tick accrues passive xp so an idle save cannot stall at an xp gate", () => {
  const s = defaultState(0);
  s.goal.target = Number.MAX_SAFE_INTEGER;
  tick(s, 60, 0);
  assert.ok(Math.abs(s.xp - passiveXpPerSec(1) * 60) < 1e-9, `被动阅历未累计：${s.xp}`);
  assert.ok(passiveXpPerSec(1) > 0);
  assert.equal(passiveXpPerSec(NaN), passiveXpPerSec(1), "坏等级按 Lv.1 处理");
});

test("offline settle accrues discounted passive xp under the same 8h cap", () => {
  const make = () => {
    const s = defaultState(0);
    s.goal.target = Number.MAX_SAFE_INTEGER;
    return s;
  };
  const twoHours = make();
  settle(twoHours, 2 * 3600_000);
  const expected = passiveXpPerSec(1) * 2 * 3600 * PASSIVE_XP.offlineRate;
  assert.ok(Math.abs(twoHours.xp - expected) < 1e-9, `离线阅历应折减到 ${expected}，实际 ${twoHours.xp}`);
  assert.ok(twoHours.xp < passiveXpPerSec(1) * 2 * 3600, "离线阅历不得高于在线同时长");

  const capped = make();
  settle(capped, OFFLINE_CAP_HOURS * 3600_000);
  const overCapped = make();
  settle(overCapped, 20 * 3600_000);
  assert.equal(overCapped.xp, capped.xp, "超出封顶的离线时长不得继续发阅历");
});

test("core offline cap mirrors the balance offline curve", () => {
  assert.equal(offlineGold(10, OFFLINE_CAP_HOURS + 1, 0), offlineGold(10, OFFLINE_CAP_HOURS, 0));
  assert.ok(offlineGold(10, OFFLINE_CAP_HOURS - 1, 0) < offlineGold(10, OFFLINE_CAP_HOURS, 0));
});

test("buyResearch enforces the prerequisite chain, not just the view", () => {
  const s = defaultState();
  s.gold = 1e9;
  const [first, second] = RESEARCH_NODES;

  const denied = actions.buyResearch(s, second.id);
  assert.equal(denied.reason, "missing-prereq");
  assert.ok(denied.toast.includes(first.name), "前置提示应点名缺的那一条");
  assert.deepEqual(s.researchDone, [], "被拒的研发不得入账");
  assert.equal(s.gold, 1e9, "被拒的研发不得扣钱");

  assert.equal(actions.buyResearch(s, first.id).ok, true);
  assert.equal(actions.buyResearch(s, second.id).ok, true);
  assert.equal(actions.buyResearch(s, first.id).reason, "done");
  assert.equal(actions.buyResearch(s, "ghost-line").reason, "unknown-node");
});

test("a shop takes at most the per-shop partner cap", () => {
  const s = defaultState();
  for (const p of s.partners) p.owned = true;
  const extras = PARTNERS.filter((p) => p.id !== "lin").slice(0, PARTNERS_PER_SHOP_MAX);

  // lin 出厂即驻快餐，再塞到帽上限为止。
  for (const p of extras.slice(0, PARTNERS_PER_SHOP_MAX - 1)) {
    assert.equal(actions.assignPartner(s, p.id, "fastfood").ok, true);
  }
  const overflow = extras[PARTNERS_PER_SHOP_MAX - 1];
  const denied = actions.assignPartner(s, overflow.id, "fastfood");
  assert.equal(denied.reason, "shop-crowded");
  assert.equal(s.partners.find((p) => p.id === overflow.id).assigned, null);
  assert.equal(s.shops.fastfood.assignees.length, PARTNERS_PER_SHOP_MAX);

  // 已经在店里的人重复派驻不算新增；撤回一位后空位立刻可用。
  assert.equal(actions.assignPartner(s, "lin", "fastfood").ok, true);
  assert.equal(actions.assignPartner(s, "lin", null).ok, true);
  assert.equal(actions.assignPartner(s, overflow.id, "fastfood").ok, true);
  assert.equal(s.shops.fastfood.assignees.length, PARTNERS_PER_SHOP_MAX);
});

test("hydration recalls partners parked beyond the per-shop cap", () => {
  const data = toSaveData(defaultState(0));
  for (const p of data.partners) {
    p.owned = true;
    p.assigned = "fastfood";
  }
  const s = fromSaveData(data, 0);
  const parked = s.partners.filter((p) => p.assigned === "fastfood");
  assert.equal(parked.length, PARTNERS_PER_SHOP_MAX, "手改存档不得绕过人数帽");
  assert.deepEqual(
    s.shops.fastfood.assignees,
    parked.map((p) => p.id),
  );
  assert.ok(Number.isFinite(totalOnlinePerSec(s)));
});

test("stacked partner bonuses go through the decay curve instead of summing", () => {
  const s = defaultState();
  const su = s.partners.find((p) => p.id === "su");
  su.owned = true;
  su.assigned = "fastfood";
  syncUnlocks(s);

  const fastfood = SHOPS.find((x) => x.id === "fastfood");
  const each = [
    partnerShopBonus("休闲", fastfood.specialty, 1),
    partnerShopBonus("购物", fastfood.specialty, 1),
  ];
  const bonus = shopBonusMap(s.partners).fastfood;
  assert.ok(Math.abs(bonus - combinePartnerBonuses(each)) < 1e-12, "economy 必须复用衰减合并");
  assert.ok(bonus < each[0] + each[1], "同店叠加不得线性求和");
  assert.ok(bonus > each[0], "第二位伙伴仍应有正贡献");
});

test("a saturated goal stops the loop instead of pumping tiers", () => {
  const s = defaultState(0);
  s.gold = Number.MAX_VALUE;
  s.goldEarned = Number.MAX_VALUE;
  s.goal = { tier: 1, target: Number.MAX_VALUE, until: 60_000, reward: { gold: 1, xp: 1 } };
  const notes = advanceGoal(s, 0);
  assert.ok(notes.length <= 1, `饱和目标一次结算最多发一档，实际 ${notes.length}`);
  assert.ok(Number.isFinite(s.gold), "封顶只封顶，不得溢出成 Infinity");
  assert.ok(s.gold >= Number.MAX_VALUE, "封顶不得让老账缩水");
});
