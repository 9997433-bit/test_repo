// 固定人物视角 / 机位吸附 / yaw 空间的判决性单测。
//
// 五条要证的事（GOAL：yizhang-look）：
//   a) setLook 吃的是 **simYaw**。水平角离开输入层前就已经换算成 sim 空间，
//      所以真货 payload 的 `yaw` 与 `simYaw` 是同一个数（core/look.js）；
//      两个字段真不一样时（老壳 / 手搓 payload）以 simYaw 为准。相机方位角
//      原样当 sim yaw 用会把机位拧到角色脸前 —— 这里连「拧反了长什么样」一起
//      断言，免得下次有人把相机系角重新喂回 lookYaw。
//   b) 过门（hub z ≈ -120 ↔ arena 原点）机位是**吸附**过去的，不是弹簧飞越 120m。
//   c) lookMode === 'locked' 时镜头在角色**背后**，不是正脸 —— 而且是**每一帧**都在，
//      快到 720°/s 的转身也不许把镜头甩到侧面（阻尼慢半拍是手感，绕到正脸是缺陷）。
//   d) lookMode === 'free' 时镜头跟视线、角色面朝走向，两个角互不牵制：同一个角色 yaw
//      下转镜头能把人转到侧面。free 与 locked 的差别必须在画面上看得见。
//   e) 切模式（V / setLookMode / payload 带 lookMode）**不吸附**：人还站在原地，
//      snap 只留给传送。
//
// WebGL 上下文在 node 里起不来，所以渲染器只装配镜头这条链路（与 combat-vfx.test.js
// 同一手法）：cameraRig 是真的，setLook / _followYaw / _followCamera 是真的。

import { describe, expect, it } from 'vitest';
import { Vector3 } from './gfx.js';
import {
  BASE_PITCH,
  LOCKED_YAW_SPAN,
  createCamera,
  holdBehind,
  lockedHoldSlack,
  shortestAngle,
} from './camera.js';
import { YizhangRenderer } from './renderer.js';
import { forwardFromYaw } from './view.js';
// 壳层每帧喂进来的就是这份 payload（core/look.js）。用真货喂，才算证明了整条链路。
import { lookPayload } from '../core/look.js';
// 相机方位角 ↔ sim 角的唯一换算处：反证里要自己造一个「没换算过」的角，
// 正向用例里要按 sim 空间的目标角倒推出该给输入层的相机方位角。
import { cameraYawToSimYaw, simYawToCameraYaw } from '../core/view.js';

const HUB_Z = -120;
const DT = 1 / 60;

/** 机位相对角色前向的投影：< 0 = 在背后，> 0 = 在脸前。 */
function behindness(camPos, focus, simYaw) {
  const f = forwardFromYaw(simYaw);
  return (camPos.x - focus.x) * f.x + (camPos.z - focus.z) * f.z;
}

/** 机位相对角色**侧向**的投影。侧面构图 = 这个数占住了水平距离的大头。 */
function sideness(camPos, focus, simYaw) {
  const f = forwardFromYaw(simYaw);
  return (camPos.x - focus.x) * f.z - (camPos.z - focus.z) * f.x;
}

/**
 * 画面里看见的是角色的哪一面：+1 = 正背影，0 = 正侧面，-1 = 正脸。
 * 取镜头真实的水平前向（`camera.lookAt` 之后的世界朝向）与角色前向的点积。
 */
function facingSeen(camera, simYaw) {
  const dir = new Vector3();
  camera.getWorldDirection(dir);
  const len = Math.hypot(dir.x, dir.z);
  const f = forwardFromYaw(simYaw);
  return (dir.x * f.x + dir.z * f.z) / (len || 1);
}

/** 只装配镜头链路的渲染器。 */
function rigged({ lookMode = 'locked' } = {}) {
  const r = Object.create(YizhangRenderer.prototype);
  r.cameraRig = createCamera({});
  r.lookPitch = null;
  // 朝向只能经 setLook 进来（构造函数的缺省也是 null），测试不许直塞 lookYaw
  r.lookYaw = null;
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
  for (let i = 0; i < frames; i++) r._followCamera(DT, focus, r._followYaw(local));
  return r.cameraRig.camera.position;
}

