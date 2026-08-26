// 纯数学helper。禁止 three / DOM。

export const TAU = Math.PI * 2;

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function len2(x, z) {
  return Math.sqrt(x * x + z * z);
}

/** 归一化二维向量；零向量返回 {x:0,z:0,len:0} */
export function norm2(x, z) {
  const l = Math.sqrt(x * x + z * z);
  if (l < 1e-8) return { x: 0, z: 0, len: 0 };
  return { x: x / l, z: z / l, len: l };
}

/** 把角度收敛到 (-PI, PI] */
export function wrapAngle(a) {
  let r = a % TAU;
  if (r > Math.PI) r -= TAU;
  if (r <= -Math.PI) r += TAU;
  return r;
}

/**
 * 朝向冻结（Round 2）：yaw = 0 面向 -Z，yaw 增大绕 +Y 轴旋转。
 * 渲染端直接 `mesh.rotation.y = player.yaw`；输入端用 `yawFromDir`。
 * `src/combat` 内部以 +Z 为 yaw 0，两者相差 `FACE.combatOffset`，
 * 换算只在 `combat-bridge.js` 一处发生，其余代码一律按本文件的约定写。
 */
export const FACE = Object.freeze({
  convention: "yaw0:-Z",
  forwardX: 0,
  forwardZ: -1,
  rightX: 1,
  rightZ: 0,
  combatOffset: Math.PI,
});

export function forwardX(yaw) {
  return -Math.sin(yaw);
}

export function forwardZ(yaw) {
  return -Math.cos(yaw);
}

/** 前向的右手边：yaw=0 时指向 +X（见 FACE） */
export function rightX(yaw) {
  return Math.cos(yaw);
}

export function rightZ(yaw) {
  return -Math.sin(yaw);
}

/** 世界方向 -> yaw，`forwardX/forwardZ` 的逆 */
export function yawFromDir(x, z) {
  return Math.atan2(-x, -z);
}

/** 指数阻尼：与帧长无关的速度衰减 */
export function damp(v, rate, dt) {
  return v * Math.exp(-rate * dt);
}

/** 把 v 朝 target 推进最多 maxDelta */
export function approach(v, target, maxDelta) {
  const d = target - v;
  if (d > maxDelta) return v + maxDelta;
  if (d < -maxDelta) return v - maxDelta;
  return target;
}

export function round4(v) {
  return Math.round(v * 1e4) / 1e4;
}
