/**
 * 技能静态表（纯数据，结算逻辑由 src/combat 实现）。
 *
 * 字段约定：
 * - id / name / desc  展示信息
 * - owner             所属英雄 id（golden_smash 为通用）
 * - trigger           触发时机：
 *     "active"        主动大招（消耗 energyCost）
 *     "onFire"        发射时修改本蛋属性
 *     "onHit"         主蛋命中敌人时
 *     "onCollide"     蛋与钉/砖/蛋碰撞时
 *     "onTurnEnd"     回合结束结算
 *     "onRecall"      蛋回收（落底/静止）时
 *     "onBattleStart" 战斗开始时
 *     "aura"          常驻光环
 * - energyCost        仅 trigger === "active" 时有效
 * - params            数值参数（升星词条会覆盖同名键，见 heroes.starPerks[].mod）
 */
export const SKILLS = {
  /* ---------- 连击 combo ---------- */
  dash_crit: {
    id: "dash_crit",
    name: "极速冲膛",
    owner: "dash_duck",
    trigger: "onFire",
    desc: "发射瞬间短距冲刺：蛋初速 +15%，本回合首次命中必定暴击（暴伤 175%）。",
    params: { eggSpeedPct: 0.15, firstHitCritMult: 1.75, guaranteedCritHits: 1 },
  },
  shuriken_split: {
    id: "shuriken_split",
    name: "影分身手里剑",
    owner: "ninja_goose",
    trigger: "onHit",
    desc: "主蛋命中敌人后追加 2 枚小手里剑蛋（各 35% 攻击，继承 70% 速度），每回合最多触发 3 次。",
    params: { shurikenCount: 2, shurikenPct: 0.35, speedInherit: 0.7, maxProcsPerTurn: 3 },
  },
  dusk_slash: {
    id: "dusk_slash",
    name: "暮色斩",
    owner: "fallen_crow",
    trigger: "active",
    energyCost: 100,
    desc: "对当前连击目标挥出 320% 攻击的黑羽斩；连击≥8 层时强化为 480% 攻击。",
    params: { slashPct: 3.2, comboThreshold: 8, comboSlashPct: 4.8, energyRefundPct: 0, bossBonusPct: 0 },
  },
  encore_wing: {
    id: "encore_wing",
    name: "返场安可",
    owner: "dandy_pigeon",
    trigger: "active",
    energyCost: 90,
    desc: "为其他 4 名英雄各回复 30% 能量，自身下一枚蛋伤害 +20%。",
    params: { energyGrantPct: 0.3, selfNextEggPct: 0.2 },
  },

  /* ---------- 直殴 brute ---------- */
  solar_burn: {
    id: "solar_burn",
    name: "日轮余烬",
    owner: "sun_bird",
    trigger: "onHit",
    desc: "主蛋命中附加灼烧：每秒 40% 攻击的火伤，持续 3 秒（同目标不叠加，刷新时长）。",
    params: { burnDpsPct: 0.4, burnSec: 3, burnStacks: 1, vsBurningPct: 0 },
  },
  gear_egg: {
    id: "gear_egg",
    name: "齿轮铁蛋",
    owner: "mech_goose",
    trigger: "onFire",
    desc: "蛋质量 +60%，对砖块伤害 ×2；每击碎一块砖获得 1 层穿透（上限 2）。",
    params: { massPct: 0.6, brickDmgMult: 2, pierceOnBrick: 1, maxPierce: 2, energyPerBrick: 0 },
  },
  war_drum: {
    id: "war_drum",
    name: "开战军鼓",
    owner: "drum_chick",
    trigger: "aura",
    desc: "常驻光环：全队攻击 +12%。",
    params: { auraAtkPct: 0.12, auraCritPct: 0, teamStartEnergy: 0 },
  },
  pep_start: {
    id: "pep_start",
    name: "元气满满",
    owner: "pep_chick",
    trigger: "onBattleStart",
    desc: "每场战斗第 1 回合额外发射 1 枚元气蛋（80% 攻击）。",
    params: { bonusEggCount: 1, bonusEggPct: 0.8, bonusEggTurns: 1, bonusEggEnchant: false },
  },

  /* ---------- 属性 elemental ---------- */
  shock_bounce: {
    id: "shock_bounce",
    name: "雷光追踪",
    owner: "thunder_chick",
    trigger: "onHit",
    desc: "主蛋命中附加感电（雷附着 6 秒）；蛋反弹时向最近敌人轻微转向（强度 0.35）。",
    params: { shockSec: 6, steerStrength: 0.35, shockVulnPct: 0 },
  },
  chain_groove: {
    id: "chain_groove",
    name: "电流律动",
    owner: "hiphop_duck",
    trigger: "onHit",
    desc: "对感电目标造成伤害时，向最近 2 个敌人扩散 60% 伤害的电弧。",
    params: { spreadTargets: 2, spreadPct: 0.6, chainDepth: 1, energyPerSpread: 0 },
  },
  afterglow_bolt: {
    id: "afterglow_bolt",
    name: "极光谢幕",
    owner: "bird_of_paradise",
    trigger: "onTurnEnd",
    desc: "回合结束时，对每个带感电的敌人补一道 120% 攻击的雷击（每回合至多 3 个目标）。",
    params: { boltPct: 1.2, maxTargets: 3, stunChance: 0, stunSec: 0, boltTriggersReactions: false },
  },
  blizzard: {
    id: "blizzard",
    name: "凛冬暴风雪",
    owner: "ice_phoenix",
    trigger: "active",
    energyCost: 120,
    desc: "全场冰爆：对所有敌人造成 150% 攻击冰伤并冻结 1.2 秒，附加 1 层冰附着。",
    params: { blizzardPct: 1.5, freezeSec: 1.2, iceStacks: 1, postUltIceEnchant: false },
  },
  glacier_march: {
    id: "glacier_march",
    name: "冰川行军",
    owner: "emperor_penguin",
    trigger: "aura",
    desc: "全队冻结效果持续 +40%；每回合开始在场地底部生成一段低摩擦冰面。",
    params: { freezeDurMult: 1.4, spawnIcePatch: true, icePatchSpeedPct: 0, vsFrozenPct: 0 },
  },

  /* ---------- 碰撞/辅助 collide ---------- */
  feeding_frenzy: {
    id: "feeding_frenzy",
    name: "越弹越大",
    owner: "shark_eagle",
    trigger: "onCollide",
    desc: "每次碰撞（钉/砖/蛋）使蛋半径 +1（上限 +8）、伤害 +4%（上限 +40%）。",
    params: { radiusPerBounce: 1, maxRadiusBonus: 8, perBouncePct: 0.04, bounceDmgCap: 0.4, shockwavePer4Pct: 0 },
  },
  antler_split: {
    id: "antler_split",
    name: "鹿角分蛋术",
    owner: "deer_chick",
    trigger: "onCollide",
    desc: "累计 6 次碰撞后蛋分裂为两枚（各 55% 伤害），每回合最多分裂 2 次。",
    params: { bouncesToSplit: 6, splitCount: 2, splitPct: 0.55, maxSplitsPerTurn: 2, splitInheritsBonus: false },
  },
  yolk_heal: {
    id: "yolk_heal",
    name: "蛋黄补给",
    owner: "heal_duck",
    trigger: "onRecall",
    desc: "蛋被回收时，回复玩家 4% 最大生命。",
    params: { healPct: 0.04, overhealShield: 0, leakReducePct: 0 },
  },
  shell_guard: {
    id: "shell_guard",
    name: "铁壳圆盾",
    owner: "guard_duck",
    trigger: "active",
    energyCost: 80,
    desc: "生成 1 层蛋壳护盾，抵挡下一次漏怪/接触伤害。",
    params: { shieldCharges: 1, thornsOnCast: 0, startShield: 0 },
  },
  grace_waltz: {
    id: "grace_waltz",
    name: "湖畔圆舞曲",
    owner: "grace_goose",
    trigger: "aura",
    desc: "常驻光环：敌人移动与技能间隔延长 15%；全队命中有 20% 概率附加冰附着。",
    params: { slowPct: 0.15, iceAttachChance: 0.2, vsSlowedPct: 0, enemySkillDelay: 0 },
  },

  /* ---------- 通用 ---------- */
  golden_smash: {
    id: "golden_smash",
    name: "黄金暴击蛋",
    owner: null,
    trigger: "active",
    energyCost: 100,
    desc: "通用大招：下一枚蛋伤害 +60% 且必定暴击（被动型英雄的默认大招）。",
    params: { nextEggPct: 0.6, guaranteedCrit: true },
  },
};

export const SKILL_LIST = Object.values(SKILLS);
