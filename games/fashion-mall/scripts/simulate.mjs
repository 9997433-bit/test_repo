import assert from "node:assert/strict";
import {
  LEVEL_INCOME_GATES,
  MINIGAME_PAYOUTS,
  PARTNERS,
  RESEARCH_NODES,
  SHOPS,
  boutiquePayout,
  fastfoodTip,
  freshPayout,
  paidGameExpectation,
} from "../src/data/balance.js";
import {
  assignPartner,
  hireStaff,
  payFee,
  partnerTrainCost,
  reward,
  shopHireCost,
  shopUpgradeCost,
  signPartner,
  trainPartner,
  upgradeShop,
  buyResearch,
} from "../src/core/actions.js";
import { totalOnlinePerSec } from "../src/core/economy.js";
import { PARTNER_LEVEL_MAX, PARTNERS_PER_SHOP_MAX, SHOP_LEVEL_MAX } from "../src/core/limits.js";
import { defaultState, tick } from "../src/core/state.js";

const START_NOW = 1_800_000_000_000;
const CHECKPOINTS = [3 * 60, 15 * 60, 60 * 60];
const MAX_SECONDS = CHECKPOINTS.at(-1);
const MAX_PLAYER_LEVEL = LEVEL_INCOME_GATES.length;
const PAID_GAME_SECONDS = 4;
const PAID_GAME_SHARE = 0.3;

// ECONOMY.md §7 的机器人上界。空值表示文档没有给出该项的定量参考。
const ECONOMY_REFERENCE = {
  180: {
    active: { levelRange: [3, 3], earnedGold: 45_000, incomePerSec: 462 },
    idle: { levelRange: [3, 3], earnedGold: 24_000, incomePerSec: 320 },
  },
  900: {
    active: { levelRange: [5, 5], earnedGold: 2_920_000, incomePerSec: 7_272 },
    idle: { levelRange: [5, 5], earnedGold: 2_190_000, incomePerSec: 5_639 },
  },
  3600: {
    active: { levelRange: [7, 7], earnedGold: 172_000_000, incomePerSec: 126_000 },
    idle: { levelRange: [7, 7], earnedGold: 61_000_000, incomePerSec: 36_000 },
  },
};

const fastfood = fastfoodTip(3);
const fresh = freshPayout(30);
const boutique = boutiquePayout(4);
const SKILL_PROFILES = [
  { shopId: "fastfood", goldPerSec: fastfood.gold / 9, xpPerSec: fastfood.xp / 9 },
  { shopId: "fresh", goldPerSec: fresh.gold / 21, xpPerSec: fresh.xp / 21 },
  { shopId: "boutique", goldPerSec: boutique.gold / 12, xpPerSec: boutique.xp / 12 },
];

function activeShare(second) {
  if (second <= 3 * 60) return 1;
  if (second <= 15 * 60) return 0.5;
  return 0.25;
}

function reserveMultiplier(second) {
  if (second <= 3 * 60) return 1.2;
  if (second <= 15 * 60) return 2;
  return 3;
}

function applyExpectedActivePlay(state, second, stats) {
  let share = activeShare(second);
  const blindboxOpen = state.shops.blindbox.unlocked;
  const hasUnsignedPartner = state.partners.some((partner) => !partner.owned);

  if (blindboxOpen && hasUnsignedPartner) {
    const config = MINIGAME_PAYOUTS.blindbox;
    const expectation = paidGameExpectation("blindbox");
    const desiredPlays = (share * PAID_GAME_SHARE) / PAID_GAME_SECONDS;
    const plays = Math.min(desiredPlays, state.gold / config.cost);
    if (plays > 0) {
      const paid = payFee(state, config.cost * plays);
      assert.ok(paid.ok, "expected blind-box play could not pay its fee");
      reward(state, { gold: expectation.gold * plays, xp: config.xp * plays });
      state.shards += expectation.shard * plays;
      share -= plays * PAID_GAME_SECONDS;
      stats.paidGames += plays;
    }
  }

  const profile = SKILL_PROFILES.filter(({ shopId }) => state.shops[shopId].unlocked).sort(
    (a, b) => b.goldPerSec - a.goldPerSec,
  )[0];
  if (profile && share > 0) {
    reward(state, {
      gold: profile.goldPerSec * share,
      xp: profile.xpPerSec * share,
    });
    stats.skillSeconds += share;
  }
}

