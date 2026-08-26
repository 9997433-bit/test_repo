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
  src/scene/*              花园视图与粒子
  src/audio/*              音景
  tests/*                  Vitest
  docs/*                   GDD / 本文件
```

状态为单一 `GameState`（见 `src/engine/state.ts`），系统函数纯更新，UI 订阅渲染。存档 schemaVersion 递增迁移。

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
