/**
 * 桥接层 · 只读投影
 * ------------------------------------------------------------------
 * 权威状态是 `state.js` 的嵌套树（meta / city.buildings{} / people / army …），
 * 而 `ui/hud.js`、`ui/panels.js`、`render/canvas.js` 读的是一份扁平视图。
 * 本文件把前者投影成后者，**不写 state**，所有动作走 `bridge/actions.js`。
 *
 * 三套建筑 id 的对应关系：
 *   权威 id（data/buildings.js）  lumber / coal_mine / iron_mine / warehouse / barracks_inf / tavern
 *   画布 id（render/canvas.js）   lumber / coal      / iron      / storage   / barracks     / recruit
 *   旧存档 id（config.BUILDING_IDS）lumberyard / coalmine / ironmine / warmhouse / barracks
 * 投影里 `key` 一律是权威 id，`layoutKey` 给画布用。
 */
import * as CONFIG from "../config.js";
import {
  ID_ALIASES,
  RESOURCES,
  TICKS_PER_DAY,
  assignedWorkers,
  buildingCost,
  canUpgrade,
  catalogOf,
  clamp,
  dayOfTick,
  defOf,
  housingCapacity,
  maxLevelOf,
  num,
  obj,
  productionOf,
  unlockFurnaceOf,
  warehouseCap,
  workerSlots,
} from "../systems/city.js";
import {
  economyRates,
  garrisonFactor,
  moraleFactor,
  workerFactor,
} from "../systems/economy.js";
import {
  blizzardSeverity,
  climateConfig,
  climateLabel,
  climateOutputFactor,
} from "../systems/climate.js";
import { foodDemand } from "../systems/population.js";
import { FALLBACK_HEROES, findHeroDef, heroPower } from "../systems/heroes.js";
import { FALLBACK_QUESTS, QUEST_STATUS, questProgress } from "../systems/quests.js";

/* ------------------------------------------------------------------ *
 * id 映射
 * ------------------------------------------------------------------ */

/** 权威 id → 画布 CITY_LAYOUT 的 key。 */
export const LAYOUT_KEYS = {
  furnace: "furnace",
  lumber: "lumber",
  hunter: "hunter",
  coal_mine: "coal",
  iron_mine: "iron",
  house: "house",
  warehouse: "storage",
  kitchen: "kitchen",
  clinic: "clinic",
  barracks_inf: "barracks",
  barracks_arch: "barracks_arch",
  barracks_cav: "barracks_cav",
  hospital: "hospital",
  academy: "academy",
  tavern: "recruit",
  wall: "wall",
  embassy: "embassy",
};

/** 画布 key / 旧存档 id → 权威 id。 */
export const CANONICAL_IDS = (() => {
  const out = { ...ID_ALIASES };
  for (const [canonical, layout] of Object.entries(LAYOUT_KEYS)) out[layout] = canonical;
  for (const canonical of Object.keys(LAYOUT_KEYS)) out[canonical] = canonical;
  return out;
})();

/** 任意来源的建筑 id 归一到权威 id。 */
export function canonicalBuildingId(id, catalog) {
  if (typeof id !== "string" || !id) return id;
  const cat = catalogOf(catalog);
  if (cat[id]) return id;
  return CANONICAL_IDS[id] ?? id;
}

/** 权威 id → 画布 key（画布没有的建筑返回 null）。 */
export function layoutKeyOf(id) {
  return LAYOUT_KEYS[id] ?? null;
}

/**
 * 武将 id 同样有两套写法：`data/heroes.js` 用 `liu_bei`，
 * 而 `config.START_HERO_IDS` 与 `systems/heroes.js` 的保底表用 `liubei`。
 * 开局赠送的 `huatuo` 在名录里其实叫 `hua_tuo`，不归一就查不到 def
 * （侧栏只能显示裸 id、战力 0，招募到华佗还会重复入列）。
 * 去掉下划线后比较，即可把两套写法对上。
 */
