// 固定人物视角 / 机位吸附 / yaw 空间的判决性单测。
//
// 三条要证的事（GOAL：yizhang-look）：
//   a) setLook 吃的是 **simYaw**。水平角离开输入层前就已经换算成 sim 空间，
//      所以真货 payload 的 `yaw` 与 `simYaw` 是同一个数（core/look.js）；
//      两个字段真不一样时（老壳 / 手搓 payload）以 simYaw 为准。相机方位角
//      原样当 sim yaw 用会把机位拧到角色脸前 —— 这里连「拧反了长什么样」一起
//      断言，免得下次有人把相机系角重新喂回 lookYaw。
//   b) 过门（hub z ≈ -120 ↔ arena 原点）机位是**吸附**过去的，不是弹簧飞越 120m。
//   c) lookMode === 'locked' 时镜头在角色**背后**，不是正脸。
//
// WebGL 上下文在 node 里起不来，所以渲染器只装配镜头这条链路（与 combat-vfx.test.js
// 同一手法）：cameraRig 是真的，setLook / _followYaw / _followCamera 是真的。

import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { BASE_PITCH, createCamera, shortestAngle } from './camera.js';
import { YizhangRenderer } from './renderer.js';
import { forwardFromYaw } from './view.js';
// 壳层每帧喂进来的就是这份 payload（core/look.js）。用真货喂，才算证明了整条链路。
import { lookPayload } from '../core/look.js';
// 相机方位角 → sim 角的唯一换算处：反证里要自己造一个「没换算过」的角。
import { cameraYawToSimYaw } from '../core/view.js';

const HUB_Z = -120;

/** 机位相对角色前向的投影：< 0 = 在背后，> 0 = 在脸前。 */
function behindness(camPos, focus, simYaw) {
  const f = forwardFromYaw(simYaw);
  return (camPos.x - focus.x) * f.x + (camPos.z - focus.z) * f.z;
}

/** 只装配镜头链路的渲染器。 */
function rigged({ lookMode = 'locked', lookYaw = null } = {}) {
  const r = Object.create(YizhangRenderer.prototype);
  r.cameraRig = createCamera({});
  r.lookPitch = null;
  r.lookYaw = lookYaw;
  r.lookMode = lookMode;
  r._vel = new Vector3();
  r._snapPending = true;
  r._following = false;
  r._prevFocusX = 0;
  r._prevFocusZ = 0;
  r._lastPhase = null;
  return r;
}

/** 跑若干帧跟随，返回最后一帧的机位。 */
function follow(r, focus, local, frames = 180) {
  for (let i = 0; i < frames; i++) r._followCamera(1 / 60, focus, r._followYaw(local));
  return r.cameraRig.camera.position;
}

describe('setLook 的 yaw 空间', () => {
  it('真货 payload：两个字段都是 sim 空间的同一个数，收进来的就是它', () => {
    const r = rigged();
    const payload = lookPayload({ yaw: 0.8, pitch: 0.3 });

    // 契约：水平角离开输入层前必须已经是 sim 空间，相机系角不出输入层
    expect(payload.yaw).toBe(payload.simYaw);
    expect(payload.simYaw).toBeCloseTo(cameraYawToSimYaw(0.8), 12);

    const out = r.setLook(payload);
    expect(out.yaw).toBeCloseTo(payload.simYaw, 12);
    expect(r.lookYaw).toBeCloseTo(payload.simYaw, 12);
    // getLook 报的是「实际在用的 sim yaw」，两个口同值
    expect(r.getLook().simYaw).toBeCloseTo(payload.simYaw, 12);
    expect(r.getLook().yaw).toBeCloseTo(payload.simYaw, 12);
  });

  it('simYaw 优先：两个字段真不一样时，yaw 不许顶替 simYaw', () => {
    const r = rigged();
    // 手搓一份「yaw 还是相机方位角」的 payload（老壳 / 第三方调用者）
    const cameraYaw = 0.8;
    const simYaw = cameraYawToSimYaw(cameraYaw);
    // 前提：两个字段真的不是一个数，否则这条测试什么都没测
    expect(Math.abs(shortestAngle(cameraYaw, simYaw))).toBeGreaterThan(0.5);

    const out = r.setLook({ yaw: cameraYaw, pitch: 0.3, simYaw });
    expect(out.yaw).toBeCloseTo(simYaw, 12);
    expect(r.lookYaw).toBeCloseTo(simYaw, 12);
    expect(r.getLook().yaw).toBeCloseTo(simYaw, 12);
  });

  it('只有 yaw（老壳）时按 sim 空间收；显式 null 交还给角色朝向', () => {
    const r = rigged();
    expect(r.setLook({ yaw: 1.2 }).yaw).toBeCloseTo(1.2, 12);
    expect(r.setLook({ pitch: 0.1 }).yaw).toBeCloseTo(1.2, 12); // 只给 pitch 不动 yaw
    expect(r.setLook({ yaw: null }).yaw).toBeNull();
    // simYaw 显式 null 同样是「不喂朝向」，别掉回同一 payload 的相机系 yaw
    r.setLook({ yaw: 1.2 });
    expect(r.setLook({ yaw: 0.8, simYaw: null }).yaw).toBeNull();
  });

  it('lookMode 跟着 payload 一起收，认不出来的值不改现状', () => {
    const r = rigged();
    expect(r.setLook({ pitch: 0.2, lookMode: 'free' }).lookMode).toBe('free');
    expect(r.lookMode).toBe('free');
    expect(r.setLook({ lookMode: 'LOCKED' }).lookMode).toBe('locked');
    expect(r.setLook({ lookMode: 'wat' }).lookMode).toBe('locked');
    expect(r.setLookMode('free')).toBe('free');
    expect(r.setLookMode(null)).toBe('free'); // 没说就不改
  });
});

