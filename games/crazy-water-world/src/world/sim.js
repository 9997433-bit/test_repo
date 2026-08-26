import { WEATHER_WEIGHTS, WEATHER_SCHEDULE } from "../data/weather.js";
import { BUILDINGS } from "../data/buildings.js";
import { HEROES, ASSIGN_RULES } from "../data/heroes.js";
import { deriveRng, pickWeighted } from "../core/rng.js";
import { adjacencyIndex, adjacentWalls } from "./grid.js";
import { hqLevel, weatherMods, weatherOf } from "./mods.js";

export const OFFLINE_MAX_SECONDS = 8 * 3600;
export const OFFLINE_MIN_SECONDS = 60;
const MAX_WEATHER_ROLLS = 8;
const STARVED_PROD = 0.5;
const WALL_FLOOR = 0.15;
// 生存基准：每秒掉多少饥饿，口渴在此之上再乘一个基准比例。
// 天气只提供倍率（WEATHERS[*].hunger / thirst），绝对值留在引擎侧。
const BASE_DRAIN = 0.35;
const THIRST_RATIO = 1.1;
const RESIDENT_HUNGER = 0.8;
const RESIDENT_THIRST = 0.9;
// 天气表没写 durationSec 时的兜底区间（秒）。
const FALLBACK_DURATION = [70, 120];

// 建筑表编译一次：把 output/input/converts 摊平成数组，tick 里不再 Object.entries。
// 静态表在运行期不变，这里缓存的是形状不是数值。
const RULES = compileBuildings(BUILDINGS);

