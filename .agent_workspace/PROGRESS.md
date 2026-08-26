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
| 1 初始构建与基线探索 | 完成 | `.agent_workspace/ROUND1_BRIEF.md` |
| 2 靶向重构与深度优化 | 完成 | `.agent_workspace/ROUND2_BRIEF.md` |
| 3 SOTA 打磨与最终验收 | 进行中（VM 上限 3，分批） | — |

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
| B | F3 经济 | fable | 已完成，曲线与赏金表已合入 | `bc-bc009e97-1eff-52c1-8457-1354d0e0f597` |
| B | F4 叙事 | fable | 已完成，copy/a11y/intro 已合入 | `bc-d59a71a3-ccdc-577d-acf8-1c77b7bb4350` |
| C | O2 小游戏 | opus-fast | 已完成，五店手感已合入 | `bc-7ceaa17b-4d09-5c3e-9a3f-def313d419d6` |
| C | O4 伙伴事件 | opus-fast | 已完成，阵容/产线/事件弹窗已合入 | `bc-6dcadcdd-e4ab-550f-a2f1-dfffcedb3679` |
| C | G1 测试 | gpt-sol | 已完成，47 项单测已合入 | `bc-9174c37f-cbb9-5717-be48-a835c39f9752` |
| D | G2 性能边界 | gpt-sol | 已完成，bench/boundary 已合入 | `bc-48357c9e-60db-5e13-a07f-7a723f8c31dd` |

## Round 2 文件所有权

| Agent | 模型 | 主攻 | 可写路径 |
|---|---|---|---|
| R2-F1 | fable | SOTA 复审 / 量规重打分 | `docs/SOTA_RUBRIC.md`, `docs/ARCHITECTURE.md` |
| R2-F2 | fable | token 接线清单验收 | `docs/DESIGN_SYSTEM.md`（只文档） |
| R2-F3 | fable | 数值钳制方案 | `docs/ECONOMY.md`（只文档，公式改走 R2-O1） |
| R2-F4 | fable | UX 接线验收 | `docs/UX_NARRATIVE.md` |
| R2-O1 | opus-fast | core 硬化：NaN/等级帽/被动XP/研发前置/驻店上限 | `src/core/**`, `src/app.js`, `src/mall/**` |
| R2-O2 | opus-fast | 小游戏单测 + 确认 F3 表接管 | `src/minigames/**`, `tests/minigames.test.js` |
| R2-O3 | opus-fast | `main.css` 接 token/motion，触控 44px | `src/styles/main.css`, `index.html` |
| R2-O4 | opus-fast | HUD/商场/事件接 copy+a11y | `src/app.js` 仅 HUD 文案、`src/mall/**`、`src/events/**` 文案 |
| R2-G1 | gpt-sol | 补小游戏与钳制单测 | `tests/**` |
| R2-G2 | gpt-sol | `scripts/simulate.mjs` + 复测 boundary 危害 | `scripts/**` |

## Round 2 云端批次

| 批次 | Agent | 状态 | bcId |
|---|---|---|---|
| A | R2-F1 SOTA 复审 | 已完成，量规已合入并加 Parent 续评 | `bc-12976fc6-5973-5c3d-8929-d5a82b6cf9da` |
| A | R2-O1 核心硬化 | 已完成，limits/settle/被动XP 已合入 | `bc-296eba5b-282c-5f4c-9873-253fac73aa28` |
| A | R2-O3 CSS 接线 | 已完成，main.css token 化已合入 | `bc-3dc5f228-7843-5491-b82c-b6178be28951` |
| B | R2-O2 小游戏单测 | 已完成，F3 表适配层 + 30 测已合入 | `bc-3c2aa0f4-0423-5a82-be7e-f71e296136eb` |
| B | R2-O4 HUD文案接线 | 已完成，HUD/商场/事件 copy 已合入 | `bc-6d654f68-fc2b-5f5a-9bee-36baaff1801b` |
| C | R2-G2 模拟脚本 | 已完成，simulate + bench 地板已合入 | `bc-ae73f2e8-0ebc-57ea-ad67-2389d991637b` |
| C | R2-G1 补测 | 已完成，contracts 测试已合入 | `bc-ac408e7a-ec0d-5f7c-8e47-820d6de66ee3` |
| D | R2-F4 UX 文档 | 已完成，§7 接线表已合入 | `bc-e0a4b102-578b-563e-8b08-69f51c4e2626` |
| D | R2-F3 经济文档 | 已完成，节奏表已合入并加 Parent 续评 | `bc-aa28d078-b516-5e60-9633-25cba71c2e61` |
| D | R2-F2 视觉文档 | 已完成，§11 状态表已合入 | `bc-20f792f7-985c-5bc8-a44d-33eb6c34e387` |

## Round 3 云端批次

| 批次 | Agent | 模型 | 状态 | bcId |
|---|---|---|---|---|
| A | R3-F1 最终量规 | fable | 已完成，57/72 已快进合入 | `bc-88708113-34bb-5d39-9eea-3d81f9a52ad9` |
| A | R3-O1 豪宅+core文案 | opus-fast | 已完成，buyFurniture + offlineReceipt 已合入 | `bc-2434c100-1966-521f-ae74-c4ed76430876` |
| A | R3-G1 全盘核验脚本 | gpt-sol | 已完成，verify.mjs 已合入 | `bc-7b0e529c-bafa-57f9-8efd-17ca835ec897` |
| B | R3-O2 README验收 | opus-fast | 运行中 | `bc-5844b91c-68e7-5806-84a9-ab220c537967` |
| B | R3-O3 焦点保持 | opus-fast | 运行中 | `bc-cb76042f-15ce-50d3-9710-b8ac7d719c2a` |

## 已实现基线（Parent 预置）

- 独立目录与模块边界
- 可运行的单页游戏壳：主商场、快餐店小游戏、换装、家装、伙伴、放置收益、本地存档
- 设计 tokens、数值表、测试入口
