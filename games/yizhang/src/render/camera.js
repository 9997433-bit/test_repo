// 第三人称跟随相机。
//
// 三条纪律：
//  1. 有阻尼 —— 位置与视点都是弹簧跟随，快速移动时先滞后再追上（手册 §11.5）
//  2. 有呼吸 —— 即使静止也有极轻微的漂移，避免「引擎默认机位」的死板
//  3. 震动按质量给 —— 轻掌几乎不震，重击才震；移动端整体乘 0.45，避免小屏晕眩
//
// 例外只有一个：`snap()`。弹簧是给「角色在走」准备的，不是给「角色换了个岛」准备的
// —— 安全区在 z ≈ -120、裂岛在原点，过门后老老实实跟随的话镜头要飞越 120m，
// 那一秒画面里既没有角色也没有场景。过门 / 换跟随目标 / 开局第一帧一律 snap。

import { PerspectiveCamera, Vector3 } from 'three';

const BASE_FOV = 54;
const TAU = Math.PI * 2;

/** 静止跟随距离（update 里的 wantDist 基准，snap 直接用它架机位）。 */
const REST_DIST = 7.1;

/**
 * 静止机位的俯角（弧度）。
 *
 * 鼠标上下看走的是 `update(..., { pitchBias })`：壳层拿到的 `input.getLook().pitch`
 * 是**绝对**俯角（同一套约定：正 = 往下看、镜头抬高），减掉这个基准就是 bias。
 * 换算收在 YizhangRenderer.setLook 里，这里只负责把两者相加后夹住。
 */
export const BASE_PITCH = 0.22;

/** 与 src/input 的 PITCH_LIMIT（π/2.6）同量级：再多镜头就翻过头顶了。 */
export const PITCH_LIMIT = Math.PI / 2.6;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/** 角差收进 (-π, π]：yaw 绕过 ±π 时镜头走近路，不许兜一整圈。 */
export function shortestAngle(from, to) {
  let d = (to - from) % TAU;
  if (d > Math.PI) d -= TAU;
  else if (d < -Math.PI) d += TAU;
  return d;
}

function dampAngle(current, target, lambda, dt) {
  return current + shortestAngle(current, target) * (1 - Math.exp(-lambda * dt));
}

/**
 * 机位：yaw = 0 面向 -Z（与 sim 的 forwardX/forwardZ 一致），
 * 所以「身后」是 +(sin yaw, cos yaw)，镜头就架在那儿。
 */
function desiredPos(out, focus, sy, cy, dist, pitch) {
  out.set(focus.x + sy * dist, focus.y + 2.5 + Math.sin(pitch) * dist * 0.9, focus.z + cy * dist);
  // 别钻进云海，也别贴着台面刮
  if (out.y < focus.y + 1.2) out.y = focus.y + 1.2;
  if (out.y < 1.4) out.y = 1.4;
  return out;
}

/**
 * 视点落在角色正前方一米多的地方，构图上人物就不会永远钉在画面正中。
 * 抬头时视点跟着抬、低头时跟着压：镜头只是升降的话，画面里的地平线不会动。
 */
function desiredLook(out, focus, sy, cy, lead, pitch, basePitch) {
  out.set(
    focus.x + lead.x - sy * 1.1,
    focus.y + 1.45 - Math.sin(pitch - basePitch) * 2.4,
    focus.z + lead.z - cy * 1.1
  );
  return out;
}

