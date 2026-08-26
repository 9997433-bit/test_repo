/**
 * 桥接层 · 动作与推进
 * ------------------------------------------------------------------
 * 唯一允许写权威状态的地方。UI 的每个交互都落到这里的一个函数上，
 * 内部再调用 `js/systems/*` 的公开 API。
 *
 * tick 顺序（契约）：climate → city → economy → population → quests，
 * 调用前先 setCatalog，让无目录参数的系统 API 也能拿到建筑表。
 *
 * 随机：一律从 `createRng(state.meta.seed).fork(tag)` 派生，游标存在
 * `meta.rngCursors` 里随存档走，因此招募 / 战斗在同一存档上可复现。
 * 本文件不出现 Math.random。
 *
 * 少量 systems 尚未覆盖的机制（练兵、伤兵康复、太学典籍、燃料策略）
 * 在这里以最小实现补齐：它们只读写权威状态，不改动 systems 内部。
 */
import { TICK_SEC, TICKS_PER_DAY, clamp } from "../config.js";
import { createRng } from "../engine/rng.js";
import { defaultAdapter } from "../engine/save.js";
import { createInitialState } from "../state.js";
import * as city from "../systems/city.js";
import * as economy from "../systems/economy.js";
import * as climateSys from "../systems/climate.js";
import * as populationSys from "../systems/population.js";
import * as questSys from "../systems/quests.js";
import * as heroSys from "../systems/heroes.js";
import * as combat from "../systems/combat.js";
import {
  buildingInfo,
  canonicalBuildingId,
  canonicalHeroId,
  dedupeHeroCatalog,
  heroDefOf,
  projectQuests,
} from "./view.js";

const { num, obj, pushLog } = city;
const TROOP_TYPES = ["infantry", "cavalry", "archer"];

/* ------------------------------------------------------------------ *
 * 上下文
 * ------------------------------------------------------------------ */

/**
 * @param {object} init { state, catalog, heroCatalog, questCatalog, save }
 *   save 为 engine/save.js 的适配器，省略时用默认适配器（浏览器 localStorage / Node 内存）；
 *   autoClaimQuests 默认 true —— 达成即自动领取，奖励不会因为 UI 没接领赏而卡住。
 *   接了领赏入口（hud 的 onClaimQuest / panels 的 game.claimQuest）后传 false，
 *   任务就会停在 ready 上，托盘的「领赏」按钮与 view.quests[].canClaim 才有意义。
 * @returns {{state:object, catalog:object, heroCatalog:Array, questCatalog:Array,
 *            save:object, autoClaimQuests:boolean, events:Array}}
 */
export function createContext({ state, catalog, heroCatalog, questCatalog, save, autoClaimQuests } = {}) {
  const ctx = {
    state: state && typeof state === "object" ? state : createInitialState(1),
    catalog: city.catalogOf(catalog),
    // 名录先去重：data/heroes.js 的 liu_bei 与保底表的 liubei 是同一人，
    // 不合并的话卡池里会出现两个刘备。
    heroCatalog: dedupeHeroCatalog(
      Array.isArray(heroCatalog) && heroCatalog.length ? heroCatalog : heroSys.FALLBACK_HEROES,
    ),
    questCatalog: Array.isArray(questCatalog) && questCatalog.length ? questCatalog : questSys.FALLBACK_QUESTS,
    save: save && typeof save.exportSave === "function" ? save : defaultAdapter,
    autoClaimQuests: autoClaimQuests !== false,
    events: [],
  };
  prepare(ctx);
  return ctx;
}

/** 换一份 state（读档 / 重开）后重新挂目录与结构补齐。 */
export function adoptState(ctx, state) {
  ctx.state = state && typeof state === "object" ? state : createInitialState(1);
  prepare(ctx);
  return ctx.state;
}

/**
 * 结构补齐。每一步都兜住异常：读进来的存档可能残缺，
 * 但 createContext / importSave / restart 都不该因此抛给调用方。
 */
function prepare(ctx) {
  const s = ctx.state;
  safely("setCatalog", () => city.setCatalog(s, ctx.catalog));
  safely("ensureState", () => city.ensureState(s, ctx.catalog));
  safely("ensureHeroes", () => heroSys.ensureHeroesState(s));
  safely("ensureRoster", () => ensureRoster(s, ctx.heroCatalog));
  safely("ensureArmy", () => ensureArmy(s));
  s.meta = obj(s.meta);
  s.climate = obj(s.climate);
  if (typeof s.climate.fuelMode !== "string") s.climate.fuelMode = "auto";
  if (!s.tech || typeof s.tech !== "object") s.tech = {};
  if (!s.stats || typeof s.stats !== "object") s.stats = {};
  if (!s.meta.rngCursors || typeof s.meta.rngCursors !== "object") s.meta.rngCursors = {};
  safely("syncQuests", () => syncQuests(ctx, { silent: true }));
  safely("normalize", () => normalize(s));
  return s;
}

/**
 * roster 收口：
 * - state.js 用 star/exp，heroes.js 用 stars/xp，两边字段对齐；
 * - id 归一到名录写法（config 给的 `huatuo` 在名录里叫 `hua_tuo`），
 *   否则侧栏查不到 def，招募到同一人还会再入列一次；
 * - 归一后可能撞出重名，合并成战力更高的那条。
 */
