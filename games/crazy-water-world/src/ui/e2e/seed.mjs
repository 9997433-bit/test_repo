// 构造一份「中期存档」，用真实的 store/placeBuilding 生成，走真实读档路径。
import { defaultState } from "../../core/store.js";
import { stepSim } from "../../core/engine.js";
import { placeBuilding } from "../../world/build.js";
import { recruit } from "../../heroes/index.js";

export function richSave() {
  let s = defaultState();
  s.player.level = 8;
  s.player.exp = 120;
  s.player.hunger = 72;
  s.player.thirst = 64;
  s.resources = {
    ...s.resources,
    wood: 220,
    plastic: 160,
    scrap: 140,
    rope: 60,
    stone: 40,
    rawFish: 12,
    fillet: 6,
    meal: 4,
    freshWater: 30,
    wheat: 8,
    seed: 6,
    salt: 4,
    blueprint: 6,
    hourglass: 12,
    badge: 8,
    shard: 40,
    tool: 4,
  };
  for (const [type, x, y] of [
    ["hq", 0, 0],
    ["fish_chair", 2, 0],
    ["dive_dock", 3, 0],
    ["radio", 5, 0],
    ["still", 2, 1],
    ["house", 0, 2],
    ["salvage", 3, 2],
    ["workshop", 0, 3],
  ]) {
    const next = placeBuilding(s, type, x, y, 0);
    if (next === s) throw new Error(`seed: 放不下 ${type} @${x},${y}`);
    s = next;
  }
  // 定点漂浮物：vx=0 不漂、ttl 拉长，方便脚本精确点击验证 pickFlotsam 命中。
  s.explore.salvage.flotsam = [
    { id: "seed-1", res: "wood", n: 3, rare: false, x: -0.72, y: 0.12, vx: 0, ttl: 400 },
    { id: "seed-2", res: "blueprint", n: 1, rare: true, x: 0.78, y: 0.3, vx: 0, ttl: 400 },
    { id: "seed-3", res: "scrap", n: 2, rare: false, x: -0.4, y: 0.42, vx: 0, ttl: 400 },
  ];
  s.log = ["存档载入：木筏还在，恭喜老大。"];
  s.meta.savedAt = Date.now();
  return s;
}

function withLevel(state, type, level) {
  return { ...state, buildings: state.buildings.map((b) => (b.type === type ? { ...b, level } : b)) };
}

/** 指定潜水船坞等级与关卡进度：给海区解锁面板做「一片开、一片锁」的样本。 */
export function diveSave({ dockLevel = 2, bestStage = 19 } = {}) {
  const s = withLevel(richSave(), "dive_dock", dockLevel);
  s.campaign = { ...s.campaign, stage: Math.min(30, bestStage + 1), bestStage, attempts: 0 };
  s.log = [`存档载入：${dockLevel} 级潜水船坞，最佳第 ${bestStage} 关。`];
  s.meta.savedAt = Date.now();
  return s;
}

/**
 * 一份「马上要转海啸」的存档：天气由 (seed, tick) 决定，所以直接拿真实 stepSim
 * 把种子筛一遍，挑一个在 minTick..maxTick 之间翻脸的。海啸只在 3 级指挥中心
 * 以上的天气档里出现（data/weather.js WEATHER_SCHEDULE），所以 HQ 先垫到 3 级。
 * 返回 { save, tick }：tick 是海啸落地的那一量子，脚本据此估算等待时间。
 */
export function tsunamiSave({ atTick = 80, seeds = 6000 } = {}) {
  // 天气计时器每量子减 0.1s：把它设成 atTick×0.1 − 半格，第一次翻牌就落在第 atTick 个量子。
  const timer = atTick * 0.1 - 0.05;
  for (let seed = 1; seed <= seeds; seed += 1) {
    const save = withLevel(richSave(), "hq", 3);
    save.meta = { ...save.meta, seed, tick: 0, savedAt: Date.now() };
    save.world = { ...save.world, weather: "clear", weatherTimer: timer };
    save.log = ["存档载入：天要变了，老大。"];
    let s = save;
    for (let tick = 1; tick <= atTick; tick += 1) s = stepSim(s);
    if (s.world.weather === "tsunami") return { save, tick: atTick };
  }
  throw new Error("seed: 没找到会在指定量子转海啸的种子");
}

/** 六人队 + 指定关卡进度的存档：给「5v5 取舍 / 伤病 / 首通奖励」这三条线做样本。 */
export function veteranSave({ bestStage = 19, stars = 3 } = {}) {
  let s = richSave();
  for (const key of ["mia", "sam", "rambo", "yilong", "kan", "butcher"]) {
    const next = recruit(s, key);
    if (next === s) throw new Error(`seed: 招不到 ${key}`);
    s = next;
  }
  s.heroes = s.heroes.map((h) => ({ ...h, star: stars }));
  s.campaign = { ...s.campaign, stage: Math.min(30, bestStage + 1), bestStage, attempts: 0 };
  s.log = [`存档载入：六人队，最佳第 ${bestStage} 关。`];
  return s;
}
