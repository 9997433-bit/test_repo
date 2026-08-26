export const ARTIFACTS = [
  { id: "qixing", name: "七星灯", slot: "defend", rarity: "gold", desc: "生命低于 30% 时减伤 35%", trigger: "lowhp30", effect: { damageTakenMul: 0.65 } },
  { id: "wanhun", name: "万魂灯", slot: "defend", rarity: "red", desc: "阵亡时复活一次并回复 33% 生命", trigger: "death", effect: { reviveHp: 0.33 } },
  { id: "yinyang", name: "阴阳镜", slot: "defend", rarity: "gold", desc: "生命低于 10% 时立即回复 22% 生命（一场一次）", trigger: "lowhp10", effect: { healPct: 0.22 } },
  { id: "zhumo", name: "一玄宗诛魔刃", slot: "attack", rarity: "red", desc: "普攻 25% 概率造成 220% 伤害，否则 70%", trigger: "attack", effect: { gamble: [0.25, 2.2, 0.7] } },
  { id: "canyang", name: "残阳妖铠", slot: "attack", rarity: "gold", desc: "开场 6 秒后每秒对全体敌人灼烧 4% 攻击", trigger: "tick", effect: { burnAtk: 0.04, after: 6 } },
  { id: "zhenyue", name: "镇岳钟", slot: "attack", rarity: "gold", desc: "对首领/怪物生命低于 12% 时斩杀", trigger: "hit", effect: { execute: 0.12, bossOnly: true } },
  { id: "zhuque", name: "朱雀赤羽弓", slot: "attack", rarity: "red", desc: "技能伤害 +22%", trigger: "skill", effect: { skillMul: 1.22 } },
  { id: "yaoguang", name: "瑶光潜渊贝", slot: "defend", rarity: "red", desc: "开场护盾 18% 最大生命，3 星起可触发两次", trigger: "start", effect: { shieldPct: 0.18 } },
  { id: "huagu", name: "化骨聚灵樽", slot: "util", rarity: "red", desc: "暴击率 +12%", trigger: "passive", effect: { crit: 0.12 } },
  { id: "taixu", name: "太虚金丹鼎", slot: "util", rarity: "red", desc: "大招冷却 -18%", trigger: "passive", effect: { ultHaste: 0.18 } },
  { id: "lundao", name: "论道堪舆图", slot: "util", rarity: "gold", desc: "普攻伤害 +16%", trigger: "passive", effect: { basicMul: 1.16 } },
  { id: "qinglong", name: "青龙翻海印", slot: "util", rarity: "red", desc: "技能 30% 晕眩 1.2 秒", trigger: "skill", effect: { stun: 1.2, chance: 0.3 } },
];

export function artifactById(id) {
  return ARTIFACTS.find((a) => a.id === id) ?? null;
}

export const STARTER_ARTIFACTS = ["qixing", "lundao"];
