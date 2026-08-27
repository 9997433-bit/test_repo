# Round 3 派发 · 异掌安全区大厅（SOTA 打磨与签字）

基座：`cursor/yizhang-hub-db8d`
必读：`GOAL.md`、`OWNERSHIP.md`、`round2/BRIEF.md`、本文件。
子 PR base：**`cursor/yizhang-hub-db8d`**。
输出**首行**：`MODEL_SLUG: <实际 slug>`。严禁静默降级。

## 并发 10 席

| id | 模型 | 主攻 |
| --- | --- | --- |
| F1 | fable `claude-fable-5-thinking-xhigh` | 契约/GDD/ADR 与实现终对齐（分派词、皮肤形、预算数字） |
| F2 | fable | HV-04 idle 盲辨规范 + 预算下仍可辨的视觉合同（§17） |
| F3 | fable | GDD §13 与 `skins.js`/`vfx.js` 同词；不改战斗数值 |
| F4 | fable | Round 3 签字；重跑全表；W1 修后按字面勾 L3-10 |
| O1 | opus-fast `claude-opus-5-thinking-high-fast` | 计时域/回程边角；不回退空间闸 |
| O2 | opus-fast | **P0 画调用预算**；hub 关裂岛；idle 降档；禁砍 8 掌可辨 |
| O3 | opus-fast | 战斗事件/残影边角；hub 继续拒战 |
| O4 | opus-fast | 结算回走道 UX 打磨；说明牌/门提示跟 F2 |
| G1 | gpt-sol `gpt-5.6-sol-xhigh-fast` | 预算/三 seed/盲辨锁表；不减量 |
| G2 | gpt-sol | probe 三固定 seed；去掉误导 MODEL_SLUG 横幅 |

云端同时最多 **3** 个新 VM。

### Wave 1（本轮先派）

| 席位 | 模型 | Agent ID | 状态 |
| --- | --- | --- | --- |
| O2 画调用预算 | `claude-opus-5-thinking-high-fast` | `bc-5c7aff90-8768-5308-9ca1-eb1cc7161816` | 已合入 `cursor/yizhang-hub-r3-o2-budget-db8d`（mid hub 峰值 94/47.8k，arena 117/70.0k） |
| F2 视觉合同 | `claude-fable-5-thinking-xhigh` | `bc-cb240001-77aa-5dff-a3cb-57e0a4caf7b3` | 已合入 `cursor/yizhang-hub-r3-f2-art-db8d`（ART_DIRECTION §17；CSS 未改） |
| G2 三 seed 探针 | `gpt-5.6-sol-xhigh-fast` | `bc-ad2d29e4-3542-5ae7-aa83-72f1d3290244` | 已合入 `cursor/yizhang-hub-r3-g2-probe-db8d`（3/3 seed pass；横幅 `yizhang-probe`） |

### Wave 2

| 席位 | 模型 | Agent ID | 状态 |
| --- | --- | --- | --- |
| F1 契约对齐 | `claude-fable-5-thinking-xhigh` | `bc-767c53b9-6eb1-528d-a057-ba8c2ed03105` | 已合入 `cursor/yizhang-hub-r3-f1-contract-db8d`（API_CONTRACT v4.2 + ADR-36） |
| O4 结算回走道 | `claude-opus-5-thinking-high-fast` | `bc-83aeb01c-d8e2-54ab-8ce6-94ff66eb00b5` | 已合入 `cursor/yizhang-hub-r3-o4-shell-db8d`（再来一局≠回安全区文案+淡场） |
| G1 锁表 | `gpt-5.6-sol-xhigh-fast` | `bc-6d9dd333-eb90-5729-aa76-67cb719e6260` | 已合入 `cursor/yizhang-hub-r3-g1-tests-db8d`（round3-hub-sota 8 条） |

### Wave 3

| 席位 | 模型 | Agent ID | 状态 |
| --- | --- | --- | --- |
| F3 GDD 同词 | `claude-fable-5-thinking-xhigh` | `bc-bc18f40e-23d7-5967-9a42-abfbf9c9a56b` | 已合入 `cursor/yizhang-hub-r3-f3-gdd-db8d`（只改 GDD.md） |
| O1 回程边角 | `claude-opus-5-thinking-high-fast` | `bc-d76b3f37-bde8-511d-b9f1-6c79fcc2d1f8` | 已合入 `cursor/yizhang-hub-r3-o1-sim-db8d`（enterHub 清 dash/锁/副槽） |
| O3 拒战边角 | `claude-opus-5-thinking-high-fast` | `bc-27d2e448-c4de-51bc-a077-3b3812a39914` | 已合入 `cursor/yizhang-hub-r3-o3-combat-db8d`（pending 顶闸；回程不再结算岛上招） |

### Wave 4

| 席位 | 模型 | Agent ID | 状态 |
| --- | --- | --- | --- |
| F4 签字 | `claude-fable-5-thinking-xhigh` | `bc-0111baf9-a3a4-5820-98e8-8095da9a8890` | 已合入 `cursor/yizhang-hub-r3-f4-sota-db8d`（PASS-WITH-WARNINGS；§11.9 / §12.10） |