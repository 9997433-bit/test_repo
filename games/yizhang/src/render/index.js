// 异掌 · 渲染层公开接口。
//
//   createRenderer(canvas, opts)
//   sync(view)
//   resize(width, height, dpr)
//   setQuality('high' | 'mid' | 'low')
//   dispose()
//
// 模块级函数操作「当前活动渲染器」，同时 createRenderer 会把实例返回，
// 需要同页多实例或想显式持有时可以直接用实例上的同名方法。
// Three.js 只出现在本目录，sim / combat / ai / data 不会看见它。
//
// 输入是 sim.getView() 的原样快照（可以先被 core/interp 插值过）。渲染实际读到的字段
// 列在 ./view.js 头部；那里同时是唯一解析 view 的地方。要点：
//   · 台面完全由 view.arena.tiles 长出来，数组里没有的格子就是洞
//   · yaw = 0 面向 -Z，与 sim 的 forwardX/forwardZ 一致
//   · 本地玩家缺省是 p0（sim 里人类固定排在 p0）
//   · view.phase === 'hub' 时多画一层安全区（走道 / 台座 / 展示掌 / 传送门，见 ./hub.js），
//     phase === 'arena' 时那棵子树整个关掉，裂岛的画法一行未改
//   · view.players[].skinId 决定剪影（见 ./skins.js）：换 skinId 就换一个人，不是换贴图
//   · view.combat.ghosts 是分身残影，渲染成半透复本（见 ./characters.js syncGhosts）
//   · 抬头低头走 setLook({ pitch })：不调就维持静止机位的俯角
//   · 镜头朝向也走 setLook，字段是 **simYaw**（sim 空间，yaw = 0 面向 -Z）；
//     相机系角原样丢进来会把机位拧到脸前，见 setLook 注释
//   · 固定人物视角 setLookMode('locked' | 'free')，缺省 locked：镜头钉在角色背后
//   · 传送 / 换人 snapCamera()：过门时机位吸附，不许弹簧飞越 120m

import { CAMERA_SNAP_MAX_DIST, CAMERA_SNAP_TELEPORT } from './camera.js';
import { QUALITY, QUALITY_TIERS, PALETTE, GLOVE_TINT } from './config.js';
import { COMBAT_VFX_KIND, SKILL_VFX_KIND, combatVfxKind, skillVfxKind } from './combat-vfx.js';
import { ACCESSORIES, accessoryFromAppearance, resolveSkinLook, skinTable } from './skins.js';
import { DEFAULT_LOCAL_ID } from './view.js';
import { YizhangRenderer } from './renderer.js';

/** @type {YizhangRenderer | null} */
let active = null;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} [opts]
 * @param {'high'|'mid'|'low'} [opts.quality='high']
 * @param {boolean} [opts.mobile=false]  移动端：镜头震动整体减弱
 * @param {number}  [opts.pixelRatio]    初始 DPR，之后由 resize 决定
 * @param {number}  [opts.width]         初始宽（缺省读 canvas.clientWidth）
 * @param {number}  [opts.height]
 * @param {number}  [opts.seed]          程序化贴图与岩层的随机种子
 * @param {number}  [opts.arenaRadius=20] 缺省半径，view 给了以 view 为准
 * @param {string|number} [opts.localId] 本地玩家 id；不给就按 view 推断，最后落到 p0
 * @param {string|number} [opts.followId] 同义参数（main.js 用的名字），只有确实在名单里才生效
 * @param {object} [opts.data]  src/data 命名空间。有 SKINS 就用真表剪影，没有就用兜底表
 * @param {object} [opts.skins] 已经 `resolveSkins` / `skinTable` 过的表，优先于 `data`
 * @returns {YizhangRenderer}
 */
export function createRenderer(canvas, opts = {}) {
  if (active && !active.disposed) active.dispose();
  active = new YizhangRenderer(canvas, opts);
  return active;
}

/**
 * 推进一帧并绘制。
 * @param {object} view sim.getView() 的快照
 * @param {number} [dt] 手动指定帧间隔（秒）；缺省用内部时钟
 */
export function sync(view, dt) {
  if (!active || active.disposed) return;
  active.sync(view, dt);
}

/**
 * @param {number} width  CSS 像素宽
 * @param {number} height CSS 像素高
 * @param {number} [dpr]  设备像素比，内部按画质档与全局上限 2 双重封顶
 */
export function resize(width, height, dpr) {
  if (!active || active.disposed) return null;
  return active.resize(width, height, dpr);
}

