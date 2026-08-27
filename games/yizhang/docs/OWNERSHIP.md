# 异掌 · 文件所有权与协作边界（固定人物视角轮 Round 1–3）

> 本轮目标：**修怪视角（yaw 喂入空间收口 + 过门机位 snap）→ 固定人物视角 `lookMode`（缺省 locked）→ SOTA 打磨**（`.agent_workspace/yizhang-look/GOAL.md`），叠在大厅轮 + 手感轮之上。已核验根因：`core/look.js feedLook` 把**相机系** yaw 写进 `renderer.lookYaw`，`sync` 把它当 sim 角用；次因：hub（z≈−120）↔ 裂岛（原点）传送时弹簧相机飞越 ~120m。视角轮新增 **ADR-37…39**（机位 yaw 喂入 = sim 空间、`lookMode: 'locked'|'free'`、过门相机 snap），契约升 **v4.3**（§0.1 名义登记、§7.1 机位契约、§8 lookMode、§13.2 通道与时序、不变量 28–33）。此前全部冻结（ADR-16…36、契约 v4.2 全文）沿用，见文末「大厅轮冻结摘要」。

游戏根：`games/yizhang/`（端口 **4181**）　父分支：**`cursor/yizhang-look-db8d`**（**所有子 PR 的 base，不是 `main`**）。
各代理在自己的云端 `cursor/*-db8d` 分支提交，父调度器合回父分支。输出首行必须声明实际模型 slug（`MODEL_SLUG: <slug>`），严禁静默降级。编排目录 `.agent_workspace/yizhang-look/` 归父调度，子席位只读。

## 1. 所有权表（写路径互不重叠）

| 角色 | 模型 slug | 可写路径（相对 `games/yizhang/`） | 提供（对外冻结面） | Round 1 主攻 |
| --- | --- | --- | --- | --- |
| Fable-1 架构 | `claude-fable-5-thinking-xhigh` | `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/OWNERSHIP.md` | ADR 裁定、契约 v4.3 | lookMode 契约、yaw 喂入空间、过门 snap、ADR-37…39（本文与契约已交付） |
| Fable-2 美术 UX | `claude-fable-5-thinking-xhigh` | `docs/ART_DIRECTION.md`, `src/styles/**` | `.yz-*` HUD/控件样式契约 | 锁视角 HUD / 切换控件（V 键提示、设置项）视觉；过门淡场不挡视线 |
| Fable-3 玩法数值 | `claude-fable-5-thinking-xhigh` | `docs/GDD.md`, `src/data/**` | `GLOVES/MATCH/HUB/SKINS` 等表 | 默认 lookMode 文案、键位表（V）、tuning 机位距离/阻尼（若需表，先登记再用） |
| Fable-4 SOTA 验收 | `claude-fable-5-thinking-xhigh` | `docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` | 验收清单 | 视角验收：开局背后 / 过门吸附 / 锁面向 1:1 / free 解耦 / 无第四套朝向 |
| Opus-1 模拟物理 | `claude-opus-5-thinking-high-fast` | `src/sim/**` | 契约四件套 + 生产桥 | locked 下 `p0.yaw` 与 `Input.yaw` 直赋一致（现状核验即可）；过门 yaw 与出生朝向；**不改战斗数值** |
| Opus-2 WebGL 渲染 | `claude-opus-5-thinking-high-fast` | `src/render/**` | `createRenderer/sync/setLook/...` | `setLook` 吃 `simYaw`（契约 §7.1 消费规则）；`snapCamera()` + `CAMERA_SNAP_TELEPORT` 自动保险；locked 钉身后 |
| Opus-3 技能与 Bot | `claude-opus-5-thinking-high-fast` | `src/ai/**`, `src/combat/**` | combat 四函数、`ai.think` | Bot 不受 lookMode 影响（think 只读 view）；观战 orbit 仍可用；hub 继续拒战 |
| Opus-4 主循环 UI 输入 | `claude-opus-5-thinking-high-fast` | `src/ui/**`, `src/core/**`, `src/input/**`, `src/audio/**`, `src/main.js`, `index.html` | loop、shell、input、audio、存档、fallback 件 | `feedLook` 空间收口（core/look.js）；input `lookMode` 状态 + V 键 + `setLookMode/getLookMode`；设置项 / `?look=` / 存档 `lookMode`；`alignCameraToSelf` 按 §13.2 时序补 `snapCamera` |
| GPT-sol-1 单测 | `gpt-5.6-sol-xhigh-fast` | `tests/**` | 确定性用例 | 不变量 §14-28…33：喂入空间、lookMode 通道、locked 1:1、free 解耦、snap；缺省 locked 零回归 |
| GPT-sol-2 探针基准 | `gpt-5.6-sol-xhigh-fast` | `scripts/**` | `probe.mjs` / `bench.mjs` | 无头探针：locked 朝向一致、过门无 120m 飞跃；smoke `?look=locked|free` 参数 |

