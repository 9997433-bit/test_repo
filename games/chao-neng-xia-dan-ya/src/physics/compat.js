/**
 * `core/sim.js` 形态 → 物理世界的桥接与对拍工具。
 *
 * Round 1 留下两套积分器：战斗跑 `core/sim.js`，预测虚线也跑它，
 * 因此「同源」是靠两边都用同一个内置 step 换来的。Round 2 要切到本目录，
 * 切换期需要一层不改战斗数据结构就能跑起来的桥：
 *
 *   const bridge = createSimBridge(battle.world);   // 只读 sim 世界
 *   bridge.sync();                                  // 敌人漂移/下压后调用
 *   const pred = bridge.predict(origin, velocity);  // sim 形态的预测结果
 *
 * 桥持有函数，因此**不挂在 world 上**——`bridge.world` 仍是可
 * structuredClone 的纯数据。战斗层照旧改自己的 sim 对象（hp、alive、
 * 坐标），`sync()` 负责把这些变化搬进物理世界。
 *
 * 物理层在这里只做几何：伤害、破坏、连击仍归 combat/battle。
 */

import { createWorld, markStaticsDirty, addStatic, addField } from "./world.js";
import { predictTrajectoryDetailed } from "./trajectory.js";
import {
  computeAABB,
  makeBrick,
  makeEnemy,
  makeFan,
  makePeg,
  makePortalPair,
  makeSegment,
  moveBody,
} from "./shapes.js";

/** sim 的砖 kind → 物理材质与可破坏性 */
function brickKind(kind) {
  if (kind === "ice") return "ice";
  return "brick";
}

/**
 * 从 sim 形态的世界（`{ w, h, gravity, pegs, bricks, enemies, slopes, fans, portals }`）
 * 建一个物理世界，并返回带同步/预测能力的桥。
 *
 * @param {object} sim  core/sim.js 的 world（只读，不会被修改）
 * @param {object} [opts]
 * @param {boolean} [opts.portals] 是否映射传送门（默认 true，映射成双向门）
 * @returns {{
 *   world: object,
 *   sync: () => boolean,
 *   bodyFor: (simObj:object) => object|null,
 *   simFor: (body:object) => object|null,
 *   predict: (origin:object, velocity:object, opts?:object) => object,
 *   predictDetailed: (origin:object, velocity:object, opts?:object) => object,
 * }}
 */
export function createSimBridge(sim, opts = {}) {
  const world = createWorld({
    gravity: sim.gravity,
    bounds: { left: 0, top: 0, right: sim.w, bottom: sim.h },
    // sim 只挡左右墙与顶板，底部开放用于回收
    boundsMode: { left: "bounce", right: "bounce", top: "bounce", bottom: "open" },
  });

  const bodyBySim = new Map();
  const simByBody = new Map();
  const link = (simObj, body) => {
    body.data = simObj;
    bodyBySim.set(simObj, body);
    simByBody.set(body, simObj);
    return body;
  };

  for (const p of sim.pegs ?? []) {
    link(
      p,
      addStatic(
        world,
        makePeg(p.x, p.y, {
          r: p.r ?? 9,
          kind: p.type === "bumper" ? "bumper" : "peg",
          restitution: p.restitution,
        }),
      ),
    );
  }

  for (const b of sim.bricks ?? []) {
    link(
      b,
      addStatic(
        world,
        makeBrick({
          x: b.x,
          y: b.y,
          w: b.w ?? 40,
          h: b.h ?? 20,
          anchor: "topleft",
          kind: brickKind(b.kind),
          // hp / 破坏归战斗层，物理只按 `alive` 开关碰撞盒
          breakable: false,
          restitution: b.kind === "steel" ? 0.9 : undefined,
        }),
      ),
    );
  }

  for (const e of sim.enemies ?? []) {
    link(
      e,
      addStatic(
        world,
        makeEnemy({
          x: e.x,
          y: e.y,
          w: e.w,
          h: e.h,
          anchor: "topleft",
          breakable: false,
          restitution: e.restitution,
        }),
      ),
    );
  }

  for (const s of sim.slopes ?? []) {
    link(
      s,
      addStatic(
        world,
        makeSegment({
          x1: s.x1,
          y1: s.y1,
          x2: s.x2,
          y2: s.y2,
          thickness: s.thickness ?? 4,
          kind: "ramp",
          restitution: s.restitution,
        }),
      ),
    );
  }

  // 力场不参与 sync（sim 的风扇不会移动），不进 body 索引
  for (const f of sim.fans ?? []) {
    const w = f.w ?? 80;
    const h = f.h ?? 160;
    addField(world, makeFan({ x: f.x + w / 2, y: f.y + h / 2, w, h, ax: f.ax ?? 0, ay: f.ay ?? 0 }));
  }

  if (opts.portals !== false) {
    for (const p of sim.portals ?? []) {
      // sim 的传送门是单向的（x,y → tx,ty）；物理门成对存在，
      // 这里映射成双向，出口也能接蛋。行为差异在对拍报告里会显现。
      const pair = makePortalPair({ x: p.x, y: p.y, r: p.r ?? 18 }, { x: p.tx, y: p.ty, r: p.r ?? 18 });
      addStatic(world, pair);
      link(p, pair[0]);
    }
  }

  /**
   * 把 sim 侧的变化（生死、漂移、每回合下压）搬进物理世界。
   * @returns {boolean} 拓扑或几何是否发生过变化
   */
  function sync() {
    let dirty = false;
    for (const [simObj, body] of bodyBySim) {
      const alive = simObj.alive !== false;
      if (body.active !== alive) {
        body.active = alive;
        dirty = true;
      }
      if (!alive) continue;
      if (body.shape === "aabb") {
        if (moveBody(body, simObj.x, simObj.y, "topleft")) dirty = true;
      } else if (body.shape === "circle" && (body.x !== simObj.x || body.y !== simObj.y)) {
        body.x = simObj.x;
        body.y = simObj.y;
        computeAABB(body);
        dirty = true;
      }
    }
    if (dirty) markStaticsDirty(world);
    return dirty;
  }

  function predictDetailed(origin, velocity, options) {
    sync();
    return predictTrajectoryDetailed(origin, velocity, world, options);
  }

  return {
    world,
    sync,
    bodyFor: (simObj) => bodyBySim.get(simObj) ?? null,
    simFor: (body) => simByBody.get(body) ?? null,
    predictDetailed,
    predict: (origin, velocity, options) =>
      toSimPrediction(predictDetailed(origin, velocity, options)),
  };
}

