# 异掌 · 文件所有权与协作边界（安全区大厅轮 Round 1–3）

> 本轮目标：**3D 安全区 → 走道选掌 → 传送门进裂岛**（`.agent_workspace/yizhang-hub/GOAL.md`），叠在手感轮之上。手感轮 ADR-25…28 沿用；大厅双区记 **ADR-29…32**（Fable-1 原文 25…28 已改号，避免与朝向/皮肤契约撞车）；Round 2 新增 **ADR-33…35**（hub 空挥闸、skinId+ghosts 导出、相机 pitch 通路）；Round 3 新增 **ADR-36**（双区渲染子树互斥）。O1 缺省 `phase:'hub'`，不以「缺省 arena」回退。Round 2 契约已向实现收口（`API_CONTRACT.md` v4.1 §0 七处名义漂移表）：一律用实现名 `phase/skipHub/unlocked`、`enterArena/enterHub`、`hubLocked`、`portalNear/mainGloveId/offGloveId`、`portal.radius`；死名 `startPhase/unlockedGloveIds/phaseChange/hubDeny/nearPortal/mainChosen` 禁止写进代码与测试。Round 3 契约 v4.2 继续按实现补记（零新 API）：L3-10 实测数字（mid hub ≈94 draw / 47.8k tris、arena ≈117 / 70.0k，上限仍 ≤120 / ≤80k）、`COMBAT_VFX_KIND` 分派词（afterimage=`phase` 非 mirror）、皮肤渲染通路（`skinAppearance()` + `createRenderer({data,skins})`、配件映射冻结）、hub 换掌 = 主副交换（v4.1 曾误写「与 arena 同语义」）、进局入口 `ENTRY.RESTART/HUB`（再来一局 ≠ 回安全区）。

游戏根：`games/yizhang/`　父分支：**`cursor/yizhang-hub-db8d`**（**所有子 PR 的 base，不是 `main`**）。
各代理在自己的云端分支提交，父调度器合回父分支。输出首行必须声明实际模型 slug，严禁静默降级。

## 1. 所有权表

| 角色 | 模型 slug | 可写路径（相对 `games/yizhang/`） | 提供（对外冻结面） | Round 1 主攻 |
| --- | --- | --- | --- | --- |
| Fable-1 架构 | `claude-fable-5-thinking-xhigh` | `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/OWNERSHIP.md` | 双区状态机、选掌/传送契约、ADR 裁定 | 本文与契约 v4（已交付） |
| Fable-2 美术 UX | `claude-fable-5-thinking-xhigh` | `docs/ART_DIRECTION.md`, `src/styles/**` | `.yz-*` HUD/控件样式契约 | 台座/走道/传送门/`.yz-inspect` 说明牌/门提示视觉（§13.1 数据面） |
| Fable-3 玩法数值 | `claude-fable-5-thinking-xhigh` | `docs/GDD.md`, `src/data/**` | `GLOVES/MATCH/isGloveUnlocked` 等表 + **`HUB` 大厅布局表** | `src/data/hub.js`：8 座坐标/朝向、`interactRadius`、门 AABB、bounds、spawn（§3.2 硬约束） |
| Fable-4 SOTA 验收 | `claude-fable-5-thinking-xhigh` | `docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` | 验收清单 | 大厅流程验收（开局 hub、8 座可辨可装、传送、Bot 只在格斗区） |
| Opus-1 模拟物理 | `claude-opus-5-thinking-high-fast` | `src/sim/**` | 契约四件套 + 生产桥 | `phase: hub\|arena` 状态机、安全区四禁、聚焦/interact 装备/未解锁拒绝、传送、计时域、`view.hub`（§4.2–4.4） |
| Opus-2 WebGL 渲染 | `claude-opus-5-thinking-high-fast` | `src/render/**` | `createRenderer/sync/...` | 大厅场景：走道、台座、**手指朝上 +Y 展掌 + 每掌可辨 idle VFX**、传送门、phase 切换过渡、hub 相机跟随 |
| Opus-3 技能与 Bot | `claude-opus-5-thinking-high-fast` | `src/ai/**`, `src/combat/**` | combat 四函数、`ai.think` | `think` 的 hub 守卫（`view.phase === 'hub'` ⇒ 零输入）；确认 combat 管线在 hub 不被触达；传送后战斗回归绿 |
| Opus-4 主循环 UI 输入 | `claude-opus-5-thinking-high-fast` | `src/ui/**`, `src/core/**`, `src/input/**`, `src/audio/**`, `src/main.js`, `index.html` | loop、shell、input、audio、存档、fallback 件 | 开局进 hub（缺省 `phase:'hub'` + `unlocked` 注入）、E→interact 双义采样（`input.setPhase` 分流）、触控「选」钮、hub HUD（§13.1）、`enterArena/enterHub` 过渡与音效实测表、`lerpView` 跳插值、hub 期不调 `think`、2D 菜单降为备选、fallback 件补 `phase/hub` 协议 |
| GPT-sol-1 单测 | `gpt-5.6-sol-xhigh-fast` | `tests/**` | 确定性用例 | 不变量 14–19：hub 开局形状、靠近聚焦、interact 装备主/副、未解锁拒绝、传送、安全区免战；缺省 `phase` 零回归 |
| GPT-sol-2 探针基准 | `gpt-5.6-sol-xhigh-fast` | `scripts/**` | `probe.mjs` / `bench.mjs` | 无头探针走完 **hub → 选掌 → 门 → 岛**，传送后打出 ≥1 kill；`usingRealCombat === true`；纯度扫描保持绿 |

