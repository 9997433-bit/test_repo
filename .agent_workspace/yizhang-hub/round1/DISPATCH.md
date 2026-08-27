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

因同时最多 3 个新 VM，与仍在跑的手感轮子代理抢槽。本文件记录实际派发的 Agent ID。
