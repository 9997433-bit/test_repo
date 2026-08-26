import { WEATHERS, WEATHER_WEIGHTS } from "../data/weather.js";
import { BUILDINGS } from "../data/buildings.js";
import { deriveRng, pickWeighted } from "../core/rng.js";
import { adjacentWalls } from "./grid.js";

export const OFFLINE_MAX_SECONDS = 8 * 3600;
export const OFFLINE_MIN_SECONDS = 60;
const MAX_WEATHER_ROLLS = 8;
const STARVED_PROD = 0.5;
const WALL_MITIGATION = 0.12;
const WALL_FLOOR = 0.15;

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function assignedBonus(state, building) {
  if (!building.occupantHeroId) return 1;
  const hero = state.heroes.find((h) => h.id === building.occupantHeroId);
  if (!hero) return 1;
  return 1 + hero.star * 0.12;
}

// 风暴减伤只认「贴着庇护所的围栏」，围墙堆在木筏另一头不算数。
export function stormShelter(state) {
  const shelter =
    state.buildings.find((b) => b.type === "hq") ||
    state.buildings.find((b) => b.type === "house") ||
    state.buildings.find((b) => b.type !== "wall");
  const walls = shelter
    ? adjacentWalls(state, shelter).length
    : state.buildings.filter((b) => b.type === "wall").length;
  return { walls, mult: Math.max(WALL_FLOOR, 1 - walls * WALL_MITIGATION) };
}

export function tickWorld(state, dt) {
  if (!Number.isFinite(dt) || dt <= 0) return state;

  const world = { ...state.world };
  const player = { ...state.player };
  const resources = { ...state.resources };
  const campaign = { ...state.campaign };
  const residents = state.residents.map((r) => ({ ...r }));
  let log = state.log;

  world.timeOfDay = (world.timeOfDay + dt / 240) % 1;
  let timer = Number.isFinite(world.weatherTimer) ? world.weatherTimer - dt : 0;
  for (let roll = 0; timer <= 0 && roll < MAX_WEATHER_ROLLS; roll += 1) {
    const rng = deriveRng(state.meta.seed, state.meta.tick, "weather", roll);
    world.weather = pickWeighted(rng, WEATHER_WEIGHTS);
    timer += 70 + rng() * 50;
    log = [`天气转向：${WEATHERS[world.weather]?.name || world.weather}`, ...log].slice(0, 24);
  }
  world.weatherTimer = timer > 0 ? timer : 70;

  const wdef = WEATHERS[world.weather] || WEATHERS.clear;
  const drain = dt * (world.weather === "clear" ? 0.35 : 0.5);
  player.hunger = clamp(player.hunger - drain, 0, 100);
  player.thirst = clamp(player.thirst - drain * 1.1, 0, 100);
  const starved = player.hunger <= 0 || player.thirst <= 0;
  if (starved) player.hp = clamp(player.hp - dt * 1.2, 1, 100);

  const beds = state.buildings.reduce(
    (n, b) => (b.type === "house" ? n + (BUILDINGS.house.pop || 2) * b.level : n),
    0,
  );
  residents.forEach((r, i) => {
    r.hunger = clamp(r.hunger - drain * 0.8, 0, 100);
    r.thirst = clamp(r.thirst - drain * 0.9, 0, 100);
    if (r.hunger < 20 || r.thirst < 20) r.mood = clamp(r.mood - dt * 0.4, 0, 100);
    else if (i < beds) r.mood = clamp(r.mood + dt * 0.25, 0, 100);
  });

  const prod = wdef.prod * (starved ? STARVED_PROD : 1);
  for (const b of state.buildings) {
    const eff = b.level * assignedBonus(state, b) * dt;
    switch (b.type) {
      case "fish_chair":
        resources.rawFish += 0.035 * eff * prod;
        break;
      case "still":
        resources.freshWater += 0.05 * eff * prod;
        break;
      case "farm":
        resources.wheat += 0.03 * eff * prod;
        break;
      case "seed":
        resources.seed += 0.008 * eff * prod;
        break;
      case "salvage":
        resources.wood += 0.04 * eff * wdef.salvage;
        resources.plastic += 0.025 * eff * wdef.salvage;
        break;
      case "workshop": {
        // 工坊是转化而非凭空产出：吃浮木与塑料，出绳索。
        const want = 0.02 * eff * prod;
        const made = Math.min(want, resources.wood / 1.5, resources.plastic / 1.2);
        if (made > 0) {
          resources.wood -= made * 1.5;
          resources.plastic -= made * 1.2;
          resources.rope += made;
        }
        break;
      }
      default:
        break;
    }
  }
  for (const b of state.buildings) {
    if (b.type !== "fish_plant" || resources.rawFish < 1) continue;
    const n = Math.min(resources.rawFish, 0.08 * b.level * assignedBonus(state, b) * dt);
    resources.rawFish -= n;
    resources.fillet += n * 0.8;
    resources.meal += n * 0.25;
  }

  if (wdef.damage > 0) {
    const dmg = wdef.damage * dt * stormShelter(state).mult;
    player.hp = clamp(player.hp - dmg * 0.15, 1, 100);
  }

  while (player.exp >= player.level * 80) {
    player.exp -= player.level * 80;
    player.level += 1;
    log = [`指挥等级 ${player.level}！海域更宽了，老大。`, ...log].slice(0, 24);
  }

  campaign.idleSince += dt;
  return { ...state, player, resources, residents, world, campaign, log };
}

// 离线补算：把攒下的挂机秒数切成粗块推进产出，不补漂浮物、不留天气刷屏日志。
export function settleOffline(state, seconds) {
  const total = clamp(Number.isFinite(seconds) ? seconds : 0, 0, OFFLINE_MAX_SECONDS);
  if (total < OFFLINE_MIN_SECONDS) return state;
  const blocks = clamp(Math.ceil(total / 60), 1, 120);
  const step = total / blocks;
  let next = state;
  for (let i = 0; i < blocks; i += 1) next = tickWorld(next, step);
  const minutes = Math.round(total / 60);
  return {
    ...next,
    campaign: { ...next.campaign, idleSince: 0 },
    log: [`离线 ${minutes} 分钟，木筏自己转了一会儿。`, ...state.log].slice(0, 24),
  };
}
