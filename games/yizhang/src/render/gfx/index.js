// 薄渲染适配层（gfx）。
//
// 渲染层的其余模块只认这一个入口：场景图、几何体、材质、贴图、相机、灯光都是这里
// 定义的纯 JS 描述，真正的 GPU 工作由 ./backend/ 里的 Babylon.js 8 后端完成。
//
// 这条分界线有两个用处：
//   1. sim / combat / UI 一侧永远不会 import 到引擎的具体类型；
//   2. 单测能在没有 GL 上下文的 node 里验形、验姿态、验层级 —— 描述本身就是可断言的。
//
// 坐标系与 sim 同一套：yaw = 0 面向 -Z，右手系。后端开右手系承接，绝不为迁就引擎
// 默认朝向去改 sim。

export * from './constants.js';
export * from './math.js';
export * from './core.js';
export * from './geometry.js';
export * from './materials.js';
export * from './textures.js';
export * from './objects.js';
export * from './cameras.js';
export * from './lights.js';
export { Clock } from './clock.js';
export { WebGLRenderTarget } from './render-target.js';
export { WebGLRenderer } from './backend/renderer.js';
