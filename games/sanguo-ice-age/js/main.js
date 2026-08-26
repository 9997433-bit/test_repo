/**
 * 三国 · 冰河时代 — 启动与装配。
 *
 * 本文件负责把 loop / state / systems / ui / render 串起来。
 * `js/systems`、`js/data`、`js/state.js`、`js/engine/loop.js`、`js/engine/save.js`
 * 由其他协作者实现，此处一律使用「防御性动态 import」：
 *   · 存在且可用 → 交由外部系统推进
 *   · 缺失或抛错 → 回落到本文件内置的 FALLBACK CORE（完整可玩的经济/气候/战斗）
 * 因此即使协作模块尚未落地，页面也能正常呈现雪、火炉、城池与 HUD。
 */

import { createCityRenderer, CITY_LAYOUT } from "./render/canvas.js";
import { createHud } from "./ui/hud.js";
import { createPanels } from "./ui/panels.js";
import { createTutorial } from "./ui/tutorial.js";

/* ============================================================
   0. 防御性动态 import
   ============================================================ */
async function tryImport(path) {
  try {
    const m = await import(path);
    return m && typeof m === "object" ? m : null;
  } catch {
    return null;
  }
}
function pickFn(mod, ...names) {
  if (!mod) return null;
  for (const n of names) if (typeof mod[n] === "function") return mod[n];
  return null;
}

const ext = {
  config: await tryImport("./config.js"),
  bus: await tryImport("./engine/bus.js"),
  loop: await tryImport("./engine/loop.js"),
  save: await tryImport("./engine/save.js"),
  state: await tryImport("./state.js"),
  city: await tryImport("./systems/city.js"),
  economy: await tryImport("./systems/economy.js"),
  climate: await tryImport("./systems/climate.js"),
  population: await tryImport("./systems/population.js"),
  heroes: await tryImport("./systems/heroes.js"),
  combat: await tryImport("./systems/combat.js"),
  quests: await tryImport("./systems/quests.js"),
  dataHeroes: await tryImport("./data/heroes.js"),
  dataBuildings: await tryImport("./data/buildings.js"),
  dataQuests: await tryImport("./data/quests.js"),
};

const CFG = ext.config || {};
const TICK_MS = CFG.TICK_MS ?? 250;
const TICKS_PER_DAY = CFG.TICKS_PER_DAY ?? 16;
const SAVE_KEY = CFG.SAVE_KEY ?? "sanguo-ice-age-save-v1";
const CLIMATE = CFG.CLIMATE ?? {
  baseTemp: 4, furnaceHeatPerLevel: 3.2, blizzardEveryDays: 7,
  blizzardDurationDays: 2, blizzardTempDelta: -14,
  freezeThreshold: -6, coldThreshold: 0, comfortThreshold: 8,
};
const MORALE_CFG = CFG.MORALE ?? {
  base: 70, freezeDrain: 2.4, coldDrain: 0.8, comfortGain: 0.35,
  starveDrain: 3.5, collapseAt: 15,
};
const FACTION_BEATS = CFG.FACTION_BEATS ?? { wu: "shu", shu: "wei", wei: "wu" };
const TROOP_BEATS = CFG.TROOP_BEATS ?? { infantry: "cavalry", cavalry: "archer", archer: "infantry" };
const clamp = CFG.clamp ?? ((n, a, b) => Math.max(a, Math.min(b, n)));

/* ============================================================
   1. FALLBACK CORE — 内置的完整玩法内核
   ============================================================ */

const BUILDINGS = {
  furnace: {
    name: "火炉", icon: "🔥", tag: "全城热源", maxW: () => 0,
    cost: { wood: 130, coal: 20 }, growth: 1.66, hardMax: 20,
    desc: "拾薪城唯一的热源。等级决定供热强度、暖光覆盖半径，并作为其余建筑的等级上限。",
  },
  house: {
    name: "民居", icon: "🏠", tag: "居住", maxW: () => 0, housing: 4,
    cost: { wood: 95, food: 45 }, growth: 1.5,
    desc: "夯土围墙、兽皮盖顶的窝棚。每级可多容纳 4 名丁口，人多则产出多、口粮也多。",
  },
  lumber: {
    name: "伐木场", icon: "🪓", tag: "产出 木材", maxW: (l) => 2 + l, per: { wood: 4.2 },
    cost: { wood: 85, iron: 12 }, growth: 1.5,
    desc: "在冻土松林中伐取薪柴。木材既是最主要的燃料，也是一切营造的根本。",
  },
  hunter: {
    name: "猎人小屋", icon: "🏹", tag: "产出 肉食", maxW: (l) => 2 + l, per: { food: 3.9 },
    cost: { wood: 95, food: 35 }, growth: 1.5,
    desc: "雪原上追猎麋鹿与雪兔。寒潮期间猎获锐减，须提前囤积。",
  },
  coal: {
    name: "煤矿", icon: "⛏️", tag: "产出 石炭", maxW: (l) => 1 + l, per: { coal: 2.6 },
    cost: { wood: 150, iron: 45 }, growth: 1.55,
    desc: "深挖冻土下的煤层。石炭热值远胜木柴，是熬过冰河寒潮的命脉。",
  },
  iron: {
    name: "铁矿", icon: "⚒️", tag: "产出 铁料", maxW: (l) => 1 + l, per: { iron: 1.9 },
    cost: { wood: 180, coal: 55 }, growth: 1.58,
    desc: "凿取赤铁矿石。铁料用于军械、农具与太学院的典籍刻版。",
  },
  kitchen: {
    name: "厨房", icon: "🍲", tag: "加工 肉食", maxW: (l) => 1 + l, per: { food: 2.1 },
    cost: { wood: 115, iron: 22 }, growth: 1.5, morale: 0.26,
    desc: "熬煮热羹分与百姓。既补充口粮，也让民心在酷寒中不至于崩散。",
  },
  storage: {
    name: "仓库", icon: "📦", tag: "储量上限", maxW: () => 1, cap: 340,
    cost: { wood: 155, iron: 32 }, growth: 1.5,
    desc: "地窖与木仓。每级提升全部四种物资的储量上限，溢出的产出会被浪费。",
  },
  barracks: {
    name: "兵营", icon: "🛡️", tag: "征募 兵员", maxW: (l) => 1 + l,
    cost: { wood: 210, iron: 85 }, growth: 1.6, troopCap: 30, trainPer: 5.5,
    desc: "操演步骑弓三军。派驻工人可持续征募兵员，兵员上限随等级提升。",
  },
  clinic: {
    name: "医馆", icon: "🌿", tag: "民心 / 减损", maxW: (l) => 1 + l,
    cost: { wood: 165, food: 85, iron: 30 }, growth: 1.55, morale: 0.19,
    desc: "医治冻伤与疫病。提升民心恢复，并降低严寒造成的人口折损。",
  },
  recruit: {
    name: "招贤馆", icon: "🏮", tag: "招募令", maxW: () => 1, ticketPerDay: 0.32,
    cost: { wood: 190, iron: 65 }, growth: 1.6,
    desc: "高悬赤灯，张榜求贤。每日自动产出少量招募令，等级越高越快。",
  },
  academy: {
    name: "太学院", icon: "📜", tag: "研习典籍", maxW: (l) => 1 + l,
    cost: { wood: 250, iron: 130 }, growth: 1.62,
    desc: "汇聚流散士人整理典籍。等级决定可研习的典籍层级，效果永久生效。",
  },
  wall: {
    name: "城墙", icon: "🧱", tag: "守备", maxW: () => 0, defense: 70,
    cost: { wood: 230, iron: 95 }, growth: 1.6,
    desc: "环城夯土与雉堞。提升守备，降低出征时的兵员折损，也挡住呼啸的北风。",
  },
};

