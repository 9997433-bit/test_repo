export const TALISMANS = {
  line: { id: "pierce", name: "穿云剑", qi: 12, key: "1", glyph: "—", tags: ["pierce"], desc: "单体穿透，越直越痛" },
  curve: { id: "bind", name: "缚灵丝", qi: 14, key: "2", glyph: "⌒", tags: ["control"], desc: "束缚敌人并附带伤害" },
  circle: { id: "ward", name: "护体罡", qi: 16, key: "3", glyph: "○", tags: ["shield"], desc: "闭合成盾，抵挡反噬" },
  zigzag: { id: "rupture", name: "破军刺", qi: 18, key: "4", glyph: "∿", tags: ["shred"], desc: "破甲叠层，穿刺爆发" },
  spiral: { id: "array", name: "五行阵", qi: 22, key: "5", glyph: "◉", tags: ["aoe"], desc: "阵法轰击，倍率最高" },
  cloud: { id: "spring", name: "回春笔", qi: 15, key: "6", glyph: "☁", tags: ["heal"], desc: "云篆济世，回复生命" },
  scribble: { id: "ink", name: "余墨", qi: 4, key: "", glyph: "·", tags: ["basic"], desc: "笔意散乱时的残墨" },
};

// 键盘施法顺序（与教程一致）
export const CASTABLE_TYPES = ["line", "curve", "circle", "zigzag", "spiral", "cloud"];

export function talismanByKey(key) {
  const type = CASTABLE_TYPES.find((t) => TALISMANS[t].key === key);
  return type ? { type, talisman: TALISMANS[type] } : null;
}
