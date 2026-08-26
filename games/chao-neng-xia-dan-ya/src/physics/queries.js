/**
 * 空间查询、爆炸结算与分裂。
 *
 * 物理层只负责「谁在范围内、被推向哪、静态体是否碎」，
 * 具体伤害数值由 `src/combat` 依据返回的 falloff 自行计算。
 */

import { SPLIT_SPEED_SCALE, SPLIT_SPREAD } from "./constants.js";
import { clamp, closestPointOnSegment, vec } from "./math.js";
import {
  damageStatic,
  drainBlasts,
  emit,
  nextRandom,
  normalizeEgg,
  recycleEgg,
  spawnEgg,
  syncStatics,
} from "./world.js";

const scratch = vec();

/** 查询前保证鸭子类型的蛋/静态体已补齐字段 */
function syncForQuery(world) {
  syncStatics(world);
  const eggs = world.eggs;
  for (let i = 0; i < eggs.length; i++) {
    if (!Number.isFinite(eggs[i].invMass)) normalizeEgg(eggs[i]);
  }
}

/** 点到静态体表面的距离（内部为 0） */
export function distanceToBody(body, x, y) {
  if (body.shape === "circle") {
    return Math.max(0, Math.hypot(x - body.x, y - body.y) - body.r);
  }
  if (body.shape === "aabb") {
    const dx = Math.max(Math.abs(x - body.x) - body.hw, 0);
    const dy = Math.max(Math.abs(y - body.y) - body.hh, 0);
    return Math.hypot(dx, dy);
  }
  const p = closestPointOnSegment(x, y, body.x1, body.y1, body.x2, body.y2, scratch);
  return Math.max(0, Math.hypot(x - p.x, y - p.y) - body.halfThickness);
}

/** 静态体中心（线段取中点） */
export function bodyCenter(body, out = vec()) {
  if (body.shape === "segment") {
    out.x = (body.x1 + body.x2) / 2;
    out.y = (body.y1 + body.y2) / 2;
  } else {
    out.x = body.x;
    out.y = body.y;
  }
  return out;
}

function falloffOf(distance, radius, mode) {
  if (radius <= 0) return 0;
  const t = clamp(1 - distance / radius, 0, 1);
  if (mode === "none") return 1;
  if (mode === "smooth") return t * t * (3 - 2 * t);
  if (mode === "sqrt") return Math.sqrt(t);
  return t;
}

/**
 * 圆形范围查询（爆炸、磁铁、光环共用）。
 * @returns {{ eggs: Array, statics: Array }} 元素形如 `{ egg|body, distance, falloff, nx, ny }`
 */
export function queryCircle(world, x, y, radius, opts = {}) {
  syncForQuery(world);
  const includeEggs = opts.eggs !== false;
  const includeStatics = opts.statics !== false;
  const mode = opts.falloff ?? "linear";
  const eggs = [];
  const statics = [];

  if (includeEggs) {
    for (let i = 0; i < world.eggs.length; i++) {
      const egg = world.eggs[i];
      if (!egg.alive) continue;
      if (opts.exclude === egg) continue;
      if (opts.team && egg.team !== opts.team) continue;
      const dx = egg.x - x;
      const dy = egg.y - y;
      const d = Math.max(0, Math.hypot(dx, dy) - egg.r);
      if (d > radius) continue;
      const len = Math.hypot(dx, dy) || 1;
      eggs.push({
        egg,
        distance: d,
        falloff: falloffOf(d, radius, mode),
        nx: dx / len,
        ny: dy / len,
      });
    }
  }

  if (includeStatics) {
    for (let i = 0; i < world.statics.length; i++) {
      const body = world.statics[i];
      if (body.active === false) continue;
      if (opts.solidOnly && body.sensor) continue;
      const d = distanceToBody(body, x, y);
      if (d > radius) continue;
      const c = bodyCenter(body, scratch);
      const dx = c.x - x;
      const dy = c.y - y;
      const len = Math.hypot(dx, dy) || 1;
      statics.push({
        body,
        distance: d,
        falloff: falloffOf(d, radius, mode),
        nx: dx / len,
        ny: dy / len,
      });
    }
  }

  eggs.sort((a, b) => a.distance - b.distance);
  statics.sort((a, b) => a.distance - b.distance);
  return { eggs, statics };
}

/** 矩形范围查询 */
export function queryAABB(world, minX, minY, maxX, maxY, opts = {}) {
  syncForQuery(world);
  const eggs = [];
  const statics = [];
  if (opts.eggs !== false) {
    for (let i = 0; i < world.eggs.length; i++) {
      const egg = world.eggs[i];
      if (!egg.alive) continue;
      if (
        egg.x + egg.r < minX ||
        egg.x - egg.r > maxX ||
        egg.y + egg.r < minY ||
        egg.y - egg.r > maxY
      ) {
        continue;
      }
      eggs.push(egg);
    }
  }
  if (opts.statics !== false) {
    for (let i = 0; i < world.statics.length; i++) {
      const body = world.statics[i];
      if (body.active === false) continue;
      const box = body.aabb;
      if (box.maxX < minX || box.minX > maxX || box.maxY < minY || box.minY > maxY) continue;
      statics.push(body);
    }
  }
  return { eggs, statics };
}

/** 距离某点最近的活跃蛋 */
export function nearestEgg(world, x, y, maxDistance = Infinity, filter = null) {
  let best = null;
  let bestD = maxDistance;
  for (let i = 0; i < world.eggs.length; i++) {
    const egg = world.eggs[i];
    if (!egg.alive) continue;
    if (filter && !filter(egg)) continue;
    const d = Math.hypot(egg.x - x, egg.y - y);
    if (d < bestD) {
      bestD = d;
      best = egg;
    }
  }
  return best ? { egg: best, distance: bestD } : null;
}

