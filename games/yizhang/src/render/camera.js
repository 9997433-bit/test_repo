// 第三人称跟随相机。
//
// 三条纪律：
//  1. 有阻尼 —— 位置与视点都是弹簧跟随，快速移动时先滞后再追上（手册 §11.5）
//  2. 有呼吸 —— 即使静止也有极轻微的漂移，避免「引擎默认机位」的死板
//  3. 震动按质量给 —— 轻掌几乎不震，重击才震；移动端整体乘 0.45，避免小屏晕眩
//  4. 阻尼归阻尼，脸前是禁区 —— 机位相对跟随角的滞后封顶在 BEHIND_LIMIT，
//     再急的甩镜也荡不到角色正面（契约 §14-35 两分支同式）
//
// 弹簧有两个例外：
//
//  · `snap()` —— 弹簧是给「角色在走」准备的，不是给「角色换了个岛」准备的：安全区在
//    z ≈ -120、裂岛在原点，过门后老老实实跟随的话镜头要飞越 120m，那一秒画面里既
//    没有角色也没有场景。过门 / 换跟随目标 / 开局第一帧一律 snap。
//  · `update(..., { behindYaw })` —— 固定人物视角（locked）的背后半平面硬顶。阻尼
//    只是「慢一点」，快速转身时它会慢到镜头绕去正脸，而 locked 承诺的就是绕不到正脸。
//    自由视角（free）不传这个参数：那边本来就该能看到角色侧面。

import { PerspectiveCamera, Vector3 } from './gfx.js';

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

/**
 * 固定人物视角（locked）下，机位允许落后角色面向的最大夹角。
 *
 * 严格的「背后半平面」是 π/2；这里留 0.1rad 余量，夹住之后机位到角色前向的
 * 投影恒 ≤ -sin(0.1) × 距离（7.1m 上约 -0.7m），断言拿得到确定的负数，
 * 而不是一个可正可负的 0。
 *
 * 阻尼跟随本身只是「慢一点」，快速转身时它会慢到镜头绕去正脸 —— locked 的
 * 产品承诺是「绕不到正脸」，所以这条线是硬顶，不是又一层弹簧。
 * 只在 locked 路径上生效（`update(..., { behindYaw })`），free 不传这个参数。
 */
export const LOCKED_YAW_SPAN = Math.PI / 2 - 0.1;

/**
 * 硬顶的生效带宽（rad/s → 每帧允许的转身量）。
 *
 * 硬顶带迟滞：**上一帧还在半平面里**才拽得动这一帧（见 update 里的 behindHold）。
 * 于是「转身把镜头挤出去了」与「朝向被瞬移 / 正在归位」被分开处理 —— 前者每帧只
 * 超出一点点（转速 × dt），拽回去是无感的；后者一上来就差半圈（切视角模式那一帧
 * 壳层还没把角色转过来、重生改写朝向），硬拽就是一记甩镜，让弹簧自己走回来才对。
 * 带宽只用来兜住「一帧转得特别多」的转身：30rad/s ≈ 1700°/s，真人甩鼠标的持续
 * 转速远在其下；再快就当朝向被瞬移。
 */
const LOCKED_HOLD_RATE = 30;
const LOCKED_HOLD_MIN = 0.25;
const LOCKED_HOLD_MAX = 1.2;

/**
 * 「跟随目标这一帧是被搬走了，不是走过去的」的判据（米，契约 §7.1）。
 *
 * 上界由裂岛定：局内最远的一次瞬移是重生落到对角（≤ 2 × arenaRadius = 40m），
 * 那一下的弹簧甩镜是既有手感，**不许**被当成传送吸掉（契约 §14-33）。
 * 下界由双区布局定：安全区在 z ≈ -120、裂岛在原点，过门那 ~120m 必须触发。
 * 60 落在两者中间，两边都留了 20m 富余。
 */
export const CAMERA_SNAP_TELEPORT = 60;

/**
 * snap（含自动 snap）落位后相机与跟随目标的距离上界（米，契约 §7.1）。
 * 稳态机位几何上界 ≈ 9–18m，20 是留了余量的验收线，G1/G2 断言用。
 */
export const CAMERA_SNAP_MAX_DIST = 20;

