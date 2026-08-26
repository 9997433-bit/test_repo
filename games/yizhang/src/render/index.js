// 异掌 · 渲染层公开接口（契约见 .agent_workspace/yizhang/CONTRACT.md）。
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

import { QUALITY, QUALITY_TIERS, PALETTE, GLOVE_TINT } from './config.js';
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
 * @param {number}  [opts.arenaRadius=20]
 * @param {string|number} [opts.localId] 本地玩家 id，缺省从 view 推断
 * @returns {YizhangRenderer}
 */
export function createRenderer(canvas, opts = {}) {
  if (active && !active.disposed) active.dispose();
  active = new YizhangRenderer(canvas, opts);
  return active;
}

/**
 * 推进一帧并绘制。view 是 sim.getView() 的纯 JSON 快照：
 * { t, arenaRadius, tiles[], players[{id,x,y,z,yaw,gloveId,alive,invulnT,awakenedT}], events[] }
 * 字段缺失时按缺省值容错，不会抛错。
 * @param {object} view
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

/** 探针 / 基准脚本用：当前档位、绘制调用、三角形数。 */
export function getStats() {
  return active && !active.disposed ? active.getStats() : null;
}

export function getRenderer() {
  return active;
}

export { QUALITY, QUALITY_TIERS, PALETTE, GLOVE_TINT, YizhangRenderer };
