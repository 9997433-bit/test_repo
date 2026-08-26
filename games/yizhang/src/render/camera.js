// 第三人称跟随相机。
//
// 三条纪律：
//  1. 有阻尼 —— 位置与视点都是弹簧跟随，快速移动时先滞后再追上（手册 §11.5）
//  2. 有呼吸 —— 即使静止也有极轻微的漂移，避免「引擎默认机位」的死板
//  3. 震动按质量给 —— 轻掌几乎不震，重击才震；移动端整体乘 0.45，避免小屏晕眩

import { PerspectiveCamera, Vector3 } from 'three';

const BASE_FOV = 54;

function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export function createCamera({ aspect = 16 / 9, mobile = false } = {}) {
  const camera = new PerspectiveCamera(BASE_FOV, aspect, 0.35, 1600);
  camera.position.set(0, 6, 14);

  const state = {
    pos: new Vector3(0, 6, 14),
    look: new Vector3(0, 1.4, 0),
    yaw: 0,
    pitch: 0.22,
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
     */
    update(dt, focus, yaw, vel, opts = {}) {
      const airborne = Math.max(0, focus.y);
      state.yaw = damp(state.yaw, yaw, 7.5, dt);
      const pitch = state.pitch + (opts.pitchBias ?? 0);

      // 速度越快镜头拉远一点点，给出「被甩开」的感觉
      const speed = vel ? Math.hypot(vel.x, vel.z) : 0;
      const wantDist = 7.1 + Math.min(1.6, speed * 0.11) + airborne * 0.12;
      state.dist = damp(state.dist, wantDist, 3.2, dt);

      const sy = Math.sin(state.yaw);
      const cy = Math.cos(state.yaw);
      const height = 2.5 + Math.sin(pitch) * state.dist * 0.9;

      desired.set(
        focus.x - sy * state.dist,
        focus.y + height,
        focus.z - cy * state.dist
      );
      // 别钻进云海，也别贴着台面刮
      if (desired.y < focus.y + 1.2) desired.y = focus.y + 1.2;
      if (desired.y < 1.4) desired.y = 1.4;

      // 位置比视点跟得慢一点，转身时画面才有重量
      state.pos.x = damp(state.pos.x, desired.x, 6.2, dt);
      state.pos.y = damp(state.pos.y, desired.y, 5.0, dt);
      state.pos.z = damp(state.pos.z, desired.z, 6.2, dt);

      // 视点前引：朝移动方向偏一点，构图不会永远把角色钉在正中
      if (vel) {
        state.lead.x = damp(state.lead.x, vel.x * 0.16, 4, dt);
        state.lead.z = damp(state.lead.z, vel.z * 0.16, 4, dt);
      }
      lookTarget.set(
        focus.x + state.lead.x + sy * 1.1,
        focus.y + 1.45,
        focus.z + state.lead.z + cy * 1.1
      );
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
