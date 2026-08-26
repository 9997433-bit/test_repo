/**
 * 战场物理模拟：480×800 逻辑世界、圆形蛋 vs（墙 / 钉 / 砖 / 敌人 / 斜面 / 风扇 / 冰面）。
 *
 * 与 `src/physics/**` 契约保持一致（createWorld / stepWorld / predictTrajectory），
 * 上游积分器就绪后可由 `adapters.js` 切换过去；预测与实跑共用同一套 step，
 * 保证虚线弹道和真实弹道一致。
 */
import { FIXED_DT, GRAVITY, WORLD_W, WORLD_H } from "./adapters.js";

export { FIXED_DT, GRAVITY, WORLD_W, WORLD_H };

export const LAUNCH_X = WORLD_W / 2;
export const LAUNCH_Y = 92;
export const NEST_Y = 648;
export const MAX_AIM_DEG = 70;
export const MIN_SPEED = 220;
export const MAX_SPEED = 720;
export const MAX_EGG_SPEED = 1900;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

let uid = 1;
export const nextId = () => uid++;

export function createWorld(opts = {}) {
  return {
    w: WORLD_W,
    h: WORLD_H,
    gravity: opts.gravity ?? GRAVITY,
    time: 0,
    eggs: [],
    pegs: [],
    bricks: [],
    enemies: [],
    slopes: [],
    fans: [],
    ice: [],
    portals: [],
    nestY: opts.nestY ?? NEST_Y,
  };
}

export function makeEgg(opts = {}) {
  return {
    id: nextId(),
    x: opts.x ?? LAUNCH_X,
    y: opts.y ?? LAUNCH_Y,
    vx: opts.vx ?? 0,
    vy: opts.vy ?? 400,
    r: opts.r ?? 12,
    restitution: opts.restitution ?? 0.85,
    power: opts.power ?? 10,
    element: opts.element ?? "none",
    owner: opts.owner ?? null,
    ownerName: opts.ownerName ?? "",
    palette: opts.palette ?? ["#ffd447", "#ff8a3d", "#2a2144"],
    bounces: 0,
    wallBounces: 0,
    collisions: 0,
    pierce: opts.pierce ?? 0,
    damageMul: opts.damageMul ?? 1,
    growth: opts.growth ?? 0,
    homing: opts.homing ?? 0,
    splitBudget: opts.splitBudget ?? 0,
    splitOnHit: opts.splitOnHit ?? 0,
    crit: opts.crit ?? false,
    firstHitCrit: opts.firstHitCrit ?? false,
    bounceScaling: opts.bounceScaling ?? 0,
    isMain: opts.isMain ?? false,
    alive: true,
    age: 0,
    slowTime: 0,
    hitCount: 0,
    lastHit: new Map(),
    trail: [],
  };
}

export function aimVector(angleDeg, speed) {
  const a = clamp(angleDeg, -MAX_AIM_DEG, MAX_AIM_DEG);
  const rad = (a * Math.PI) / 180;
  return { vx: Math.sin(rad) * speed, vy: Math.cos(rad) * speed };
}

/** 由拖拽位移换算瞄准角与速度（向下拖 = 向下发射）。 */
export function aimFromDrag(dx, dy) {
  const len = Math.hypot(dx, dy);
  const angle = len < 1 ? 0 : (Math.atan2(dx, Math.max(dy, 1e-3)) * 180) / Math.PI;
  const power = clamp(len / 220, 0, 1);
  return {
    angle: clamp(angle, -MAX_AIM_DEG, MAX_AIM_DEG),
    power,
    speed: MIN_SPEED + (MAX_SPEED - MIN_SPEED) * power,
  };
}

function pointInBox(px, py, b) {
  return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
}

function circleBox(egg, b) {
  const cx = clamp(egg.x, b.x, b.x + b.w);
  const cy = clamp(egg.y, b.y, b.y + b.h);
  let dx = egg.x - cx;
  let dy = egg.y - cy;
  let d2 = dx * dx + dy * dy;
  if (d2 > egg.r * egg.r) return null;
  let d = Math.sqrt(d2);
  let nx;
  let ny;
  if (d > 1e-6) {
    nx = dx / d;
    ny = dy / d;
  } else {
    const left = egg.x - b.x;
    const right = b.x + b.w - egg.x;
    const top = egg.y - b.y;
    const bottom = b.y + b.h - egg.y;
    const m = Math.min(left, right, top, bottom);
    if (m === left) { nx = -1; ny = 0; }
    else if (m === right) { nx = 1; ny = 0; }
    else if (m === top) { nx = 0; ny = -1; }
    else { nx = 0; ny = 1; }
    d = 0;
  }
  return { nx, ny, depth: egg.r - d + 0.01 };
}

function circleCircle(egg, c) {
  const dx = egg.x - c.x;
  const dy = egg.y - c.y;
  const rr = egg.r + c.r;
  const d2 = dx * dx + dy * dy;
  if (d2 > rr * rr) return null;
  const d = Math.sqrt(d2) || 1e-6;
  return { nx: dx / d, ny: dy / d, depth: rr - d + 0.01 };
}

