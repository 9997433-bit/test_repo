import { HEROES, RARITY_MULT } from "../data/heroes.js";
import { isInjured, nowSeconds } from "./roster.js";

export const MAX_LINEUP = 5;
// 英雄表没写 growth 时的兜底成长，与 combat/battle.js 的 STAR_GROWTH 同值。
// （heroes 不许 import combat，见 ARCHITECTURE §1 冻结依赖边。）
const DEFAULT_GROWTH = 0.18;

function byCodePoint(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** 战力评分：只用于排序取舍，不参与战斗数值。成长口径与战斗一致，都读表里的 growth。 */
export function heroPower(heroKey, star) {
  const def = HEROES[heroKey];
  if (!def) return 0;
  const lv = Math.max(1, Math.min(5, Number.isFinite(star) ? star : 1));
  const growth = Number.isFinite(def.growth) ? def.growth : DEFAULT_GROWTH;
  const m = (RARITY_MULT[def.rarity] || 1) * (1 + (lv - 1) * growth);
  return (def.base.hp * 0.3 + def.base.atk * 2 + def.base.def * 1.5 + def.base.spd * 0.4) * m;
}

export function toBattleUnit(hero) {
  return { id: hero.id, heroKey: hero.heroKey, star: hero.star };
}

export function isReady(state, hero, now) {
  return Boolean(HEROES[hero.heroKey]) && !isInjured(state, hero, now);
}

/** 可出战名单：排除受伤与未知 key，按战力降序（平局用 heroKey 码点）。 */
export function readyHeroes(state) {
  const now = nowSeconds(state);
  return (state.heroes || [])
    .filter((h) => isReady(state, h, now))
    .slice()
    .sort(
      (a, b) =>
        heroPower(b.heroKey, b.star) - heroPower(a.heroKey, a.star) ||
        byCodePoint(a.heroKey, b.heroKey),
    );
}

/**
 * 确定性上阵：取战力前 max 名；若阵中一个前排都没有而板凳上有，
 * 用最强前排换掉最弱的一个，保证有人扛线（战斗里目标选择是前排优先）。
 * 返回顺序：前排在前，再按战力降序 —— 这也决定战斗里的入场序号。
 */
export function selectLineup(state, max) {
  const cap = Math.max(1, Math.min(MAX_LINEUP, Number.isFinite(max) ? max : MAX_LINEUP));
  const ready = readyHeroes(state);
  if (!ready.length) return [];

  const picked = ready.slice(0, cap);
  const isFront = (h) => HEROES[h.heroKey].lane === "front";
  if (!picked.some(isFront)) {
    const bench = ready.slice(cap).find(isFront);
    if (bench) picked[picked.length - 1] = bench;
  }

  return picked
    .slice()
    .sort(
      (a, b) =>
        Number(!isFront(a)) - Number(!isFront(b)) ||
        heroPower(b.heroKey, b.star) - heroPower(a.heroKey, a.star) ||
        byCodePoint(a.heroKey, b.heroKey),
    )
    .map(toBattleUnit);
}