function ensureRoster(state, heroCatalog) {
  const roster = state.heroes.roster;
  const byId = new Map();
  const remap = new Map();
  const merged = [];

  for (const entry of roster) {
    if (!entry || typeof entry !== "object" || !entry.id) continue;
    const id = canonicalHeroId(entry.id, heroCatalog);
    if (id !== entry.id) remap.set(entry.id, id);
    entry.id = id;
    entry.level = Math.max(1, Math.floor(num(entry.level, 1)));
    entry.stars = Math.max(1, Math.floor(num(entry.stars ?? entry.star, 1)));
    entry.star = entry.stars;
    entry.xp = Math.max(0, Math.floor(num(entry.xp ?? entry.exp, 0)));
    if (entry.garrisonBuildingId === undefined) entry.garrisonBuildingId = null;

    const prev = byId.get(id);
    if (!prev) {
      byId.set(id, entry);
      merged.push(entry);
      continue;
    }
    prev.stars = Math.max(prev.stars, entry.stars);
    prev.star = prev.stars;
    prev.level = Math.max(prev.level, entry.level);
    prev.xp += entry.xp;
    prev.garrisonBuildingId = prev.garrisonBuildingId ?? entry.garrisonBuildingId;
  }

  state.heroes.roster = merged;
  state.heroes.deployed = [
    ...new Set((state.heroes.deployed || []).map((id) => remap.get(id) ?? id)),
  ].filter((id) => byId.has(id));
  return merged;
}

function ensureArmy(state) {
  const army = (state.army = obj(state.army));
  for (const t of TROOP_TYPES) army[t] = Math.max(0, Math.floor(num(army[t], 0)));
  army.wounded = Math.max(0, Math.floor(num(army.wounded, 0)));
  if (!army.woundedByType || typeof army.woundedByType !== "object") {
    army.woundedByType = { infantry: army.wounded, cavalry: 0, archer: 0 };
  }
  if (!army._acc || typeof army._acc !== "object") army._acc = {};
  for (const t of TROOP_TYPES) {
    army.woundedByType[t] = Math.max(0, Math.floor(num(army.woundedByType[t], 0)));
    army._acc[t] = num(army._acc[t], 0);
  }
  army._acc.heal = num(army._acc.heal, 0);
  return army;
}

/* ------------------------------------------------------------------ *
 * 随机
 * ------------------------------------------------------------------ */

/** 取一条带游标的子随机流；用完调用 commit() 把游标写回存档。 */
function rngFor(state, tag) {
  const cursors = (state.meta.rngCursors = obj(state.meta.rngCursors));
  const stream = createRng(state?.meta?.seed ?? 1).fork(tag);
  const saved = num(cursors[tag], NaN);
  if (Number.isFinite(saved)) stream.setState(saved);
  return {
    float: () => stream.float(),
    stream,
    commit() {
      cursors[tag] = stream.getState();
    },
  };
}

/* ------------------------------------------------------------------ *
 * 太学典籍（systems 尚无科技模块，效果在 tick 末尾以增量方式施加）
 * ------------------------------------------------------------------ */

export const TECHS = [
  {
    id: "warmwall", name: "御寒夯土", icon: "🧱", reqLevel: 1,
    cost: { wood: 180, iron: 60 }, desc: "墙体夹填干草与兽皮，全城温度 +1.5°。", temp: 1.5,
  },
  {
    id: "ironaxe", name: "精钢利斧", icon: "🪓", reqLevel: 1,
    cost: { wood: 150, iron: 90 }, desc: "改良斧刃与锯，木材产出 +20%。", mul: { wood: 0.2 },
  },
  {
    id: "saltcure", name: "腌藏之法", icon: "🍖", reqLevel: 2,
    cost: { food: 220, iron: 120 }, desc: "以盐腌渍久藏，肉食产出 +20%。", mul: { food: 0.2 },
  },
  {
    id: "coalseam", name: "深层煤脉", icon: "🪨", reqLevel: 2,
    cost: { wood: 260, iron: 160 }, desc: "探明深层煤层，煤炭产出 +25%。", mul: { coal: 0.25 },
  },
  {
    id: "drill", name: "屯田练兵", icon: "⚔️", reqLevel: 3,
    cost: { food: 320, iron: 240 }, desc: "兵农合一，兵营征募速度 +30%。", train: 0.3,
  },
  {
    id: "taixue", name: "经世致用", icon: "📖", reqLevel: 3,
    cost: { wood: 340, iron: 280 }, desc: "以典籍教化流民，民心恢复 +30%。", morale: 0.3,
  },
];

function techBonus(state) {
  const out = { temp: 0, mul: { food: 0, wood: 0, coal: 0, iron: 0 }, train: 0, morale: 0 };
  const owned = obj(state.tech);
  for (const t of TECHS) {
    if (!owned[t.id]) continue;
    out.temp += num(t.temp, 0);
    out.train += num(t.train, 0);
    out.morale += num(t.morale, 0);
    for (const [res, v] of Object.entries(t.mul || {})) out.mul[res] = num(out.mul[res], 0) + num(v, 0);
  }
  return out;
}

/** 典籍列表（academy 面板消费）。 */
export function techList(ctx) {
  const level = city.levelOf(ctx.state, "academy");
  const owned = obj(ctx.state.tech);
  return TECHS.map((t) => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    desc: t.desc,
    cost: t.cost,
    reqLevel: t.reqLevel,
    state: owned[t.id] ? "done" : level >= t.reqLevel ? "open" : "lock",
  }));
}

/** 研习一项典籍。 */
export function research(ctx, id) {
  const s = ctx.state;
  const t = TECHS.find((x) => x.id === id);
  if (!t) return { ok: false, reason: "无此典籍" };
  if (obj(s.tech)[t.id]) return { ok: false, reason: "已研习" };
  const level = city.levelOf(s, "academy");
  if (level < t.reqLevel) return { ok: false, reason: `需书院 ${t.reqLevel} 级` };
  if (!city.pay(s, t.cost)) return { ok: false, reason: "物资不足" };
  s.tech[t.id] = true;
  pushLog(s, `书院研成《${t.name}》`, "good");
  return { ok: true, name: t.name };
}

