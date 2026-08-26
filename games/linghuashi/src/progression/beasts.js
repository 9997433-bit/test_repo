import { BEASTS } from "../data/beasts.js";

export const BEAST_COST = 40;
export const BEAST_SLOTS = 3;

export function catchBeast(save, rng = Math.random) {
  if ((save.beasts || []).length >= BEAST_SLOTS) return { ...save, notice: "灵兽栏已满（3 只随行）。" };
  if (save.qiPills < BEAST_COST) return { ...save, notice: `诱饵不足：收伏灵兽需 ${BEAST_COST} 灵气丹。` };
  const b = BEASTS[Math.floor(rng() * BEASTS.length)];
  return {
    ...save,
    qiPills: save.qiPills - BEAST_COST,
    beasts: [...save.beasts, { ...b, uid: `${b.id}-${Date.now()}-${save.beasts.length}` }],
    notice: `收得灵兽「${b.name}」（${b.desc || b.passive}）。`,
  };
}

export function releaseBeast(save, uid) {
  const beasts = (save.beasts || []).filter((b) => b.uid !== uid);
  if (beasts.length === (save.beasts || []).length) return save;
  return { ...save, beasts, notice: "灵兽归山，栏位已空出。" };
}

export function beastBonus(save) {
  const acc = { crit: 0, qiRegen: 0, shield: 0 };
  for (const b of save.beasts || []) acc[b.passive] = (acc[b.passive] || 0) + b.value;
  return acc;
}