function compileBuildings(table) {
  const out = {};
  for (const [type, def] of Object.entries(table)) {
    const likes = def.adjacency?.likes || [];
    out[type] = {
      output: Object.entries(def.output || {}),
      input: Object.entries(def.input || {}),
      converts: (def.converts || []).map((r) => ({
        in: Object.entries(r.in || {}),
        out: Object.entries(r.out || {}),
        perSec: Number.isFinite(r.perSec) ? r.perSec : 0,
        minLevel: Number.isFinite(r.minLevel) ? r.minLevel : 1,
      })),
      likes,
      likesAny: likes.includes("*"),
      adjBonus: Number.isFinite(def.adjacency?.bonus) ? def.adjacency.bonus : 0,
      // 标了 salvage 的建筑吃天气的 salvage 轴，其余吃 prod 轴。
      usesSalvage: !!def.salvage,
      pop: Number.isFinite(def.pop) ? def.pop : 0,
      popPerLevel: Number.isFinite(def.popPerLevel) ? def.popPerLevel : 0,
    };
  }
  return out;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function heroIndex(state) {
  const map = new Map();
  for (const h of state.heroes || []) map.set(h.id, h);
  return map;
}

// 委任加成读 ASSIGN_RULES：1 + 星级 × basePerStar，委任到英雄擅长的建筑再乘 assign.mult。
function assignedBonus(building, heroes) {
  const hero = building.occupantHeroId ? heroes.get(building.occupantHeroId) : null;
  if (!hero) return 1;
  const spec = HEROES[hero.heroKey]?.[ASSIGN_RULES.specialtyField];
  const mult = spec && spec.likes === building.type ? spec.mult || 1 : 1;
  return 1 + (hero.star || 1) * ASSIGN_RULES.basePerStar * mult;
}

// 邻接加成只认表里的 likes，命中一次就够（同类不叠加）。
function adjacencyMult(rule, near) {
  if (!rule.adjBonus || !near) return 1;
  if (rule.likesAny) return near.types.size > 0 ? 1 + rule.adjBonus : 1;
  for (const type of rule.likes) {
    if (near.types.has(type)) return 1 + rule.adjBonus;
  }
  return 1;
}

// 维持性消耗：料不够就整座停产，且一分不扣（半吊子生产不好解释也不好回滚）。
function payUpkeep(resources, rule, level, dt) {
  if (!rule.input.length) return true;
  for (const [key, per] of rule.input) {
    if ((resources[key] || 0) < per * level * dt) return false;
  }
  for (const [key, per] of rule.input) resources[key] -= per * level * dt;
  return true;
}

// 天气按产物再修一刀：淡水吃 stillBonus（暴雨接雨水），自动出鱼吃 fishing（海啸收杆）。
function outputAxis(key, mods) {
  if (key === "freshWater") return mods.stillBonus;
  if (key === "rawFish") return mods.fishing;
  return 1;
}

// 按指挥中心等级取天气档；没有匹配档位（例如还没立 HQ）回退全局权重。
function weatherWeights(state) {
  const hq = hqLevel(state);
  let best = null;
  let bestMin = -Infinity;
  for (const tier of WEATHER_SCHEDULE || []) {
    if (!Array.isArray(tier?.weights) || !tier.weights.length) continue;
    const min = Number.isFinite(tier.minHq) ? tier.minHq : 0;
    if (hq >= min && min > bestMin) {
      best = tier.weights;
      bestMin = min;
    }
  }
  return best || WEATHER_WEIGHTS;
}

function weatherDuration(def, rng) {
  const span = Array.isArray(def?.durationSec) ? def.durationSec : FALLBACK_DURATION;
  const lo = Number.isFinite(span[0]) ? span[0] : FALLBACK_DURATION[0];
  const hi = Number.isFinite(span[1]) ? span[1] : lo;
  return lo + rng() * Math.max(0, hi - lo);
}

// 风暴减伤只认「贴着庇护所的围栏」，围墙堆在木筏另一头不算数。
// 每座围栏减多少读 BUILDINGS.wall.guard，地板留在引擎侧。
export function stormShelter(state, index = null) {
  const shelter =
    state.buildings.find((b) => b.type === "hq") ||
    state.buildings.find((b) => b.type === "house") ||
    state.buildings.find((b) => b.type !== "wall");
  const guard = Number.isFinite(BUILDINGS.wall?.guard) ? BUILDINGS.wall.guard : 0;
  const walls = shelter
    ? adjacentWalls(state, shelter, index).length
    : state.buildings.filter((b) => b.type === "wall").length;
  return { walls, guard, mult: Math.max(WALL_FLOOR, 1 - walls * guard) };
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
  const weights = weatherWeights(state);
  let timer = Number.isFinite(world.weatherTimer) ? world.weatherTimer - dt : 0;
  for (let roll = 0; timer <= 0 && roll < MAX_WEATHER_ROLLS; roll += 1) {
    const rng = deriveRng(state.meta.seed, state.meta.tick, "weather", roll);
    world.weather = pickWeighted(rng, weights);
    const def = weatherOf({ world });
    timer += weatherDuration(def, rng);
    log = [`天气转向：${def.name || world.weather}。${def.quip || ""}`.trim(), ...log].slice(0, 24);
  }
  world.weatherTimer = timer > 0 ? timer : FALLBACK_DURATION[0];

  const index = adjacencyIndex(state);
  const mods = weatherMods({ ...state, world }, index);
  const heroes = heroIndex(state);

  const hungerDrain = dt * BASE_DRAIN * mods.hunger;
  const thirstDrain = dt * BASE_DRAIN * THIRST_RATIO * mods.thirst;
  player.hunger = clamp(player.hunger - hungerDrain, 0, 100);
  player.thirst = clamp(player.thirst - thirstDrain, 0, 100);
  const starved = player.hunger <= 0 || player.thirst <= 0;
  if (starved) player.hp = clamp(player.hp - dt * 1.2, 1, 100);

  // 床位读表：pop 是一级的基数，popPerLevel 是每升一级多睡几个。
  let beds = 0;
  for (const b of state.buildings) {
    const rule = RULES[b.type];
    if (!rule?.pop) continue;
    beds += rule.pop + rule.popPerLevel * (Math.max(1, b.level || 1) - 1);
  }
  residents.forEach((r, i) => {
    r.hunger = clamp(r.hunger - hungerDrain * RESIDENT_HUNGER, 0, 100);
    r.thirst = clamp(r.thirst - thirstDrain * RESIDENT_THIRST, 0, 100);
    if (r.hunger < 20 || r.thirst < 20) r.mood = clamp(r.mood - dt * 0.4, 0, 100);
    else if (i < beds) r.mood = clamp(r.mood + dt * 0.25, 0, 100);
  });

  const prod = mods.prod * (starved ? STARVED_PROD : 1);
  for (const b of state.buildings) {
    const rule = RULES[b.type];
    if (!rule) continue;
    const level = Math.max(1, b.level || 1);
    if (!rule.output.length && !rule.converts.length) continue;
    if (!payUpkeep(resources, rule, level, dt)) continue;

    const weather = rule.usesSalvage ? mods.salvage : prod;
    const eff = level * assignedBonus(b, heroes) * adjacencyMult(rule, index.get(b.id)) * dt;

    for (const [key, per] of rule.output) {
      resources[key] = (resources[key] || 0) + per * eff * weather * outputAxis(key, mods);
    }
    // 加工按表里的顺序抢原料：料紧张时先满足前面的配方，这就是配方顺序的意义。
    for (const recipe of rule.converts) {
      if (level < recipe.minLevel) continue;
      let batches = recipe.perSec * eff * weather;
      for (const [key, need] of recipe.in) batches = Math.min(batches, (resources[key] || 0) / need);
      if (!(batches > 0)) continue;
      // 吃满库存时 need×batches 可能被浮点顶出 1 ULP，钳一下免得仓库出现 -1e-18。
      for (const [key, need] of recipe.in) resources[key] = Math.max(0, resources[key] - need * batches);
      for (const [key, made] of recipe.out) resources[key] = (resources[key] || 0) + made * batches;
    }
  }

  if (mods.damage > 0) {
    const dmg = mods.damage * dt * stormShelter(state, index).mult;
    player.hp = clamp(player.hp - dmg * 0.15, 1, 100);
  }

  while (player.exp >= player.level * 80) {
    player.exp -= player.level * 80;
    player.level += 1;
    log = [`指挥等级 ${player.level}！海域更宽了，老大。`, ...log].slice(0, 24);
  }

  // 派生倍率随状态落一份快照：UI 与探索直接读 world.mods，不用各自再算一遍天气。
  world.mods = mods;
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