describe('lookMode', () => {
  const SIM_YAW = 0.9;
  const focus = new Vector3(3, 0, -4);
  const local = { yaw: SIM_YAW };

  it('locked：镜头钉在角色背后，喂进来的朝向拧不动它', () => {
    const r = rigged({ lookMode: 'locked' });
    // 壳层照样每帧喂整份 payload（自由视角切回来时不必改喂法）
    r.setLook(lookPayload({ yaw: 0.15, pitch: BASE_PITCH }));
    const pos = follow(r, focus, local);

    expect(behindness(pos, focus, SIM_YAW)).toBeLessThan(-3);
    expect(r._followYaw(local)).toBeCloseTo(SIM_YAW, 12);
  });

  it('相机系 yaw 当 sim yaw 用就会绕到脸前 —— 这正是要修的那个 bug', () => {
    // 反证：绕过输入层，把一个**没换算过**的相机方位角直接塞进 setLook 的 sim 口
    // （只给 yaw、不给 simYaw，正是老壳那条路）。取 θ = π/4：此时相机系角与它
    // 对应的 sim 角正好差 π，机位整个翻到正脸。
    const cameraYaw = Math.PI / 4;
    const simYaw = cameraYawToSimYaw(cameraYaw);
    const wrong = rigged({ lookMode: 'free' });
    const right = rigged({ lookMode: 'free' });
    wrong.setLook({ yaw: cameraYaw });
    right.setLook({ simYaw });

    const wrongPos = follow(wrong, focus, local);
    const rightPos = follow(right, focus, local);
    // 相机系角对应的「身后」正好落在这套 sim 朝向的前半平面上
    expect(behindness(wrongPos, focus, simYaw)).toBeGreaterThan(3);
    expect(behindness(rightPos, focus, simYaw)).toBeLessThan(-3);
  });

  it('free：用喂进来的 sim yaw；没喂就跟角色朝向（未接线时的老路仍然对）', () => {
    const r = rigged({ lookMode: 'free' });
    expect(r._followYaw(local)).toBeCloseTo(SIM_YAW, 12); // 没喂
    // 整份 payload 带着 lookMode，自由视角这帧得是 free，否则喂进去的朝向不算数
    const payload = lookPayload({ yaw: 0.15, pitch: 0, lookMode: 'free' });
    r.setLook(payload);
    expect(r.lookMode).toBe('free');
    expect(r._followYaw(local)).toBeCloseTo(payload.simYaw, 12);

    const pos = follow(r, focus, local);
    expect(behindness(pos, focus, r.lookYaw)).toBeLessThan(-3);
  });

  it('payload 里的 lookMode 说了算：缺省 locked 会把 free 掰回固定人物视角', () => {
    const r = rigged({ lookMode: 'free' });
    // 输入层没报模式时 lookPayload 收成 locked，渲染器就该跟着回 locked，
    // 此时喂进来的朝向让位给角色自己的 yaw（镜头钉背后）
    r.setLook(lookPayload({ yaw: 0.15, pitch: 0 }));
    expect(r.lookMode).toBe('locked');
    expect(r._followYaw(local)).toBeCloseTo(SIM_YAW, 12);
  });

  it('缺省 locked，且「没喂朝向」时仍然跟角色自己的 yaw', () => {
    // 构造函数要 WebGL，在 node 里起不来；rigged() 复刻的就是它写进实例的默认值
    const r = rigged();
    expect(r.lookMode).toBe('locked');
    expect(r.getLook().lookMode).toBe('locked');
    expect(r.lookYaw).toBeNull();
    expect(r._followYaw(local)).toBeCloseTo(SIM_YAW, 12);
    // 连角色都没有（第一帧 / 名单还没对上）也不能算出 NaN
    expect(r._followYaw(null)).toBe(0);
  });
});

