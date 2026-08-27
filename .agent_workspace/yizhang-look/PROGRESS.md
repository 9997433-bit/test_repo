# yizhang-look 进度

- 父分支：`cursor/yizhang-look-db8d`（base `main@7340300`）
- 循环：Round 1 → 2 → 3；每轮 10 席（4 fable / 4 opus-fast / 2 gpt-sol）
- 云端同时最多 **3** 个新 VM → 每轮分波：W1(3) → W2(3) → W3(3) → W4(1)

## Round 1

**十席均已合入父分支。** F4 签 PASS-WITH-WARNINGS。简报：`round1/BRIEF.md`。

## Round 2

| 波 | 席位 | 状态 |
| --- | --- | --- |
| W1 | F1 契约 / O4 free 分派 / G1 单测 | 派发中 |
| W2–W4 | F2 F3 F4 / O1 O2 O3 / G2 | 排队 |

## 基线（开工 @ 7340300）

- 目标：修视角空间错误 + `lookMode=locked` 固定人物面向 + 过门机位吸附
- 测试：`games/yizhang` vitest 557 / 40 files；probe 三 seed PASS
