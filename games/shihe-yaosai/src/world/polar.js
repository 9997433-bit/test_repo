// Opus-2 世界 · 极坐标换算。纯函数，不引用 Babylon。

import { TAU, SOCKET_COUNT, SOCKET_RADIUS, SOCKET_Y, LANE_Y } from "./constants.js";

function finite(value, fallback) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * 极坐标 -> 世界坐标。整局唯一的换算口径：x = cosθ·r，z = sinθ·r。
 * @param {number} radius 极径
 * @param {number} theta 极角（弧度）
 * @param {number} [y] 高度
 * @returns {{x:number,y:number,z:number}}
 */
export function polarToWorld(radius, theta, y = 0) {
  const r = finite(radius, 0);
  const t = finite(theta, 0);
  return { x: Math.cos(t) * r, y: finite(y, 0), z: Math.sin(t) * r };
}

/** 世界坐标 -> 极坐标，pickSocket 的反算与调试都用它。 */
export function worldToPolar(x, y, z) {
  const px = finite(x, 0);
  const pz = finite(z, 0);
  return {
    radius: Math.hypot(px, pz),
    theta: normalizeAngle(Math.atan2(pz, px)),
    y: finite(y, 0),
  };
}

/** 把任意弧度折算到 [0, 2π)。 */
export function normalizeAngle(theta) {
  const t = finite(theta, 0) % TAU;
  return t < 0 ? t + TAU : t;
}

/** 第 i 号插座的极角：θ = i / 24 · 2π。 */
export function socketTheta(i) {
  return (finite(i, 0) / SOCKET_COUNT) * TAU;
}

/**
 * 第 i 号插座的世界坐标。θ = i/24·2π，r = 40，y = 1。
 * @param {number} i
 * @returns {{x:number,y:number,z:number}}
 */
export function socketWorldPos(i) {
  return polarToWorld(SOCKET_RADIUS, socketTheta(i), SOCKET_Y);
}

/**
 * 插座朝向（绕 Y 的偏航角）。Babylon 的正前方是 +Z，
 * 让它对准背离星核的径向 (cosθ, 0, sinθ) 需要 yaw = π/2 − θ。
 */
export function socketYaw(i) {
  return Math.PI / 2 - socketTheta(i);
}

/** 由极角求出「面朝外」的偏航角，炮塔 aim 复用。 */
export function yawForTheta(theta) {
  return Math.PI / 2 - finite(theta, 0);
}

/** 把任意 lane 值折算成合法轨道下标。 */
export function laneIndex(lane) {
  const n = Math.round(finite(lane, 0));
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n >= LANE_Y.length) return LANE_Y.length - 1;
  return n;
}

/** 轨道高度。 */
export function laneHeight(lane) {
  return LANE_Y[laneIndex(lane)];
}

/** 最靠近给定极角的插座下标，输入层做吸附时可用。 */
export function nearestSocket(theta) {
  const t = normalizeAngle(theta);
  return Math.round((t / TAU) * SOCKET_COUNT) % SOCKET_COUNT;
}

/** 把 i 折算到 0..23。 */
export function wrapSocket(i) {
  const n = Math.round(finite(i, 0));
  return ((n % SOCKET_COUNT) + SOCKET_COUNT) % SOCKET_COUNT;
}
