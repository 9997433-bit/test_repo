// 异掌 · 裂岛台面 / 碎裂调参（预算推导见 docs/GDD.md §8）
// Round 2 冻结拓扑：与 src/sim/arena.js 的「圆盘上的方格网格」一致——
// 半径 20 圆盘 × 2.5m 方格，16×16 网格中中心落在盘内的 208 块；
// |x| < seamHalfWidth 的两列是中缝（HP 更低，先塌）；zone 按象限分 4 区。
// 「拓扑 / HP」两段 sim 已实现（对照 src/sim/constants.js 的 ARENA，
// 映射表见 GDD §8）。技能伤台走 combat 的 damageTilesInRadius，桥接层
// creditTileBreak 记账；「扇击伤台 / 设计约束」两段是设计规格，待接进
// sim 的 damageFloor 单入口（旧实现随 fallback-combat 一起删除）。

export const TILE = {
  // —— 拓扑（sim 已实现）——
  shape: "square-grid",
  tileSize: 2.5, // 格边长（m）＝ ARENA.tileSize；cols = ceil(2×arenaRadius/tileSize)
  cols: 16, // 派生值，渲染 / 测试可直接断言
  tileCount: 208, // 中心 r≤20 的格数（校验用；含台心 16 块）
  floorY: 0, // 台面高度 ＝ ARENA.floorY
  quadrants: 4, // zone = (x<0?0:1) + (z<0?0:2)
  seamHalfWidth: 1.9, // |x|<1.9 的 2 列 × 16 = 32 块为中缝 ＝ ARENA.seamHalfWidth

  // —— HP 模型（sim 已实现；每块实际 maxHp = max(minHp, round(基准 × 边缘系数 × 抖动))）——
  baseHp: 120, // 普通块基准 ＝ ARENA.tileHp
  seamHp: 80, // 中缝块基准 ＝ ARENA.seamTileHp
  edgeHpMulAtRim: 0.75, // 边缘系数 0.75 + 0.25×(1 − r/R)：台心 1.0 → 盘缘 0.75，边缘更脆
  hpJitter: 0.08, // ±8% 同 seed 确定性抖动（满血上限 ≈ round(120×1.08) = 130）
  minHp: 24,

  // —— 扇击伤台（设计规格，待接线；旧实现随 fallback-combat 删除）——
  // 仅当有效击退 ≥ KNOCKBACK.heavyPowerThreshold(12) 才结算，落在受击者位置：
  //   damage = (有效击退 − 12 + slapDamageBias) × slapDamagePerPower
  // 例：磐石 15 → 21/掌；陨掌 12 → 12/掌；觉醒磐石 18 → 30/掌。
  slapDamageBias: 4, // 结算公式里的 +4 偏置
  slapDamagePerPower: 3, // 每点超阈击退换算的台伤
  // 技能伤台在 skills.js 各自 tileDamage 字段（磐石 45 / 陨掌 40 / 觉醒 130 直碎），
  // 已实现：combat 各技能 handler 调 damageTilesInRadius，桥接层补记账

  // —— 裂纹视觉（渲染层按剩余比例 hp/maxHp 取档，sim 的 crackOf = 1 − hp/maxHp）——
  crackStages: [0.66, 0.33], // 剩余比例 ≤0.66 → 一级裂纹，≤0.33 → 二级

  // —— 设计约束（Round 2 由 O1 在 damageFloor 单入口接线，语义见 GDD §8）——
  innerSafeRadius: 6, // 格中心 r<6 的 16 块台心永不碎，保底立足点
  collapseDelaySeconds: 0.6, // HP≤0 抖 0.6s 警示再塌（sim 现为瞬时判碎，先由渲染表演）
  regrow: false, // 本局不复原：边线永久改变（种子要求；sim 已满足）
  zoneMaxCollapsedFraction: 0.75, // 每象限最多塌 75%，保通行走廊
};
