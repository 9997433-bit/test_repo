// 渲染插值。sim 走 60Hz，屏幕可能是 144Hz 也可能是 48Hz，
// 所以渲染前把上一帧与当前帧的快照按 alpha 混一下再交给 renderer.sync。

const ANGLE_KEYS = new Set(["yaw", "pitch", "roll", "aimYaw", "cameraYaw"]);
const LERP_KEYS = ["x", "y", "z", "vx", "vy", "vz", "meter", "awakenedT", "hp", "scale"];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function toPlayerArray(view) {
  if (!view) return [];
  const p = view.players;
  if (Array.isArray(p)) return p;
  if (p && typeof p === "object") return Object.values(p);
  return [];
}

function lerpEntity(prev, cur, t) {
  if (!prev) return cur;
  const out = { ...cur };
  for (const key of LERP_KEYS) {
    if (typeof prev[key] === "number" && typeof cur[key] === "number") {
      out[key] = lerp(prev[key], cur[key], t);
    }
  }
  for (const key of ANGLE_KEYS) {
    if (typeof prev[key] === "number" && typeof cur[key] === "number") {
      out[key] = lerpAngle(prev[key], cur[key], t);
    }
  }
  return out;
}

/**
 * 混合两个 view 快照。任一为空就直接返回另一个；
 * 只插值位置类字段，状态/计数一律取当前帧，避免出现 3.5 个击杀这种鬼数字。
 */
export function lerpView(prev, cur, t) {
  if (!cur) return prev || null;
  if (!prev || t <= 0) return cur;
  if (t >= 1) return cur;

  const prevById = new Map();
  for (const p of toPlayerArray(prev)) prevById.set(p.id, p);

  const players = toPlayerArray(cur).map((p) => {
    const before = prevById.get(p.id);
    // 重生瞬移不插值，否则会看到人从坠落点飞回台上。
    if (before && before.respawnT > 0 && !(p.respawnT > 0)) return p;
    return lerpEntity(before, p, t);
  });

  const out = { ...cur, players, alpha: t };
  if (typeof prev.t === "number" && typeof cur.t === "number") out.t = lerp(prev.t, cur.t, t);
  return out;
}
