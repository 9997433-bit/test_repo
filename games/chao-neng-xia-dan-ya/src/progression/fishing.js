/**
 * 佛系钓鱼 BUFF（Opus-3 所有权）。
 *
 * GDD：3 海域，节奏小游戏钓怪物球，给战斗临时 BUFF（攻 / 暴 / 蛋数）。
 * 节奏小游戏本身住在 `src/modes/fishing.js`（Opus-4），本文件只负责
 * BUFF 的表示、叠加、上限与场次计时。
 *
 * 与 `store.js` 的互操作：存档里既有的 `fishBuff`（单条 `{kind, value, name, battles}`）
 * 继续维护——外部写入的会被 `ingestLegacyBuff()` 吸收进多条 BUFF 列表，
 * 列表里最强的一条又会镜像回 `fishBuff`，因此老 HUD 与新系统同时可用。
 */
import { FISHING_CAPS, clamp } from "./constants.js";
import { ensureProgression } from "./save.js";
import { markDexOwned } from "./dex.js";

export const RARITY_ORDER = ["common", "rare", "epic", "legend"];

/** 海域 id 与 `src/modes/fishing.js` 的 SEAS 对齐，额外加上冒险进度解锁。 */
export const FISHING_WATERS = {
  pond: {
    id: "pond",
    name: "鸭池",
    unlockStage: 1,
    weights: { common: 62, rare: 30, epic: 7, legend: 1 },
  },
  neon_bay: {
    id: "neon_bay",
    name: "霓虹湾",
    unlockStage: 6,
    weights: { common: 40, rare: 40, epic: 17, legend: 3 },
  },
  abyss: {
    id: "abyss",
    name: "深渊灶台",
    unlockStage: 14,
    weights: { common: 22, rare: 40, epic: 30, legend: 8 },
  },
};

/** 前 6 条 id 与 `modes/fishing.js` 的 FISH 表一致，保证渔获可以直接换算。 */
export const FISH_BUFFS = {
  boiled_ball: {
    id: "boiled_ball",
    name: "白煮怪物球",
    water: "pond",
    rarity: "common",
    battles: 3,
    mods: { atk: 0.08 },
  },
  lucky_ball: {
    id: "lucky_ball",
    name: "幸运怪物球",
    water: "pond",
    rarity: "rare",
    battles: 3,
    mods: { crit: 0.12 },
  },
  rubber_duckling: {
    id: "rubber_duckling",
    name: "橡皮鸭仔",
    water: "pond",
    rarity: "common",
    battles: 3,
    mods: { eggPower: 0.05 },
  },
  spicy_ball: {
    id: "spicy_ball",
    name: "香辣怪物球",
    water: "neon_bay",
    rarity: "rare",
    battles: 3,
    mods: { atk: 0.15 },
  },
  golden_ball: {
    id: "golden_ball",
    name: "黄金怪物球",
    water: "neon_bay",
    rarity: "epic",
    battles: 3,
    mods: { crit: 0.2 },
  },
  twin_ball: {
    id: "twin_ball",
    name: "双生怪物球",
    water: "neon_bay",
    rarity: "epic",
    battles: 3,
    mods: { extraEggs: 1 },
  },
  void_eel: {
    id: "void_eel",
    name: "虚空鳗",
    water: "abyss",
    rarity: "rare",
    battles: 2,
    mods: { atk: 0.1 },
  },
  magma_koi: {
    id: "magma_koi",
    name: "岩浆锦鲤",
    water: "abyss",
    rarity: "epic",
    battles: 2,
    mods: { atk: 0.12, eggPower: 0.06 },
  },
  legend_ball: {
    id: "legend_ball",
    name: "传说怪物球",
    water: "abyss",
    rarity: "legend",
    battles: 2,
    mods: { extraEggs: 2, atk: 0.05 },
  },
};

const EMPTY_MODS = { atk: 0, crit: 0, extraEggs: 0, eggPower: 0 };

/** 旧格式 `{kind, value}` → 新格式 mods。 */
export const LEGACY_KIND_TO_MOD = { atk: "atk", crit: "crit", eggs: "extraEggs" };

