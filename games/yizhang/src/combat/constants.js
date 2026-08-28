// 异掌 · 战斗常量
// 纯数据，无 three / DOM 依赖。
// `src/data/gloves.js` 落地后由 index.js 优先读取 GLOVE_BY_ID；此处是同构的兜底表。

/** 觉醒（掌意满）期间的通用倍率。手套可在 awakened 段里覆盖。 */
export const AWAKEN = {
  duration: 8,
  rangeMul: 1.18,
  powerMul: 1.45,
  cooldownMul: 0.8,
  windupMul: 0.75,
  recoveryMul: 0.85,
  skillCooldownMul: 0.75,
};

/** 掌意（meter）收支。0..1，满则觉醒。 */
export const METER = {
  onHitDealt: 0.06,
  onHitTaken: 0.09,
  onSkillHit: 0.1,
  onParry: 0.18,
  onKill: 0.25,
  decayPerSec: 0.008,
};

/** 击退累积：被扇越多越轻，越容易飞出去。0 起，上限 IMPACT.max。 */
export const IMPACT = {
  perPower: 0.045,
  max: 1.6,
  decayPerSec: 0.06,
  knockbackMul: 1,
};

/** 命中判定与击退基础参数。 */
export const HIT = {
  reachHeight: 2.2,
  closeBonus: 0.35,
  liftRatio: 0.26,
  liftMax: 6,
  // 受击后的「飞行窗口」：这段时间内 sim 应大幅削弱地面摩擦与转向控制，
  // 否则击退瞬间就被摩擦吃光，永远打不出岛。写在 target.knockbackT 上。
  knockbackTimePerSpeed: 0.055,
  knockbackTimeMin: 0.18,
  knockbackTimeMax: 0.9,
  frozenKnockbackMul: 1.25,
  behindMul: 1.15,
  behindAngleDeg: 100,
  // 受击硬直（FJ-04）：扇击命中即给目标挂 `stun`。**只锁出招**（canAct=false），
  // 位移与击退一概不锁——被扇飞那一段必须照常滑出去，否则谁也打不出岛。
  // 与 `src/data/tuning.js` 的 `KNOCKBACK.hitstun` 同源（两边同数由 hitstun-timing.test.js 锁），
  // 且必须 ≤ hitstunMax、小于最快扇击冷却，连段才不会变成无限连。
  hitstun: 0.32,
  hitstunMax: 0.5,
  // 「重击」门槛：有效击退（命中记录的 `power`）≥ 此值算重击，写在命中记录与事件的 `heavy` 上。
  // 与 `src/data/tuning.js` 的 `KNOCKBACK.heavyPowerThreshold` 同源（碎地也按同一条线，见 data/tiles.js）。
  heavyPowerThreshold: 12,
  maxEvents: 512,
};

/** 残影暂存区（`state.combat.ghosts` → `view.combat.ghosts`）。 */
export const GHOSTS = {
  // 分身换位两端各留一具，8s 冷却里最多两具同时在场；上限只是病态输入的保险丝。
  max: 24,
  defaultTtl: 1.6,
};

/** 场地兜底（MATCH 未注入时使用）。 */
export const ARENA = {
  radius: 20,
  playerRadius: 0.7,
  playerHeight: 2,
  fallY: -8,
  invulnTime: 1,
  tileRadius: 1.5,
  tileHp: 100,
};

/** 状态默认强度。tickStatuses 依据这些值折算 moveScale / canAct。 */
export const STATUS_DEFAULT = {
  slow: { mag: 0.4, t: 2 },
  freeze: { mag: 1, t: 0.8 },
  stun: { mag: 1, t: HIT.hitstun },
  sticky: { mag: 0.35, t: 1.2 },
  parryWindow: { mag: 1, t: 0.5 },
  invuln: { mag: 1, t: 1 },
};

export const STATUS_KINDS = ["slow", "freeze", "stun", "sticky", "parryWindow", "invuln"];

/**
 * 八掌主动技数值。`awakened` 段在觉醒时浅覆盖同名键。
 * 单位：距离 m，时间 s，冲量 m/s（直接加到水平速度）。
 */