const BUILD_ORDER = [
  "furnace", "house", "lumber", "hunter", "coal", "iron",
  "kitchen", "storage", "barracks", "clinic", "recruit", "academy", "wall",
];

const BUILTIN_HERO_POOL = [
  ["曹操", "wei", "red", "cavalry"], ["司马懿", "wei", "red", "archer"],
  ["张辽", "wei", "orange", "cavalry"], ["夏侯惇", "wei", "orange", "infantry"],
  ["许褚", "wei", "orange", "infantry"], ["典韦", "wei", "purple", "infantry"],
  ["徐晃", "wei", "purple", "infantry"], ["张郃", "wei", "purple", "cavalry"],
  ["曹仁", "wei", "purple", "infantry"], ["于禁", "wei", "blue", "infantry"],
  ["乐进", "wei", "blue", "infantry"], ["李典", "wei", "blue", "archer"],
  ["刘备", "shu", "red", "infantry"], ["诸葛亮", "shu", "red", "archer"],
  ["关羽", "shu", "red", "cavalry"], ["张飞", "shu", "orange", "infantry"],
  ["赵云", "shu", "orange", "cavalry"], ["马超", "shu", "orange", "cavalry"],
  ["黄忠", "shu", "purple", "archer"], ["魏延", "shu", "purple", "infantry"],
  ["姜维", "shu", "purple", "cavalry"], ["庞统", "shu", "purple", "archer"],
  ["马岱", "shu", "blue", "cavalry"], ["关平", "shu", "blue", "infantry"],
  ["孙权", "wu", "red", "infantry"], ["周瑜", "wu", "orange", "archer"],
  ["陆逊", "wu", "orange", "archer"], ["甘宁", "wu", "orange", "infantry"],
  ["太史慈", "wu", "purple", "archer"], ["吕蒙", "wu", "purple", "infantry"],
  ["黄盖", "wu", "purple", "infantry"], ["孙尚香", "wu", "purple", "archer"],
  ["凌统", "wu", "blue", "infantry"], ["丁奉", "wu", "blue", "infantry"],
  ["周泰", "wu", "blue", "infantry"],
  ["吕布", "qun", "red", "cavalry"], ["貂蝉", "qun", "orange", "archer"],
  ["张角", "qun", "orange", "archer"], ["董卓", "qun", "purple", "infantry"],
  ["袁绍", "qun", "purple", "cavalry"], ["公孙瓒", "qun", "purple", "cavalry"],
  ["左慈", "qun", "purple", "archer"], ["华雄", "qun", "blue", "infantry"],
  ["颜良", "qun", "blue", "cavalry"], ["文丑", "qun", "blue", "cavalry"],
].map(([name, faction, quality, troop]) => ({ name, faction, quality, troop }));

const QUALITY_POWER = { blue: 130, purple: 280, orange: 560, red: 980 };
const QUALITY_COEF = { blue: 1, purple: 1.35, orange: 1.9, red: 2.7 };

/**
 * 武将名录优先取 `js/data/heroes.js`（fable-balance 的数据表），
 * 缺失或结构不符时退回内置名录。战力由基础属性折算到本作的量纲。
 */
function loadHeroPool() {
  const table = ext.dataHeroes?.HEROES ?? ext.dataHeroes?.default;
  if (!Array.isArray(table)) return { pool: BUILTIN_HERO_POOL, source: "builtin" };
  const mapped = table
    .filter((h) => h && typeof h.name === "string" && h.faction && QUALITY_COEF[h.quality])
    .map((h) => {
      const b = h.base || {};
      return {
        name: h.name,
        faction: h.faction,
        quality: h.quality,
        troop: h.troop || "infantry",
        title: h.title || "",
        skill: h.skill?.name || "",
        skillDesc: h.skill?.desc || "",
        raw: (b.atk ?? 60) * 2.2 + (b.def ?? 60) * 1.7 + (b.hp ?? 900) * 0.32 + (b.intel ?? 50) * 1.1,
      };
    });
  const hasAll = ["blue", "purple", "orange", "red"].every((q) => mapped.some((m) => m.quality === q));
  if (mapped.length < 12 || !hasAll) return { pool: BUILTIN_HERO_POOL, source: "builtin" };

  // 数据表按角色定位分配属性（辅助将 atk 低、intel 高），直接折算会让品质梯度倒挂。
  // 因此以品质基准战力为骨架，用「同品质内的相对强弱」做 ±35% 的浮动。
  const meanByQuality = {};
  for (const q of Object.keys(QUALITY_COEF)) {
    const group = mapped.filter((m) => m.quality === q);
    meanByQuality[q] = group.reduce((s, m) => s + m.raw, 0) / (group.length || 1);
  }
  for (const m of mapped) {
    const rel = m.raw / (meanByQuality[m.quality] || m.raw || 1);
    m.basePower = Math.round(QUALITY_POWER[m.quality] * clamp(0.78 + 0.44 * rel, 0.7, 1.35));
    delete m.raw;
  }
  return { pool: mapped, source: "data/heroes.js" };
}
const HERO_TABLE = loadHeroPool();
const HERO_POOL = HERO_TABLE.pool;

/** 建筑简介优先取 `js/data/buildings.js` 的文案（只用文字，机制仍由本文件负责）。 */
const DATA_BUILDING_ALIAS = {
  furnace: "furnace", lumber: "lumber", hunter: "hunter", coal_mine: "coal",
  iron_mine: "iron", house: "house", warehouse: "storage", kitchen: "kitchen",
  clinic: "clinic", barracks_inf: "barracks", academy: "academy", tavern: "recruit", wall: "wall",
};
(function adoptBuildingText() {
  const table = ext.dataBuildings?.BUILDINGS ?? ext.dataBuildings?.default;
  if (!Array.isArray(table)) return;
  for (const row of table) {
    const key = DATA_BUILDING_ALIAS[row?.id];
    if (key && BUILDINGS[key] && typeof row.desc === "string" && row.desc.length > 8) {
      BUILDINGS[key].desc = row.desc;
    }
  }
})();
const DRAW_RATES = [["blue", 0.62], ["purple", 0.284], ["orange", 0.082], ["red", 0.014]];