/* ------------------------------------------------------------------ *
 * 燃料策略
 * ------------------------------------------------------------------ */

/**
 * climate.burnFuel 固定优先烧煤。想按策略烧柴时，在这一 tick 内把煤藏起来即可，
 * 燃料确实不够时不藏，避免因策略而无谓熄火。
 */
function withFuelPolicy(state, run) {
  const c = climateSys.climateConfig();
  const mode = state.climate.fuelMode || "auto";
  const blizzard = num(state.climate.blizzardDaysLeft, 0) > 0;
  const level = Math.max(num(state.city.furnaceLevel, 0), num(state.city.buildings?.furnace?.level, 0));
  const woodNeed = c.fuelWoodPerTick * level * (blizzard ? c.blizzardFuelMult : 1);
  const woodEnough = num(state.resources.wood, 0) >= woodNeed;
  const saveCoal = woodEnough && (mode === "wood" || (mode === "auto" && !blizzard));

  let stash = null;
  if (saveCoal && num(state.resources.coal, 0) > 0) {
    stash = state.resources.coal;
    state.resources.coal = 0;
  }
  try {
    run();
  } finally {
    if (stash !== null) state.resources.coal = num(state.resources.coal, 0) + stash;
  }
}

/** 切换燃料策略。 */
export function setFuelMode(ctx, mode) {
  const label = { wood: "木柴", coal: "石炭", auto: "自动" };
  if (!label[mode]) return { ok: false, reason: "未知的燃料策略" };
  ctx.state.climate.fuelMode = mode;
  pushLog(ctx.state, `燃料策略改为「${label[mode]}」`, "info");
  return { ok: true };
}

/* ------------------------------------------------------------------ *
 * 练兵（兵营 → 兵员）
 * ------------------------------------------------------------------ */

const BARRACKS = {
  barracks_inf: { troop: "infantry", cost: { food: 12, wood: 6, iron: 3 }, ticks: 8 },
  barracks_arch: { troop: "archer", cost: { food: 10, wood: 14, iron: 4 }, ticks: 10 },
  barracks_cav: { troop: "cavalry", cost: { food: 20, wood: 4, iron: 9 }, ticks: 12 },
};

/** 兵员上限：基础 20，每级兵营 +12。 */
export function troopCap(ctx) {
  const buildings = obj(ctx.state?.city?.buildings);
  let cap = 20;
  for (const id of Object.keys(BARRACKS)) cap += 12 * Math.max(0, num(buildings[id]?.level, 0));
  return cap;
}

function totalTroops(state) {
  return TROOP_TYPES.reduce((sum, t) => sum + Math.max(0, num(state.army[t], 0)), 0);
}

function tickTraining(ctx, bonus) {
  const s = ctx.state;
  const army = ensureArmy(s);
  const cap = troopCap(ctx);
  for (const [id, spec] of Object.entries(BARRACKS)) {
    const entry = obj(s.city.buildings[id]);
    const level = Math.max(0, num(entry.level, 0));
    const workers = Math.max(0, num(entry.workers, 0));
    if (level <= 0 || workers <= 0 || entry.constructing) continue;
    const rate = (workers / (spec.ticks * 2)) * (1 + 0.12 * (level - 1)) * (1 + bonus.train);
    army._acc[spec.troop] = num(army._acc[spec.troop], 0) + rate;
    while (army._acc[spec.troop] >= 1) {
      if (totalTroops(s) >= cap) {
        army._acc[spec.troop] = 0;
        break;
      }
      if (!city.pay(s, spec.cost)) {
        army._acc[spec.troop] = Math.min(army._acc[spec.troop], 0.999);
        break;
      }
      army._acc[spec.troop] -= 1;
      army[spec.troop] += 1;
      s.stats.troopsTrained = num(s.stats.troopsTrained, 0) + 1;
    }
  }

  // 伤兵康复：伤兵营 / 诊所等级越高越快
  const woundedTotal = TROOP_TYPES.reduce((sum, t) => sum + num(army.woundedByType[t], 0), 0);
  if (woundedTotal > 0) {
    const care = Math.max(city.levelOf(s, "hospital"), city.levelOf(s, "clinic"));
    army._acc.heal = num(army._acc.heal, 0) + (0.6 + care * 0.6) / TICKS_PER_DAY;
    while (army._acc.heal >= 1) {
      const type = TROOP_TYPES.find((t) => num(army.woundedByType[t], 0) > 0);
      if (!type) {
        army._acc.heal = 0;
        break;
      }
      army._acc.heal -= 1;
      army.woundedByType[type] -= 1;
      army[type] += 1;
    }
  }
  army.wounded = TROOP_TYPES.reduce((sum, t) => sum + num(army.woundedByType[t], 0), 0);
}

/* ------------------------------------------------------------------ *
 * tick
 * ------------------------------------------------------------------ */

/**
 * 推进一个逻辑 tick。返回本 tick 产生的事件（供 main.js 弹 toast / 横幅）。
 * 任何一个 system 抛错都不会中断整条流水线。
 */