/**
 * 爆炸结算：范围查询 + 冲量 + 可选静态体伤害。
 * 炸弹砖连锁不会在此递归，破碎产生的新爆炸会进入 `world.pendingBlasts`，
 * 由 `resolveBlasts` 统一展开（避免深递归与重复结算）。
 *
 * @returns {{ x, y, radius, eggs, statics, destroyed }}
 */
export function explode(world, opts = {}) {
  const x = opts.x ?? 0;
  const y = opts.y ?? 0;
  const radius = opts.radius ?? 90;
  const power = opts.power ?? 520;
  const damage = opts.damage ?? 0;
  const mode = opts.falloff ?? "linear";

  const found = queryCircle(world, x, y, radius, {
    falloff: mode,
    exclude: opts.exclude,
    solidOnly: true,
  });

  if (opts.impulse !== false && power !== 0) {
    for (let i = 0; i < found.eggs.length; i++) {
      const hit = found.eggs[i];
      const k = power * hit.falloff * (hit.egg.invMass || 0);
      hit.egg.vx += hit.nx * k;
      hit.egg.vy += hit.ny * k;
      hit.egg.restTimer = 0;
    }
  }

  const destroyed = [];
  if (damage > 0 && opts.damageStatics !== false) {
    for (let i = 0; i < found.statics.length; i++) {
      const hit = found.statics[i];
      if (!hit.body.breakable) continue;
      const res = damageStatic(world, hit.body, damage * hit.falloff, {
        source: opts.source ?? null,
        depth: opts.depth ?? 0,
      });
      if (res.destroyed) destroyed.push(hit.body);
    }
  }

  emit(world, {
    type: "explode",
    x,
    y,
    radius,
    power,
    source: opts.source ?? null,
    eggs: found.eggs.length,
    statics: found.statics.length,
    destroyed: destroyed.length,
  });

  return { x, y, radius, eggs: found.eggs, statics: found.statics, destroyed };
}

/**
 * 展开炸弹砖连锁。每步物理之后调用一次即可。
 * @param {number} [maxDepth] 连锁层数上限，防止环形炸弹阵列死循环
 */
export function resolveBlasts(world, opts = {}) {
  const maxDepth = opts.maxDepth ?? 4;
  const damage = opts.damage ?? 999;
  const results = [];
  let guard = 0;
  let queue = drainBlasts(world);
  while (queue.length > 0 && guard++ < 64) {
    for (let i = 0; i < queue.length; i++) {
      const blast = queue[i];
      if ((blast.depth ?? 0) > maxDepth) continue;
      results.push(
        explode(world, {
          x: blast.x,
          y: blast.y,
          radius: blast.radius,
          power: blast.power,
          damage,
          source: blast.source,
          depth: blast.depth ?? 0,
        }),
      );
    }
    queue = drainBlasts(world);
  }
  return results;
}

/**
 * 分裂：按 GDD 子蛋继承 0.7 速度，沿母蛋方向扇形展开。
 * @param {object} opts
 * @param {number} [opts.count]      子蛋数量，默认 2
 * @param {number} [opts.spread]     扇形总张角（弧度），默认 60°
 * @param {number} [opts.speedScale] 速度继承比例，默认 0.7
 * @param {number} [opts.radiusScale]半径比例，默认 0.8
 * @param {boolean}[opts.consume]    是否回收母蛋，默认 false
 * @returns {Array} 子蛋数组
 */
export function splitEgg(world, egg, opts = {}) {
  const count = Math.max(0, Math.floor(opts.count ?? 2));
  if (count === 0 || !egg) return [];
  normalizeEgg(egg);
  if (opts.requireCharge !== false && egg.splitsLeft <= 0 && opts.force !== true) return [];

  const spread = opts.spread ?? SPLIT_SPREAD;
  const speedScale = opts.speedScale ?? SPLIT_SPEED_SCALE;
  const radiusScale = opts.radiusScale ?? 0.8;
  const jitter = opts.jitter ?? 0;

  let speed = Math.hypot(egg.vx, egg.vy) * speedScale;
  if (speed < (opts.minSpeed ?? 120)) speed = opts.minSpeed ?? 120;
  const baseAngle =
    opts.angle ?? (egg.vx === 0 && egg.vy === 0 ? Math.PI / 2 : Math.atan2(egg.vy, egg.vx));

  const children = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    let a = baseAngle + (t - 0.5) * spread;
    if (jitter > 0) a += (nextRandom(world) - 0.5) * jitter;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const r = Math.max(3, egg.r * radiusScale);
    children.push(
      spawnEgg(world, {
        kind: opts.kind ?? egg.kind,
        x: egg.x + dx * (egg.r + 0.5),
        y: egg.y + dy * (egg.r + 0.5),
        vx: dx * speed,
        vy: dy * speed,
        r,
        restitution: egg.restitution,
        friction: egg.friction,
        drag: egg.drag,
        gravityScale: egg.gravityScale,
        power: egg.power * (opts.powerScale ?? 0.6),
        element: egg.element,
        team: egg.team,
        heroId: egg.heroId,
        splitsLeft: Math.max(0, egg.splitsLeft - 1),
        pierce: opts.inheritPierce === false ? 0 : egg.pierce,
        generation: egg.generation + 1,
        tags: egg.tags,
        lifetime: opts.lifetime ?? egg.lifetime,
      }),
    );
  }

  egg.splitsLeft = Math.max(0, egg.splitsLeft - 1);
  emit(world, { type: "split", egg, children, x: egg.x, y: egg.y });
  if (opts.consume) recycleEgg(world, egg, "split");
  return children;
}
