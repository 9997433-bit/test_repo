// 异掌 · 运动 / 击退 / 掌意 / 规则调参表（推导见 docs/GDD.md §3–§6）
// 纯数据。sim / combat 以此为唯一数值来源，不要在代码里写魔法数。

// 运动手感
export const MOVEMENT = {
  walkSpeed: 6.2, // 基准移速，乘以手套 moveSpeedMul
  accel: 42, // 地面加速度，~0.15s 到全速（惯性来源）
  stopDamping: 10, // 松键阻尼（指数），~0.3s 停稳
  airControlMul: 0.4, // 空中操控系数
  gravity: 22, // 游戏重力（偏爽快，非 9.8）
  jumpSpeed: 5.2, // 轻跳初速，顶点 ≈0.61m
  dashImpulse: 10.5, // 冲刺瞬时加速
  dashDuration: 0.18,
  dashCooldown: 2.2,
};

// 击退模型：一次命中 = 水平冲量 slapPower + 默认小挑空，之后按指数阻尼衰减
export const KNOCKBACK = {
  baseKnockUp: 1.8, // 默认竖直分量，滞空 ≈0.16s（低于护栏高度，不白送翻栏）
  hitstun: 0.32, // 受击硬直（无输入），小于最快扇击冷却 0.5 → 不可无限连
  groundDrag: 2.2, // 地面阻尼 λ，v' = -λv；击退速度随滑行距离线性衰减
  airDrag: 0.35, // 空中阻尼（离台后基本不减速）
  diInfluence: 0.25, // 受击方向影响：击退期间移动输入按 25% accel 生效
  railHeight: 0.45, // 边缘低护栏高度
  railStopSpeed: 6.5, // 过栏阈值：贴栏时向外水平速度 ≥ 此值或高于栏顶才会出岛
  railDaze: 0.25, // 被护栏挡下后的踉跄硬直（给追击方一拍）
  heavyPowerThreshold: 12, // 有效击退 ≥ 此值算「重击」，命中会伤台面（见 tiles.js）
};

// 掌意（觉醒条 0..1）
export const METER = {
  onSlapHit: 0.12, // 扇中别人
  onSlapTaken: 0.08, // 被扇中
  onSkillHit: 0.15, // 主动技命中
  onWhiff: 0, // 挥空不给
  decayPerSecond: 0.01, // 脱战缓慢流失，逼人保持接触
  awakenThreshold: 1.0, // 满条觉醒 MATCH.awakenDuration 秒，结束归零
  gainWhileAwakened: 0, // 觉醒期间不再积攒
};

// 对局规则补充（MATCH 由契约锁死，扩展常量放这里）
export const RULES = {
  killCreditSeconds: 4, // 最后一次被击 4s 内坠落记击杀，否则算自坠
  respawnCoreRadius: 4, // 重生点随机落在台心 r<4 圆盘
  streakBreakOnDeath: true, // 自己坠落断连胜（种子文档要求）
  botCountDefault: 3,
};
