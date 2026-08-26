# Round 2 结论简报

十席均已派发并合入父分支。对比 Round 1：从「机制建好未接线」推进到「核心路径已接线」。

## 演进对比

| 项 | Round 1 | Round 2 |
|---|---|---|
| 数值炸弹 | boundary 3 hazards | 0 hazards；等级/驻店帽、settle 拒 NaN |
| 经济 | 表在 data，视图死键 | payouts 适配层 + 30 测；盲盒/占卜负期望在运行时 |
| 样式 | token 未进 main | main.css token 化、44px、focus-visible |
| 文案 | copy 字典闲置 | HUD/商场/事件已接；core toast 仍硬编码 |
| 测试 | 47 | 91 |
| 节奏 | 场外估算 | simulate.mjs；半活跃满级约 29 分钟 |

## 潜在边界风险

- `home/mansion.js` 仍倒挂旧家具价并绕过 `buyFurniture`。
- `hydrate` / `advanceGoal` 播报未接 `OFFLINE`/`GOALS`。
- 1280 双栏工作台未做；JS 注入样式仍引用 legacy token 别名。
- simulate 对照表可能仍是 Round 1 旧值。
- 超大金币浮点精度归零（已知，帽 50 后日常碰不到）。

## SOTA 验收差距

复评快照 48/72 已过时。Parent 估计可发布线（54）已越过，SOTA 线（65）还差：豪宅动作层、core 文案、桌面双栏、legacy 别名收敛、离线回执面板。

## Round 3 冲刺重点

1. 豪宅走 `actions.buyFurniture` + `furnitureCost`。
2. core 离线/目标播报接 copy。
3. 1280 双栏或明确降为 P1 并在 README 写清。
4. 全盘交叉核验：91 测 + bench + simulate + 浏览器主路径。
5. README/验收清单对齐后准备合并。
