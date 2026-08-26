export const RESOURCE_KEYS = [
  "wood",
  "plastic",
  "scrap",
  "rope",
  "stone",
  "rawFish",
  "fillet",
  "meal",
  "freshWater",
  "wheat",
  "seed",
  "salt",
  "blueprint",
  "hourglass",
  "badge",
  "shard",
];

export const RESOURCE_META = {
  wood: { name: "浮木", color: "#c9843a" },
  plastic: { name: "塑料", color: "#7ec8e3" },
  scrap: { name: "废铁", color: "#8a93a0" },
  rope: { name: "绳索", color: "#d4b483" },
  stone: { name: "石材", color: "#6d6a67" },
  rawFish: { name: "生鱼", color: "#5ec8d8" },
  fillet: { name: "生鱼片", color: "#ffb4a2" },
  meal: { name: "熟食", color: "#f4a259" },
  freshWater: { name: "淡水", color: "#4cc9f0" },
  wheat: { name: "小麦", color: "#f0d060" },
  seed: { name: "种子", color: "#8bc34a" },
  salt: { name: "海盐", color: "#f5f5f5" },
  blueprint: { name: "蓝图", color: "#7c6ff0" },
  hourglass: { name: "沙漏", color: "#ffd166" },
  badge: { name: "徽章", color: "#e09f3e" },
  shard: { name: "传说碎片", color: "#ef476f" },
};

export function emptyResources(overrides = {}) {
  const bag = Object.fromEntries(RESOURCE_KEYS.map((k) => [k, 0]));
  return { ...bag, ...overrides };
}