const TARGETS = [
  { id: "bandit", name: "白波流寇", faction: "qun", troop: "infantry", power: 240, difficulty: 1,
    desc: "盘踞河谷的散兵游勇，抢掠往来樵夫。", loot: { food: 220, wood: 200 }, ticket: 0 },
  { id: "yellow", name: "黄巾余党", faction: "qun", troop: "archer", power: 640, difficulty: 1,
    desc: "黄天已死的残部，仍在雪原上竖起破旗。", loot: { food: 420, wood: 340, iron: 90 }, ticket: 1 },
  { id: "wolf", name: "雪原狼骑", faction: "wei", troop: "cavalry", power: 1500, difficulty: 2,
    desc: "披狼皮的北地轻骑，来去如风。", loot: { food: 720, coal: 280, iron: 210 }, ticket: 1 },
  { id: "icefort", name: "冰堡豪强", faction: "wu", troop: "infantry", power: 2900, difficulty: 2,
    desc: "据冰崖立堡的地方豪族，囤积着大量石炭。", loot: { wood: 950, coal: 560, iron: 440 }, ticket: 2 },
  { id: "northking", name: "北境僭王", faction: "shu", troop: "cavalry", power: 5800, difficulty: 3,
    desc: "自号「霜州牧」的僭主，麾下甲骑三千。", loot: { food: 1700, coal: 950, iron: 950 }, ticket: 3 },
];

const TECHS = [
  { id: "warmwall", name: "御寒夯土", icon: "🧱", reqLevel: 1, cost: { wood: 420, iron: 130 },
    desc: "墙体夹填干草与兽皮，全城温度 +1.5°。", apply: (s) => (s.techTemp += 1.5) },
  { id: "ironaxe", name: "精钢利斧", icon: "🪓", reqLevel: 1, cost: { iron: 210, wood: 210 },
    desc: "改良斧刃与锯，木材产出 +20%。", apply: (s) => (s.techMul.wood += 0.2) },
  { id: "saltcure", name: "腌藏之法", icon: "🍖", reqLevel: 2, cost: { iron: 250, food: 320 },
    desc: "以盐腌渍久藏，肉食产出 +20%。", apply: (s) => (s.techMul.food += 0.2) },
  { id: "coalseam", name: "深层煤脉", icon: "🪨", reqLevel: 2, cost: { iron: 340, wood: 320 },
    desc: "探明深层煤层，石炭产出 +25%。", apply: (s) => (s.techMul.coal += 0.25) },
  { id: "drill", name: "屯田练兵", icon: "⚔️", reqLevel: 3, cost: { iron: 520, food: 520 },
    desc: "兵农合一，兵营征募速度 +30%。", apply: (s) => (s.techMul.troop += 0.3) },
  { id: "taixue", name: "经世致用", icon: "📖", reqLevel: 3, cost: { iron: 620, wood: 620 },
    desc: "以典籍教化流民，民心恢复 +30%。", apply: (s) => (s.techMul.morale += 0.3) },
];

let heroSeq = 0;
let logSeq = 0;

function newState() {
  return {
    version: 1,
    day: 1,
    tickInDay: 0,
    dayProgress: 0,
    speed: 1,
    paused: false,
    cityName: "拾薪城",
    lord: CFG.DEFAULT_LORD ?? { name: "流民县令" },
    resources: { food: 420, wood: 520, coal: 120, iron: 60 },
    buildings: BUILD_ORDER.map((key) => ({
      key,
      level: key === "furnace" ? 2 : key === "house" || key === "lumber" || key === "hunter" ? 1 : key === "wall" ? 1 : 1,
      workers: key === "lumber" ? 2 : key === "hunter" ? 2 : key === "coal" ? 1 : 0,
    })),
    population: { total: 9 },
    morale: MORALE_CFG.base ?? 70,
    troops: 40,
    heroes: [],
    recruitTickets: 10,
    tech: {},
    fuelMode: "auto",
    log: [],
    stats: { battles: 0, wins: 0, draws: 0 },
  };
}

