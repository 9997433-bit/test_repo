import * as table from "../data/buildings.js";

// data/ 是纯数据表，由 data 层维护；此处只做兜底解析，缺字段不应让仙府经营整体崩掉。
const FALLBACK_GRID = 6;
const COST_SCALE = {
  mansion: 1.35,
  field: 1.0,
  woodcut: 1.0,
  quarry: 1.05,
  alchemy: 1.25,
  forge: 1.3,
  array: 1.2,
  scripture: 1.15,
  leypulse: 1.1,
};

function fallbackUpgradeCost(type, level) {
  const lv = normalizeLevel(level);
  const scale = COST_SCALE[type] ?? 1;
  return {
    wood: Math.ceil(8 * scale * lv ** 1.45),
    ore: Math.ceil(6 * scale * lv ** 1.4),
    stone: Math.ceil(12 * scale * lv ** 1.35),
  };
}

export const BUILDING_TYPES = table.BUILDING_TYPES ?? {};
export const GRID_SIZE = Number.isFinite(table.GRID_SIZE) ? table.GRID_SIZE : FALLBACK_GRID;

export const upgradeCost = typeof table.upgradeCost === "function" ? table.upgradeCost : fallbackUpgradeCost;
export const buildCost =
  typeof table.buildCost === "function" ? table.buildCost : (type) => upgradeCost(type, 1);
export const mansionCap =
  typeof table.mansionCap === "function"
    ? table.mansionCap
    : (level) => ({
        maxBuildingLevel: normalizeLevel(level),
        plots: Math.min(GRID_SIZE * GRID_SIZE, 4 + normalizeLevel(level) * 2),
      });

/** 洞府仙居自身的等级天花板，与 store 的升级上限一致。 */
export const MANSION_MAX_LEVEL = 12;

/**
 * 全府等级硬顶。洞府自身 ≤ 12，其余建筑又不得越过洞府（`mansionCap`），
 * 故任何建筑的合法等级都落在 [1, 12]。归一化就地夹住，
 * 篡改档里的 `level: 999` 便无法沿着产量/邻接/修业三条链把数值放大。
 */
export const LEVEL_MAX = MANSION_MAX_LEVEL;

/** 产量等级曲线：Lv.1 恰为 1.0，升一级 +0.15。 */
export const LEVEL_BASE = 0.85;
export const LEVEL_STEP = 0.15;

/** 数据表缺 `xpPerSec` 时，藏经楼一类修业建筑的兜底速率（Lv.1，每秒）。 */
export const DEFAULT_XP_PER_SEC = 0.35;

/**
 * 等级归一：坏档里的 null / NaN / 字符串 / 0 / 负数一律收敛到 1 级，
 * 小数向下取整（等级是整数量纲），越界的大数与 Infinity 一律压回硬顶 `LEVEL_MAX`。
 * 产量、修业、邻接与离线效率都走这里取级，
 * 保证仙府层任何一笔账都只可能按 [1, LEVEL_MAX] 的整数等级结算。
 */
export function normalizeLevel(level) {
  const n = Number(level);
  if (Number.isNaN(n)) return 1;
  if (n >= LEVEL_MAX) return LEVEL_MAX;
  if (!(n > 1)) return 1;
  return Math.floor(n);
}

/**
 * 结算用等级：先归一，再压到「该类型在当前洞府等级下的上限」（架构不变式 2）。
 * 省略 `mansionLevel` 时只做归一——府级未知就别猜，
 * 免得默认值把一座合法的 Lv.5 灵田误压成 Lv.1。
 */
export function effectiveLevel(building, mansionLevel) {
  const level = normalizeLevel(building?.level);
  if (mansionLevel === undefined || mansionLevel === null) return level;
  return Math.min(level, maxLevelFor(building?.type, mansionLevel));
}

/**
 * 仙府侧的建筑画像：五行、职能、驻守弟子看重的资质。
 * 数据表只描述「产什么」，这里描述「怎么经营」。
 */
