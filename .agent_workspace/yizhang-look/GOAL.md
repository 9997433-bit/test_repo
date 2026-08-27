# 异掌 · 固定人物视角 / 机位修复（yizhang-look）

逻辑名：`agent/yizhang-look`  
父分支：`cursor/yizhang-look-db8d`（从 `main@7340300` 拉出）  
游戏根：**只改** `games/yizhang/`（端口 **4181**）  
编排目录：`.agent_workspace/yizhang-look/`（本任务进度真源）

## 用户原话

> 现在人物的视角转换很奇怪优化修复下 还有增加一个固定人物视角功能 人物面向固定 你看看 SOTA 级打磨 单独建一个目录 因为还有其他游戏再同个工作目录下跑

## 隔离（禁止复制第二份游戏）

同工作区已有其他 `games/*`。隔离方式：

- **新编排目录** `.agent_workspace/yizhang-look/`
- **新父分支** `cursor/yizhang-look-db8d`
- **禁止** `cp -r games/yizhang games/yizhang-look` 或任何第二份游戏目录
- **禁止** 改其他 `games/*`、`.github/workflows`、`pages/`

## 目标

1. **修怪视角**：hub↔arena 传送、结算回程、开局跟机时镜头飞跃 / 贴脸 / 左右镜像 / 鼠标与朝向拧巴。
2. **固定人物视角**：可开关的锁机位。镜头钉在角色**身后**；**人物水平面向与相机水平朝向 1:1**（面向固定到视线，不再独立拧）。俯仰仍可上下看。
3. **SOTA 打磨**：模式切换无跳切、过门机位立即吸附、HUD/键位/URL/存档一致、单测不减量。

## 已知根因（父调度只读核验，F1 写入契约）

`core/look.js feedLook` 每帧把 `input.getLook()` 整包丢给 `renderer.setLook`。  
payload 的 `yaw` 是**相机系**，`simYaw` 才是 sim/render 共用的 yaw=0→-Z。  
`YizhangRenderer.setLook` 把 `o.yaw` 存进 `lookYaw`，`sync` 里 `lookYaw == null ? local.yaw : lookYaw` 把**相机系角当 sim 角**用。  
`setLook` 注释已写「别把相机系 yaw 原样丢进来」，但喂入口就是这么做的。这是「视角转换很奇怪」的主嫌疑。

次因：hub 在 z≈−120、裂岛在原点。`camera.js` 弹簧跟随，phase 切换后机位会飞越 ~120m，而不是吸附。

## 推荐冻结面（F1 可改名，但必须唯一、禁止第四套朝向）

| 名 | 语义 |
| --- | --- |
| `lookMode: 'free' \| 'locked'` | `locked` = 固定人物视角 |
| `locked` | 镜头钉身后；`player.yaw` ≡ 相机水平前向（sim 空间）；pitch 独立 |
| `free` | 保持现设计意图：鼠标看与移动相对相机；**仍必须用 sim 空间喂机位**，不得把相机系 yaw 当 sim yaw |
| 切换 | 键 `V`（不抢 E/WASD/空格）、菜单、`?look=locked\|free`、存档 `lookMode`（向后兼容缺省 `locked`——本任务产品默认锁视角） |
| 过门 | `enterArena` / `enterHub` 机位 **snap**（禁弹簧飞岛） |

缺省建议 **`locked`**：用户明确要「固定人物视角 / 人物面向固定」。`free` 作为可切回的高级项。

## 验收线

- 开局 hub：镜头在走道角色**背后**，W 朝角色前向走，不是朝镜头走。
- 过传送门 / 回安全区：机位瞬间架到新位置身后，无 120m 飞跃、无贴脸。
- `lookMode=locked`：转视角 = 转人物面向；人物不独自拧、镜头不绕到正脸。
- `lookMode=free`：仍可独立看；喂入 yaw 空间正确。
- `RENDER_YAW_OFFSET` 保持 **0**。禁止回 `Math.PI`。
- `npm test` 不减量（基线 **557** / 40 files）；`npm run probe` 三 seed 仍 PASS。
- 冒烟：`http://localhost:4181/src/render/smoke.html?phase=hub&unlock=all&tour=1&look=locked`

## 沿用冻结（大厅/手感，不得回退）

缺省 `phase:'hub'`；yaw=0→-Z；空挥闸是 `playerInHub` 空间闸；皮肤真表；`COMBAT_VFX_KIND`；再来一局 ≠ 回安全区；`QUALITY.low.bloom === false`。
