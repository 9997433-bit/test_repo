import assert from "node:assert/strict";
import {
  FURNITURE,
  LEVEL_INCOME_GATES,
  OUTFITS,
  PARTNERS,
  RESEARCH_NODES,
  SHOPS,
  furnitureCost,
  hireCost,
  partnerTrainCost,
  shopUpgradeCost,
} from "../src/data/balance.js";
import { defaultState, tick } from "../src/core/state.js";
import { furnitureBonus, settleOffline, totalOnlinePerSec } from "../src/core/economy.js";

const FIXED_NOW = 1_800_000_000_000;
const TICK_COUNT = 1_000_000;
const TICK_DT_SEC = 0.25;
const LONG_TICK_DAYS = 365;
// balance.js 没有店铺/伙伴等级上限；Lv.100 仅是可重复比较的“满级”估算口径。
const ESTIMATED_MAX_LEVEL = 100;
const THROUGHPUT_FLOOR = 2_000;

function baselineState() {
  const state = defaultState(FIXED_NOW);
  state.introDone = true;
  state.shops.fastfood.auto = true;
  state.shops.fastfood.staff = 3;
  state.shops.fresh.unlocked = true;
  state.shops.fresh.auto = true;
  // 避免基准期间的目标奖励改变收入，保证每次运行口径一致。
  state.goal = {
    tier: 1,
    target: Number.MAX_VALUE,
    until: Number.MAX_SAFE_INTEGER,
    reward: { gold: 0, xp: 0 },
  };
  return state;
}

function benchmarkTicks() {
  const state = baselineState();
  const t0 = performance.now();
  for (let i = 0; i < TICK_COUNT; i += 1) tick(state, TICK_DT_SEC, FIXED_NOW);
  const elapsedMs = performance.now() - t0;
  const ticksPerSec = Math.round(TICK_COUNT / (elapsedMs / 1000));

  assert.ok(Number.isFinite(state.gold), "long-running ticks produced non-finite gold");
  assert.ok(ticksPerSec >= THROUGHPUT_FLOOR, "tick throughput below probe floor");
  return {
    ticks: TICK_COUNT,
    dtSec: TICK_DT_SEC,
    simulatedHours: Number(((TICK_COUNT * TICK_DT_SEC) / 3600).toFixed(2)),
    elapsedMs: Number(elapsedMs.toFixed(2)),
    ticksPerSec,
    finalGold: Math.floor(state.gold),
  };
}

function probeLongTick() {
  const state = baselineState();
  const seconds = LONG_TICK_DAYS * 24 * 3600;
  const before = state.gold;
  const rate = totalOnlinePerSec(state);
  const result = tick(state, seconds, FIXED_NOW);
  const expected = rate * seconds;
  const relativeError = Math.abs(result.gold - expected) / expected;

  assert.ok(Number.isFinite(result.gold), "long dt tick produced non-finite gold");
  assert.ok(relativeError < 1e-12, "long dt tick lost income");
  return {
    days: LONG_TICK_DAYS,
    seconds,
    creditedGold: Math.floor(state.gold - before),
    relativeError,
  };
}

function probeUltraGold() {
  return [Number.MAX_SAFE_INTEGER, 1e100, Number.MAX_VALUE].map((initialGold) => {
    const state = baselineState();
    state.gold = initialGold;
    state.goldEarned = initialGold;
    state.goal.target = Infinity;
    const before = state.gold;
    tick(state, 3600, FIXED_NOW);

    assert.ok(Number.isFinite(state.gold), `gold became non-finite from ${initialGold}`);
    assert.ok(state.gold >= before, `gold decreased from ${initialGold}`);
    return {
      initialGold,
      afterOneHour: state.gold,
      creditedGold: state.gold - before,
      precisionStalled: state.gold === before,
    };
  });
}