### Round 2 主攻（对齐 `.agent_workspace/yizhang-hub/round2/DISPATCH.md`；写路径不变）

| 席位 | Round 2 主攻 |
| --- | --- |
| Fable-1 架构 | 契约向实现收口（§11.6 洞 4 七处名义，契约 v4.1 §0）+ 空挥 / pitch / 皮肤透传 ADR-33…35 |
| Fable-2 美术 UX | 皮肤剪影 + 裂岛每掌战斗 VFX 视觉规范 |
| Fable-3 玩法数值 | `src/data/skins.js` 真表 + 每掌战斗 VFX 参数 |
| Fable-4 SOTA 验收 | 复验 §11，重勾 HV / HG-02 |
| Opus-1 模拟物理 | hub 空挥闸（ADR-33）；`players[].skinId` / `view.combat.ghosts` 导出（ADR-34）；hub 换掌语义核对补测 |
| Opus-2 WebGL 渲染 | 皮肤 mesh（按 skinId 换件，禁统一胶囊）、裂岛每掌 VFX、残影绘制、相机 pitch API（ADR-35 `setPitch`） |
| Opus-3 技能与 Bot | 事件带 gloveId；残影数据让 getView 能读；hub 继续拒战 |
| Opus-4 主循环 UI 输入 | 每帧 `getLook().pitch` 喂 `setPitch`；结算回走道（`enterHub` UX）；皮肤选择器吃真表；`ui/hub.css` 收缩为结构 fallback |
| GPT-sol-1 单测 | 空挥（§14-26）/ skinId / ghosts / probe 对齐的单测，不减量 |
| GPT-sol-2 探针基准 | probe 调用传 `phase:'hub'`（不改 harness 缺省），`hubJourney` 全绿且 `arenaKills ≥ 1` |

### Round 3 主攻（对齐 `.agent_workspace/yizhang-hub/round3/DISPATCH.md`；写路径不变）

| 席位 | Round 3 主攻 |
| --- | --- |
| Fable-1 架构 | 契约/架构向实现终对齐（契约 v4.2 + ADR-36）：L3-10 实测数字、`COMBAT_VFX_KIND` 分派词、皮肤渲染通路、hub 换掌交换语义、进局入口语义 |
| Fable-2 美术 UX | HV-04 idle 盲辨规范 + 预算下仍可辨的视觉合同（ART_DIRECTION §17，已合入） |
| Fable-3 玩法数值 | GDD §13 与 `skins.js`/`vfx.js` 同词；不改战斗数值 |
| Fable-4 SOTA 验收 | Round 3 签字；重跑全表；W1 修后按字面勾 L3-10 |
| Opus-1 模拟物理 | 计时域/回程边角；不回退空间闸 |
| Opus-2 WebGL 渲染 | **P0 画调用预算**（已合入：mid hub 峰值 ≈94 draw / 47.8k tris、arena ≈117 / 70.0k）；hub 关裂岛、idle 降档；禁砍 8 掌可辨 |
| Opus-3 技能与 Bot | 战斗事件/残影边角；hub 继续拒战 |
| Opus-4 主循环 UI 输入 | 结算回走道 UX 打磨（再来一局 ≠ 回安全区）；说明牌/门提示跟 F2 |
| GPT-sol-1 单测 | 预算/三 seed/盲辨锁表；不减量 |
| GPT-sol-2 探针基准 | probe 三固定 seed；去掉误导 MODEL_SLUG 横幅（已合入） |

## 2. 共享只读（需改时只追加、先在简报声明）

`package.json`、`vite.config.js`、`README.md`、`.gitignore`。
端口 **4181**、`base: "./"`、vitest 配置已就位。新增 npm 依赖必须在简报声明理由（原则上除 `three` 外不加运行时依赖）。
`src/sim/README.md` 归 O1，内容与 API_CONTRACT 冲突时以后者为准。

## 3. 交接握手（大厅轮 Round 1）

