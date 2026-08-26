/**
 * 图鉴收集与全局攻击加成（Opus-3 所有权）。
 *
 * GDD：图鉴收集度提供全局 0–15% 攻击。四个分类按权重合成收集率：
 * 英雄栏沿用 `store.js` 的扁平 `save.dex`（与 `owned` / 种族科技共享同一份数据），
 * 敌人 / 神器 / 鱼类记在 `save.dexEntries`，两边合起来算收集度。
 *
 * 只有「拥有」计入加成，「见过」仅点亮条目，避免蹭一次遭遇就吃满收益。
 */
import { DEX_MAX_ATK_BONUS, DEX_WEIGHTS, clamp } from "./constants.js";
import { dexTotals, heroDef, isKnownHero } from "./catalog.js";
import {
  DEX_CATEGORIES,
  DEX_OWNED,
  DEX_SEEN,
  EXTRA_DEX_CATEGORIES,
  ensureProgression,
  normalizeDexState,
} from "./save.js";

/** 里程碑仅用于 UI 展示，数值本身是连续的。 */
export const DEX_MILESTONES = [
  { ratio: 0.25, label: "初识禽群" },
  { ratio: 0.5, label: "羽翼渐丰" },
  { ratio: 0.75, label: "博物学者" },
  { ratio: 1, label: "全图鉴" },
];

function categoryOf(category) {
  return DEX_CATEGORIES.includes(category) ? category : "heroes";
}

export function markDexSeen(save, category, id) {
  return writeDex(save, category, id, DEX_SEEN);
}

export function markDexOwned(save, category, id) {
  return writeDex(save, category, id, DEX_OWNED);
}

function writeDex(save, category, id, state) {
  const target = ensureProgression(save);
  if (!id) return target;
  const key = categoryOf(category);

  if (key === "heroes") {
    // 扁平表只有布尔语义；「见过」记在 dexEntries 里，不污染 store.js 的形状。
    if (state >= DEX_OWNED) target.dex[id] = true;
    else if (!target.dex[id]) setEntry(target, "heroesSeen", id, DEX_SEEN);
    return target;
  }

  setEntry(target, key, id, state);
  return target;
}

function setEntry(target, key, id, state) {
  if (!target.dexEntries[key]) target.dexEntries[key] = {};
  const current = normalizeDexState(target.dexEntries[key][id]);
  if (state > current) target.dexEntries[key][id] = state;
}

export function dexStateOf(save, category, id) {
  const target = ensureProgression(save);
  const key = categoryOf(category);
  if (key === "heroes") {
    if (target.dex[id]) return DEX_OWNED;
    return normalizeDexState(target.dexEntries.heroesSeen?.[id]);
  }
  return normalizeDexState(target.dexEntries[key]?.[id]);
}

function countHeroes(save) {
  let owned = 0;
  let seen = 0;
  for (const [id, state] of Object.entries(save.dex ?? {})) {
    if (!normalizeDexState(state)) continue;
    owned += 1;
    seen += 1;
    void id;
  }
  for (const id of Object.keys(save.dexEntries?.heroesSeen ?? {})) {
    if (!save.dex?.[id]) seen += 1;
  }
  return { owned, seen };
}

function countEntries(record) {
  let owned = 0;
  let seen = 0;
  for (const state of Object.values(record ?? {})) {
    const level = normalizeDexState(state);
    if (!level) continue;
    seen += 1;
    if (level >= DEX_OWNED) owned += 1;
  }
  return { owned, seen };
}

/** 分类明细 + 加权收集率。 */
export function dexCompletion(save, totals = dexTotals()) {
  const target = ensureProgression(save);
  const categories = {};
  let weighted = 0;
  let weightSum = 0;

  for (const key of DEX_CATEGORIES) {
    const total = Math.max(1, Math.floor(Number(totals?.[key]) || 1));
    const raw = key === "heroes" ? countHeroes(target) : countEntries(target.dexEntries[key]);
    const owned = Math.min(raw.owned, total);
    const seen = Math.min(raw.seen, total);
    const ratio = owned / total;
    const weight = DEX_WEIGHTS[key] ?? 0;
    categories[key] = { owned, seen, total, ratio };
    weighted += ratio * weight;
    weightSum += weight;
  }

  const ratio = weightSum > 0 ? clamp(weighted / weightSum, 0, 1) : 0;
  return { ratio, categories, totals };
}

/** 全局攻击加成，返回 0–0.15 的小数。 */
export function dexAttackBonus(save, totals = dexTotals()) {
  const { ratio } = dexCompletion(save, totals);
  return round4(clamp(ratio * DEX_MAX_ATK_BONUS, 0, DEX_MAX_ATK_BONUS));
}

/** 面板用：加成 + 收集率 + 下一个里程碑。 */
export function dexSummary(save, totals = dexTotals()) {
  const completion = dexCompletion(save, totals);
  const bonus = round4(clamp(completion.ratio * DEX_MAX_ATK_BONUS, 0, DEX_MAX_ATK_BONUS));
  const next = DEX_MILESTONES.find((m) => completion.ratio < m.ratio) ?? null;
  return {
    ...completion,
    atkBonus: bonus,
    atkBonusPercent: Math.round(bonus * 1000) / 10,
    maxAtkBonus: DEX_MAX_ATK_BONUS,
    nextMilestone: next,
  };
}

/**
 * 种族联盟科技：按扁平图鉴里已拥有的英雄统计，每只 +2%，单种族上限 15%。
 * 公式与 `core/catalog.computeRaceTech` 保持一致，便于主循环直接替换。
 */
export function raceTech(save) {
  const target = ensureProgression(save);
  const byRace = {};
  for (const [id, state] of Object.entries(target.dex ?? {})) {
    if (!normalizeDexState(state) || !isKnownHero(id)) continue;
    const race = heroDef(id)?.race ?? "duck";
    byRace[race] = (byRace[race] ?? 0) + 1;
  }
  const bonus = {};
  for (const [race, n] of Object.entries(byRace)) bonus[race] = Math.min(0.15, n * 0.02);
  return { byRace, bonus };
}

export { EXTRA_DEX_CATEGORIES };

function round4(n) {
  return Math.round(n * 1e4) / 1e4;
}