/**
 * 机位相对**跟随角**的极角偏离上限（弧度）。跟随角就是 update() 收到的那个 yaw：
 * locked 是角色自己的朝向，free 是壳层喂的视线角（契约 §14-35 两分支同式）。
 *
 * 为什么要这道闸：机位有两层阻尼（yaw λ=7.5、位置 λ=6.2），一次急甩的稳态滞后
 * 约 ω·(1/7.5 + 1/6.2) 弧度 —— 8 rad/s 就滞后 135°，机位整个荡到角色**脸前**，
 * 「固定人物视角永不绕到正脸」当场破功。闸只在甩得比 ~4 rad/s 还快时才咬到，
 * 日常瞄准（≲ 3 rad/s，滞后 ~51°）逐帧无感，转身的重量感原样保留。
 *
 * 75° 距半平面边界还有 15°：cos 75° × 7.1m ≈ 1.84m 余量，够吃下呼吸（±0.05m）
 * 与最重的一记震动（≈ 0.67m）而不越界。
 *
 * 闸是**咬合式**的（state.behindHeld）：只有机位已经在锥内时才按得住。跟随角换了源
 * （切视角模式）那一下机位可能正落在锥外，此时闸松开、交给弹簧荡回来 —— 硬拽会
 * 当场把画面拽过半个圈，那就是一记 snap，正是切 V 时禁止发生的事。见 releaseBehind。
 *
 * free 那边跟随角还会**自己**一帧跨过闸宽（鼠标增量没有速率限制），同样得让路，
 * 否则就是绕焦点的一记横旋。带宽与 R2 硬顶同源，见 behindReleaseSlack。
 *
 * 与 LOCKED_YAW_SPAN 迟滞硬顶并存：后者只夹 locked 的 behindYaw；本闸按跟随角本身咬合，
 * 两套都跑。函数名是 holdBehindLimit，避免盖掉 locked 导出的 holdBehind(angle, …)。
 */
export const BEHIND_LIMIT = Math.PI / 2.4;

/**
 * 背后闸的工作壳层：机位离跟随目标超过「当前跟随距离 × 本系数」就整只松开。
 *
 * 那种距离只出现在「人被搬走了、镜头还在老地方」的追赶途中（重生级瞬移不走 snap，
 * 契约 §14-33 要求保留那段弹簧甩镜）。追赶弧线上机位常常正对着角色的脸，此时按闸
 * 会把飞行路径拽成一记几十米的横跳 —— 比它要防的毛病还难看。
 */
export const BEHIND_SHELL = 2;

/**
 * 背后闸的放手带（free 专用），带宽与 R2 硬顶同源：`lockedHoldSlack(dt)`。
 *
 * 闸只兜「转身把镜头挤出去了一点点」——那种偏离每帧只长一点，拽回去是无感的。
 * 跟随角一帧跨过闸宽则是另一回事：那不是转身，是视线被瞬移，硬按下去机位要绕着
 * 焦点整段横旋 —— 一帧转过 π 就是 2 × 7.1 × sin((π − 75°)/2) ≈ 11.2m 的甩镜，
 * 比它要防的毛病还难看。所以整只松开，位置一帧不动，交给弹簧自己荡过去（≈ 0.1m/帧）。
 *
 * 两条判据（任一成立即让路），对应两种「跨过闸宽」的走法：
 *   · 跟随角这一帧自己跳了超过带宽 —— 鼠标猛甩、壳层改写视线；
 *   · 偏离已经超出闸宽 + 带宽 —— 与 R2 `holdBehind` 的 `off > LOCKED_YAW_SPAN + slack`
 *     同式，兜住「角没跳但焦点被搬走了」这一路（人被瞬移到镜头边上，半径还没出壳层）。
 *
 * 带宽就是 30rad/s 那条线（60fps 下 0.5rad ≈ 28.6°/帧）：真人持续甩镜远在其下，
 * 再快就当视线被瞬移；掉帧时 dt 变大、带宽跟着放宽，与 lockedHoldSlack 一致。
 *
 * 松开之后要等机位重新荡进锥内（偏离 ≤ BEHIND_LIMIT）才咬合，所以回程也不会
 * 在带宽边界上再补一记甩镜。
 *
 * **只给 free。** locked 那边跟随角是角色自己的朝向（characters.js 还有 λ=16 转身阻尼），
 * 一帧跨不过闸宽；而「固定人物视角永不绕到正脸」是硬承诺，那条路上闸就得是硬顶。
 * free 的跟随角是壳层喂的 `lookYaw`：鼠标增量直接累加、没有速率限制，一帧跨半圈是常态，
 * 而 free 本来就允许看到角色侧脸乃至正脸 —— 没有需要硬顶来守的承诺。
 */
export function behindReleaseSlack(dt) {
  return lockedHoldSlack(dt);
}

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

