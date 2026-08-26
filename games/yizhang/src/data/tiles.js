// 异掌 · 裂岛台面 / 碎裂调参（预算推导见 docs/GDD.md §8）
// 台面 = 不可破坏的台心圆盘 + 3 环 × 24 扇区的可破坏块，按象限分 4 个可破坏区。

export const TILE = {
  innerSafeRadius: 6, // r<6 台心永不碎，保底立足点
  ringRadii: [6, 10.5, 15, 20], // 3 个环带边界
  sectorsPerRing: 24, // 每 15° 一块，共 72 块可破坏
  quadrants: 4, // 归属 4 个可破坏区（象限），中缝十字为纯视觉裂纹
  seamAxes: 2, // 中缝沿 x/z 两轴，渲染层表现，无碰撞语义

  hp: 100, // 每块 HP
  crackStages: [66, 33], // HP 阈值 → 两级裂纹视觉
  collapseDelaySeconds: 0.6, // HP≤0 后先抖 0.6s 警示再塌
  regrow: false, // 本局内不复原：边线永久改变（种子要求）
  zoneMaxCollapsedFraction: 0.75, // 每象限最多塌 75%，保通行走廊

  // 伤害来源（重击才伤台面）
  slapTileDamage: 8, // 有效击退 ≥ KNOCKBACK.heavyPowerThreshold 的扇击，在受击者触地点结算
  victimImpactDamage: 10, // 受击者以 ≥ 此速度砸回地面时结算
  victimImpactSpeed: 8, // 上述触发落速
  // 技能伤害在 skills.js 各自 tileDamage 字段（磐石 35 / 陨掌 30 / 觉醒 100 直碎）
};