function probeOffline() {
  const state = baselineState();
  const payouts = Object.fromEntries(
    [0, 8, 24].map((hours) => {
      const result = settleOffline(state, FIXED_NOW + hours * 3600_000);
      return [hours, { requestedHours: hours, reportedHours: result.hours, gold: result.gold }];
    }),
  );

  assert.equal(payouts[0].gold, 0, "zero-hour offline settlement paid gold");
  assert.ok(payouts[8].gold > 0, "eight-hour offline settlement paid no gold");
  assert.equal(payouts[24].gold, payouts[8].gold, "offline cap exceeded eight hours");
  return payouts;
}

function maxCharmOutfit() {
  return Object.fromEntries(
    Object.entries(OUTFITS).map(([slot, items]) => [
      slot,
      items.reduce((best, item) => (item.charm > best.charm ? item : best)),
    ]),
  );
}

function maxedMallEstimate() {
  const state = defaultState(FIXED_NOW);
  state.level = LEVEL_INCOME_GATES.length;
  state.outfit = maxCharmOutfit();
  state.furniture = FURNITURE.map((item) => item.id);
  state.researchDone = RESEARCH_NODES.map((node) => node.id);

  for (const shop of SHOPS) {
    Object.assign(state.shops[shop.id], {
      unlocked: true,
      level: ESTIMATED_MAX_LEVEL,
      staff: shop.staffSlots,
      auto: true,
    });
  }

  const specialtyCursor = new Map();
  for (const partner of state.partners) {
    const matching = SHOPS.filter((shop) => shop.specialty === partner.specialty);
    const cursor = specialtyCursor.get(partner.specialty) || 0;
    partner.owned = true;
    partner.level = ESTIMATED_MAX_LEVEL;
    partner.assigned = matching[cursor % matching.length]?.id || SHOPS[cursor % SHOPS.length].id;
    specialtyCursor.set(partner.specialty, cursor + 1);
  }

  let shopAndStaffCost = 0;
  for (const shop of SHOPS) {
    for (let level = 1; level < ESTIMATED_MAX_LEVEL; level += 1) {
      shopAndStaffCost += shopUpgradeCost(shop, level);
    }
    for (let staff = 0; staff < shop.staffSlots; staff += 1) {
      shopAndStaffCost += hireCost(shop, staff);
    }
  }

  let partnerTrainingCost = 0;
  for (const _partner of PARTNERS) {
    for (let level = 1; level < ESTIMATED_MAX_LEVEL; level += 1) {
      partnerTrainingCost += partnerTrainCost(level);
    }
  }
  const furnitureAndResearchCost =
    FURNITURE.reduce((sum, item) => sum + furnitureCost(item), 0) +
    RESEARCH_NODES.reduce((sum, node) => sum + node.cost, 0);
  const estimatedBuildCost = shopAndStaffCost + partnerTrainingCost + furnitureAndResearchCost;
  const onlinePerSec = totalOnlinePerSec(state);
  const offline8h = settleOffline({ ...state, lastTick: FIXED_NOW }, FIXED_NOW + 8 * 3600_000).gold;

  assert.ok(Number.isFinite(estimatedBuildCost), "maxed mall cost overflowed");
  assert.ok(Number.isFinite(onlinePerSec), "maxed mall income overflowed");
  return {
    assumedShopLevel: ESTIMATED_MAX_LEVEL,
    assumedPartnerLevel: ESTIMATED_MAX_LEVEL,
    canonicalLevelCapPresent: false,
    shops: SHOPS.length,
    partners: PARTNERS.length,
    onlinePerSec: Math.floor(onlinePerSec),
    onlinePerDay: Math.floor(onlinePerSec * 86400),
    offlineBonus: furnitureBonus(state.furniture),
    offline8h,
    estimatedBuildCost: Math.floor(estimatedBuildCost),
    simplePaybackDays: Number((estimatedBuildCost / (onlinePerSec * 86400)).toFixed(2)),
  };
}

const report = {
  longRunningTicks: benchmarkTicks(),
  singleLongTick: probeLongTick(),
  ultraGold: probeUltraGold(),
  offline: probeOffline(),
  maxedMallEstimate: maxedMallEstimate(),
};

console.log(JSON.stringify(report, null, 2));
