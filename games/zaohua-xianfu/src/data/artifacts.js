/**
 * 法器表。战斗层（combat/artifacts.js 的 artifactLoadout）按 effect 形状解析，无硬编码：
 * - trigger "passive"                     → crit / ultHaste / basicMul / skillMul（可复合，同类相加/相乘）
 * - trigger "lowhpNN" + damageTakenMul    → 护佑：生命低于 NN% 时减伤（多件不叠加，取减伤更深的一件）
 * - trigger "lowhpNN" + healPct           → 自救：生命低于 NN% 立即回血，全队合计一场一次（取阈值更高的一件）
 * - effect.reviveHp                       → 复活：我方每名上阵者阵亡时各复活一次（每人每场一次）并回复该比例生命
 * - effect.gamble [概率, 高倍, 低倍]       → 普攻搏击（多件不叠加，取后装）
 * - effect.burnAtk + after                → 开场 after 秒后每秒真实灼烧全体敌人（多件不叠加，取后装）
 * - effect.execute (+bossOnly)            → 斩杀线（多件不叠加，取后装）
 * - trigger "skill" + skillMul            → 秘技增伤（多件相乘）
 * - effect.stun + chance                  → 秘技附带晕眩（多件不叠加，取后装）
 * - trigger "start" + shieldPct           → 开场护盾（多件相加）
 * `source` 标注获取途径，与文末 ARTIFACT_DROPS 掉落节点一一对应。
 * 兼容性：id 永不删除；只增字段与新条目。
 */
export const ARTIFACTS = [
  // ─── 防御 ───
  { id: "qixing", name: "七星灯", slot: "defend", rarity: "gold", desc: "生命低于 30% 时减伤 35%", trigger: "lowhp30", effect: { damageTakenMul: 0.65 }, source: "开局所赠" },
  { id: "wanhun", name: "万魂灯", slot: "defend", rarity: "red", desc: "我方上阵者阵亡时各复活一次并回复 33% 生命（每人每场一次）", trigger: "death", effect: { reviveHp: 0.33 }, source: "登天塔 10 层首通" },
  { id: "yinyang", name: "阴阳镜", slot: "defend", rarity: "gold", desc: "生命低于 10% 时立即回复 22% 生命（全队一场一次）", trigger: "lowhp10", effect: { healPct: 0.22 }, source: "登天塔 20 层首通" },
  { id: "yaoguang", name: "瑶光潜渊贝", slot: "defend", rarity: "red", desc: "开场全队护盾 18% 最大生命", trigger: "start", effect: { shieldPct: 0.18 }, source: "兽潮第 8 波首破" },
  { id: "xuangui", name: "玄龟宝甲", slot: "defend", rarity: "gold", desc: "生命低于 45% 时减伤 22%（与七星灯不叠加，取减伤更深者）", trigger: "lowhp45", effect: { damageTakenMul: 0.78 }, source: "兽潮第 12 波首破" },
  { id: "dinghai", name: "定海珠", slot: "defend", rarity: "gold", desc: "开场全队护盾 14% 最大生命（与瑶光叠加）", trigger: "start", effect: { shieldPct: 0.14 }, source: "登天塔 24 层首通" },
  { id: "sanguang", name: "三光神水瓶", slot: "defend", rarity: "red", desc: "生命低于 25% 立即回复 30% 生命（全队一场一次，与阴阳镜取阈值更高者）", trigger: "lowhp25", effect: { healPct: 0.3 }, source: "登天塔 32 层首通" },
  // ─── 攻击 ───
  { id: "zhumo", name: "一玄宗诛魔刃", slot: "attack", rarity: "red", desc: "普攻 25% 概率造成 220% 伤害，否则 70%", trigger: "attack", effect: { gamble: [0.25, 2.2, 0.7] }, source: "登天塔 5 层首通" },
  { id: "canyang", name: "残阳妖铠", slot: "attack", rarity: "gold", desc: "开场 6 秒后每秒灼烧全体敌人 4% 攻击（真实伤害）", trigger: "tick", effect: { burnAtk: 0.04, after: 6 }, source: "兽潮第 5 波首破" },
  { id: "zhenyue", name: "镇岳钟", slot: "attack", rarity: "gold", desc: "首领生命低于 12% 时直接斩杀", trigger: "hit", effect: { execute: 0.12, bossOnly: true }, source: "登天塔 25 层首通" },
  { id: "zhuque", name: "朱雀赤羽弓", slot: "attack", rarity: "red", desc: "秘技伤害 +22%", trigger: "skill", effect: { skillMul: 1.22 }, source: "登天塔 15 层首通" },
  { id: "liuhuo", name: "流火梭", slot: "attack", rarity: "gold", desc: "开场 4 秒后每秒灼烧全体敌人 3% 攻击（与残阳不叠加，取后装）", trigger: "tick", effect: { burnAtk: 0.03, after: 4 }, source: "兽潮第 16 波首破" },
  { id: "zhanxian", name: "斩仙飞刀", slot: "attack", rarity: "red", desc: "任意敌人生命低于 8% 时直接斩杀（与镇岳钟取后装）", trigger: "hit", effect: { execute: 0.08 }, source: "登天塔 35 层首通" },
  // ─── 通用 ───
  { id: "huagu", name: "化骨聚灵樽", slot: "util", rarity: "red", desc: "暴击率 +12%", trigger: "passive", effect: { crit: 0.12 }, source: "兽潮第 20 波首破" },
  { id: "taixu", name: "太虚金丹鼎", slot: "util", rarity: "red", desc: "秘技冷却 -18%", trigger: "passive", effect: { ultHaste: 0.18 }, source: "登天塔 28 层首通" },
  { id: "lundao", name: "论道堪舆图", slot: "util", rarity: "gold", desc: "普攻伤害 +16%", trigger: "passive", effect: { basicMul: 1.16 }, source: "开局所赠" },
  { id: "qinglong", name: "青龙翻海印", slot: "util", rarity: "red", desc: "秘技 30% 概率晕眩目标 1.2 秒", trigger: "skill", effect: { stun: 1.2, chance: 0.3 }, source: "登天塔 40 层首通" },
  { id: "bagua", name: "八卦炉心", slot: "util", rarity: "gold", desc: "暴击率 +6%，普攻伤害 +8%", trigger: "passive", effect: { crit: 0.06, basicMul: 1.08 }, source: "兽潮第 10 波首破" },
  { id: "hetu", name: "河图洛书", slot: "util", rarity: "red", desc: "秘技伤害 +18%（与朱雀弓相乘）", trigger: "passive", effect: { skillMul: 1.18 }, source: "登天塔 30 层首通" },
  { id: "kongtong", name: "崆峒印", slot: "util", rarity: "gold", desc: "秘技冷却 -15%", trigger: "passive", effect: { ultHaste: 0.15 }, source: "兽潮第 14 波首破" },
];