describe('机位吸附（snap）', () => {
  it('snap 直接把镜头架到目标身后，不是 120m 外', () => {
    const rig = createCamera({});
    const focus = new Vector3(0, 0, HUB_Z);

    // 弹簧跟随：一帧之后镜头还在原点附近，离目标 120m
    const spring = createCamera({});
    spring.update(1 / 60, focus, 0, new Vector3());
    expect(spring.camera.position.distanceTo(focus)).toBeGreaterThan(100);

    rig.snap(focus, 0);
    const d = rig.camera.position.distanceTo(focus);
    expect(d).toBeLessThan(12);
    expect(d).toBeGreaterThan(3); // 不是贴脸
    expect(behindness(rig.camera.position, focus, 0)).toBeLessThan(-3);
    // 上一处的震动不跟着人过门
    rig.impulse(1.2, 5);
    rig.snap(focus, 0);
    expect(rig.state.shake).toBe(0);
    expect(rig.state.fovKick).toBe(0);
  });

  it('过门：焦点从安全区整跳到裂岛，机位当帧吸附而不是飞越', () => {
    const r = rigged();
    const local = { yaw: 0 };
    const hub = new Vector3(0, 0, HUB_Z);
    follow(r, hub, local, 120);
    expect(r.cameraRig.camera.position.distanceTo(hub)).toBeLessThan(12);

    const arena = new Vector3(0, 0, 0);
    r._followCamera(1 / 60, arena, r._followYaw(local));
    const d = r.cameraRig.camera.position.distanceTo(arena);
    expect(d).toBeLessThan(12);
    expect(behindness(r.cameraRig.camera.position, arena, 0)).toBeLessThan(-3);
  });

  it('正常走位不会被当成传送（弹簧还在，机位不许每帧硬吸）', () => {
    const r = rigged();
    const local = { yaw: 0 };
    const at = new Vector3(0, 0, 0);
    follow(r, at, local, 120);
    const before = r.cameraRig.state.pos.clone();
    // 一帧走 0.25m（冲刺量级）
    at.z -= 0.25;
    r._followCamera(1 / 60, at, r._followYaw(local));
    expect(r.cameraRig.state.pos.distanceTo(before)).toBeLessThan(0.25);
  });

  it('snapCamera / resetFollow / 换跟随目标都会重新架机位', () => {
    const r = rigged();
    const local = { yaw: 0 };
    const at = new Vector3(0, 0, 0);
    follow(r, at, local, 60);
    expect(r._snapPending).toBe(false);

    expect(r.snapCamera()).toBe(true);
    expect(r._snapPending).toBe(true);
    r._followCamera(1 / 60, at, 0);
    expect(r._snapPending).toBe(false);

    r.resetFollow();
    expect(r._snapPending).toBe(true);
    r._followCamera(1 / 60, at, 0);

    // 换人 / 从观战切回来
    r.forcedLocalId = 'p0';
    r.setLocalId('b1');
    expect(r._snapPending).toBe(true);
    r._followCamera(1 / 60, at, 0);
    r.spectator = true;
    r.setSpectator(false);
    expect(r._snapPending).toBe(true);
  });
});

describe('镜头 yaw 走最短弧', () => {
  it('跨过 ±π 时是转几度，不是兜一整圈', () => {
    const rig = createCamera({});
    const focus = new Vector3(0, 0, 0);
    rig.snap(focus, Math.PI - 0.05);
    const target = -Math.PI + 0.05;
    rig.update(1 / 60, focus, target, new Vector3());
    // 一帧就应该朝 π 的另一侧挪，而不是往 0 的方向倒车
    expect(Math.abs(shortestAngle(rig.state.yaw, target))).toBeLessThan(0.1);
    for (let i = 0; i < 120; i++) rig.update(1 / 60, focus, target, new Vector3());
    expect(Math.abs(shortestAngle(rig.state.yaw, target))).toBeLessThan(1e-3);
  });

  it('shortestAngle 收在 (-π, π]', () => {
    expect(shortestAngle(0, Math.PI * 2)).toBeCloseTo(0, 12);
    expect(shortestAngle(3.1, -3.1)).toBeCloseTo(2 * Math.PI - 6.2, 12);
    expect(shortestAngle(-3.1, 3.1)).toBeCloseTo(-(2 * Math.PI - 6.2), 12);
  });
});
