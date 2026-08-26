import { HEROES } from "../data/heroes.js";
import { REASON, allow, deny } from "../core/reasons.js";

export const MAX_STAR = 5;
export const SHARD_PER_STAR = 10;
export const RECRUIT_BUILDING = "radio";
// 一个模拟量子的秒数，与 core/engine.js 的 QUANTUM 同值。
export const TICK_SECONDS = 0.1;
// 战败英雄的休整时长（模拟秒）。300 秒 = 3000 个量子。
export const INJURY_SECONDS = 300;
const LOG_LIMIT = 24;

function pushLog(state, line) {
  return [line, ...(state.log || [])].slice(0, LOG_LIMIT);
}

/** 当前模拟时刻（秒）。meta.tick 是唯一时间轴，一个量子 0.1 秒。 */
export function nowSeconds(state) {
  const tick = state && state.meta && Number.isFinite(state.meta.tick) ? state.meta.tick : 0;
  return tick * TICK_SECONDS;
}

/** 对齐到量子网格：养伤到期时刻必须正好落在某个 tick 上，销假才可复现。 */
function onGrid(seconds) {
  return Math.round(Math.ceil(seconds / TICK_SECONDS) * TICK_SECONDS * 10) / 10;
}

function heroName(hero) {
  const def = HEROES[hero.heroKey];
  return def ? def.name : hero.heroKey;
}

export function findHero(state, heroId) {
  return (state.heroes || []).find((h) => h.id === heroId) || null;
}

export function isInjured(state, hero, now) {
  if (!hero) return false;
  const at = Number.isFinite(now) ? now : nowSeconds(state);
  return Number.isFinite(hero.injuredUntil) && hero.injuredUntil > at;
}

/** 还要养多久（模拟秒）。健康或已到期返回 0 —— UI 拿它显示倒计时。 */
export function injuryRemaining(state, hero, now) {
  if (!hero || !Number.isFinite(hero.injuredUntil)) return 0;
  const at = Number.isFinite(now) ? now : nowSeconds(state);
  return hero.injuredUntil > at ? Math.round((hero.injuredUntil - at) * 10) / 10 : 0;
}

export function hasRecruitStation(state) {
  return (state.buildings || []).some((b) => b.type === RECRUIT_BUILDING);
}

/* ------------------------------- 招募 ------------------------------- */

export function canRecruit(state, heroKey) {
  const def = HEROES[heroKey];
  if (!def) return deny(REASON.UNKNOWN_TYPE);
  if ((state.heroes || []).some((h) => h.heroKey === heroKey)) return deny(REASON.DUPLICATE);
  // 首个英雄免广播站（契约 §8 冻结），之后必须先造广播站呼救。
  if (!hasRecruitStation(state) && (state.heroes || []).length > 0) {
    return deny(REASON.REQUIRES_BUILDING, { need: RECRUIT_BUILDING, message: "先造广播站才呼得到人" });
  }
  return allow({ def });
}

export function recruit(state, heroKey) {
  const check = canRecruit(state, heroKey);
  if (!check.ok) return state;
  const def = check.def;
  return {
    ...state,
    heroes: [
      ...state.heroes,
      { id: `h-${heroKey}`, heroKey, star: 1, xp: 0, assignedBuildingId: null, injuredUntil: 0 },
    ],
    log: pushLog(state, `${def.name}上筏了。老大，这人能打。`),
  };
}

/* ------------------------------- 委任 ------------------------------- */

export function canAssign(state, heroId, buildingId) {
  const hero = findHero(state, heroId);
  if (!hero) return deny(REASON.NOT_FOUND, { message: "没有这位英雄" });
  // buildingId 为 null/undefined 表示卸任，永远允许（受伤也能撤下来）。
  if (buildingId === null || buildingId === undefined) {
    return allow({ hero, building: null, displaced: null, unassign: true });
  }
  const building = (state.buildings || []).find((b) => b.id === buildingId);
  if (!building) return deny(REASON.NOT_FOUND, { message: "没有这座建筑" });
  if (isInjured(state, hero)) {
    return deny(REASON.LOCKED, { until: hero.injuredUntil, message: "这位还在养伤，先歇着" });
  }
  // 委任互斥：一座建筑只留一个英雄，被顶下来的那位必须一起清干净。
  const displaced =
    (state.heroes || []).find((h) => h.id !== hero.id && h.assignedBuildingId === buildingId) ||
    (building.occupantHeroId && building.occupantHeroId !== hero.id
      ? findHero(state, building.occupantHeroId)
      : null) ||
    null;
  return allow({ hero, building, displaced, unassign: false });
}

