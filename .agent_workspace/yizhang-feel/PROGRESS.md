# 异掌手感轮 — 编排进度

- **任务名**: yizhang-feel
- **逻辑分支**: `agent/yizhang-feel`
- **工作分支**: `cursor/yizhang-feel-db8d`（从 `origin/main` @ `7ba11f1` 重建；旧 R1 父分支已合入 PR #21）
- **游戏目录**: `games/yizhang/`（已隔离，不新建第二份目录，端口 4181）
- **编排角色**: Parent Orchestrator
- **编排真源**: `.agent_workspace/yizhang-look/round5/`（feel 镜像：`OWNERSHIP.md` + `round2/DISPATCH.md`）
- **模型**: fable=`claude-fable-5-thinking-xhigh` · opus-fast=`claude-opus-5-thinking-high-fast` · gpt-sol=`gpt-5.6-sol-xhigh-fast`
- **云端同时最多**: 3 个新 VM

## 目标

内容轮：打击感读数、故事 5 拍、4 只 career 里程碑掌；P0 修复 `invulnT` 永不递减。详见 `GOAL.md` 本轮节与 look/round5。

## Round 状态

| Round | 状态 | 简报 |
|-------|------|------|
| 1 键鼠/皮肤/VFX | 已合入 main（PR #21） | `round1/DISPATCH.md` |
| 2 内容轮（打击感/故事/里程碑掌） | 派发已写，待十席 | look `round5/DISPATCH.md` |
