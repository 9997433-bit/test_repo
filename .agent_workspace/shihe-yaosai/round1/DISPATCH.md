# Round 1 派发记录

云端新 VM 并发上限为 3，因此 3 个关键实现走云端隔离分支，其余 7 个在本工作区按文件所有权并发（写路径不重叠）。模型 slug 不降级。

| 角色 | 模型 slug | 环境 | Agent ID | 可写路径 |
| --- | --- | --- | --- | --- |
| Fable-1 架构 | claude-fable-5-thinking-xhigh | local | TBD | docs/ARCHITECTURE.md, API_CONTRACT.md |
| Fable-2 美术 | claude-fable-5-thinking-xhigh | local | TBD | docs/ART_DIRECTION.md, src/styles/** |
| Fable-3 数值 | claude-fable-5-thinking-xhigh | cloud | TBD | docs/GDD.md, src/data/** |
| Fable-4 验收 | claude-fable-5-thinking-xhigh | local | TBD | docs/SOTA_CHECKLIST.md, ACCEPTANCE.md |
| Opus-1 引擎 | claude-opus-5-thinking-high-fast | local | TBD | src/engine/**, src/main.js |
| Opus-2 世界 | claude-opus-5-thinking-high-fast | cloud | TBD | src/world/** |
| Opus-3 模拟战斗 | claude-opus-5-thinking-high-fast | cloud | TBD | src/sim/**, src/combat/** |
| Opus-4 UI | claude-opus-5-thinking-high-fast | local | TBD | src/ui/**, src/input/**, index.html |
| GPT-sol-1 单测 | gpt-5.6-sol-xhigh-fast | local | TBD | tests/** |
| GPT-sol-2 探针 | gpt-5.6-sol-xhigh-fast | local | TBD | scripts/** |

父分支：`cursor/shihe-yaosai-f69e`（逻辑名 `agent/shihe-yaosai`）
