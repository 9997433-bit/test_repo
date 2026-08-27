# 《Round 1 结论简报》· 异掌安全区大厅

主调度器整理。10/10 云端子代理已回收，产出无冲突合入 `cursor/yizhang-hub-db8d`。
父 PR：https://github.com/9997433-bit/test_repo/pull/22

本轮叠在手感轮（`cursor/yizhang-feel-db8d`）之上：键鼠回正、hit-stop、皮肤壳层兜底表仍有效。

## 实测基线（Round 1 收口后本机）

- `npm test`：**330 passed / 24 files**（F4 开工基线 306/23；O2 渲染测并入后 330）
- `npm run probe`：**FAIL**，`probe must start in hub phase; got arena`（洞 3，Round 2 G2 一行）
- `npm run build`：退出码 0
- 冒烟：`http://localhost:4181/src/render/smoke.html?phase=hub&unlock=all&tour=1`

## 已实现（对照用户原话）

| 用户目标 | Round 1 落地 |
| --- | --- |
| 开局在另一区域（安全区） | `createMatch` 缺省 `phase:'hub'`；p0 落走道 (0,−106)；相机在人身后 |
| 走道两边一排手套 + 台子 + 手指朝上 + 对应特效 | 8 座数据/sim/渲染齐；展掌 +Y；八种可辨 idle（棉絮/岩屑/风带/霜雾/簧弧/残影/磁弧/余烬） |
| 靠近选择和说明 | 半径 2.0 聚焦；E / 触控「选」同通路；未解锁 fail-closed；主副先主后副 |
| 传送门进格斗区 | 选主掌后门就绪；穿门同 tick `phase=arena`、loadout 保留；Bot 仅 arena 出手 |
| SOTA 打磨 | 识别漆 HSL 提亮（禁 multiplyScalar 削白）；low 档凿刻贴图；HUD 材质化合同 |

## 十席合入

| 席 | 分支 | 落地 |
| --- | --- | --- |
| F1 契约 | `cursor/yizhang-hub-r1-f1-db8d` | 双区契约；大厅 ADR-29…32（手感轮占用 25…28） |
| F2 视觉 | `cursor/yizhang-hub-art-f2-db8d` | ART_DIRECTION §13/§14；`src/styles/hub.css` 后注入压制 O4 兜底 |
| F3 数据 | `cursor/yizhang-hub-data-db8d` | `src/data/hub.js` HUB 表；Bot skinId brute/fox/bully → wildhorn/crane/nuo |
| F4 验收 | `cursor/yizhang-hub-f4-acceptance-db8d` | SOTA §11、ACCEPTANCE §12；手感 §10/§11 保留 |
| O1 sim | `cursor/yizhang-sim-hub-phase-db8d` | hub/arena 状态机；靠近/装备/传送；`enterHub` API |
| O2 渲染 | `cursor/yizhang-hub-render-db8d` | 走道/八座展掌/idle VFX/门两态；arena 时整棵子树关 |
| O3 AI | `cursor/yizhang-ai-hub-guard-db8d` | think hub 零输入；combat 安全区不接活 |
| O4 壳 | `cursor/yizhang-hub-shell-db8d` | 开局进 hub；E/触控；`.yz-inspect`；2D 菜单降备选 |
| G1 测 | `cursor/hub-tests-db8d` | `tests/hub-flow.test.js` 等 |
| G2 探针 | `cursor/hub-sim-probe-db8d-0947` | hubJourney 剧本在场，但调用未传 `phase:'hub'` |

## 遗留缺陷（Round 2 必须修，按杀伤排序）

1. **探针缺省 arena（HG-02 挡，P0）**  
   `scripts/harness.mjs createFourPlayerMatch` 缺省 `phase:'arena'`（护 feel-probe/bench）。`scripts/probe.mjs` 未覆盖。一行：probe 调用传 `phase:'hub'`。归 G2。不要改 harness 缺省。

2. **皮肤 mesh 仍是统一胶囊（用户目标 2）**  
   壳层 `src/core/skins.js` 兜底 7 套（ash/kiln/…）；**没有** `src/data/skins.js` 真表。`getView().players[].skinId` 未导出。渲染 `characters.js` 不读 skinId。Bot 数据已写 wildhorn/crane/nuo，渲染吃不到。链：F3 真表 → O1 透传 → O2 剪影换件 → O4 选择器已在。