上一轮（收官轮）的接线终态全部沿用：静态桥（ADR-19/24）、技能 id 一张表（ADR-23）、`p0`、-Z、方格拓扑、事件由 sim 独发。本轮八个握手点（详细语义一律以 `API_CONTRACT.md` v4.1 为准；R2 已按实现名收口）：

1. **`view.phase ∈ {hub, arena}`（ADR-29；R2 名收口）**：一份 `MatchState` 承载双区，`createMatch(opts.phase)` **缺省 `'hub'`**（HR-01 红线，产品路径不传即进大厅）；旧测/旧探针显式传 `phase:'arena'` / `skipHub` / `config.skipHub`。hub 时 bots 存在于数据但留在裂岛、不被喂 think 输入。死名：`startPhase`。
2. **安全区四禁（ADR-29/33）**：免战按「实体所处空间」豁免（`playerInHub`；`applyHits` 退回冲量、`tickStatuses` 照跑）+ R2 空挥闸（ADR-33：hub 不启动扇击/技能）、无掉落（`walkway` 硬钳制 + 实心地板）、Bot 静默（O4 不调 think + O3 think 自守卫）、计时域 = 传送重置（`match.startTime`，hub 内壳层不消费 over）。
3. **`view.hub`（契约 §4.3）**：`pedestals[]`（8 条：`gloveId/x/y/z/yaw/row/index/height/radius/unlock/unlocked/selected/slot/focused/name/color/desc/role`）、`focusGloveId`、`portalReady`、`portalNear`、`mainGloveId/offGloveId`、`unlocked`、`interactRadius`、`walkway/zone/portal/spawn`。F3 的 `data/hub.js HUB` 表是唯一布局源（§3.3），O1 快照进 state、O2/O4 从 view 读，**禁止硬编码第二份坐标**。死名：`nearPortal`、`mainChosen/offChosen`。
4. **输入增加 `interact`（ADR-32）**：持续位上报、sim 边沿结算（`p.prev.interact`）；键鼠 E 双义，分流在 input 侧（`setPhase('hub')` 下 sample 归零 slap/skill）；触控「选」钮 `setTouchButton('interact', down, { slot })` + `data-yz-interact`。O4 采样，O1 在最近台座上结算。
5. **装备规则（ADR-30，契约 §4.4）**：主空→主、**副掌再按提为主掌（原主退副）**、已是主掌 ⇒ `changed:false` 回执、副空→副、双满→替换副；hub 内 `switchGlove` = **主副交换、无锁**（`sim/hub.js swapHubLoadout`，`switch{slot:0}` 事件；arena 维持 activeSlot 切换 + switchLock——契约 §4.4 已在 v4.2 按实现改写，R2 本条曾误记「交换从未实装」）；未解锁 ⇒ `hubLocked{unlock}` 拒绝。解锁集 `opts.unlocked`（数组/Set/Record/`'all'`）由 shell 从存档换算注入，缺省 fail-closed。死名：`hubDeny`、`unlockedGloveIds`。
6. **传送（ADR-31）**：`portalReady ⇔ !!mainGloveId`；ready ∧ 进门触发圆（`portal.radius`，sim 不读 aabb）⇒ 同 tick `phase='arena'`、p0 写裂岛出生点（既有链路，`invulnT` 保护）、**loadout 保留**、`match.startTime` 重置、发 `enterArena{id,x,y,z}`；回程 `enterHub(state)` 壳层 API 发 `enterHub`。过渡表现归外壳（淡场/门内粒子，禁加载条）；`lerpView` 在 `prev.phase !== cur.phase` 时跳插值。死名：`phaseChange`。
7. **事件与音名（契约 §10/§11 实测表）**：大厅词表 = `hubFocus / hubEquip / hubLocked / hubPortalNear / enterArena / enterHub`；音效映射 = `hubFocus→uiMove`、`hubEquip(changed)→switchGlove`、`hubLocked→uiBack`、`enterArena→matchStart`，其余静默——v4 的 `equip/deny/portal` 音名从未实装。聚焦获得是 `hubFocus` 事件，聚焦丢失读 view diff。O2 按实现事件名做 VFX，O4 加音效先登记。
8. **HUD 契约（§13.1）**：`.yz-inspect` 说明牌（直接读 `HubPedestalView` 的 name/role/desc/color/slot/unlock）、门提示两态（`portalNear ∧ !portalReady` /「穿过传送门」）、配装指示。数据面冻结在契约，视觉归 F2。

### Round 1 各角色验收线

