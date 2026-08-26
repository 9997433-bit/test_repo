// 构造一份「中期存档」，用真实的 store/placeBuilding 生成，走真实读档路径。
import { defaultState } from "../../core/store.js";
import { placeBuilding } from "../../world/build.js";

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