export const MANSION_PROFILES = {
  mansion: { role: "core", element: "土", crew: "none", staff: 0, blurb: "府基所系，决定全府等级上限与地块数" },
  field: { role: "harvest", element: "木", crew: "diligent", staff: 1, blurb: "灵草之本，最吃灵脉邻接" },
  woodcut: { role: "harvest", element: "木", crew: "diligent", staff: 1, blurb: "伐灵木供营造，勤勉弟子事半功倍" },
  quarry: { role: "harvest", element: "金", crew: "diligent", staff: 1, blurb: "开灵矿供锻造，宜远离灵田争地" },
  alchemy: { role: "craft", element: "火", crew: "force", staff: 1, combat: { atk: 4 }, blurb: "炉火炼丹，全队攻击随等级涨" },
  forge: { role: "craft", element: "火", crew: "force", staff: 1, combat: { atk: 3 }, blurb: "温养法器，火气会燎着邻田" },
  array: { role: "spirit", element: "水", crew: "force", staff: 1, blurb: "聚灵回气，并抬高离线结算效率" },
  scripture: {
    role: "study",
    element: "水",
    crew: "profession",
    staff: 1,
    xpPerSec: DEFAULT_XP_PER_SEC,
    blurb: "不产资源，只出修业；修业满仅代表可晋阶，传功丹药照付",
  },
  leypulse: { role: "vein", element: "水", crew: "none", staff: 0, blurb: "地脉节点，环绕灵田是最优解" },
  spring: { role: "harvest", element: "水", crew: "profession", staff: 1, blurb: "涌泉兼出灵气与灵草，中期回气主力" },
  bounty: { role: "harvest", element: "金", crew: "profession", staff: 1, blurb: "接悬赏换仙玉灵石，礼聘的财源" },
  drill: { role: "craft", element: "火", crew: "profession", staff: 1, combat: { atk: 5 }, blurb: "操演阵法，全队攻击随等级涨" },
};

const DEFAULT_PROFILE = { role: "support", element: "土", crew: "diligent", staff: 1, blurb: "" };

const defCache = new Map();

/** 修业速率以数据表为准，表里没写才回落到仙府画像的兜底值。 */
function xpPerSecOf(raw, profile) {
  const fromTable = Number(raw.xpPerSec);
  if (Number.isFinite(fromTable) && fromTable > 0) return fromTable;
  const fromProfile = Number(profile.xpPerSec);
  return Number.isFinite(fromProfile) && fromProfile > 0 ? fromProfile : 0;
}

/**
 * 取归一化后的建筑定义：数据表字段 + 仙府画像，缺省值补齐。
 * 产量循环每 tick 都会调用，故做了缓存。
 */
export function buildingDef(type) {
  if (defCache.has(type)) return defCache.get(type);
  const raw = BUILDING_TYPES[type];
  if (!raw) {
    defCache.set(type, null);
    return null;
  }
  const profile = { ...DEFAULT_PROFILE, ...(MANSION_PROFILES[type] ?? {}) };
  const def = Object.freeze({
    ...raw,
    id: raw.id ?? type,
    name: raw.name ?? type,
    glyph: raw.glyph ?? "府",
    desc: raw.desc ?? profile.blurb,
    baseYield: raw.baseYield ?? {},
    xpPerSec: xpPerSecOf(raw, profile),
    unlockAt: Math.max(1, raw.unlockAt ?? 1),
    unique: Boolean(raw.unique),
    combatBonus: raw.combatBonus ?? profile.combat ?? null,
    role: profile.role,
    element: profile.element,
    crew: profile.crew,
    staff: profile.staff,
    blurb: profile.blurb,
  });
  defCache.set(type, def);
  return def;
}

export function buildingName(type) {
  return buildingDef(type)?.name ?? String(type ?? "");
}

export function buildingList() {
  return Object.keys(BUILDING_TYPES)
    .map((id) => buildingDef(id))
    .filter(Boolean);
}

export function levelScale(level) {
  return LEVEL_BASE + LEVEL_STEP * normalizeLevel(level);
}

/** 单座建筑在指定等级下的裸产量（不含弟子、邻接与府邸光环）。 */
export function yieldAt(type, level = 1) {
  const def = buildingDef(type);
  if (!def) return {};
  const mul = levelScale(level);
  const out = {};
  for (const [k, v] of Object.entries(def.baseYield)) out[k] = v * mul;
  return out;
}

/** 该建筑是否有资源产出；藏经楼这类只出修业的建筑在此为 false。 */
export function producesResources(type) {
  return Object.keys(buildingDef(type)?.baseYield ?? {}).length > 0;
}

