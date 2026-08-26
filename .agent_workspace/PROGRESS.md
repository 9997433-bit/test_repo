# 时尚百货城 · 编排进度

- **Goal**: 在独立目录 `games/fashion-mall/` 以 SOTA 标准模仿《时尚百货城》（爱的番茄，女性向放置经营 + 换装家装 + 伙伴养成）。
- **编排分支**: `cursor/fashion-mall-sota-446f`（Cloud Agent 前缀约束；SOP 中的 `agent/fashion-mall` 映射至此）
- **隔离约束**: 仅改 `games/fashion-mall/` 与 `.agent_workspace/`，不污染仓库根目录及其他未来游戏。
- **循环**: Round 1 初始构建 → Round 2 靶向重构 → Round 3 SOTA 验收

## 模型映射（严禁静默降级）

| 简称 | slug | 本轮数量 |
|---|---|---|
| fable | `claude-fable-5-thinking-xhigh` | 4 |
| opus-fast | `claude-opus-5-thinking-high-fast` | 4 |
| gpt-sol | `gpt-5.6-sol-xhigh-fast` | 2 |

子代理输出首行必须声明实际使用的模型 slug。

## Round 状态

| Round | 状态 | 结论简报 |
|---|---|---|
| 1 初始构建与基线探索 | 进行中（云端 VM 并发上限 3，分批派发） | 待汇总 |
| 2 靶向重构与深度优化 | 未开始 | — |
| 3 SOTA 打磨与最终验收 | 未开始 | — |

## Round 1 文件所有权（防冲突）

| Agent | 模型 | 主攻 | 可写路径 |
|---|---|---|---|
| F1 | fable | 架构 / SOTA 标准 | `games/fashion-mall/docs/ARCHITECTURE.md`, `docs/SOTA_RUBRIC.md` |
| F2 | fable | 视觉语言 / Design System | `games/fashion-mall/docs/DESIGN_SYSTEM.md`, `src/styles/tokens.css` |
| F3 | fable | 数值经济 / 进度曲线 | `games/fashion-mall/docs/ECONOMY.md`, `src/data/balance.js` |
| F4 | fable | 叙事 UX / 无障碍 | `games/fashion-mall/docs/UX_NARRATIVE.md`, `src/data/copy.js` |
| O1 | opus-fast | 核心引擎：状态、存档、商场、放置收益 | `src/core/**`, `src/mall/**`, `src/app.js` |
| O2 | opus-fast | 店铺小游戏：快餐 / 生鲜 / 盲盒 | `src/minigames/**` |
| O3 | opus-fast | 换装 + 家装 + 服装店形象改造 | `src/fashion/**`, `src/home/**` |
| O4 | opus-fast | 伙伴 / 关卡研发 / 突发事件 | `src/partners/**`, `src/research/**`, `src/events/**` |
| G1 | gpt-sol | 自动化测试与 Mock 探针 | `games/fashion-mall/tests/**` |
| G2 | gpt-sol | 性能基准与边界压力 | `games/fashion-mall/scripts/**` |

共享只读契约：`.agent_workspace/GAME_SPEC.md`、本文件。共享入口 `index.html` / `package.json` 由 O1 主导，其他人只追加 hook，不重写。

## Round 1 云端批次

硬限制：`Async new-VM subagent limit of 3`。本轮按 3+3+3+1 排队，不静默换成其他模型。

| 批次 | Agent | 模型 | 状态 | bcId |
|---|---|---|---|---|
| A | F1 架构 | fable | 已完成，文档已合入父分支 | `bc-7a4c47ba-4925-5ec4-acc5-8bc3d1ea0775` |
| A | F2 视觉 | fable | 已完成，tokens/motion 已合入 | `bc-624a1464-ae2e-5ace-8575-5a2832916e87` |
| A | O3 换装家装 | opus-fast | 已完成，fashion/home SVG 已合入 | `bc-80ba6611-a58b-54b0-8aaa-9cb8f1f6fdf0` |
| B | O1 引擎 | opus-fast | 已完成，core/mall/app/save 测试已合入 | `bc-297ab17d-7197-5747-bdb6-0e0d697eb554` |
| B | F3 经济 | fable | 运行中 | `bc-bc009e97-1eff-52c1-8457-1354d0e0f597` |
| B | F4 叙事 | fable | 运行中 | `bc-d59a71a3-ccdc-577d-acf8-1c77b7bb4350` |
| C | O2 小游戏 | opus-fast | 运行中 | `bc-7ceaa17b-4d09-5c3e-9a3f-def313d419d6` |
| C | O4 伙伴事件 / G1 测试 | 排队 | 待空位 | — |
| D | G2 性能边界 | 排队 | 待空位 | — |

## 已实现基线（Parent 预置）

- 独立目录与模块边界
- 可运行的单页游戏壳：主商场、快餐店小游戏、换装、家装、伙伴、放置收益、本地存档
- 设计 tokens、数值表、测试入口
