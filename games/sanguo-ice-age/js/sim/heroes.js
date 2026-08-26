/** 武将：招募（保底概率随招贤馆等级提升）、养成、编队。 */
import { GACHA, HERO, QUALITY_NAMES, clamp } from "../config.js";
import { HERO_POOL, HEROES_BY_ID } from "../data/heroes.js";
import { nextRandom } from "../engine/rng.js";
import { pushLog } from "./state.js";

export function gachaRates(hallLevel) {
  const red = clamp(GACHA.baseRates.red + GACHA.redPerHallLevel * Math.max(0, hallLevel - 1), 0, 0.2);
  const orange = clamp(GACHA.baseRates.orange + GACHA.orangePerHallLevel * Math.max(0, hallLevel - 1), 0, 0.4);
  const purple = GACHA.baseRates.purple;
  const blue = Math.max(0, 1 - red - orange - purple);
  return { red, orange, purple, blue };
}

export function rollQuality(rng, hallLevel) {
  const rates = gachaRates(hallLevel);
  const r = rng();
  if (r < rates.red) return "red";
  if (r < rates.red + rates.orange) return "orange";
  if (r < rates.red + rates.orange + rates.purple) return "purple";
  return "blue";
}

export function ownedHero(state, heroId) {
  return state.heroes.find((h) => h.id === heroId) || null;
}

/** 招募一次。返回 { hero, isNew, souls }。 */
export function recruitOnce(state) {
  if (state.buildings.recruitHall < 1) return { error: "需要先建造招贤馆" };
  if (state.tokens < 1) return { error: "招贤令不足" };
  state.tokens -= 1;
  const rng = () => nextRandom(state);
  const quality = rollQuality(rng, state.buildings.recruitHall);
  const pool = HERO_POOL.filter((h) => h.quality === quality);
  const proto = pool[Math.floor(rng() * pool.length)];
  const existing = ownedHero(state, proto.id);
  state.stats.recruits++;
  if (existing) {
    existing.dupes = (existing.dupes || 0) + 1;
    const souls = HERO.dupeSouls[quality];
    state.souls += souls;
    pushLog(state, `再遇${proto.name}（${QUALITY_NAMES[quality]}），化为将魂 ×${souls}。`, "hero");
    return { hero: proto, isNew: false, souls };
  }
  state.heroes.push({ id: proto.id, level: 1, dupes: 0 });
  pushLog(state, `【${QUALITY_NAMES[quality]}】${proto.name} 应募而来！`, "hero");
  return { hero: proto, isNew: true, souls: 0 };
}

/** 用资源换招贤令。 */
export function buyToken(state) {
  const cost = GACHA.tokenTrade;
  if (state.buildings.recruitHall < 1) return { ok: false, reason: "需要先建造招贤馆" };
  if (state.resources.food < cost.food || state.resources.iron < cost.iron) {
    return { ok: false, reason: `需 肉食${cost.food} + 铁料${cost.iron}` };
  }
  state.resources.food -= cost.food;
  state.resources.iron -= cost.iron;
  state.tokens += 1;
  return { ok: true };
}

export function heroStats(inst) {
  const proto = HEROES_BY_ID[inst.id];
  const base = HERO.baseStats[proto.quality];
  const growth = 1 + HERO.statGrowthPerLevel * (inst.level - 1);
  const leadGrowth = 1 + HERO.leadGrowthPerLevel * (inst.level - 1);
  return {
    atk: Math.round(base.atk * proto.tweak.atk * growth),
    def: Math.round(base.def * proto.tweak.def * growth),
    lead: Math.round(base.lead * proto.tweak.lead * leadGrowth),
  };
}

export function levelUpCost(inst) {
  return HERO.soulCost(inst.level);
}

export function levelUpHero(state, heroId) {
  const inst = ownedHero(state, heroId);
  if (!inst) return { ok: false, reason: "未拥有该武将" };
  const proto = HEROES_BY_ID[heroId];
  if (inst.level >= HERO.maxLevel[proto.quality]) return { ok: false, reason: "已达等级上限" };
  const cost = levelUpCost(inst);
  if (state.souls < cost) return { ok: false, reason: `将魂不足（需 ${cost}）` };
  state.souls -= cost;
  inst.level += 1;
  return { ok: true, level: inst.level };
}

/** 上阵/下阵：slot 0..2。 */
export function setTeamSlot(state, slot, heroId) {
  if (slot < 0 || slot > 2) return { ok: false, reason: "无效栏位" };
  if (heroId === null) {
    state.team[slot] = null;
    return { ok: true };
  }
  if (!ownedHero(state, heroId)) return { ok: false, reason: "未拥有该武将" };
  for (let i = 0; i < 3; i++) {
    if (i !== slot && state.team[i] === heroId) state.team[i] = null;
  }
  state.team[slot] = heroId;
  return { ok: true };
}

export function teamHeroes(state) {
  return state.team
    .filter(Boolean)
    .map((id) => ownedHero(state, id))
    .filter(Boolean);
}
