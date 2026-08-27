# 异掌安全区大厅 — 编排进度

- **任务名**: yizhang-hub
- **逻辑分支**: `agent/yizhang-hub`
- **工作分支**: `cursor/yizhang-hub-db8d`（从 `cursor/yizhang-feel-db8d` 拉出，保留手感轮已合入的探针）
- **游戏目录**: `games/yizhang/`（已隔离，不新建第二份目录，端口 4181）
- **编排角色**: Parent Orchestrator
- **循环**: Round 1 → 2 → 3，每轮 10 云端子代理（4 fable / 4 opus-fast / 2 gpt-sol）
- **模型**: fable=`claude-fable-5-thinking-xhigh` · opus-fast=`claude-opus-5-thinking-high-fast` · gpt-sol=`gpt-5.6-sol-xhigh-fast`

## 目标

开局安全区 + 双侧走道展掌（台座、手指朝上、每掌 idle 特效）+ 靠近选择说明 + 传送门进裂岛。详见 `GOAL.md`。

## Round 状态

| Round | 状态 | 简报 |
|-------|------|------|
| 1 初始构建与基线探索 | 进行中 | G2 探针已合入；待 F4；O2/G1/F2 在跑 |
| 2 靶向重构与深度优化 | 未开始 | |
| 3 SOTA 打磨与最终验收 | 未开始 | |