/**
 * 物理预测结果 → `core/sim.js` 的返回形态，渲染层无需改动即可切换：
 * `{ points: [[x,y]], bounces, hitsEnemy, impact }`。
 */
export function toSimPrediction(detail) {
  return {
    points: detail.points.map((p) => [p.x, p.y]),
    bounces: detail.bounces,
    hitsEnemy: detail.hitsEnemy,
    impact: detail.impact,
    /** 额外信息，老渲染忽略即可 */
    firstHit: detail.firstHit,
    firstEnemyHit: detail.firstEnemyHit,
    contacts: detail.contacts,
    reason: detail.reason,
  };
}

/** `[{x,y}]` / `[[x,y]]` 两种点列统一成 `[{x,y}]` */
export function normalizePoints(points) {
  const out = [];
  if (!points) return out;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (Array.isArray(p)) out.push({ x: p[0], y: p[1] });
    else if (p) out.push({ x: p.x, y: p.y });
  }
  return out;
}

/**
 * 对拍两条弹道。按弧长重采样后比距离，避免两侧采样密度不同导致的假告警。
 *
 * @returns {{
 *   samples: number,
 *   maxDeviation: number,
 *   meanDeviation: number,
 *   endDeviation: number,
 *   lengthA: number,
 *   lengthB: number,
 * }}
 */
export function compareTrajectories(a, b, opts = {}) {
  const samples = Math.max(2, opts.samples ?? 32);
  const pa = normalizePoints(a?.points ?? a);
  const pb = normalizePoints(b?.points ?? b);
  const empty = {
    samples: 0,
    maxDeviation: Infinity,
    meanDeviation: Infinity,
    endDeviation: Infinity,
    lengthA: 0,
    lengthB: 0,
  };
  if (pa.length < 2 || pb.length < 2) return empty;

  const la = polylineLength(pa);
  const lb = polylineLength(pb);
  let max = 0;
  let sum = 0;
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const qa = pointAt(pa, la * t);
    const qb = pointAt(pb, lb * t);
    const d = Math.hypot(qa.x - qb.x, qa.y - qb.y);
    if (d > max) max = d;
    sum += d;
  }
  const ea = pa[pa.length - 1];
  const eb = pb[pb.length - 1];
  return {
    samples,
    maxDeviation: max,
    meanDeviation: sum / samples,
    endDeviation: Math.hypot(ea.x - eb.x, ea.y - eb.y),
    lengthA: la,
    lengthB: lb,
  };
}

function polylineLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len;
}

function pointAt(pts, distance) {
  if (distance <= 0) return pts[0];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (acc + seg >= distance) {
      const t = seg > 0 ? (distance - acc) / seg : 0;
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
      };
    }
    acc += seg;
  }
  return pts[pts.length - 1];
}
