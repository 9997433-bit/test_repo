import * as beastData from "../data/beasts.js";

const BEASTS = beastData.BEASTS || [];

/** 键名走变量：图鉴表还没定价时，打包器不会报「缺少导出」。 */
function readData(key) {
  return beastData[key] || null;
}

export const BEAST_CAP = 3;
export const MAX_STAR = 3;
/** 按星级索引的被动倍率，STAR_MULT[1] 为初始值。 */
export const STAR_MULT = [0, 1, 1.65, 2.6];
export const EVOLVE_COST = 30;
export const REROLL_COST = 18;

/**
 * 收兽定价：优先花包子（挂机产出的唯一出口），包子不够再花灵气丹。
 * 数值以图鉴表里的 CATCH_COST 为准，表里没有就用兜底 6 包子 / 8 丹。
 */
const DATA_CATCH_COST = readData("CATCH_COST") || readData("CATCH_BEAST_COST");
const BUNS_COST = Number.isFinite(beastData.BEAST_CATCH_COST) ? beastData.BEAST_CATCH_COST : 36;
export const CATCH_COST = {
  buns: Number.isFinite(DATA_CATCH_COST?.buns) ? DATA_CATCH_COST.buns : BUNS_COST,
  qiPills: Number.isFinite(DATA_CATCH_COST?.qiPills) ? DATA_CATCH_COST.qiPills : (Number.isFinite(beastData.BEAST_REROLL_COST) ? 8 : 8),
};

const PASSIVES = ["crit", "qiRegen", "shield"];
const PASSIVE_BASE = BEASTS.reduce((acc, b) => {
  if (b.passive && acc[b.passive] == null) acc[b.passive] = b.value;
  return acc;
}, {});

/** 这一次收兽拿什么付账：包子优先，其次灵气丹，都不够则 null。 */
export function catchPayment(save) {
  if ((save?.buns || 0) >= CATCH_COST.buns) return { currency: "buns", amount: CATCH_COST.buns, label: "包子" };
  if ((save?.qiPills || 0) >= CATCH_COST.qiPills) return { currency: "qiPills", amount: CATCH_COST.qiPills, label: "灵气丹" };
  return null;
}

/**
 * 纯函数：花包子或灵气丹收一只一星灵兽。
 * 栏位已满或付不起时只回写 notice，不扣资源、不给兽。
 */
export function catchBeast(save, rng = Math.random, nowMs = Date.now()) {
  const owned = save.beasts || [];
  if (owned.length >= BEAST_CAP) return { ...save, notice: "灵兽栏已满。" };
  const pay = catchPayment(save);
  if (!pay) return { ...save, notice: `收兽需包子 ${CATCH_COST.buns} 或灵气丹 ${CATCH_COST.qiPills}。` };
  const b = BEASTS[Math.min(BEASTS.length - 1, Math.floor(rng() * BEASTS.length))];
  const uid = `${b.id}-${nowMs.toString(36)}-${Math.floor(rng() * 1679616).toString(36)}`;
  return {
    ...save,
    [pay.currency]: (save[pay.currency] || 0) - pay.amount,
    beasts: [...owned, { ...b, uid, star: 1 }],
    notice: `收得灵兽「${b.name}」，耗${pay.label} ${pay.amount}。`,
  };
}

export function beastBonus(save) {
  const acc = { crit: 0, qiRegen: 0, shield: 0 };
  for (const b of save?.beasts || []) {
    if (!b?.passive) continue;
    const v = Number.isFinite(b.value) ? b.value : beastValue(b.passive, b.star);
    acc[b.passive] = (acc[b.passive] || 0) + v;
  }
  return acc;
}

/** 某被动在指定星级下的数值。 */
export function beastValue(passive, star = 1) {
  const base = PASSIVE_BASE[passive] ?? 0;
  const mult = STAR_MULT[Math.min(MAX_STAR, Math.max(1, star || 1))] ?? 1;
  return Math.round(base * mult * 1000) / 1000;
}

export function evolveCost(star = 1) {
  return EVOLVE_COST * Math.max(1, star);
}

/**
 * 纯函数：同种同星的两只灵兽合成一只高星灵兽，腾出一个栏位。
 * 失败时只回写 notice，不扣资源。
 */
export function evolveBeast(save, uidA, uidB) {
  const owned = save?.beasts || [];
  if (!uidA || !uidB || uidA === uidB) return { ...save, notice: "需选两只不同灵兽。" };
  const main = owned.find((b) => b.uid === uidA);
  const fodder = owned.find((b) => b.uid === uidB);
  if (!main || !fodder) return { ...save, notice: "未找到该灵兽。" };
  if (main.id !== fodder.id) return { ...save, notice: "只有同种灵兽可以合成。" };
  const star = main.star || 1;
  if ((fodder.star || 1) !== star) return { ...save, notice: "需同星灵兽方可合成。" };
  if (star >= MAX_STAR) return { ...save, notice: `「${main.name}」已至 ${MAX_STAR} 星。` };
  const cost = evolveCost(star);
  if ((save.qiPills || 0) < cost) return { ...save, notice: `合成需灵气丹 ${cost}。` };
  const merged = { ...main, star: star + 1, value: beastValue(main.passive, star + 1) };
  return {
    ...save,
    qiPills: save.qiPills - cost,
    beasts: owned.filter((b) => b.uid !== uidB).map((b) => (b.uid === uidA ? merged : b)),
    notice: `「${main.name}」融合，晋 ${star + 1} 星。`,
  };
}

/**
 * 纯函数：花灵气丹洗练被动，必定换成另一种被动，数值按当前星级重算。
 * rng 可注入以便测试。
 */
export function rerollPassive(save, uid, rng = Math.random) {
  const owned = save?.beasts || [];
  const cur = owned.find((b) => b.uid === uid);
  if (!cur) return { ...save, notice: "未找到该灵兽。" };
  if ((save.qiPills || 0) < REROLL_COST) return { ...save, notice: `洗练需灵气丹 ${REROLL_COST}。` };
  const pool = PASSIVES.filter((p) => p !== cur.passive);
  if (!pool.length) return { ...save, notice: "无可换的被动。" };
  const passive = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
  const next = { ...cur, passive, value: beastValue(passive, cur.star || 1) };
  return {
    ...save,
    qiPills: save.qiPills - REROLL_COST,
    beasts: owned.map((b) => (b.uid === uid ? next : b)),
    notice: `「${cur.name}」洗出「${passive}」。`,
  };
}
