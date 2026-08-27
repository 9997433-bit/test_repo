# Round 1 派发 · 异掌手感

基座：`cursor/yizhang-feel-db8d`
必读：`GOAL.md`、`OWNERSHIP.md`、本文件。
子 PR base：**`cursor/yizhang-feel-db8d`**。
首行：`MODEL_SLUG: ...`

## 并发 10 席

| id | 模型 | 主攻 |
| --- | --- | --- |
| F1 | fable `claude-fable-5-thinking-xhigh` | 朝向/皮肤/VFX 契约 |
| F2 | fable | 皮肤选择器与特效视觉规范 |
| F3 | fable | SKINS + 每掌 vfx 数据 |
| F4 | fable | 验收清单 |
| O1 | opus-fast `claude-opus-5-thinking-high-fast` | sim 导出 skinId/ghosts |
| O2 | opus-fast | 渲染：朝向、皮肤、每掌 VFX |
| O3 | opus-fast | combat/ai 事件与残影 |
| O4 | opus-fast | 输入反转修复 + 大厅皮肤 + juice |
| G1 | gpt-sol `gpt-5.6-sol-xhigh-fast` | 输入/皮肤单测 |
| G2 | gpt-sol | 探针不回归 |

## 云端并发上限

环境限制同时最多 3 个新 VM 云端子代理。Round 1 按波次派发，10 席全部保留，不降级、不砍角色。

### Wave 1（已派发）

| 席位 | 模型 | Agent ID |
| --- | --- | --- |
| F1 架构契约 | `claude-fable-5-thinking-xhigh` | `bc-c827eb82-65d7-5b3f-b691-e8d2b5080e9a` | 已合入 `cursor/yzfeel-r1-fable1-arch-db8d` |
| F4 SOTA 验收 | `claude-fable-5-thinking-xhigh` | `bc-32ec5ea8-b3f4-5db3-9906-719afa069e88` | 已合入 `cursor/yizhang-feel-r1-f4-acceptance-db8d` |
| G2 探针 | `gpt-5.6-sol-xhigh-fast` | `bc-7d89c6b4-b280-59cb-8565-25053082b764` | 已合入 `cursor/yizhang-feel-probe-db8d` |

### Wave 2（补派）

| 席位 | 模型 | Agent ID |
| --- | --- | --- |
| O4 输入反转 | `claude-opus-5-thinking-high-fast` | `bc-8fbde8a9-2229-5a6e-8f10-8da2eb3dae9c` | 已合入 `cursor/yizhang-feel-shell-r1-db8d` |

### 待派发

F2、F3、O1、O2、O3、G1