| 角色 | 出口 |
| --- | --- |
| O1 sim | 不变量 14–19 可测；`phase:'arena'`/`skipHub` 旧路下既有 197 测全绿；`structuredClone`/确定性契约对 `phase/hub` 成立 |
| O2 render | 开局相机跟在安全区角色身后（非裂岛中央）；8 座展掌手指朝上、idle VFX 可辨（禁纯色光球）；phase 切换有短过渡；draw calls 预算不破（ARCHITECTURE §8） |
| O3 ai/combat | `think` hub 守卫落地；hub 期零战斗事件；传送后 bot 正常开打（probe kills ≥ 1 的前提） |
| O4 shell | 开局即 hub（缺省 `phase:'hub'`，不带 `skipHub`）；E/触控同一套靠近+确认；hub HUD 三件套；`enterArena/enterHub` 过渡+音效；fallback 件补 `phase`/`hub: null` 协议面；2D 选掌板降为备选 |
| F2 styles | `.yz-inspect`/门提示/配装指示样式；台座说明牌可读性（移动端字号、安全区内缩） |
| F3 data | `HUB` 表过 §3.2 四条硬约束（8 座唯一、半径 1.6–2.2、与裂岛不重叠、几何包含关系） |
| F4 验收 | 清单对齐 GOAL 验收线 + 本文出口；以「开局 hub + 传送后 Bot 才出现」为 L0 |
| G1 tests | 不变量 14–19 用例 + 缺省零回归断言；禁空 expect、禁跳测 |
| G2 probe | 探针剧本：hub 出生 → 走到展掌 → interact 装主掌 → 进门 → phase=arena → ≥1 kill；断言 `usingRealCombat === true` |

**基线（本轮开工实测 @ 父分支）**：vitest **197/197 全绿（17 文件）**；`npm run probe` PASS（60s、2 kills、`usingRealCombat: true`、纯度扫描 30 文件）。R1 出口 = 基线不破 + 上表各角色出口全达成。

## 4. 红线（沿袭种子与收官轮，违者提交作废）

- 不改 `games/` 下其他游戏、不改仓库根业务、不碰 `.github/workflows` 与 `pages/`。
- 不引入账号/后端/付费、不下载版权素材；音频全 WebAudio 合成、模型全低面数几何体。
- 禁止官方手套名、Roblox/Slap Battles 商标要素、方块人审美、纯色光球展掌。
- 公共 API（API_CONTRACT 列名者）改名/改签名 = 契约变更，必须先改文档并在简报声明。
- **禁止发明第四套台面拓扑、第二个人类 id、第二套朝向约定**（ADR-16/17/18）；hub 与 arena 共用 yaw=0 → -Z，**禁止为大厅另起坐标系或第二套模拟**（ADR-29）。
- **禁止绕过 `combat-bridge` 直连 `src/combat`**（O3 自测除外）、**禁止第二张技能 id 别名表**（ADR-23）、**禁止向已接线的 sim install 真实模块**（ADR-24）。
- **大厅布局唯一来源是 `data/hub.js`**——sim/render/ui 硬编码台座坐标即拒收（ADR-30）；**解锁判定 fail-closed**——绕过 `opts.unlocked` 在 render/ui 层放行装备即拒收。
- **禁止第二条传送路径**：切区只有「portalReady ∧ 门触发圆（`portal.radius`）」一条（ADR-31）；ui 直接改 `state.phase` 或在 render 里改配装一律拒收。
- **禁止复活死名**（契约 v4.1 §0）：`startPhase / unlockedGloveIds / phaseChange / hubDeny / nearPortal / mainChosen / offChosen` 与音名 `equip / deny / portal`——写进代码、测试或分派表即拒收。
- **禁止第二个 pitch 状态源**（ADR-35）：俯仰只住在 `input.getLook().pitch`，render 经 `setPitch` 消费。
- 禁止引用已删除的 `src/sim/fallback-combat.js`。

## 5. 文档索引

| 文档 | 作用 |
| --- | --- |
| `docs/ARCHITECTURE.md` | 模块图、tick 顺序（含 hub 子步差异）、双区状态机 §4.6、性能预算 §8（L3-10 实测）、ADR 16–36 |
| `docs/API_CONTRACT.md` | 冻结导出面 v4.2：名义漂移收口表 §0、`HUB` 表 §3.3、`phase/skipHub/unlocked`、`state.hub`/`view.hub`、大厅交互语义 §4.4（含 hub 换掌交换）、VFX 分派词表 §7、事件/音名词表（实测）、hub HUD 与进局入口 §13.1、不变量 1–27 |
| `docs/OWNERSHIP.md`（本文） | 写路径、R1 握手与验收线、R2 主攻、红线 |
| `docs/VISUAL_HANDBOOK.md` | 视觉质量基线（用户手册，强制） |
| `docs/ART_DIRECTION.md`（F2） / `docs/GDD.md`（F3） / `docs/SOTA_CHECKLIST.md`+`docs/ACCEPTANCE.md`（F4） | 各自轮内产出 |
| `.agent_workspace/yizhang-hub/GOAL.md` | 本轮用户目标与验收线（必读，只读） |
