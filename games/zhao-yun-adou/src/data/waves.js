export const MAX_WAVE = 12;

export function waveSpec(wave) {
  const w = Math.max(1, Math.min(MAX_WAVE, wave));
  const boss = w % 4 === 0;
  return {
    wave: w,
    count: 4 + w,
    hp: 20 + w * 14,
    speed: 28 + w * 1.6,
    reward: 2 + Math.floor(w / 2),
    boss: boss
      ? { hp: 90 + w * 28, speed: 22 + w, skill: w === 12 ? "split" : w === 8 ? "shield" : "haste" }
      : null,
    interval: Math.max(0.35, 0.85 - w * 0.03),
  };
}

export function leakCompensation(wave) {
  return 8 + 2 * wave;
}
