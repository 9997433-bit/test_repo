# Warcraft III Tower Defense — Orchestrator Progress

## Goal
在独立目录 `warcraft3-td/` 中，模仿暴雪《魔兽争霸 III》经典自定义塔防（Element TD / Wintermaul / 经典迷宫 TD）打造 SOTA 级可玩 HTML5 游戏。不得污染仓库根目录或其他游戏目录。

## Branch
`cursor/warcraft3-td-737d`（系统分支模板；用户 SOP 中的 `agent/<task-name>` 映射到此隔离功能分支）

## Isolation
- 游戏根目录：`warcraft3-td/`
- 编排文档：`.agent_workspace/`
- 禁止修改：`test.js` 及其他无关文件

## 并发约束
云端 `environment=cloud` 异步新 VM 上限为 **3**。Round 1 实际派发：
- 3 × 云端（已启动）：FABLE-3 设计平衡、OPUS-1 引擎、OPUS-2 战斗
- 7 × 本地 Task：补齐 10 席并分区改文件，避免互相覆盖

## Rounds
| Round | Status | Focus |
|-------|--------|--------|
| 1 | IN PROGRESS | 初始构建与基线探索 |
| 2 | PENDING | 靶向重构与深度优化 |
| 3 | PENDING | SOTA 打磨与最终验收 |

## 主调度器已落地的可玩基线
- `index.html` + WC3 风格 HUD（资源条 / 头像 / 命令卡 / 小地图）
- 四族 × 三系 × 三阶防御塔，30 波，英雄 QWE，利息与木材
- TFT 攻击护甲表 + 护甲公式 + 飞空/魔免规则
- `node tests/run.mjs` 34 passed；`tests/bench.mjs` 40 塔 80 怪 ≈ 0.17ms/tick