/** 本帧硬顶还认多大的落后量。dt 越大（掉帧）一帧能转的越多，带宽跟着放宽。 */
export function lockedHoldSlack(dt) {
  const d = Number.isFinite(dt) && dt > 0 ? dt : 1 / 60;
  return clamp(LOCKED_HOLD_RATE * d, LOCKED_HOLD_MIN, LOCKED_HOLD_MAX);
}

/**
 * 把一个方位角收回「角色背后半平面」。
 *
 * @param {number} angle   要夹的角（机位绕着的 yaw，或机位相对角色的方位）
 * @param {number} faceYaw 角色面向（sim 空间）
 * @param {number} slack   生效带宽，见 LOCKED_HOLD_RATE
 * @returns {number} 夹过的角；本来就在半平面里、或落后得太多（朝向被瞬移）时原样返回
 */
export function holdBehind(angle, faceYaw, slack = lockedHoldSlack(1 / 60)) {
  const lag = shortestAngle(faceYaw, angle);
  const off = Math.abs(lag);
  if (off <= LOCKED_YAW_SPAN) return angle;
  if (off > LOCKED_YAW_SPAN + slack) return angle;
  return faceYaw + (lag > 0 ? LOCKED_YAW_SPAN : -LOCKED_YAW_SPAN);
}

