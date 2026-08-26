// sim 内置兜底战斗解算（纯函数，不改 state）。
// TODO(merge): `src/combat/index.js` 落地后 deps.js 自动改用真实实现；
// 导出名与 CONTRACT.md 一致：resolveSlap / resolveSkill / tickStatuses / applyAwaken。
//
// 约定的返回结构（sim 负责真正施加）：
//   { hits: [{ targetId, power, impulse:{x,y,z}, hitX, hitZ, tile, statuses, applied }], comboIndex }
// 若真实 combat 自己改了 state，请把 hit.applied 置 true，sim 就不会重复施加冲量。

import { PHYSICS } from "./constants.js";
import { forwardX, forwardZ, norm2 } from "./math.js";

/** 觉醒期覆盖 range / power / cooldown */
export function applyAwaken(attacker, glove) {
  if (!attacker || !glove) return glove;
  if (!(attacker.awakenedT > 0)) return glove;
  return {
    ...glove,
    slapRange: glove.slapRange * 1.18,
    slapPower: glove.slapPower * 1.35,
    slapCooldown: glove.slapCooldown * 0.85,
    awakened: true,
  };
}

function canBeHit(target, attacker) {
  return (
    target &&
    target !== attacker &&
    target.alive &&
    !(target.invulnT > 0) &&
    target.id !== attacker.id
  );
}

/** 扇击命中判定：面向扇形 + 高度重叠 */
export function resolveSlap(state, attacker, glove, now) {
  const eff = applyAwaken(attacker, glove);
  const hits = [];
  const comboIndex = (attacker.combo || 0) + 1;

  // 木棉觉醒：第 3 下强击退
  let comboMul = 1;
  if (eff.awakened && eff.id === "cotton" && comboIndex % 3 === 0) comboMul = 1.55;

  const fx = forwardX(attacker.yaw);
  const fz = forwardZ(attacker.yaw);
  const cosHalf = Math.cos((((eff.slapAngleDeg ?? 90) * Math.PI) / 180) * 0.5);
  const pr = state.config.playerRadius;
  const ph = state.config.playerHeight;

  for (const target of state.players) {
    if (!canBeHit(target, attacker)) continue;

    const dx = target.x - attacker.x;
    const dz = target.z - attacker.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > eff.slapRange + pr) continue;
    if (Math.abs(target.y - attacker.y) > ph * 0.95) continue;

    let dirX = fx;
    let dirZ = fz;
    if (dist > 1e-4) {
      const inv = 1 / dist;
      const tx = dx * inv;
      const tz = dz * inv;
      // 贴脸时跳过扇形判定，否则按面向锥体
      if (dist > 0.35 && tx * fx + tz * fz < cosHalf) continue;
      // 冲量方向：偏向“打飞出去”的连线方向，掺一点面向
      const blend = norm2(tx * 0.62 + fx * 0.38, tz * 0.62 + fz * 0.38);
      if (blend.len > 1e-6) {
        dirX = blend.x;
        dirZ = blend.z;
      }
    }

    const power = eff.slapPower * comboMul;
    const scale = target.knockScale || 1;
    const mag = power * scale;

    const statuses = [];
    // TODO(merge): 状态由真实 combat 定义，这里只给冰霜一个占位减速
    if (eff.id === "frost") statuses.push({ id: "slow", t: 1.2, mag: 0.45 });

    let tile = null;
    if (power >= PHYSICS.heavyTileThreshold) {
      tile = {
        x: target.x,
        z: target.z,
        amount: (power - PHYSICS.heavyTileThreshold + 4) * PHYSICS.tileDamagePerPower,
      };
    }

    hits.push({
      targetId: target.id,
      power,
      impulse: { x: dirX * mag, y: mag * PHYSICS.knockLift, z: dirZ * mag },
      hitX: attacker.x + fx * (eff.slapRange * 0.6),
      hitZ: attacker.z + fz * (eff.slapRange * 0.6),
      tile,
      statuses,
      applied: false,
    });
  }

  return { hits, comboIndex, comboMul, awakened: !!eff.awakened, now };
}

/**
 * 主动技兜底：木棉无技能；其余手套给一个通用推掌，只为把输入链路跑通。
 * TODO(merge): 8 掌真实主动技在 combat 实现。
 */
export function resolveSkill(state, attacker, glove, now) {
  if (!glove || !glove.skillId) return { ok: false, reason: "no-skill", hits: [] };

  const eff = applyAwaken(attacker, glove);
  const radius = eff.slapRange + 1.6;
  const hits = [];

  for (const target of state.players) {
    if (!canBeHit(target, attacker)) continue;
    const dx = target.x - attacker.x;
    const dz = target.z - attacker.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > radius + state.config.playerRadius) continue;
    const dir = norm2(dx, dz);
    const dirX = dir.len > 1e-6 ? dir.x : forwardX(attacker.yaw);
    const dirZ = dir.len > 1e-6 ? dir.z : forwardZ(attacker.yaw);
    const power = eff.slapPower * 0.85;
    const mag = power * (target.knockScale || 1);
    hits.push({
      targetId: target.id,
      power,
      impulse: { x: dirX * mag, y: mag * 0.3, z: dirZ * mag },
      hitX: target.x,
      hitZ: target.z,
      tile: null,
      statuses: [],
      applied: false,
    });
  }

  return {
    ok: true,
    skillId: eff.skillId,
    cooldown: eff.skillCooldown || 6,
    hits,
    selfImpulse: null,
    now,
  };
}

/** 状态计时。id 约定：slow(mag) / freeze / stun / root */
export function tickStatuses(state, dt) {
  for (const p of state.players) {
    const list = p.statuses;
    if (!list || list.length === 0) continue;
    for (let i = list.length - 1; i >= 0; i--) {
      list[i].t -= dt;
      if (list[i].t <= 0) list.splice(i, 1);
    }
  }
}