/** @param {'high'|'mid'|'low'} tier */
export function setQuality(tier) {
  if (!active || active.disposed) return null;
  return active.setQuality(tier);
}

export function dispose() {
  if (!active) return;
  active.dispose();
  active = null;
}

/** 移动端开关可以在运行时改（横竖屏切换 / 设置面板）。 */
export function setMobile(flag) {
  active?.setMobile(flag);
}

/** 观战镜头：主菜单、结算、回放时不跟人，绕岛推轨。 */
export function setSpectator(flag) {
  active?.setSpectator(flag);
}

/** 指定跟随谁。不调用时按 view 推断，最终落到 p0。 */
export function setLocalId(id) {
  return active?.setLocalId(id) ?? null;
}

/** setLocalId 的别名，main.js 用的是这个名字。 */
export function setFollow(id) {
  return setLocalId(id);
}

/**
 * 抬头 / 低头 + 镜头朝向。壳层每帧把 `core/look.js lookPayload()` 的产物丢进来：
 *
 *   render.setLook(lookPayload(input.getLook()));   // { yaw, pitch, simYaw }
 *
 * pitch 与 `src/input` 同约定（正 = 往下看，弧度）。朝向只认 **sim 空间**
 * （yaw = 0 面向 -Z）：`simYaw` 优先，没有 simYaw 时才读 `yaw`，而那个 yaw
 * 必须已经是 sim 空间 —— 输入层内部那个相机方位角要先过 `cameraYawToSimYaw`。
 * 两个都不给时镜头跟角色自己的朝向。`lookMode` 一起收（见 setLookMode）。
 */
export function setLook(look) {
  return active && !active.disposed ? active.setLook(look) : null;
}

/**
 * 固定人物视角开关。
 *
 *   'locked'（缺省）—— 镜头钉在角色背后，用角色自己的 yaw，绕不到正脸；
 *   'free'         —— 用 setLook 喂进来的 simYaw，没喂就跟角色 yaw。
 *
 * @param {'locked'|'free'} mode
 */
export function setLookMode(mode) {
  return active && !active.disposed ? active.setLookMode(mode) : null;
}

/** 当前视角模式。 */
export function getLookMode() {
  return active && !active.disposed ? active.getLookMode() : null;
}

/**
 * 机位吸附：下一帧把镜头瞬时架到跟随目标身后，不走弹簧。
 *
 * 过门（hub ↔ arena）、焦点整跳（> `CAMERA_SNAP_TELEPORT`）与换跟随目标渲染层会
 * 自己认出来；这个入口是给壳层用的 —— 传送前一帧调一次，镜头就不会从上一处飞越
 * 过来。切视角模式（V 键 / 设置面板）**不**走这条路：人没动地方，弹簧荡过去就行。
 */
export function snapCamera() {
  return active && !active.disposed ? active.snapCamera() : null;
}

/** snapCamera 的别名（壳层语义：重新架机位跟人）。 */
export function resetFollow() {
  return snapCamera();
}

/** setLook 的单值写法。 */
export function setPitch(pitch) {
  return active && !active.disposed ? active.setPitch(pitch) : null;
}

/** 当前俯角 + 实际在用的 sim yaw + 视角模式，探针与冒烟台用。 */
export function getLook() {
  return active && !active.disposed ? active.getLook() : null;
}

/** 探针 / 基准脚本用：当前档位、绘制调用、三角形数、台面块数。 */
export function getStats() {
  return active && !active.disposed ? active.getStats() : null;
}

export function getRenderer() {
  return active;
}

export {
  QUALITY,
  QUALITY_TIERS,
  PALETTE,
  GLOVE_TINT,
  DEFAULT_LOCAL_ID,
  YizhangRenderer,
  // snap 两阈值（契约 §7.1）：传送判据与落位距离上界，验收 / 探针引用同一份数字
  CAMERA_SNAP_TELEPORT,
  CAMERA_SNAP_MAX_DIST,
  // 每掌一套的战斗特效：分派键与查询函数（UI / 验收脚本要对照 8 只掌时用得上）
  COMBAT_VFX_KIND,
  SKILL_VFX_KIND,
  combatVfxKind,
  skillVfxKind,
  // 皮肤剪影：配件形制表与解析函数（皮肤选择器要预览剪影时用得上）
  ACCESSORIES,
  accessoryFromAppearance,
  resolveSkinLook,
  skinTable,
};
