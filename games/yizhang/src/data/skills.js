// 异掌 · 主动技参数表（掌上的 skillId → 这里的详细数值；语义见 docs/GDD.md §5）
// 纯数据。type 字段是 combat 实现的分派键。

export const SKILLS = {
  // 磐石：蓄力砸地，小范围击飞 + 伤台面
  quake_slam: {
    id: "quake_slam",
    type: "ground_slam",
    chargeMaxSeconds: 0.9, // 松手或蓄满释放
    minPower: 11, // 不蓄直接放
    maxPower: 16, // 蓄满
    radius: 3.2,
    knockUp: 6, // 高于护栏，重击不被栏挡
    selfSlowMulWhileCharging: 0.4,
    tileDamage: 35, // 台面块 HP 100 → 3 砸一块
  },

  // 疾风：面向疾冲，途中可扇（扇击加冲势）
  wind_rush: {
    id: "wind_rush",
    type: "dash_attack",
    distance: 8,
    duration: 0.45, // 冲速 ≈17.8 m/s
    slapDuringRush: true,
    rushSlapPowerBonus: 3.5, // 冲刺中出掌 7.5 → 11
    bodyCheckPower: 5, // 冲撞路径上的人被轻推
  },

  // 冰霜：霜弧减速
  frost_arc: {
    id: "frost_arc",
    type: "cone",
    range: 6,
    angleDeg: 70,
    power: 4, // 轻推，主要价值在减速
    slowMoveMul: 0.65, // 移速降到 65%
    slowSeconds: 2.2,
  },

  // 弹簧：0.5s 反击架势，挨打把攻击者弹回
  coil_counter: {
    id: "coil_counter",
    type: "counter_stance",
    windowSeconds: 0.5,
    reflectPower: 12, // 攻击者吃 12 击退，自己免疫该次击退
    reflectKnockUp: 2.5,
    failRecovery: 0.4, // 没人打则吃后摇
  },

  // 分身：留残影 + 短距换位
  phantom_swap: {
    id: "phantom_swap",
    type: "decoy_blink",
    blinkDistance: 4, // 沿移动方向瞬移
    decoySeconds: 2.5,
    decoyTauntWeight: 2.0, // Bot 目标选择里残影权重 ×2
  },

  // 磁掌：把锥内最近 1 人拉到面前
  iron_pull: {
    id: "iron_pull",
    type: "pull",
    range: 9,
    angleDeg: 40,
    arriveDistance: 1.6, // 拉到面前 1.6m（在扇击距离内）
    pullSpeed: 22,
    arrivalStagger: 0.45, // 到位踉跄，够转身接一掌
  },

  // 陨掌：自己腾空，落点范围击飞 + 伤台面
  sky_fall: {
    id: "sky_fall",
    type: "leap_slam",
    leapSpeed: 9, // 竖直起跳初速，滞空 ≈0.8s
    airControlMul: 0.6, // 空中可微调落点
    radius: 3.6,
    power: 14, // 由落点向外径向
    knockUp: 5,
    tileDamage: 30,
    selfLandRecovery: 0.5, // 落地自身硬直，给对手惩罚窗口
  },
};

export const SKILL_IDS = Object.keys(SKILLS);
