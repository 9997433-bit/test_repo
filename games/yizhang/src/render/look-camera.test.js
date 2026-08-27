// Round 3 O2「机位复核」：把三条用户能看见的视角行为钉死在渲染侧。
//
// look.test.js 锁的是**稳态的一张快照**（转完 180 帧之后镜头在不在背后）。这份补的是
// 「转的过程中」与「切模式那一下」——恰好是玩家真正会抱怨的两段：
//
//   1. locked —— 转视角人物一起转（1:1 由 input/sim 保证），机位必须**逐帧**留在角色的
//      背后半平面。稳态测不出「转到一半镜头甩到脸前」，所以这里按帧断言。
//   2. free   —— 角色 yaw 不动、只转镜头，机位就该绕到角色**侧面**（露侧脸）乃至正脸。
//      「free 与 locked 不是同一件事」在渲染侧的判决点就是这个：同一个角色 yaw，
//      两种模式的机位落在不同的半平面。
//   3. 切 V / setLookMode —— 人还站在原地，**不许** snap。snap 是留给「世界位置整个换了
//      一处」的（hub ↔ arena 隔着 ~120m）；按一下 V 就硬跳一格是回退。反过来，过门
//      那条路必须仍然 snap，两条一起锁才防得住「为了不跳把 snap 拆了」。
//
// WebGL 在 node 里起不来，所以与 look.test.js 同一手法：只装配镜头链路，
// cameraRig / setLook / _followYaw / _followCamera / _phaseChanged 全是生产代码。
//
// 参照系说明：这里把角色 yaw **原样**当跟随角喂进去。生产路径上 `_followYaw` 拿的是
// `characters.get(id).yaw` —— 那份还带一层 λ=16 的转身阻尼（characters.js），也就是
// 画面上模型真正的朝向。原样喂比生产更陡（少一层缓冲），所以这里绿了，实机只会更稳。

import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import {
  BEHIND_LIMIT,
  BEHIND_SHELL,
  CAMERA_SNAP_MAX_DIST,
  CAMERA_SNAP_TELEPORT,
  behindReleaseSlack,
  createCamera,
  lockedHoldSlack,
  shortestAngle,
} from './camera.js';
import { YizhangRenderer } from './renderer.js';
import { forwardFromYaw } from './view.js';
import { lookPayload } from '../core/look.js';

const DT = 1 / 60;
const HUB_Z = -120;

/** 机位相对某个朝向的前后投影：< 0 = 在这个朝向的背后，> 0 = 在它前面。 */
function behindness(camPos, focus, yaw) {
  const f = forwardFromYaw(yaw);
  return (camPos.x - focus.x) * f.x + (camPos.z - focus.z) * f.z;
}

/** 机位相对某个朝向的左右投影（契约 §1-8：right(yaw) = (cos yaw, -sin yaw)）。 */
function sideness(camPos, focus, yaw) {
  return (camPos.x - focus.x) * Math.cos(yaw) - (camPos.z - focus.z) * Math.sin(yaw);
}

