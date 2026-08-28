# 蚀核要塞 · 文档索引

实现顺序建议：先读契约，再读架构，最后读各自领域文档。

- [`API_CONTRACT.md`](./API_CONTRACT.md) — **唯一真源，当前 v2.1（Round 2 冻结 + Round 3 补丁）**。冻结签名、类型、事件名、理由码、数据模式（Fable-1）。v2 决议：getView 数值无 `-0`/`NaN`、首波 ≤2s 出怪、data 正式导出名（`ARMOR_MULT` 等 10 出口，无 `SIM_CONFIG` 别名）、shots 只由 combat 渲染、`createInput`/`syncHud` 单一签名、`SocketView.theta` 必备、frameEvents 由 main 聚合。v2.1 补丁（只加法）：shots=combat 独占已确认落地（`world/shots.js` 已删）、GlowLayer 全项目仅 engine 创建一层（world 自建通道停用）、`npm run probe` 经 `src/sim/bot.mjs` 共用 bot 驱动（5 波 leaks≤2 门槛不放水）、R2 收官测试基线 84/84 全绿。
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — v2 + R3 补丁。分层依赖、所有权、帧循环、tick 顺序、坐标系、质量档、错误策略（Fable-1）。
- `ART_DIRECTION.md` — 视觉规范与 CSS（Fable-2）。
- `GDD.md` — 玩法数值与波表设计（Fable-3）。
- `SOTA_CHECKLIST.md` / `ACCEPTANCE.md` — 验收标准（Fable-4）。

契约变更走 `API_CONTRACT.md` 升版流程；禁止代码先行。