export function assignHero(state, heroId, buildingId) {
  const target = buildingId === undefined ? null : buildingId;
  const check = canAssign(state, heroId, target);
  if (!check.ok) return state;

  const hero = check.hero;
  const displacedId = check.displaced ? check.displaced.id : null;

  const buildings = (state.buildings || []).map((b) => {
    if (target !== null && b.id === target) return { ...b, occupantHeroId: heroId };
    if (b.occupantHeroId === heroId) return { ...b, occupantHeroId: null };
    return b;
  });

  const heroes = state.heroes.map((h) => {
    if (h.id === heroId) return { ...h, assignedBuildingId: target };
    // 被顶掉的英雄不能留悬挂引用。
    if (target !== null && (h.id === displacedId || h.assignedBuildingId === target)) {
      return { ...h, assignedBuildingId: null };
    }
    return h;
  });

  const name = HEROES[hero.heroKey] ? HEROES[hero.heroKey].name : hero.heroKey;
  let line;
  if (target === null) line = `${name}卸任，回去晒太阳。`;
  else if (displacedId) {
    const other = HEROES[check.displaced.heroKey];
    line = `${name}顶掉${other ? other.name : check.displaced.heroKey}，接手岗位。`;
  } else line = `${name}上岗了，产出加速。`;

  return { ...state, buildings, heroes, log: pushLog(state, line) };
}

/* ------------------------------- 升星 ------------------------------- */

export function canStarUp(state, heroId) {
  const hero = findHero(state, heroId);
  if (!hero) return deny(REASON.NOT_FOUND, { message: "没有这位英雄" });
  if (hero.star >= MAX_STAR) return deny(REASON.MAX_STAR, { need: 0 });
  const need = hero.star * SHARD_PER_STAR;
  const have = (state.resources && state.resources.shard) || 0;
  if (have < need) return deny(REASON.COST, { need, have, message: `还差 ${need - have} 块碎片` });
  return allow({ hero, need, have });
}

export function starUp(state, heroId) {
  const check = canStarUp(state, heroId);
  if (!check.ok) return state;
  const hero = check.hero;
  const def = HEROES[hero.heroKey];
  return {
    ...state,
    resources: { ...state.resources, shard: state.resources.shard - check.need },
    heroes: state.heroes.map((h) => (h.id === heroId ? { ...h, star: h.star + 1 } : h)),
    log: pushLog(state, `${def ? def.name : hero.heroKey}升到 ${hero.star + 1} 星，脾气更大了。`),
  };
}

/* ------------------------------- 伤病 ------------------------------- */

/**
 * 把战报里阵亡的己方英雄挂上养伤计时，并让他们自动离岗。
 *
 * 与时间轴的联动全在这里收口：
 *   - 到期时刻 = nowSeconds(state) + span，锚在 meta.tick 上并对齐量子网格，
 *     所以「养多久」由 tick 推进说了算，不需要谁替它计时；
 *   - 已经在养伤的人只会被延长、不会被新战报缩短（取 max）；
 *   - 同步离岗（英雄侧 + 建筑侧），tickWorld 的委任加成当场消失；
 *   - 之后 isInjured / readyHeroes / selectLineup / canAssign 都读同一个 tick 时刻，
 *     tick 走过 injuredUntil 的那一刻英雄自动可用，tickInjuries 只是补一条归队日志。
 *
 * 无人阵亡时返回入参原引用。
 */
export function applyBattleInjuries(state, result, seconds) {
  if (!result || !Array.isArray(result.leftover)) return state;
  const span = Number.isFinite(seconds) && seconds > 0 ? seconds : INJURY_SECONDS;
  const until = onGrid(nowSeconds(state) + span);
  const fallen = new Set(
    result.leftover.filter((u) => u.side === "ally" && u.hp <= 0).map((u) => u.id),
  );
  const hurt = (state.heroes || []).filter((h) => fallen.has(h.id));
  if (!hurt.length) return state;

  const heroes = state.heroes.map((h) => {
    if (!fallen.has(h.id)) return h;
    const prev = Number.isFinite(h.injuredUntil) ? h.injuredUntil : 0;
    return { ...h, injuredUntil: Math.max(prev, until), assignedBuildingId: null };
  });
  const buildings = (state.buildings || []).map((b) =>
    b.occupantHeroId && fallen.has(b.occupantHeroId) ? { ...b, occupantHeroId: null } : b,
  );
  const names = hurt.map(heroName).join("、");
  return { ...state, heroes, buildings, log: pushLog(state, `${names}挂了彩，抬回木筏养伤。`) };
}

/** 到点该销假的人。按 heroes 数组序，稳定。 */
function healedHeroes(state, now) {
  return (state.heroes || []).filter(
    (h) => Number.isFinite(h.injuredUntil) && h.injuredUntil > 0 && h.injuredUntil <= now,
  );
}

/** 手动销假：把已经过期的养伤标记归零，读档后清理用。无变化返回原引用。 */
export function clearHealed(state) {
  const now = nowSeconds(state);
  if (!healedHeroes(state, now).length) return state;
  return {
    ...state,
    heroes: state.heroes.map((h) =>
      Number.isFinite(h.injuredUntil) && h.injuredUntil > 0 && h.injuredUntil <= now
        ? { ...h, injuredUntil: 0 }
        : h,
    ),
  };
}

/**
 * 每量子推进伤病：销假 + 归队日志。纯函数，没人到期就返回原引用，
 * 挂在 stepSim 的每个量子上零成本（99.9% 的量子直接命中原引用短路）。
 */
export function tickInjuries(state) {
  const healed = healedHeroes(state, nowSeconds(state));
  if (!healed.length) return state;
  const names = healed.map(heroName).join("、");
  return { ...clearHealed(state), log: pushLog(state, `${names}养好了，随时能上。`) };
}