export function tickAll(ctx) {
  const s = ctx.state;
  ctx.events = [];
  if (obj(s.flags).gameOver) {
    // 败亡也可能来自读档，而不是刚刚这一 tick：仍要归一原因并补报一次事件，
    // 否则 main.js 收不到通知，游戏不会暂停。
    normalize(s);
    ctx.events.push({ kind: "gameover", reason: s.flags.gameOverReason || "unknown" });
    return ctx.events;
  }

  const before = {
    blizzard: num(s.climate?.blizzardDaysLeft, 0),
    day: num(s.meta?.day, 1),
  };

  s.meta.tick = Math.max(0, Math.floor(num(s.meta.tick, 0))) + 1;
  s.meta.playTimeSec = Math.round((num(s.meta.playTimeSec, 0) + TICK_SEC) * 100) / 100;
  city.setCatalog(s, ctx.catalog);

  const bonus = techBonus(s);

  safely("climate", () => withFuelPolicy(s, () => climateSys.tickClimate?.(s)));
  safely("city", () => city.tickCity?.(s, ctx.catalog));
  safely("economy", () => economy.tickEconomy?.(s, ctx.catalog));
  safely("population", () => populationSys.tickPopulation?.(s));
  safely("tech", () => applyTech(s, bonus));
  safely("training", () => tickTraining(ctx, bonus));
  safely("quests", () => syncQuests(ctx));

  normalize(s);

  const after = num(s.climate?.blizzardDaysLeft, 0);
  if (before.blizzard <= 0 && after > 0) {
    ctx.events.push({ kind: "blizzard", text: `冰河寒潮降临 · 预计 ${after} 日`, level: "bad" });
  } else if (before.blizzard > 0 && after <= 0) {
    ctx.events.push({ kind: "clear", text: "寒潮退去，天光稍霁", level: "good" });
  }
  if (num(s.meta.day, 1) > before.day) ctx.events.push({ kind: "day", day: s.meta.day });
  if (obj(s.flags).gameOver) {
    ctx.events.push({ kind: "gameover", reason: s.flags.gameOverReason || "unknown" });
  }
  return ctx.events;
}

function safely(where, run) {
  try {
    run();
  } catch (err) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn(`[bridge] ${where} tick 异常：`, err?.message || err);
    }
  }
}

/** 典籍效果：温度按热惯性折算，产出按本 tick 实际产量补差。 */
function applyTech(state, bonus) {
  if (bonus.temp > 0) {
    state.climate.temp = Math.round((num(state.climate.temp, 0) + bonus.temp * climateSys.TEMP_INERTIA) * 100) / 100;
  }
  const production = obj(state.economy?.production);
  const cap = city.warehouseCap(state, state.city?.catalog);
  for (const [res, extra] of Object.entries(bonus.mul)) {
    if (extra <= 0) continue;
    const gain = num(production[res], 0) * extra;
    if (gain <= 0) continue;
    state.resources[res] = Math.round(
      clamp(num(state.resources[res], 0) + gain, 0, num(cap[res], Infinity)) * 100,
    ) / 100;
  }
  if (bonus.morale > 0) {
    const target = num(state.people.moraleTarget, 70);
    if (num(state.people.morale, 0) < target) {
      state.people.morale = Math.round(
        clamp(num(state.people.morale, 0) + (bonus.morale * 2.5) / TICKS_PER_DAY, 0, 100) * 100,
      ) / 100;
    }
  }
}

/**
 * 结构收口：让权威状态始终满足 state.assertState，否则 engine/save.js 读档时会整份丢弃。
 * - population.js 会把 flags.gameOver 写成失败原因字符串，这里转成布尔 + 原因字段；
 * - quests 系统用 entries/order，assertState 要求 active/completed 是数组，这里同步一份；
 * - 邸报补一个单调递增 id，HUD 靠它判断是否需要重绘。
 */
function normalize(state) {
  state.meta = obj(state.meta);
  const flags = (state.flags = obj(state.flags));
  if (flags.gameOver && typeof flags.gameOver !== "boolean") {
    flags.gameOverReason = String(flags.gameOver);
    flags.gameOver = true;
  }
  flags.gameOver = !!flags.gameOver;
  // 原因随 gameOver 走：败亡时必为非空字符串，未败亡时清空，投影层据此给出 false / 原因串。
  flags.gameOverReason = flags.gameOver ? String(flags.gameOverReason || "unknown") : "";
  flags.victory = !!flags.victory;
  if (typeof flags.tutorialStep !== "number") flags.tutorialStep = 0;

  const q = (state.quests = obj(state.quests));
  const entries = obj(q.entries);
  q.active = Object.values(entries)
    .filter((e) => e && (e.status === questSys.QUEST_STATUS.ACTIVE || e.status === questSys.QUEST_STATUS.READY))
    .map((e) => e.id);
  q.completed = Object.values(entries)
    .filter((e) => e && e.status === questSys.QUEST_STATUS.CLAIMED)
    .map((e) => e.id);

  ensureArmy(state);

  if (!Array.isArray(state.log)) state.log = [];
  let seq = Math.max(0, Math.floor(num(state.meta.logSeq, 0)));
  for (const line of state.log) {
    if (line && typeof line === "object" && !Number.isFinite(line.id)) line.id = ++seq;
  }
  state.meta.logSeq = seq;
  return state;
}

/* ------------------------------------------------------------------ *
 * 任务
 * ------------------------------------------------------------------ */

function questTitleOf(ctx, id) {
  const quest = ctx.questCatalog.find((q) => q && q.id === id);
  return quest?.title ?? quest?.name ?? id;
}