export function fishDef(fishId) {
  const local = FISH_BUFFS[fishId];
  if (!local) return null;
  return { ...local, mods: { ...EMPTY_MODS, ...local.mods } };
}

export function fishOfWater(waterId) {
  return Object.values(FISH_BUFFS).filter((f) => f.water === waterId);
}

export function isWaterUnlocked(save, waterId) {
  const water = FISHING_WATERS[waterId];
  if (!water) return false;
  const stage = Math.max(1, Math.floor(Number(save?.adventureStage) || 1));
  return stage >= water.unlockStage;
}

/**
 * 节奏小游戏判定 → 抽鱼。
 * `accuracy` 0–1 把权重向高稀有度倾斜，满准度时普通鱼权重砍到 1/4。
 */
export function rollCatch(waterId, { accuracy = 0.5, rng = Math.random } = {}) {
  const water = FISHING_WATERS[waterId];
  if (!water) return null;
  const pool = fishOfWater(waterId);
  if (!pool.length) return null;

  const acc = clamp(accuracy, 0, 1);
  const entries = pool.map((fish) => {
    const tier = Math.max(0, RARITY_ORDER.indexOf(fish.rarity));
    const base = water.weights[fish.rarity] ?? 1;
    const skew = tier === 0 ? 1 - 0.75 * acc : 1 + acc * tier * 0.6;
    return { fish, weight: Math.max(0.01, base * skew) };
  });

  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.fish;
  }
  return entries[entries.length - 1].fish;
}

function makeInstance(target, { id, name, rarity, battles, mods }) {
  const uid = target.fishing.nextId;
  target.fishing.nextId = uid + 1;
  return {
    uid,
    fishId: id,
    name,
    rarity: rarity ?? "common",
    battlesLeft: Math.max(1, Math.floor(Number(battles) || 1)),
    mods: { ...EMPTY_MODS, ...mods },
  };
}

function pushBuff(target, instance) {
  const existing = target.fishing.buffs.find((b) => b.fishId === instance.fishId);
  if (existing) {
    // 同种鱼不叠数值，只续场次，避免刷同一条鱼无限堆攻击。
    existing.battlesLeft = Math.max(existing.battlesLeft, instance.battlesLeft);
    syncLegacyBuff(target);
    return existing;
  }
  target.fishing.buffs.push(instance);
  syncLegacyBuff(target);
  return instance;
}

/** 入账一条鱼：计数 + 点亮图鉴 + 挂上临时 BUFF。 */
export function grantFishingBuff(save, fishId, { battles } = {}) {
  const target = ensureProgression(save);
  const def = fishDef(fishId);
  if (!def) return null;

  target.fishing.caught[fishId] = (target.fishing.caught[fishId] ?? 0) + 1;
  markDexOwned(target, "fish", fishId);
  return pushBuff(target, makeInstance(target, { ...def, battles: battles ?? def.battles }));
}

/**
 * 吸收 `src/modes/fishing.js` 的 `fishReward()` 结果。
 * 同时接受 `{ fish, buff }` 与裸 `{ kind, value, name, battles }`。
 */
export function applyFishReward(save, reward) {
  const target = ensureProgression(save);
  const raw = reward?.buff ?? reward;
  if (!raw) return null;

  const fishId = reward?.fish?.id ?? raw.id ?? raw.fishId;
  if (fishId && FISH_BUFFS[fishId]) return grantFishingBuff(target, fishId, { battles: raw.battles });

  const modKey = LEGACY_KIND_TO_MOD[raw.kind];
  if (!modKey) return null;
  const id = fishId ?? `legacy_${raw.kind}`;
  target.fishing.caught[id] = (target.fishing.caught[id] ?? 0) + 1;
  markDexOwned(target, "fish", id);
  return pushBuff(
    target,
    makeInstance(target, {
      id,
      name: raw.name ?? "怪物球",
      rarity: raw.rarity ?? "common",
      battles: raw.battles ?? 3,
      mods: { [modKey]: Number(raw.value) || 0 },
    }),
  );
}

