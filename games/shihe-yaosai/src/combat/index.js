// Opus-3 战斗表现：只消费 view.shots / view.fields，把它画成曳光、光束、力场。
// 这里不做任何伤害或命中判定——那些全在 src/sim 里算完了。
// 深路径引入，避免把整包 Babylon 拖进 bundle。
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { CreateLines } from "@babylonjs/core/Meshes/Builders/linesBuilder.js";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder.js";

const TRAIL_LEN = { rail: 7, star: 5, scatter: 2.4, well: 3, prism: 0 };
const HEAD_SIZE = { rail: 0.55, star: 1.1, scatter: 0.7, well: 1.4, prism: 0 };
const KIND_COLOR = {
  rail: [0.55, 0.85, 1],
  prism: [1, 0.42, 0.86],
  scatter: [1, 0.78, 0.32],
  well: [0.62, 0.42, 1],
  star: [0.45, 1, 0.78],
  impact: [1, 0.92, 0.6],
};
const OVERCLOCK_COLOR = [1, 0.35, 0.22];
const IMPACT_SEC = 0.22;
const FIELD_SEGMENTS = 28;

const STATES = new WeakMap();

function color(kind) {
  const c = KIND_COLOR[kind] || KIND_COLOR.rail;
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
    impacts: [],
    impactPool: [],
    mats: {},
    lastTime: null,
  };
  for (const kind of Object.keys(KIND_COLOR)) {
    state.mats[kind] = emissiveMat(scene, `sh-shot-${kind}`, KIND_COLOR[kind]);
  }
  state.mats.overclock = emissiveMat(scene, "sh-shot-overclock", OVERCLOCK_COLOR);
  STATES.set(scene, state);
  return state;
}

function v3(p) {
  return new Vector3(p ? p.x : 0, p ? p.y : 0, p ? p.z : 0);
}

function lerp(a, b, t) {
  return new Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
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
  const lens = [];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Vector3.Distance(v3(points[i - 1]), v3(points[i]));
    lens.push(total);
  }
  if (total <= 1e-6) return v3(points[0]);
  const back = Math.max(0, Math.min(1, t) * total - length);
  return pathPoint(points, back / total);
}

function ensureShot(state, scene, shot) {
  let entry = state.shots.get(shot.id);
  if (entry) return entry;
  const kind = KIND_COLOR[shot.kind] ? shot.kind : "rail";
  const line = CreateLines(
    `sh-shot-line-${shot.id}`,
    { points: [Vector3.Zero(), Vector3.Zero(), Vector3.Zero()], updatable: true },
    scene
  );
  line.parent = state.root;
  line.isPickable = false;
  line.color = color(kind);
  let head = null;
  if (HEAD_SIZE[kind] > 0) {
    head = CreateSphere(`sh-shot-head-${shot.id}`, { diameter: HEAD_SIZE[kind], segments: 6 }, scene);
    head.parent = state.root;
    head.isPickable = false;
    head.material = state.mats[shot.overclocked ? "overclock" : kind];
  }
  entry = { line, head, kind, lastPoint: v3(shot.to) };
  state.shots.set(shot.id, entry);
  return entry;
}

function updateShot(entry, shot) {
  const pts = shot.points && shot.points.length >= 2 ? shot.points : [shot.from, shot.to];
  const t = typeof shot.t === "number" ? shot.t : 1;
  const kind = entry.kind;
  const overclocked = !!shot.overclocked;
  const tint = overclocked ? new Color3(OVERCLOCK_COLOR[0], OVERCLOCK_COLOR[1], OVERCLOCK_COLOR[2]) : color(kind);

  let a;
  let b;
  let c;
  if (kind === "prism") {
    // 光束整条画出来，折光时中点就是中继棱镜
    a = v3(pts[0]);
    c = v3(pts[pts.length - 1]);
    b = pts.length >= 3 ? v3(pts[1]) : lerp(a, c, 0.5);
    entry.line.alpha = 0.35 + 0.65 * (1 - t);
  } else {
    const head = pathPoint(pts, t);
    const tail = trailStart(pts, t, TRAIL_LEN[kind] || 3);
    a = tail;
    b = lerp(tail, head, 0.5);
    c = head;
    entry.line.alpha = 1;
  }
  CreateLines(entry.line.name, { points: [a, b, c], instance: entry.line });
  entry.line.color = tint;
  entry.lastPoint = c;
  if (entry.head) {
    entry.head.position.copyFrom(c);
    const pulse = kind === "well" ? 1 + 0.25 * Math.sin(t * 12) : 1;
    entry.head.scaling.setAll((overclocked ? 1.35 : 1) * pulse);
    entry.head.isVisible = true;
  }
}

