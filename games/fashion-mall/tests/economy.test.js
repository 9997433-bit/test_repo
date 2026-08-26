import { test } from "node:test";
import assert from "node:assert/strict";
import {
  shopRate,
  offlineGold,
  partnerShopBonus,
  nextLevelReady,
  SHOPS,
  MINIGAME_PAYOUTS,
  fastfoodTip,
  freshPayout,
  boutiquePayout,
  blindboxRoll,
  fortuneSpin,
  paidGameExpectation,
  LEVEL_INCOME_GATES,
  LEVEL_XP_GATES,
  FURNITURE,
  GOAL_CURVE,
  goalSpan,
  rollNextGoal,
  passiveXpPerSec,
  shopUpgradeCost,
  hireCost,
  partnerTrainCost,
  furnitureCost,
  combinePartnerBonuses,
} from "../src/data/balance.js";
import { charmOf, furnitureBonus, researchIncome, totalOnlinePerSec } from "../src/core/economy.js";
import { defaultState } from "../src/core/state.js";

test("shopRate grows with level and staff", () => {
  const shop = SHOPS[0];
  const a = shopRate(shop, 1, 0, 0, 0);
  const b = shopRate(shop, 3, 3, 0.6, 20);
  assert.ok(b > a * 2);
});

test("offline gold caps at 8 hours", () => {
  const rate = 10;
  const eight = offlineGold(rate, 8, 0);
  assert.ok(offlineGold(rate, 8 - 1 / 3600, 0) < eight, "封顶前一秒仍应继续累计");
  assert.equal(offlineGold(rate, 8 + 1 / 3600, 0), eight, "封顶后一秒不得多发");
  assert.equal(offlineGold(rate, Number.MAX_VALUE, 0), eight, "超长离线仍只结算 8 小时");
  assert.equal(offlineGold(rate, -1, 0), 0, "回拨时间不得产生负收益");
  assert.ok(offlineGold(10, 1, 0.1) > offlineGold(10, 1, 0));
});

test("partner mismatch never receives the matching specialty bonus", () => {
  for (const level of [1, 2, 10]) {
    const match = partnerShopBonus("休闲", "休闲", level);
    const mismatch = partnerShopBonus("休闲", "丽人", level);
    assert.ok(match > mismatch, `Lv.${level} 错配收益不得等同匹配收益`);
    assert.equal(match / mismatch, 4, `Lv.${level} 特长倍率必须保持一致`);
  }
});

test("level gate needs both gold and xp", () => {
  assert.equal(nextLevelReady(1, 800, 20), true);
  assert.equal(nextLevelReady(1, 799, 20), false);
  assert.equal(nextLevelReady(1, 800, 19), false);
});

test("every level gate accepts exact thresholds and rejects either value one short", () => {
  assert.equal(LEVEL_INCOME_GATES.length, LEVEL_XP_GATES.length);
  for (let level = 1; level < LEVEL_INCOME_GATES.length; level += 1) {
    const gold = LEVEL_INCOME_GATES[level];
    const xp = LEVEL_XP_GATES[level];
    assert.equal(nextLevelReady(level, gold, xp), true, `Lv.${level} 精确门槛应可升级`);
    assert.equal(nextLevelReady(level, gold - 1, xp), false, `Lv.${level} 少 1 营收不得升级`);
    assert.equal(nextLevelReady(level, gold, xp - 1), false, `Lv.${level} 少 1 阅历不得升级`);
  }
  const maxLevel = LEVEL_INCOME_GATES.length;
  assert.equal(nextLevelReady(maxLevel, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER), false);
});

test("charm sums outfit pieces", () => {
  assert.equal(charmOf({ hair: { charm: 8 }, top: { charm: 6 } }), 14);
});

test("default state online rate is positive", () => {
  const s = defaultState();
  s.shops.fastfood.auto = true;
  assert.ok(totalOnlinePerSec(s) > 0);
});

test("furniture and research helpers", () => {
  assert.ok(furnitureBonus(["sofa", "garden"]) > 0.15);
  assert.ok(researchIncome(["line-a"]) === 6);
});

test("paid RNG games have negative gold expectation and carry shards", () => {
  for (const id of ["blindbox", "fortune"]) {
    const ev = paidGameExpectation(id);
    assert.ok(ev.gold < ev.cost * 0.85, `${id} RTP 必须 ≤ 85%，实际期望 ${ev.gold}/${ev.cost}`);
    assert.ok(ev.netGold < 0, `${id} 净期望必须为负`);
    assert.ok(ev.shard > 0, `${id} 必须产出碎片期望`);
  }
});

test("blindbox weights sum to 100 and imported roller follows every derived boundary", () => {
  const { pool } = MINIGAME_PAYOUTS.blindbox;
  const total = pool.reduce((sum, prize) => sum + prize.w, 0);
  assert.equal(total, 100);

  let cumulative = 0;
  for (let i = 0; i < pool.length; i += 1) {
    const prize = pool[i];
    const midpoint = (cumulative + prize.w / 2) / total;
    assert.equal(blindboxRoll(midpoint).id, prize.id, `${prize.id} 权重区间中点应命中自身`);
    cumulative += prize.w;
    if (i + 1 < pool.length) {
      const boundary = cumulative / total;
      assert.equal(blindboxRoll(boundary).id, pool[i + 1].id, `边界 ${boundary} 应进入下一档`);
      assert.equal(
        blindboxRoll((cumulative - 1e-9) / total).id,
        prize.id,
        `边界 ${boundary} 前应留在当前档`,
      );
    }
  }

  const expectation = paidGameExpectation("blindbox");
  const weightedGold = pool.reduce((sum, prize) => sum + prize.w * prize.gold, 0) / total;
  const weightedShard = pool.reduce((sum, prize) => sum + prize.w * prize.shard, 0) / total;
  assert.equal(expectation.gold, weightedGold);
  assert.equal(expectation.shard, weightedShard);
});

