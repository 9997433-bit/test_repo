// 运动积分、地面/护栏/圆柱碰撞、击退施加。60Hz 步长友好，dt 更大时由 step 切分。

import { isSupported } from "./arena.js";
import { PHYSICS } from "./constants.js";
import { playerInHub } from "./hub.js";
import { clamp, damp, forwardX, forwardZ, len2 } from "./math.js";

/**
 * 由 statuses 推出的行动修正。
 * combat 的状态项是 `{ kind, t, mag }`，sim 早期兜底用的是 `{ id, t, mag }`，两种都认。
 * `rootUntil` 是 combat 技能（磐石砸地）的自锁，只锁移动不锁出招。
 */
export function statusMods(p, now = 0) {
  let speedMul = 1;
  let canMove = true;
  let canAct = true;

  for (const s of p.statuses) {
    if (!s) continue;
    if (Number.isFinite(s.t) && s.t <= 0) continue;
    const kind = s.kind || s.id;
    if (kind === "slow") speedMul *= 1 - clamp(s.mag ?? 0.4, 0, 0.9);
    else if (kind === "sticky") speedMul *= 1 - clamp(s.mag ?? 0.35, 0, 0.95);
    else if (kind === "freeze") {
      canMove = false;
      canAct = false;
    } else if (kind === "stun") canAct = false;
    else if (kind === "root") canMove = false;
  }

  if (Number.isFinite(p.rootUntil) && p.rootUntil > now) canMove = false;

  return { speedMul, canMove, canAct };
}

/** 输入的移动向量（默认世界系；input.moveSpace === 'local' 时按 yaw 旋转） */
export function readMoveVector(p, input) {
  let mx = Number.isFinite(input.moveX) ? input.moveX : 0;
  let mz = Number.isFinite(input.moveZ) ? input.moveZ : 0;
  if (input.moveSpace === "local") {
    const fx = forwardX(p.yaw);
    const fz = forwardZ(p.yaw);
    // 右手方向 = forward 顺时针 90°
    const rx = -fz;
    const rz = fx;
    const wx = rx * mx + fx * mz;
    const wz = rz * mx + fz * mz;
    mx = wx;
    mz = wz;
  }
  const l = len2(mx, mz);
  if (l > 1) {
    mx /= l;
    mz /= l;
  }
  return { x: mx, z: mz, len: Math.min(l, 1) };
}

/** 水平：输入加速 + 摩擦；竖直：重力。惯性来自“加速度有限 + 指数摩擦”。 */
export function integratePlayer(state, p, input, mods, dt) {
  const move = readMoveVector(p, input);
  const hasInput = mods.canMove && move.len > 0.05;

  if (p.dashT > 0) {
    // 冲刺期间直接接管水平速度
    p.vx = p.dashDirX * PHYSICS.dashSpeed;
    p.vz = p.dashDirZ * PHYSICS.dashSpeed;
  } else if (hasInput) {
    const awakenMul = p.awakenedT > 0 ? 1.06 : 1;
    const targetSpeed = PHYSICS.maxSpeed * mods.speedMul * awakenMul;
    let control = 1;
    if (!p.grounded) control *= PHYSICS.airControl;
    if (p.attack.phase !== "idle") control *= PHYSICS.windupSlow;
    if (p.kbT > 0) control *= 0.18;

    const dvx = move.x * targetSpeed - p.vx;
    const dvz = move.z * targetSpeed - p.vz;
    const dl = len2(dvx, dvz);
    const step = Math.min(dl, PHYSICS.moveAccel * control * dt);
    if (dl > 1e-6) {
      p.vx += (dvx / dl) * step;
      p.vz += (dvz / dl) * step;
    }
  }

  // 摩擦 / 空气阻力
  if (p.dashT <= 0) {
    let rate;
    if (p.kbT > 0) rate = PHYSICS.knockFriction;
    else if (!p.grounded) rate = PHYSICS.airDrag;
    else rate = hasInput ? PHYSICS.groundFriction * 0.1 : PHYSICS.groundFriction;
    p.vx = damp(p.vx, rate, dt);
    p.vz = damp(p.vz, rate, dt);
  }

  // 重力
  const gScale = p.dashT > 0 ? PHYSICS.dashGravityScale : 1;
  p.vy -= PHYSICS.gravity * gScale * dt;
  if (p.dashT > 0 && p.vy < -2) p.vy = -2;
  if (p.vy < -45) p.vy = -45;

  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.z += p.vz * dt;
}

