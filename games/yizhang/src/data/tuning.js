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

// 机位（第三人称跟随相机）距离 / 阻尼 / snap 阈值对照登记表（LOOK-R1，GDD §15）。
// 实现权威在 render/camera.js（O2 域，距离与阻尼）与契约 §7.1（CAMERA_SNAP 两阈值）；
// 本表登记**同一套数字**供 GDD 与测试引用，不另造一套——render 侧改值时回修此表，
// 对照测试 src/data/tuning.test.js 锁两边同数。阻尼 λ 是指数弹簧系数：
// x' = x + (target − x)·(1 − e^(−λ·dt))，λ 越大跟得越紧。
export const CAMERA = {
  dist: 7.4, // 机位距离初值（render camera state.dist，开机第一帧的跟随距离）
  restDist: 7.1, // 静止跟随距离（render REST_DIST）：目标距离基准，snap 落位直接用它
  distSpeedGain: 0.11, // 距离随速拉远：目标距离 = restDist + min(distSpeedMax, 速度×gain) + 滞空高度×distAirGain
  distSpeedMax: 1.6, // 拉远封顶（地面全速 6.2 稳态 ≈ 7.8，冲刺顶到 8.7）
  distAirGain: 0.12, // 滞空每米再拉远一点点
  basePitch: 0.22, // 静止俯角（render BASE_PITCH，弧度；正 = 往下看）
  yawDamping: 7.5, // 方位角阻尼（走最短弧，跨 ±π 不兜整圈）
  posDamping: 6.2, // 机位水平阻尼
  posDampingY: 5, // 机位竖直阻尼（略慢于水平，转身画面才有重量）
  lookDamping: 9, // 视点水平阻尼（恒快于机位：先看后到）
  lookDampingY: 7, // 视点竖直阻尼
  distDamping: 3.2, // 距离阻尼（拉远 / 收近都柔）
  pitchDamping: 14, // 抬头量阻尼（鼠标一格一格跳，镜头不能跟着跳）
  snapTeleport: 60, // = 契约 CAMERA_SNAP_TELEPORT（§7.1）：跟随目标单帧位移 > 此值 ⇒ 渲染器自动 snap
  snapMaxDist: 20, // = 契约 CAMERA_SNAP_MAX_DIST（§7.1）：snap 后相机-目标距离上界（G1/G2 断言用）
  // —— locked 迟滞硬顶（LOOK-R2 O2，GDD §15.3；复盘 P1-6 补登记）——
  lockedYawSpan: Math.PI / 2 - 0.1, // = render LOCKED_YAW_SPAN（≈84°）：locked 下机位允许落后角色面向的上限。
  // 恒**严格大于** behindLimit：R3 咬合闸（≈75°）在内先咬，本值是更靠外的最后一道墙——
  // 两闸并存才都有活干，关系由 tuning.test.js 锁死。
  lockedHoldRate: 30, // = render LOCKED_HOLD_RATE（rad/s）：硬顶生效带宽 = rate×dt（lockedHoldSlack）
  lockedHoldMin: 0.25, // = render LOCKED_HOLD_MIN（rad）：带宽下夹
  lockedHoldMax: 1.2, // = render LOCKED_HOLD_MAX（rad）：带宽上夹（超出带宽 = 朝向被瞬移，硬顶整只让路）
  // —— 跟随角咬合闸（LOOK-R3 O2）——
  behindLimit: Math.PI / 2.4, // = render BEHIND_LIMIT（≈75°）：跟随角咬合闸的极角上限
  behindShell: 2, // = render BEHIND_SHELL：机位半径 > dist×本系数时松开咬合闸（重生追赶不横跳）
};

// 角色渲染对照登记（render/characters.js，O2 域；工程复盘 P0-3）。
// 与 CAMERA 同一套「登记不是权威」模式：实现权威在 render/characters.js，
// render 侧改值时回修此表；常量在实现里是模块私有，tuning.test.js 读源码对照锁两边同数。
export const CHARACTERS = {
  // = render/characters.js TELEPORT_DISTANCE（米）：模型位置插值的跳插值阈值——
  // 单帧位移 > 此值当传送，角色直接出现在新位置（damp 22 的位置弹簧不许把过门/重生摊成滑步）。
  // 16 管的是**模型**瞬移；CAMERA.snapTeleport = 60（= 契约 CAMERA_SNAP_TELEPORT，§7.1）管的是
  // **机位**——故意不是同一个数：局内重生瞬移最远 ≤ 2×arenaRadius = 40m，模型必须瞬移出现
  // （16 < 40），机位却不得 snap（60 > 40，重生的弹簧甩镜手感保留，契约 §14-33）。
  // 正常移动一帧最多一米出头（冲刺 ~17m/s ÷ 60Hz），远够不到 16，不会误伤。
  teleportDistance: 16,
};
