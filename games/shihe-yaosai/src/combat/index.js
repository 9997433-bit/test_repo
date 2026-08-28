// Opus-3 战斗表现：弹道、光束、脉冲环、命中闪光。
//
// 冻结分工（Round 2）：**弹道只由 src/combat 画**。本模块自带全部网格与材质，
// 不 import src/world，也不依赖世界层是否画 shots；world 缺席时照样能出画面。
// 这里不做任何伤害或命中判定——那些全在 src/sim 里算完了。
//
// 只消费 view.shots / view.fields / view.time，全部字段缺失都要能活。
// 深路径引入，避免把整包 Babylon 拖进 bundle。
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { CreateLines } from "@babylonjs/core/Meshes/Builders/linesBuilder.js";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder.js";

// 契约 ShotKind：tracer 曳光 / beam 光束 / pellet 飞行粒 / arc 抛物弹 / pulse 扩张环。
// towerId 只用来上色，未知一律按 tracer 处理。
const SHOT_KINDS = new Set(["tracer", "beam", "pellet", "arc", "pulse"]);

const TRAIL_LEN = { tracer: 7, arc: 5, pellet: 2.4, pulse: 0, beam: 0 };
const HEAD_SIZE = { tracer: 0.55, arc: 1.1, pellet: 0.7, pulse: 0, beam: 0 };
const ARC_LIFT = 6; // arc 的抛物线视觉抬高

const KIND_COLOR = {
  rail: [0.55, 0.85, 1],
  prism: [1, 0.42, 0.86],
  scatter: [1, 0.78, 0.32],
  well: [0.62, 0.42, 1],
  star: [0.45, 1, 0.78],
  impact: [1, 0.92, 0.6],
};
// towerId 缺席时按 ShotKind 兜底配色，保证画面不会全白。
const KIND_BY_SHOT = { tracer: "rail", beam: "prism", pellet: "scatter", pulse: "well", arc: "star" };
const TOWER_TO_SHOT = { rail: "tracer", prism: "beam", scatter: "pellet", well: "pulse", star: "arc" };
const OVERCLOCK_COLOR = [1, 0.35, 0.22];
const IMPACT_SEC = 0.22;
const FIELD_SEGMENTS = 28;
const RING_SEGMENTS = 40;

const STATES = new WeakMap();

function color(tint) {
  const c = KIND_COLOR[tint] || KIND_COLOR.rail;
  return new Color3(c[0], c[1], c[2]);
}

function emissiveMat(scene, name, rgb, alpha) {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = new Color3(0, 0, 0);
  mat.specularColor = new Color3(0, 0, 0);
  mat.emissiveColor = new Color3(rgb[0], rgb[1], rgb[2]);
  mat.disableLighting = true;
  mat.alpha = alpha === undefined ? 1 : alpha;
  if (alpha !== undefined && alpha < 1) mat.alphaMode = 1; // ALPHA_ADD
  mat.backFaceCulling = false;
  return mat;
}

function getState(scene) {
  let state = STATES.get(scene);
  if (state) return state;
  const root = new TransformNode("sh-combat", scene);
  state = {
    root,
    shots: new Map(),
    fields: new Map(),
    pulses: new Map(),
    impacts: [],
    impactPool: [],
    mats: {},
    lastTime: null,
  };
  for (const key of Object.keys(KIND_COLOR)) {
    state.mats[key] = emissiveMat(scene, `sh-shot-${key}`, KIND_COLOR[key]);
  }
  state.mats.overclock = emissiveMat(scene, "sh-shot-overclock", OVERCLOCK_COLOR);
  STATES.set(scene, state);
  return state;
}

function v3(p) {
  return new Vector3(p ? num(p.x) : 0, p ? num(p.y) : 0, p ? num(p.z) : 0);
}

function num(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function lerp(a, b, t) {
  return new Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
}

/** view.shots 的形状容错：优先 points 折线，退回 from/to，再退回单点。 */
function shotPoints(shot) {
  if (Array.isArray(shot.points) && shot.points.length >= 2) return shot.points;
  if (shot.from && shot.to) return [shot.from, shot.to];
  if (shot.from) return [shot.from, shot.from];
  return null;
}

function shotKind(shot) {
  if (typeof shot.kind === "string" && SHOT_KINDS.has(shot.kind)) return shot.kind;
  // 有些上游把 towerId 直接塞进 kind，按塔别翻译一次。
  const byTower = TOWER_TO_SHOT[shot.kind] || TOWER_TO_SHOT[shot.towerId];
  return byTower || "tracer";
}

function shotTint(shot, kind) {
  if (typeof shot.towerId === "string" && KIND_COLOR[shot.towerId]) return shot.towerId;
  return KIND_BY_SHOT[kind] || "rail";
}

/** 折线按 t 取点：t∈[0,1] 沿整条路径（棱镜折光是 3 点 2 段）。 */
function pathPoint(points, t) {
  if (points.length < 2) return v3(points[0]);
  const lens = [];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const d = Vector3.Distance(v3(points[i - 1]), v3(points[i]));
    lens.push(d);
    total += d;
  }
  if (total <= 1e-6) return v3(points[0]);
  let target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < lens.length; i += 1) {
    if (target <= lens[i] || i === lens.length - 1) {
      const local = lens[i] > 1e-6 ? target / lens[i] : 1;
      return lerp(v3(points[i]), v3(points[i + 1]), Math.min(1, local));
    }
    target -= lens[i];
  }
  return v3(points[points.length - 1]);
}

