# Round 1 派发记录

云端新 VM 并发上限为 3，因此 3 个关键实现走云端隔离分支，其余 7 个在本工作区按文件所有权并发（写路径不重叠）。

| 角色 | 模型 slug | 环境 | Agent ID | 可写路径 |
| --- | --- | --- | --- | --- |
| Fable-1 架构 | claude-fable-5-thinking-xhigh | local | bc-2e6fe8ea-88e1-5d63-ae39-2672c408e1dd | docs/ARCHITECTURE.md, API_CONTRACT.md |
| Fable-2 美术 | claude-fable-5-thinking-xhigh | local | bc-d422b0dc-79ca-5ba2-ab7d-ba494f6fe4e3 | docs/ART_DIRECTION.md, src/styles/** |
| Fable-3 数值 | claude-fable-5-thinking-xhigh | cloud | bc-9372c5b1-c9f7-5fbf-8b5d-89f6759b6694 | docs/GDD.md, src/data/** |
| Fable-4 验收 | claude-fable-5-thinking-xhigh | local | bc-007100f5-82ae-5d66-980e-e5aa17ad69b3 | docs/SOTA_CHECKLIST.md, ACCEPTANCE.md |
| Opus-1 引擎 | claude-opus-5-thinking-high-fast | local | bc-f9f54f53-395b-54c0-9fc3-c5546e034b04 | src/core/**, src/main.js |
| Opus-2 棋盘 | claude-opus-5-thinking-high-fast | local | bc-41cb0d3f-a00e-5d4a-ac89-a32e8be21061 | src/board/** |
| Opus-3 战斗 | claude-opus-5-thinking-high-fast | cloud | bc-c9e66ae7-a5c7-56d9-b921-73ec80a9902d | src/combat/** |
| Opus-4 UI/AI | claude-opus-5-thinking-high-fast | local | bc-1a6a6922-0259-58c8-8757-b4edd90885fa | src/ui/**, src/ai/**, index.html |
| GPT-sol-1 单测 | gpt-5.6-sol-xhigh-fast | local | bc-6e60431d-f0ef-53f4-b689-b2347b771b6b | tests/** |
| GPT-sol-2 基准 | gpt-5.6-sol-xhigh-fast | cloud | bc-87c8c493-a02a-57cf-8401-69ad464e0c89 | scripts/** |

父 PR：https://github.com/9997433-bit/test_repo/pull/6
父分支：`cursor/zhao-yun-adou-673d`
