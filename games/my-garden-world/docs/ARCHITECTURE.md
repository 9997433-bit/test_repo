# 架构与文件所有权

根目录：`games/my-garden-world/`（自包含 Vite + TypeScript，零依赖仓库其他游戏）。

```
games/my-garden-world/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  src/main.ts              启动
  src/app.ts               组合根
  src/styles/tokens.css    国风设计令牌
  src/styles/main.css      布局与组件
  src/engine/*             状态、循环、存档、时间、事件
  src/data/*               静态内容（花/订单/装扮/花灵/剧情）
  src/systems/*            规则（无 DOM）
  src/ui/*                 HUD / 面板 / 教程
  src/scene/*              花园视图 / 程序化 SVG 花卉 / 天空光影 / 粒子
  src/audio/*              音景
  tests/*                  Vitest（含 jsdom 端到端冒烟）
  docs/*                   GDD / SOTA_AUDIT / 本文件
```

状态为单一 `GameState`（见 `src/engine/state.ts`），系统函数纯更新，UI 订阅渲染。存档 schemaVersion 递增迁移。

## 渲染架构（Round 1 重构后）

- 主循环仍是 rAF，但**不再每帧重建 DOM**：
  - `scene/garden-view.ts`：地块节点常驻并按 key diff；SVG 花卉（`scene/flower-art.ts`）仅在 `flowerId|stage` 变化时重建。
  - `ui/hud.ts`：逐字段 diff 更新 textContent。
  - `ui/panels.ts`：脏标记 + 内容签名比对，按需整面板重渲；倒计时由 `updatePanelTimers` 每帧只写文本。
  - 面板内的选择状态（作坊选材、订单选作品、待播花种）提升到 `app.ts` 作用域，跨渲染存活。
- 教程为数据驱动（`data/story.ts` 的 goal/allow 字段）：故事节点阻断弹窗、操作节点非阻断横幅，dock 按钮随进度渐进解锁，由游戏事件（planted/watered/harvest/orderDone）推进。
- 光影：`scene/ambience.ts` 输出 `data-phase`（晨/昼/暮/夜）与日月位置，CSS 过渡渲染；季节粒子在 `scene/particles.ts`，全部合成器动画。

## Round 1 文件锁

| 代理 | 可写路径 |
|------|----------|
| fable-visual | `src/styles/**` |
| fable-content | `src/data/**`, `docs/GDD.md` |
| fable-ux | `src/ui/tutorial.ts`, `src/data/story.ts`, `docs/UX.md` |
| opus-engine | `src/engine/**`, `src/main.ts`, `src/app.ts`, 构建配置 |
| opus-garden | `src/systems/garden.ts`, `src/systems/planting.ts`, `src/scene/**` |
| opus-economy | `src/systems/workshop.ts`, `src/systems/orders.ts`, `src/systems/economy.ts` |
| opus-meta | `src/systems/decorate.ts`, `src/systems/spirits.ts`, `src/ui/**`（除 tutorial）, `src/audio/**` |
| gpt-unit | `tests/unit/**` |
| gpt-probe | `tests/probe/**`, `docs/PERF.md` |