/** 只装配镜头链路的渲染器（look.test.js 的 rigged() 同款）。 */
function rigged({ lookMode = 'locked' } = {}) {
  const r = Object.create(YizhangRenderer.prototype);
  r.cameraRig = createCamera({});
  r.lookPitch = null;
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

describe('locked：转视角时机位逐帧留在角色背后半平面', () => {
  const focus = new Vector3(2, 0, -5);

  // locked 的 1:1 不变量（契约 §14-30）说的就是这件事：转视角 = 转人。
  // 渲染侧照着这个事实驱动 —— 角色 yaw 与喂进来的视线角每帧同值同步转。
  function turnTogether(r, { rate, seconds, from = 0 }) {
    const worst = { behind: -Infinity, atYaw: 0, frame: 0 };
    const frames = Math.round(seconds / DT);
    for (let i = 0; i < frames; i++) {
      const yaw = from + rate * (i * DT);
      const local = { yaw };
      r.setLook(lookPayload({ yaw: -yaw - Math.PI / 2, pitch: 0, lookMode: 'locked' }));
      r._followCamera(DT, focus, r._followYaw(local));
      const b = behindness(r.cameraRig.camera.position, focus, yaw);
      if (b > worst.behind) {
        worst.behind = b;
        worst.atYaw = yaw;
        worst.frame = i;
      }
    }
    return worst;
  }

  it('常速转身（3 rad/s）转满一整圈，最坏的一帧也在背后', () => {
    const r = rigged({ lookMode: 'locked' });
    follow(r, focus, { yaw: 0 }, 60); // 先落位，别把开局那一帧算成「转身中」
    const worst = turnTogether(r, { rate: 3, seconds: (2 * Math.PI) / 3 });
    // 两层阻尼合计滞后 ≈ ω·(1/7.5 + 1/6.2) ≈ 0.88 rad，还没咬到 BEHIND_LIMIT
    expect(worst.behind).toBeLessThan(-4);
  });

  it('急甩（8 rad/s，约 1.3 圈/秒）也不许把镜头甩到正脸', () => {
    const r = rigged({ lookMode: 'locked' });
    follow(r, focus, { yaw: 0 }, 60);
    const worst = turnTogether(r, { rate: 8, seconds: 1.5 });
    // 没有 BEHIND_LIMIT 这道闸时这一档实测甩到 +1.59（正脸），闸上了必须留在背后
    expect(worst.behind).toBeLessThan(-1);
  });

  it('一帧甩过半圈（鼠标猛拉）：机位被按在背后半平面，绝不穿到正面', () => {
    const r = rigged({ lookMode: 'locked' });
    follow(r, focus, { yaw: 0 }, 60);
    // 三帧转 180°：locked 下人跟着一起转，机位只能追，不能翻面
    let worst = -Infinity;
    for (let i = 0; i < 240; i++) {
      const yaw = Math.min(Math.PI, ((i + 1) * Math.PI) / 3);
      r._followCamera(DT, focus, r._followYaw({ yaw }));
      worst = Math.max(worst, behindness(r.cameraRig.camera.position, focus, yaw));
    }
    expect(worst).toBeLessThan(-1);
    // 甩完停手，闸松开，机位照旧收敛到正后方
    expect(behindness(r.cameraRig.camera.position, focus, Math.PI)).toBeLessThan(-6.5);
  });

  it('反向转（鼠标往回甩）同样逐帧在背后，且跨 ±π 不兜整圈', () => {
    const r = rigged({ lookMode: 'locked' });
    follow(r, focus, { yaw: Math.PI - 0.2 }, 60);
    const worst = turnTogether(r, {
      rate: -4,
      seconds: Math.PI / 4,
      from: Math.PI - 0.2,
    });
    expect(worst.behind).toBeLessThan(-1);
  });

  it('转完停手：机位收敛到新朝向的正后方，不是绕了半圈停在侧面', () => {
    const r = rigged({ lookMode: 'locked' });
    const local = { yaw: 2.4 };
    // 喂一个跟角色完全反向的视线角：locked 下它拧不动机位（契约 §14-35）
    r.setLook(lookPayload({ yaw: 0.15, pitch: 0, lookMode: 'locked' }));
    const pos = follow(r, focus, local);
    expect(behindness(pos, focus, local.yaw)).toBeLessThan(-6.5);
    expect(Math.abs(sideness(pos, focus, local.yaw))).toBeLessThan(0.5);
    expect(Math.abs(shortestAngle(r.cameraRig.state.yaw, local.yaw))).toBeLessThan(1e-3);
  });
});

describe('free：同一个角色 yaw，转镜头就露出侧面', () => {
  const focus = new Vector3(-3, 0, 6);
  const CHAR_YAW = 0.6; // 全程不变：free 下转镜头不转人

  /** free 下把镜头钉到某个 sim 视线角上并跑到稳态。 */
  function settleAt(simYaw, frames = 240) {
    const r = rigged({ lookMode: 'free' });
    r.setLook({ simYaw, pitch: 0, lookMode: 'free' });
    return follow(r, focus, { yaw: CHAR_YAW }, frames);
  }

  it('镜头右转 90°：机位落在角色正侧面（前后投影归零、左右投影拉满）', () => {
    const pos = settleAt(CHAR_YAW + Math.PI / 2);
    // 相对角色朝向：不在背后也不在脸前，正好在侧面
    expect(Math.abs(behindness(pos, focus, CHAR_YAW))).toBeLessThan(0.5);
    expect(Math.abs(sideness(pos, focus, CHAR_YAW))).toBeGreaterThan(6);
    // 相对镜头视线：仍旧稳稳在视线的背后（机位公式没变，只是绕的角换了）
    expect(behindness(pos, focus, CHAR_YAW + Math.PI / 2)).toBeLessThan(-6.5);
  });

  it('镜头转 180°：机位绕到角色正脸 —— locked 下这一步是禁区', () => {
    const pos = settleAt(CHAR_YAW + Math.PI);
    expect(behindness(pos, focus, CHAR_YAW)).toBeGreaterThan(6.5);

    // 同一个角色 yaw、同样的帧数，locked 走到的是完全相反的半平面
    const locked = rigged({ lookMode: 'locked' });
    locked.setLook({ simYaw: CHAR_YAW + Math.PI, pitch: 0, lookMode: 'locked' });
    const lockedPos = follow(locked, focus, { yaw: CHAR_YAW }, 240);
    expect(behindness(lockedPos, focus, CHAR_YAW)).toBeLessThan(-6.5);
  });

  it('绕角色扫一整圈：机位恒在视线背后，相对角色则前后两个半平面都走到', () => {
    let minVsChar = Infinity;
    let maxVsChar = -Infinity;
    let worstVsLook = -Infinity;
    for (let i = 0; i < 12; i++) {
      const simYaw = CHAR_YAW + (i * Math.PI * 2) / 12;
      const pos = settleAt(simYaw);
      const vsChar = behindness(pos, focus, CHAR_YAW);
      minVsChar = Math.min(minVsChar, vsChar);
      maxVsChar = Math.max(maxVsChar, vsChar);
      worstVsLook = Math.max(worstVsLook, behindness(pos, focus, simYaw));
    }
    expect(worstVsLook).toBeLessThan(-6.5); // 视线背后，一圈都不例外
    expect(minVsChar).toBeLessThan(-6); // 背面看得到
    expect(maxVsChar).toBeGreaterThan(6); // 正面也看得到
  });

  it('侧面机位仍把角色摆在画面里（露的是侧脸，不是把人转出画外）', () => {
    const simYaw = CHAR_YAW + Math.PI / 2;
    const pos = settleAt(simYaw);
    // 视点落在视线前方，角色恰在机位→视点这条轴上：水平夹角接近 0
    const f = forwardFromYaw(simYaw);
    const toFocusX = focus.x - pos.x;
    const toFocusZ = focus.z - pos.z;
    const len = Math.hypot(toFocusX, toFocusZ);
    const cos = (toFocusX * f.x + toFocusZ * f.z) / len;
    expect(Math.acos(Math.min(1, cos))).toBeLessThan(0.21); // < 12°
  });

  it('free 下角色 yaw 变化不再拖动机位（镜头只听 lookYaw）', () => {
    const r = rigged({ lookMode: 'free' });
    const simYaw = CHAR_YAW + Math.PI / 2;
    r.setLook({ simYaw, pitch: 0, lookMode: 'free' });
    follow(r, focus, { yaw: CHAR_YAW }, 240);
    const before = r.cameraRig.state.pos.clone();
    // 人被打得转了 90°，镜头一动不动
    follow(r, focus, { yaw: CHAR_YAW + Math.PI / 2 }, 120);
    expect(r.cameraRig.state.pos.distanceTo(before)).toBeLessThan(0.1);
    expect(r._followYaw({ yaw: CHAR_YAW + Math.PI / 2 })).toBeCloseTo(simYaw, 12);
  });
});

describe('切视角模式（V 键 / 设置面板）不许 snap', () => {
  const focus = new Vector3(0, 0, HUB_Z); // 安全区坐标：真出了 snap 就是 120m 级的跳
  const CHAR_YAW = 0.4;

  /** 落位到稳态的 free 机位，视线与角色朝向差 π（切模式时机位要走最远）。 */
  function settledOpposite() {
    const r = rigged({ lookMode: 'free' });
    r.setLook({ simYaw: CHAR_YAW + Math.PI, pitch: 0, lookMode: 'free' });
    follow(r, focus, { yaw: CHAR_YAW }, 240);
    expect(r._snapPending).toBe(false);
    return r;
  }

  it('setLookMode 本身不武装 snap，下一帧走的还是弹簧', () => {
    const r = settledOpposite();
    expect(r.setLookMode('locked')).toBe('locked');
    expect(r._snapPending).toBe(false);
    expect(r._followCamera(DT, focus, r._followYaw({ yaw: CHAR_YAW }))).toBe(false);
  });

  it('payload 带 lookMode 切过去（V 键那条路）同样不 snap，机位逐帧连续挪', () => {
    const r = settledOpposite();
    // V 键只改模式，壳层下一帧照样喂同一个视线角
    r.setLook(lookPayload({ yaw: 0.15, pitch: 0, lookMode: 'locked' }));
    expect(r.lookMode).toBe('locked');

    let maxStep = 0;
    let maxDist = 0;
    let prev = r.cameraRig.camera.position.clone();
    for (let i = 0; i < 240; i++) {
      const snapped = r._followCamera(DT, focus, r._followYaw({ yaw: CHAR_YAW }));
      expect(snapped, `第 ${i} 帧不该 snap`).toBe(false);
      const now = r.cameraRig.camera.position;
      maxStep = Math.max(maxStep, now.distanceTo(prev));
      maxDist = Math.max(maxDist, now.distanceTo(focus));
      prev = now.clone();
    }
    // 弹簧最快的那一帧也就挪半米级；snap 会是 14m 量级的一步
    expect(maxStep).toBeLessThan(1);
    // 全程贴着人，既没有飞越也没有被吸到别处
    expect(maxDist).toBeLessThan(CAMERA_SNAP_MAX_DIST);
    // 荡完了确实换了半平面：不 snap ≠ 不生效
    expect(behindness(r.cameraRig.camera.position, focus, CHAR_YAW)).toBeLessThan(-6.5);
  });

  it('来回按 V 十次：一次都不 snap，焦点记账也没被动过', () => {
    const r = settledOpposite();
    for (let i = 0; i < 10; i++) {
      r.setLookMode(i % 2 === 0 ? 'locked' : 'free');
      expect(r._snapPending).toBe(false);
      for (let f = 0; f < 6; f++) {
        expect(r._followCamera(DT, focus, r._followYaw({ yaw: CHAR_YAW }))).toBe(false);
      }
    }
    expect(r._prevFocusX).toBe(focus.x);
    expect(r._prevFocusZ).toBe(focus.z);
    expect(r.cameraRig.camera.position.distanceTo(focus)).toBeLessThan(CAMERA_SNAP_MAX_DIST);
  });

  it('切模式不动 pitch / 距离这些弹簧状态（只换绕谁转）', () => {
    const r = settledOpposite();
    const dist = r.cameraRig.state.dist;
    const pitchOut = r.cameraRig.state.pitchOut;
    r.setLookMode('locked');
    expect(r.cameraRig.state.dist).toBe(dist);
    expect(r.cameraRig.state.pitchOut).toBe(pitchOut);
  });
});

describe('hub ↔ arena 仍然 snap（切模式不许把这条路一起拆了）', () => {
  it('phase 一变就武装 snap；同一 phase 连喂多帧不武装', () => {
    const r = rigged();
    r._snapPending = false;

    expect(r._phaseChanged('hub')).toBe(false); // 第一帧只是登记，不算过门
    expect(r._snapPending).toBe(false);
    expect(r._phaseChanged('hub')).toBe(false);
    expect(r._snapPending).toBe(false);

    expect(r._phaseChanged('arena')).toBe(true);
    expect(r._snapPending).toBe(true);
    r._snapPending = false;
    expect(r._phaseChanged('arena')).toBe(false);
    expect(r._phaseChanged('hub')).toBe(true);
    expect(r._snapPending).toBe(true);
  });

  it('过门那一帧真的吸附：落位 ≤ CAMERA_SNAP_MAX_DIST 且在视线背后', () => {
    const r = rigged();
    const local = { yaw: 0.7 };
    const hub = new Vector3(0, 0, HUB_Z);
    follow(r, hub, local, 120);
    r._phaseChanged('hub');

    const arena = new Vector3(0, 0, 0);
    expect(r._phaseChanged('arena')).toBe(true);
    expect(r._followCamera(DT, arena, r._followYaw(local))).toBe(true);
    const pos = r.cameraRig.camera.position;
    expect(pos.distanceTo(arena)).toBeLessThanOrEqual(CAMERA_SNAP_MAX_DIST);
    expect(behindness(pos, arena, local.yaw)).toBeLessThan(-3);
  });
});

describe('传送保险的两条边（契约 §7.1 / §14-33）', () => {
  it('阈值就是契约那两个数，且把重生与过门分在两侧', () => {
    expect(CAMERA_SNAP_TELEPORT).toBe(60);
    expect(CAMERA_SNAP_MAX_DIST).toBe(20);
    // 局内最远瞬移 = 重生落到对角 ≤ 2 × arenaRadius = 40m，必须落在「不触发」那侧
    expect(CAMERA_SNAP_TELEPORT).toBeGreaterThan(40);
    // hub 与裂岛错开 ~120m，必须落在「触发」那侧
    expect(CAMERA_SNAP_TELEPORT).toBeLessThan(120);
  });

  it('壳层漏调 snapCamera 时，~120m 整跳仍被自动吸附', () => {
    const r = rigged();
    const local = { yaw: 0 };
    const hub = new Vector3(0, 0, HUB_Z);
    follow(r, hub, local, 120);
    // phase 没变（壳层没报），只有焦点整跳 —— 走的就是第二道保险
    const arena = new Vector3(0, 0, 0);
    expect(r._followCamera(DT, arena, r._followYaw(local))).toBe(true);
    expect(r.cameraRig.camera.position.distanceTo(arena)).toBeLessThanOrEqual(
      CAMERA_SNAP_MAX_DIST
    );
  });

  it('重生级瞬移（对角 40m）不触发自动 snap —— 弹簧甩镜是既有手感', () => {
    const r = rigged();
    const local = { yaw: 0 };
    const at = new Vector3(-20, 0, 0);
    follow(r, at, local, 180);
    const before = r.cameraRig.state.pos.clone();

    const respawn = new Vector3(20, 0, 0); // 裂岛直径 = 2 × 20m
    expect(respawn.distanceTo(at)).toBeCloseTo(40, 12);
    expect(r._followCamera(DT, respawn, r._followYaw(local))).toBe(false);
    // 没吸附 ⇒ 这一帧镜头还留在旧位附近，靠弹簧追过去
    expect(r.cameraRig.state.pos.distanceTo(before)).toBeLessThan(4);
    expect(r.cameraRig.state.pos.distanceTo(respawn)).toBeGreaterThan(20);

    // 追个一秒就贴回来了，不留在半路
    follow(r, respawn, local, 60);
    expect(r.cameraRig.state.pos.distanceTo(respawn)).toBeLessThan(CAMERA_SNAP_MAX_DIST);
  });

  it('最刁的一种重生（人被搬到镜头正后方）：追赶途中一帧都不横跳', () => {
    const r = rigged();
    const local = { yaw: 0 };
    const at = new Vector3(0, 0, 0);
    follow(r, at, local, 180);

    // 机位在 +Z 侧（角色背后）；人往 +Z 又挪 40m ⇒ 镜头一下子跑到人的正前方
    const respawn = new Vector3(0, 0, 40);
    expect(r._followCamera(DT, respawn, r._followYaw(local))).toBe(false);
    let prev = r.cameraRig.state.pos.clone();
    let maxStep = 0;
    for (let i = 0; i < 300; i++) {
      r._followCamera(DT, respawn, r._followYaw(local));
      maxStep = Math.max(maxStep, r.cameraRig.state.pos.distanceTo(prev));
      prev = r.cameraRig.state.pos.clone();
    }
    // 追赶是弹簧，一帧最多挪几米；背后闸若在飞行途中硬按会是几十米的一步
    expect(maxStep).toBeLessThan(4);
    // 追到了，而且照旧停在背后
    expect(behindness(r.cameraRig.camera.position, respawn, 0)).toBeLessThan(-6.5);
  });
});

describe('背后闸本身（BEHIND_LIMIT / BEHIND_SHELL / releaseBehind）', () => {
  const focus = new Vector3(0, 0, 0);

  it('闸留了余量：75° 上限，离半平面边界还有 15°', () => {
    expect(BEHIND_LIMIT).toBeLessThan(Math.PI / 2);
    expect(Math.PI / 2 - BEHIND_LIMIT).toBeGreaterThan(0.2);
    expect(BEHIND_SHELL).toBeGreaterThan(1);
  });

  it('snap 落位即咬合；releaseBehind 松开后由弹簧重新进锥再自动咬上', () => {
    const rig = createCamera({});
    rig.snap(focus, 0);
    expect(rig.state.behindHeld).toBe(true);

    rig.releaseBehind();
    expect(rig.state.behindHeld).toBe(false);
    // 松开状态下即便机位在锥外（这里让跟随角当场翻面），也不许被拽走
    const before = rig.state.pos.clone();
    rig.update(DT, focus, Math.PI, new Vector3());
    expect(rig.state.pos.distanceTo(before)).toBeLessThan(0.5);

    // 荡回锥内的那一帧闸自动咬上
    for (let i = 0; i < 240; i++) rig.update(DT, focus, Math.PI, new Vector3());
    expect(rig.state.behindHeld).toBe(true);
  });

  it('咬合状态下逐帧偏离不越过上限（外加呼吸/震动也够不着半平面）', () => {
    const rig = createCamera({});
    rig.snap(focus, 0);
    rig.impulse(1.4, 6.5); // 最重的一记震动
    let worstDev = 0;
    for (let i = 0; i < 180; i++) {
      // 每帧转 0.25rad（15rad/s ≈ 860°/s）：比人手甩得动的还快，但还在放手带里，
      // 闸得逐帧咬住。再快就归「视线被瞬移」管，见下面那组放手带的测。
      const yaw = i * 0.25;
      rig.update(DT, focus, yaw, new Vector3());
      const dx = rig.state.pos.x - focus.x;
      const dz = rig.state.pos.z - focus.z;
      worstDev = Math.max(worstDev, Math.abs(shortestAngle(yaw, Math.atan2(dx, dz))));
      // 含呼吸与震动的实拍机位仍在背后半平面
      expect(behindness(rig.camera.position, focus, yaw)).toBeLessThan(0);
    }
    expect(worstDev).toBeLessThanOrEqual(BEHIND_LIMIT + 1e-9);
    // 闸真的在咬：这个转速下机位一直贴在上限上，不是「压根没管」
    expect(worstDev).toBeGreaterThan(BEHIND_LIMIT - 1e-3);
  });

  it('locked 的闸不带放手带：每帧 51.5° 的连续急转也照旧硬顶在上限内', () => {
    const rig = createCamera({});
    rig.snap(focus, 0);
    rig.impulse(1.4, 6.5);
    let worstDev = 0;
    for (let i = 0; i < 180; i++) {
      const yaw = i * 0.9; // 54rad/s ≈ 3100°/s，早已越过 free 的放手带
      rig.update(DT, focus, yaw, new Vector3(), { behindYaw: yaw });
      const dx = rig.state.pos.x - focus.x;
      const dz = rig.state.pos.z - focus.z;
      worstDev = Math.max(worstDev, Math.abs(shortestAngle(yaw, Math.atan2(dx, dz))));
      expect(behindness(rig.camera.position, focus, yaw)).toBeLessThan(0);
    }
    expect(worstDev).toBeLessThanOrEqual(BEHIND_LIMIT + 1e-9);
  });
});

// P1 O2：free 的跟随角是壳层喂的 lookYaw，而 lookYaw 是鼠标增量直接累加出来的
// （src/input 的 applyLook：`state.yaw += dx * 0.0026 * sensitivity`，没有速率限制）。
// 一帧 1209px 的猛拉就是 π —— 指针锁定下甩一把鼠标、或手机上一次划屏（触摸 0.0055rad/px，
// 571px 即可）都到得了。闸这时若硬按，机位要绕着焦点旋过 (π − 75°)，7.1m 半径上就是
// **一帧 11.2m** 的横移：比它要防的「镜头荡到脸前」还难看，而 free 本来就允许看正脸。
//
// 所以闸补了与 R2 硬顶同源的放手带（behindReleaseSlack = lockedHoldSlack）：跟随角一帧
// 跨过闸宽就整只让路，位置一帧不动，弹簧自己荡回去。这一组把「让路」钉死，上一组
// （闸本身）把「日常还咬」钉死，两组一起看才是完整的闸。
describe('free 视线一帧跨过闸宽：闸让路，不绕焦点横旋（P1 O2）', () => {
  const focus = new Vector3(0, 0, 0);
  /** 修前这一记猛拉的实测单帧位移（m）—— 回归线就是拿它当参照。 */
  const YANK_BEFORE = 11.2;
  /** 「与切 V 同级」：切视角模式那条路弹簧最快的一帧也就 <1m（见上面的切 V 组）。 */
  const SPRING_STEP = 1;

  /** free 稳态起手：snap 落位 + 跑满弹簧，闸此时是咬合的。 */
  function settled(yaw = 0) {
    const rig = createCamera({});
    rig.snap(focus, yaw);
    for (let i = 0; i < 240; i++) rig.update(DT, focus, yaw, new Vector3());
    expect(rig.state.behindHeld).toBe(true);
    return rig;
  }

  /** 一帧把视线角改到 `to`，跑 `frames` 帧，返回过程中的峰值单帧位移。 */
  function flick(rig, to, frames = 240, opts = {}) {
    let prev = rig.state.pos.clone();
    let maxStep = 0;
    let first = 0;
    for (let i = 0; i < frames; i++) {
      rig.update(DT, focus, to, new Vector3(), opts);
      const step = rig.state.pos.distanceTo(prev);
      if (i === 0) first = step;
      maxStep = Math.max(maxStep, step);
      prev = rig.state.pos.clone();
    }
    return { first, maxStep };
  }

  it('一帧甩过 π：单帧位移与切 V 同级，不是十来米的横旋', () => {
    const rig = settled();
    const { first, maxStep } = flick(rig, Math.PI - 1e-6);
    expect(first).toBeLessThan(SPRING_STEP);
    expect(maxStep).toBeLessThan(SPRING_STEP);
    // 修前这一帧是 11.2m：留个数量级的余量，别让它悄悄涨回去
    expect(maxStep).toBeLessThan(YANK_BEFORE / 10);
    // 让路 ≠ 不生效：弹簧自己把机位荡到新视线背后
    expect(behindness(rig.camera.position, focus, Math.PI - 1e-6)).toBeLessThan(-6.5);
    expect(rig.state.behindHeld).toBe(true);
  });

  it('从闸宽一路扫到 π：每一档都只走弹簧，没有一档横旋', () => {
    for (const delta of [1.4, 1.6, 1.8, 2.0, 2.4, 2.8, Math.PI - 1e-6]) {
      const rig = settled();
      const { maxStep } = flick(rig, delta);
      expect(maxStep, `Δyaw=${delta.toFixed(2)}`).toBeLessThan(SPRING_STEP);
      expect(behindness(rig.camera.position, focus, delta)).toBeLessThan(-6.5);
    }
  });

  it('让路那一帧机位原地不动（位移 = 纯弹簧步长），且闸当场松开', () => {
    const rig = settled();
    const before = rig.state.pos.clone();
    rig.update(DT, focus, Math.PI - 1e-6, new Vector3());
    expect(rig.state.behindHeld).toBe(false);
    expect(rig.state.pos.distanceTo(before)).toBeLessThan(0.3);
    // 回程只在重新进锥的那一帧咬合，所以没有第二记甩镜
    let prev = rig.state.pos.clone();
    let maxStep = 0;
    for (let i = 0; i < 300; i++) {
      rig.update(DT, focus, Math.PI - 1e-6, new Vector3());
      maxStep = Math.max(maxStep, rig.state.pos.distanceTo(prev));
      prev = rig.state.pos.clone();
    }
    expect(maxStep).toBeLessThan(SPRING_STEP);
    expect(rig.state.behindHeld).toBe(true);
  });

  it('人被搬到镜头跟前（壳层内的 12m 瞬移）同样不横旋', () => {
    const rig = settled();
    const jumped = new Vector3(0, 0, 12); // 半径仍在 dist × BEHIND_SHELL 之内，壳层那档兜不住
    let prev = rig.state.pos.clone();
    let maxStep = 0;
    for (let i = 0; i < 300; i++) {
      rig.update(DT, jumped, 0, new Vector3());
      maxStep = Math.max(maxStep, rig.state.pos.distanceTo(prev));
      prev = rig.state.pos.clone();
    }
    // 修前这一路是 6.9m 的一步；现在只剩追人的弹簧（焦点跳 12m ⇒ 首帧约 1.2m）
    expect(maxStep).toBeLessThan(1.5);
    expect(behindness(rig.camera.position, jumped, 0)).toBeLessThan(-6.5);
  });

  it('locked 不受影响：同一记猛拉照旧被硬顶按在背后（永不绕到正脸）', () => {
    const rig = settled();
    let worst = -Infinity;
    for (let i = 0; i < 240; i++) {
      const yaw = Math.PI - 1e-6;
      rig.update(DT, focus, yaw, new Vector3(), { behindYaw: yaw });
      worst = Math.max(worst, behindness(rig.camera.position, focus, yaw));
    }
    expect(worst).toBeLessThan(-1);
  });

  it('放手带与 R2 硬顶同源（同一个 lockedHoldSlack，掉帧一起放宽）', () => {
    expect(behindReleaseSlack(DT)).toBe(lockedHoldSlack(DT));
    expect(behindReleaseSlack(1 / 20)).toBeGreaterThan(behindReleaseSlack(DT));
    // 带宽落在「人手甩不到、瞬移必超」之间：60fps 下 0.5rad/帧 ≈ 30rad/s
    expect(behindReleaseSlack(DT)).toBeCloseTo(0.5, 12);
    expect(behindReleaseSlack(DT)).toBeLessThan(BEHIND_LIMIT);
  });

  it('壳层那条真链路：free 下 setLook 一帧改 π，不 snap 也不横旋', () => {
    const r = rigged({ lookMode: 'free' });
    const at = new Vector3(4, 0, -2);
    const local = { yaw: 0.3 };
    r.setLook({ simYaw: 0.3, pitch: 0, lookMode: 'free' });
    follow(r, at, local, 240);
    expect(r._snapPending).toBe(false);

    // 鼠标一帧拉过 1209px（0.0026rad/px）：lookYaw 直接跳 π
    r.setLook({ simYaw: 0.3 + Math.PI, pitch: 0 });
    let prev = r.cameraRig.camera.position.clone();
    let maxStep = 0;
    for (let i = 0; i < 240; i++) {
      expect(r._followCamera(DT, at, r._followYaw(local)), `第 ${i} 帧不该 snap`).toBe(false);
      const now = r.cameraRig.camera.position;
      maxStep = Math.max(maxStep, now.distanceTo(prev));
      expect(now.distanceTo(at)).toBeLessThan(CAMERA_SNAP_MAX_DIST);
      prev = now.clone();
    }
    expect(maxStep).toBeLessThan(SPRING_STEP);
    expect(behindness(r.cameraRig.camera.position, at, 0.3 + Math.PI)).toBeLessThan(-6.5);
  });
});