3. **战斗每掌 VFX 仍偏通用（用户目标 3）**  
   大厅 idle 已可辨；**裂岛扇击/技能**仍一套。分身 `combat.ghosts` 未进 getView，渲染未必画残影。归 O3 事件 gloveId + O2 分派 + F3 vfx 参数。

4. **相机 pitch 未接线**  
   `input.getLook().pitch` 有值；`cameraRig.update(dt, focus, yaw, vel)` 不吃 pitch。鼠标上下看无效。O2 开 API，O4 每帧喂。

5. **hub 空挥**  
   combat 拒活，但 `sim/step.js handleActions` 不看 phase：大厅按住鼠标仍发 `slapStart`/`slap`（hits:0）并 `stats.slaps++`。O1 闸：hub 内不启动扇击/技能/冲刺战斗动作；允许走、看、interact、换掌。

6. **对局结束回安全区 UX**  
   `enterHub` / `returnToHub()`（重开一局落 hub）在场。结算板「回走道再选」入口与原局回程（不重开）未打磨。GOAL §7。归 O4 + O1。

7. **契约-实现七处名义漂移**（F4 §11.6 洞 4）  
   `startPhase` vs `phase`/`skipHub`；`phaseChange` vs `enterArena`/`enterHub`；`hubDeny` vs `hubLocked`；`nearPortal` vs `portalNear`；aabb vs radius；装备 no-op vs 副掌再按提主；音效映射。收口方向：**契约向实现修**。归 F1。验收按实现名。

8. **hub 内 switchGlove**  
   契约：主副交换、无 switchLock。实现是否落地未核。O1 核对并补测。

9. **双 CSS 生效来源**  
   F2 `styles/hub.css` 已后注入。Round 2 要 O4 把 `ui/hub.css` 收成结构 fallback，devtools 核对 `.yz-inspect` 等来自 styles。

10. **手感轮未完项并入本轮**  
    F2 皮肤选择器视觉、F3 真表、O1 skinId/ghosts、O2 皮肤+战斗 VFX、O3 事件 gloveId、G1 输入单测补强。

## 性能

- 安全区 high+bloom 约 396 drawcall；low 关 bloom 约 77。头部实测 ≈49（已钉测）。
- 探针 p99 基线手感轮 ~0.1ms；修 HG-02 后复测，红线 0.5ms。
- 识别漆禁止 `Color.multiplyScalar` 提亮（>1 削顶变白）。

## 红线（不得回退）

- 只改 `games/yizhang/`。端口 4181。禁止第二份游戏目录。
- yaw=0 → -Z；`RENDER_YAW_OFFSET = 0`。
- `createMatch` 缺省 `phase:'hub'`（旧测用 `skipHub` / `phase:'arena'`）。
- 禁官方手套名 / 方块人 / 纯色光球 / 发光贴片 / 加载条糊屏。
- 大厅 ADR **29…32**；手感 ADR **25…28**。
- `interact` 不要塞进 Bot `ZERO_INPUT` 键集全等断言（用 `HUB_ZERO_INPUT`）。

## Round 2 攻坚重点（注入全部 10 席）

1. G2：probe 传 `phase:'hub'`，`hubJourney` 全绿且 `arenaKills≥1`。
2. F3：`src/data/skins.js` 真表（≥6，含 wildhorn/crane/nuo；DEFAULT 与契约对齐）+ 每掌战斗 VFX 参数。
3. O1：hub 空挥闸；`players[].skinId` 与 `view.combat.ghosts` 导出；hub 换掌语义；回程 API 打磨。
4. O2：按 skinId 换剪影/配件（禁统一胶囊）；裂岛 8 掌扇击/技能可辨 VFX；画残影；相机吃 pitch。
5. O4：每帧把 `getLook().pitch` 喂渲染；结算回走道；皮肤选择器吃真表；`ui/hub.css` 收缩。
6. O3：事件带 gloveId；残影数据让 getView 能读；hub 继续拒战。
7. F1：契约向实现收口七处名义；ADR 补皮肤 mesh / 空挥闸 / pitch。
8. F2：皮肤剪影与战斗 VFX 视觉规范（大厅 §13 已有 idle 关键词）。
9. G1：空挥、skinId 透传、ghosts、probe 对齐的单测；不减量。
10. F4：复验 §11；O2/F2 已合入后重勾 HV；HG-02 修后按字面判。
