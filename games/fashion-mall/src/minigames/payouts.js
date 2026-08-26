import * as BALANCE from "../data/balance.js";

/**
 * 小游戏赏金表。数值主权归 F3：`data/balance.js` 一旦导出 `MINIGAME_PAYOUTS`，
 * 同名键即被整表接管；未导出时用这里的保守兜底表，视图只查表不写死数字。
 *
 * 兜底表的硬约束（见 SOTA_RUBRIC B6）：付费玩法（盲盒、占卜）的金币期望必须
 * 低于入场费，随机产出只承载碎片与惊喜。改这里的权重/赏金请同步跑
 * `expectedDraw()` / `expectedSpin()` 自检。
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
  },
};

function overrideFor(gameId) {
  const table = BALANCE.MINIGAME_PAYOUTS;
  if (!table || typeof table !== "object") return null;
  const entry = table[gameId];
  return entry && typeof entry === "object" ? entry : null;
}

/** 逐键覆盖：只接受有限数字与非空数组，坏值继续走兜底，不让视图吃到 NaN。 */
export function payouts(gameId) {
  const base = DEFAULTS[gameId];
  if (!base) return {};
  const merged = { ...base };
  const override = overrideFor(gameId);
  if (!override) return merged;
  for (const [key, value] of Object.entries(override)) {
    if (typeof value === "number" && Number.isFinite(value)) merged[key] = value;
    else if (Array.isArray(value) && value.length) merged[key] = value;
  }
  return merged;
}

export function poolWeight(pool) {
  return pool.reduce((sum, item) => sum + Math.max(0, Number(item.w) || 0), 0);
}

/** 按权重抽一项；rand 注入后逻辑可在 Node 里断言。 */
export function pickWeighted(pool, rand = Math.random) {
  const total = poolWeight(pool);
  if (total <= 0) return pool[0];
  let roll = rand() * total;
  for (const item of pool) {
    roll -= Math.max(0, Number(item.w) || 0);
    if (roll <= 0) return item;
  }
  return pool[pool.length - 1];
}

/** 单抽期望（不含保底），用于盲盒 UI 公示与期望值自检。 */
export function poolExpectation(pool) {
  const total = poolWeight(pool);
  if (total <= 0) return { gold: 0, shard: 0 };
  let gold = 0;
  let shard = 0;
  for (const item of pool) {
    const p = Math.max(0, Number(item.w) || 0) / total;
    gold += p * (Number(item.gold) || 0);
    shard += p * (Number(item.shard) || 0);
  }
  return { gold, shard };
}

export function chanceOf(pool, item) {
  const total = poolWeight(pool);
  return total > 0 ? (Math.max(0, Number(item.w) || 0) / total) * 100 : 0;
}
