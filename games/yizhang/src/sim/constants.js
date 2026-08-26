// 物理与手感常量。属于 sim 自身，不由 data 覆盖（手套数值才走 data）。

export const PHYSICS = {
  gravity: 26,

  // 移动惯性：向目标速度加速，松手按指数摩擦收敛
  moveAccel: 62,
  maxSpeed: 8.2,
  airControl: 0.42,
  groundFriction: 8,
  airDrag: 0.18,

  jumpSpeed: 8.6,
  coyoteTime: 0.1,

  dashSpeed: 17,
  dashTime: 0.16,
  dashCooldown: 1.1,
  dashGravityScale: 0.35,

  // 击退：受击后一小段时间失控 + 低摩擦，速度才滑得出去
  knockControlLock: 0.22,
  knockFriction: 1.15,
  knockLift: 0.18,
  knockGrowth: 0.075, // 每次挨打叠加的受击倍率
  knockScaleMax: 3.2,

  // 边缘低护栏：挡轻击不挡重击
  railBlockSpeed: 9,
  railInset: 0.35,

  // 出盘判死的下坠余量：越过台缘那一帧不判死，先让人真的往下掉一段
  offDiskDrop: 1.5,

  playerPush: 9, // 圆柱互推刚度
  windupSlow: 0.35, // 前摇/后摇期间的移动控制系数

  comboWindow: 1.6,
  killCreditWindow: 5,

  // 掌意由 combat 记账，sim 只补击杀奖励（combat 看不到出局判定）
  meterPerKill: 0.15,

  maxSubStep: 1 / 60, // 60Hz 友好：更大的 dt 会被切分
  maxDt: 0.25,
  maxEvents: 96,
};

export const ARENA = {
  tileSize: 2.5,
  tileHp: 120,
  seamTileHp: 80,
  seamHalfWidth: 1.9,
  floorY: 0,
};

export const SIM_VERSION = 1;
