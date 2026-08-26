import { HEROES } from "../data/heroes.js";
import { REASON, allow, deny } from "../core/reasons.js";

export const MAX_STAR = 5;
export const SHARD_PER_STAR = 10;
export const RECRUIT_BUILDING = "radio";
// 战败英雄的休整时长（模拟秒）。tick 是 0.1s 量子，300 秒 ≈ 3000 量子。
export const INJURY_SECONDS = 300;
const LOG_LIMIT = 24;

function pushLog(state, line) {
  return [line, ...(state.log || [])].slice(0, LOG_LIMIT);
}

/** 当前模拟时刻（秒）。meta.tick 是唯一时间轴，一个量子 0.1 秒。 */
export function nowSeconds(state) {
  const tick = state && state.meta && Number.isFinite(state.meta.tick) ? state.meta.tick : 0;
  return tick * 0.1;
}

export function findHero(state, heroId) {
  return (state.heroes || []).find((h) => h.id === heroId) || null;
}

export function isInjured(state, hero, now) {
  if (!hero) return false;
  const at = Number.isFinite(now) ? now : nowSeconds(state);
  return Number.isFinite(hero.injuredUntil) && hero.injuredUntil > at;
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
 * 把战报里阵亡的己方英雄挂上养伤计时，并让他们自动离岗
 * （离岗后 tickWorld 的委任加成随之消失，injuredUntil 才算真正有消费者）。
 * 无人阵亡时返回入参原引用。
 */
export function applyBattleInjuries(state, result, seconds) {
  if (!result || !Array.isArray(result.leftover)) return state;
  const span = Number.isFinite(seconds) && seconds > 0 ? seconds : INJURY_SECONDS;
  const now = nowSeconds(state);
  const fallen = new Set(
    result.leftover.filter((u) => u.side === "ally" && u.hp <= 0).map((u) => u.id),
  );
  const hurt = (state.heroes || []).filter((h) => fallen.has(h.id));
  if (!hurt.length) return state;

  const heroes = state.heroes.map((h) =>
    fallen.has(h.id) ? { ...h, injuredUntil: now + span, assignedBuildingId: null } : h,
  );
  const buildings = (state.buildings || []).map((b) =>
    b.occupantHeroId && fallen.has(b.occupantHeroId) ? { ...b, occupantHeroId: null } : b,
  );
  const names = hurt
    .map((h) => (HEROES[h.heroKey] ? HEROES[h.heroKey].name : h.heroKey))
    .join("、");
  return { ...state, heroes, buildings, log: pushLog(state, `${names}挂了彩，抬回木筏养伤。`) };
}

/** 手动销假：把已经过期的养伤标记归零，读档后清理用。无变化返回原引用。 */
export function clearHealed(state) {
  const now = nowSeconds(state);
  if (!(state.heroes || []).some((h) => Number.isFinite(h.injuredUntil) && h.injuredUntil > 0 && h.injuredUntil <= now)) {
    return state;
  }
  return {
    ...state,
    heroes: state.heroes.map((h) =>
      Number.isFinite(h.injuredUntil) && h.injuredUntil > 0 && h.injuredUntil <= now
        ? { ...h, injuredUntil: 0 }
        : h,
    ),
  };
}
