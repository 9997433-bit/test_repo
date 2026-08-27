# 异掌 · 手感 / 皮肤 / 每掌特效 攻坚（Goal）

工作目录已隔离：`games/yizhang/`（端口 **4181**）。**禁止再复制一份游戏目录。** 禁止改 `games/` 下其他游戏。

## 用户原话（必须兑现）

1. 电脑玩 **上下反了、左右也反了**（键鼠方向整轴反转）
2. **增加角色皮肤**（现在全员同一胶囊，太单一）
3. **每个手套的效果都没有**（8 掌要有可辨认的独立 VFX）
4. 最好有 **打击感 / 僵直感**，SOTA 级打磨

## 验收线

- **键鼠**：W = 镜头朝向的水平前方（屏幕深处 / 远离相机），S 后退，A 屏幕左，D 屏幕右。鼠标右移 = 角色与镜头右转。触屏摇杆与 WASD 同一套映射。
- **皮肤**：大厅可选 **≥6** 套可辨认皮肤（几何剪影 / 配色 / 配件差异，禁止换贴图包、禁止下载版权素材）。Bot 不得全员同一胶囊。存档记住所选皮肤。
- **每掌 VFX**：8 掌（木棉/磐石/疾风/冰霜/弹簧/分身/磁掌/陨掌）扇击与技能各有可辨特效。禁止纯色光球、发光描边、Bloom 糊屏。分身残影必须在画面上可见。
- **打击感**：本人参与的命中有可感知 hit-stop（单次 ≤120ms）+ 接触扬尘 + 短相机冲击；受击有姿态僵直。不要满屏红晕。
- **测试**：`cd games/yizhang && npm test` 全绿；`npm run probe` PASS 且 `wiredCombat: true`、kills≥1；`vite build` 通过。

## 已定位的方向反转根因（Round 1 优先修）

`src/core/view.js` 的 `RENDER_YAW_OFFSET = Math.PI`，`toRenderView` 给每个玩家 yaw 加 π。

但 `src/render/camera.js` 与 `src/render/characters.js` **已经**按 **yaw=0 面向 -Z** 搭建（与 `src/sim/math.js` `FACE` 一致）。再加 π 会把相机放到角色**面前**：第三人称看到脸，W 朝相机走，A/D 镜像，鼠标右转镜头跑到身前。

输入层 `src/input/index.js` 用**未加偏移的** `state.yaw` 做相机相对位移，与渲染相机用的 `player.yaw+π` 不在同一空间。

**修复方向（由 Fable-1 冻结、Opus-2/4 落地、GPT-sol-1 写测）：**

- 渲染与 sim 朝向对齐后，`RENDER_YAW_OFFSET` 应为 **0**（或删除加 π）。`core/view.test.js` 里「补 π」断言要改。
- 相机方位角 → sim yaw 的换算仍只允许 ADR-17 的三处，禁止第四套。
- 单测必须锁死：给定相机 yaw，W 的 `moveX/moveZ` 与相机水平前向同号；鼠标 +dx 使 sim yaw 向右转（从上方看为顺时针还是按 FACE 约定写清楚）。

## 视觉

强制 `games/yizhang/docs/VISUAL_HANDBOOK.md` **底座 B**：暮蓝天空 + 暖黄裂纹，饱和只留给当前手套识别色。材质物理、使用痕迹。禁止塑料高光、系统字体 HUD。
