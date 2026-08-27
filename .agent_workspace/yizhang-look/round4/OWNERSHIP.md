# 异掌 Round 4 · 十席所有权（机位放手带与打磨）

父分支：**`cursor/yizhang-polish-db8d`**（从 `main` `18ed78e` 或更新快进；禁止 force）。  
逻辑名：`agent/yizhang-look` Round 4。子 PR / 合入打向父分支，不是 `main`。  
输出**首行**必须是：`MODEL_SLUG: <实际 slug>`。严禁静默降级。

游戏根：**只改** `games/yizhang/`。G1 例外：允许改 `.github/workflows/pages.yml` 加 `npm test`。  
编排只写 `.agent_workspace/yizhang-look/`（本表之外；编排工人已写本目录）。  
禁止复制第二份游戏目录（禁止 `cp -r games/yizhang …`）。

路径写死、互不重叠。共享只读：`package.json`、`vite.config.js`、`README.md`（除非本席表点名）。

## 复盘结论摘要

- **手感席**：无 P0。P1 触屏无切视角钮；P1 重获指针锁左键白挥；P2 invertY 开关缺席。
- **工程席**：P0 free 大幅视线增量 `holdBehindLimit` 单帧 11.2m；P0 CI 不跑测试；P0 `characters.js` `TELEPORT_DISTANCE=16` 未登记。

## 十席

| 席 | slug | 分支 | 可写（相对 `games/yizhang/`，另注例外） | 主攻 | 禁区 |
| --- | --- | --- | --- | --- | --- |
| F1 契约/tuning | `claude-fable-5-thinking-xhigh` | `cursor/yizhang-p1-f1-db8d` | `docs/API_CONTRACT.md`（§7.1）、`docs/ARCHITECTURE.md`、`docs/OWNERSHIP.md`、`src/data/tuning.js` + 其测试 | 登记 `TELEPORT_DISTANCE`（故意 ≠ `CAMERA_SNAP_TELEPORT=60`）、`LOCKED_YAW_SPAN` 等 R2 常量进 `CAMERA` 或分表；关系断言 R2 span > R3 `BEHIND_LIMIT`。不动数值。 | 不改编排产品数值；不改 `src/render/**` / `src/ui/**` |
| F2 UI | `claude-fable-5-thinking-xhigh` | `cursor/yizhang-p1-f2-db8d` | `src/ui/**` + hud css（`src/styles/**` 里 hud 相关） | 触控切视角钮 + 设置 invertY | 只 `src/ui/**` + hud css；不改 sim/render/input 逻辑文件（invertY 接线若需 input 读设置，在简报声明后由 O4 收口，本席只做 UI 面） |
| F3 GDD | `claude-fable-5-thinking-xhigh` | `cursor/yizhang-p1-f3-db8d` | `docs/GDD.md`（及相关玩法文档） | 文档：放手带、16≠60、触控钮/invertY、CI 测。对齐 F1 登记，不另造数字 | 不改 `src/**` |
| F4 终验 | `claude-fable-5-thinking-xhigh` | `cursor/yizhang-p1-f4-db8d` | `docs/SOTA_CHECKLIST.md`、`docs/ACCEPTANCE.md` | 等其它合入后签字 | 不改实现；不抢先合入 |
| O1 characters | `claude-opus-5-thinking-high-fast` | `cursor/yizhang-p1-o1-db8d` | `src/render/characters.js`（+ 该文件测试） | `TELEPORT_DISTANCE` 导出/注释，不改 16；可选 `createCamera` seed | **不要改 `tuning.js`（F1 的）**；不改 `camera.js` 闸 |
| O2 机位 P0 | `claude-opus-5-thinking-high-fast` | `cursor/yizhang-p1-o2-db8d` | `src/render/camera.js`、`src/render/renderer.js`（仅喂入/调用闸所需）+ 既有 look 测若必须跟闸 | `holdBehindLimit` 补 `lockedHoldSlack` **同源**放手带（或只限跟随角速率，二选一）。不改 `BEHIND_LIMIT`/`BEHIND_SHELL`。不删 R2 yaw 闸 | 不把两套 behind 闸合成一套；不改 `LOCKED_YAW_SPAN` 数值；不改 `TELEPORT_DISTANCE` |
| O3 combat | `claude-opus-5-thinking-high-fast` | `cursor/yizhang-p1-o3-db8d` | `src/combat/**`、`src/ai/**`、`src/core/juice.js`（只读守门，不改 `HIT_STOP.max`） | 冻结 hit-stop；横扇不回退 | `HIT_STOP.max` 不动；不改机位/输入 |
| O4 输入 | `claude-opus-5-thinking-high-fast` | `cursor/yizhang-p1-o4-db8d` | `src/input/**`、`src/core/**`（look 喂入/指针锁）、`src/main.js`（仅接线） | 未持锁且 `pointerLockWanted` 时吞 slap；touch `preventDefault` 在 enabled 闸之前 | 不改 `src/ui/**`（F2 的）；不改 camera 闸 |
| G1 测试+CI | `gpt-5.6-sol-xhigh-fast` | `cursor/yizhang-p1-g1-db8d` | `tests/**`、`games/yizhang` 内 `*.test.js`（本轮新锁测）、**例外** `.github/workflows/pages.yml` | pages.yml 加 `npm test`；free 大转角单帧位移锁测（钉 11.2m P0） | 不改产品实现去「消红」；实现归 O2。sourcemap 策略归 G2 |
| G2 probe+map | `gpt-5.6-sol-xhigh-fast` | `cursor/yizhang-p1-g2-db8d` | `scripts/**`、构建配置中 sourcemap 相关（`vite.config.js` 仅若必须关生产 map） | probe 转角 > `BEHIND_LIMIT`；sourcemap 不上线 | 不改 `pages.yml`（G1 的）；不改闸数值 |

## 红线（全席）

- `RENDER_YAW_OFFSET = 0`。禁止回 `Math.PI`。禁止第四套朝向。hub/arena 共用 yaw=0 → -Z。
- `HIT_STOP.max` 不动。
- `BEHIND_LIMIT = π/2.4`（75°）与 `TELEPORT_DISTANCE = 16` **数值**不动。16 故意 ≠ 契约 `CAMERA_SNAP_TELEPORT=60`——F1 登记关系，O1 导出，谁都不许改成 60。
- 两套 behind 闸并存：R2 `holdBehind` / `LOCKED_YAW_SPAN`（locked `behindYaw`）与 R3 `holdBehindLimit` / `BEHIND_LIMIT`（跟随角）。O2 只给后者补放手带，不删前者、不合成一套。
- 缺省 hub；`lookMode` 缺省 locked；free 静止 yaw `null`；W+S 对冲 `null`；`QUALITY.low.bloom === false`；再来一局 ≠ 回安全区。
- 公共 API 变更先改 `API_CONTRACT.md`（F1）。
- 子代理 **不要** `gh pr merge` / 不要打向 `main`。推自己的 `cursor/yizhang-p1-*-db8d` 即可。
- 不要动已 merged 的 PR #23 正文。