function rewardText(applied) {
  const names = { food: "肉食", wood: "木材", coal: "煤炭", iron: "精铁" };
  const parts = Object.entries(applied?.resources || {}).map(([k, v]) => `${names[k] || k} ${v}`);
  if (applied?.tickets) parts.push(`招募令 ${applied.tickets}`);
  if (applied?.heroXp) parts.push(`武将经验 ${applied.heroXp}`);
  if (applied?.heroes?.length) parts.push(`${applied.heroes.length} 名武将来投`);
  return parts.join(" · ") || "无";
}

/**
 * 刷新任务进度。ctx.autoClaimQuests 为真时达成即自动领取，奖励走邸报与 toast——
 * 这是给「UI 还没接领赏入口」的兜底，避免奖励永远卡在 ready 上拿不到。
 */
function syncQuests(ctx, { silent = false } = {}) {
  const s = ctx.state;
  const list = ctx.questCatalog;
  try {
    if (!s.quests || !s.quests.entries) questSys.initQuests(s, list);
    else questSys.tickQuests(s, list);
  } catch {
    return;
  }
  if (ctx.autoClaimQuests === false) return;
  const order = Array.isArray(s.quests.order) ? s.quests.order.slice() : [];
  for (const id of order) {
    const entry = s.quests.entries?.[id];
    if (!entry || entry.status !== questSys.QUEST_STATUS.READY) continue;
    const res = claimQuest(ctx, id);
    if (!res.ok) continue;
    if (!silent) {
      ctx.events.push({ kind: "quest", text: `任务达成 · ${res.title}`, level: "good" });
    }
  }
}

/** 未完成 / 已领取等拒绝理由，翻成给玩家看的话。 */
const CLAIM_REASONS = {
  "unknown-quest": "查无此任务",
  "already-claimed": "此功业已录",
  locked: "前置功业尚未达成",
  incomplete: "尚未达成，无法领赏",
};

/** 领取任务奖励。任何异常都收敛成 { ok:false, reason }，不向外抛。 */
export function claimQuest(ctx, questId) {
  const s = ctx.state;
  let res;
  try {
    res = questSys.claimQuest(s, questId, ctx.questCatalog, { heroCatalog: ctx.heroCatalog });
  } catch (err) {
    return { ok: false, reason: err?.message || "任务系统异常", questId };
  }
  if (!res || !res.ok) {
    return { ok: false, reason: CLAIM_REASONS[res?.reason] || res?.reason || "尚不可领取", questId };
  }
  const title = questTitleOf(ctx, questId);
  pushLog(s, `任务达成《${title}》，得 ${rewardText(res.rewards)}`, "good");
  safely("claimQuest", () => {
    ensureRoster(s, ctx.heroCatalog);
    normalize(s);
  });
  return { ok: true, questId, title, rewards: res.rewards };
}

/**
 * 任务列表：id / title / progress / canClaim / reward 摘要俱全，
 * 与 view.projectView 输出的 quests 是同一份形状（托盘与功业簿共用）。
 */