## 2. 共享只读（需改时只追加、先在简报声明）

`package.json`、`vite.config.js`、`README.md`（追加说明可在简报声明后由 O4 改一句）、`.gitignore`。
端口 **4181**、`base: "./"`、vitest 配置已就位。原则上除 `three` 外不加运行时依赖。
`src/sim/README.md` 归 O1，内容与 API_CONTRACT 冲突时以后者为准。

## 3. 交接握手（视角轮 Round 1）

此前接线终态全部沿用：静态桥（ADR-19/24）、技能 id 一张表（ADR-23）、`p0`、yaw=0 → -Z、`RENDER_YAW_OFFSET = 0`、方格拓扑、事件由 sim 独发、双区状态机与大厅语义（ADR-29…36）。本轮五个握手点（语义细则一律以 `API_CONTRACT.md` v4.3 为准）：

1. **两套角空间，喂入收口（ADR-37，契约 §1-11/§7.1）**：相机系（`input.getLook().yaw`，前向 `(cos θ, sin θ)`）与 sim 系（yaw=0 → -Z）之外禁止第四套。`renderer.setLook` 消费规则：`simYaw` 优先 → `simYaw:null` 清除 → 裸 `yaw` 当 sim 角 → `yaw:null` 清除；payload 的相机系 `yaw` 字段仅供调试，**渲染器不得消费**。O4 的 `lookPayload` 恒携 `simYaw = cameraYawToSimYaw(yaw)`。
2. **`lookMode`（ADR-38，契约 §8）**：状态住 input（`{ yaw, pitch, mode }`），缺省 **`locked`**。locked：`Input.yaw = cameraYawToSimYaw(θ)`（既有行为 = 零回归）；free：有移动 ⇒ `Input.yaw = atan2(-moveX, -moveZ)`、零移动 ⇒ `null`。移动换算两模式同一条公式。**sim 与 renderer 不感知 lookMode**。
3. **切换四通道（契约 §13.2/§12）**：键 `V`（KeyV 边沿 toggle，不占 E/WASD/空格/Q/F/Shift，不置位任何动作）、设置面板项、`?look=locked|free`（仅本会话、不回写存档）、存档 `lookMode`（追加字段不换 key，老档缺失补 `'locked'`）。初值取值链：URL → 存档 → `'locked'`。变化经 `onLookModeChange` 回调落盘 + toast。
4. **过门 snap（ADR-39，契约 §7.1/§13.2）**：O2 开 `snapCamera()`（阻尼状态置稳态，幂等）+ `sync` 内单帧位移 > `CAMERA_SNAP_TELEPORT`（60m）自动保险；O4 在开局 / `enterArenaFx` / `enterHubFx` 按 `input.setLook → feedLook → snapCamera` 顺序调用。局内重生瞬移（≤ 40m）不触发自动 snap。
5. **事件 / 音效零新增**：本轮不新增 SimEvent、不新增 SoundName；lookMode 切换的 toast 走 shell 既有 `toast`，要加音效先在契约 §11 登记。

### Round 1 各角色验收线

| 角色 | 出口 |
| --- | --- |
| O2 render | 不变量 §14-28（setLook 消费规则四条）、§14-32/33（snap 距离界 + 自动保险 + 重生不触发）可测通过；`RENDER_YAW_OFFSET` 恒 0 |
| O4 shell/input | `feedLook` 后 `renderer.getLook().yaw === cameraYawToSimYaw(θ)`；§14-29 四通道全通；`alignCameraToSelf` 时序落地；缺省 locked 下既有输入测试零改动零回归 |
| O1 sim | 零 diff 或最小核验：`handleActions` 直赋语义不变；`npm test` 不减量 |
| O3 ai/combat | 零 diff 预期：think 只读 view，不读 lookMode |
| F2 styles | V 键提示 / 设置项样式；过门淡场（`.yz-warp`）不遮机位吸附 |
| F3 data | 键位表 / 文案登记；如需机位调参表，先在契约登记再写 `src/data` |
| F4 验收 | GOAL 验收线全勾：开局背后、过门吸附、locked 1:1、free 解耦、`RENDER_YAW_OFFSET === 0` |
| G1 tests | 不变量 §14-28…33 用例；基线 **557 测 / 40 文件不减量** |
| G2 probe | 三固定 seed PASS；冒烟 `http://localhost:4181/src/render/smoke.html?phase=hub&unlock=all&tour=1&look=locked` |

