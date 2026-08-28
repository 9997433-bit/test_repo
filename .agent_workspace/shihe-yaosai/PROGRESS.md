# 蚀核要塞 — 编排进度

- **任务名**: shihe-yaosai（逻辑分支 `agent/shihe-yaosai`）
- **工作分支**: `cursor/shihe-yaosai-f69e`
- **游戏目录**: `/workspace/games/shihe-yaosai/`（独立，不复制、不引用其它游戏）
- **编排角色**: Parent Orchestrator
- **循环**: Round 1 → 2 → 3，每轮 10 并发子代理（4 fable / 4 opus-fast / 2 gpt-sol）
- **引擎**: Babylon.js 8，WebGPU 优先 / WebGL2 回退，端口 4182

## 目标

SOTA 级可玩 3D 环轨塔防《蚀核要塞》：三层轨道、五塔、过载、棱镜折光、20 波 + Boss。画面按实时 WebGPU 验收，不按概念海报 1:1。

## Round 状态

| Round | 状态 | 简报 |
|-------|------|------|
| 1 初始构建与基线探索 | 完成 | `round1/CONCLUSION.md`：30/32 测，probe 5 波 8 漏 |
| 2 靶向重构与深度优化 | 完成 | `round2/CONCLUSION.md`：84/84 测；probe 仍 17 漏 |
| 3 SOTA 打磨与最终验收 | 进行中 | `round3/BRIEF.md` |

## 云端并发

云端新 VM 并发上限为 3：每轮 3 个关键实现走 `environment=cloud`，其余 7 个本工作区按文件所有权并发。模型 slug 不降级。
