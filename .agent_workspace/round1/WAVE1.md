# Round 1 派发台账

云端 `environment=cloud` 异步新 VM 上限为 3，因此 10 个指定模型子代理拆成：

- 3 × 云端新 VM（F3 / G1 / G2）
- 7 × 隔离 worktree（F1 / F2 / F4 / O1 / O2 / O3 / O4），模型 slug 未降级

| ID | 职能 | 指定 slug | Agent ID | 执行环境 |
| --- | --- | --- | --- | --- |
| F1 | 架构契约 | `claude-fable-5-thinking-xhigh` | `bc-0eb09f65-3399-5518-913d-e91bfae00a2d` | 隔离 worktree |
| F2 | 美术 UX | `claude-fable-5-thinking-xhigh` | `bc-3831a4a1-d4a2-5367-818f-3992c90b4373` | 隔离 worktree |
| F3 | 玩法数值 | `claude-fable-5-thinking-xhigh` | `bc-1a9ee529-c247-5a9e-a7d1-834748f50d5b` | 云端 VM |
| F4 | SOTA 验收 | `claude-fable-5-thinking-xhigh` | `bc-2fa60104-0d6d-5928-b7f7-efcad11b6724` | 隔离 worktree |
| O1 | 物理弹道 | `claude-opus-5-thinking-high-fast` | `bc-63fafdfa-8a57-5c5d-abc8-f0bcc6f5a950` | 隔离 worktree |
| O2 | 战斗技能 | `claude-opus-5-thinking-high-fast` | `bc-bf19dc9a-707d-5b7d-8e0d-505b0f465299` | 隔离 worktree |
| O3 | 英雄养成 | `claude-opus-5-thinking-high-fast` | `bc-de6699f1-d9c3-5a52-b765-ff406d24345f` | 隔离 worktree |
| O4 | UI 主循环 | `claude-opus-5-thinking-high-fast` | `bc-2d9ca79e-dcde-5144-9199-927a4f8c6bf2` | 隔离 worktree |
| G1 | 单测探针 | `gpt-5.6-sol-xhigh-fast` | `bc-7f6d3f6b-212c-5418-b8ce-e626e43a0d3b` | 云端 VM · 已完成并合入 `ac5d643` |
| G2 | 基准脚本 | `gpt-5.6-sol-xhigh-fast` | `bc-129187bb-2bed-5b72-9993-0d3c0ef70170` | 云端 VM |
