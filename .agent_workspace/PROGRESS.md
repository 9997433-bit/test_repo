# 疯狂水世界 SOTA 复刻 · 编排进度

- 目标：在独立目录 `games/crazy-water-world/` 实现《疯狂水世界》SOTA 级网页复刻（洪水末世、自由木筏建造、海面拾荒 / 钓鱼 / 深海潜水、居民经营、英雄委任与关卡海战）。
- 参考原型：益玩《疯狂水世界》（海上末日模拟生存 + 建造 + 英雄推图），画风清新卡通、语气诙谐打工人，拒绝沉重丧感。
- 隔离原因：同仓库还会并行其他游戏，禁止污染仓库根目录业务代码；本游戏不得引用其他 `games/*` 实现。
- 工作分支：`cursor/crazy-water-world-c895`（系统前缀） / 逻辑名 `agent/crazy-water-world`
- 模型映射（严禁静默降级）：
  - fable → `claude-fable-5-thinking-xhigh`
  - opus-fast → `claude-opus-5-thinking-high-fast`
  - gpt-sol → `gpt-5.6-sol-xhigh-fast`

## 文件所有权（并发防冲突）

| 角色 | 模型 slug | 可写路径 |
| --- | --- | --- |
| Fable-1 架构 | `claude-fable-5-thinking-xhigh` | `games/crazy-water-world/docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md` |
| Fable-2 美术 UX | `claude-fable-5-thinking-xhigh` | `games/crazy-water-world/docs/ART_DIRECTION.md`, `src/styles/**` |
| Fable-3 玩法数值 | `claude-fable-5-thinking-xhigh` | `games/crazy-water-world/docs/GDD.md`, `src/data/**` |
| Fable-4 SOTA 验收 | `claude-fable-5-thinking-xhigh` | `games/crazy-water-world/docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` |
| Opus-1 世界引擎 | `claude-opus-5-thinking-high-fast` | `games/crazy-water-world/src/world/**`, `src/core/**` |
| Opus-2 探索三线 | `claude-opus-5-thinking-high-fast` | `games/crazy-water-world/src/explore/**` |
| Opus-3 英雄战斗 | `claude-opus-5-thinking-high-fast` | `games/crazy-water-world/src/heroes/**`, `src/combat/**` |
| Opus-4 UI 主循环 | `claude-opus-5-thinking-high-fast` | `games/crazy-water-world/src/ui/**`, `src/main.js`, `src/audio/**`, `index.html` |
| GPT-sol-1 单测探针 | `gpt-5.6-sol-xhigh-fast` | `games/crazy-water-world/tests/**`, `scripts/probe.mjs` |
| GPT-sol-2 基准脚本 | `gpt-5.6-sol-xhigh-fast` | `games/crazy-water-world/scripts/bench.mjs`, `scripts/stress.mjs` |

共享只读：`package.json`, `vite.config.js`, `docs/OWNERSHIP.md`, `README.md`。需要改共享文件时只追加、不删他人段落，并在本文件记录。

## Round 状态

- Round 1：进行中（初始构建与基线探索）
- Round 2：未开始
- Round 3：未开始

## 结论简报

（各轮结束后由主调度器回写）