/** 沿路径回退一段距离，得到曳光尾巴的起点。 */
function trailStart(points, t, length) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Vector3.Distance(v3(points[i - 1]), v3(points[i]));
  }
  if (total <= 1e-6) return v3(points[0]);
  const back = Math.max(0, Math.min(1, t) * total - length);
  return pathPoint(points, back / total);
}

function ensureShot(state, scene, shot, kind, tint, pts) {
  let entry = state.shots.get(shot.id);
  if (entry) return entry;
  const line = CreateLines(
    `sh-shot-line-${shot.id}`,
    { points: [Vector3.Zero(), Vector3.Zero(), Vector3.Zero()], updatable: true },
    scene
  );
  line.parent = state.root;
  line.isPickable = false;
  line.color = color(tint);
  let head = null;
  if (HEAD_SIZE[kind] > 0) {
    head = CreateSphere(`sh-shot-head-${shot.id}`, { diameter: HEAD_SIZE[kind], segments: 6 }, scene);
    head.parent = state.root;
    head.isPickable = false;
    head.material = state.mats[shot.overclocked ? "overclock" : tint] || state.mats.rail;
  }
  entry = { line, head, kind, tint, lastPoint: pathPoint(pts, 1) };
  state.shots.set(shot.id, entry);
  return entry;
}

function updateShot(entry, shot, pts) {
  const t = Math.max(0, Math.min(1, num(shot.t)));
  const kind = entry.kind;
  const overclocked = !!shot.overclocked;
  const tint = overclocked
    ? new Color3(OVERCLOCK_COLOR[0], OVERCLOCK_COLOR[1], OVERCLOCK_COLOR[2])
    : color(entry.tint);

  let a;
  let b;
  let c;
  if (kind === "beam") {
    // 光束整条画出来；契约 §3.6 的折射段是独立一条 beam（relay = 折射塔插座号），画得暗一档
    a = v3(pts[0]);
    c = v3(pts[pts.length - 1]);
    b = pts.length >= 3 ? v3(pts[1]) : lerp(a, c, 0.5);
    // t 是呼吸相位，不是飞行进度
    const dim = shot.relay === null || shot.relay === undefined ? 1 : 0.7;
    entry.line.alpha = dim * (0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI)));
  } else {
    const head = pathPoint(pts, t);
    const tail = trailStart(pts, t, TRAIL_LEN[kind] || 3);
    a = tail;
    b = lerp(tail, head, 0.5);
    if (kind === "arc") b.y += ARC_LIFT * Math.sin(Math.PI * t);
    c = head;
    entry.line.alpha = 1;
  }
  CreateLines(entry.line.name, { points: [a, b, c], instance: entry.line });
  entry.line.color = tint;
  entry.lastPoint = c;
  if (entry.head) {
    entry.head.position.copyFrom(kind === "arc" ? b : c);
    const pulse = kind === "pellet" ? 1 + 0.15 * Math.sin(t * 12) : 1;
    entry.head.scaling.setAll((overclocked ? 1.35 : 1) * pulse);
    entry.head.isVisible = true;
  }
}

function disposeShot(entry) {
  if (entry.line) entry.line.dispose();
  if (entry.head) entry.head.dispose();
}

function ringPoints(segments) {
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    points.push(new Vector3(Math.cos(a), 0, Math.sin(a)));
  }
  return points;
}

/** kind==='pulse'：原地扩张环，半径 = shot.radius × t。 */
function ensurePulse(state, scene, shot, tint) {
  let entry = state.pulses.get(shot.id);
  if (entry) return entry;
  const ring = CreateLines(`sh-pulse-${shot.id}`, { points: ringPoints(RING_SEGMENTS), updatable: false }, scene);
  ring.parent = state.root;
  ring.isPickable = false;
  ring.color = color(tint);
  entry = { ring };
  state.pulses.set(shot.id, entry);
  return entry;
}

function updatePulse(entry, shot, pts) {
  const t = Math.max(0, Math.min(1, num(shot.t)));
  const origin = pts[0];
  const radius = num(shot.radius) > 0 ? num(shot.radius) : 8;
  entry.ring.position.set(num(origin.x), num(origin.y), num(origin.z));
  entry.ring.scaling.setAll(Math.max(0.01, radius * t));
  entry.ring.alpha = Math.max(0, 1 - t);
}