const heroIdKey = (id) => String(id ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** 任意写法的武将 id 归一到名录里的 id。 */
export function canonicalHeroId(id, heroCatalog) {
  if (typeof id !== "string" || !id) return id;
  const list = Array.isArray(heroCatalog) && heroCatalog.length ? heroCatalog : FALLBACK_HEROES;
  if (list.some((h) => h && h.id === id)) return id;
  const key = heroIdKey(id);
  return list.find((h) => h && heroIdKey(h.id) === key)?.id ?? id;
}

/** 先归一 id 再查 def，查不到返回 null。 */
export function heroDefOf(id, heroCatalog) {
  const list = Array.isArray(heroCatalog) && heroCatalog.length ? heroCatalog : FALLBACK_HEROES;
  return findHeroDef(canonicalHeroId(id, list), list);
}

/** 名录去重：同一人物的两套 id 只保留资料更全的那条。 */
export function dedupeHeroCatalog(list) {
  const out = [];
  const seen = new Map();
  for (const h of Array.isArray(list) ? list : []) {
    if (!h || !h.id) continue;
    const key = heroIdKey(h.id);
    const prev = seen.get(key);
    if (prev === undefined) {
      seen.set(key, out.push(h) - 1);
      continue;
    }
    // 条目字段越多越完整（data/heroes.js 带 growth / skill.value，保底表没有）
    if (Object.keys(h).length > Object.keys(out[prev]).length) out[prev] = h;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 气候 / 燃料 / 收支
 * ------------------------------------------------------------------ */

const RES_NAMES = { food: "肉食", wood: "木材", coal: "煤炭", iron: "精铁" };
const RES_ICONS = { food: "🍖", wood: "🪵", coal: "🪨", iron: "⚙️" };
const CATEGORY_TAGS = { core: "全城热源", resource: "资源产出", civil: "民生", military: "军事" };

function furnaceLevel(state) {
  return Math.max(
    0,
    Math.floor(
      Math.max(num(state?.city?.furnaceLevel, 0), num(state?.city?.buildings?.furnace?.level, 0)),
    ),
  );
}

/** 本 tick 的燃料消耗（优先读 climate.fuelBurn，缺失时按配置估算）。 */
export function fuelBurnPerTick(state, cfg) {
  const c = climateConfig(cfg);
  const climate = obj(state?.climate);
  const level = furnaceLevel(state);
  if (climate.furnaceLit !== true || level <= 0) return { coal: 0, wood: 0 };
  const recorded = obj(climate.fuelBurn);
  const coal = num(recorded.coal, NaN);
  const wood = num(recorded.wood, NaN);
  if (Number.isFinite(coal) && Number.isFinite(wood) && coal + wood > 0) return { coal, wood };
  const intensity = num(climate.blizzardDaysLeft, 0) > 0 ? c.blizzardFuelMult : 1;
  const coalNeed = c.fuelCoalPerTick * level * intensity;
  const woodNeed = c.fuelWoodPerTick * level * intensity;
  const coalUse = Math.min(Math.max(0, num(state?.resources?.coal, 0)), coalNeed);
  const share = coalNeed > 0 ? clamp(1 - coalUse / coalNeed, 0, 1) : 1;
  return { coal: coalUse, wood: woodNeed * share };
}

/** 每日净收支（建筑产出 − 维护 − 口粮 − 燃料），HUD 的 “+x/日” 用这一份。 */
export function perDayRates(state, catalog) {
  const cat = catalogOf(catalog ?? state?.city?.catalog);
  const eco = economyRates(state, cat);
  const burn = fuelBurnPerTick(state);
  const out = {};
  for (const res of RESOURCES) {
    let net = num(eco.net[res], 0);
    if (res === "coal") net -= burn.coal;
    if (res === "wood") net -= burn.wood;
    if (res === "food") net -= foodDemand(state, undefined, cat);
    out[res] = round2(net * TICKS_PER_DAY);
  }
  return out;
}

/** 燃料还能烧几天（>= 99 视为充裕，0 表示已断）。 */
export function fuelDaysLeft(state, catalog) {
  const climate = obj(state?.climate);
  if (climate.furnaceLit !== true || furnaceLevel(state) <= 0) return 0;
  const cat = catalogOf(catalog ?? state?.city?.catalog);
  const eco = economyRates(state, cat);
  const burn = fuelBurnPerTick(state);
  let days = Infinity;
  for (const res of ["coal", "wood"]) {
    const used = num(burn[res], 0);
    if (used <= 1e-9) continue;
    const net = num(eco.net[res], 0) - used;
    if (net >= 0) continue;
    days = Math.min(days, num(state?.resources?.[res], 0) / -net / TICKS_PER_DAY);
  }
  if (!Number.isFinite(days)) return 99;
  return clamp(round2(days), 0, 99);
}

/** 寒潮强度 0~1（画布的雪量 / 霜雾用）。 */
export function blizzardIntensity(state, cfg) {
  const c = climateConfig(cfg);
  const climate = obj(state?.climate);
  const left = num(climate.blizzardDaysLeft, 0);
  if (left <= 0) return 0;
  const total = Math.max(1, num(climate.blizzardTotalDays, c.blizzardDurationDays));
  const done = clamp((total - left) / total, 0, 1);
  const shape = Math.sin(Math.PI * clamp(done, 0.09, 0.91));
  const severity = clamp(blizzardSeverity(state, c) / c.blizzardSeverityMax, 0.5, 1);
  return clamp(0.34 + 0.66 * shape * severity, 0, 1);
}

/** 室外基温（不含火炉与保温）。 */
export function outsideTemp(state, cfg) {
  const c = climateConfig(cfg);
  const day = Math.max(0, Math.floor(num(state?.meta?.day, 1)));
  const seasonal = -Math.min(c.seasonalDropCap, day * c.seasonalDropPerDay);
  const left = num(state?.climate?.blizzardDaysLeft, 0);
  const blizzard = left > 0 ? c.blizzardTempDelta * blizzardSeverity(state, c) : 0;
  return round2(c.baseTemp + seasonal + blizzard);
}

/** 火炉当前供热（fuelEfficiency 为 0 时即熄火）。 */
export function furnaceHeat(state, level, cfg) {
  const c = climateConfig(cfg);
  const climate = obj(state?.climate);
  const lv = Number.isFinite(level) ? level : furnaceLevel(state);
  if (climate.furnaceLit !== true || lv <= 0) return 0;
  return round2(lv * c.furnaceHeatPerLevel * clamp(num(climate.fuelEfficiency, 1), 0, 1));
}

/* ------------------------------------------------------------------ *
 * 建筑
 * ------------------------------------------------------------------ */

/** 某等级下该建筑每日产出（含气候 / 民心 / 驻守 / 在岗系数）。 */
function outputPerDay(state, id, def, level, workers, cat) {
  const prod = productionOf(def);
  const out = {};
  if (!Object.keys(prod).length || level <= 0) return out;
  const factor =
    garrisonFactor(state, id, def) *
    climateOutputFactor(state) *
    moraleFactor(state) *
    workerFactor(def, { level, workers });
  for (const [res, per] of Object.entries(prod)) {
    out[res] = round2(level * num(per, 0) * factor * TICKS_PER_DAY);
  }
  return out;
}

function tagOf(def) {
  const prod = productionOf(def);
  const keys = Object.keys(prod);
  if (keys.length) return `产出 ${keys.map((k) => RES_NAMES[k] || k).join(" / ")}`;
  return CATEGORY_TAGS[def?.category] || "城中设施";
}

function mainOutputOf(def) {
  const keys = Object.keys(productionOf(def));
  if (!keys.length) return tagOf(def);
  return keys.map((k) => `${RES_ICONS[k] || "◆"} ${RES_NAMES[k] || k}`).join(" ");
}

/**
 * 建筑面板用的完整信息（panels.js 的 game.buildingInfo 直接消费）。
 * 只读，不改 state。
 */
export function buildingInfo(state, rawId, catalog) {
  const cat = catalogOf(catalog ?? state?.city?.catalog);
  const id = canonicalBuildingId(rawId, cat);
  const def = defOf(cat, id);
  if (!def) return null;

  const entry = obj(obj(state?.city?.buildings)[id]);
  const level = Math.max(0, Math.floor(num(entry.level, 0)));
  const workers = Math.max(0, Math.floor(num(entry.workers, 0)));
  const furnaceCap = Math.max(1, furnaceLevel(state));
  const hardMax = maxLevelOf(def);
  const maxLevel = id === "furnace" ? hardMax : Math.min(hardMax, furnaceCap);
  const check = canUpgrade(state, id, cat);
  const cost = check.cost ?? buildingCost(def, level + 1);

  const production = outputPerDay(state, id, def, level, workers, cat);
  const nextProduction = outputPerDay(state, id, def, level + 1, Math.max(1, workers), cat);

  const extraGains = [];
  const pop = num(def.population, 0);
  if (pop > 0) {
    const now = housingCapacity(state, cat);
    extraGains.push({ label: "🏠 可容丁口", now, next: now + pop });
  }
  const storage = num(def.storage, 0);
  if (storage > 0) {
    const now = num(warehouseCap(state, cat).food, 0);
    extraGains.push({ label: "📦 储量上限", now, next: now + storage });
  }
  const warmth = num(def.warmth, 0) + num(def.windbreakPerLevel, 0);
  if (warmth > 0) {
    extraGains.push({
      label: "🔥 保温",
      now: round2(warmth * level),
      next: round2(warmth * (level + 1)),
    });
  }
  const slots = num(def.workersPerLevel, 0);
  if (slots > 0) {
    extraGains.push({ label: "👷 工位", now: slots * level, next: slots * (level + 1) });
  }

  const constructing = entry.constructing === true;
  const progress = clamp(num(entry.progress, 0), 0, 1);
  const blockedReason = constructing
    ? `营建中 ${Math.round(progress * 100)}%`
    : check.ok
      ? ""
      : check.text || "";

  return {
    key: id,
    id,
    layoutKey: layoutKeyOf(id),
    name: def.name || id,
    icon: def.icon || "🏚",
    tag: tagOf(def),
    desc: def.desc || "",
    level,
    maxLevel,
    hardMax,
    workers,
    maxWorkers: workerSlots(def, level),
    constructing,
    progress,
    cost,
    production,
    nextProduction,
    extraGains,
    mainOutput: mainOutputOf(def),
    heatUse: round2(warmth * level),
    unlockFurnace: unlockFurnaceOf(def),
    canUpgrade: check.ok,
    blockedReason,
    capReason:
      id === "furnace"
        ? "火炉已达最高等级。"
        : `其余建筑等级不得超过火炉（当前 ${furnaceCap} 级）。`,
  };
}

/** 全部建筑的精简行（HUD / 画布 / 火炉面板消费）。 */
export function projectBuildings(state, catalog) {
  const cat = catalogOf(catalog ?? state?.city?.catalog);
  const furnaceCap = Math.max(1, furnaceLevel(state));
  const rows = [];
  for (const [id, def] of Object.entries(cat)) {
    const entry = obj(obj(state?.city?.buildings)[id]);
    const level = Math.max(0, Math.floor(num(entry.level, 0)));
    const unlocked = unlockFurnaceOf(def) <= furnaceCap;
    rows.push({
      key: id,
      id,
      layoutKey: layoutKeyOf(id),
      name: def.name || id,
      icon: def.icon || "🏚",
      category: def.category || "civil",
      level,
      workers: Math.max(0, Math.floor(num(entry.workers, 0))),
      maxWorkers: workerSlots(def, level),
      constructing: entry.constructing === true,
      progress: clamp(num(entry.progress, 0), 0, 1),
      unlocked,
      // 已建成的、或已解锁可营建的，才画到城里（城池随建造逐步长出来）
      visible: level > 0 || unlocked,
    });
  }
  rows.sort((a, b) => (a.key === "furnace" ? -1 : b.key === "furnace" ? 1 : 0));
  return rows;
}

/* ------------------------------------------------------------------ *
 * 武将 / 日志
 * ------------------------------------------------------------------ */

/** roster → 侧栏 / 招贤面板用的武将数组。 */
export function projectHeroes(state, heroCatalog) {
  const roster = Array.isArray(state?.heroes?.roster) ? state.heroes.roster : [];
  const catalog = Array.isArray(heroCatalog) && heroCatalog.length ? heroCatalog : FALLBACK_HEROES;
  const out = [];
  for (const entry of roster) {
    if (!entry || !entry.id) continue;
    const def = heroDefOf(entry.id, catalog);
    const inst = {
      level: Math.max(1, Math.floor(num(entry.level, 1))),
      stars: Math.max(1, Math.floor(num(entry.stars ?? entry.star, 1))),
    };
    out.push({
      id: entry.id,
      name: def?.name || entry.name || entry.id,
      title: def?.title || "",
      faction: def?.faction || entry.faction || "qun",
      quality: def?.quality || entry.quality || "blue",
      troop: def?.troop || entry.troop || "infantry",
      skill: def?.skill?.name || "",
      skillDesc: def?.skill?.desc || "",
      level: inst.level,
      stars: inst.stars,
      xp: Math.max(0, num(entry.xp, 0)),
      power: def ? heroPower(def, inst) : 0,
      garrisonBuildingId: entry.garrisonBuildingId ?? null,
    });
  }
  return out;
}

/** state.log → 邸报条目（HUD 按 id 判断是否需要重绘）。 */
export function projectLog(state, limit = 60) {
  const log = Array.isArray(state?.log) ? state.log : [];
  const slice = log.slice(-limit);
  return slice.map((e, i) => ({
    id: Number.isFinite(e?.id) ? e.id : i,
    day: Math.max(1, Math.floor(num(e?.day, dayOfTick(num(e?.tick, 0))))),
    text: typeof e?.text === "string" ? e.text : String(e ?? ""),
    kind: typeof e?.level === "string" ? e.level : "info",
  }));
}

/* ------------------------------------------------------------------ *
 * 任务
 * ------------------------------------------------------------------ *
 * 任务托盘（hud.js 的 #quest-tray）与功业簿（panels.js）都读 view.quests。
 * 这里给的是只读投影：进度用 systems/quests.js 的 questProgress 现算，
 * 状态优先信任 state.quests.entries，缺失时按「前置已领 → 达成即可领」推导，
 * 因此对一份刚 createInitialState()、还没跑过 tick 的裸状态也成立。
 */

/** 这些 reward 键有专门语义，其余数值键按资源计（与 systems/quests.js 的发放口径一致）。 */
const RESERVED_REWARD_KEYS = new Set([
  "resources", "tickets", "recruitTickets", "heroXp", "xp", "heroId", "hero", "heroes",
]);

const QUEST_STATUSES = new Set(Object.values(QUEST_STATUS));

/** 奖励 → [{ key, icon, label, value }]，兼容 { resources:{…} } 与扁平两种写法。 */
export function rewardEntries(rewards) {
  const out = [];
  if (!rewards || typeof rewards !== "object") return out;
  const seen = new Set();
  const addRes = (key, raw) => {
    const v = Math.round(num(raw, 0));
    if (v <= 0 || seen.has(key)) return;
    seen.add(key);
    out.push({ key, icon: RES_ICONS[key] || "◆", label: RES_NAMES[key] || key, value: v });
  };
  const bag = obj(rewards.resources);
  for (const key of Object.keys(bag)) addRes(key, bag[key]);
  for (const [key, v] of Object.entries(rewards)) {
    if (!RESERVED_REWARD_KEYS.has(key) && typeof v === "number") addRes(key, v);
  }
  const tickets = Math.round(num(rewards.tickets ?? rewards.recruitTickets, 0));
  if (tickets > 0) out.push({ key: "tickets", icon: "🏮", label: "招募令", value: tickets });
  const xp = Math.round(num(rewards.heroXp ?? rewards.xp, 0));
  if (xp > 0) out.push({ key: "heroXp", icon: "⭑", label: "武将经验", value: xp });
  const heroes = [rewards.heroId, rewards.hero, ...(Array.isArray(rewards.heroes) ? rewards.heroes : [])]
    .filter((h) => typeof h === "string" && h);
  if (heroes.length) out.push({ key: "heroes", icon: "⚑", label: "武将来投", value: heroes.length });
  return out;
}

/** 奖励摘要，托盘一行展示：`🍖 肉食 80 · 🪵 木材 120`。 */
export function rewardSummary(rewards) {
  return rewardEntries(rewards)
    .map((r) => `${r.icon} ${r.label} ${r.value}`)
    .join(" · ");
}

function questCatalogOf(list) {
  if (Array.isArray(list) && list.length) return list;
  const nested = obj(list).quests;
  if (Array.isArray(nested) && nested.length) return nested;
  return FALLBACK_QUESTS;
}

/** data/quests.js 用 next 串主线，反推「前置任务」表，与 unlockAfter 等价。 */
function questPredecessors(list) {
  const map = new Map();
  for (const quest of list) {
    if (!quest?.next) continue;
    for (const id of Array.isArray(quest.next) ? quest.next : [quest.next]) {
      if (id && !map.has(id)) map.set(id, quest.id);
    }
  }
  return map;
}

function safeProgress(state, quest) {
  try {
    const p = questProgress(state, quest);
    return {
      current: num(p?.current, 0),
      target: num(p?.target, 0),
      done: p?.done === true,
      parts: Array.isArray(p?.parts) ? p.parts : [],
    };
  } catch {
    return { current: 0, target: 0, done: false, parts: [] };
  }
}

/** 统一的任务行；两条投影路径（现算 / 复用上游结果）都收敛到这里。 */
function questRow({ id, title, name, desc, status, current, target, parts, rewards, gate }) {
  const st = QUEST_STATUSES.has(status) ? status : QUEST_STATUS.ACTIVE;
  const claimed = st === QUEST_STATUS.CLAIMED;
  const ready = st === QUEST_STATUS.READY;
  const locked = st === QUEST_STATUS.LOCKED;
  const cap = Math.max(0, num(target, 0));
  const cur = locked ? 0 : clamp(num(current, 0), 0, cap > 0 ? cap : Infinity);
  const ratio = ready || claimed ? 1 : cap > 0 ? clamp(cur / cap, 0, 1) : 0;
  const bag = rewards && typeof rewards === "object" ? rewards : {};
  const label = title || name || id;
  return {
    id,
    title: label,
    name: name || label,
    desc: desc || "",
    status: st,
    locked,
    active: st === QUEST_STATUS.ACTIVE,
    ready,
    claimed,
    canClaim: ready,
    current: cur,
    target: cap,
    ratio,
    percent: Math.round(ratio * 100),
    // 对象形态：hud.js 的 normalizeQuest 认 progress.{current,target}，
    // 顶层同时留一份 current/target，只认标量 progress 的旧读法也不会读歪。
    progress: { current: cur, target: cap, ratio, done: ready || claimed },
    requires: Array.isArray(parts) ? parts : [],
    reward: rewardSummary(bag),
    rewards: bag,
    rewardList: rewardEntries(bag),
    unlockAfter: gate ?? null,
  };
}

/** 上游（actions.listQuests / 旧投影）已经算好的任务行，归一到统一形状。 */
function adoptQuestRow(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id ?? raw.key;
  if (!id) return null;
  const prog = raw.progress && typeof raw.progress === "object" ? raw.progress : null;
  const statusRaw = String(raw.status ?? "").toLowerCase();
  const status = QUEST_STATUSES.has(statusRaw)
    ? statusRaw
    : raw.claimed
      ? QUEST_STATUS.CLAIMED
      : raw.ready || raw.done
        ? QUEST_STATUS.READY
        : raw.locked
          ? QUEST_STATUS.LOCKED
          : QUEST_STATUS.ACTIVE;
  return questRow({
    id,
    title: raw.title,
    name: raw.name,
    desc: raw.desc ?? raw.text,
    status,
    current: prog ? prog.current : (raw.current ?? raw.progress),
    target: raw.target ?? prog?.target,
    parts: raw.requires ?? prog?.parts,
    rewards: raw.rewards ?? raw.reward,
    gate: raw.unlockAfter,
  });
}

/**
 * 任务投影。不写 state。
 * @param {object} state 权威状态
 * @param {object} [extras] { quests?: 上游算好的任务行, questCatalog?: 任务表 }
 */
export function projectQuests(state, extras = {}) {
  try {
    if (Array.isArray(extras.quests) && extras.quests.length) {
      return extras.quests.map(adoptQuestRow).filter(Boolean);
    }
    const list = questCatalogOf(extras.questCatalog);
    const q = obj(state?.quests);
    const entries = obj(q.entries);
    const claimedIds = new Set([
      ...(Array.isArray(q.claimed) ? q.claimed : []),
      ...(Array.isArray(q.completed) ? q.completed : []),
    ]);
    const isClaimed = (id) => obj(entries[id]).status === QUEST_STATUS.CLAIMED || claimedIds.has(id);
    const preds = questPredecessors(list);

    const out = [];
    for (const quest of list) {
      if (!quest || !quest.id) continue;
      const prog = safeProgress(state, quest);
      const gate = quest.unlockAfter ?? preds.get(quest.id) ?? null;
      const status = isClaimed(quest.id)
        ? QUEST_STATUS.CLAIMED
        : gate && !isClaimed(gate)
          ? QUEST_STATUS.LOCKED
          : prog.done
            ? QUEST_STATUS.READY
            : QUEST_STATUS.ACTIVE;
      out.push(
        questRow({
          id: quest.id,
          title: quest.title,
          name: quest.name,
          desc: quest.desc ?? quest.text,
          status,
          current: prog.current,
          target: prog.target,
          parts: prog.parts,
          rewards: quest.rewards ?? quest.reward,
          gate,
        }),
      );
    }
    return out;
  } catch (err) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[bridge/view] 任务投影失败：", err?.message || err);
    }
    return [];
  }
}

/** 任务分档计数（托盘徽标 / 功业簿页眉）。 */
export function questCounts(rows) {
  const out = { total: 0, locked: 0, active: 0, ready: 0, claimed: 0 };
  for (const q of Array.isArray(rows) ? rows : []) {
    out.total += 1;
    if (out[q?.status] !== undefined) out[q.status] += 1;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 军
 * ------------------------------------------------------------------ */

/**
 * 三兵种 + 伤兵编成。
 * 伤兵给的是分兵种明细（hud.js 的 readArmy 认对象形态，出征面板据此显示
 * 「步/骑/弓各伤多少」）；权威状态只有标量 wounded 时全部记到步卒名下，
 * 与 actions.js 的 ensureArmy 口径一致。合计另存 woundedTotal。
 */
export function projectArmy(state) {
  const army = obj(state?.army);
  const byType = obj(army.woundedByType);
  const hasByType = ["infantry", "cavalry", "archer"].some((t) => Number.isFinite(num(byType[t], NaN)));
  const scalarWounded = Math.max(0, Math.floor(num(army.wounded, 0)));

  const out = { infantry: 0, cavalry: 0, archer: 0, total: 0, wounded: {}, woundedTotal: 0 };
  for (const t of ["infantry", "cavalry", "archer"]) {
    out[t] = Math.max(0, Math.floor(num(army[t], 0)));
    out.total += out[t];
    const hurt = hasByType
      ? Math.max(0, Math.floor(num(byType[t], 0)))
      : t === "infantry"
        ? scalarWounded
        : 0;
    out.wounded[t] = hurt;
    out.woundedTotal += hurt;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 败亡
 * ------------------------------------------------------------------ */

/**
 * 败亡原因。population.js 会把 flags.gameOver 写成 "morale" / "extinct"，
 * 也可能是布尔 true（读档归一后）。未败亡返回 ""。
 */
export function gameOverReasonOf(state) {
  const flags = obj(state?.flags);
  const flag = flags.gameOver;
  if (!flag) return "";
  const reason = flags.gameOverReason ?? (typeof flag === "string" ? flag : obj(flag).reason);
  const text = typeof reason === "string" ? reason.trim() : "";
  return text || "unknown";
}

/* ------------------------------------------------------------------ *
 * 主投影
 * ------------------------------------------------------------------ */

/** 任何环节抛错都不能白屏，这里给一份最小可渲染的骨架。 */
function emptyView(extras = {}) {
  const zero = { food: 0, wood: 0, coal: 0, iron: 0 };
  return {
    day: 1,
    dayProgress: 0,
    tick: 0,
    paused: true,
    speed: 0,
    cityName: extras.cityName ?? "拾薪城",
    lord: CONFIG.DEFAULT_LORD ?? { name: "流民县令" },
    resources: { ...zero },
    capacity: { ...zero },
    rates: { ...zero },
    temp: 0,
    outsideTemp: 0,
    tempLabel: "—",
    furnaceLit: false,
    furnaceHeat: 0,
    furnaceHeatNext: 0,
    fuelDays: 0,
    fuelMode: "auto",
    morale: 0,
    population: { current: 0, cap: 0, sick: 0, hungry: 0, total: 0, idle: 0, assigned: 0, housing: 0 },
    blizzard: 0,
    blizzardDaysLeft: 0,
    blizzardIn: null,
    blizzardBanner: false,
    blizzardBannerSub: "",
    buildings: [],
    heroes: [],
    troops: 0,
    troopCap: 0,
    army: {
      infantry: 0,
      cavalry: 0,
      archer: 0,
      total: 0,
      wounded: { infantry: 0, cavalry: 0, archer: 0 },
      woundedTotal: 0,
    },
    recruitTickets: 0,
    quests: [],
    questsActive: [],
    questCounts: { total: 0, locked: 0, active: 0, ready: 0, claimed: 0 },
    log: [],
    tech: {},
    stats: {},
    gameOver: false,
    gameOverReason: "",
    villagerCount: 8,
    broken: true,
  };
}

/**
 * 把权威嵌套状态投影成 UI / 渲染层消费的扁平视图。
 *
 * 只依赖 state 与数据表，不碰 DOM，Node 里可直接 import 后调用。
 *
 * @param {object} state createInitialState() 的嵌套状态
 * @param {object} [extras] { catalog, heroCatalog, quests, questCatalog, paused, speed,
 *                            blizzardBanner, blizzardBannerSub, cityName, troopCap }
 */
export function projectView(state, extras = {}) {
  try {
    if (!state || typeof state !== "object") return emptyView(extras);
    const cat = catalogOf(extras.catalog ?? state?.city?.catalog);
    const cfg = climateConfig();

    const climate = obj(state.climate);
    const people = obj(state.people);
    const army = projectArmy(state);
    const meta = obj(state.meta);

    const tick = Math.max(0, Math.floor(num(meta.tick, 0)));
    const day = Math.max(1, Math.floor(num(meta.day, dayOfTick(tick))));
    const level = furnaceLevel(state);
    const lit = climate.furnaceLit === true;

    const pop = Math.max(0, Math.floor(num(people.pop, 0)));
    const sick = Math.max(0, Math.floor(num(people.sick, 0)));
    const assigned = assignedWorkers(state);
    const popCap = housingCapacity(state, cat);

    const troops = army.total;
    const quests = projectQuests(state, extras);
    const gameOverReason = gameOverReasonOf(state);

    return {
      /* 时间 */
      tick,
      day,
      dayProgress: (tick % TICKS_PER_DAY) / TICKS_PER_DAY,
      paused: extras.paused === true,
      speed: num(extras.speed, 1),

      /* 身份 */
      cityName: extras.cityName ?? meta.cityName ?? "拾薪城",
      lord: obj(meta.lord).name ? meta.lord : (CONFIG.DEFAULT_LORD ?? { name: "流民县令" }),

      /* 资源 */
      resources: { ...obj(state.resources) },
      capacity: warehouseCap(state, cat),
      rates: perDayRates(state, cat),

      /* 气候 */
      temp: round2(num(climate.temp, cfg.baseTemp)),
      outsideTemp: outsideTemp(state, cfg),
      tempLabel: climateLabel(state, cfg),
      furnaceLit: lit,
      furnaceHeat: furnaceHeat(state, level, cfg),
      furnaceHeatNext: furnaceHeat(state, level + 1, cfg),
      fuelDays: fuelDaysLeft(state, cat),
      fuelMode: typeof climate.fuelMode === "string" ? climate.fuelMode : "auto",
      blizzard: blizzardIntensity(state, cfg),
      blizzardDaysLeft: Math.max(0, num(climate.blizzardDaysLeft, 0)),
      blizzardIn:
        num(climate.blizzardDaysLeft, 0) > 0 ? null : Math.max(0, num(climate.nextBlizzardIn, 0)),
      blizzardBanner: extras.blizzardBanner === true,
      blizzardBannerSub:
        extras.blizzardBannerSub ||
        `气温 ${round2(num(climate.temp, cfg.baseTemp)).toFixed(1)}° · 速添薪火`,

      /* 人口 */
      morale: round2(num(people.morale, 0)),
      population: {
        current: pop,
        cap: popCap,
        sick,
        hungry: Math.max(0, Math.floor(num(people.hungry, 0))),
        total: pop,
        idle: Math.max(0, pop - sick - assigned),
        assigned,
        housing: popCap,
      },

      /* 城池 */
      buildings: projectBuildings(state, cat),
      furnaceLevel: level,

      /* 军 */
      heroes: projectHeroes(state, extras.heroCatalog),
      troops,
      troopCap: Math.max(troops, num(extras.troopCap, troops)),
      army,
      recruitTickets: Math.max(0, num(state?.heroes?.tickets, 0)),

      /* 任务 */
      quests,
      questsActive: quests.filter((q) => q.active || q.ready),
      questCounts: questCounts(quests),

      /* 其他 */
      log: projectLog(state),
      tech: obj(state.tech),
      stats: obj(state.stats),
      // 契约：gameOver 为布尔；原因单独放 gameOverReason（"morale" / "extinct"）
      gameOver: Boolean(gameOverReason),
      gameOverReason,
      villagerCount: clamp(Math.round(6 + pop * 0.55), 8, 16),
    };
  } catch (err) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[bridge/view] 投影失败：", err?.message || err);
    }
    return emptyView(extras);
  }
}

/* ------------------------------------------------------------------ */

function round2(n) {
  return Math.round(num(n, 0) * 100) / 100;
}
