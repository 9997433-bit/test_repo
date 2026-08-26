/** 战斗结算脚手架。Opus-2 负责完整实现。 */
export function resolveHit(egg, target, ctx = {}) {
  const base = egg?.power ?? 10;
  const combo = ctx.combo ?? 0;
  return {
    damage: Math.max(1, Math.round(base * (1 + combo * 0.06))),
    effects: [],
    comboDelta: 1,
  };
}