export function listQuests(ctx) {
  try {
    // 进度是现算的，但首次要把 entries 建起来（写状态只发生在这里，投影层只读）
    if (!ctx.state?.quests?.entries) questSys.initQuests(ctx.state, ctx.questCatalog);
    return projectQuests(ctx.state, { questCatalog: ctx.questCatalog });
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * 城建
 * ------------------------------------------------------------------ */

/** 开工升级 / 新建。返回 { ok, name, level }（level 为目标等级）。 */
export function upgrade(ctx, rawId) {
  const s = ctx.state;
  const id = canonicalBuildingId(rawId, ctx.catalog);
  const info = buildingInfo(s, id, ctx.catalog);
  if (!info) return { ok: false, reason: "没有这种建筑" };
  if (info.constructing) return { ok: false, reason: `${info.name}正在营建中` };
  const check = city.canUpgrade(s, id, ctx.catalog);
  if (!check.ok) return { ok: false, reason: check.text || "暂时无法营建" };
  if (!city.startUpgrade(s, id, ctx.catalog)) return { ok: false, reason: "开工失败" };
  const entry = city.getBuilding(s, id);
  return {
    ok: true,
    id,
    name: info.name,
    level: num(entry.targetLevel, info.level + 1),
    ticks: num(entry.buildTicks, 0),
  };
}

/** 撤销施工（返还七成）。 */
export function cancelUpgrade(ctx, rawId) {
  const id = canonicalBuildingId(rawId, ctx.catalog);
  return { ok: city.cancelUpgrade(ctx.state, id, ctx.catalog) };
}

/** 派驻工人到绝对人数。 */
export function assignWorkers(ctx, rawId, count) {
  const s = ctx.state;
  const id = canonicalBuildingId(rawId, ctx.catalog);
  const def = city.defOf(ctx.catalog, id);
  const entry = city.getBuilding(s, id);
  if (!def || !entry) return { ok: false, reason: "没有这种建筑" };

  const want = Math.max(0, Math.floor(num(count, NaN)));
  if (!Number.isFinite(want)) return { ok: false, reason: "人数不合法" };
  const slots = city.workerSlots(def, entry.level);
  if (slots <= 0) return { ok: false, reason: "此建筑无需派工" };
  if (want > slots) return { ok: false, reason: `${def.name || id}只有 ${slots} 个工位` };

  const healthy = Math.max(0, num(s.people.pop, 0) - num(s.people.sick, 0));
  const others = city.assignedWorkers(s) - Math.max(0, num(entry.workers, 0));
  if (want + others > healthy) {
    return { ok: false, reason: `已无闲置丁口（余 ${Math.max(0, healthy - others)} 人）` };
  }
  if (!city.assignWorkers(s, id, want, ctx.catalog)) return { ok: false, reason: "派工失败" };
  return { ok: true, id, workers: want, maxWorkers: slots };
}

/** 增减一名工人（面板的 ± 按钮）。 */
export function addWorker(ctx, rawId, delta) {
  const id = canonicalBuildingId(rawId, ctx.catalog);
  const entry = city.getBuilding(ctx.state, id);
  if (!entry) return { ok: false, reason: "没有这种建筑" };
  const next = Math.max(0, num(entry.workers, 0) + Math.trunc(num(delta, 0)));
  if (next === entry.workers) return { ok: false, reason: delta > 0 ? "工位已满" : "已无工人" };
  return assignWorkers(ctx, id, next);
}

/* ------------------------------------------------------------------ *
 * 招贤
 * ------------------------------------------------------------------ */

export function ticketCost() {
  return { food: 120, iron: 60 };
}

/** 以资换令。 */
export function buyTicket(ctx) {
  const s = ctx.state;
  if (!city.pay(s, ticketCost())) return { ok: false, reason: "肉食或精铁不足" };
  s.heroes.tickets = num(s.heroes.tickets, 0) + 1;
  return { ok: true, tickets: s.heroes.tickets };
}

function heroCardOf(ctx, heroId, entry) {
  const def = heroDefOf(heroId, ctx.heroCatalog);
  const inst = { level: num(entry?.level, 1), stars: num(entry?.stars, 1) };
  return {
    id: heroId,
    name: def?.name || heroId,
    title: def?.title || "",
    faction: def?.faction || "qun",
    quality: def?.quality || "blue",
    troop: def?.troop || "infantry",
    skill: def?.skill?.name || "",
    skillDesc: def?.skill?.desc || "",
    level: inst.level,
    stars: inst.stars,
    power: def ? heroSys.heroPower(def, inst) : 0,
  };
}

/**
 * 招募 times 次。十连保底：若前九抽全蓝，最后一抽强制紫及以上。
 * 抽取用 meta.seed 派生的 recruit 流，同存档可复现。
 */
export function recruit(ctx, times) {
  const s = ctx.state;
  const n = Math.max(1, Math.floor(num(times, 1)));
  if (num(s.heroes.tickets, 0) < n) return { ok: false, reason: `招募令不足（需 ${n} 张）` };

  const rng = rngFor(s, "recruit");
  const results = [];
  for (let i = 0; i < n; i++) {
    let forced = null;
    const guaranteed = n >= 10 && i === n - 1 && results.every((r) => r.hero.quality === "blue");
    if (guaranteed) {
      const pool = ctx.heroCatalog.filter((h) => h && h.quality && h.quality !== "blue");
      if (pool.length) forced = pool[Math.floor(clamp(rng.float(), 0, 0.999999) * pool.length)];
    }
    const res = heroSys.recruitHero(s, forced, rng.float, { pool: ctx.heroCatalog });
    if (!res.ok) {
      rng.commit();
      return { ok: false, reason: res.reason === "no-tickets" ? "招募令不足" : "名录为空" };
    }
    ensureRoster(s, ctx.heroCatalog);
    const heroId = canonicalHeroId(res.heroId, ctx.heroCatalog);
    const entry = s.heroes.roster.find((e) => e && e.id === heroId);
    const hero = heroCardOf(ctx, heroId, entry);
    results.push({ hero, dupe: !res.isNew });
    if (res.isNew && (hero.quality === "red" || hero.quality === "orange")) {
      pushLog(s, `${hero.name} 来投！`, "good");
    }
  }
  rng.commit();
  s.stats.recruitCount = num(s.heroes.recruitCount, 0);
  return { ok: true, results };
}

/* ------------------------------------------------------------------ *
 * 讨伐
 * ------------------------------------------------------------------ */

const RAID_TIERS = [1, 2, 3, 5, 8];
const DIFFICULTY = [1, 1, 2, 2, 3];
const FACTION_NAMES = { wei: "魏", shu: "蜀", wu: "吴", qun: "群" };

function encounterOf(ctx, tier) {
  // 同一存档同一档位固定，不随 tick 抖动
  const rng = createRng(`${ctx.state?.meta?.seed ?? 1}:raid:${tier}`);
  const day = Math.max(1, (tier - 1) * combat.RAID_DAYS_PER_TIER);
  return combat.makeRaidEncounter(day, () => rng.float());
}

/** 讨伐目标列表。 */
export function targets(ctx) {
  return RAID_TIERS.map((tier, i) => {
    const enc = encounterOf(ctx, tier);
    const total = TROOP_TYPES.reduce((sum, t) => sum + num(enc.troops[t], 0), 0);
    return {
      id: `t${tier}`,
      tier,
      name: enc.name,
      faction: enc.faction,
      troop: "infantry",
      difficulty: DIFFICULTY[i] || 2,
      power: enc.recommendedPower,
      desc: `${FACTION_NAMES[enc.faction] || "群"}系流寇，约 ${total} 众${enc.heroes.length ? "，有将领坐镇" : ""}。`,
      loot: enc.rewards.resources,
      ticket: num(enc.rewards.tickets, 0),
      cleared: !!obj(ctx.state.stats)[`clear_t${tier}`],
      encounter: enc,
    };
  });
}

function heroUnitsOf(ctx, heroIds) {
  const roster = ctx.state.heroes.roster;
  const out = [];
  for (const raw of heroIds || []) {
    const id = canonicalHeroId(raw, ctx.heroCatalog);
    const entry = roster.find((e) => e && e.id === id);
    const def = heroDefOf(id, ctx.heroCatalog);
    if (entry && def) out.push({ def, inst: { level: entry.level, stars: entry.stars } });
  }
  return out;
}

/** 按当前编成把 count 名士兵拆成步/骑/弓。 */
function splitTroops(state, count) {
  const army = state.army;
  const total = totalTroops(state);
  const want = clamp(Math.floor(num(count, 0)), 0, total);
  const out = { infantry: 0, cavalry: 0, archer: 0 };
  if (want <= 0 || total <= 0) return out;
  let left = want;
  for (const t of TROOP_TYPES) {
    const share = Math.min(num(army[t], 0), Math.round((num(army[t], 0) / total) * want));
    out[t] = share;
    left -= share;
  }
  for (const t of TROOP_TYPES) {
    if (left === 0) break;
    const room = num(army[t], 0) - out[t];
    const take = clamp(left, -out[t], room);
    out[t] += take;
    left -= take;
  }
  return out;
}

function sidePower(troops, heroUnits) {
  let atk = 0;
  for (const t of TROOP_TYPES) atk += num(troops[t], 0) * combat.TROOP_STATS[t].atk;
  let heroAtk = 0;
  for (const u of heroUnits) heroAtk += heroSys.heroStats(u.def, u.inst).atk;
  const bonus = heroSys.factionBonus(heroUnits.map((u) => u.def));
  return atk * (1 + heroAtk / combat.HERO_SCALE.atk) * bonus.atkMul;
}

/** 出征前的胜算预览（不消耗随机流，不改 state）。 */
export function previewRaid(ctx, targetId, heroIds, troopCount) {
  const s = ctx.state;
  const target = targets(ctx).find((t) => t.id === targetId);
  if (!target) return { ok: false, reason: "请选择讨伐目标" };
  const units = heroUnitsOf(ctx, heroIds);
  if (!units.length) return { ok: false, reason: "至少点将 1 人" };
  const count = Math.floor(num(troopCount, 0));
  if (count < 10) return { ok: false, reason: "兵力不足 10，无法出征" };
  if (count > totalTroops(s)) return { ok: false, reason: "兵力不足" };

  const mine = splitTroops(s, count);
  const enc = target.encounter;
  const atk = sidePower(mine, units) * (0.85 + num(s.people.morale, 0) / 200);
  const def = sidePower(enc.troops, enc.heroes);
  const notes = [];
  const bonus = heroSys.factionBonus(units.map((u) => u.def));
  if (bonus.count >= 3) notes.push(`同阵营 ${bonus.count} 人 +${Math.round((bonus.atkMul - 1) * 100)}%`);
  const adv = combat.troopAdvantage(mine, enc.troops);
  if (adv > 1.02) notes.push("兵种克制");
  else if (adv < 0.98) notes.push("兵种被克");
  const fadv = combat.factionAdvantage(units[0]?.def?.faction, enc.faction);
  if (fadv > 1.01) notes.push("阵营克制");

  return {
    ok: true,
    target,
    atk: Math.round(atk),
    def: Math.round(def),
    odds: clamp(atk / (atk + def * 0.92), 0.03, 0.97),
    bonusText: notes.slice(0, 2).join(" · "),
  };
}

const TROOP_LABEL = { infantry: "步卒", cavalry: "铁骑", archer: "弓手" };

/** 出征。战斗由 systems/combat.js 结算，随机流来自 meta.seed。 */
export function raid(ctx, targetId, heroIds, troopCount) {
  const s = ctx.state;
  const pv = previewRaid(ctx, targetId, heroIds, troopCount);
  if (!pv.ok) return { ok: false, reason: pv.reason };

  const enc = pv.target.encounter;
  const units = heroUnitsOf(ctx, heroIds);
  const mine = splitTroops(s, troopCount);
  const rng = rngFor(s, "battle");
  const result = combat.resolveBattle({
    rng: rng.float,
    attackers: { troops: mine, heroes: units },
    defenders: { troops: enc.troops, heroes: enc.heroes, faction: enc.faction, rewards: enc.rewards },
  });
  rng.commit();

  // combat 用 army.troops{} 嵌套，权威状态是扁平 army；用影子对象结算再写回。
  const shadow = {
    resources: s.resources,
    heroes: s.heroes,
    stats: s.stats,
    war: (s.war = obj(s.war)),
    day: s.meta.day,
    army: {
      troops: { infantry: s.army.infantry, cavalry: s.army.cavalry, archer: s.army.archer },
      wounded: { infantry: 0, cavalry: 0, archer: 0 },
    },
  };
  const applied = combat.applyBattleResult(shadow, result);
  for (const t of TROOP_TYPES) {
    s.army[t] = Math.max(0, Math.floor(num(shadow.army.troops[t], 0)));
    s.army.woundedByType[t] = num(s.army.woundedByType[t], 0) + Math.max(0, num(shadow.army.wounded[t], 0));
  }
  ensureArmy(s);

  const cap = city.warehouseCap(s, ctx.catalog);
  for (const res of Object.keys(obj(s.resources))) {
    s.resources[res] = Math.round(clamp(num(s.resources[res], 0), 0, num(cap[res], Infinity)) * 100) / 100;
  }

  if (result.win) s.stats[`clear_t${pv.target.tier}`] = true;
  s.people.morale = clamp(num(s.people.morale, 0) + (result.win ? 5 : -4), 0, 100);
  pushLog(
    s,
    result.win
      ? `讨伐${pv.target.name}大捷，折兵 ${result.lossesTotal}`
      : `讨伐${pv.target.name}失利，折兵 ${result.lossesTotal}`,
    result.win ? "good" : "bad",
  );
  ensureRoster(s, ctx.heroCatalog);
  normalize(s);

  const rounds = result.log
    .filter((e) => e && e.round > 0)
    .map((e) => {
      const skill = (e.events || []).find((x) => x.side === "attacker" && x.skill);
      const hero = skill ? heroDefOf(skill.hero, ctx.heroCatalog) : null;
      const lead = hero ? `<b>${hero.name}</b> 率${TROOP_LABEL[hero.troop] || "步卒"}突阵，` : "";
      return (
        `${lead}斩敌 <span class="dmg">${e.attackerDamage}</span>；` +
        `我军受创 <span class="dis">${e.defenderDamage}</span>。`
      );
    });
  rounds.push(
    result.win
      ? `<b>${pv.target.name}</b> 阵脚崩溃，我军<span class="adv">全线掩杀</span>。`
      : `我军力竭，<b>${pv.target.name}</b> 反扑得手，只得<span class="dis">鸣金收兵</span>。`,
  );

  return {
    ok: true,
    result,
    report: {
      win: result.win,
      targetName: pv.target.name,
      day: s.meta.day,
      rounds,
      loot: applied.applied.resources,
      ticket: applied.applied.tickets,
      losses: result.lossesTotal,
      wounded: result.woundedTotal,
      exp: applied.applied.heroXp,
      summary:
        `${result.rounds} 合 · 我军 ${pv.atk} 对 敌军 ${pv.def} · ` +
        `伤兵 ${result.woundedTotal} · 民心 ${result.win ? "+5" : "−4"}`,
    },
  };
}

/* ------------------------------------------------------------------ *
 * 存档
 * ------------------------------------------------------------------ *
 * engine/save.js 的默认适配器在浏览器里用 localStorage，Node 里自动退回内存实现，
 * 因此这一组动作在测试环境同样可用。导入导出面向玩家，失败要有明确理由，
 * 所以一律收敛成 { ok, reason }，不把异常抛给 UI。
 */

function adapterOf(ctx) {
  const a = ctx?.save;
  return a && typeof a.exportSave === "function" ? a : defaultAdapter;
}

/** 写入本地存档。 */
export function saveGame(ctx) {
  try {
    return { ok: adapterOf(ctx).saveGame(ctx.state) === true };
  } catch (err) {
    return { ok: false, reason: err?.message || "存档写入失败" };
  }
}

/** 读取本地存档并接管（无存档返回 ok:false）。 */
export function loadGame(ctx) {
  let state;
  try {
    state = adapterOf(ctx).loadGame();
  } catch (err) {
    return { ok: false, reason: err?.message || "存档读取失败" };
  }
  if (!state) return { ok: false, reason: "没有可用的存档" };
  adoptState(ctx, state);
  return { ok: true, state: ctx.state };
}

/** 导出为可复制 / 可下载的 JSON 文本。 */
export function exportSave(ctx) {
  try {
    const text = adapterOf(ctx).exportSave(ctx.state);
    return { ok: true, text, day: num(ctx.state?.meta?.day, 1) };
  } catch (err) {
    return { ok: false, reason: err?.message || "导出失败" };
  }
}

/** 一份存档至少该有的顶层结构。 */
const SAVE_SHAPE_KEYS = ["meta", "resources", "climate", "city", "people", "army", "heroes", "flags"];

/**
 * state.js 的 normalizeState 足够宽容——`{"foo":1}` 也能被补成一份崭新存档，
 * 直接交给它会把玩家正在玩的局面悄无声息地清空。导入前先看「像不像存档」。
 */
function looksLikeSave(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (typeof payload.format === "string" && payload.format !== "sanguo-ice-age") return false;
  const body = payload.state && typeof payload.state === "object" ? payload.state : payload;
  const hits = SAVE_SHAPE_KEYS.filter((k) => body[k] && typeof body[k] === "object").length;
  return hits >= 3;
}

/** 导入存档文本；校验通过才接管，失败时当前局面原样保留。 */
export function importSave(ctx, json) {
  let payload;
  if (typeof json === "string") {
    if (json.trim() === "") return { ok: false, reason: "存档内容为空" };
    try {
      payload = JSON.parse(json);
    } catch {
      return { ok: false, reason: "存档不是合法 JSON" };
    }
  } else {
    payload = json;
  }
  if (!looksLikeSave(payload)) return { ok: false, reason: "这不像一份《三国·冰河时代》的存档" };

  let state;
  try {
    state = adapterOf(ctx).importSave(payload);
  } catch (err) {
    return { ok: false, reason: err?.message || "存档无法解析" };
  }
  if (!state || typeof state !== "object") return { ok: false, reason: "存档结构无法识别" };
  adoptState(ctx, state);
  pushLog(ctx.state, "读入外部存档。", "info");
  return { ok: true, state: ctx.state, day: num(ctx.state?.meta?.day, 1) };
}

/** 删除本地存档。 */
export function clearSave(ctx) {
  try {
    return { ok: adapterOf(ctx).clearSave() === true };
  } catch (err) {
    return { ok: false, reason: err?.message || "删除存档失败" };
  }
}

/** 本地是否已有存档。 */
export function hasSave(ctx) {
  try {
    return adapterOf(ctx).hasSave() === true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * 重开
 * ------------------------------------------------------------------ */

/**
 * 重开一局（可指定新种子）。默认保留本地存档，交由调用方决定是否 clearSave；
 * 传 { clearSave: true } 时一并抹掉。
 */
export function restart(ctx, seed, { clearSave: wipe = false } = {}) {
  if (wipe) clearSave(ctx);
  const next = createInitialState(seed ?? ctx.state?.meta?.seed ?? 1);
  adoptState(ctx, next);
  return ctx.state;
}