/**
 * 单座建筑每秒产出的修业（专业经验）。
 * 曲线刻意与资源不同：修业按楼级线性（Lv.N = xpPerSec × N），不走 `levelScale`，
 * 也不吃邻接与府邸光环——修业是纯时间投入，不该被布局乘区二次放大。
 */
export function xpAt(type, level = 1) {
  const rate = buildingDef(type)?.xpPerSec ?? 0;
  return rate > 0 ? rate * normalizeLevel(level) : 0;
}

/** 该建筑是否产修业。 */
export function producesXp(type) {
  return (buildingDef(type)?.xpPerSec ?? 0) > 0;
}

export function unlockLevel(type) {
  return buildingDef(type)?.unlockAt ?? 1;
}

export function isUnlocked(type, mansionLevel = 1) {
  return unlockLevel(type) <= normalizeLevel(mansionLevel);
}

/** 该建筑当前可升到的最高等级：洞府自身走硬上限，其余跟随洞府，且都不超过 `LEVEL_MAX`。 */
export function maxLevelFor(type, mansionLevel = 1) {
  if (type === "mansion") return MANSION_MAX_LEVEL;
  const cap = Math.floor(Number(mansionCap(normalizeLevel(mansionLevel))?.maxBuildingLevel));
  if (!Number.isFinite(cap)) return 1;
  return Math.min(LEVEL_MAX, Math.max(1, cap));
}

export function canUpgrade(building, mansionLevel = 1) {
  if (!building) return false;
  return normalizeLevel(building.level) < maxLevelFor(building.type, mansionLevel);
}

/**
 * 从 fromLevel 升到 toLevel 的累计消耗，用于「一口气升到顶」的预算提示。
 * 两端都走 `normalizeLevel`：既挡住 NaN 起点，也保证循环最多跑 `LEVEL_MAX - 1` 轮，
 * 篡改档给个 `toLevel: 1e9` 不会把界面卡死。
 */
export function cumulativeUpgradeCost(type, fromLevel, toLevel) {
  const total = { wood: 0, ore: 0, stone: 0 };
  const from = normalizeLevel(fromLevel);
  const to = Math.max(from, normalizeLevel(toLevel));
  for (let lv = from + 1; lv <= to; lv++) {
    for (const [k, v] of Object.entries(upgradeCost(type, lv))) {
      const n = Number(v);
      if (Number.isFinite(n)) total[k] = (total[k] ?? 0) + n;
    }
  }
  return total;
}

export function costShortfall(resources, cost) {
  const lack = {};
  for (const [k, v] of Object.entries(cost ?? {})) {
    const gap = v - (resources?.[k] ?? 0);
    if (gap > 0) lack[k] = gap;
  }
  return lack;
}

export function canAfford(resources, cost) {
  return Object.keys(costShortfall(resources, cost)).length === 0;
}

/**
 * 营造面板用的候选清单：带解锁、预算与拦截原因，UI 不必再复算规则。
 */
export function catalog(mansionLevel = 1, ctx = {}) {
  const level = normalizeLevel(mansionLevel);
  const { resources, buildings, plotsFree } = ctx;
  const list = Array.isArray(buildings) ? buildings.filter(Boolean) : [];
  const cap = mansionCap(level);
  const free = Number.isFinite(plotsFree) ? Math.max(0, plotsFree) : Math.max(0, cap.plots - list.length);
  return buildingList()
    .map((def) => {
      const cost = buildCost(def.id);
      const unlocked = isUnlocked(def.id, level);
      const built = list.filter((b) => b.type === def.id).length;
      const lack = resources ? costShortfall(resources, cost) : {};
      const affordable = Object.keys(lack).length === 0;
      let reason = null;
      if (!unlocked) reason = `洞府 Lv.${def.unlockAt} 解锁`;
      else if (def.unique && built > 0) reason = "全府仅可有一座";
      else if (free <= 0) reason = "地块已满，先升洞府仙居";
      else if (!affordable) reason = "资源不足";
      return {
        id: def.id,
        name: def.name,
        glyph: def.glyph,
        desc: def.desc,
        role: def.role,
        element: def.element,
        perSec: yieldAt(def.id, 1),
        xpPerSec: xpAt(def.id, 1),
        cost,
        lack,
        unlocked,
        built,
        affordable,
        buildable: reason === null,
        reason,
      };
    })
    .sort((a, b) => unlockLevel(a.id) - unlockLevel(b.id) || a.id.localeCompare(b.id));
}
