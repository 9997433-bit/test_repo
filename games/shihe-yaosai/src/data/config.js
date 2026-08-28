// 蚀核要塞 · 全局配置（Fable-3 冻结，Round 1）
// 纯数据，禁止 import Babylon / DOM。

export const CONFIG = {
  // —— 基座冻结字段（不得改动）——
  socketCount: 24, // 外环插座数，socketIndex 0..23，θ = i/24 * 2π
  coreHp: 20, // 星核血量，<=0 失败
  startScrap: 180, // 开局屑晶
  lanes: [0, 1, 2], // 三条轨道：下 / 中 / 上
  laneY: [0, 4, 9], // 各轨道高度
  spawnRadius: 52, // 敌人出生半径
  coreRadius: 8, // 星核半径，敌人 radius <= 8 即漏敌

  // —— Fable-3 数值扩展 ——
  ringRadius: 40, // 插座环半径（BRIEF 冻结「环半径逻辑 40」）
  waveCount: 20, // 常规波数；第 20 波后进 Boss「蚀主」
  interWaveDelaySec: 5, // 波与波之间的备战间隔（秒）
  sellRefund: 0.7, // 拆塔返还比例（按已投入屑晶总额，向下取整）

  // 过载：F 键作用于当前选中塔。不耗屑晶，纯冷却循环。
  overclock: {
    durationSec: 4, // 过载持续 4s
    multiplier: 2.2, // 期间伤害 ×2.2
    overheatSec: 3, // 随后过热停火 3s
    scrapCost: 0, // 冻结：不耗屑晶
  },

  // 漏敌扣核（与 enemies.js 中每个敌人的 leak 字段一致；boss 漏敌即近乎必败）
  leakDamage: { small: 1, mid: 3, elite: 8, boss: 20 },
};
