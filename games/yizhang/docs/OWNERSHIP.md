# 异掌 · 文件所有权与协作边界（安全区大厅轮 Round 1）

> 由 Fable-1 按大厅轮开工现状更新。写路径互不重叠是十代理并行的前提；本文为合并冲突仲裁依据。本轮目标：**3D 安全区 → 走道选掌 → 传送门进裂岛**（`.agent_workspace/yizhang-hub/GOAL.md`），叠在手感轮之上，契约面见 `API_CONTRACT.md` v4（ADR-25…28）。

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
| Opus-4 主循环 UI 输入 | `claude-opus-5-thinking-high-fast` | `src/ui/**`, `src/core/**`, `src/input/**`, `src/audio/**`, `src/main.js`, `index.html` | loop、shell、input、audio、存档、fallback 件 | 开局进 hub（`startPhase:'hub'` + `unlockedGloveIds`）、E→interact 双义采样、触控「选」钮、hub HUD（§13.1）、`phaseChange` 过渡与三个新音名、`lerpView` 跳插值、hub 期不调 `think`、2D 菜单降为备选、fallback 件补 `phase/hub` 协议 |
| GPT-sol-1 单测 | `gpt-5.6-sol-xhigh-fast` | `tests/**` | 确定性用例 | 不变量 14–19：hub 开局形状、靠近聚焦、interact 装备主/副、未解锁拒绝、传送、安全区免战；缺省 `startPhase` 零回归 |
| GPT-sol-2 探针基准 | `gpt-5.6-sol-xhigh-fast` | `scripts/**` | `probe.mjs` / `bench.mjs` | 无头探针走完 **hub → 选掌 → 门 → 岛**，传送后打出 ≥1 kill；`usingRealCombat === true`；纯度扫描保持绿 |

## 2. 共享只读（需改时只追加、先在简报声明）

`package.json`、`vite.config.js`、`README.md`、`.gitignore`。
端口 4181、`base: "./"`、vitest 配置已就位。新增 npm 依赖必须在简报声明理由（原则上除 `three` 外不加运行时依赖）。
`src/sim/README.md` 归 O1，内容与 API_CONTRACT 冲突时以后者为准。

## 3. 交接握手（大厅轮 Round 1）

上一轮（收官轮）的接线终态全部沿用：静态桥（ADR-19/24）、技能 id 一张表（ADR-23）、`p0`、-Z、方格拓扑、事件由 sim 独发。本轮八个握手点（详细语义一律以 `API_CONTRACT.md` v4 为准）：

1. **`view.phase ∈ {hub, arena}`（ADR-25）**：一份 `MatchState` 承载双区，`createMatch(opts.startPhase)` 缺省 `'arena'`（既有 197 测与探针零回归），**shell 开局必传 `'hub'`**。hub 时 bots 存在于数据但不 step 攻击、不被喂 think 输入。
2. **安全区四禁（ADR-25）**：hub 不进 combat 管线（无击退/meter/状态/觉醒）、无掉落（`HUB.bounds` 硬钳制）、Bot 静默（O4 不调 think + O3 think 自守卫）、对局计时冻结（`secondsLeft ≡ matchSeconds`，`isMatchOver` 恒 false）。
3. **`view.hub`（§4.3）**：`pedestals[]`（8 条：`gloveId/x/y/z/yaw/unlocked/selected/focused`）、`focusGloveId`、`portalReady`、`nearPortal`、`interactRadius`、`bounds/portal/spawn`。F3 的 `data/hub.js HUB` 表是唯一布局源（§3.2），O1 快照进 state、O2/O4 从 view 读，**禁止硬编码第二份坐标**。
4. **输入增加 `interact`（ADR-28）**：边沿位；键鼠 E 双义（skill hold + interact edge，input 不懂 phase，sim 按 phase 只消费其一）；触控「选」钮 `setTouchButton('interact', down)` + `data-yz-interact`。O4 采样，O1 在聚焦展掌上结算。
5. **装备规则（ADR-26，§4.4）**：主空→主、副空→副、双满→替换副；hub 内 `switchGlove` = 主副交换；未解锁 ⇒ `hubDeny{reason:'locked'}` 拒绝。解锁集 `opts.unlockedGloveIds` 由 shell 从存档换算注入，缺省 `['cotton']` fail-closed。
6. **传送（ADR-27）**：`portalReady ⇔ mainChosen`；ready ∧ 进门 AABB ⇒ 同 tick `phase='arena'`、p0 写裂岛出生点（既有链路，`invulnT` 保护）、**loadout 保留**、发 `phaseChange`（携落点）；计时自 `enteredArenaAt` 起算。过渡表现归外壳（淡场/门内粒子，禁加载条）；`lerpView` 在 `prev.phase !== cur.phase` 时跳插值。
7. **事件与音名**：词表新增 `hubEquip / hubDeny / phaseChange`（§10），音名新增 `equip / deny / portal`（§11）；聚焦变化不是事件（读 view diff）。O2 按新事件做 VFX，O4 加音效先登记。
8. **HUD 契约（§13.1）**：`.yz-inspect` 说明牌（掌名/职能/一句话/识别色/槽位状态/解锁条件）、门提示两态（「先选一只掌」/「穿过传送门」）、配装指示。数据面冻结在契约，视觉归 F2。

