export function clampDt(dt, max = 0.05) {
  if (!Number.isFinite(dt) || dt < 0) return 0;
  return Math.min(max, dt);
}