function spawnImpact(state, scene, position) {
  let mesh = state.impactPool.pop();
  if (!mesh) {
    mesh = CreateSphere("sh-impact", { diameter: 1, segments: 6 }, scene);
    mesh.parent = state.root;
    mesh.isPickable = false;
    mesh.material = state.mats.impact;
  }
  mesh.isVisible = true;
  mesh.position.copyFrom(position);
  mesh.scaling.setAll(0.4);
  state.impacts.push({ mesh, life: IMPACT_SEC });
}

function updateImpacts(state, dt) {
  for (let i = state.impacts.length - 1; i >= 0; i -= 1) {
    const fx = state.impacts[i];
    fx.life -= dt;
    if (fx.life <= 0) {
      fx.mesh.isVisible = false;
      state.impactPool.push(fx.mesh);
      state.impacts.splice(i, 1);
      continue;
    }
    const k = 1 - fx.life / IMPACT_SEC;
    fx.mesh.scaling.setAll(0.4 + k * 3.2);
  }
}

/** view.fields：坠井光环的常驻边界环。 */
function ensureField(state, scene, field) {
  let entry = state.fields.get(field.id);
  if (entry) return entry;
  const ring = CreateLines(`sh-field-${field.id}`, { points: ringPoints(FIELD_SEGMENTS), updatable: false }, scene);
  ring.parent = state.root;
  ring.isPickable = false;
  ring.color = color("well");
  entry = { ring };
  state.fields.set(field.id, entry);
  return entry;
}

function updateField(entry, field) {
  const t = Math.max(0, Math.min(1, num(field.t)));
  const radius = num(field.radius);
  const breathe = 0.94 + 0.06 * Math.sin(t * Math.PI * 2);
  entry.ring.position.set(num(field.x), num(field.y), num(field.z));
  entry.ring.scaling.setAll(Math.max(0.01, radius * breathe));
  entry.ring.alpha = field.active === false ? 0.12 : 0.35 + 0.25 * Math.abs(Math.sin(t * Math.PI));
}

/**
 * 每帧调用：syncCombat(scene, view)
 * 只读 view.shots / view.fields / view.time，做增量创建与回收。
 * @returns {{shots:number, pulses:number, fields:number, impacts:number}|null}
 */
export function syncCombat(scene, view) {
  if (!scene || !view) return null;
  const state = getState(scene);
  const shots = Array.isArray(view.shots) ? view.shots : [];
  const fields = Array.isArray(view.fields) ? view.fields : [];

  let dt = 1 / 60;
  if (typeof view.time === "number" && Number.isFinite(view.time)) {
    if (state.lastTime !== null) dt = Math.max(0, Math.min(0.25, view.time - state.lastTime));
    state.lastTime = view.time;
  } else if (scene.getEngine) {
    dt = Math.min(0.25, (scene.getEngine().getDeltaTime() || 16) / 1000);
  }

  const liveShots = new Set();
  const livePulses = new Set();
  for (const shot of shots) {
    if (!shot || shot.id === undefined || shot.id === null) continue;
    const pts = shotPoints(shot);
    if (!pts) continue;
    const kind = shotKind(shot);
    const tint = shotTint(shot, kind);
    if (kind === "pulse") {
      livePulses.add(shot.id);
      updatePulse(ensurePulse(state, scene, shot, tint), shot, pts);
      continue;
    }
    liveShots.add(shot.id);
    updateShot(ensureShot(state, scene, shot, kind, tint, pts), shot, pts);
  }

  for (const [id, entry] of state.shots) {
    if (liveShots.has(id)) continue;
    // 弹丸消失 = 命中/终点，补一发闪光（纯表现，不参与结算）
    if (entry.kind !== "beam") spawnImpact(state, scene, entry.lastPoint);
    disposeShot(entry);
    state.shots.delete(id);
  }
  for (const [id, entry] of state.pulses) {
    if (livePulses.has(id)) continue;
    entry.ring.dispose();
    state.pulses.delete(id);
  }

  const liveFields = new Set();
  for (const field of fields) {
    if (!field || field.id === undefined || field.id === null) continue;
    liveFields.add(field.id);
    updateField(ensureField(state, scene, field), field);
  }
  for (const [id, entry] of state.fields) {
    if (liveFields.has(id)) continue;
    entry.ring.dispose();
    state.fields.delete(id);
  }

  updateImpacts(state, dt);

  return {
    shots: state.shots.size,
    pulses: state.pulses.size,
    fields: state.fields.size,
    impacts: state.impacts.length,
  };
}

/** 场景切换/热重载时清干净。 */
export function disposeCombat(scene) {
  const state = STATES.get(scene);
  if (!state) return;
  for (const entry of state.shots.values()) disposeShot(entry);
  for (const entry of state.pulses.values()) entry.ring.dispose();
  for (const entry of state.fields.values()) entry.ring.dispose();
  for (const fx of state.impacts) fx.mesh.dispose();
  for (const mesh of state.impactPool) mesh.dispose();
  for (const key of Object.keys(state.mats)) state.mats[key].dispose();
  state.root.dispose();
  STATES.delete(scene);
}

export const COMBAT_COLORS = KIND_COLOR;
export const COMBAT_SHOT_KINDS = [...SHOT_KINDS];