/** 外部（老代码 / 老存档）直接写的 `save.fishBuff` 会被收进 BUFF 列表。 */
export function ingestLegacyBuff(save) {
  const target = ensureProgression(save);
  const legacy = target.fishBuff;
  if (!legacy || typeof legacy !== "object") return target;
  if (legacy.__src === "progression") return target;
  if (!(Number(legacy.battles) > 0)) {
    target.fishBuff = null;
    return target;
  }
  applyFishReward(target, legacy);
  return target;
}

/** 把最强的一条 BUFF 镜像回 `save.fishBuff`，老 HUD 继续可读。 */
function syncLegacyBuff(target) {
  const active = target.fishing.buffs.filter((b) => b.battlesLeft > 0);
  if (!active.length) {
    target.fishBuff = null;
    return;
  }
  const scored = active
    .map((b) => ({
      buff: b,
      kind: b.mods.extraEggs > 0 ? "eggs" : b.mods.crit > b.mods.atk ? "crit" : "atk",
    }))
    .map((e) => ({ ...e, value: e.kind === "eggs" ? e.buff.mods.extraEggs : e.buff.mods[e.kind] }))
    .sort((a, b) => b.value - a.value);
  const best = scored[0];
  target.fishBuff = {
    __src: "progression",
    kind: best.kind,
    value: best.value,
    name: best.buff.name,
    battles: best.buff.battlesLeft,
  };
}

export function activeFishingBuffs(save) {
  const target = ingestLegacyBuff(save);
  return target.fishing.buffs.filter((b) => b.battlesLeft > 0);
}

/** 合并所有生效 BUFF，逐项夹紧到上限。 */
export function aggregateFishingBuff(save) {
  const total = { ...EMPTY_MODS };
  const sources = [];
  for (const buff of activeFishingBuffs(save)) {
    total.atk += buff.mods.atk ?? 0;
    total.crit += buff.mods.crit ?? 0;
    total.extraEggs += buff.mods.extraEggs ?? 0;
    total.eggPower += buff.mods.eggPower ?? 0;
    sources.push({ fishId: buff.fishId, name: buff.name, battlesLeft: buff.battlesLeft });
  }
  return {
    atk: clamp(round4(total.atk), 0, FISHING_CAPS.atk),
    crit: clamp(round4(total.crit), 0, FISHING_CAPS.crit),
    extraEggs: Math.min(Math.floor(total.extraEggs), FISHING_CAPS.extraEggs),
    eggPower: clamp(round4(total.eggPower), 0, FISHING_CAPS.eggPower),
    sources,
  };
}

/** 一次完整的钓鱼流程：解锁校验 → 抽鱼 → 入账。 */
export function fish(save, waterId, { accuracy = 0.5, rng = Math.random } = {}) {
  const target = ensureProgression(save);
  if (!isWaterUnlocked(target, waterId)) {
    return { ok: false, code: "WATER_LOCKED", reason: "海域尚未解锁" };
  }
  const caught = rollCatch(waterId, { accuracy, rng });
  if (!caught) return { ok: false, code: "EMPTY_WATER", reason: "这片海域空空如也" };
  const buff = grantFishingBuff(target, caught.id);
  return { ok: true, fish: caught, buff, accuracy: clamp(accuracy, 0, 1) };
}

/** 战斗结算时调用：消耗一场，清掉过期 BUFF。返回本次过期列表。 */
export function consumeFishingBuffs(save) {
  const target = ingestLegacyBuff(save);
  const expired = [];
  for (const buff of target.fishing.buffs) {
    buff.battlesLeft -= 1;
    if (buff.battlesLeft <= 0) expired.push(buff);
  }
  target.fishing.buffs = target.fishing.buffs.filter((b) => b.battlesLeft > 0);
  syncLegacyBuff(target);
  return expired;
}

export function clearFishingBuffs(save) {
  const target = ensureProgression(save);
  target.fishing.buffs = [];
  target.fishBuff = null;
  return target;
}

function round4(n) {
  return Math.round(n * 1e4) / 1e4;
}
