# Round 4 终验简报（F4 · 打磨轮 LOOK-R4）

MODEL_SLUG: claude-fable-5-thinking-xhigh

- 被验：`cursor/yizhang-polish-db8d` @ `bbe51de`（八席合入后）；工作分支 `cursor/yizhang-p1-f4-db8d`（只动 `docs/SOTA_CHECKLIST.md` + `docs/ACCEPTANCE.md` + 本简报，零 src）。
- 结论：**PASS-WITH-WARNINGS**。判定表 SOTA §12.8，命令原文 ACCEPTANCE §13.9。

## 三件套（全套实跑）

- `npm test`：**842/842（57 文件）**，退出码 0（基线 775/54 → +67 测 +3 文件，零减量）。
- `npm run probe`：**3/3 seed PASS**（`0x1a2b3c4d`/`0x5eed1234`/`0xc0ffee42`）。本轮判决读数：`noSnapFrameMaxDisplacement 0.450m`（P0 修前 11.2m，硬门 ≤1m）、`lookTurnMinAngleDeg 89.38°`（真实压过 `BEHIND_LIMIT` 75°）。R3 读数全数复跑无回退（snap 7.1 / locked dot 1.0 ×3601 帧 / free 双段 / hubJourney 51/227）。
- `npm run build`：退出码 0；gzip 188.71kB；**dist 零 `.map`**。

## 复盘销号 6/6

| 项 | 席 | 状态 |
| --- | --- | --- |
| P0 free 单帧 11.2m 横旋 | O2 | 关（`behindReleaseSlack` 与 R2 同源；锁测把 11.2m 写进回归线） |
| P0 CI 不跑测试 | G1 | 关（`pages.yml` 构建前 `npm test`） |
| P0 `TELEPORT_DISTANCE=16` 未登记 | F1+O1 | 关（导出 + `CHARACTERS.teleportDistance` + 16≠60 + `lockedYawSpan > behindLimit` 锁测） |
| P1 触屏无切视角钮 | F2 | 关（`.yz-tbtn--look`「视」，同 toggle/回执/落盘链路） |
| P1 重获指针锁左键白挥 | O4 | 关（吞判据与申请锁条件逐字一致；edge 不补 hold 不置位） |
| P2 invertY 开关缺席 | F2+O4 | 关（设置板开关 + 存档落盘 + 刷新仍在锁测） |

另：O3 hit-stop 冻结锁测化（`HIT_STOP` 全表原数、max 0.12 不动；`hit-feel-budget.test.js` 钉「时间封顶、分量走 VFX/相机冲击」）。

## 冻结面（零回退）

yaw 偏移 0 / 缺省 hub / locked 缺省 / free 静止 null / W+S 对冲 null / low bloom false / `HIT_STOP.max` 原数 / `BEHIND_LIMIT`+`TELEPORT_DISTANCE` 原数 / 两套 behind 闸并存未合成 / 换算唯一 / 零外链 / 隔离仅 +`pages.yml`（G1 点名例外）。

## 残留 WARNING

1. **F3 GDD 在飞**（`cursor/yizhang-p1-f3-db8d`）：`git merge-tree --write-tree` 实测与 polish 零冲突；合入后 GDD §15.2（F1 `425b756` 顺手登记）与 F3 §15.6 内容重叠、§2 模块表 `CHARACTERS` 一格两版，建议合并工人顺一遍去重。不挡签字。
2. 真机触屏 DEFER（「视」钮 / invertY 拖动 / `preventDefault` 实机手势）。
3. §13.4 桌面八步实机手测未做（无交互桌面；本轮零视觉改动，以 842 测 + 3 seed probe 替代，不假装）。
4. W2 hit-stop 零余量哨兵结转（已锁测化）。