/** 这个方位角还在角色背后半平面里吗。夹到边界上的值算「在里面」。 */
export function insideBehind(angle, faceYaw) {
  return Math.abs(shortestAngle(faceYaw, angle)) <= LOCKED_YAW_SPAN + 1e-9;
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
 * 背后半平面闸，一帧一次。
 *
 * 四档，按序判：
 *   1. 机位飞在工作壳层之外（`radius > dist × BEHIND_SHELL`）—— 只可能是刚被传送
 *      又没走 snap，这时镜头正从老远处赶过来，「前后半平面」无从谈起。松闸，
 *      让弹簧走它自己的弧线（重生的甩镜手感就是这条，契约 §14-33 要求保留）。
 *   2. 机位在锥内 —— 咬合。此后就归第 3、4 档管。
 *   3. 跟随角一帧跨过了闸宽（`slack`，free 专用）—— 那不是转身，是视线被瞬移。
 *      整只松开，位置一帧不动，弹簧自己走；硬按下去就是十来米的横旋。松开后要等
 *      机位重新荡进锥内才咬合，所以回程也没有第二记甩镜（见 behindReleaseSlack）。
 *   4. 咬合状态下越界 —— 按住：只旋转水平偏移，半径与高度一律不动，
 *      所以画面上是「转得跟手了一点」，不是「被吸走了」。
 *
 * @param {number} step  跟随角这一帧自己转了多少（rad，取绝对值）
 * @param {number|null} slack 放手带宽。free 走 behindReleaseSlack(dt)；
 *                            locked 传 null —— 那边闸是硬顶，见 behindReleaseSlack。
 * @returns {boolean} 这一帧闸有没有真的按住机位
 */
function holdBehindLimit(state, focus, yaw, step, slack) {
  const dx = state.pos.x - focus.x;
  const dz = state.pos.z - focus.z;
  const radius = Math.hypot(dx, dz);
  if (!(radius > 1e-4)) return false;
  if (radius > state.dist * BEHIND_SHELL) {
    state.behindHeld = false;
    return false;
  }
  // 与 desiredPos 同一套极角：正后方 = (sin yaw, cos yaw)，故极角取 atan2(x, z)
  const dev = shortestAngle(yaw, Math.atan2(dx, dz));
  const off = Math.abs(dev);
  if (off <= BEHIND_LIMIT) {
    state.behindHeld = true;
    return false;
  }
  if (slack !== null && (step > slack || off > BEHIND_LIMIT + slack)) {
    state.behindHeld = false;
    return false;
  }
  if (!state.behindHeld) return false;
  const held = yaw + (dev > 0 ? BEHIND_LIMIT : -BEHIND_LIMIT);
  state.pos.x = focus.x + Math.sin(held) * radius;
  state.pos.z = focus.z + Math.cos(held) * radius;
  return true;
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

/**
 * 机位本身也收回背后半平面。绕 focus 转，半径与高度一个都不动 ——
 * 沿前向推开会把构图（距离、俯角）一起改掉，转过去才是「镜头被转身推着走」。
 *
 * 只夹 yaw 是不够的：位置比 yaw 跟得还慢（λ 6.2 vs 7.5），持续快速转身时
 * 目标机位已经贴在半平面边界上，实际机位仍能被甩到边界外面去。
 *
 * 迟滞与 yaw 那份各记各的（位置比 yaw 晚一步进半平面，共用一个位就会在归位
 * 途中拽一把）。
 *
 * @returns {boolean} 这一帧结束时机位在不在半平面里（下一帧的 hold）
 */
function holdPosBehind(pos, focus, faceYaw, slack, hold) {
  const dx = pos.x - focus.x;
  const dz = pos.z - focus.z;
  const r = Math.hypot(dx, dz);
  if (r < 1e-4) return hold;
  const bearing = Math.atan2(dx, dz);
  const held = hold ? holdBehind(bearing, faceYaw, slack) : bearing;
  if (held !== bearing) {
    pos.x = focus.x + Math.sin(held) * r;
    pos.z = focus.z + Math.cos(held) * r;
  }
  return insideBehind(held, faceYaw);
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
    /**
     * locked 硬顶的迟滞位（yaw 与机位各一份）：上一帧还在半平面里才拽得动这一帧。
     * free / 归位途中恒 false，硬顶整只让路。
     */
    behindHold: false,
    behindPosHold: false,
    /** 背后半平面闸是否咬合（见 BEHIND_LIMIT / releaseBehind）。snap 落位即咬上。 */
    behindHeld: false,
    /** 上一帧喂进来的跟随角。闸靠它算「这一帧跟随角自己跳了多少」，见 behindReleaseSlack。 */
    followYaw: 0,
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

    /**
     * 松开背后半平面闸：下一次 update 起先让弹簧把机位荡回锥内，进锥再自动咬合。
     *
     * 只在「跟随角换了源」时调 —— 也就是切视角模式（locked ↔ free）。此刻机位可能
     * 正落在新跟随角的锥外（free 里人朝移动方向、镜头在另一边），闸要是硬按，画面
     * 会当场被拽过半个圈；那是一记 snap，而切 V 不许 snap。人没换地方，弹簧荡过去即可。
     */
    releaseBehind() {
      state.behindHeld = false;
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
     * @param {number} yaw    本帧的跟随角（locked = 角色朝向，free = 视线角）；
     *                        机位既绕着它转，也被它按在背后半平面里（BEHIND_LIMIT）
     * @param {Vector3} vel   水平速度，用于视点前引
     * @param {{pitchBias?: number, behindYaw?: number}} [opts]
     *   pitchBias：叠在 BASE_PITCH 上的抬头/低头量；
     *   behindYaw：locked 专用，机位必须待在这个朝向的**背后半平面**里（见 LOCKED_YAW_SPAN）。
     *   free 不传，自由视角本来就允许绕到侧面 / 正脸。
     */
    update(dt, focus, yaw, vel, opts = {}) {
      const airborne = Math.max(0, focus.y);
      const behindYaw = Number.isFinite(opts.behindYaw) ? opts.behindYaw : null;
      const slack = behindYaw === null ? 0 : lockedHoldSlack(dt);
      // 角度阻尼走最短弧：yaw 从 +3.1 跳到 -3.1 是转 6°，不是转 354°
      state.yaw = dampAngle(state.yaw, Number.isFinite(yaw) ? yaw : state.yaw, 7.5, dt);
      // locked：阻尼可以慢，但不许慢到绕去正脸
      if (behindYaw === null) {
        state.behindHold = false;
        state.behindPosHold = false;
      } else {
        if (state.behindHold) state.yaw = holdBehind(state.yaw, behindYaw, slack);
        state.behindHold = insideBehind(state.yaw, behindYaw);
      }
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
      if (behindYaw !== null) {
        state.behindPosHold = holdPosBehind(
          state.pos,
          focus,
          behindYaw,
          slack,
          state.behindPosHold
        );
      }
      // 重量归重量，脸前是禁区：闸咬合时滞后超过 BEHIND_LIMIT 就按住不许再往前荡。
      // free 那边跟随角是没有速率限制的鼠标增量，一帧跨过闸宽就让路（behindReleaseSlack）；
      // locked 有「永不绕到正脸」的硬承诺，且跟随角本身带阻尼，闸照旧是硬顶。
      const followYaw = Number.isFinite(yaw) ? yaw : state.yaw;
      const followStep = Math.abs(shortestAngle(state.followYaw, followYaw));
      holdBehindLimit(
        state,
        focus,
        followYaw,
        followStep,
        behindYaw === null ? behindReleaseSlack(dt) : null
      );
      state.followYaw = followYaw;

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
      // 落位就在正后方，背后闸当场咬合
      state.behindHeld = true;
      state.followYaw = state.yaw;
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
