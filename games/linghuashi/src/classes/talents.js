export const TALENTS = [
  { id: "might", name: "符咒威能", tree: "atk", per: 0.06 },
  { id: "affinity", name: "元素亲和", tree: "atk", per: 0.05 },
  { id: "combo", name: "挥毫连击", tree: "atk", per: 0.08 },
  { id: "ward", name: "护盾稳固", tree: "def", per: 0.1 },
  { id: "dodge", name: "灵动身法", tree: "def", per: 0.04 },
  { id: "bastion", name: "壁垒本能", tree: "def", per: 0.08 },
  { id: "spring", name: "回春之笔", tree: "sup", per: 0.12 },
  { id: "linger", name: "增益延绵", tree: "sup", per: 0.08 },
  { id: "control", name: "控制专精", tree: "sup", per: 0.1 },
];

export function talentMult(save, tree) {
  return TALENTS.filter((t) => t.tree === tree).reduce((acc, t) => acc + (save.talents?.[t.id] || 0) * t.per, 1);
}

export function applyTalent(save, id) {
  const t = TALENTS.find((x) => x.id === id);
  if (!t) return save;
  const cur = save.talents?.[id] || 0;
  if (cur >= 5 || save.qiPills < 12) return save;
  return {
    ...save,
    qiPills: save.qiPills - 12,
    talents: { ...save.talents, [id]: cur + 1 },
  };
}
