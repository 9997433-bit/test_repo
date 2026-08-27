# yizhang-look 进度

- 父分支：`cursor/yizhang-look-db8d`（base `main@7340300`）
- 循环：Round 1 → 2 → 3；每轮 10 席（4 fable / 4 opus-fast / 2 gpt-sol）
- 云端同时最多 **3** 个新 VM → 每轮分波：W1(3) → W2(3) → W3(3) → W4(1)

## Round 1

**十席均已合入父分支。** F4 签 PASS-WITH-WARNINGS。简报：`round1/BRIEF.md`。

## Round 2

**十席除 O2 机位复核外均已合入。** F4 签 PASS-WITH-WARNINGS（LK-04 PASS；O2 DEFER）。简报：`round2/BRIEF.md`。

## Round 3

**收口完成。** 十席均已合入父分支（含 R2 O2 硬顶补交、R3 O2 咬合闸、R3 O4 切 V 边角、F4 签字文档）。F4 签 PASS-WITH-WARNINGS；过期「O2/O4 仍在飞」WARNING 已销。简报：`round3/BRIEF.md`。父 PR #23 仍 draft。

残留 WARNING：真机触屏未做；W2 hit-stop 零余量哨兵。

## 基线（开工 @ 7340300）

- 目标：修视角空间错误 + `lookMode=locked` 固定人物面向 + 过门机位吸附
- 测试：`games/yizhang` vitest 557 / 40 files；probe 三 seed PASS
