# 《Round 2 结论简报》· 异掌安全区大厅

主调度器整理。10/10 云端子代理已回收，产出合入 `cursor/yizhang-hub-db8d`。
父 PR：https://github.com/9997433-bit/test_repo/pull/22

对照 Round 1 遗留：探针 hub 全链、皮肤真表+剪影、每掌战斗 VFX、残影、相机 pitch、空挥空间闸、契约收口、再来一局≠回安全区，均已落地。F4 判定 **PASS-WITH-WARNINGS**。

## 实测基线（Round 2 收口后本机）

- `npm test`：**500 passed / 37 files**，退出码 0
- `npm run probe`：**PASS**，3600 步，hub→arena，`arenaKills:1`，`wiredCombat:true`，`hubJourney.equippedAtStep=51` / `enteredArenaAtStep=227`，`p99StepMs≈0.11`
- `npm run build`：退出码 0（主 chunk gzip ~183kB）
- 冒烟：`http://localhost:4181/src/render/smoke.html?phase=hub&unlock=all&tour=1`

## 用户目标对照

| 用户目标 | Round 2 落地 |
| --- | --- |
| 开局安全区 | 缺省 `phase:'hub'` 保持；再来一局 `skipHub:true` 回裂岛；回安全区不预填掌 |
| 走道 8 掌 + 台 + 指朝上 + idle | Round 1 已有；HV-01…05 F4 截图复验绿 |
| 靠近选择说明 | 保持；hub 换掌 = 主副交换、无锁 |
| 传送门进格斗 | probe 全链绿（HG-02 关） |
| 皮肤（手感遗留） | F3 真表六套 `drifter/mason/crane/reed/nuo/wildhorn`；O2 剪影；父调度 `skinAppearance` 握手 |
| 每掌战斗 VFX | 8 键 8 形（`cotton→fanwake` … `meteor→cinder`）；事件 `gloveId` 透传到 hit |
| 打击/僵直 | FJ-01 上界锁仍绿；空挥改为 `playerInHub` 空间闸（拦 slap/skill/dash） |
| 抬头低头 | `setLook`/`setPitch`/`getLook`；O4 `feedLook` 每帧喂 |

## 十席合入

| 席 | 分支 / agent | 落地 |
| --- | --- | --- |
| G2 | `cursor/yizhang-hub-r2-g2-probe-db8d` | probe 显式 `phase:'hub'`；harness 缺省仍 arena |
| O1 | `cursor/yizhang-hub-r2-o1-sim-db8d` | 空挥空间闸；`skinId`；`combat.ghosts`；hub 换掌 |
| F3 | `cursor/yizhang-hub-r2-f3-skins-db8d` | `src/data/skins.js` + `vfx.js` 八掌 burst/trail/residue |
| F1 | `cursor/yizhang-hub-r2-f1-contract-db8d` | API_CONTRACT v4.1；ADR-33…35（空挥按空间闸补记） |
| O4 | `cursor/yizhang-hub-r2-o4-shell-db8d` | `feedLook`；ENTRY 再来一局≠回安全区；`ui/hub.css` 结构兜底 |
| G1 | `cursor/yizhang-hub-r2-g1-tests-db8d` | `tests/round2-hub-contract.test.js` ×5 |
| O3 | `cursor/yizhang-hub-r2-o3-combat-db8d` | 事件 `gloveId`/`skillId`；`blinkSwap` 残影；父调度补桥透传 |
| F2 | `cursor/yizhang-hub-r2-f2-art-db8d` | ART_DIRECTION §15/§16；选皮肤条 CSS |
| O2 | `cursor/yizhang-hub-r2-o2-render-db8d` | 剪影/战斗 VFX/残影/`setLook`；父调度真表握手 |
| F4 | `cursor/yizhang-hub-r2-f4-sota-db8d` | §11 勾 24 项；§11.8 / §12.9；PASS-WITH-WARNINGS |

## 父调度补丁（子席合入后握手）

1. `src/sim/combat-bridge.js` / `step.js`：hit 透传 `gloveId`（否则 O2 在 `hit` 上看不到掌）。
2. `src/render/skins.js`：`fromTableEntry` 走 `skinAppearance()`，认 F3 枚举形；`createRenderer({data,skins})` 由 `main.js` / `smoke.js` 喂真表。

## 洞 1–10（F4 销号）

1–6、10 **关**。7 **已测记警告**（p99 绿，draw/tris 超 L3-10）。8 **延后真机**。9 **记现状**（皮肤=菜单选择器，走道=选掌主路径）。

## Round 3 必须收（按杀伤）

1. **W1 渲染预算（P0，O2）** — mid 档 hub draw 305 / tris 138k、arena draw 352 / tris 95k，对 L3-10（mid ≤120 draw / ≤80k tris）。优先：hub 阶段关掉裂岛子树（arena 已关 hub）；8 座 idle 实例化/降档；禁止砍掉 8 种可辨 VFX 与皮肤剪影。
2. **W3 探针横幅（G2）** — `scripts/probe.mjs` 硬编码 `MODEL_SLUG: gpt-5.6-sol-xhigh-fast`，F4 会误读成席位模型。
3. **W4 T-07 三 seed（G2）** — 现单 seed `0x1a2b3c4d`；规格是 3 个固定 seed，每条 hubJourney + `arenaKills≥1`。
4. **W5 bloom low（复核）** — `QUALITY.low.bloom === false` 已在代码与 `postfx.test.js`；F4 按旧注记结转。Round 3 F4 按实现勾，不要再当缺口派修。
5. **HV-04 盲辨（F2/O2，Round 3 记分）** — 遮掌名按 idle 认掌 ≥6/8。
6. **真机触控全链（洞 8）** — 本环境做不了，F4 标延后；有真机再跑。
7. **文档对齐** — F2 §15/§16 与 O2 `combat-vfx.js` 分派词、GDD §13 皮肤形。
8. **SOTA 签字** — Round 3 F4 复验全表；通过后再考虑快进合 `main`、Pages `/yizhang/`。

## 红线（不得回退）

- 只改 `games/yizhang/`。端口 4181。禁止第二份游戏目录。
- yaw=0 → -Z；`RENDER_YAW_OFFSET = 0`。
- `createMatch` 缺省 hub。harness `createFourPlayerMatch` 缺省仍 arena。
- 禁官方手套名 / 方块人 / 纯色光球 / 发光贴片 / 加载条糊屏。
- 空挥闸是 **`playerInHub` 空间闸**，不是 phase 全局。
- 契约按实现名：`phase/skipHub`、`enterArena/enterHub`、`hubLocked`、`portalNear`、`mainGloveId/offGloveId`、`portal.radius`。
