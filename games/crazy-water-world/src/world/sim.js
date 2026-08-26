import { WEATHERS, WEATHER_WEIGHTS } from "../data/weather.js";
import { mulberry32, pickWeighted } from "../core/rng.js";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function has(state, type) {
  return state.buildings.filter((b) => b.type === type);
}

function assignedBonus(state, building) {
  if (!building.occupantHeroId) return 1;
  const hero = state.heroes.find((h) => h.id === building.occupantHeroId);
  if (!hero) return 1;
  return 1 + hero.star * 0.12;
}

export function tickWorld(state, dt) {
  const wdef = WEATHERS[state.world.weather] || WEATHERS.clear;
  const next = structuredClone(state);
  next.world.timeOfDay = (next.world.timeOfDay + dt / 240) % 1;
  next.world.weatherTimer -= dt;
  if (next.world.weatherTimer <= 0) {
    const rng = mulberry32((next.meta.seed + next.meta.tick) >>> 0);
    next.world.weather = pickWeighted(rng, WEATHER_WEIGHTS);
    next.world.weatherTimer = 70 + rng() * 50;
    next.log = [`天气转向：${WEATHERS[next.world.weather].name}`, ...next.log].slice(0, 24);
  }

  const drain = dt * (next.world.weather === "clear" ? 0.35 : 0.5);
  next.player.hunger = clamp(next.player.hunger - drain, 0, 100);
  next.player.thirst = clamp(next.player.thirst - drain * 1.1, 0, 100);
  if (next.player.hunger <= 0 || next.player.thirst <= 0) {
    next.player.hp = clamp(next.player.hp - dt * 1.2, 1, 100);
  }

  for (const r of next.residents) {
    r.hunger = clamp(r.hunger - drain * 0.8, 0, 100);
    r.thirst = clamp(r.thirst - drain * 0.9, 0, 100);
    if (r.hunger < 20 || r.thirst < 20) r.mood = clamp(r.mood - dt * 0.4, 0, 100);
  }

  const prod = wdef.prod;
  for (const b of has(next, "fish_chair")) {
    const rate = 0.035 * b.level * assignedBonus(next, b) * prod;
    next.resources.rawFish += rate * dt;
  }
  for (const b of has(next, "still")) {
    next.resources.freshWater += 0.05 * b.level * assignedBonus(next, b) * prod * dt;
  }
  for (const b of has(next, "farm")) {
    next.resources.wheat += 0.03 * b.level * assignedBonus(next, b) * prod * dt;
  }
  for (const b of has(next, "seed")) {
    next.resources.seed += 0.008 * b.level * assignedBonus(next, b) * prod * dt;
  }
  for (const b of has(next, "salvage")) {
    next.resources.wood += 0.04 * b.level * assignedBonus(next, b) * wdef.salvage * dt;
    next.resources.plastic += 0.025 * b.level * assignedBonus(next, b) * wdef.salvage * dt;
  }
  for (const b of has(next, "fish_plant")) {
    if (next.resources.rawFish >= 1) {
      const n = Math.min(next.resources.rawFish, 0.08 * b.level * assignedBonus(next, b) * dt);
      next.resources.rawFish -= n;
      next.resources.fillet += n * 0.8;
      next.resources.meal += n * 0.25;
    }
  }

  if (wdef.damage > 0) {
    const walls = has(next, "wall").length;
    const dmg = wdef.damage * dt * Math.max(0.15, 1 - walls * 0.12);
    next.player.hp = clamp(next.player.hp - dmg * 0.15, 1, 100);
  }

  while (next.player.exp >= next.player.level * 80) {
    next.player.exp -= next.player.level * 80;
    next.player.level += 1;
    next.log = [`指挥等级 ${next.player.level}！海域更宽了，老大。`, ...next.log].slice(0, 24);
  }

  next.campaign.idleSince += dt;
  return next;
}
