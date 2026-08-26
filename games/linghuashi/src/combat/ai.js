export const ENEMY_ATTACK_INTERVAL_MS = 1800;
export const ENEMY_TELEGRAPH_MS = 400;

/**
 * 敌人意图。
 * - 传入 opts.cooldownMs（距离下次出手的剩余毫秒）时按真实冷却判断，与 battle.tick 完全一致；
 * - 只传 (t, controlMs) 时退回旧的相位估算，保证既有调用不变。
 */
export function enemyIntent(t, controlMs = 0, opts = {}) {
  if (controlMs > 0) return "bound";
  const interval = Math.max(1, opts.intervalMs ?? ENEMY_ATTACK_INTERVAL_MS);
  const telegraph = Math.max(0, opts.telegraphMs ?? ENEMY_TELEGRAPH_MS);
  const cooldown = opts.cooldownMs;
  if (typeof cooldown === "number" && Number.isFinite(cooldown)) {
    return cooldown <= telegraph ? "strike" : "watch";
  }
  const phase = ((t % interval) + interval) % interval;
  return phase < telegraph ? "strike" : "watch";
}