export function createCamera({ aspect = 16 / 9, mobile = false } = {}) {
  const camera = new PerspectiveCamera(BASE_FOV, aspect, 0.35, 1600);
  camera.position.set(0, 6, 14);

  const state = {
    pos: new Vector3(0, 6, 14),
    look: new Vector3(0, 1.4, 0),
    yaw: 0,
    pitch: BASE_PITCH,
    /** 壳层喂进来的抬头量（阻尼后的值）。update 每帧写，外部只读。 */
    pitchBias: 0,
    /** 本帧真正用掉的俯角 = pitch + pitchBias，夹在 ±PITCH_LIMIT。 */
    pitchOut: BASE_PITCH,
    dist: 7.4,
    shake: 0,
    shakeFreq: 26,
    fovKick: 0,
    breathe: Math.random() * 100,
    mobile,
    shakeScale: mobile ? 0.45 : 1,
    lead: new Vector3(),
  };

  const desired = new Vector3();
  const lookTarget = new Vector3();
  const tmp = new Vector3();

  return {
    camera,
    state,

    setMobile(v) {
      state.mobile = !!v;
      state.shakeScale = v ? 0.45 : 1;
    },

    /** 冲击强度 0..1 以上。重击给 1.0，普通扇击 0.35 左右。 */
    impulse(strength = 0.5, fov = 0) {
      state.shake = Math.min(1.4, state.shake + strength * state.shakeScale);
      state.fovKick = Math.min(6.5, state.fovKick + (fov || strength * 2.4) * state.shakeScale);
    },

    resize(aspect) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    },

    /**
     * @param {Vector3} focus 玩家脚下位置
     * @param {number} yaw    玩家/输入朝向
     * @param {Vector3} vel   水平速度，用于视点前引
     * @param {{pitchBias?: number}} [opts] pitchBias：叠在 BASE_PITCH 上的抬头/低头量
     */
    update(dt, focus, yaw, vel, opts = {}) {
      const airborne = Math.max(0, focus.y);
      // 角度阻尼走最短弧：yaw 从 +3.1 跳到 -3.1 是转 6°，不是转 354°
      state.yaw = dampAngle(state.yaw, Number.isFinite(yaw) ? yaw : state.yaw, 7.5, dt);
      // 抬头/低头有阻尼：鼠标一格一格跳，镜头不能跟着一格一格跳
      const wantBias = Number.isFinite(opts.pitchBias) ? opts.pitchBias : 0;
      state.pitchBias = damp(state.pitchBias, wantBias, 14, dt);
      const pitch = clamp(state.pitch + state.pitchBias, -PITCH_LIMIT, PITCH_LIMIT);
      state.pitchOut = pitch;

      // 速度越快镜头拉远一点点，给出「被甩开」的感觉
      const speed = vel ? Math.hypot(vel.x, vel.z) : 0;
      const wantDist = REST_DIST + Math.min(1.6, speed * 0.11) + airborne * 0.12;
      state.dist = damp(state.dist, wantDist, 3.2, dt);

      const sy = Math.sin(state.yaw);
      const cy = Math.cos(state.yaw);
      desiredPos(desired, focus, sy, cy, state.dist, pitch);

      // 位置比视点跟得慢一点，转身时画面才有重量
      state.pos.x = damp(state.pos.x, desired.x, 6.2, dt);
      state.pos.y = damp(state.pos.y, desired.y, 5.0, dt);
      state.pos.z = damp(state.pos.z, desired.z, 6.2, dt);

      // 视点前引：朝移动方向偏一点，构图不会永远把角色钉在正中
      if (vel) {
        state.lead.x = damp(state.lead.x, vel.x * 0.16, 4, dt);
        state.lead.z = damp(state.lead.z, vel.z * 0.16, 4, dt);
      }
      desiredLook(lookTarget, focus, sy, cy, state.lead, pitch, state.pitch);
      state.look.x = damp(state.look.x, lookTarget.x, 9, dt);
      state.look.y = damp(state.look.y, lookTarget.y, 7, dt);
      state.look.z = damp(state.look.z, lookTarget.z, 9, dt);

      // 手持呼吸：低频、极小，静止时也有
      state.breathe += dt;
      const bx = Math.sin(state.breathe * 0.53) * 0.035 + Math.sin(state.breathe * 1.31) * 0.012;
      const by = Math.cos(state.breathe * 0.41) * 0.028 + Math.sin(state.breathe * 1.07) * 0.01;

      // 震动：高频抖 + 快速衰减，长焦端更明显
      let sx = 0;
      let syo = 0;
      let sz = 0;
      if (state.shake > 0.0005) {
        const t = state.breathe * state.shakeFreq;
        const decay = state.shake * state.shake;
        sx = (Math.sin(t * 1.7) + Math.sin(t * 3.1) * 0.5) * decay * 0.34;
        syo = (Math.cos(t * 2.3) + Math.sin(t * 4.7) * 0.4) * decay * 0.26;
        sz = Math.sin(t * 2.9) * decay * 0.18;
        state.shake = Math.max(0, state.shake - dt * 3.6);
      }

      camera.position.set(
        state.pos.x + bx + sx,
        state.pos.y + by + syo,
        state.pos.z + sz
      );
      tmp.copy(state.look);
      tmp.x += sx * 0.3;
      tmp.y += syo * 0.3;
      camera.lookAt(tmp);
      // 震动带一点滚转，纯平移的抖动像 UI 特效而不是镜头
      camera.rotateZ(sx * 0.06);

      state.fovKick = Math.max(0, state.fovKick - dt * 14);
      const wantFov = BASE_FOV + state.fovKick + Math.min(4, speed * 0.22);
      if (Math.abs(camera.fov - wantFov) > 0.01) {
        camera.fov = damp(camera.fov, wantFov, 10, dt);
        camera.updateProjectionMatrix();
      }
    },

    /**
     * 瞬时把机位架到 focus 身后，并把本帧的弹簧状态一起归零。
     *
     * 用在「世界位置整个换了一处」的时刻：hub ↔ arena 过门、结算回程、换跟随目标、
     * 开局第一帧。不 snap 的话弹簧会老老实实地把镜头从上一处拖过来 —— 安全区与裂岛
     * 隔着 120m，那就是一秒钟的空镜飞越。
     *
     * @param {Vector3} focus 玩家脚下位置
     * @param {number} yaw    sim 空间的朝向（yaw = 0 面向 -Z）
     * @param {{pitchBias?: number, dist?: number}} [opts]
     * @returns {Vector3} 落位后的机位（= state.pos）
     */
    snap(focus, yaw, opts = {}) {
      state.yaw = Number.isFinite(yaw) ? Math.atan2(Math.sin(yaw), Math.cos(yaw)) : state.yaw;
      // 抬头量直接到位：过门那一帧不该再补一段「镜头慢慢抬起来」
      state.pitchBias = Number.isFinite(opts.pitchBias) ? opts.pitchBias : 0;
      const pitch = clamp(state.pitch + state.pitchBias, -PITCH_LIMIT, PITCH_LIMIT);
      state.pitchOut = pitch;
      state.dist = Number.isFinite(opts.dist) ? opts.dist : REST_DIST;
      state.lead.set(0, 0, 0);
      // 上一处的震动 / 变焦不跟着人过门
      state.shake = 0;
      state.fovKick = 0;

      const sy = Math.sin(state.yaw);
      const cy = Math.cos(state.yaw);
      state.pos.copy(desiredPos(desired, focus, sy, cy, state.dist, pitch));
      state.look.copy(desiredLook(lookTarget, focus, sy, cy, state.lead, pitch, state.pitch));

      camera.position.copy(state.pos);
      camera.lookAt(state.look);
      camera.rotation.z = 0;
      if (camera.fov !== BASE_FOV) {
        camera.fov = BASE_FOV;
        camera.updateProjectionMatrix();
      }
      return state.pos;
    },

    /**
     * 没有本地玩家时（主菜单 / 观战 / 结算）绕着裂岛慢慢推轨。
     * 机位压得比台面略低，让岛底的岩层与云海一起入画，浮空感来自这三层。
     */
    orbit(dt, time, radius = 30) {
      const a = time * 0.055;
      const y = 3.4 + Math.sin(time * 0.11) * 2.6;
      camera.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      // 视点略低于台面，构图上台面偏上、云海留白在下
      camera.lookAt(Math.sin(a * 1.7) * 2, -0.9, Math.cos(a * 1.7) * 2);
      state.pos.copy(camera.position);
      state.look.set(0, -0.9, 0);
      void dt;
    },
  };
}