function circleSegment(egg, s) {
  const ex = s.x2 - s.x1;
  const ey = s.y2 - s.y1;
  const len2 = ex * ex + ey * ey || 1e-6;
  let t = ((egg.x - s.x1) * ex + (egg.y - s.y1) * ey) / len2;
  t = clamp(t, 0, 1);
  const px = s.x1 + ex * t;
  const py = s.y1 + ey * t;
  const dx = egg.x - px;
  const dy = egg.y - py;
  const d2 = dx * dx + dy * dy;
  const rad = egg.r + (s.thickness ?? 4) / 2;
  if (d2 > rad * rad) return null;
  const d = Math.sqrt(d2) || 1e-6;
  return { nx: dx / d, ny: dy / d, depth: rad - d + 0.01 };
}

function reflect(egg, hit, restitution, friction = 0.02) {
  egg.x += hit.nx * hit.depth;
  egg.y += hit.ny * hit.depth;
  const vn = egg.vx * hit.nx + egg.vy * hit.ny;
  if (vn >= 0) return 0;
  const e = restitution ?? egg.restitution;
  egg.vx -= (1 + e) * vn * hit.nx;
  egg.vy -= (1 + e) * vn * hit.ny;
  // 切向轻微摩擦，避免贴面无限打滑
  const tx = -hit.ny;
  const ty = hit.nx;
  const vt = egg.vx * tx + egg.vy * ty;
  egg.vx -= vt * friction * tx;
  egg.vy -= vt * friction * ty;
  return Math.abs(vn);
}

function onIce(world, egg) {
  for (const p of world.ice) if (pointInBox(egg.x, egg.y + egg.r, p)) return true;
  return false;
}

function steerHoming(egg, world, dt) {
  if (!egg.homing) return;
  let best = null;
  let bestD = Infinity;
  for (const en of world.enemies) {
    if (!en.alive) continue;
    const d = Math.hypot(en.x + en.w / 2 - egg.x, en.y + en.h / 2 - egg.y);
    if (d < bestD && d < 260) { bestD = d; best = en; }
  }
  if (!best) return;
  const tx = best.x + best.w / 2 - egg.x;
  const ty = best.y + best.h / 2 - egg.y;
  const len = Math.hypot(tx, ty) || 1;
  const strength = egg.homing * 620 * dt;
  egg.vx += (tx / len) * strength;
  egg.vy += (ty / len) * strength;
}

const NOOP_HOOKS = {};

/**
 * 推进一个固定步。ghost=true 时不触发任何伤害/破坏回调（用于弹道预测）。
 * @returns {number} 本步发生的碰撞次数
 */
export function stepEgg(egg, world, dt, hooks = NOOP_HOOKS, ghost = false) {
  if (!egg.alive) return 0;
  egg.age += dt;

  egg.vy += world.gravity * dt;
  for (const f of world.fans) {
    if (pointInBox(egg.x, egg.y, f)) {
      egg.vx += (f.ax ?? 0) * dt;
      egg.vy += (f.ay ?? 0) * dt;
    }
  }
  steerHoming(egg, world, dt);

  const dragPerSec = onIce(world, egg) ? 0.02 : 0.06;
  const drag = Math.max(0, 1 - dragPerSec * dt);
  egg.vx *= drag;
  egg.vy *= drag;

  const sp = Math.hypot(egg.vx, egg.vy);
  if (sp > MAX_EGG_SPEED) {
    egg.vx = (egg.vx / sp) * MAX_EGG_SPEED;
    egg.vy = (egg.vy / sp) * MAX_EGG_SPEED;
  }

  egg.x += egg.vx * dt;
  egg.y += egg.vy * dt;

  let collisions = 0;

  if (egg.x - egg.r < 0) {
    const hit = { nx: 1, ny: 0, depth: egg.r - egg.x };
    if (reflect(egg, hit, egg.restitution) > 20) {
      collisions++;
      egg.wallBounces++;
      if (!ghost) hooks.onWall?.(egg, "left");
    }
  } else if (egg.x + egg.r > world.w) {
    const hit = { nx: -1, ny: 0, depth: egg.x + egg.r - world.w };
    if (reflect(egg, hit, egg.restitution) > 20) {
      collisions++;
      egg.wallBounces++;
      if (!ghost) hooks.onWall?.(egg, "right");
    }
  }
  if (egg.y - egg.r < 0) {
    const hit = { nx: 0, ny: 1, depth: egg.r - egg.y };
    if (reflect(egg, hit, egg.restitution) > 20) {
      collisions++;
      egg.wallBounces++;
      if (!ghost) hooks.onWall?.(egg, "top");
    }
  }

  for (const s of world.slopes) {
    const hit = circleSegment(egg, s);
    if (!hit) continue;
    if (reflect(egg, hit, s.restitution ?? egg.restitution) > 20) {
      collisions++;
      egg.wallBounces++;
      if (!ghost) hooks.onSlope?.(egg, s);
    }
  }

  for (const p of world.pegs) {
    if (!p.alive) continue;
    const hit = circleCircle(egg, p);
    if (!hit) continue;
    const strength = reflect(egg, hit, p.restitution ?? 0.92, 0.01);
    if (strength > 15) {
      collisions++;
      if (!ghost) hooks.onPeg?.(egg, p);
    }
  }

  for (const b of world.bricks) {
    if (!b.alive) continue;
    const hit = circleBox(egg, b);
    if (!hit) continue;
    const pierced = !ghost && egg.pierce > 0 && b.kind !== "steel";
    if (!pierced) {
      const strength = reflect(egg, hit, b.kind === "ice" ? 0.96 : egg.restitution);
      if (strength > 15) collisions++;
    } else {
      collisions++;
    }
    if (!ghost) hooks.onBrick?.(egg, b, hit);
  }

  for (const en of world.enemies) {
    if (!en.alive) continue;
    const hit = circleBox(egg, en);
    if (!hit) continue;
    const key = en.id;
    const last = egg.lastHit.get(key) ?? -1;
    const fresh = egg.age - last > 0.08;
    const pierced = !ghost && egg.pierce > 0;
    if (!pierced) {
      const strength = reflect(egg, hit, en.restitution ?? 0.72);
      if (strength > 15) collisions++;
    } else {
      collisions++;
    }
    if (!ghost && fresh) {
      egg.lastHit.set(key, egg.age);
      hooks.onEnemy?.(egg, en, hit);
    }
  }

  for (const portal of world.portals) {
    if (!portal.alive) continue;
    if (Math.hypot(egg.x - portal.x, egg.y - portal.y) < portal.r + egg.r * 0.4) {
      egg.x = portal.tx;
      egg.y = portal.ty;
      if (!ghost) hooks.onPortal?.(egg, portal);
    }
  }

  if (collisions > 0) {
    egg.bounces += collisions;
    egg.collisions += collisions;
    if (egg.growth) {
      egg.r = Math.min(34, egg.r + egg.growth);
      egg.damageMul += 0.06 * egg.growth;
    }
  }

  const speed = Math.hypot(egg.vx, egg.vy);
  egg.slowTime = speed < 45 ? egg.slowTime + dt : 0;

  return collisions;
}