test("fortune spin maps rand to slot table uniformly", () => {
  const { slots } = MINIGAME_PAYOUTS.fortune;
  assert.equal(fortuneSpin(0).id, slots[0].id);
  assert.equal(fortuneSpin(0.9999).id, slots[slots.length - 1].id);
  const shardSlots = slots.filter((s) => s.shard > 0);
  assert.ok(shardSlots.length >= 1);
});

test("skill minigame payouts are positive and monotone in score", () => {
  assert.ok(fastfoodTip(4).gold > fastfoodTip(2).gold);
  assert.ok(fastfoodTip(2).xp > 0);
  assert.equal(freshPayout(0).gold, 0);
  assert.equal(freshPayout(0).xp, 0);
  assert.ok(freshPayout(9).gold > freshPayout(3).gold);
  assert.ok(boutiquePayout(6).gold > boutiquePayout(0).gold);
  assert.ok(boutiquePayout(6).xp > boutiquePayout(0).xp);
});

test("rollNextGoal promotes tier on success and demotes on timeout", () => {
  const now = 1_000_000;
  const success = rollNextGoal(
    { level: 2, goldEarned: 5000, goal: { target: 4000, until: now - 1, done: true, tier: 1 } },
    now,
  );
  assert.equal(success.tier, 2);
  assert.ok(success.target > 5000);
  assert.equal(success.until, now + GOAL_CURVE.durationMs);
  assert.equal(success.done, false);
  assert.ok(success.reward.gold > 0 && success.reward.xp > 0);

  const timedOut = rollNextGoal(
    { level: 2, goldEarned: 5000, goal: { target: 9000, until: now - 1, done: false, tier: 1 } },
    now,
  );
  assert.equal(timedOut.tier, 0);
  assert.ok(timedOut.target < success.target);
});

test("goal span scales with level and legacy goals without tier are safe", () => {
  assert.ok(goalSpan(3, 0) > goalSpan(2, 0));
  assert.ok(goalSpan(2, 3) > goalSpan(2, 0));
  // 基线初始档等价：Lv1 tier0 从 40 起步 → 目标 600
  assert.equal(rollNextGoal({ level: 1, goldEarned: 40, goal: null }, 0).target, 600);
  // 旧档 goal 无 tier 字段：完成后按 0→1 档续期，不抛错
  const legacy = rollNextGoal({ level: 1, goldEarned: 640, goal: { target: 600, until: 0, done: true } }, 0);
  assert.equal(legacy.tier, 1);
});

test("passive xp unblocks idle leveling slower than active play", () => {
  for (let l = 1; l < 7; l += 1) assert.ok(passiveXpPerSec(l + 1) > passiveXpPerSec(l));
  // 纯挂机过 Lv1 阅历门控制在 10–30 分钟
  const idleSecondsToL2 = LEVEL_XP_GATES[1] / passiveXpPerSec(1);
  assert.ok(idleSecondsToL2 > 600 && idleSecondsToL2 < 1800);
  // 主动玩法（快餐单 2xp/约9秒）至少比被动快 5 倍
  assert.ok(fastfoodTip(3).xp / 9 > passiveXpPerSec(1) * 5);
});

test("upgrade payback brakes compounding without hitting a wall", () => {
  for (const shop of SHOPS) {
    // 回本时长每级增速 = 成本增速/产出增速。必须 >1.05（否则贪心复投单店
    // 无限滚雪球）且 <1.20（基线 1.229 是 Lv40 回本 32 小时的硬墙）
    const paybackRatio = shopUpgradeCost(shop, 21) / shopUpgradeCost(shop, 20) / shop.growth;
    assert.ok(paybackRatio > 1.05 && paybackRatio < 1.2, `${shop.id} 回本每级 ×${paybackRatio.toFixed(3)}`);
    assert.ok(shopUpgradeCost(shop, 2) > shopUpgradeCost(shop, 1));
    // 成本与店铺体量挂钩：后期店不再共用前期店成本线
    assert.equal(shopUpgradeCost(shop, 1), Math.floor(20 * shop.base));
  }
  assert.ok(hireCost(SHOPS[0], 1) > hireCost(SHOPS[0], 0));
  assert.ok(hireCost(SHOPS[4], 0) > hireCost(SHOPS[0], 0));
  assert.ok(partnerTrainCost(5) > partnerTrainCost(4) * 1.5);
});

test("furniture cost scales with bonus, fixing inverted baseline pricing", () => {
  const sorted = [...FURNITURE].sort((a, b) => a.bonus - b.bonus);
  for (let i = 1; i < sorted.length; i += 1) {
    assert.ok(furnitureCost(sorted[i]) > furnitureCost(sorted[i - 1]));
  }
});

test("stacked partner bonuses have diminishing returns", () => {
  const stacked = combinePartnerBonuses([0.6, 0.6, 0.6]);
  assert.ok(stacked > 0.6 && stacked < 1.8);
  assert.equal(combinePartnerBonuses([]), 0);
  // 顺序无关
  assert.equal(combinePartnerBonuses([0.15, 0.6]), combinePartnerBonuses([0.6, 0.15]));
});
