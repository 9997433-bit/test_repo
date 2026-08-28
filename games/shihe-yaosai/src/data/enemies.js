// 蚀核要塞 · 敌人数值（Fable-3 冻结，Round 1）
// size → leak 与 CONFIG.leakDamage 一致：small 1 / mid 3 / elite 8（boss 20 见 waves.js）。
// speed 单位/秒；全程 = spawnRadius 52 → coreRadius 8，共 44 单位。
// hp 为基础值；实际 hp = ceil(hp × 波次 hpMul)（见 waves.js）。

export const ENEMIES = {
  // —— 小型（leak 1）——
  mote: {
    id: "mote",
    name: "蚀尘",
    size: "small",
    armor: "swarm",
    hp: 14,
    speed: 3.2,
    bounty: 6,
    leak: 1,
  },
  wisp: {
    id: "wisp",
    name: "蚀萤",
    size: "small",
    armor: "swarm",
    hp: 10,
    speed: 4.6,
    bounty: 5,
    leak: 1,
  },
  husk: {
    id: "husk",
    name: "蚀壳",
    size: "small",
    armor: "shell",
    hp: 30,
    speed: 2.3,
    bounty: 8,
    leak: 1,
  },

  // —— 中型（leak 3）——
  veil: {
    id: "veil",
    name: "幕影",
    size: "mid",
    armor: "shield",
    hp: 75,
    speed: 2.6,
    bounty: 14,
    leak: 3,
  },
  ram: {
    id: "ram",
    name: "撞锤",
    size: "mid",
    armor: "shell",
    hp: 130,
    speed: 1.7,
    bounty: 18,
    leak: 3,
  },

  // —— 精英（leak 8）——
  warden: {
    id: "warden",
    name: "蚀卫",
    size: "elite",
    armor: "shell",
    hp: 340,
    speed: 1.5,
    bounty: 36,
    leak: 8,
  },
  oracle: {
    id: "oracle",
    name: "蚀瞳",
    size: "elite",
    armor: "shield",
    hp: 300,
    speed: 1.8,
    bounty: 34,
    leak: 8,
  },
  brood: {
    id: "brood",
    name: "蚀巢",
    size: "elite",
    armor: "swarm",
    hp: 260,
    speed: 1.9,
    bounty: 32,
    leak: 8,
  },
};
