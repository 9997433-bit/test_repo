/**
 * 养成计算：等级 / 星级 / 图鉴 / 羁绊 / 钓鱼 BUFF 汇总成一支出战队伍。
 *
 * `src/progression/**` 归 Opus-3，这里只做 UI 主循环需要的最小可玩计算，
 * 后续可整体替换为上游实现（接口：buildLoadout(save) → { heroes, bonds, ... }）。
 */
import { computeBonds, computeRaceTech, getHero } from "./catalog.js";

export const MAX_LEVEL = 40;
export const MAX_STAR = 5;

export function heroLevel(save, id) {
  return Math.min(MAX_LEVEL, Math.max(1, save?.heroLevels?.[id] ?? 1));
}

export function heroStar(save, id) {
  return Math.min(MAX_STAR, Math.max(1, save?.heroStars?.[id] ?? 1));
}

export function levelUpCost(level) {
  return Math.round(60 * Math.pow(1.16, level - 1));
}

export function starUpCost(star) {
  return [0, 20, 40, 80, 160, 320][star] ?? 999;
}

export function heroAtk(save, id) {
  const hero = getHero(id);
  if (!hero) return 0;
  const lv = heroLevel(save, id);
  const star = heroStar(save, id);
  return hero.atk * (1 + (lv - 1) * 0.09) * (1 + (star - 1) * 0.18);
}

export function dexRatio(save) {
  const total = Object.keys(save?.dex ?? {}).length;
  return total;
}

export function dexBonus(save, catalogSize) {
  const owned = Object.values(save?.dex ?? {}).filter(Boolean).length;
  const size = Math.max(1, catalogSize);
  return Math.min(0.15, (owned / size) * 0.15);
}

/**
 * @param {object} save
 * @param {object} [opts] - { roster, flatLevel } 肉鸽等模式用 flatLevel 抹平养成
 */
export function buildLoadout(save, opts = {}) {
  const rosterIds = (opts.roster ?? save?.roster ?? []).filter((id) => getHero(id));
  const flat = opts.flatLevel ?? null;
  const { bonds, atkBonus, counts } = computeBonds(rosterIds);
  const raceTech = computeRaceTech(save?.dex);
  const dex = flat ? 0 : dexBonus(save, opts.catalogSize ?? 20);
  const fish = !flat && save?.fishBuff ? save.fishBuff : null;

  const heroes = rosterIds.map((id, index) => {
    const hero = getHero(id);
    const lv = flat ? flat : heroLevel(save, id);
    const star = flat ? 1 : heroStar(save, id);
    let atk = hero.atk * (1 + (lv - 1) * 0.09) * (1 + (star - 1) * 0.18);
    atk *= 1 + atkBonus + dex + (raceTech.bonus[hero.race] ?? 0);
    if (fish?.kind === "atk") atk *= 1 + fish.value;
    return {
      ...hero,
      slot: index,
      level: lv,
      star,
      atk: Math.round(atk * 10) / 10,
      energy: 0,
      maxEnergy: hero.ult?.cost ?? 100,
    };
  });

  // 战鼓鸡光环：全队攻击 +12%
  if (heroes.some((h) => h.id === "drum_chick")) {
    for (const h of heroes) h.atk = Math.round(h.atk * 1.12 * 10) / 10;
  }

  return {
    heroes,
    bonds,
    schoolCounts: counts,
    atkBonus,
    dexBonus: dex,
    raceTech,
    fishBuff: fish,
    critBonus: fish?.kind === "crit" ? fish.value : 0,
    extraEggs: fish?.kind === "eggs" ? fish.value : 0,
  };
}

export function grantShards(save, id, amount) {
  save.shards[id] = (save.shards[id] ?? 0) + amount;
  return save.shards[id];
}

export function tryLevelUp(save, id) {
  const lv = heroLevel(save, id);
  if (lv >= MAX_LEVEL) return { ok: false, reason: "已满级" };
  const cost = levelUpCost(lv);
  if ((save.gold ?? 0) < cost) return { ok: false, reason: `金币不足（需 ${cost}）` };
  save.gold -= cost;
  save.heroLevels[id] = lv + 1;
  return { ok: true, cost, level: lv + 1 };
}

export function tryStarUp(save, id) {
  const star = heroStar(save, id);
  if (star >= MAX_STAR) return { ok: false, reason: "已满星" };
  const cost = starUpCost(star);
  const have = save.shards?.[id] ?? 0;
  if (have < cost) return { ok: false, reason: `碎片不足（需 ${cost}）` };
  save.shards[id] = have - cost;
  save.heroStars[id] = star + 1;
  return { ok: true, cost, star: star + 1 };
}
