# Round 4 派发（机位放手带与打磨）

逻辑名：`agent/yizhang-look` Round 4。  
父分支：**`cursor/yizhang-polish-db8d`**（从 `origin/main` @ `18ed78e` 拉出，打向 `main`）。  
编排真源：本目录。所有权：`OWNERSHIP.md`。  
输出**首行**必须是：`MODEL_SLUG: <实际 slug>`。严禁静默降级。

子 PR **打向本父分支**，不要打 `main`。子代理不要 `gh pr merge`。禁止 force。  
游戏只改 `games/yizhang/`。G1 例外：允许改 `.github/workflows/pages.yml` 加 `npm test`。  
禁止复制第二份游戏目录。

前置：`.agent_workspace/yizhang-look/GOAL.md` + Round 1–3 简报。契约面改动先过 F1（`docs/API_CONTRACT.md` §7.1）。

## 复盘结论摘要

手感席：无 P0。P1 触屏无切视角钮；P1 重获指针锁左键白挥；P2 invertY 开关缺席。  
工程席：P0 free 大幅视线增量 `holdBehindLimit` 单帧 11.2m；P0 CI 不跑测试；P0 `characters.js` `TELEPORT_DISTANCE=16` 未登记。

## 冻结（全席，不得回退）

- `RENDER_YAW_OFFSET = 0`；yaw=0 → -Z；禁止第四套朝向。
- 缺省 `phase:'hub'`；`lookMode` 缺省 `locked`。
- free 静止 yaw `null`；W+S 对冲 `null`。
- `QUALITY.low.bloom === false`。
- 再来一局 ≠ 回安全区。
- `HIT_STOP.max` 不动。
- `BEHIND_LIMIT`（75°，`π/2.4`）与 `TELEPORT_DISTANCE=16` **数值**不动。
- 不要把两套 behind 闸合成一套（R2 `LOCKED_YAW_SPAN` / `holdBehind` 与 R3 `BEHIND_LIMIT` / `holdBehindLimit` 并存；O2 只补放手带）。

## Wave 1（本批 3 · P0）

| 席 | slug | 分支 | 主攻 |
| --- | --- | --- | --- |
| F1 | `claude-fable-5-thinking-xhigh` | `cursor/yizhang-p1-f1-db8d` | 契约/tuning：登记 `TELEPORT_DISTANCE`（故意 ≠ 60）、`LOCKED_YAW_SPAN` 等 R2 常量进 `CAMERA` 或分表；关系断言 R2 span > R3 `BEHIND_LIMIT`。docs §7.1。不动数值。 |
| O2 | `claude-opus-5-thinking-high-fast` | `cursor/yizhang-p1-o2-db8d` | 机位 P0：`holdBehindLimit` 补 `lockedHoldSlack` 同源放手带（或只限跟随角速率，二选一）。不改 `BEHIND_LIMIT`/`SHELL`。不删 R2 yaw 闸。 |
| G1 | `gpt-5.6-sol-xhigh-fast` | `cursor/yizhang-p1-g1-db8d` | `pages.yml` 加 `npm test`；free 大转角单帧位移锁测。 |

## 后续波

| 波 | 席 | 分支 | 主攻 |
| --- | --- | --- | --- |
| W2 | F2 | `cursor/yizhang-p1-f2-db8d` | 触控切视角钮 + 设置 invertY。只 `src/ui/**` + hud css。 |
| W2 | O1 | `cursor/yizhang-p1-o1-db8d` | `TELEPORT_DISTANCE` 导出/注释，不改 16；可选 `createCamera` seed。不要改 `tuning.js`（F1 的）。 |
| W2 | O4 | `cursor/yizhang-p1-o4-db8d` | 未持锁且 `pointerLockWanted` 时吞 slap；touch `preventDefault` 在 enabled 闸之前。 |
| W3 | F3 | `cursor/yizhang-p1-f3-db8d` | GDD 文档对齐本轮登记与放手带。 |
| W3 | O3 | `cursor/yizhang-p1-o3-db8d` | 冻结 hit-stop；横扇不回退。 |
| W3 | G2 | `cursor/yizhang-p1-g2-db8d` | probe 转角 > `BEHIND_LIMIT`；sourcemap 不上线。 |
| W4 | F4 | `cursor/yizhang-p1-f4-db8d` | 终验：等其它合入后签字。 |

写路径、禁区、互踩表见同目录 `OWNERSHIP.md`。
