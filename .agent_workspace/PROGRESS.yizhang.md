# 异掌 — 编排进度

- **任务名**: yizhang
- **逻辑分支**: `agent/yizhang`
- **工作分支**: `cursor/yizhang-db8d`
- **游戏目录**: `/workspace/games/yizhang/`（与仓库内其他游戏隔离，端口 4181）
- **编排角色**: Parent Orchestrator
- **循环**: Round 1 → 2 → 3，每轮 10 并发子代理（4 fable / 4 opus-fast / 2 gpt-sol）
- **模型**: fable=`claude-fable-5-thinking-xhigh` · opus-fast=`claude-opus-5-thinking-high-fast` · gpt-sol=`gpt-5.6-sol-xhigh-fast`
- **视觉**: `games/yizhang/docs/VISUAL_HANDBOOK.md` 底座 B，强制
- **输入**: 键鼠 + 平板/手机触控一等公民

## 目标

策划已对齐（见 `.agent_workspace/yizhang/DESIGN_SEED.md`），本循环落地 SOTA 级可玩 WebGL 竖切并打磨。

## Round 状态

| Round | 状态 | 简报 |
|-------|------|------|
| 1 初始构建与基线探索 | 进行中 | 待 10 云端子代理回收 |
| 2 靶向重构与深度优化 | 未开始 | |
| 3 SOTA 打磨与最终验收 | 未开始 | |

## 测试

```bash
cd games/yizhang
npm install
npm test
npm run probe
npm run bench
npm run dev   # :4181
```
