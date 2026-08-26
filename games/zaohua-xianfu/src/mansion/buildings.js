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
  const lv = Math.max(1, level ?? 1);
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
        maxBuildingLevel: Math.max(1, level ?? 1),
        plots: Math.min(GRID_SIZE * GRID_SIZE, 4 + Math.max(1, level ?? 1) * 2),
      });

/** 洞府仙居自身的等级天花板，与 store 的升级上限一致。 */
export const MANSION_MAX_LEVEL = 12;

/** 产量等级曲线：Lv.1 恰为 1.0，升一级 +0.15。 */
export const LEVEL_BASE = 0.85;
export const LEVEL_STEP = 0.15;

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
  scripture: { role: "study", element: "水", crew: "profession", staff: 1, blurb: "不产资源，只长弟子专业经验" },
  leypulse: { role: "vein", element: "水", crew: "none", staff: 0, blurb: "地脉节点，环绕灵田是最优解" },
};

const DEFAULT_PROFILE = { role: "support", element: "土", crew: "diligent", staff: 1, blurb: "" };

const defCache = new Map();

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
  return LEVEL_BASE + LEVEL_STEP * Math.max(1, level ?? 1);
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

export function unlockLevel(type) {
  return buildingDef(type)?.unlockAt ?? 1;
}

export function isUnlocked(type, mansionLevel = 1) {
  return unlockLevel(type) <= Math.max(1, mansionLevel);
}

/** 该建筑当前可升到的最高等级：洞府自身走硬上限，其余跟随洞府。 */
export function maxLevelFor(type, mansionLevel = 1) {
  if (type === "mansion") return MANSION_MAX_LEVEL;
  return mansionCap(Math.max(1, mansionLevel)).maxBuildingLevel;
}

export function canUpgrade(building, mansionLevel = 1) {
  if (!building) return false;
  const level = Math.max(1, building.level ?? 1);
  return level < maxLevelFor(building.type, mansionLevel);
}

/** 从 fromLevel 升到 toLevel 的累计消耗，用于「一口气升到顶」的预算提示。 */
export function cumulativeUpgradeCost(type, fromLevel, toLevel) {
  const total = { wood: 0, ore: 0, stone: 0 };
  const from = Math.max(1, fromLevel ?? 1);
  const to = Math.max(from, toLevel ?? from);
  for (let lv = from + 1; lv <= to; lv++) {
    for (const [k, v] of Object.entries(upgradeCost(type, lv))) total[k] = (total[k] ?? 0) + v;
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
  const level = Math.max(1, mansionLevel);
  const { resources, buildings, plotsFree } = ctx;
  const cap = mansionCap(level);
  const free = Number.isFinite(plotsFree)
    ? plotsFree
    : cap.plots - (Array.isArray(buildings) ? buildings.length : 0);
  return buildingList()
    .map((def) => {
      const cost = buildCost(def.id);
      const unlocked = isUnlocked(def.id, level);
      const built = Array.isArray(buildings) ? buildings.filter((b) => b.type === def.id).length : 0;
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
