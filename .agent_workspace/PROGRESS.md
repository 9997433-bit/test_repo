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

- Round 1：已完成（10/10 已合入工作分支）
- Round 2：进行中（靶向重构，云端仍限 3 VM）
- Round 3：未开始

## Round 1 派发记录

基础设施约束：`Async new-VM subagent limit of 3`。本轮按规格准备 10 路云端 Task，但同时只能启动 3 个新 VM。已启动 3 路，其余 7 路排队，空出槽位后立刻补派，禁止改派本地或降级模型。

| 角色 | 模型 slug | 状态 | cloud agent id |
| --- | --- | --- | --- |
| Fable-1 架构 | `claude-fable-5-thinking-xhigh` | 已完成 · 文档已合入 `c9dd945` | `bc-6c0aad50-7af2-5740-80ea-fab58f2aff30` |
| Fable-2 美术 UX | `claude-fable-5-thinking-xhigh` | 已完成 · 样式已合入 `4a179c5` | `bc-125afe7c-6e8b-5522-8db7-07d2a703a011` |
| Fable-3 玩法数值 | `claude-fable-5-thinking-xhigh` | 已完成 · 数据已合入 `79c70d4` | `bc-7e78105a-effd-503e-a29c-f4c48c3ea52f` |
| Fable-4 SOTA 验收 | `claude-fable-5-thinking-xhigh` | 已完成 · 文档已合入 `1e55e1a` | `bc-d1bb33dd-c25c-5103-9de4-9285c4985e6b` |
| Opus-1 世界引擎 | `claude-opus-5-thinking-high-fast` | 已完成 · 已合并 `cursor/opus1-world-engine-dd83` | `bc-5d5e9cd8-6b71-5918-96d9-fcfe2b9add83` |
| Opus-2 探索三线 | `claude-opus-5-thinking-high-fast` | 已完成 · 已合并 `cursor/explore-trio-feel-be73` | `bc-dd4b6069-cc81-5cfe-9a9a-ef5553e2be73` |
| Opus-3 英雄战斗 | `claude-opus-5-thinking-high-fast` | 已完成 · 已合并 `cursor/opus3-heroes-combat-d192` | `bc-ffd6ff3f-b4e7-59c3-a910-2050fe40d192` |
| Opus-4 UI 主循环 | `claude-opus-5-thinking-high-fast` | 已完成 · 已合并 `cursor/opus4-ui-mainloop-a21e` | `bc-f3529b54-7b9b-5f88-a649-4421dac2a21e` |
| GPT-sol-1 单测探针 | `gpt-5.6-sol-xhigh-fast` | 已完成 · 已合入 `e366255`（17 测全绿） | `bc-fd8d5866-1c41-5a9a-9845-967ece4a8ee1` |
| GPT-sol-2 基准压力 | `gpt-5.6-sol-xhigh-fast` | 已完成 · 已合入 `354018e` | `bc-c8091a37-6eac-5776-8cbf-29d773d6c440` |

草稿 PR：https://github.com/9997433-bit/test_repo/pull/8

## 结论简报

### Round 1 结论简报

**已实现功能**
- 独立目录 Vite 工程（端口 4174），文档 + 可执行契约 + 夏日废海 CSS 令牌/皮肤/无障碍。
- 世界：reason 码、stepSim 纯量子、离线补算、围栏邻接、卡通海面、二维拾荒命中。
- 探索：拾荒闪光/hitTest、钓鱼 Perfect/Good/Miss + 窗口漂移、潜水派生布局与可序列化会话。
- 数值：18 鱼、30 关 Boss 机制、shard 掉落表、建筑产率入表、低品质开荒英雄。
- 战斗：码点排序确定性、七技能星级门槛、委任互斥、伤病接口。
- UI：按需更新六屏、节奏条不泄底、建造红绿格、潜水 HUD、`boot(..., { render })`。
- 测试：17 单测 + 7 探针；bench 64 建筑预算内；stress 3840 场同输入 0 错配。

**遗留缺陷**
- `core/engine.js` 仍动态 import UI（vite 告警）；sim 未消费 `BUILDINGS.output` / `UNLOCK_HQ` / 新天气轴。
- 关卡仍 4 敌，未接 `firstClear` shard 与 `applyBattleInjuries` / `battleSeed`。
- 探索新 API（`beginCast`/`diveHud`/`DIVE_ZONES`）与 UI 接线可能不完整。
- UX：指引不 sticky、战报跳过按钮播完不隐藏、潜水切屏氧气仍扣无提示、招募名单已上船挤占、reduceMotion 缺显式开关。
- 战斗快照未按新码点序重落；技能门槛/铁钩/委任三向断言不足。

**性能瓶颈**
- 当前 tick/stepSim/battle p95 远低于预算。风险是建筑邻接与委任若全表扫描退化为 O(B²)。

**Round 2 攻坚重点**
1. Opus-1：删 UI 动态 import；sim/build 读数据表；天气新轴。
2. Opus-2：`DIVE_ZONES`/图鉴/beginCast 与契约对齐，供 UI 直接用。
3. Opus-3：5 敌编队消费、`applyBattleInjuries` 接 tick、酒劲已有则补测试接口。
4. Opus-4：接 firstClear/伤病/重试盐、reduceMotion 开关、UX 债。
5. Fable-3：5v5 关卡表；Fable-4 重验合并树；Fable-1/2 收口契约与画布缺口。
6. GPT-sol：技能/钩/委任快照；bench 覆盖 stepSim + 委任密集。

## Round 2 派发记录

| 角色 | 状态 | cloud agent id |
| --- | --- | --- |
| Fable-1 架构复审 | 排队 | — |
| Fable-2 画布缺口 | 排队 | — |
| Fable-3 5v5 关卡 | 排队 | — |
| Fable-4 SOTA 复验 | 补派中 | — |
| Opus-1 表驱动模拟 | 补派中 | — |
| Opus-2 探索接线 | 排队 | — |
| Opus-3 战斗闭环 | 排队 | — |
| Opus-4 UX 债 | 排队 | — |
| GPT-sol-1 快照单测 | 补派中 | — |
| GPT-sol-2 委任密集 bench | 排队 | — |