/** 从 state 派生的每帧只读视图（UI 与渲染都消费这一份） */
function createCore() {
  let S = newState();
  let bannerUntil = 0;

  const derived = {
    techTemp: 0,
    techMul: { food: 1, wood: 1, coal: 1, iron: 1, troop: 1, morale: 1 },
  };

  function recomputeTech() {
    derived.techTemp = 0;
    derived.techMul = { food: 1, wood: 1, coal: 1, iron: 1, troop: 1, morale: 1 };
    const box = { techTemp: 0, techMul: { food: 0, wood: 0, coal: 0, iron: 0, troop: 0, morale: 0 } };
    for (const t of TECHS) {
      if (S.tech[t.id]) t.apply(box);
    }
    derived.techTemp = box.techTemp;
    for (const k of Object.keys(derived.techMul)) derived.techMul[k] = 1 + box.techMul[k];
  }

  const b = (key) => S.buildings.find((x) => x.key === key) || { key, level: 0, workers: 0 };
  const lvl = (key) => b(key).level;

  function maxLevel(key) {
    if (key === "furnace") return BUILDINGS.furnace.hardMax;
    return Math.max(1, lvl("furnace"));
  }
  function maxWorkers(key) {
    const def = BUILDINGS[key];
    return def?.maxW ? def.maxW(lvl(key)) : 0;
  }
  function assignedWorkers() {
    return S.buildings.reduce((s, x) => s + (x.workers || 0), 0);
  }
  function housing() {
    return 5 + lvl("house") * (BUILDINGS.house.housing ?? 4);
  }
  function capacity() {
    const c = 460 + lvl("storage") * BUILDINGS.storage.cap;
    return { food: c, wood: c, coal: Math.round(c * 0.7), iron: Math.round(c * 0.55) };
  }
  function troopCap() {
    return 20 + lvl("barracks") * BUILDINGS.barracks.troopCap;
  }

  function outsideTemp() {
    const base = (CLIMATE.baseTemp ?? 4) - Math.min(16, (S.day - 1) * 0.34);
    const wobble = Math.sin(S.day * 0.9) * 1.4;
    return base + wobble + (blizzardActive() ? CLIMATE.blizzardTempDelta ?? -14 : 0);
  }
  function blizzardPeriod() {
    return Math.max(3, CLIMATE.blizzardEveryDays ?? 7);
  }
  function blizzardActive() {
    const p = blizzardPeriod();
    const dur = Math.max(1, CLIMATE.blizzardDurationDays ?? 2);
    const phase = (S.day - 1) % p;
    return phase >= p - dur;
  }
  function blizzardIntensity() {
    if (!blizzardActive()) return 0;
    const p = blizzardPeriod();
    const dur = Math.max(1, CLIMATE.blizzardDurationDays ?? 2);
    const phase = (S.day - 1) % p;
    const into = phase - (p - dur) + S.dayProgress;
    const k = into / dur;
    return clamp(Math.sin(Math.PI * clamp(k, 0, 1)) * 1.25, 0.25, 1);
  }
  function blizzardDaysLeft() {
    if (!blizzardActive()) return 0;
    const p = blizzardPeriod();
    const dur = Math.max(1, CLIMATE.blizzardDurationDays ?? 2);
    const phase = (S.day - 1) % p;
    return dur - (phase - (p - dur)) - S.dayProgress;
  }
  function blizzardIn() {
    if (blizzardActive()) return null;
    const p = blizzardPeriod();
    const dur = Math.max(1, CLIMATE.blizzardDurationDays ?? 2);
    const phase = (S.day - 1) % p;
    return Math.max(0, Math.ceil(p - dur - phase - S.dayProgress));
  }

  function fuelPerDay() {
    const f = lvl("furnace");
    return { wood: 2.9 * f, coal: 1.25 * f };
  }
  function activeFuel() {
    const need = fuelPerDay();
    const mode = S.fuelMode;
    if (mode === "coal") return S.resources.coal >= need.coal * 0.05 ? "coal" : (S.resources.wood > 0 ? "wood" : null);
    if (mode === "wood") return S.resources.wood >= need.wood * 0.05 ? "wood" : (S.resources.coal > 0 ? "coal" : null);
    // auto：寒潮烧炭，平时烧柴
    if (blizzardActive() && S.resources.coal > need.coal * 0.05) return "coal";
    if (S.resources.wood > need.wood * 0.05) return "wood";
    if (S.resources.coal > 0) return "coal";
    return null;
  }
  function furnaceHeat(level = lvl("furnace")) {
    const fuel = activeFuel();
    if (!fuel) return 0;
    const eff = fuel === "coal" ? 1.35 : 1;
    const drain = S.buildings.reduce((s, x) => s + x.level, 0) * 0.06;
    return Math.max(0, (CLIMATE.furnaceHeatPerLevel ?? 3.2) * level * eff - drain);
  }
  function fuelDays() {
    const fuel = activeFuel();
    if (!fuel) return 0;
    const need = fuelPerDay()[fuel];
    if (need <= 0) return 99;
    // 计入当前净产出
    const prod = production()[fuel] ?? 0;
    const net = need - prod;
    if (net <= 0) return 99;
    return Math.min(99, S.resources[fuel] / net);
  }
  function temperature() {
    return outsideTemp() + furnaceHeat() + derived.techTemp + lvl("wall") * 0.18;
  }

  /** 每日毛产出（不含消耗） */
  function production() {
    const out = { food: 0, wood: 0, coal: 0, iron: 0 };
    const t = temperature();
    const coldPenalty = t < (CLIMATE.coldThreshold ?? 0) ? clamp(1 + t * 0.035, 0.45, 1) : 1;
    const blizz = 1 - blizzardIntensity() * 0.32;
    for (const bd of S.buildings) {
      const def = BUILDINGS[bd.key];
      if (!def?.per || !bd.workers) continue;
      for (const [k, v] of Object.entries(def.per)) {
        out[k] += v * bd.workers * (1 + (bd.level - 1) * 0.14) * derived.techMul[k] * coldPenalty * blizz;
      }
    }
    return out;
  }

  function consumption() {
    const out = { food: 0, wood: 0, coal: 0, iron: 0 };
    out.food = S.population.total * 0.82 + assignedWorkers() * 0.26;
    const fuel = activeFuel();
    if (fuel) out[fuel] += fuelPerDay()[fuel];
    const barr = b("barracks");
    if (barr.workers && S.troops < troopCap()) {
      out.food += barr.workers * 0.9;
      out.iron += barr.workers * 0.35;
    }
    return out;
  }

  function rates() {
    const p = production();
    const c = consumption();
    return {
      food: p.food - c.food, wood: p.wood - c.wood,
      coal: p.coal - c.coal, iron: p.iron - c.iron,
    };
  }

  function log(text, kind = "info") {
    S.log.push({ id: logSeq++, day: S.day, text, kind });
    if (S.log.length > 200) S.log.splice(0, S.log.length - 200);
  }

  /* ── tick ────────────────────────────────────────────────── */
  function tick() {
    const dt = 1 / TICKS_PER_DAY; // 单位：日
    const cap = capacity();
    const r = rates();
    for (const k of ["food", "wood", "coal", "iron"]) {
      S.resources[k] = clamp(S.resources[k] + r[k] * dt, 0, cap[k]);
    }

    const t = temperature();
    const wasBlizzard = blizzardActive();

    /* 民心 */
    let dm = 0;
    if (t <= (CLIMATE.freezeThreshold ?? -6)) dm -= (MORALE_CFG.freezeDrain ?? 2.4) * dt;
    else if (t <= (CLIMATE.coldThreshold ?? 0)) dm -= (MORALE_CFG.coldDrain ?? 0.8) * dt;
    else if (t >= (CLIMATE.comfortThreshold ?? 8)) dm += (MORALE_CFG.comfortGain ?? 0.35) * dt;
    if (S.resources.food <= 0.5) dm -= (MORALE_CFG.starveDrain ?? 3.5) * dt;
    dm += (b("kitchen").workers * (BUILDINGS.kitchen.morale ?? 0) + b("clinic").workers * (BUILDINGS.clinic.morale ?? 0))
      * derived.techMul.morale * dt;
    if (!activeFuel()) dm -= 3.2 * dt;
    S.morale = clamp(S.morale + dm, 0, 100);

    /* 人口 */
    const house = housing();
    let dp = 0;
    if (S.resources.food > 1 && S.morale > 48 && S.population.total < house) dp += 0.42 * dt;
    if (t <= (CLIMATE.freezeThreshold ?? -6)) {
      const sev = ((CLIMATE.freezeThreshold ?? -6) - t) / 10;
      dp -= (0.32 + sev * 0.6) * dt * (1 - Math.min(0.55, b("clinic").workers * 0.18));
    }
    if (S.resources.food <= 0.5) dp -= 0.5 * dt;
    S.population.total = Math.max(1, S.population.total + dp);

    // 工人不能超过人口
    let over = assignedWorkers() - Math.floor(S.population.total);
    while (over > 0) {
      const victim = S.buildings.filter((x) => x.workers > 0).sort((a, c) => a.workers - c.workers)[0];
      if (!victim) break;
      victim.workers--;
      over--;
    }

    /* 兵员 */
    const barr = b("barracks");
    if (barr.workers && S.troops < troopCap() && S.resources.food > 5 && S.resources.iron > 1) {
      S.troops = Math.min(troopCap(), S.troops + BUILDINGS.barracks.trainPer * barr.workers * derived.techMul.troop * dt);
    }

    /* 招募令 */
    const rec = b("recruit");
    if (rec.level > 0) {
      S._ticketAcc = (S._ticketAcc || 0) + (BUILDINGS.recruit.ticketPerDay * (1 + (rec.level - 1) * 0.35) + rec.workers * 0.12) * dt;
      while (S._ticketAcc >= 1) {
        S._ticketAcc -= 1;
        S.recruitTickets++;
      }
    }

    /* 时间推进 */
    S.tickInDay++;
    S.dayProgress = S.tickInDay / TICKS_PER_DAY;
    if (S.tickInDay >= TICKS_PER_DAY) {
      S.tickInDay = 0;
      S.dayProgress = 0;
      S.day++;
      onNewDay(wasBlizzard);
    }
  }

  function onNewDay(wasBlizzard) {
    const t = temperature();
    if (!wasBlizzard && blizzardActive()) {
      bannerUntil = performance.now() + 4200;
      log(`<b>冰河寒潮</b>降临，气温骤降 ${Math.abs(CLIMATE.blizzardTempDelta ?? -14)}°`, "bad");
    } else if (wasBlizzard && !blizzardActive()) {
      log("寒潮退去，天光稍霁", "good");
    }
    if (!activeFuel()) log("<b>燃料告罄</b>，火炉将熄！", "bad");
    else if (fuelDays() < 2) log("燃料不足两日，速去伐木或采炭", "warn");
    if (S.resources.food < 20) log("粮秣将尽，百姓面有菜色", "warn");
    if (S.morale < (MORALE_CFG.collapseAt ?? 15)) log("民心涣散，已有流民出走", "bad");
    if (t <= (CLIMATE.freezeThreshold ?? -6)) log(`城中 ${t.toFixed(1)}°，冻毙者众`, "bad");
    if (S.day % 5 === 0) log(`第 ${S.day} 日 · 丁口 ${Math.floor(S.population.total)} · 民心 ${Math.round(S.morale)}`, "info");
  }

  /* ── 操作 ────────────────────────────────────────────────── */
  function costOf(key, level) {
    const def = BUILDINGS[key];
    if (!def) return {};
    const out = {};
    for (const [k, v] of Object.entries(def.cost)) {
      out[k] = Math.round(v * Math.pow(def.growth, Math.max(0, level - 1)));
    }
    return out;
  }
  function canAfford(cost) {
    return Object.entries(cost).every(([k, v]) => (S.resources[k] ?? 0) >= v);
  }
  function pay(cost) {
    for (const [k, v] of Object.entries(cost)) S.resources[k] -= v;
  }

  function buildingInfo(key) {
    const def = BUILDINGS[key];
    if (!def) return null;
    const bd = b(key);
    const lv = bd.level;
    const mx = maxLevel(key);
    const cost = costOf(key, lv);
    const prod = {};
    const nextProd = {};
    if (def.per) {
      for (const [k, v] of Object.entries(def.per)) {
        prod[k] = v * bd.workers * (1 + (lv - 1) * 0.14) * derived.techMul[k];
        nextProd[k] = v * Math.max(1, bd.workers) * (1 + lv * 0.14) * derived.techMul[k];
      }
    }
    const extraGains = [];
    if (def.housing) extraGains.push({ label: "🏠 可容丁口", now: housing(), next: housing() + def.housing });
    if (def.cap) extraGains.push({ label: "📦 储量上限", now: capacity().food, next: capacity().food + def.cap });
    if (def.troopCap) extraGains.push({ label: "🛡 兵员上限", now: troopCap(), next: troopCap() + def.troopCap });
    if (def.defense) extraGains.push({ label: "🧱 守备", now: lv * def.defense, next: (lv + 1) * def.defense });
    if (key === "recruit") extraGains.push({ label: "🏮 招募令 / 日", now: (BUILDINGS.recruit.ticketPerDay * (1 + (lv - 1) * 0.35)).toFixed(2), next: (BUILDINGS.recruit.ticketPerDay * (1 + lv * 0.35)).toFixed(2) });

    const atMax = lv >= mx;
    const afford = canAfford(cost);
    return {
      key, name: def.name, icon: def.icon, tag: def.tag, desc: def.desc,
      level: lv, maxLevel: mx,
      workers: bd.workers, maxWorkers: maxWorkers(key),
      cost, production: prod, nextProduction: nextProd, extraGains,
      mainOutput: def.per
        ? Object.entries(def.per).map(([k]) => ({ food: "🍖 肉食", wood: "🪵 木材", coal: "🪨 石炭", iron: "⚙️ 铁料" }[k])).join(" ")
        : def.tag,
      heatUse: +(lv * 0.06).toFixed(2),
      canUpgrade: !atMax && afford,
      blockedReason: atMax
        ? (key === "furnace" ? "火炉已达极限" : `需先将火炉升至 ${lv + 1} 级`)
        : !afford ? "物资不足" : "",
      capReason: key === "furnace" ? "火炉已达极限。" : `其余建筑等级不得超过火炉（当前 ${lvl("furnace")} 级）。`,
    };
  }

  function upgrade(key) {
    const info = buildingInfo(key);
    if (!info) return { ok: false, reason: "无此建筑" };
    if (info.level >= info.maxLevel) return { ok: false, reason: info.blockedReason };
    if (!canAfford(info.cost)) return { ok: false, reason: "物资不足" };
    pay(info.cost);
    const bd = b(key);
    bd.level++;
    log(`<b>${info.name}</b> 升至 ${bd.level} 级`, "good");
    return { ok: true, name: info.name, level: bd.level };
  }

  function addWorker(key, delta) {
    const bd = b(key);
    const mx = maxWorkers(key);
    if (mx <= 0) return { ok: false, reason: "此建筑无需派工" };
    const idle = Math.floor(S.population.total) - assignedWorkers();
    if (delta > 0 && idle < 1) return { ok: false, reason: "已无闲置丁口" };
    if (delta > 0 && bd.workers >= mx) return { ok: false, reason: "工位已满" };
    if (delta < 0 && bd.workers <= 0) return { ok: false, reason: "已无工人" };
    bd.workers = clamp(bd.workers + delta, 0, mx);
    return { ok: true };
  }

  function setFuel(mode) {
    S.fuelMode = mode;
    log(`燃料策略改为「${{ wood: "木柴", coal: "石炭", auto: "自动" }[mode]}」`, "info");
  }

  /* ── 招贤 ────────────────────────────────────────────────── */
  function ticketCost() {
    return { iron: 180, food: 260 };
  }
  function buyTicket() {
    const c = ticketCost();
    if (!canAfford(c)) return { ok: false, reason: "铁料或肉食不足" };
    pay(c);
    S.recruitTickets++;
    return { ok: true };
  }
  function rollQuality(floor) {
    const r = Math.random();
    let acc = 0;
    for (const [q, p] of DRAW_RATES) {
      acc += p;
      if (r < acc) return floor && q === "blue" ? "purple" : q;
    }
    return "blue";
  }
  function powerOf(hero) {
    return Math.round(hero.base * (1 + (hero.level - 1) * 0.19));
  }
  function makeHero(quality) {
    const pool = HERO_POOL.filter((h) => h.quality === quality);
    const src = pool[(Math.random() * pool.length) | 0] || HERO_POOL[0];
    const base = Math.round((src.basePower ?? QUALITY_POWER[src.quality]) * (0.93 + Math.random() * 0.14));
    const hero = {
      id: `h${heroSeq++}`,
      name: src.name, faction: src.faction, quality: src.quality, troop: src.troop,
      title: src.title || "", skill: src.skill || "", skillDesc: src.skillDesc || "",
      level: 1, base,
    };
    hero.power = powerOf(hero);
    return hero;
  }
  function recruit(times) {
    if ((S.recruitTickets ?? 0) < times) return { ok: false, reason: `招募令不足（需 ${times} 张）` };
    S.recruitTickets -= times;
    const results = [];
    for (let i = 0; i < times; i++) {
      const floor = times >= 10 && i === times - 1 && !results.some((r) => r.hero.quality !== "blue");
      const q = rollQuality(floor);
      const fresh = makeHero(q);
      const own = S.heroes.find((h) => h.name === fresh.name);
      if (own) {
        own.level = Math.min(10, own.level + 1);
        own.base = own.base ?? QUALITY_POWER[own.quality];
        own.power = powerOf(own);
        results.push({ hero: own, dupe: true });
      } else {
        S.heroes.push(fresh);
        results.push({ hero: fresh, dupe: false });
        if (fresh.quality === "red" || fresh.quality === "orange") {
          log(`<b>${fresh.name}</b> 来投！`, "good");
        }
      }
    }
    return { ok: true, results };
  }

  /* ── 讨伐 ────────────────────────────────────────────────── */
  function targets() {
    return TARGETS.map((t) => ({ ...t, cleared: !!S.stats[`clear_${t.id}`] }));
  }

  function armyPower(heroIds, troops) {
    const heroes = S.heroes.filter((h) => heroIds.includes(h.id));
    let base = heroes.reduce((s, h) => s + h.power, 0);
    const counts = {};
    for (const h of heroes) counts[h.faction] = (counts[h.faction] || 0) + 1;
    const top = Math.max(0, ...Object.values(counts));
    let bonus = 1;
    const notes = [];
    if (top >= 3) { bonus += 0.18; notes.push("同阵营三人 +18%"); }
    else if (top === 2) { bonus += 0.08; notes.push("同阵营二人 +8%"); }
    const troopPow = troops * 3.4 * (1 + lvl("barracks") * 0.05);
    return { heroes, base, bonus, troopPow, notes };
  }

  function previewBattle(targetId, heroIds, troops) {
    const t = TARGETS.find((x) => x.id === targetId);
    if (!t) return { ok: false, reason: "请选择讨伐目标" };
    if (!heroIds.length) return { ok: false, reason: "至少点将 1 人" };
    if (troops < 10) return { ok: false, reason: "兵力不足 10，无法出征" };
    if (troops > S.troops) return { ok: false, reason: "兵力不足" };

    const a = armyPower(heroIds, troops);
    const notes = [...a.notes];
    let mul = a.bonus;
    for (const h of a.heroes) {
      if (FACTION_BEATS[h.faction] === t.faction) {
        mul += 0.12;
        notes.push(`${h.name} 阵营克制`);
      }
      if (TROOP_BEATS[h.troop] === t.troop) {
        mul += 0.1;
        notes.push(`${h.name} 兵种克制`);
      } else if (TROOP_BEATS[t.troop] === h.troop) {
        mul -= 0.08;
      }
    }
    const atk = Math.round((a.base * mul + a.troopPow) * (0.85 + S.morale / 200));
    const def = t.power;
    const odds = clamp(atk / (atk + def * 0.92), 0.03, 0.97);
    return { ok: true, odds, atk, def, bonusText: notes.slice(0, 2).join(" · "), target: t };
  }

  function battle(targetId, heroIds, troops) {
    const pv = previewBattle(targetId, heroIds, troops);
    if (!pv.ok) return { ok: false, reason: pv.reason };
    const t = pv.target;
    const heroes = S.heroes.filter((h) => heroIds.includes(h.id));
    const win = Math.random() < pv.odds;

    const rounds = [];
    let hp = 100;
    let ehp = 100;
    for (let i = 0; i < 4; i++) {
      const h = heroes[i % heroes.length];
      const dmg = Math.round((pv.atk / (pv.atk + pv.def)) * (18 + Math.random() * 16));
      const edmg = Math.round((pv.def / (pv.atk + pv.def)) * (18 + Math.random() * 16));
      ehp -= dmg;
      hp -= edmg;
      const beat = FACTION_BEATS[h.faction] === t.faction || TROOP_BEATS[h.troop] === t.troop;
      rounds.push(
        `<b>${h.name}</b> 率${{ infantry: "步卒", cavalry: "铁骑", archer: "弓手" }[h.troop]}冲阵，` +
        `斩敌 <span class="dmg">${dmg * 12}</span>${beat ? ' <span class="adv">（克制）</span>' : ""}；` +
        `我军折损 <span class="dis">${edmg * 8}</span>。`
      );
    }
    rounds.push(
      win
        ? `<b>${t.name}</b> 阵脚崩溃，四散奔逃。我军<span class="adv">全线掩杀</span>。`
        : `我军力竭，<b>${t.name}</b> 反扑得手，只得<span class="dis">鸣金收兵</span>。`
    );

    const lossRate = win ? 0.1 + (1 - pv.odds) * 0.34 : 0.28 + (1 - pv.odds) * 0.4;
    const wallCut = 1 - Math.min(0.3, lvl("wall") * 0.035);
    const losses = Math.round(troops * lossRate * wallCut);
    S.troops = Math.max(0, S.troops - losses);

    const loot = {};
    const cap = capacity();
    const k = win ? 1 : 0.18;
    for (const [res, v] of Object.entries(t.loot)) {
      const got = Math.round(v * k * (0.9 + Math.random() * 0.25));
      loot[res] = got;
      S.resources[res] = clamp(S.resources[res] + got, 0, cap[res]);
    }
    const ticket = win ? t.ticket : 0;
    S.recruitTickets += ticket;

    let exp = 0;
    if (win) {
      exp = 1;
      for (const h of heroes) {
        if (Math.random() < 0.45 && h.level < 10) {
          h.level++;
          h.base = h.base ?? QUALITY_POWER[h.quality];
          h.power = powerOf(h);
        }
      }
      S.stats[`clear_${t.id}`] = true;
      S.stats.wins++;
    }
    S.stats.battles++;
    S.morale = clamp(S.morale + (win ? 6 : -5), 0, 100);
    log(
      win
        ? `讨伐 <b>${t.name}</b> 大捷，折兵 ${losses}`
        : `讨伐 <b>${t.name}</b> 失利，折兵 ${losses}`,
      "war"
    );

    return {
      ok: true,
      report: {
        win, targetName: t.name, day: S.day, rounds, loot, ticket, losses, exp,
        summary: win
          ? `胜算 ${Math.round(pv.odds * 100)}% · 我军 ${pv.atk} 对 敌军 ${pv.def} · 民心 +6`
          : `胜算 ${Math.round(pv.odds * 100)}% · 我军 ${pv.atk} 对 敌军 ${pv.def} · 民心 −5`,
      },
    };
  }

  /* ── 太学 ────────────────────────────────────────────────── */
  function techList() {
    const al = lvl("academy");
    return TECHS.map((t) => ({
      id: t.id, name: t.name, icon: t.icon, desc: t.desc, cost: t.cost, reqLevel: t.reqLevel,
      state: S.tech[t.id] ? "done" : al >= t.reqLevel ? "open" : "lock",
    }));
  }
  function research(id) {
    const t = TECHS.find((x) => x.id === id);
    if (!t) return { ok: false, reason: "无此典籍" };
    if (S.tech[id]) return { ok: false, reason: "已研习" };
    if (lvl("academy") < t.reqLevel) return { ok: false, reason: `需太学院 ${t.reqLevel} 级` };
    if (!canAfford(t.cost)) return { ok: false, reason: "物资不足" };
    pay(t.cost);
    S.tech[id] = true;
    recomputeTech();
    log(`太学院研成 <b>${t.name}</b>`, "good");
    return { ok: true, name: t.name };
  }

  /* ── 视图 ────────────────────────────────────────────────── */
  function view() {
    const cap = capacity();
    const t = temperature();
    const assigned = assignedWorkers();
    return {
      ...S,
      capacity: cap,
      rates: rates(),
      population: {
        total: S.population.total,
        idle: Math.floor(S.population.total) - assigned,
        assigned,
        housing: housing(),
      },
      temp: t,
      outsideTemp: outsideTemp(),
      furnaceHeat: furnaceHeat(),
      furnaceHeatNext: furnaceHeat(lvl("furnace") + 1),
      furnaceLit: !!activeFuel(),
      fuelDays: fuelDays(),
      troopCap: troopCap(),
      blizzard: blizzardIntensity(),
      blizzardDaysLeft: blizzardDaysLeft(),
      blizzardIn: blizzardIn(),
      blizzardBanner: performance.now() < bannerUntil,
      blizzardBannerSub: `气温 ${t.toFixed(1)}° · 速添薪火`,
      villagerCount: clamp(Math.round(6 + S.population.total * 0.55), 8, 16),
    };
  }

  /* ── 存档 ────────────────────────────────────────────────── */
  function serialize() {
    return JSON.stringify({ v: 1, s: S, heroSeq, logSeq });
  }
  function hydrate(json) {
    try {
      const data = typeof json === "string" ? JSON.parse(json) : json;
      const s = data?.s ?? data;
      if (!s || !s.resources || !Array.isArray(s.buildings)) return false;
      const base = newState();
      S = { ...base, ...s };
      S.resources = { ...base.resources, ...s.resources };
      S.population = { ...base.population, ...s.population };
      S.tech = { ...s.tech };
      S.stats = { ...base.stats, ...s.stats };
      S.log = Array.isArray(s.log) ? s.log : [];
      // 补齐后加入的建筑
      for (const key of BUILD_ORDER) {
        if (!S.buildings.some((x) => x.key === key)) S.buildings.push({ key, level: 1, workers: 0 });
      }
      heroSeq = data?.heroSeq ?? S.heroes.length + 1;
      logSeq = data?.logSeq ?? (S.log.length ? S.log[S.log.length - 1].id + 1 : 0);
      recomputeTech();
      return true;
    } catch {
      return false;
    }
  }
  function reset() {
    S = newState();
    recomputeTech();
    seedLog();
  }
  function seedLog() {
    if (S.log.length) return;
    log("大寒之年，中原冰封。你率流民于河畔立<b>拾薪城</b>。", "info");
    log("点燃火炉，先派工伐木与狩猎。", "info");
  }

  recomputeTech();
  seedLog();

  return {
    get raw() { return S; },
    set raw(v) { S = v; },
    view, tick, log,
    buildingInfo, upgrade, addWorker, setFuel,
    ticketCost, buyTicket, recruit,
    targets, previewBattle, battle,
    techList, research,
    serialize, hydrate, reset,
    setSpeed(n) { S.paused = n === 0; if (n > 0) S.speed = n; },
    get speed() { return S.paused ? 0 : S.speed; },
  };
}

