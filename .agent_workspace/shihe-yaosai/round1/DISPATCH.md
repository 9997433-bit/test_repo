# Round 1 派发记录

云端新 VM 并发上限为 3：3 云端 + 7 本机。模型 slug 未降级。

| 角色 | 模型 slug | 环境 | Agent ID | 产出 |
| --- | --- | --- | --- | --- |
| Fable-1 架构 | claude-fable-5-thinking-xhigh | local | bc-69e228d1-a6de-52cd-ba93-ca32589d0ad6 | ARCHITECTURE, API_CONTRACT |
| Fable-2 美术 | claude-fable-5-thinking-xhigh | local | bc-672faa21-73ca-5bb5-8958-71e492d2d042 | ART_DIRECTION, styles |
| Fable-3 数值 | claude-fable-5-thinking-xhigh | cloud | bc-b6759f0b-be34-592b-b79f-f48fbef1ac40 | 分支 `cursor/shihe-r1-f3-data-gdd-ac40` |
| Fable-4 验收 | claude-fable-5-thinking-xhigh | local | bc-ca27c1a8-6931-5de7-8e1d-8f9a4e23a1ea | SOTA, ACCEPTANCE |
| Opus-1 引擎 | claude-opus-5-thinking-high-fast | local | bc-f595c666-a8f7-5929-a759-c8b2a551b8ee | engine, main.js |
| Opus-2 世界 | claude-opus-5-thinking-high-fast | cloud | bc-f1be5320-b2fb-5c4c-b7a8-bb53a95f620d | 分支 `cursor/shihe-yaosai-world-620d` |
| Opus-3 模拟 | claude-opus-5-thinking-high-fast | cloud | bc-b3caac42-c415-5806-8bfd-b070966608ba | 分支 `cursor/shihe-yaosai-o3-sim-combat-08ba` |
| Opus-4 UI | claude-opus-5-thinking-high-fast | local | bc-4ac05668-5fb1-5303-8c88-c3f88d354cbe | ui, input, index.html |
| GPT-sol-1 单测 | gpt-5.6-sol-xhigh-fast | local | bc-633a5c78-9df9-5379-bc1d-889a09d52d55 | tests/scaffold.test.js |
| GPT-sol-2 探针 | gpt-5.6-sol-xhigh-fast | local | bc-399a0cde-247a-5b75-b585-6ab744ac307a | probe.mjs, bench.mjs |

父分支：`cursor/shihe-yaosai-f69e`（逻辑名 `agent/shihe-yaosai`）  
父 PR：https://github.com/9997433-bit/test_repo/pull/50  
结论：`round1/CONCLUSION.md`
