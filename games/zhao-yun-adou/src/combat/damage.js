/**
 * 唯一的伤害入口。之前 sim.js 的 harm() 会扣护盾、skills.js 却直接 e.hp -= x，
 * 于是「盾」型 boss 被大招无视 —— 现在两边共用这里，护盾/斩杀/击退语义一致。
 *
 * 所有入口一律写成 `!(x > 0)` 而不是 `x <= 0`：读档可能带回 NaN 血量 / NaN 进度，
 * 后者在比较里永远为假，会让敌人变成打不死也走不动的钉子户，整条战线的波次
 * 就此卡住。非有限值在这里统一当作「已经出局」或「回落到默认值」。
 */
export function applyDamage(enemy, amount, opts = {}) {
  const out = { dealt: 0, absorbed: 0, killed: false, shieldBroken: false };
  if (!enemy || !(enemy.hp > 0) || !(amount > 0)) return out;
  let dmg = amount;
  if (enemy.shield > 0 && !opts.ignoreShield) {
    const use = Math.min(enemy.shield, dmg);
    enemy.shield -= use;
    dmg -= use;
    out.absorbed = use;
    out.shieldBroken = enemy.shield <= 0;
  }
  if (dmg > 0) {
    enemy.hp -= dmg;
    out.dealt = dmg;
  }
  out.killed = enemy.hp <= 0;
  return out;
}

/** 低于阈值直接斩杀（关羽的斩将手感），返回是否触发。 */
export function execute(enemy, hpRatio) {
  if (!enemy || !(enemy.hp > 0)) return false;
  const max = enemy.maxHp > 0 ? enemy.maxHp : enemy.hp;
  if (!(enemy.hp / max <= hpRatio)) return false;
  enemy.hp = 0;
  return true;
}

export function applyStun(enemy, seconds) {
  if (!enemy || !(enemy.hp > 0) || !(seconds > 0)) return 0;
  enemy.stun = Math.max(enemy.stun > 0 ? enemy.stun : 0, seconds);
  return enemy.stun;
}

/** 减速：mul<1 表示变慢，持续 seconds 秒。 */
export function applySlow(enemy, mul, seconds) {
  if (!enemy || !(enemy.hp > 0) || !(seconds > 0)) return;
  const m = Number.isFinite(mul) ? Math.max(0.1, Math.min(1, mul)) : 1;
  const current = Number.isFinite(enemy.slowMul) ? enemy.slowMul : 1;
  if (enemy.slowT > 0) enemy.slowMul = Math.min(current, m);
  else enemy.slowMul = m;
  enemy.slowT = Math.max(enemy.slowT > 0 ? enemy.slowT : 0, seconds);
}

/** 击退：把进度往回推，最多退回起点。 */
export function knockback(enemy, deltaT) {
  if (!enemy || !(enemy.hp > 0) || !(deltaT > 0)) return 0;
  const before = Number.isFinite(enemy.t) ? enemy.t : 0;
  enemy.t = Math.max(0, before - deltaT);
  return before - enemy.t;
}