/** 一帧内推进整个世界（含子步细分，避免穿模）。 */
export function stepWorld(world, dt, hooks = NOOP_HOOKS) {
  const steps = Math.max(1, Math.min(8, Math.ceil(dt / FIXED_DT)));
  const sub = dt / steps;
  for (let i = 0; i < steps; i++) {
    world.time += sub;
    for (const egg of world.eggs) {
      if (!egg.alive) continue;
      const speed = Math.hypot(egg.vx, egg.vy);
      const micro = Math.max(1, Math.min(6, Math.ceil((speed * sub) / (egg.r * 0.6))));
      for (let m = 0; m < micro; m++) stepEgg(egg, world, sub / micro, hooks);
      if (egg.trail.length > 14) egg.trail.shift();
      egg.trail.push([egg.x, egg.y]);
      if (egg.y - egg.r > world.h + 30) {
        egg.alive = false;
        hooks.onRecycle?.(egg, "fell");
      } else if (egg.slowTime > 0.6) {
        egg.alive = false;
        hooks.onRecycle?.(egg, "stalled");
      } else if (egg.age > 14) {
        egg.alive = false;
        hooks.onRecycle?.(egg, "timeout");
      }
    }
  }
  if (world.eggs.some((e) => !e.alive)) {
    world.eggs = world.eggs.filter((e) => e.alive);
  }
  return world;
}

/**
 * 弹道预测：用同一套 step 跑影子蛋，最多 maxBounces 次反弹。
 * @returns {{points:number[][], bounces:number, hitsEnemy:boolean}}
 */
export function predictTrajectory(origin, velocity, world, opts = {}) {
  const maxBounces = opts.maxBounces ?? 3;
  const maxSteps = opts.maxSteps ?? 900;
  const dt = FIXED_DT;
  const ghost = makeEgg({
    x: origin.x,
    y: origin.y,
    vx: velocity.x ?? velocity.vx ?? 0,
    vy: velocity.y ?? velocity.vy ?? 0,
    r: opts.r ?? 12,
    restitution: opts.restitution ?? 0.85,
  });
  ghost.homing = 0;
  const points = [[ghost.x, ghost.y]];
  let bounces = 0;
  let hitsEnemy = false;
  for (let i = 0; i < maxSteps; i++) {
    const c = stepEgg(ghost, world, dt, NOOP_HOOKS, true);
    if (c > 0) {
      bounces += c;
      points.push([ghost.x, ghost.y]);
    } else if (i % 3 === 0) {
      points.push([ghost.x, ghost.y]);
    }
    if (!hitsEnemy) {
      for (const en of world.enemies) {
        if (en.alive && circleBox(ghost, en)) { hitsEnemy = true; break; }
      }
    }
    if (bounces >= maxBounces) break;
    if (ghost.y - ghost.r > world.h + 10) break;
    if (Math.hypot(ghost.vx, ghost.vy) < 40 && ghost.age > 0.4) break;
  }
  return { points, bounces, hitsEnemy };
}

export const geometry = { circleBox, circleCircle, circleSegment, pointInBox };