export const SKILLS = {
  // 木棉：无主动。觉醒时改由「第 3 下」触发强击退（见 index.js 的 cottonChain）。
  none: {
    id: "none",
    passiveOnly: true,
    awakenThirdHitMul: 2.2,
    awakenThirdHitLift: 5,
  },

  // 磐石：蓄力砸地，小范围击飞 + 砸裂脚下台面。
  groundPound: {
    id: "groundPound",
    castTime: 0.3,
    selfRoot: 0.3,
    radius: 5,
    impulse: 9,
    impulseMin: 3.5,
    lift: 6,
    tileDamage: 45,
    awakened: { radius: 6.2, impulse: 11.7, impulseMin: 4.6, lift: 7, tileDamage: 80 },
  },

  // 疾风：面向冲刺，冲刺途中碰到人自动扇一下。
  dashSlap: {
    id: "dashSlap",
    speed: 26,
    duration: 0.28,
    hitRadius: 1.9,
    impulse: 6.5,
    lift: 2,
    hitsPerTarget: 1,
    turns: 0,
    awakened: { speed: 29, duration: 0.34, impulse: 8.5, lift: 2.6, turns: 1 },
  },

  // 冰霜：霜弧减速，觉醒改为先冻结再减速。
  frostArc: {
    id: "frostArc",
    range: 6,
    angleDeg: 120,
    impulse: 2.5,
    lift: 0,
    slowMag: 0.45,
    slowTime: 2.2,
    freezeTime: 0,
    awakened: { range: 6.8, impulse: 3.2, slowMag: 0.55, slowTime: 2.6, freezeTime: 0.8 },
  },

  // 弹簧：0.5s 反击窗口，挨打把伤害弹回去。
  parry: {
    id: "parry",
    window: 0.5,
    reflectMul: 1.35,
    reflectBase: 4,
    reflectLift: 1.5,
    hop: 0,
    awakened: { window: 0.62, reflectMul: 1.6, reflectBase: 5, reflectLift: 2.2, hop: 5 },
  },

  // 分身：留残影 + 与身前敌人换位（无目标则向前短闪）。
  blinkSwap: {
    id: "blinkSwap",
    range: 9,
    blinkDistance: 6,
    ghostTtl: 1.6,
    invulnTime: 0.25,
    fakeSlapAt: 0,
    fakeSlapRange: 2.8,
    fakeSlapImpulse: 0,
    awakened: {
      range: 10.5,
      ghostTtl: 2,
      invulnTime: 0.35,
      fakeSlapAt: 0.45,
      fakeSlapImpulse: 1.6,
    },
  },

  // 磁掌：把身前的人拽过来，觉醒可拽 2 人并黏住。
  magnetPull: {
    id: "magnetPull",
    range: 8,
    angleDeg: 100,
    targets: 1,
    pullPerMeter: 3.5,
    pullMin: 6,
    pullMax: 14,
    stickyTime: 0,
    stickyMag: 0.35,
    awakened: { range: 9, targets: 2, pullMax: 16, stickyTime: 1.2 },
  },

  // 陨掌：自己腾空，delay 后砸下。觉醒落地裂一圈台。
  meteorSlam: {
    id: "meteorSlam",
    launchVy: 14,
    delay: 0.85,
    radius: 6.5,
    impulse: 14,
    impulseMin: 5,
    lift: 7,
    selfInvuln: 0.9,
    tileDamage: 35,
    ringInner: 0,
    ringOuter: 0,
    ringTileDamage: 0,
    awakened: {
      launchVy: 16,
      radius: 7.5,
      impulse: 17,
      impulseMin: 6.5,
      lift: 8,
      tileDamage: 50,
      ringInner: 3,
      ringOuter: 8,
      ringTileDamage: 90,
    },
  },
};

/**
 * 兜底手套表，字段集与 CONTRACT 的 `src/data/gloves.js` 一致。
 * 数据代理落地后 index.js 会优先用真实表，这里只保证 combat 单独可跑。
 */
export const FALLBACK_GLOVES = [
  {
    id: "cotton",
    name: "木棉",
    role: "教学",
    color: "#e8dcc6",
    slapRange: 2.6,
    slapAngleDeg: 100,
    slapPower: 7,
    slapCooldown: 0.42,
    windup: 0.08,
    recovery: 0.14,
    skillId: "none",
    skillCooldown: 0,
    unlock: "default",
  },
  {
    id: "granite",
    name: "磐石",
    role: "重击",
    color: "#8d8b84",
    slapRange: 2.9,
    slapAngleDeg: 80,
    slapPower: 12,
    slapCooldown: 0.85,
    windup: 0.22,
    recovery: 0.32,
    skillId: "groundPound",
    skillCooldown: 9,
    unlock: "challenge:granite",
  },
  {
    id: "gale",
    name: "疾风",
    role: "切入",
    color: "#9fd8cf",
    slapRange: 2.4,
    slapAngleDeg: 120,
    slapPower: 6,
    slapCooldown: 0.34,
    windup: 0.06,
    recovery: 0.1,
    skillId: "dashSlap",
    skillCooldown: 6,
    unlock: "challenge:gale",
  },
  {
    id: "frost",
    name: "冰霜",
    role: "控",
    color: "#a8c6e8",
    slapRange: 3.1,
    slapAngleDeg: 110,
    slapPower: 5.5,
    slapCooldown: 0.5,
    windup: 0.1,
    recovery: 0.18,
    skillId: "frostArc",
    skillCooldown: 7,
    unlock: "challenge:frost",
  },
  {
    id: "spring",
    name: "弹簧",
    role: "反制",
    color: "#d8c46a",
    slapRange: 2.5,
    slapAngleDeg: 95,
    slapPower: 6.5,
    slapCooldown: 0.46,
    windup: 0.09,
    recovery: 0.16,
    skillId: "parry",
    skillCooldown: 5,
    unlock: "challenge:spring",
  },
  {
    id: "afterimage",
    name: "分身",
    role: "欺诈",
    color: "#b9a8d8",
    slapRange: 2.5,
    slapAngleDeg: 100,
    slapPower: 6,
    slapCooldown: 0.44,
    windup: 0.08,
    recovery: 0.15,
    skillId: "blinkSwap",
    skillCooldown: 8,
    unlock: "challenge:afterimage",
  },
  {
    id: "magnet",
    name: "磁掌",
    role: "强控",
    color: "#c76b58",
    slapRange: 2.7,
    slapAngleDeg: 90,
    slapPower: 6.8,
    slapCooldown: 0.5,
    windup: 0.12,
    recovery: 0.2,
    skillId: "magnetPull",
    skillCooldown: 7.5,
    unlock: "challenge:magnet",
  },
  {
    id: "meteor",
    name: "陨掌",
    role: "清场",
    color: "#e0a24a",
    slapRange: 3,
    slapAngleDeg: 85,
    slapPower: 10,
    slapCooldown: 0.7,
    windup: 0.18,
    recovery: 0.28,
    skillId: "meteorSlam",
    skillCooldown: 12,
    unlock: "challenge:meteor",
  },
];

export const FALLBACK_GLOVE_BY_ID = Object.fromEntries(FALLBACK_GLOVES.map((g) => [g.id, g]));

export const DEFAULT_GLOVE_ID = "cotton";