/* ============================================================
   2. 外部系统桥接
   ------------------------------------------------------------
   `js/systems/*` 目前使用 state.js 的嵌套结构
   （meta / city.buildings{} / people / army / heroes.roster …），
   与本文件内置内核的扁平结构不同，且建筑 id 在 config.BUILDING_IDS 与
   data/buildings.js 之间尚未统一（lumberyard vs lumber、coalmine vs coal_mine…）。
   因此 Round 1 只在「形状确实匹配」时才把模拟权交给外部系统；
   否则由内置内核推进，并把差异记录下来供后续统一。
   ============================================================ */
const bus = (pickFn(ext.bus, "createBus") || (() => ({ on: () => () => {}, emit: () => {} })))();

const core = createCore();

const bridge = { active: false, ticks: [], note: "" };
(function probeBridge() {
  const makeState = pickFn(ext.state, "createInitialState", "createState");
  const candidates = [
    ["climate", pickFn(ext.climate, "tickClimate")],
    ["economy", pickFn(ext.economy, "tickEconomy")],
    ["city", pickFn(ext.city, "tickCity")],
    ["population", pickFn(ext.population, "tickPopulation")],
  ].filter(([, fn]) => fn);

  if (!makeState || !candidates.length) {
    bridge.note = "未发现可用的 systems，使用内置内核";
    return;
  }
  // 外部状态是否与内置内核同构？（内核用扁平 buildings 数组）
  let sample = null;
  try { sample = makeState(); } catch { /* 构造失败 */ }
  const sameShape = !!sample && Array.isArray(sample.buildings) && !!sample.resources && !!sample.population;
  if (!sameShape) {
    bridge.note = `已检测到 ${candidates.length} 个 systems，但状态结构与 UI 内核不同（state.js 使用嵌套结构），Round 1 暂由内置内核推进`;
    return;
  }
  bridge.active = true;
  bridge.ticks = candidates.map(([name, fn]) => ({ name, fn, fails: 0 }));
  bridge.note = `systems 接管：${candidates.map(([n]) => n).join(" / ")}`;
})();