export function artifactById(id) {
  return ARTIFACTS.find((a) => a.id === id) ?? null;
}

export function artifactsBySlot(slot) {
  return ARTIFACTS.filter((a) => a.slot === slot);
}

export const STARTER_ARTIFACTS = ["qixing", "lundao"];

/**
 * 法器掉落节点表——发放的唯一事实来源（AD-9）。
 * store 的 RESOLVE_COMBAT 须按 via/at 读本表发放（tower 用 tower.best、wave 用 wave.best 判首通）；
 * store 现存 TOWER_ARTIFACTS/WAVE_ARTIFACTS 硬编码只覆盖塔 5/10/15 与潮 5/8 五个节点，
 * 本轮改读本表后删除硬编码（Owner: Opus-1）。接线前，新增节点仅在图鉴展示获取途径、不发放。
 *
 * 节点位次沿用 GDD 法器总表的既定获取位，并与进度墙对齐：
 * 续航防具链 阴阳镜(塔20)→定海珠(塔24)→三光神水瓶(塔32) 与 玄龟宝甲(潮12)
 * 全部落在 40+ 硬墙之前——专为补魔族「缺可持续回复」的终盘短板；
 * 掉落三系同享，人/神自带奶与盾、防槽边际收益小，不破坏三系平衡（GDD「魔族续航」一节）。
 * 兼容性：只增节点；已发放节点的 id/via/at 不改。
 */
export const ARTIFACT_DROPS = [
  // ─── 登天塔首通 ───
  { id: "zhumo", via: "tower", at: 5 },
  { id: "wanhun", via: "tower", at: 10 },
  { id: "zhuque", via: "tower", at: 15 },
  { id: "yinyang", via: "tower", at: 20 },
  { id: "dinghai", via: "tower", at: 24 },
  { id: "zhenyue", via: "tower", at: 25 },
  { id: "taixu", via: "tower", at: 28 },
  { id: "hetu", via: "tower", at: 30 },
  { id: "sanguang", via: "tower", at: 32 },
  { id: "zhanxian", via: "tower", at: 35 },
  { id: "qinglong", via: "tower", at: 40 },
  // ─── 兽潮首破 ───
  { id: "canyang", via: "wave", at: 5 },
  { id: "yaoguang", via: "wave", at: 8 },
  { id: "bagua", via: "wave", at: 10 },
  { id: "xuangui", via: "wave", at: 12 },
  { id: "kongtong", via: "wave", at: 14 },
  { id: "liuhuo", via: "wave", at: 16 },
  { id: "huagu", via: "wave", at: 20 },
];