function optimizePartnerAssignments(state) {
  const owned = state.partners.filter((partner) => partner.owned);
  for (const partner of owned) {
    const result = assignPartner(state, partner.id, null);
    assert.ok(result.ok, `could not clear ${partner.id} assignment`);
  }

  for (const partner of owned) {
    let bestShopId = null;
    let bestRate = -Infinity;
    for (const shop of SHOPS) {
      if (!state.shops[shop.id].unlocked) continue;
      const headcount = state.partners.filter(
        (candidate) => candidate.owned && candidate.assigned === shop.id,
      ).length;
      if (headcount >= PARTNERS_PER_SHOP_MAX) continue;
      partner.assigned = shop.id;
      const rate = totalOnlinePerSec(state);
      partner.assigned = null;
      if (rate > bestRate) {
        bestRate = rate;
        bestShopId = shop.id;
      }
    }
    if (bestShopId) {
      const result = assignPartner(state, partner.id, bestShopId);
      assert.ok(result.ok, `could not assign ${partner.id} to ${bestShopId}`);
    }
  }
}

function signAvailablePartners(state) {
  let signed = 0;
  for (const definition of PARTNERS) {
    const partner = state.partners.find((candidate) => candidate.id === definition.id);
    if (partner?.owned || state.shards < 3) continue;
    const usefulNow = SHOPS.some(
      (shop) => state.shops[shop.id].unlocked && shop.specialty === definition.specialty,
    );
    if (!usefulNow) continue;
    const result = signPartner(state, definition.id);
    assert.ok(result.ok, `could not sign ${definition.id}`);
    signed += 1;
  }
  if (signed > 0) optimizePartnerAssignments(state);
  return signed;
}

function rateDelta(state, mutate, restore) {
  const before = totalOnlinePerSec(state);
  mutate();
  const after = totalOnlinePerSec(state);
  restore();
  return Math.max(0, after - before);
}

function investmentCandidates(state) {
  const candidates = [];

  for (const shop of SHOPS) {
    const slot = state.shops[shop.id];
    if (!slot.unlocked) continue;

    if (slot.level < SHOP_LEVEL_MAX) {
      const cost = shopUpgradeCost(shop, slot.level);
      const gain = rateDelta(
        state,
        () => {
          slot.level += 1;
        },
        () => {
          slot.level -= 1;
        },
      );
      candidates.push({
        kind: "shopUpgrade",
        cost,
        gain,
        apply: () => upgradeShop(state, shop.id),
      });
    }

    if (slot.staff < shop.staffSlots) {
      const cost = shopHireCost(shop, slot.staff);
      const previousStaff = slot.staff;
      const previousAuto = slot.auto;
      const gain = rateDelta(
        state,
        () => {
          slot.staff += 1;
          if (slot.staff >= shop.staffSlots) slot.auto = true;
        },
        () => {
          slot.staff = previousStaff;
          slot.auto = previousAuto;
        },
      );
      candidates.push({
        kind: "staffHire",
        cost,
        gain,
        apply: () => hireStaff(state, shop.id),
      });
    }
  }

  const nextResearch = RESEARCH_NODES.find((node) => !state.researchDone.includes(node.id));
  if (nextResearch) {
    const index = RESEARCH_NODES.indexOf(nextResearch);
    const prereqDone = index === 0 || state.researchDone.includes(RESEARCH_NODES[index - 1].id);
    if (prereqDone) {
      candidates.push({
        kind: "research",
        cost: nextResearch.cost,
        gain: nextResearch.income,
        apply: () => buyResearch(state, nextResearch.id),
      });
    }
  }

  for (const partner of state.partners) {
    if (!partner.owned || !partner.assigned || partner.level >= PARTNER_LEVEL_MAX) continue;
    const cost = partnerTrainCost(partner.level);
    const previousLevel = partner.level;
    const gain = rateDelta(
      state,
      () => {
        partner.level += 1;
      },
      () => {
        partner.level = previousLevel;
      },
    );
    candidates.push({
      kind: "partnerTraining",
      cost,
      gain,
      apply: () => trainPartner(state, partner.id),
    });
  }

  return candidates.filter(({ cost, gain }) => cost > 0 && gain > 0 && Number.isFinite(gain));
}

function reinvest(state, second, stats) {
  const buffer = reserveMultiplier(second);
  for (let guard = 0; guard < 64; guard += 1) {
    const candidate = investmentCandidates(state)
      .filter(({ cost }) => state.gold >= cost * buffer)
      .sort((a, b) => b.gain / b.cost - a.gain / a.cost)[0];
    if (!candidate) break;
    const result = candidate.apply();
    assert.ok(result.ok, `${candidate.kind} investment failed: ${result.reason}`);
    stats.investments[candidate.kind] += 1;
  }
}

function checkpoint(state, second, stats) {
  return {
    分钟: second / 60,
    等级: state.level,
    累计金币: Math.round(state.goldEarned),
    持有金币: Math.round(state.gold),
    收入每秒: Math.round(totalOnlinePerSec(state)),
    阅历: Math.round(state.xp),
    已签伙伴: state.partners.filter((partner) => partner.owned).length,
    完成目标: stats.goalsCompleted,
  };
}