function runTick() {
  if (bridge.active) {
    let alive = 0;
    for (const t of bridge.ticks) {
      if (t.fails >= 3) continue;
      try {
        t.fn(core.raw, { dt: TICK_MS / 1000, ticksPerDay: TICKS_PER_DAY, bus });
        alive++;
      } catch (err) {
        t.fails++;
        if (t.fails === 3) console.warn(`[sanguo] systems/${t.name} 连续出错，已停用`, err);
      }
    }
    if (!alive) {
      bridge.active = false;
      console.warn("[sanguo] 外部系统全部不可用，切换到内置内核");
    }
  }
  core.tick();
}

/* ============================================================
   3. 装配
   ============================================================ */
const app = document.getElementById("app");
const canvas = document.getElementById("city-canvas");
const scene = document.getElementById("scene");
const tooltip = document.getElementById("scene-tooltip");

const renderer = createCityRenderer({ canvas });
renderer.resize();
renderer.recenter();

const hud = createHud({
  onSpeed: (n) => applySpeed(n),
  onOpen: (kind) => panels.open(kind),
  onHero: () => panels.open("recruit"),
});

const game = {
  get state() { return lastView; },
  buildingInfo: (k) => core.buildingInfo(k),
  upgrade: (k) => {
    const r = core.upgrade(k);
    if (r.ok) renderer.pulse(k);
    return r;
  },
  addWorker: (k, d) => core.addWorker(k, d),
  setFuel: (m) => core.setFuel(m),
  ticketCost: () => core.ticketCost(),
  buyTicket: () => core.buyTicket(),
  recruit: (n) => core.recruit(n),
  targets: () => core.targets(),
  previewBattle: (t, h, n) => core.previewBattle(t, h, n),
  battle: (t, h, n) => core.battle(t, h, n),
  techList: () => core.techList(),
  research: (id) => core.research(id),
};

