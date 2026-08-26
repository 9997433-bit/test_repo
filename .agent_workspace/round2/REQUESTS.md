# Round 2 接口请求（追加写入）

> 各代理发现契约缺口时在此追加，勿改他人代码。

## gpt-sol-2 · 生产基准 / 经济边界（2026-08-26）

- **P0 · 体力曲线需统一**：`core/state.createInitialState()` 给 60 初始体力，而 `data/stages.js` 第 1–20 关合计消耗 144 体力；按 `balance.STAMINA.regenMs` 一小时只恢复 10 点。即使全胜也只有 70 可用，无法满足 40–60 分钟到第 20 关。请经济/数据负责人统一初始体力、关卡消耗或在第 20 关前提供可调用的体力奖励/补充契约。
- **P1 · 主线进度字段需统一**：`core/state.js` 以 `campaign.highestStage` 为事实来源且 `campaign.cleared` 是对象，`forge/idle.js` 却读取数值型 `campaign.maxCleared ?? campaign.cleared ?? campaign.highest`。实跑器只能临时同时写 `highestStage` 与 `maxCleared`；请统一一个数值字段。
- **P1 · 主线编排接口缺失**：生产层尚无公开 `challengeStage()` 来原子完成体力扣除、`simulateBattle()`、首通/普通/掉落奖励与进度写回。请提供该接口，避免 UI 和测试各自复制结算规则。