function simulate(mode) {
  const state = defaultState(START_NOW);
  const stats = {
    goalsCompleted: 0,
    paidGames: 0,
    skillSeconds: 0,
    investments: {
      shopUpgrade: 0,
      staffHire: 0,
      research: 0,
      partnerTraining: 0,
    },
  };
  const levelReachedAt = { 1: 0 };
  const checkpoints = [];
  optimizePartnerAssignments(state);

  for (let second = 1; second <= MAX_SECONDS; second += 1) {
    const beforeLevel = state.level;
    const result = tick(state, 1, START_NOW + second * 1000);
    stats.goalsCompleted += result.notes.filter((note) => note.startsWith("限时目标达成")).length;
    if (mode === "active") applyExpectedActivePlay(state, second, stats);
    if (state.level !== beforeLevel) optimizePartnerAssignments(state);
    signAvailablePartners(state);
    reinvest(state, second, stats);

    for (let level = 2; level <= state.level; level += 1) {
      if (levelReachedAt[level] === undefined) levelReachedAt[level] = second;
    }
    if (CHECKPOINTS.includes(second)) checkpoints.push(checkpoint(state, second, stats));
  }

  return {
    checkpoints,
    levelReachedAt,
    stats: {
      ...stats,
      paidGames: Number(stats.paidGames.toFixed(2)),
      skillSeconds: Number(stats.skillSeconds.toFixed(2)),
    },
  };
}

function ratio(actual, expected) {
  return expected === null ? null : Number((actual / expected).toFixed(2));
}

function compare(checkpointValue, reference) {
  const [minimumLevel, maximumLevel] = reference.levelRange;
  return {
    文档等级: minimumLevel === maximumLevel ? minimumLevel : `${minimumLevel}–${maximumLevel}`,
    等级命中: checkpointValue.等级 >= minimumLevel && checkpointValue.等级 <= maximumLevel,
    文档累计金币: reference.earnedGold,
    累计金币倍率: ratio(checkpointValue.累计金币, reference.earnedGold),
    文档收入每秒: reference.incomePerSec,
    收入倍率: ratio(checkpointValue.收入每秒, reference.incomePerSec),
  };
}

function withComparison(result, mode) {
  return result.checkpoints.map((value) => ({
    ...value,
    "ECONOMY.md 对照": compare(value, ECONOMY_REFERENCE[value.分钟 * 60][mode]),
  }));
}

function assertSimulation(result) {
  assert.equal(result.checkpoints.length, CHECKPOINTS.length);
  let previousGold = 0;
  let previousLevel = 1;
  for (const value of result.checkpoints) {
    for (const field of ["累计金币", "持有金币", "收入每秒", "阅历"]) {
      assert.ok(Number.isFinite(value[field]), `${value.分钟}m ${field} is not finite`);
      assert.ok(value[field] >= 0, `${value.分钟}m ${field} is negative`);
    }
    assert.ok(value.累计金币 >= previousGold, "cumulative gold moved backwards");
    assert.ok(value.等级 >= previousLevel, "player level moved backwards");
    assert.ok(value.等级 <= MAX_PLAYER_LEVEL, "player level exceeded the canonical gate count");
    previousGold = value.累计金币;
    previousLevel = value.等级;
  }
}

const active = simulate("active");
const idle = simulate("idle");
assertSimulation(active);
assertSimulation(idle);
assert.ok(
  active.checkpoints.at(-1).累计金币 >= idle.checkpoints.at(-1).累计金币,
  "semi-active play should not earn less cumulative gold than idle play",
);
assert.ok(
  active.checkpoints.at(-1).等级 >= idle.checkpoints.at(-1).等级,
  "semi-active play should not finish below idle play",
);

const report = {
  口径: {
    步长秒: 1,
    半活跃: "前3分钟全程手玩，3–15分钟50%，之后25%；含期望盲盒与每秒贪心复投",
    纯挂机: "零小游戏、每秒贪心复投（ECONOMY.md 的机器人上界，不是无人操作下界）",
    投资现金缓冲倍数: "1.2 / 2 / 3",
    店铺等级帽: SHOP_LEVEL_MAX,
    伙伴等级帽: PARTNER_LEVEL_MAX,
  },
  半活跃: withComparison(active, "active"),
  纯挂机: withComparison(idle, "idle"),
  里程碑: {
    半活跃升到满级分钟:
      active.levelReachedAt[MAX_PLAYER_LEVEL] === undefined
        ? null
        : Number((active.levelReachedAt[MAX_PLAYER_LEVEL] / 60).toFixed(1)),
    纯挂机升到满级分钟:
      idle.levelReachedAt[MAX_PLAYER_LEVEL] === undefined
        ? null
        : Number((idle.levelReachedAt[MAX_PLAYER_LEVEL] / 60).toFixed(1)),
    文档纯挂机升到满级分钟: 38.6,
  },
  投资次数: {
    半活跃: active.stats,
    纯挂机: idle.stats,
  },
};

console.log(JSON.stringify(report, null, 2));
