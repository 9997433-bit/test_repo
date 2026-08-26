import assert from "node:assert/strict";
import { CURRENT_VERSION, importSave, toSaveData } from "../src/core/save.js";
import { defaultState, fromSaveData, settle, tick } from "../src/core/state.js";
import { SHOPS } from "../src/data/balance.js";
import { totalOnlinePerSec } from "../src/core/economy.js";

const NOW = 1_800_000_000_000;

function jsonNumber(_key, value) {
  if (typeof value !== "number" || Number.isFinite(value)) return value;
  if (Number.isNaN(value)) return "NaN";
  return value > 0 ? "Infinity" : "-Infinity";
}

function playable(state) {
  return (
    state &&
    Number.isFinite(state.gold) &&
    Number.isFinite(state.goldEarned) &&
    Number.isFinite(state.lastTick) &&
    Number.isFinite(totalOnlinePerSec(state)) &&
    SHOPS.every((shop) => state.shops?.[shop.id])
  );
}

function probeNaNDelta() {
  const state = defaultState(NOW);
  const before = { gold: state.gold, goldEarned: state.goldEarned };
  const result = tick(state, NaN, NOW);
  const safe =
    state.gold === before.gold &&
    state.goldEarned === before.goldEarned &&
    result.gold === 0 &&
    Number.isFinite(state.gold);
  assert.ok(safe, "NaN tick delta contaminated the account");
  return { name: "nan-tick-delta", status: "guarded", safe, resultGold: result.gold };
}

function probeNaNNow() {
  const state = defaultState(NOW);
  const result = settle(state, NaN);
  const contaminated = [result.gold, result.hours, state.lastTick].some((value) => !Number.isFinite(value));
  return {
    name: "nan-current-time",
    status: contaminated ? "hazard" : "guarded",
    contaminated,
    result: { gold: result.gold, hours: result.hours, mode: result.mode },
    lastTick: state.lastTick,
  };
}

function probeNaNSave() {
  const state = fromSaveData(
    {
      gold: "NaN",
      goldEarned: null,
      xp: {},
      lastTick: "not-a-time",
      shops: { fastfood: { level: "NaN", staff: "NaN" } },
    },
    NOW,
  );
  const safe = playable(state);
  assert.ok(safe, "NaN-like save values survived hydration");
  return {
    name: "nan-save-fields",
    status: "guarded",
    safe,
    normalized: {
      gold: state.gold,
      goldEarned: state.goldEarned,
      lastTick: state.lastTick,
      fastfoodLevel: state.shops.fastfood.level,
    },
  };
}

function probeNegativeTime() {
  const state = defaultState(NOW);
  state.shops.fastfood.auto = true;
  const before = state.gold;
  const negativeTick = tick(state, -3600, NOW);
  const rollback = settle(state, NOW - 3600_000);
  const safe =
    state.gold === before &&
    negativeTick.gold === 0 &&
    rollback.gold === 0 &&
    rollback.hours === 0 &&
    rollback.mode === "none" &&
    state.lastTick === NOW - 3600_000;
  assert.ok(safe, "negative time credited or froze the account");
  return {
    name: "negative-time",
    status: "guarded",
    safe,
    negativeTickGold: negativeTick.gold,
    rollback,
    alignedLastTick: state.lastTick,
  };
}

function probeEmptySave() {
  const absent = fromSaveData(null, NOW);
  const emptyData = importSave(JSON.stringify({ v: CURRENT_VERSION, data: {} }));
  const hydratedEmpty = fromSaveData(emptyData, NOW);
  const serializedEmptyObject = toSaveData({}, NOW);
  const safe = playable(absent) && playable(hydratedEmpty) && serializedEmptyObject.lastTick === NOW;
  assert.ok(safe, "empty save did not recover to a playable state");
  return {
    name: "empty-save",
    status: "guarded",
    safe,
    absentGold: absent.gold,
    importedEmptyGold: hydratedEmpty.gold,
    shopCount: Object.keys(hydratedEmpty.shops).length,
    serializedEmptyLastTick: serializedEmptyObject.lastTick,
  };
}

function probeUnboundedShopLevel() {
  const state = defaultState(NOW);
  for (const shop of SHOPS) {
    Object.assign(state.shops[shop.id], {
      unlocked: true,
      auto: true,
      staff: shop.staffSlots,
      level: Number.MAX_SAFE_INTEGER,
    });
  }
  const onlinePerSec = totalOnlinePerSec(state);
  const overflowed = !Number.isFinite(onlinePerSec);
  return {
    name: "unbounded-shop-level",
    status: overflowed ? "hazard" : "guarded",
    probedLevel: Number.MAX_SAFE_INTEGER,
    onlinePerSec,
    overflowed,
  };
}

function probeSaturatedGoal() {
  const state = defaultState(NOW);
  state.gold = Number.MAX_VALUE;
  state.goldEarned = Number.MAX_VALUE;
  state.goal = {
    tier: 1,
    target: Number.MAX_VALUE,
    until: NOW + 60_000,
    reward: { gold: 1, xp: 0 },
  };
  const result = tick(state, 0, NOW);
  const guardExhausted = result.notes.length === 32 && state.goal.target <= state.goldEarned;
  return {
    name: "saturated-goal-loop",
    status: guardExhausted ? "hazard" : "guarded",
    guardExhausted,
    notificationsInOneTick: result.notes.length,
    goalTierAfterOneTick: state.goal.tier,
    targetAdvancedPastEarnings: state.goal.target > state.goldEarned,
  };
}

const probes = [
  probeNaNDelta(),
  probeNaNNow(),
  probeNaNSave(),
  probeNegativeTime(),
  probeEmptySave(),
  probeUnboundedShopLevel(),
  probeSaturatedGoal(),
];
const report = {
  probes,
  summary: {
    guarded: probes.filter((probe) => probe.status === "guarded").length,
    hazards: probes.filter((probe) => probe.status === "hazard").length,
  },
};

console.log(JSON.stringify(report, jsonNumber, 2));