const panels = createPanels({ game, hud });

const tutorial = createTutorial({
  getBuildingRect: (key) => {
    const r = renderer.rectOf(key);
    if (!r) return null;
    const box = canvas.getBoundingClientRect();
    return { x: box.left + r.x, y: box.top + r.y, width: r.width, height: r.height };
  },
  onDone: () => hud.toast("愿君守得住这一炉火。", "good", 3200),
});

/* ── 存档 ─────────────────────────────────────────────────────
   engine/save.js 会用 state.js 的 assertState 校验，只接受嵌套结构；
   在两套结构统一之前，UI 内核用独立的键自行读写，避免互相覆盖。 */
const UI_SAVE_KEY = `${SAVE_KEY}-ui`;
const extSaveAdapter = bridge.active ? ext.save : null;

function loadSave() {
  if (extSaveAdapter) {
    try {
      const s = pickFn(extSaveAdapter, "loadGame")?.();
      if (s && core.hydrate(s)) return true;
    } catch { /* 退回本地实现 */ }
  }
  try {
    const raw = localStorage.getItem(UI_SAVE_KEY);
    if (raw) return core.hydrate(raw);
  } catch { /* 隐私模式 */ }
  return false;
}
function persist() {
  if (extSaveAdapter) {
    try { pickFn(extSaveAdapter, "saveGame")?.(core.raw); return; } catch { /* 退回本地实现 */ }
  }
  try { localStorage.setItem(UI_SAVE_KEY, core.serialize()); } catch { /* 忽略 */ }
}
const loaded = loadSave();
setInterval(persist, 8000);
window.addEventListener("beforeunload", persist);

