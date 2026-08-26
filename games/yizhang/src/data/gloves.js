// 异掌 · 手套数值表（Fable-3 负责，公式与设计意图见 docs/GDD.md）
// 纯数据，禁止 import three / DOM。数值单位：米、秒、米/秒。

/**
 * @typedef {Object} AwakenModifiers 觉醒 8s 期间叠加在基础值上的修正
 * @property {number} slapPowerMul   扇击击退倍率
 * @property {number} slapRangeMul   扇击距离倍率
 * @property {number} slapCooldownMul 扇击冷却倍率
 * @property {string} special        特殊效果 id，语义见 GDD §7
 * @property {Object} [params]       特殊效果参数
 */

/**
 * @typedef {Object} Glove
 * @property {string} id
 * @property {string} name        中文名
 * @property {string} role        职能定位
 * @property {string} desc        一句话说明（UI 用）
 * @property {string} color       识别色（饱和只给这里，见视觉手册）
 * @property {number} slapRange   扇击锥形判定半径（自角色中心）
 * @property {number} slapAngleDeg 扇击锥形全角
 * @property {number} slapPower   水平击退冲量（m/s）
 * @property {number} slapCooldown 扇击冷却（按下起算，含前后摇）
 * @property {number} windup      前摇（按下到判定生效）
 * @property {number} recovery    后摇（判定结束到可行动；打空同样吃满）
 * @property {number} moveSpeedMul 持该掌时移速倍率（重掌更慢）
 * @property {string|null} skillId 主动技 id（详参 skills.js），木棉无主动技
 * @property {number} skillCooldown 主动技冷却
 * @property {string} unlock      "default" 或 unlocks.js 中的挑战 id
 * @property {AwakenModifiers} awakenModifiers
 */