**基线（本轮开工实测 @ 父分支）**：vitest **557/557 全绿（40 文件）**；`npm run probe` 三 seed PASS。Round 1 出口 = 基线不破 + 上表各角色出口全达成。

## 4. 红线（沿袭种子轮 / 手感轮 / 大厅轮，违者提交作废）

- 不改 `games/` 下其他游戏、不复制第二份 `games/yizhang*`、不改仓库根业务、不碰 `.github/workflows` 与 `pages/`。
- 不引入账号/后端/付费、不下载版权素材；音频全 WebAudio 合成、模型全低面数几何体。
- 禁止官方手套名、Roblox/Slap Battles 商标要素、方块人审美、纯色光球展掌。
- 公共 API（API_CONTRACT 列名者）改名/改签名 = 契约变更，必须先改文档并在简报声明。
- **禁止发明第四套朝向 / 第四套角空间**（ADR-16/17/25/37）：hub/arena 共用 yaw=0 → -Z；`RENDER_YAW_OFFSET = 0`，**禁止回 `Math.PI`**、禁止用「再加一个偏移」修视角。
- **禁止把相机系 yaw 写进 `renderer.lookYaw` / 任何 sim 侧字段**（ADR-37）；换算点只有 `combat-bridge`（±π）与 `core/view.js cameraYawToSimYaw/simYawToCameraYaw` 两处。
- **禁止第二份 lookMode 状态源**（ADR-38）：模式只住 input；sim/render/view 快照不感知。值域只有 `'locked'|'free'`，第三值先登记再用。
- **禁止第二条 snap 路径**（ADR-39）：机位吸附 = `snapCamera()` + 渲染器内建 teleport 保险，壳层/UI 不得直改相机状态。
- **禁止发明第四套台面拓扑、第二个人类 id**（ADR-16/18）；**禁止绕过 `combat-bridge` 直连 `src/combat`**（O3 自测除外）、**禁止第二张技能 id 别名表**（ADR-23）、**禁止向已接线的 sim install 真实模块**（ADR-24）。
- **大厅布局唯一来源是 `data/hub.js`**（ADR-30）；**解锁判定 fail-closed**；**切区只有「portalReady ∧ 门触发圆」一条**（ADR-31），ui 直改 `state.phase` 拒收。
- **禁止复活死名**（契约 §0）：`startPhase / unlockedGloveIds / phaseChange / hubDeny / nearPortal / mainChosen / offChosen` 与音名 `equip / deny / portal`。
- **禁止第二个 pitch 状态源**（ADR-35）；禁止引用已删除的 `src/sim/fallback-combat.js`。
- 子代理不用 `gh pr merge`、不打向 `main`；推自己的 `cursor/*-db8d` 分支，父调度器合回。

## 5. 大厅轮冻结摘要（沿用，不得回退）

缺省 `phase:'hub'`（HR-01）；空挥闸是 `playerInHub` **空间**闸（ADR-33），非 phase 全局开关；安全区四禁（免战/无掉落/Bot 静默/计时域 = 传送重置）；hub 换掌 = 主副交换无锁（契约 §4.4 v4.2）；皮肤真表 + `skinAppearance()` 归一 + 配件映射冻结（§3.2-6）；`COMBAT_VFX_KIND` 八词（afterimage = `phase`）；进局入口「再来一局 ≠ 回安全区」（`ENTRY.RESTART/HUB`，§13.1）；`QUALITY.low.bloom === false`；双区渲染子树互斥 + L3-10 预算（mid ≤120 draw / ≤80k tris，实测 hub ≈94/47.8k、arena ≈117/70.0k，ADR-36）；音效映射按 §11 实测表。

## 6. 文档索引

| 文档 | 作用 |
| --- | --- |
| `docs/ARCHITECTURE.md` | 模块图、tick 顺序（含 feedLook 喂入步）、双区状态机 §4.6、视角模式与机位喂入 §5.1.2、性能预算 §8、ADR 16–39 |
| `docs/API_CONTRACT.md` | 冻结导出面 v4.3：名义登记 §0/§0.1、机位契约 §7.1、input lookMode §8、存档 §12、视角通道与时序 §13.2、不变量 1–33 |
| `docs/OWNERSHIP.md`（本文） | 视角轮写路径、握手与验收线、红线、大厅冻结摘要 |
| `docs/VISUAL_HANDBOOK.md` | 视觉质量基线（用户手册，强制） |
| `docs/ART_DIRECTION.md`（F2） / `docs/GDD.md`（F3） / `docs/SOTA_CHECKLIST.md`+`docs/ACCEPTANCE.md`（F4） | 各自轮内产出 |
| `.agent_workspace/yizhang-look/GOAL.md` | 本轮用户目标与验收线（必读，只读） |