function disposeShot(entry) {
  if (entry.line) entry.line.dispose();
  if (entry.head) entry.head.dispose();
}

function spawnImpact(state, scene, position, kind) {
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
  state.impacts.push({ mesh, life: IMPACT_SEC, kind });
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

function ensureField(state, scene, field) {
  let entry = state.fields.get(field.id);
  if (entry) return entry;
  const points = [];
  for (let i = 0; i <= FIELD_SEGMENTS; i += 1) {
    const a = (i / FIELD_SEGMENTS) * Math.PI * 2;
    points.push(new Vector3(Math.cos(a), 0, Math.sin(a)));
  }
  const ring = CreateLines(`sh-field-${field.id}`, { points, updatable: false }, scene);
  ring.parent = state.root;
  ring.isPickable = false;
  ring.color = color("well");
  entry = { ring };
  state.fields.set(field.id, entry);
  return entry;
}

function updateField(entry, field) {
  const t = typeof field.t === "number" ? field.t : 0;
  entry.ring.position.set(field.x, field.y, field.z);
  entry.ring.scaling.setAll(field.radius * (0.55 + 0.45 * t));
  entry.ring.alpha = Math.max(0, 1 - t);
}

/**
 * 每帧调用：syncCombat(scene, view)
 * 只读 view.shots / view.fields / view.time，做增量创建与回收。
 */
export function syncCombat(scene, view) {
  if (!scene || !view) return null;
  const state = getState(scene);
  const shots = Array.isArray(view.shots) ? view.shots : [];
  const fields = Array.isArray(view.fields) ? view.fields : [];

  let dt = 1 / 60;
  if (typeof view.time === "number") {
    if (state.lastTime !== null) dt = Math.max(0, Math.min(0.25, view.time - state.lastTime));
    state.lastTime = view.time;
  } else if (scene.getEngine) {
    dt = Math.min(0.25, (scene.getEngine().getDeltaTime() || 16) / 1000);
  }

  const liveShots = new Set();
  for (const shot of shots) {
    if (!shot || shot.id === undefined) continue;
    liveShots.add(shot.id);
    updateShot(ensureShot(state, scene, shot), shot);
  }
  for (const [id, entry] of state.shots) {
    if (liveShots.has(id)) continue;
    // 弹丸消失 = 命中/终点，补一发闪光（纯表现，不参与结算）
    if (entry.kind !== "prism") spawnImpact(state, scene, entry.lastPoint, entry.kind);
    disposeShot(entry);
    state.shots.delete(id);
  }

  const liveFields = new Set();
  for (const field of fields) {
    if (!field || field.id === undefined) continue;
    liveFields.add(field.id);
    updateField(ensureField(state, scene, field), field);
  }
  for (const [id, entry] of state.fields) {
    if (liveFields.has(id)) continue;
    entry.ring.dispose();
    state.fields.delete(id);
  }

  updateImpacts(state, dt);

  return { shots: state.shots.size, fields: state.fields.size, impacts: state.impacts.length };
}

/** 场景切换/热重载时清干净。 */
export function disposeCombat(scene) {
  const state = STATES.get(scene);
  if (!state) return;
  for (const entry of state.shots.values()) disposeShot(entry);
  for (const entry of state.fields.values()) entry.ring.dispose();
  for (const fx of state.impacts) fx.mesh.dispose();
  for (const mesh of state.impactPool) mesh.dispose();
  for (const key of Object.keys(state.mats)) state.mats[key].dispose();
  state.root.dispose();
  STATES.delete(scene);
}

export const COMBAT_COLORS = KIND_COLOR;