/** @type {Glove[]} */
export const GLOVES = [
  {
    id: "cotton",
    name: "木棉",
    role: "教学·基准",
    desc: "最轻最快的掌，宽判定，靠走位把人送下岛。",
    color: "#e3c988",
    slapRange: 2.6,
    slapAngleDeg: 110,
    slapPower: 9,
    slapCooldown: 0.55,
    windup: 0.16,
    recovery: 0.22,
    moveSpeedMul: 1.05,
    skillId: null, // 设计如此：无主动技，换手感换节奏
    skillCooldown: 0,
    unlock: "default",
    awakenModifiers: {
      slapPowerMul: 1.1,
      slapRangeMul: 1.1,
      slapCooldownMul: 0.85,
      special: "combo3", // 连续命中的第 3 掌强击退
      params: { comboPowerMul: 1.8, comboResetSeconds: 2.5 },
    },
  },
  {
    id: "granite",
    name: "磐石",
    role: "重击",
    desc: "慢而沉，一掌换半座岛，砸地能裂开台面。",
    color: "#7d8a99",
    slapRange: 2.9,
    slapAngleDeg: 75,
    slapPower: 15,
    slapCooldown: 1.15,
    windup: 0.42,
    recovery: 0.38,
    moveSpeedMul: 0.88,
    skillId: "quake_slam",
    skillCooldown: 7,
    unlock: "unlock_granite",
    awakenModifiers: {
      slapPowerMul: 1.2,
      slapRangeMul: 1.1,
      slapCooldownMul: 1.0,
      special: "slam_shatter", // 砸地直接击碎整块台面
      params: { slamTileDamage: 100, slamRadiusMul: 1.25 },
    },
  },
  {
    id: "gale",
    name: "疾风",
    role: "切入",
    desc: "掌轻步快，冲刺途中出掌带上冲势。",
    color: "#63c6b4",
    slapRange: 2.4,
    slapAngleDeg: 95,
    slapPower: 7.5,
    slapCooldown: 0.5,
    windup: 0.13,
    recovery: 0.2,
    moveSpeedMul: 1.08,
    skillId: "wind_rush",
    skillCooldown: 6,
    unlock: "unlock_gale",
    awakenModifiers: {
      slapPowerMul: 1.15,
      slapRangeMul: 1.1,
      slapCooldownMul: 0.9,
      special: "rush_steer", // 疾冲途中可转向一次
      params: { steerMaxDeg: 90 },
    },
  },
  {
    id: "frost",
    name: "冰霜",
    role: "控场",
    desc: "霜弧减速对手，把慢下来的人逼向裂缘。",
    color: "#9fd8ef",
    slapRange: 2.6,
    slapAngleDeg: 90,
    slapPower: 8.5,
    slapCooldown: 0.7,
    windup: 0.2,
    recovery: 0.26,
    moveSpeedMul: 1.0,
    skillId: "frost_arc",
    skillCooldown: 8,
    unlock: "unlock_frost",
    awakenModifiers: {
      slapPowerMul: 1.1,
      slapRangeMul: 1.1,
      slapCooldownMul: 1.0,
      special: "freeze", // 霜弧改为冻结
      params: { freezeSeconds: 0.8 },
    },
  },
  {
    id: "spring",
    name: "弹簧",
    role: "反制",
    desc: "架起弹簧，谁打谁被弹回去。",
    color: "#c98f3f",
    slapRange: 2.5,
    slapAngleDeg: 90,
    slapPower: 9.5,
    slapCooldown: 0.75,
    windup: 0.2,
    recovery: 0.28,
    moveSpeedMul: 1.0,
    skillId: "coil_counter",
    skillCooldown: 9,
    unlock: "unlock_spring",
    awakenModifiers: {
      slapPowerMul: 1.1,
      slapRangeMul: 1.1,
      slapCooldownMul: 1.0,
      special: "counter_launch", // 弹回附带小跳（把对方弹离地）
      params: { counterKnockUp: 4.5 },
    },
  },
  {
    id: "afterimage",
    name: "分身",
    role: "欺诈",
    desc: "留下残影换位，真假掌之间找破绽。",
    color: "#b48ade",
    slapRange: 2.5,
    slapAngleDeg: 100,
    slapPower: 8,
    slapCooldown: 0.6,
    windup: 0.15,
    recovery: 0.22,
    moveSpeedMul: 1.04,
    skillId: "phantom_swap",
    skillCooldown: 8,
    unlock: "unlock_afterimage",
    awakenModifiers: {
      slapPowerMul: 1.1,
      slapRangeMul: 1.1,
      slapCooldownMul: 0.9,
      special: "decoy_feint", // 残影会假挥掌并带轻微推撞
      params: { feintPower: 3, feintIntervalSeconds: 1.0 },
    },
  },
  {
    id: "magnet",
    name: "磁掌",
    role: "强制接近",
    desc: "把躲在台心的人拉到掌边，拒绝龟缩。",
    color: "#c94f43",
    slapRange: 2.7,
    slapAngleDeg: 85,
    slapPower: 10,
    slapCooldown: 0.8,
    windup: 0.22,
    recovery: 0.28,
    moveSpeedMul: 0.96,
    skillId: "iron_pull",
    skillCooldown: 9,
    unlock: "unlock_magnet",
    awakenModifiers: {
      slapPowerMul: 1.1,
      slapRangeMul: 1.1,
      slapCooldownMul: 1.0,
      special: "dual_pull", // 可拉 2 人并短暂黏住
      params: { pullTargets: 2, stickySeconds: 0.6 },
    },
  },
  {
    id: "meteor",
    name: "陨掌",
    role: "清场",
    desc: "腾空砸下，落点四散，觉醒时砸碎一圈台面。",
    color: "#e07840",
    slapRange: 2.8,
    slapAngleDeg: 80,
    slapPower: 12,
    slapCooldown: 0.95,
    windup: 0.3,
    recovery: 0.34,
    moveSpeedMul: 0.94,
    skillId: "sky_fall",
    skillCooldown: 11,
    unlock: "unlock_meteor",
    awakenModifiers: {
      slapPowerMul: 1.15,
      slapRangeMul: 1.1,
      slapCooldownMul: 1.0,
      special: "crater_ring", // 落地击碎一圈台面
      params: { craterTileDamage: 100, craterRadiusMul: 1.2 },
    },
  },
];

export const GLOVE_BY_ID = Object.fromEntries(GLOVES.map((g) => [g.id, g]));

// 对局常量：与 CONTRACT.md 一字不差，勿改字段名
export const MATCH = {
  dt: 1 / 60,
  arenaRadius: 20,
  playerRadius: 0.7,
  playerHeight: 2,
  fallY: -8,
  respawnDelay: 1.2,
  invulnTime: 1.0,
  matchSeconds: 240,
  killsToWin: 7,
  switchLock: 0.4,
  awakenDuration: 8,
};