/* ── 输入：平移 / 缩放 / 选取 ─────────────────────────────── */
let dragging = false;
let dragMoved = 0;
let lastPt = null;

function localPt(e) {
  const box = canvas.getBoundingClientRect();
  return { x: e.clientX - box.left, y: e.clientY - box.top };
}

scene.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  // 场景内的浮层控件（回正视角等）不参与拖拽，否则指针捕获会吞掉它们的 click
  if (e.target instanceof Element && e.target.closest("button, a, input, select, [data-nodrag]")) return;
  dragging = true;
  dragMoved = 0;
  lastPt = localPt(e);
  scene.classList.add("is-panning");
  scene.setPointerCapture(e.pointerId);
});

scene.addEventListener("pointermove", (e) => {
  const p = localPt(e);
  if (dragging && lastPt) {
    const dx = p.x - lastPt.x;
    const dy = p.y - lastPt.y;
    dragMoved += Math.abs(dx) + Math.abs(dy);
    renderer.panBy(dx, dy);
    lastPt = p;
    tooltip.hidden = true;
    return;
  }
  const key = renderer.setHover(p.x, p.y);
  scene.classList.toggle("is-hot", !!key);
  updateTooltip(key);
});

scene.addEventListener("pointerup", (e) => {
  if (!dragging) return;
  dragging = false;
  scene.classList.remove("is-panning");
  try { scene.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  if (dragMoved < 6) {
    const p = localPt(e);
    const key = renderer.pickAt(p.x, p.y);
    if (key) {
      renderer.pulse(key);
      panels.open("building", key);
    }
  }
});

scene.addEventListener("pointerleave", () => {
  renderer.setHover(null);
  scene.classList.remove("is-hot");
  tooltip.hidden = true;
});

scene.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const p = localPt(e);
    renderer.zoomAt(p.x, p.y, e.deltaY > 0 ? 0.9 : 1.11);
  },
  { passive: false }
);

document.getElementById("btn-recenter").addEventListener("click", (e) => {
  e.stopPropagation();
  renderer.recenter();
});

function updateTooltip(key) {
  if (!key) {
    tooltip.hidden = true;
    return;
  }
  const info = core.buildingInfo(key);
  if (!info) {
    tooltip.hidden = true;
    return;
  }
  const anchor = renderer.anchorOf(key);
  if (!anchor) {
    tooltip.hidden = true;
    return;
  }
  tooltip.innerHTML = `
    <div><span class="tip__name">${info.icon} ${info.name}</span><span class="tip__lv">Lv ${info.level}</span></div>
    <div class="tip__row">${info.maxWorkers > 0 ? `工人 <b>${info.workers}/${info.maxWorkers}</b> · ` : ""}${info.mainOutput || info.tag}</div>
    <div class="tip__cta">点击查看与升级</div>`;
  tooltip.style.left = `${clamp(anchor.x, 90, scene.clientWidth - 90)}px`;
  tooltip.style.top = `${clamp(anchor.y, 60, scene.clientHeight - 20)}px`;
  tooltip.hidden = false;
}

/* ── 键盘 ─────────────────────────────────────────────────── */
window.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement) return;
  switch (e.key) {
    case " ":
      e.preventDefault();
      applySpeed(core.speed === 0 ? 1 : 0);
      break;
    case "1": applySpeed(1); break;
    case "2": applySpeed(2); break;
    case "3": applySpeed(4); break;
    case "Escape": panels.close(); break;
    case "r": case "R": renderer.recenter(); break;
    case "h": case "H": tutorial.start(true); break;
    default: return;
  }
});

/* ── 尺寸 ─────────────────────────────────────────────────── */
const ro = new ResizeObserver(() => renderer.resize());
ro.observe(scene);
window.addEventListener("orientationchange", () => setTimeout(() => renderer.resize(), 120));

/* ── 主循环 ───────────────────────────────────────────────── */
let lastView = core.view();
let hudAcc = 0;

/** 渲染一帧：视觉时间与逻辑倍速解耦，暂停时仍保留微弱的雪与火焰动态。 */
function drawFrame(realDt) {
  const speed = core.speed;
  lastView = core.view();
  const visDt = realDt * (speed === 0 ? 0.4 : Math.min(2.2, 0.8 + speed * 0.4));
  renderer.render(visDt, lastView);

  hudAcc += realDt;
  if (hudAcc >= 0.1) {
    hudAcc = 0;
    hud.update(lastView);
    panels.tick(lastView);
    if (renderer.hover) updateTooltip(renderer.hover);
  }
}

// 优先使用 engine/loop.js（定步长 + 倍速 + 追帧上限），否则退回内置 rAF 循环
const makeLoop = pickFn(ext.loop, "createLoop");
let engineLoop = null;
if (makeLoop) {
  try {
    const l = makeLoop({
      tickMs: TICK_MS,
      speed: core.speed,
      onTick: () => runTick(),
      onFrame: (c) => drawFrame(Math.min(0.1, c?.dtSec ?? 0.016)),
      onError: (err, phase) => console.warn(`[sanguo] loop ${phase} 出错`, err),
    });
    if (l && typeof l.start === "function" && typeof l.setSpeed === "function") {
      l.start();
      engineLoop = l;
    }
  } catch (err) {
    console.warn("[sanguo] engine/loop.js 不可用，改用内置循环", err);
  }
}

if (!engineLoop) {
  let acc = 0;
  let lastTs = performance.now();
  const frame = (now) => {
    const realDt = Math.min(0.1, (now - lastTs) / 1000);
    lastTs = now;
    acc += realDt * 1000 * core.speed;
    let guard = 0;
    while (acc >= TICK_MS && guard++ < 24) {
      acc -= TICK_MS;
      runTick();
    }
    drawFrame(realDt);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** 统一的流速入口：内核记录状态，外部 loop 负责实际时间缩放。 */
function applySpeed(n) {
  core.setSpeed(n);
  engineLoop?.setSpeed(core.speed);
  hud.update(core.view());
}

/* ── 启动收尾 ─────────────────────────────────────────────── */
hud.update(lastView);
app.dataset.boot = "ready";

if (loaded) {
  hud.toast(`读取存档 · 第 ${core.raw.day} 日`, "info", 2600);
} else {
  setTimeout(() => tutorial.start(false), 700);
}

console.info(
  `[三国·冰河时代] ${bridge.note}；武将名录来源：${HERO_TABLE.source}；` +
  `主循环：${engineLoop ? "engine/loop.js" : "内置 rAF"}`
);

// 供手工测试与调试
window.__sanguo = { core, renderer, hud, panels, tutorial, game, CITY_LAYOUT, bridge, applySpeed };