/**
 * 喂一帧真货 payload 并跟随一帧，顺带照抄壳层那条链上 sim 的承接规则：
 *
 *   locked —— `Input.yaw = cameraYawToSimYaw(θ)`，sim **直赋** `p.yaw`（ADR-38，1:1
 *             无平滑），所以转镜头角色当帧就一起转；
 *   free   —— 静止时 `Input.yaw = null`，sim 不改朝向，角色一步不转。
 *
 * 这样测的就不是「镜头绕着一个手搓的角转」，而是壳层真实的产出顺序。
 */
function feedFrame(r, focus, local, cameraYaw, mode) {
  const payload = lookPayload({ yaw: cameraYaw, pitch: 0, lookMode: mode });
  if (mode === 'locked') local.yaw = payload.simYaw;
  r.setLook(payload);
  r._followCamera(DT, focus, r._followYaw(local));
  return payload;
}

/**
 * 以恒定角速度转镜头，逐帧回收判据。
 * @param {{degPerSec: number, seconds?: number}} opts 角速度按 **sim 空间**算
 */
function turnView(r, focus, local, mode, { degPerSec, seconds = 1 }) {
  const frames = Math.round(seconds / DT);
  const step = ((degPerSec * Math.PI) / 180) * DT;
  const startSimYaw = r.lookYaw ?? local.yaw;
  const samples = [];
  for (let i = 1; i <= frames; i++) {
    const simYaw = startSimYaw + step * i;
    feedFrame(r, focus, local, simYawToCameraYaw(simYaw), mode);
    samples.push({
      simYaw,
      charYaw: local.yaw,
      lag: Math.abs(shortestAngle(local.yaw, r.cameraRig.state.yaw)),
      behind: behindness(r.cameraRig.state.pos, focus, local.yaw),
      behindShaken: behindness(r.cameraRig.camera.position, focus, local.yaw),
      seen: facingSeen(r.cameraRig.camera, local.yaw),
    });
  }
  return samples;
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

describe('同一角色 yaw，free 与 locked 的机位分野', () => {
  const CHAR_YAW = 0.9;
  const focus = new Vector3(3, 0, -4);

  /** 机位先在角色背后收敛，再开始转 —— 「从背后转到侧面」才是要测的那段。 */
  function settled(mode) {
    const r = rigged({ lookMode: mode });
    const local = { yaw: CHAR_YAW };
    feedFrame(r, focus, local, simYawToCameraYaw(CHAR_YAW), mode);
    follow(r, focus, local, 180);
    expect(behindness(r.cameraRig.camera.position, focus, local.yaw)).toBeLessThan(-3);
    expect(facingSeen(r.cameraRig.camera, local.yaw)).toBeGreaterThan(0.999);
    return { r, local };
  }

  it('free：角色一步没转，转镜头就能把人转到侧面', () => {
    const { r, local } = settled('free');
    const before = local.yaw;
    // 转四分之一圈：视线离开角色面向 90°，角色自己还站在原地（静止 ⇒ Input.yaw=null）
    turnView(r, focus, local, 'free', { degPerSec: 90, seconds: 1 });
    follow(r, focus, local, 60); // 让弹簧收敛到新视线上
    expect(local.yaw).toBe(before);

    const pos = r.cameraRig.camera.position;
    // 机位到了角色的侧向：正/背向投影几乎为零，侧向投影占住了整个水平距离
    expect(Math.abs(behindness(pos, focus, local.yaw))).toBeLessThan(0.6);
    expect(Math.abs(sideness(pos, focus, local.yaw))).toBeGreaterThan(6);
    // 画面里看到的是侧面：镜头前向与角色前向近乎垂直
    expect(Math.abs(facingSeen(r.cameraRig.camera, local.yaw))).toBeLessThan(0.1);
    // 视线本身仍是壳层喂的那个 sim 角，不是角色 yaw
    expect(Math.abs(shortestAngle(local.yaw, r.lookYaw))).toBeCloseTo(Math.PI / 2, 2);
    expect(r.getLook().lookMode).toBe('free');
  });

  it('free：继续转到半圈就露正脸 —— 自由视角不该被半平面夹住', () => {
    const { r, local } = settled('free');
    turnView(r, focus, local, 'free', { degPerSec: 180, seconds: 1 });
    follow(r, focus, local, 90);
    expect(behindness(r.cameraRig.camera.position, focus, local.yaw)).toBeGreaterThan(3);
    expect(facingSeen(r.cameraRig.camera, local.yaw)).toBeLessThan(-0.99);
  });

  it('locked：同样转法、同样的角色起始 yaw —— 角色跟着转，镜头一帧都没离开背后', () => {
    const { r, local } = settled('locked');
    const before = local.yaw;
    const samples = turnView(r, focus, local, 'locked', { degPerSec: 90, seconds: 1 });

    // 角色跟着视线转满四分之一圈（sim 直赋，1:1）
    expect(Math.abs(shortestAngle(before, local.yaw))).toBeCloseTo(Math.PI / 2, 2);
    for (const s of samples) {
      expect(s.lag).toBeLessThan(LOCKED_YAW_SPAN);
      expect(s.behindShaken).toBeLessThan(0);
      expect(s.seen).toBeGreaterThan(0.9);
    }
    // 收敛后仍是正背影，不是侧面
    follow(r, focus, local, 60);
    expect(behindness(r.cameraRig.camera.position, focus, local.yaw)).toBeLessThan(-3);
    expect(Math.abs(sideness(r.cameraRig.camera.position, focus, local.yaw))).toBeLessThan(0.5);
  });

  it('locked：720°/s 甩视角，机位仍被硬顶在背后半平面里', () => {
    // 阻尼跟随的稳态落后量 = ω/λ：720°/s 时 12.57/7.5 ≈ 96°，光靠弹簧必然绕到侧面。
    // 硬顶（camera.js LOCKED_YAW_SPAN）就是为这一段准备的。
    const { r, local } = settled('locked');
    const samples = turnView(r, focus, local, 'locked', { degPerSec: 720, seconds: 1.5 });
    for (const s of samples) {
      expect(s.lag).toBeLessThanOrEqual(LOCKED_YAW_SPAN + 1e-9);
      expect(s.behind).toBeLessThan(0);
      expect(s.seen).toBeGreaterThan(0);
    }
    // 甩完停手，镜头照旧回到正背后
    follow(r, focus, local, 90);
    expect(behindness(r.cameraRig.camera.position, focus, local.yaw)).toBeLessThan(-3);
  });

  it('free：同一个 720°/s 甩法不受硬顶影响（自由视角本来就能绕开）', () => {
    const { r, local } = settled('free');
    const samples = turnView(r, focus, local, 'free', { degPerSec: 720, seconds: 1.5 });
    expect(samples.some((s) => s.lag > LOCKED_YAW_SPAN)).toBe(true);
    expect(samples.some((s) => s.behind > 0)).toBe(true);
  });
});

describe('切视角模式不吸附机位', () => {
  const CHAR_YAW = -1.3;
  const focus = new Vector3(-2, 0, 5);

  it('setLookMode / payload 带 lookMode 都不武装 snap，机位也不瞬移', () => {
    const r = rigged({ lookMode: 'locked' });
    const local = { yaw: CHAR_YAW };
    feedFrame(r, focus, local, simYawToCameraYaw(CHAR_YAW), 'locked');
    follow(r, focus, local, 120);
    expect(r._snapPending).toBe(false);

    let mode = 'locked';
    let prev = r.cameraRig.camera.position.clone();
    for (let i = 0; i < 120; i++) {
      // 每 10 帧按一次 V：来回切都不该攒出一次吸附
      if (i % 10 === 0) {
        mode = mode === 'locked' ? 'free' : 'locked';
        expect(r.setLookMode(mode)).toBe(mode);
      }
      feedFrame(r, focus, local, simYawToCameraYaw(CHAR_YAW), mode);
      expect(r._snapPending).toBe(false);
      const now = r.cameraRig.camera.position;
      // 弹簧一帧走不了多远；真出现吸附这里会是几米甚至 120m
      expect(now.distanceTo(prev)).toBeLessThan(0.35);
      expect(Math.hypot(now.x - focus.x, now.z - focus.z)).toBeLessThan(12);
      prev = now.clone();
    }
    // 视线没动过，人也没动过：切完模式镜头还在原来那个背后机位上
    expect(behindness(r.cameraRig.camera.position, focus, local.yaw)).toBeLessThan(-3);
  });

  it('free 里走向镜头再切 locked：归位靠弹簧，不甩镜、不飞跃', () => {
    // free 下角色面朝走向：迎着镜头走时 p.yaw 与视线差了整整半圈（最坏的一档）
    const r = rigged({ lookMode: 'free' });
    const local = { yaw: CHAR_YAW };
    feedFrame(r, focus, local, simYawToCameraYaw(CHAR_YAW), 'free');
    follow(r, focus, local, 120);
    local.yaw = CHAR_YAW + Math.PI;
    expect(behindness(r.cameraRig.camera.position, focus, local.yaw)).toBeGreaterThan(3);

    // 切 locked 的那一帧：壳层还没把角色转到视线上（sim 下一 tick 才直赋）
    const before = r.cameraRig.camera.position.clone();
    r.setLookMode('locked');
    r._followCamera(DT, focus, r._followYaw(local));
    expect(r._snapPending).toBe(false);
    expect(r.cameraRig.camera.position.distanceTo(before)).toBeLessThan(0.35);

    // 下一 tick 起 sim 直赋，角色转到视线上，镜头本来就在背后
    for (let i = 0; i < 90; i++) {
      feedFrame(r, focus, local, simYawToCameraYaw(CHAR_YAW), 'locked');
    }
    expect(local.yaw).toBeCloseTo(CHAR_YAW, 12);
    expect(behindness(r.cameraRig.camera.position, focus, local.yaw)).toBeLessThan(-3);
  });

  it('归位途中硬顶让路：机位从正脸转回背后，逐帧走位与纯弹簧逐位相同', () => {
    // 角色**不转身**地停在那里（冒烟台 ?tour=0 就是这个局面），镜头得自己从正脸绕回去。
    // 这一段路上硬顶必须整只让路：拽一把就是一记甩镜，而不是「镜头有重量」。
    // 生产路径切 V 会 releaseBehind()（renderer.setLookMode），把 R3 咬合闸也松开；
    // 这里直接打 camera.update，要自己松，否则 snap 留下的 behindHeld 会按住半圈。
    const held = createCamera({});
    const spring = createCamera({});
    const at = new Vector3(0, 0, 0);
    held.snap(at, Math.PI);
    spring.snap(at, Math.PI);
    held.releaseBehind();
    spring.releaseBehind();

    let maxStep = 0;
    let prev = held.state.pos.clone();
    for (let i = 0; i < 180; i++) {
      held.update(DT, at, 0, null, { behindYaw: 0 });
      spring.update(DT, at, 0, null, {});
      maxStep = Math.max(maxStep, held.state.pos.distanceTo(prev));
      prev = held.state.pos.clone();
      expect(held.state.pos.distanceTo(spring.state.pos)).toBeLessThan(1e-9);
    }
    // 弹簧自己的最快一帧就在 0.8m 上下；硬顶插手的话这里会翻两三倍
    expect(maxStep).toBeLessThan(0.9);
    expect(behindness(held.state.pos, at, 0)).toBeLessThan(-3);
  });

  it('过门仍然要吸附：换区武装 snap，切模式与同区帧都不武装', () => {
    const r = rigged({ lookMode: 'locked' });
    const local = { yaw: 0 };
    const at = new Vector3(0, 0, 0);
    expect(r._notePhase('hub')).toBe(true); // 开局第一帧本来就待吸附
    follow(r, at, local, 30);
    expect(r._snapPending).toBe(false);

    expect(r._notePhase('hub')).toBe(false); // 同一区，反复调用不产生副作用
    r.setLookMode('free');
    r.setLook(lookPayload({ yaw: 0.3, pitch: 0, lookMode: 'locked' }));
    expect(r._notePhase('hub')).toBe(false);

    expect(r._notePhase('arena')).toBe(true); // 过门
    r._followCamera(DT, at, r._followYaw(local));
    expect(r._snapPending).toBe(false);
    expect(r._notePhase('arena')).toBe(false);
  });
});

describe('locked 背后半平面硬顶（camera.js）', () => {
  it('holdBehind：半平面内不动手，越界夹到边界，朝向被瞬移则放手', () => {
    const face = 0.7;
    const slack = lockedHoldSlack(DT);
    // 半平面里：原样返回，连浮点都不许动
    expect(holdBehind(face, face, slack)).toBe(face);
    expect(holdBehind(face + 1.2, face, slack)).toBe(face + 1.2);
    // 越界一点点：夹到边界，方向（左/右侧）保留
    expect(holdBehind(face + LOCKED_YAW_SPAN + 0.2, face, slack)).toBeCloseTo(
      face + LOCKED_YAW_SPAN,
      12
    );
    expect(holdBehind(face - LOCKED_YAW_SPAN - 0.2, face, slack)).toBeCloseTo(
      face - LOCKED_YAW_SPAN,
      12
    );
    // 差了半圈 = 朝向被瞬移（切模式那一帧 / 重生改写朝向）：这一帧不硬顶
    expect(holdBehind(face + Math.PI, face, slack)).toBe(face + Math.PI);
    // 掉帧（dt 大）时一帧能转得更多，带宽跟着放宽
    expect(lockedHoldSlack(1 / 30)).toBeGreaterThan(slack);
  });

  it('rig：behindYaw 才夹 yaw；不给时 yaw 可落后，位置仍被 R3 咬合闸按住', () => {
    const focus = new Vector3(0, 0, 0);
    const face = 0.4;
    const held = createCamera({});
    const loose = createCamera({});
    held.snap(focus, face);
    loose.snap(focus, face);

    // 角色面向以 720°/s 转，镜头目标每帧跟着走
    let yaw = face;
    for (let i = 0; i < 90; i++) {
      yaw += ((720 * Math.PI) / 180) * DT;
      held.update(DT, focus, yaw, null, { behindYaw: yaw });
      loose.update(DT, focus, yaw, null, {});
      expect(Math.abs(shortestAngle(yaw, held.state.yaw))).toBeLessThanOrEqual(
        LOCKED_YAW_SPAN + 1e-9
      );
      expect(behindness(held.state.pos, focus, yaw)).toBeLessThan(0);
    }
    // R2 迟滞只夹 locked 的 yaw：没传 behindYaw 时方位角可以落后出半平面
    expect(Math.abs(shortestAngle(yaw, loose.state.yaw))).toBeGreaterThan(LOCKED_YAW_SPAN);
    // R3 咬合闸按跟随角按住机位（两闸都跑），所以位置仍在背后，不会翻到正脸
    expect(behindness(loose.state.pos, focus, yaw)).toBeLessThan(0);
  });

  it('常规转速（≤270°/s）下硬顶逐位不介入：手感一行没改', () => {
    const focus = new Vector3(0, 0, 0);
    for (const degPerSec of [90, 180, 270]) {
      const held = createCamera({});
      const plain = createCamera({});
      held.snap(focus, 0);
      plain.snap(focus, 0);
      let yaw = 0;
      for (let i = 0; i < 240; i++) {
        yaw += ((degPerSec * Math.PI) / 180) * DT;
        held.update(DT, focus, yaw, null, { behindYaw: yaw });
        plain.update(DT, focus, yaw, null, {});
        expect(held.state.pos.distanceTo(plain.state.pos)).toBe(0);
        expect(held.state.yaw).toBe(plain.state.yaw);
      }
    }
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
