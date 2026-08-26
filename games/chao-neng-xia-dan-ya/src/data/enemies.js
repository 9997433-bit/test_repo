/**
 * 敌人与 BOSS 静态表（纯数据）。
 *
 * 普通敌人 hp/contactDmg 为第 1 章基准值，实战 = 基准 × 关卡 hpMult/dmgMult
 * （见 stages.js 每关字段、tower.js 每层字段、artifacts.js 肉鸽波次缩放）。
 * BOSS 数值为其所在关卡的绝对值，不再乘关卡倍率。
 *
 * 字段约定：
 * - hp / armor        生命 / 护甲（护甲为固定减伤值，破甲效果见 elements.js）
 * - contactDmg        漏到发射台时对玩家生命的接触伤害
 * - speed             移动速度（px/s，0 = 不动）
 * - res               元素抗性 { fire, ice, thunder }，伤害 ×(1-res)；负数为易伤
 * - behavior          行为标签（modes/ai 消费，仅字符串约定）：
 *     static_brick 嵌在砖阵中不动 | patrol_fly 横向巡逻 | slow_advance 缓慢逼近
 *     side_step 左右横移 | totem 固定图腾 | zigzag_fly 之字飞行 | trail_burn 灼热行军
 *     slide_charge 滑冰冲锋 | hover_shield 悬浮护盾机 | swarm_rush 成群冲刺
 * - skill             回合间隔技能（可选）{ name, everyTurns, ...params }
 * - thorns            反震：蛋命中时对玩家反弹的伤害（可选）
 * - goldDrop          击杀金币
 * - size              碰撞半径（px）
 */
export const ENEMIES = {
  slime_brick: {
    id: "slime_brick",
    name: "史莱姆砖怪",
    hp: 30, armor: 0, contactDmg: 6, speed: 0,
    res: { fire: 0, ice: 0, thunder: 0 },
    behavior: "static_brick", goldDrop: 3, size: 18,
    desc: "伪装成砖块的果冻怪，戳一下 duang duang 弹。",
  },
  pigeon_bandit: {
    id: "pigeon_bandit",
    name: "飞行鸽盗",
    hp: 22, armor: 0, contactDmg: 5, speed: 40,
    res: { fire: 0, ice: 0, thunder: 0 },
    behavior: "patrol_fly", goldDrop: 4, size: 14,
    desc: "戴眼罩的空中小偷，专挑弹道死角里飞。",
  },
  armor_pig: {
    id: "armor_pig",
    name: "盔甲猪",
    hp: 55, armor: 6, contactDmg: 10, speed: 15,
    res: { fire: 0.2, ice: 0, thunder: 0 },
    behavior: "slow_advance", goldDrop: 6, size: 20,
    desc: "全身铁皮的坦克猪，怕雷不怕火烤。",
  },
  spike_crab: {
    id: "spike_crab",
    name: "钉盾蟹",
    hp: 45, armor: 3, contactDmg: 12, speed: 20,
    res: { fire: 0, ice: 0.2, thunder: 0 },
    behavior: "side_step", thorns: 2,
    goldDrop: 6, size: 18,
    desc: "举着钉板横着走，硬碰硬会被扎（反震 2 点）。",
  },
  heal_totem: {
    id: "heal_totem",
    name: "回复图腾",
    hp: 40, armor: 0, contactDmg: 0, speed: 0,
    res: { fire: 0, ice: 0, thunder: 0 },
    behavior: "totem",
    skill: { name: "群体治疗", everyTurns: 1, healAmount: 8, radius: 120 },
    goldDrop: 8, size: 16,
    desc: "每回合给周围敌人回血的木头桩子，优先拆它。",
  },
  neon_moth: {
    id: "neon_moth",
    name: "霓虹蛾",
    hp: 26, armor: 0, contactDmg: 5, speed: 55,
    res: { fire: 0, ice: 0, thunder: 0.3 },
    behavior: "zigzag_fly", goldDrop: 5, size: 13,
    desc: "夜市灯牌养出来的荧光蛾，抗电不抗拍。",
  },
  magma_snail: {
    id: "magma_snail",
    name: "岩浆蜗",
    hp: 60, armor: 2, contactDmg: 9, speed: 10,
    res: { fire: 0.5, ice: -0.3, thunder: 0 },
    behavior: "trail_burn", goldDrop: 7, size: 19,
    desc: "背着温泉小火锅的蜗牛，冰系克星料理。",
  },
  frost_seal: {
    id: "frost_seal",
    name: "冰铃海豹",
    hp: 50, armor: 1, contactDmg: 8, speed: 45,
    res: { fire: -0.3, ice: 0.5, thunder: 0 },
    behavior: "slide_charge", goldDrop: 7, size: 18,
    desc: "肚皮贴冰面漂移的海豹，一把火就化成温泉。",
  },
  volt_drone: {
    id: "volt_drone",
    name: "电路蜂",
    hp: 34, armor: 2, contactDmg: 7, speed: 50,
    res: { fire: 0, ice: -0.2, thunder: 0.5 },
    behavior: "hover_shield",
    skill: { name: "护盾投影", everyTurns: 3, shieldAmount: 10, target: "randomAlly" },
    goldDrop: 7, size: 13,
    desc: "都市电网孵出的机械蜂，会给队友套小护盾。",
  },
  kitchen_rat: {
    id: "kitchen_rat",
    name: "后厨鼠",
    hp: 24, armor: 0, contactDmg: 8, speed: 70,
    res: { fire: 0, ice: 0, thunder: 0 },
    behavior: "swarm_rush", goldDrop: 5, size: 12,
    desc: "魔王厨房编制员工，人多嘴杂跑得飞快。",
  },
  chef_fox: {
    id: "chef_fox",
    name: "厨子狐",
    elite: true,
    hp: 130, armor: 4, contactDmg: 18, speed: 25,
    res: { fire: 0.3, ice: 0, thunder: 0 },
    behavior: "slow_advance",
    skill: { name: "平底锅飞掷", everyTurns: 2, dmg: 12, pattern: "column" },
    goldDrop: 25, size: 22,
    desc: "拿平底锅当回旋镖的精英主厨，锅到蛋除。",
  },
};

