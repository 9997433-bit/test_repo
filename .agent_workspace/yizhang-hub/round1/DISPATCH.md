# Round 1 派发 · 异掌安全区大厅

基座：`cursor/yizhang-hub-db8d`
必读：`GOAL.md`、`OWNERSHIP.md`、本文件。
子 PR base：**`cursor/yizhang-hub-db8d`**。
首行：`MODEL_SLUG: ...`

## 并发 10 席

| id | 模型 | 主攻 |
| --- | --- | --- |
| F1 | fable `claude-fable-5-thinking-xhigh` | 双区状态机与选掌/传送契约 |
| F2 | fable | 台座/走道/门/说明牌视觉 |
| F3 | fable | HUB 布局与 8 座坐标数据 |
| F4 | fable | 大厅流程验收清单 |
| O1 | opus-fast `claude-opus-5-thinking-high-fast` | sim phase hub/arena |
| O2 | opus-fast | 渲染安全区、展掌、idle VFX、传送门 |
| O3 | opus-fast | hub 阶段 Bot 休眠 |
| O4 | opus-fast | 开局进 hub、交互、过渡 |
| G1 | gpt-sol `gpt-5.6-sol-xhigh-fast` | 靠近/选掌/传送单测 |
| G2 | gpt-sol | hub→门→岛 探针 |

## 波次

因同时最多 3 个新 VM，与仍在跑的手感轮子代理抢槽。

### Wave 1

| 席位 | 模型 | Agent ID |
| --- | --- | --- |
| F1 双区契约 | `claude-fable-5-thinking-xhigh` | `bc-0c7cf4a9-c177-5160-b2dc-8f6eafd52f7b` | 已合入（ADR-29…32，避开手感轮 25…28） |
| O1 hub 模拟 | `claude-opus-5-thinking-high-fast` | `bc-aaa7b471-0831-5c1b-996b-fb7368bea8f9` | 已合入 `cursor/yizhang-sim-hub-phase-db8d` |
| O2 渲染大厅 | `claude-opus-5-thinking-high-fast` | `bc-616666ea-d922-5c09-abfd-aa6e3fdd5417` | 运行中 |
| O4 开局进 hub | `claude-opus-5-thinking-high-fast` | `bc-87e682d7-eb47-54e2-b6fe-990d4a6066f4` | 已合入 `cursor/yizhang-hub-shell-db8d` |
| G2 大厅探针 | `gpt-5.6-sol-xhigh-fast` | `bc-1e655c78-d0bd-55f3-93f3-8527d5dc0947` | 运行中 |
| F3 大厅布局 | `claude-fable-5-thinking-xhigh` | `bc-4404da32-f3a3-594a-9b41-0f08d6da3b0f` | 已合入 `cursor/yizhang-hub-data-db8d` |
| O3 Bot 休眠 | `claude-opus-5-thinking-high-fast` | `bc-db1b4a02-cc18-5227-875d-1cbb7ef07674` | 已合入 `cursor/yizhang-ai-hub-guard-db8d` |
| G1 大厅单测 | `gpt-5.6-sol-xhigh-fast` | `bc-575d6d55-cbfd-5f9d-8ddc-7d5179d691c9` | 运行中 |

### 待派发

F2、F4、G1
