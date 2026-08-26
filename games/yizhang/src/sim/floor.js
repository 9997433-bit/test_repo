// 台面伤害的唯一入口：combat 命中、技能钩子、测试都走这里，
// 保证事件、brokenCount、stats 三处始终一致。

import { damageTile } from "./arena.js";
import { pushEvent } from "./state.js";

export function damageFloor(state, x, z, amount) {
  const r = damageTile(state.arena, x, z, amount);
  if (!r) return null;
  pushEvent(state, {
    type: r.broken ? "tileBreak" : "tileCrack",
    i: r.tile.i,
    x: r.tile.x,
    z: r.tile.z,
    hp: r.tile.hp,
    maxHp: r.tile.maxHp,
  });
  if (r.broken) state.stats.tilesBroken++;
  return r;
}
