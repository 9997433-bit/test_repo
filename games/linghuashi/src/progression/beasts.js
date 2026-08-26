import { BEASTS } from "../data/beasts.js";

export function catchBeast(save, rng = Math.random) {
  if (save.beasts.length >= 3) return { ...save, notice: "灵兽栏已满。" };
  const b = BEASTS[Math.floor(rng() * BEASTS.length)];
  return {
    ...save,
    beasts: [...save.beasts, { ...b, uid: `${b.id}-${Date.now()}` }],
    notice: `收得灵兽「${b.name}」。`,
  };
}

export function beastBonus(save) {
  const acc = { crit: 0, qiRegen: 0, shield: 0 };
  for (const b of save.beasts || []) acc[b.passive] = (acc[b.passive] || 0) + b.value;
  return acc;
}