/** 精英词缀：普通敌人标记 elite 时套用（chef_fox 自带精英身价，不再叠加）。 */
export const ELITE_MODS = {
  hpMult: 2.2,
  dmgMult: 1.5,
  goldMult: 3,
  sizeMult: 1.25,
  shardDropChance: 0.35,
};

/**
 * BOSS 表（每章末关绝对数值）。
 * - phases: 按剩余血量百分比触发的阶段变化
 * - summon: 周期召唤
 * - skills: 周期技能（everyTurns 回合一次）
 */
export const BOSSES = {
  scarecrow_roc: {
    id: "scarecrow_roc",
    name: "稻草大鹏",
    chapter: 1,
    hp: 550, armor: 0, contactDmg: 15,
    res: { fire: -0.2, ice: 0, thunder: 0 },
    size: 46,
    skills: [{ name: "羽刃横扫", everyTurns: 3, dmg: 10, pattern: "row" }],
    summon: { id: "pigeon_bandit", n: 2, everyTurns: 2 },
    phases: [{ hpPct: 0.5, effect: "summonEveryTurns", value: 1, desc: "血量过半后召唤间隔缩短为每回合" }],
    goldDrop: 120,
    desc: "农场秸秆扎成的巨鸟，怕火，鸽子小弟无限续杯。",
  },
  bbq_king: {
    id: "bbq_king",
    name: "烤串大王",
    chapter: 2,
    hp: 1450, armor: 2, contactDmg: 18,
    res: { fire: 0.3, ice: 0, thunder: 0 },
    size: 48,
    skills: [{ name: "三串齐发", everyTurns: 2, dmg: 8, pattern: "columns3" }],
    summon: null,
    phases: [{ hpPct: 0.4, effect: "dmgMult", value: 1.3, desc: "血量低于 40% 时火力全开，技能伤害 ×1.3" }],
    goldDrop: 200,
    desc: "夜市炉火之魂，扇子一挥三列铁钎从天而降。",
  },
  magma_bathmaster: {
    id: "magma_bathmaster",
    name: "岩浆浴霸",
    chapter: 3,
    hp: 2700, armor: 5, contactDmg: 20,
    res: { fire: 0.6, ice: -0.4, thunder: 0 },
    size: 50,
    skills: [{ name: "岩浆泼洒", everyTurns: 2, dmg: 10, pattern: "aoe" }],
    summon: { id: "magma_snail", n: 1, everyTurns: 3 },
    phases: [{ hpPct: 0.5, effect: "floorBurn", value: 4, desc: "血量过半后地板灼热，每回合末对玩家造成 4 点伤害" }],
    goldDrop: 300,
    desc: "泡在温泉里不肯出来的岩浆巨兽，带冰凤去物理劝浴。",
  },
  sea_god_statue: {
    id: "sea_god_statue",
    name: "海神雕像",
    chapter: 4,
    hp: 4300, armor: 10, contactDmg: 20,
    res: { fire: 0, ice: 0.6, thunder: -0.3 },
    size: 52,
    skills: [{ name: "冰封发射台", everyTurns: 3, effect: "aimArcLimit", value: 30, durationTurns: 1 }],
    summon: { id: "frost_seal", n: 2, everyTurns: 3 },
    phases: [{ hpPct: 0.5, effect: "armor", value: 16, desc: "血量过半后石壳硬化，护甲 10 → 16（雷系超导破甲收益极大）" }],
    goldDrop: 420,
    desc: "冰川港的镇港石像，会把你的瞄准角冻住半边。",
  },
  mecha_incubator: {
    id: "mecha_incubator",
    name: "机械孵化器",
    chapter: 5,
    hp: 6600, armor: 12, contactDmg: 22,
    res: { fire: -0.2, ice: 0, thunder: 0.6 },
    size: 54,
    skills: [{ name: "紧急孵化", everyTurns: 2, effect: "summonBurst" }],
    summon: { id: "volt_drone", n: 2, everyTurns: 2 },
    phases: [
      { hpPct: 0.66, effect: "shield", value: 200, desc: "血量 66% 时展开 200 点能量护盾" },
      { hpPct: 0.33, effect: "shield", value: 200, desc: "血量 33% 时再次展开 200 点能量护盾" },
    ],
    goldDrop: 560,
    desc: "都市电网的心脏，一边挨打一边孵电路蜂。",
  },
  demon_fryer: {
    id: "demon_fryer",
    name: "魔王油锅",
    chapter: 6,
    hp: 9800, armor: 8, contactDmg: 25,
    res: { fire: 0.25, ice: 0.25, thunder: 0.25 },
    size: 58,
    skills: [{ name: "沸油飞溅", everyTurns: 2, dmg: 12, pattern: "aoe" }],
    summon: { id: "kitchen_rat", n: 3, everyTurns: 3 },
    phases: [{ hpPct: 0.3, effect: "enrage", value: 1.5, desc: "血量低于 30% 时暴走：技能伤害 ×1.5，接触伤害升至 35" }],
    goldDrop: 800,
    desc: "最终 BOSS：一口想把全体禽类下锅的魔性油锅。",
  },
};

export const BOSS_LIST = Object.values(BOSSES);