### Round 1 各角色验收线

| 角色 | 出口 |
| --- | --- |
| O1 sim | 不变量 14–19 可测；缺省 `startPhase` 下既有 197 测全绿；`structuredClone`/确定性契约对 `phase/hub` 成立 |
| O2 render | 开局相机跟在安全区角色身后（非裂岛中央）；8 座展掌手指朝上、idle VFX 可辨（禁纯色光球）；phase 切换有短过渡；draw calls 预算不破（ARCHITECTURE §8） |
| O3 ai/combat | `think` hub 守卫落地；hub 期零战斗事件；传送后 bot 正常开打（probe kills ≥ 1 的前提） |
| O4 shell | 开局即 hub（`startPhase:'hub'`）；E/触控同一套靠近+确认；hub HUD 三件套；`phaseChange` 过渡+音效；fallback 件补 `phase`/`hub: null` 协议面；2D 选掌板降为备选 |
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
- **禁止发明第四套台面拓扑、第二个人类 id、第二套朝向约定**（ADR-16/17/18）；hub 与 arena 共用 yaw=0 → -Z，**禁止为大厅另起坐标系或第二套模拟**（ADR-25）。
- **禁止绕过 `combat-bridge` 直连 `src/combat`**（O3 自测除外）、**禁止第二张技能 id 别名表**（ADR-23）、**禁止向已接线的 sim install 真实模块**（ADR-24）。
- **大厅布局唯一来源是 `data/hub.js`**——sim/render/ui 硬编码台座坐标即拒收（ADR-26）；**解锁判定 fail-closed**——绕过 `unlockedGloveIds` 在 render/ui 层放行装备即拒收。
- **禁止第二条传送路径**：切区只有「portalReady ∧ 门 AABB」一条（ADR-27）；ui 直接改 `state.phase` 或在 render 里改配装一律拒收。
- 禁止引用已删除的 `src/sim/fallback-combat.js`。

## 5. 文档索引

| 文档 | 作用 |
| --- | --- |
| `docs/ARCHITECTURE.md` | 模块图、tick 顺序（含 hub 子步差异）、双区状态机 §4.5、ADR 16–28 |
| `docs/API_CONTRACT.md` | 冻结导出面 v4：`HUB` 表 §3.2、`startPhase/unlockedGloveIds`、`state.hub`/`view.hub`、大厅交互语义 §4.4、事件/音名词表、hub HUD §13.1、不变量 1–19 |
| `docs/OWNERSHIP.md`（本文） | 写路径、R1 握手与验收线、红线 |
| `docs/VISUAL_HANDBOOK.md` | 视觉质量基线（用户手册，强制） |
| `docs/ART_DIRECTION.md`（F2） / `docs/GDD.md`（F3） / `docs/SOTA_CHECKLIST.md`+`docs/ACCEPTANCE.md`（F4） | 各自轮内产出 |
| `.agent_workspace/yizhang-hub/GOAL.md` | 本轮用户目标与验收线（必读，只读） |