/** 落地判定 + 边缘低护栏（挡轻击/走位，不挡重击） */
export function resolveGround(state, p, dt) {
  const arena = state.arena;
  const floorY = arena.floorY;
  const supported = isSupported(arena, p.x, p.z);
  // 只有“从上方穿过台面”才算落地，已经在台面以下的（掉进洞里/被塞到台下）继续掉
  const prevY = p.y - p.vy * dt;
  const cameFromAbove = prevY >= floorY - 1e-4;

  if (p.y <= floorY && p.vy <= 0 && supported && cameFromAbove) {
    p.y = floorY;
    p.vy = 0;
    if (!p.grounded) {
      p.grounded = true;
      p.knockScale = Math.max(1, p.knockScale - 0.15); // 落地回一点受击倍率
    }
    p.coyoteT = PHYSICS.coyoteTime;
  } else {
    if (p.grounded) p.coyoteT = PHYSICS.coyoteTime;
    p.grounded = false;
    p.coyoteT = Math.max(0, p.coyoteT - dt);
  }

  if (!p.grounded) return;

  // 失控中（被扇飞）不吃护栏：击退必须能把人送出岛，否则谁也打不死谁。
  if (p.kbT > 0) return;

  const r = len2(p.x, p.z);
  const limit = arena.radius - PHYSICS.railInset;
  if (r <= limit || r < 1e-6) return;

  const nx = p.x / r;
  const nz = p.z / r;
  p.x = nx * limit;
  p.z = nz * limit;
  const radial = p.vx * nx + p.vz * nz;
  if (radial > 0) {
    p.vx -= radial * nx;
    p.vz -= radial * nz;
  }
}

/** 圆柱互推，避免叠人 */
export function separatePlayers(state) {
  const list = state.players;
  const rr = state.config.playerRadius * 2;
  const h = state.config.playerHeight * 0.9;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (!a.alive) continue;
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      if (!b.alive) continue;
      if (Math.abs(a.y - b.y) > h) continue;
      let dx = b.x - a.x;
      let dz = b.z - a.z;
      let d = len2(dx, dz);
      if (d >= rr) continue;
      if (d < 1e-5) {
        dx = 0.01 * (i + 1);
        dz = 0.01 * (j + 1);
        d = len2(dx, dz);
      }
      const nx = dx / d;
      const nz = dz / d;
      const pen = (rr - d) * 0.5;
      a.x -= nx * pen;
      a.z -= nz * pen;
      b.x += nx * pen;
      b.z += nz * pen;

      // 只吃掉互相靠近的那部分相对速度，别把击退抹平
      const rel = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
      if (rel < 0) {
        const imp = rel * 0.5;
        a.vx += nx * imp;
        a.vz += nz * imp;
        b.vx -= nx * imp;
        b.vz -= nz * imp;
      }
    }
  }
}

/** 施加击退冲量：水平速度冲量 + 小抬升 + 失控时间 + 受击倍率增长。安全区里的人不吃。 */
export function applyKnockback(state, p, ix, iy, iz, fromId) {
  if (playerInHub(state, p)) return 0;
  const mag = len2(ix, iz);
  p.vx += ix;
  p.vz += iz;
  p.vy = Math.max(p.vy, 0) + (iy || 0);
  p.grounded = false;
  p.coyoteT = 0;
  p.kbT = Math.max(p.kbT, PHYSICS.knockControlLock + Math.min(0.3, mag * 0.012));
  p.knockScale = Math.min(PHYSICS.knockScaleMax, p.knockScale + PHYSICS.knockGrowth);
  p.hitsTaken++;
  if (fromId) {
    p.lastHitBy = fromId;
    p.lastHitT = state.time;
  }
  return mag;
}
