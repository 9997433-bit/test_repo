# yizhang-look 进度

- 父分支：`cursor/yizhang-look-db8d`（base `main@7340300`）
- 循环：Round 1 → 2 → 3；每轮 10 席（4 fable / 4 opus-fast / 2 gpt-sol）
- 云端同时最多 **3** 个新 VM → 每轮分波：W1(3) → W2(3) → W3(3) → W4(1)

## Round 1

| 波 | 席位 | 状态 |
| --- | --- | --- |
| W1 | F1 架构 / O2 渲染 / O4 壳层 | 派发中 |
| W2 | F2 美术 / O1 模拟 / G1 单测 | 排队 |
| W3 | F3 数据 / O3 技能Bot / G2 探针 | 排队 |
| W4 | F4 SOTA 验收 | 排队 |

## 基线（开工 @ 7340300）

- 目标：修视角空间错误 + `lookMode=locked` 固定人物面向 + 过门机位吸附
- 测试：`games/yizhang` vitest 557 / 40 files；probe 三 seed PASS
