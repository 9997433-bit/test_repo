import { beastBonus } from "../progression/beasts.js";

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

/** 天赋定价与等级上限的唯一来源；UI 展示同一份数字，不要再自己抄一个常量。 */
export const TALENT_COST = 12;
export const TALENT_MAX_LEVEL = 5;

export function talentMult(save, tree) {
  return TALENTS.filter((t) => t.tree === tree).reduce((acc, t) => acc + (save.talents?.[t.id] || 0) * t.per, 1);
}

/** 纯函数：升一级天赋。失败时回写 notice，不扣灵气丹（未知 id 原样返回，连提示都不给）。 */
export function applyTalent(save, id) {
  const t = TALENTS.find((x) => x.id === id);
  if (!t) return save;
  const cur = save.talents?.[id] || 0;
  if (cur >= TALENT_MAX_LEVEL) return { ...save, notice: `「${t.name}」已至满级。` };
  if ((save.qiPills || 0) < TALENT_COST) return { ...save, notice: `参悟需灵气丹 ${TALENT_COST}。` };
  return {
    ...save,
    qiPills: save.qiPills - TALENT_COST,
    talents: { ...save.talents, [id]: cur + 1 },
    notice: `「${t.name}」精进至 ${cur + 1} 级。`,
  };
}

/**
 * 纯函数：把天赋树与灵兽被动汇总成一份战斗系数。
 * atk / shield / heal / control 为倍率（基准 1），
 * crit 为暴击率（0~0.6），qiRegen 为每秒额外灵气，shieldFlat 为灵兽提供的固定护盾。
 */
export function battleModifiers(save) {
  const beast = beastBonus(save);
  return {
    atk: sumTalent(save, "might", "affinity", "combo"),
    shield: sumTalent(save, "ward", "dodge", "bastion"),
    heal: sumTalent(save, "spring", "linger"),
    control: sumTalent(save, "control", "linger"),
    crit: round3(Math.min(0.6, Math.max(0, beast.crit || 0))),
    qiRegen: round3(Math.max(0, beast.qiRegen || 0)),
    shieldFlat: round3(Math.max(0, beast.shield || 0)),
  };
}

function sumTalent(save, ...ids) {
  return ids.reduce((acc, id) => {
    const t = TALENTS.find((x) => x.id === id);
    return acc + (save?.talents?.[id] || 0) * (t?.per || 0);
  }, 1);
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}
