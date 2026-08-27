# 异掌 · 架构总纲（固定人物视角轮 Round 3 · 叠大厅轮 + 手感轮）

> 状态：**冻结（LOOK-R3 + HUB-R3 + 手感轮）**。父分支 **`cursor/yizhang-look-db8d`**（大厅轮父分支 `cursor/yizhang-hub-db8d` 已收口合回 main）。手感轮 ADR-25…28（朝向零补偿、皮肤、每掌 VFX、hit-stop）沿用；大厅轮 **ADR-29…32**（双区状态机、走道选掌、传送门、`interact` / Bot 静默）；大厅 Round 2 **ADR-33…35**（hub 空挥闸、skinId+ghosts 导出、相机 pitch 通路）；大厅 Round 3 **ADR-36**（双区渲染子树互斥）。**视角轮 Round 1 新增 ADR-37…39**（机位 yaw 喂入 = sim 空间、`lookMode: 'locked'|'free'`、过门相机 snap，见 §5.1.2 与 §10）——修「视角转换很奇怪」的根因（`feedLook` 把相机系 yaw 写进 `renderer.lookYaw`）并冻结「固定人物视角」为产品缺省。O1 已落地 `createMatch` **缺省 `phase:'hub'`**，旧测靠裂岛坐标/空间规则或 `skipHub` 零回归，不以「缺省 arena」回退实现。**视角轮 Round 2（LOOK-R2，零新 ADR）已收口**：Round 1 合入终态 = locked 全链、过门 snap、锁视角 HUD DOM（`.yz-look-flash` + `#hud[data-look]`）、O3 Bot 护栏、F3 GDD 文案**均已在父分支**；Round 2 唯一实现缺口（`input.sample()` 未按 ADR-38 分派、F4 曾判 LK-04 FAIL）**已由 O4 落地**——三分支分派合入 `src/input/index.js`，可测封闭表 §14-34/35 由 G1 锁测、G2 探针复验、F4 重判 **LK-04 PASS**，六条用户验收线 6/6（签 PASS-WITH-WARNINGS）。ADR-37/38 各带一条 R2 按实现补记（payload.yaw = simYaw、渲染器随帧镜像——运行期权威仍唯一住 input），ADR-38 另带 R3「已落地」补记；`RENDER_YAW_OFFSET` 恒 0、只有两套角空间、**禁止第四套朝向**（重申，一字不动）。契约保持 **v4.4** 不升版（`API_CONTRACT.md`：§0.1/§0.2 名义登记、§7.1 机位契约、§8 lookMode、§13.2 通道与时序、不变量 28–35；Round 3 仅把「未落地」历史注记改为实现态登记）。**Round 3（LOOK-R3）= SOTA 打磨轮**：无实现缺口，余项 = O2 机位复核补交、实机/无头冒烟与记分收尾（`OWNERSHIP.md` §3.2）。变更流程：先改本文与 `docs/API_CONTRACT.md`，再改代码。

## 0. 一句话架构

**纯数据模拟核**（`sim` / `combat` / `data` / `ai`，零 DOM、零 three、可 `structuredClone`）＋ **单向视图流**（`getView` 纯 JSON 快照）＋ **可整体替换的外壳**（`render` / `input` / `audio` / `ui`），由 `main.js` + `core/loop` 以固定 60Hz 步进驱动、渲染插值；HUD 走 DOM，与 WebGL 画布完全分层，互不感知。本轮起，一局是**双区**的：同一个 `MatchState` 先承载**安全区大厅**（走道选掌，无战斗），穿过传送门后进入**裂岛格斗区**（既有规则原样），区别只在 `state.phase`——没有第二套状态机、没有第二个 `createMatch`。

## 1. 模块图

```
┌─ 外壳层（DOM / WebGL / WebAudio；禁止反向 import 编排层）───────────────────────┐
│                                                                                │
│  src/ui/shell.js     src/input/       src/audio/        src/render/            │
│  主菜单·HUD·结算·     键鼠+触屏归一     WebAudio 合成      three.js 仅此目录       │
│  触控钮 DOM           摇杆·视角·脉冲     事件名→音色        场景·相机·插值·画质档   │
│        ▲                  ▲                ▲                  ▲                 │
│   view │ 快照         Input│            事件│→音名         view │（已插值）       │
└────────┼──────────────────┼────────────────┼──────────────────┼────────────────┘
┌─ 编排层 ┴──────────────────┴────────────────┴──────────────────┴────────────────┐
│  src/main.js（装配、事件→音效/播报映射）                                          │
│  src/core/（loop 固定步·interp 视图插值·quality 画质探测·storage 存档·            │
│             modules 兄弟模块探测·fallback/** 降级件）                             │
└────────▲────────────────────────────────────────────────────────────────────────┘
         │ createMatch / step / getView / isMatchOver          think(view,botId,rng)
┌─ 纯数据层（禁 import three、禁 DOM/window；state 可 structuredClone）─────────────┐
│                                                                                 │
│  src/sim/ ─每 tick 经 combat-bridge─► src/combat/（扇击·技能·状态·觉醒数值覆盖）     │
│     │        （静态 import；别名/朝向/命中/事件翻译）│                                │
│     └──静态 import──► src/data/ ◄──读──────┘   src/ai/bots.js（读 view + data）    │
│                （GLOVES · MATCH 等只读表，运行期禁止改写）                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### import 规则矩阵（违反即架构缺陷）

| 模块 | 允许 import | 明确禁止 |
| --- | --- | --- |
| `src/data` | 无（纯常量表） | 一切 |
| `src/combat` | `data` | three、DOM、`sim`（防环） |
| `src/sim` | `data`（`gloves.js`）、`combat`（**只经 `sim/combat-bridge.js` 静态 import**，见 ADR-19/23） | three、DOM、`ai`、`render` |
| `src/ai` | `data` | three、DOM、`sim` 内部（只吃 `getView` 快照） |
| `src/render` | `three`、`data`（识别色等只读表） | `sim` 内部、业务层 |
| `src/input` | 无业务依赖（DOM API 本体） | three、`sim` |
| `src/audio` | 无业务依赖（WebAudio 本体） | three、`sim` |
| `src/ui` | `data`（名字/识别色/解锁表） | three、`sim` 内部 |
| `src/core` | `sim`/`ai`/`data` 经 `modules.js` 动态探测；`render/input/ui/audio` 由 `main.js` 注入 | — |
| `src/main.js` | 一切公共 API | — |

「读 view」= 只接受 `getView` 返回的 JSON 快照，绝不持有 `state` 引用。渲染、UI、AI 改不动模拟，这是本项目最重要的一条不变量。

## 2. 帧管线与 tick 顺序（合并后实况，冻结）

固定模拟步 `MATCH.dt = 1/60`，累加器驱动（`core/loop.js`），渲染插值（`core/interp.js`）。每个 `requestAnimationFrame`：

```
1. acc += min(frameDt, 0.25)                  # 防后台回来螺旋死亡
2. while (acc >= dt):  loop.step(dt) 回调：
     a. inputs[p0] = input.sample(input.getLook().yaw)      # 人类，世界系
        inputs[bN] = ai.think(curView, bN, rngBot)          # 每个 bot，用上一 tick 快照
     b. sim.step(state, inputs, dt)           # 内部再切 ≤1/60 子步；顺序见下
     c. prevView = curView; curView = sim.getView(state)
     d. main.handleEvents(curView.events)     # 音效 / 击杀播报 / toast
     acc -= dt
3. alpha = acc / dt
4. view = lerpView(prevView, curView, alpha)  # core/interp.js，编排层完成插值
5. feedLook(renderer, input.getLook())        # 每 rAF 一次（sync 之前）：core/look.js 产出
                                              # { yaw(=simYaw 同值), pitch, simYaw, lookMode }，
                                              # 机位水平角只喂 sim 空间（ADR-37，相机系角不出
                                              # 输入层）；lookMode 随帧覆盖渲染器镜像（ADR-38
                                              # R2 补记）；观战/主菜单也照喂，pitch 不卡
6. renderer.sync(view)                        # renderer 收到的已是插值后的快照
7. shell.updateHud(curView, 'p0')             # 节流 ~30Hz
```

`sim.step` 内部顺序（`src/sim/step.js`，冻结）：

```
清 events（每次 step 一次，所有子步共用事件缓冲）；随后每个子步：
combat.tickStatuses（状态倒计时·掌意衰减·满条觉醒·返回延迟命中交 sim 记账）
→ 计时器/重生 → 动作处理（换掌/冲刺/跳/扇击前摇/技能）
→ 位移积分 → 玩家互推 → 地面/护栏解算 → 前摇到帧的扇击结算（combat.resolveSlap 经桥）
→ 掉落判定（y < fallY 或出盘无支撑 ⇒ ko）→ updateMatch（胜负缓存 + matchOver 事件）
```

**hub 阶段的子步差异（ADR-29/33，按实现收口）**——外层管线一字不变，`subStep` 骨架对两个 phase 是**同一条**，分岔按「实体所处空间」（`playerInHub`）与 phase 落在具体环节：

```
subStep（两个 phase 共用骨架）：
  combat.tickStatuses（全局照跑，状态倒计时只有一份）→ 计时器/重生
  → handleActions（换掌/跳照常，hub 内换掌 = 主副交换、无锁（契约 §4.4 v4.2）；
     `playerInHub` 时扇击前摇、技能、战斗冲刺被空挥闸拦下，ADR-33）
  → 位移积分 → 互推
  → 地面解算：playerInHub ? resolveHubGround（实心地板+隐形墙+台座柱体）: resolveGround
  → strike 结算（hub 内经 ADR-33 不会有 strike；即使有，applyHits 对 hub 内目标退回冲量）
  → stepHub（聚焦 focusGloveId / interact 装备 / 传送判定：portalReady ∧ 进门圆 ⇒ enterArena，
     放在掉落判定之前）
  → 掉落 KO（playerInHub 跳过）→ updateMatch（secondsLeft 照走，穿门时整体重置，契约 §4.1）
```

要点：

- **tick 顺序冻结为：input / ai → sim.step（内调 combat）→ getView → 事件消费 → render / HUD**。任何人不得在 render 或 ui 里改 state。hub 阶段编排层只采 p0 输入、**不调 `ai.think`**（ADR-28）；arena 阶段照旧。
- **插值归编排层**：`core/interp.js` 的 `lerpView(prev, cur, alpha)` 产出插值快照，renderer 直接绘制（修订 R1 ADR-12：不再把 alpha 附给 renderer）。瞬移（重生/换位/被拉）由 lerpView 按距离阈值或 view 标记跳过插值。
- `ai.think` 目前**每个模拟 tick 调用一次**；降频到 10Hz 是允许的优化而非契约，`think` 必须容忍任意调用频率（内部自带计时记忆）。
- 按键语义（冻结）：`slap` / `skill` 是**可长按**的持续位（sim 用冷却与相位机闸门）；`jump` / `dash` / `switchGlove` / `interact`（HUB-R1，ADR-32）是**边沿触发**——sim 在 `player.prev` 里自做上升沿检测，输入层长报 true 不会连发。
- **hit-stop（ADR-28）**：`main.handleEvents` 后由 `core/juice.js` 折算定格时长、`loop.hold(seconds)` 暂停累加器——sim 只是「晚一点被 step」，确定性与 60Hz 固定步语义不受影响。单次 ≤ 0.12s、同帧取最长、仅 `p0` 参与的命中触发。

## 3. HUD DOM 与 WebGL 分层

| 节点 | 层 | 所有者 | 内容 |
| --- | --- | --- | --- |
| `<canvas id="gl">` | 底层，全屏 | `render`（O2） | 三维场景。`touch-action: none`。 |
| `<div id="app">` | 上层 overlay | `ui`（O4） | 主菜单、HUD、结算、暂停、触控钮、虚拟摇杆区。 |

规则：

- HUD 不进 WebGL：血条/计分/掌意条/冷却全是 DOM。**样式契约归 F2**：`src/styles/**` 的 `.yz-*` 类名是 HUD 的正式皮肤，O4 的 shell 必须使用这些类名；`src/ui` 自带样式只保留「`src/styles` 一份都没加载到时」的 critical fallback（`loadSiblingStyles()` 返回 0 才生效）。
- `#app` 默认 `pointer-events: none`，只有具体控件开 `pointer-events: auto`。
- 安全区：触控控件容器用 `env(safe-area-inset-*)` 内缩；横屏优先、竖屏可玩由 CSS 布局切换。
- DOM 写入节流：`updateHud` 由 main 以 ~30Hz 间隔调用，内部再做脏检查；受击反馈、击杀播报即时。

## 4. 状态模型（MatchState）

完整字段见 `docs/API_CONTRACT.md` §4.1。以下是四件贴身机制在合并后代码里的定型。

### 4.1 台面碎裂 —— **方格网格（冻结，ADR-18）**

裂岛 = 半径 20 圆盘上的 **2.5m 方格**（`src/sim/arena.js`）：

- `createArena(radius, rng, tileSize = 2.5)`：`cols = ceil(2R / tileSize)` 的方阵裁剪到圆盘内，约 **208 块**。每块 `{ i, ix, iz, x, z, zone, seam, hp, maxHp, alive }`；`grid[iz*cols+ix]` 存下标（-1 = 盘外）。
- **中缝**：`|x| < ARENA.seamHalfWidth (1.9)` 的格子 `seam: true`，HP 更低（80 vs 120），更易先塌；`zone ∈ 0..3` 按象限归属。边缘格略脆（HP × 0.75..1.0），同 seed 的 rng 抖动保证确定性。
- **几何可推导**：渲染端由 `view.arena.{origin, tileSize, cols}` + 每块 `x/z` 自行建网格，state 不存顶点。
- **伤害入口唯一**：`sim` 导出的 `damageTileAt(state, x, z, amount)`（内部走 `floor.js/damageFloor`），保证事件（`tileCrack` / `tileBreak`）、`brokenCount`、`stats.tilesBroken` 三处一致。combat、技能、测试一律走它。
- **支撑判定**：`hasFloorUnder(state, x, z)`（内部 `isSupported`）——超出 `radius + 0.2` 或格子已碎即无地；无地进入下落，`y < MATCH.fallY (-8)` 判 ko。外环格碎掉后边线自然内缩，无需额外几何。
- **护栏**：物理层参数（`PHYSICS.railBlockSpeed (9)` / `railInset`）——站着走不出去、轻击退被拦；受击窗口 `kbT > 0` 且水平速度 ≥ 阈值的重击退穿栏而过。
- 已废除的拓扑：R1 的「2 半核 + 12 扇环板（14 块）」与 F3 `data/tiles.js` 的「3 环 × 24 扇 = 72 块」**都不是台面拓扑**。`data/tiles.js` 的 `TILE` 只保留伤害调参语义（对地伤害数值），其 `ringRadii / sectorsPerRing / quadrants` 字段不再具约束力。

### 4.2 双掌切换锁（switch lock）

- 玩家携 `gloveId`（槽 0）+ `offhandId`（槽 1），`activeSlot ∈ 0|1`。
- `switchGlove` 上升沿且 `alive && 不在前摇/出手 && 可行动` 时：`activeSlot ^= 1`，`switchLockT = MATCH.switchLock (0.4)`，`slapCd = max(slapCd, 0.2)`，发 `switch` 事件。
- `switchLockT > 0` 期间禁扇击、禁技能；移动/冲刺/跳不受限。
- **冷却是玩家级标量**：`slapCd` / `skillCd` 各一个，双掌共享（R1「按槽位记账」的 ADR-8 **已废除**，以合并后实现为准）。
- **hub 例外**（HUB-R2 实装，契约 §4.4 v4.2）：`playerInHub` 内换掌 = **主副槽交换、无锁**（`sim/hub.js swapHubLoadout`，`switch{slot:0}` 事件）；本节其余条目描述裂岛语义。

### 4.3 掌意与觉醒（awaken meter）

- `meter ∈ 0..1`。记账分两处（合并后实况，冻结）：**命中收支归 combat**（`combat/constants.js` 的 `METER`：打中 `+0.06`、被打 `+0.09`、技能命中 `+0.1`、弹反 `+0.18`、非觉醒时每秒衰减 `0.008`），**击杀奖励归 sim**（`PHYSICS.meterPerKill = 0.15`——combat 看不到出局判定）。空挥不加。
- 满条自动触发：`combat.tickStatuses` 在 `meter >= 1` 且未觉醒时置 `awakenedT = 8`（`AWAKEN.duration`，与 `MATCH.awakenDuration` 同值）、`meter = 0`；`awaken` / `awakenEnd` 事件经 combat-bridge 翻译后由 sim 代发（ADR-22）。无手动引爆（ADR-7 沿用）。
- 觉醒是**人的状态**：`awakenedT > 0` 时对当前激活掌生效，换掌 buff 跟着走。combat 经 `applyAwaken(attacker, glove)` 取覆盖后的派生副本，**绝不改写 GLOVES**。
- 重生（`respawnPlayer`）：`awakenedT` 清零、`meter = min(meter, 0.35)`（保留一部分，防雪球）。

### 4.4 事件流

- `state.events` 每次 `step` 开头清空、步内追加（上限 `PHYSICS.maxEvents = 96`），`pushEvent` 自动盖 `t = state.time` 戳；`getView` 逐条浅拷贝进快照。
- **sim 是唯一事件发射者（ADR-22，由桥执行）**：动作/命中/出局/碎地/胜负事件由 sim 直发；combat 在解算中 push 的事件先落进 combat-bridge 的暂存缓冲，由桥翻译成 sim 词表（`awaken/awakenEnd/parry/meteorImpact/ghostSlap`，并补 `tileBreak` 记账）后进 `state.events`，其余暂存事件丢弃（sim 已发等价事件）。`state.events` 里永远只有 `API_CONTRACT.md` §10 词表（camelCase：`slap` `hit` `ko` `tileBreak` …）。大厅轮词表新增 `hubFocus / hubEquip / hubLocked / hubPortalNear / enterArena / enterHub`（契约 §10 登记，sim 直发）；`hubDeny` 与 `phaseChange` 是从未实装的死名（契约 §0-②③），禁止对其写测试/分派。
- **手感轮补充（ADR-27）**：`hit` 事件携带 `gloveId`（结算时攻击者激活掌，`HitRecord.gloveId` 优先）与 `skillId`（handler id，null = 素掌）；桥代发的三个 combat 事件补齐 `gloveId / skillId`。VFX / 音效按这两个 id 分派。

### 4.5 皮肤与残影（手感轮新增）

两条纯装饰数据流，都不回写模拟：

```
皮肤  save.skinId ──O4──► createMatch({skinId, botSkinIds}) ──O1──► player.skinId
      （sim 视为不透明字符串）──getView──► view.players[].skinId ──O2──► resolveSkin 建外观
残影  combat/skills.js 建 ghost{ttl0,…} ──O1 经桥 ghostsView（yaw ±π 还原）──►
      view.combat.ghosts ──O2──► 半透明分身（必须可见）
```

细则见 ADR-26 / ADR-27 与 API_CONTRACT §3.2、§4.3、§5.1。

### 4.6 双区状态机（hub / arena，ADR-29/30/31，冻结）

```
createMatch() 缺省 phase='hub'（O1 已落地）     skipHub / phase:'arena' 进裂岛
   ▼                                          ▼
┌─ phase = 'hub' 安全区大厅 ─────────┐   ┌─ phase = 'arena' 裂岛格斗区 ──────┐
│ p0 出生在走道一端                   │   │ 既有规则：扇击/技能/击退/碎地     │
│ 8 座展掌（每侧 4）· 靠近聚焦        │   │ bots 开打；对局计时自进入本区起算 │
│ interact 装备主/副（未解锁拒绝）    │──►│                                  │
│ 无击退·无掉落·Bot 静默              │   │                                  │
│ portalReady ⇔ 主掌已选             │   │                                  │
└──── portalReady ∧ 进门半径 ────────┘   └──────────────────────────────────┘
```

**一份 state 承载双区**。安全区走道与裂岛**水平错开**（走道 z≈-120）；规则按实体所处空间生效（`playerInHub`），所以把人摆在裂岛坐标上的旧测仍走裂岛规则。`portalReady ⇔ !!hub.mainGloveId`；传送触发是**圆形 `portal.radius`**（契约 §0-⑤）。布局表 F3 `data/hub.js` 已合入，装配层经 `wireSimDeps → installData`（或 `installHubLayout`）交给 sim，缺席时 `sim/hub.js DEFAULT_HUB_LAYOUT` 兜底（`getDeps().usingDataHub` 报真源）。回程 `enterHub(state)` 是壳层 API（发 `enterHub` 事件），`step` 内的传送单向 hub → arena（发 `enterArena` 事件）——事件名即 API 名，v4 的 `phaseChange` 是从未实装的死名（契约 §0-②）。

## 5. 移动端与自适应

### 5.1 输入所有权与坐标系（ADR-16 / ADR-17）

**朝向约定（全项目唯一，冻结）**：`yaw = 0` 面向 **-Z**，与 three 的 `mesh.rotation.y` 同向——渲染端直接 `mesh.rotation.y = player.yaw`。

```
forward(yaw) = ( -sin(yaw), -cos(yaw) )     // xz 平面
right(yaw)   = (  cos(yaw), -sin(yaw) )
面向 +X ⇔ yaw = -PI/2
```

相机 yaw 用**同一约定**（相机水平朝向 = `forward(cameraYaw)`）。`input.sample(cameraYaw)` 把摇杆/WASD 的**屏幕系**矢量（`sx` 右为正、`sy` 前为正）换算成**世界系** `moveX/moveZ`：

```
moveX = sx·cos(θ) − sy·sin(θ)
moveZ = −sx·sin(θ) − sy·cos(θ)             // θ = cameraYaw；两种 lookMode 同一条公式
Input.yaw = cameraYawToSimYaw(θ)            // lookMode='locked'（缺省）：期望面朝 = 相机
                                            // 水平前向的 sim 角（HUB-R3 版曾误写「= cameraYaw」，
                                            // 相机角从不直接进 sim——LOOK-R1 按实现更正）；
                                            // 'free' 的产出见 §5.1.2；null = 保持当前朝向
```

sim 收到的就是世界系（`moveSpace` 缺省 `'world'`；`'local'` 仅供测试）。**sim 不懂相机**。

**手感轮修订（ADR-25，冻结）：朝向换算只剩两处适配点。** R3 版本曾把 `core/view.js toRenderView`（`RENDER_YAW_OFFSET = π`）列为第三处，其前提「render 按 yaw=0 朝 +Z 搭建」是**错误的事实陈述**——`src/render/camera.js` 把机位放在 `focus + (sin yaw, cos yaw)·dist`（正是 -Z 约定下的「身后」），`src/render/characters.js` 的模型脸/鞋尖/掌心朝 -Z、`rotation.y` 直用，两者都是 **-Z 原生**。再加 π 的后果链条：相机吃 `simYaw + π` → 机位落到角色**正面** → 画面整体 180° 反 → W 朝镜头走、A/D 镜像、鼠标右移画面左转——这就是键鼠整轴反转的根因。裁定：**`RENDER_YAW_OFFSET` 冻结为 0**，`toRenderView` 对 yaw 恒等透传（导出名保留），render 直接消费 -Z yaw、**零补偿**。合法换算点只剩：

1. `sim/combat-bridge.js`（combat 内部 `yaw=0 朝 +Z`，`FACE.combatOffset = ±π`；含 `view.combat.ghosts` 导出时的 yaw 还原，见 ADR-27）；
2. `core/view.js` 的 `cameraYawToSimYaw / simYawToCameraYaw`（input 内部相机方位角 ↔ sim yaw）。

**除上述两处外任何文件不得出现朝向换算；render 不是适配点。**

#### 5.1.1 键鼠语义（验收线，冻结）

- **W = 镜头水平前方**（屏幕深处、远离相机），S 后退，**A = 屏幕左，D = 屏幕右**；触屏摇杆与 WASD 同一套映射。
- **鼠标右移（+dx）= 角色与镜头右转**（从上方 +Y 往下看为**顺时针**）。
- 测试锚点（G1 按此锁死；θ = input 内部相机方位角，forward = `(cos θ, sin θ)`）：
  - 纯 W：`sample(θ)` 的 `(moveX, moveZ) = (cos θ, sin θ)`——与相机水平前向同向同号；
  - 纯 D：`(−sin θ, cos θ)`（屏幕右）；A/S 取反；
  - `cameraYawToSimYaw` 对 θ **单调递减**（`ds/dθ = −1`）：+dx ⇒ θ 增大 ⇒ sim yaw 减小 ⇒ `forward(simYaw)` 从上方看顺时针转 ⇒ 右转；
  - 换算后前向一致：`(−sin s, −cos s) = (cos θ, sin θ)`，其中 `s = cameraYawToSimYaw(θ)`。
- 相机跟随成立判据：`RENDER_YAW_OFFSET = 0` 时相机机位在角色**身后**（`focus + (sin s, cos s)·dist`），屏幕前向 = 角色前向，W 远离相机。`core/view.test.js` 原「补 π」断言改为「yaw 原样透传」（O4）。

分工不变：**ui 建 DOM（`data-yz-*` 标记），input 绑事件**。相机朝向状态（yaw/pitch/lookMode）归 input 所有，导出 `getLook()` / `setLook()` / `getLookMode()` / `setLookMode()`；main 把 `getLook().yaw` 回传给 `sample`，机位则吃**换算后的 simYaw**（`feedLook`，§5.1.2——render 拿到的水平角永远已是 sim 空间，不是 input 的相机方位角原值）。禁止锁敌自动瞄（种子红线）。

#### 5.1.2 视角模式与机位喂入（视角轮 Round 1，冻结；ADR-37/38/39）

**机位喂入数据流（唯一形状；R2 按合入实现更新 payload 形状）**：

```
input.getLook() ──► core/look.js lookPayload：{ yaw(=simYaw 同值，v4.4 更正——
                    相机系角不出输入层), pitch, simYaw = cameraYawToSimYaw(yaw),
                    lookMode(随帧透传，缺省收 'locked') }
                ──► renderer.setLook：simYaw 优先落 lookYaw（有 simYaw 键绝不读 yaw 键；
                    无 simYaw 键时把 yaw 当 sim 角收）；lookMode 键 = 每帧覆盖渲染器的
                    模式镜像 ──► cameraRig.update(…, _followYaw(local), …)
                    （locked ⇒ 角色自身 yaw；free ⇒ lookYaw ?? 角色 yaw，契约 §14-35）
```

修掉的 bug（本轮根因）：`feedLook` 曾让 payload 的相机系 `yaw` 落进 `renderer.lookYaw`，`sync` 的 `lookYaw == null ? local.yaw : lookYaw` 把相机系角当 sim 角用——两套角零点/旋向不同，镜头方位随 θ 值域扭来扭去，即用户说的「视角转换很奇怪」。收口后 `lookYaw` 全生命周期只见 sim 空间（契约 §7.1，ADR-37）。

**`lookMode: 'locked' | 'free'`（ADR-38，状态住 input，缺省 `locked`）**：

| | `locked`（产品缺省 = 固定人物视角） | `free`（可切回的高级项） |
| --- | --- | --- |
| 人物水平面向 | ≡ 相机水平前向：`sample` 产出 `Input.yaw = cameraYawToSimYaw(θ)`，sim 直赋（无平滑）⇒ 逐 tick 1:1 | 与镜头解耦：有移动 ⇒ `Input.yaw = atan2(-moveX, -moveZ)`（面朝走向，= `sim/math.js yawFromDir`）；零移动 ⇒ `null`（sim 的 `Number.isFinite` 门不覆盖，保持朝向） |
| 机位跟随角（R2 按实现登记，契约 §14-35） | 绕**角色自身 yaw**——喂入的 lookYaw 拧不动机位；1:1 不变量保证它与视线同值，镜头钉身后、壳层没喂/晚一帧也不绕到正脸 | 绕 `lookYaw`（视线 sim 角）；没喂回落角色 yaw。机位公式同一条（`focus + (sin, cos)·dist` 即身后），变的只是绕的角选谁 |
| pitch | 自由上下看（ADR-35 通路不变） | 同左 |
| 移动换算 | §2 公式，W = 镜头水平前方 | 同一条公式（移动永远相对相机） |

**sim 与 view 快照不感知 lookMode**；渲染器持有的是 payload 每帧覆盖的**随帧镜像**（R2 按实现修订 ADR-38 措辞——运行期权威仍唯一住 input，镜像活不过一帧、不构成第二状态源）。模式对模拟的全部影响收敛在 input 的 `Input.yaw` 产出。切换四通道（键 V / 设置项 / `?look=locked|free` / 存档 `lookMode`）与初值取值链见契约 §13.2；老档缺失补 `'locked'`。

**Round 2 收口（LOOK-R2，已落地）**：Round 1 合入的 `input.sample()` 曾未分派——恒走 locked 分支送 `cameraYawToSimYaw(θ)`，free 行为等同 locked（F4 曾判 **LK-04 FAIL**）。Round 2 O4 已按上表落地三分支分派（`src/input/index.js`：locked ⇒ `cameraYawToSimYaw(θ)`；free 有移动 ⇒ `yawFromDir(moveX, moveZ)`、零移动 ⇒ `null`——WASD 对冲合成零矢量落回 null，不送 NaN），G1 按契约 **§14-34** 封闭表锁测（`input/index.test.js`、`tests/look-round2-lk04.test.js`）、G2 探针带 locked/free 双段读数、F4 重判 **LK-04 PASS**。上表 free 列的 sim 半边（`yaw: null` 不覆盖门）与 render 半边（跟随角选源，§14-35）自 Round 1 起在位——三段现已全部闭环。Round 3（LOOK-R3）余项归 `OWNERSHIP.md` §3.2：O2 机位复核补交（free vs locked 半平面渲染锁、切 V 不误触发 snap）、实机/无头冒烟。值域封闭红线原样：相机方位角 θ 原值任何模式不得出现在 `Input.yaw`，**禁止第四套朝向**、`RENDER_YAW_OFFSET` 恒 0。

**过门机位 snap（ADR-39）**：hub（z≈−120）与裂岛（原点）水平错开，phase 切换时跟随目标单帧瞬移 ~120m——弹簧相机会飞越全程（贴脸/穿模/晕眩）。裁定：渲染句柄冻结追加 `snapCamera()`（阻尼状态立即置稳态，契约 §7.1）；O4 在开局 / `enterArenaFx` / `enterHubFx` 按 `input.setLook → feedLook → snapCamera` 顺序调用（契约 §13.2）；第二道保险 = `sync` 内目标单帧位移 > `CAMERA_SNAP_TELEPORT`（60m）自动 snap，局内重生瞬移（≤ 40m）不触发、甩镜手感保留。与 `lerpView` 传送帧跳插值（ADR-31）叠加：角色不滑步、机位不飞行。

### 5.2 画质自动分档 + DPR 封顶

DPR 全局封顶 2（main 的 `applyResize` 计算并传 `renderer.resize`）。三档定义不变：

| 档 | 渲染 DPR | 阴影 | 粒子预算 | 其他 |
| --- | --- | --- | --- | --- |
| high | min(dpr, 2) | 1 盏定向光 2048 PCF | 100% | 全材质、碎块坠落网格 |
| mid | min(dpr, 1.5) | 贴地模糊假影 | 60% | 简化雾 |
| low | 1.0 | 圆盘假影 | 30% | 合批简化材质、碎裂用静态贴花 |

自动测档：`core/quality.js` 的 `createQualityProbe` 开局 mid 采样 2s 帧时，结果经 `renderer.setQuality(tier)` 生效；局中只降不升；玩家手动选档（存档 `quality`）后关闭自动逻辑。**探测归 core，执行归 render**——main 的 probe 必须真正调用 render 的 `setQuality`（R2 验收点）。后处理（bloom 等）只允许 high/mid 开，**low 档必须关 bloom**（R3 验收点）。

### 5.3 后台暂停

`visibilitychange → hidden`：loop 停步进并清累加器、出暂停幕。恢复必须显式点按（同一手势顺带 `audio.unlock()`）。回前台后保持在暂停面板，等玩家自己点继续。

## 6. 确定性与联网预留

- `sim / combat / ai` 内**禁用 `Math.random`**。模拟随机数用 sfc32，状态是 `state.rng = { a, b, c, d }` 四个普通整数——`structuredClone(state)` 后从任意帧继续步进逐位一致。
- **确定性契约只约束 sim**：同 seed + 同输入序列 + 同 dt ⇒ 逐位相同 state。Bot 的 rng 由编排层提供（`think(view, botId, rng)` 的 `rng` 参数，`() => number`）；产线用墙钟播种、不参与回放契约，测试传固定种子即可全链确定。
- `step(dt)`：`dt > 1/60` 自动切成等长子步（`PHYSICS.maxSubStep`），60Hz 与 30Hz 手感一致；`dt` 上限 0.25。

## 7. 存档

- 唯一 key：**`yizhang-save-v1`**（localStorage，JSON），schema 冻结在 `API_CONTRACT.md` §12。
- **唯一读写者是 `src/core/storage.js`（O4 所有）**——R1「归 ui」的说法修订为此；ui/shell 经它的 `loadSave / updateSave / unlockGlove / recordMatch` 存取，sim/render/input/audio 一概不碰。
- 读取失败/版本不符 ⇒ 回默认值并覆写；未知字段写回保留；破坏性改 schema ⇒ 换 key `yizhang-save-v2` + 迁移。

## 8. 性能预算（G2 的 bench/probe 按此断言）

| 项 | 预算 |
| --- | --- |
| `sim.step`（1 人 + 3 bot + ~208 tile） | ≤ 1ms/tick（合并后实测 p99 ≈ 0.04ms，余量充足） |
| 渲染帧时 | high 档桌面 ≤ 8ms；mid 档中端手机 ≤ 14ms |
| Draw calls / 三角形（high 档） | < 150 / < 120k（全场景；方格台面必须合批/Instanced） |
| Draw calls / 三角形（mid 档，= SOTA L3-10） | **≤ 120 / ≤ 80k**。Round 3 O2 合入后实测（`getStats()` 读 `renderer.info`，契约 §7）：**hub 峰值 ≈ 94 draw / 47.8k tris、arena ≈ 117 draw / 70.0k tris——两区均在预算内**。前提与手段见 ADR-36：hub 阶段裂岛子树整棵关、arena 阶段关 hub |
| GC 压力 | `step` 热路径零分配目标；`getView` 每 tick 一次快照分配可接受 |
| 启动 | 首屏可交互 < 3s（4G 模拟），three 按需只进 `render` chunk |

## 9. 部署与端口

- 开发/预览端口 **4181**（`vite.config.js` strictPort）。`base: "./"` 相对路径构建。workflow 由父调度器接，子代理不碰 `.github/`。

## 10. 决策记录（ADR）

R1 裁定（1–15）中仍然有效的沿用；被 Round 2 推翻的标注「已废除/修订」；Round 3 的修订与新增（19/21/22 修订，23/24 新增）与**手感轮（17 修订，25–28 新增）**、**大厅轮（29–32 新增；R2 33–35、R3 36 新增）**、**视角轮（37–39 新增）**已并入下表。**实现一律以最新裁定为准。**

1. **render/input/audio 模块级单例**：`createX` 初始化内部单例并返回句柄，模块级函数操作该单例。（沿用）
2. **Input 坐标系**：input 层完成相机系→世界系换算，sim 不懂相机。（沿用，公式收紧见 ADR-17）
3. **按键语义**：`slap/skill` 可长按（冷却闸门），`jump/dash/switchGlove` 边沿触发且由 **sim 的 `prev` 边沿检测**兜底。（修订：不再要求 input 闩锁单帧脉冲，sim 侧检测为准）
4. **相机朝向归 input**：look 状态住在 input，导出 `getLook()/setLook()`。（沿用）
5. **combat 解析器副作用**：`resolveSlap/resolveSkill` 可就地改 state 并返回结果对象，sim 据此记账与发事件；`now = state.time`。（沿用，返回形状冻结见 API_CONTRACT §5）
6. **事件生命周期**：`state.events` 每 step 开头清空；`getView` 拷贝；main 消费。（沿用）
7. **觉醒触发**：满条自动、觉醒是玩家态、死亡清 `awakenedT`；重生时 `meter` 截到 0.35。（沿用+细化）
8. ~~冷却按槽位持久化~~ **已废除**：冷却是玩家级标量 `slapCd/skillCd`，双掌共享。
9. ~~台面 = 14 块扇环拼板~~ **已废除**：见 ADR-18。
10. **击杀归属**：`lastHitBy` 窗口 = `PHYSICS.killCreditWindow` = **5s**（R1 的 3s 修订为实现值）；窗口外算自坠。到点比杀数→比死数→按玩家序取先者（本版无 draw）。
11. **RNG 无闭包**：随机数状态是 state 里的普通数字字段。（沿用）
12. ~~alpha 附给 renderer 自行 lerp~~ **修订**：插值由 `core/interp.js` 的 `lerpView` 在编排层完成，renderer 收到已插值快照。
13. **DPR 责任分割**：main/core 封顶 2，renderer 档位内再降采样。（沿用）
14. **HUD 节流**：main 以 ~30Hz 调 `updateHud`，内部再脏检查。（沿用，频率按实现修订）
15. **AI 决策频率**：~~固定 10Hz~~ **放宽**：每 tick 调用是现状，降频是优化选项；`think` 必须与调用频率无关。
16. **人类玩家 id = `p0`（新，冻结）**：sim 已定 `p0`、bot 为 `b0..b2`——**外壳跟随 sim**。`src/main.js` 的 `SELF_ID`、`core/fallback/sim.js` 的人类 id、render 的 `localId/followId` 缺省值全部改 `p0`。任何层不得再出现 `p1` 作为人类 id。
17. **yaw = 0 面向 -Z（冻结；手感轮修订）**：`forward = (-sin yaw, -cos yaw)`。相机 yaw、`Input.yaw`、`view.players[].yaw`、测试 helpers 同一约定；摇杆→世界系换算公式见 §5.1。**sim / render / camera 全链同一基，render 零补偿**。合法换算点只剩两处：`sim/combat-bridge.js`（combat ±π，含 ghosts 导出还原）与 `core/view.js cameraYawToSimYaw / simYawToCameraYaw`（相机方位角）。R3 曾列的第三处（`toRenderView` +π）经 ADR-25 裁定废除；不得新增任何新的换算点。
18. **台面拓扑 = sim 方格网格（新，冻结）**：`src/sim/arena.js` 的 2.5m 方格圆盘（约 208 块）是唯一拓扑，`view.arena` 的形状即渲染输入。理由：sim 侧支撑/伤害/重生/probe 全链已在此拓扑上通过，render 只需按 `origin/tileSize/cols + tiles[].x,z` 建板即可；而改 sim 迁就 72 扇环要重写 arena/floor/spawn 全部逻辑。**O1 保持、O2 消费、O3 走 `damageTileAt`，禁止发明第四套拓扑。**
19. **依赖接线 = 静态桥（修订于 R3）**：`src/sim/deps.js` 静态 `import "../data/gloves.js"`（运行时权威掌表）与 `"./combat-bridge.js"`（其内静态 `import "../combat/index.js"`）——生产路径零动态注入，**import sim 即已接线**。`installData/installCombat/resetDeps` 保留**仅供测试替身**，`autoWireOptionalDeps` 已删除。main 启动断言 `getDeps().usingRealData && usingRealCombat` 为 true（为假 = 替身泄漏，亮降级横幅），传给 shell/render 的掌表与 MATCH 一律取自 `sim.getGloves()/getMatchConfig()`。**R3 必改**：`core/modules.js` 的 `wireSimDeps` 注入路径与 `alignSkillIds` 删除（O4）、`scripts/harness.mjs` 的 `installSimulationDependencies` 不再 install（G2）——向已接线的 sim 再 install 真实模块＝绕过桥，见 ADR-24。
20. **isMatchOver 即时判定（新，冻结；HUB-R2 按实现改写计时域）**：`isMatchOver(state)` 是**纯读的活谓词**，不要求先 `step`：`over ⇔ state.match.over ∨ ∃p: p.kills ≥ killsToWin ∨ (state.time − match.startTime) ≥ matchSeconds`——计时锚是 `match.startTime`（createMatch 时 0，`enterArena` 时重置为当时 time），「挑掌不吃对局时长」由**传送重置**实现而非 hub 冻结；`isMatchOver` 不看 phase，壳层在 hub 阶段不消费 over（main 以 `over ∧ phase !== 'hub'` 收结算）。`phase:'arena'` 开局与旧语义逐位一致。调用不改 state、不发事件；`step` 内的 `updateMatch` 仍负责把结果缓存进 `state.match` 并发 `matchOver` 事件——**事件需要 step，布尔真值不需要**。语义细则见 API_CONTRACT §4.1。
21. **降级政策：单产线路径（修订于 R3）**：产线路径 = 真实模块。`core/fallback/**`（O4 降级件）只在**模块 import 失败/缺席**时于启动期挂载（`loadSiblingModules` 捕获），且必须亮降级横幅；**局中不换件**——真实 sim 已加载后其运行期异常按错误暴露（暂停+提示），不得静默切到占位模拟。sim 侧的兜底战斗（`sim/fallback-combat.js`）已在 R2 删除：combat 经桥静态 import，坏了即 sim 整体 import 失败，降级单位是**整个 sim**（换 `core/fallback/sim.js`），不存在「sim 真、combat 假」的中间态。所有 fallback 件必须遵守冻结约定（p0、-Z、方格 view 形状），保证换件不换协议。
22. **sim 是唯一事件发射者（修订于 R3：由桥执行）**：`state.events` 里只允许 API_CONTRACT §10 词表。combat 解算中 push 的事件被 combat-bridge 的暂存缓冲截获，翻译（`awaken/awakenEnd/parry/meteorImpact/ghostSlap` + `tileBreak` 记账）后由 sim 代发，未登记的暂存事件丢弃。O4 的 `core/view.js normalizeEvent` 是 shell 内部适配（`ko → killerId/victimId` 等），不改变线上词表。
23. **技能 id：两套词表 + 一张别名表（新，冻结）**：数据 id（`quake_slam / wind_rush / frost_arc / coil_counter / phantom_swap / iron_pull / sky_fall`，木棉为哨兵 `"none"`、禁 null）是公共词表——`GloveDef.skillId`、图鉴、GDD 用它；handler id（`groundPound / dashSlap / frostArc / parry / blinkSwap / magnetPull / meteorSlam`）是 combat 的分派键——`skill` 事件与 `HitRecord.skillId` 携带它。两者之间**只有一张翻译表**：`src/sim/combat-bridge.js` 的 `SKILL_ALIAS`（`combatSkillId()` 是唯一运行时翻译点），全表冻结在 API_CONTRACT §3.1。重复副本 R3 删除：`data/skills.js` 的 `SKILL_COMBAT_ALIASES`（F3）、`core/modules.js` 的 `SKILL_ALIASES + alignSkillIds`（O4）。combat 内部的宽容归一化表（`combat/skills.js`）是防御性实现细节，不具规范地位、不得新增依赖。
24. **接线标志语义（新，冻结）**：`usingRealCombat === true ⇔ combatMod === null ⇔ 生产静态桥在岗`；`usingRealData` 同理。`installCombat / installData` 传**任何非 null 模块**都会把标志置 false——即使传的是真实 `src/combat` 命名空间，因为绕过桥（朝向换算、命中翻译、事件消化全丢）就不是产线路径。所以「标志为 false」读作**「测试替身在场」**，不是「combat 缺席」。产线与探针的正确姿势是**什么都不装**、直接断言两标志为 true；R2 探针误报 `usingRealCombat: false` 的根因正是先 install 再测。
25. **渲染朝向零补偿（手感轮新增，冻结）**：`core/view.js` 的 `RENDER_YAW_OFFSET` 必须为 **0**，`toRenderView` 对 `players[].yaw` 恒等透传。依据见 §5.1。**任何人不得用「再加一个偏移」的方式修方向问题**。
26. **皮肤 = 纯装饰数据流（手感轮新增，冻结）**：见 API_CONTRACT §3.2。sim 视 skinId 为不透明字符串。
27. **每掌 VFX = 事件驱动 + 按 id 分派（手感轮新增，冻结）**：分派键是事件上的 `gloveId` / `skillId`。`view.combat.ghosts` 必须可见。
28. **hit-stop 归编排层（手感轮新增，冻结）**：`core/juice.js` + `loop.hold`，单次 ≤ 0.12s，禁止进 sim。
29. **双区状态机 `phase: hub|arena`（HUB-R1，冻结）**：一份 `MatchState` 承载安全区与裂岛。O1 缺省 `hub`；`skipHub` / `phase:'arena'` 给旧探针。禁止第二套模拟。安全区：走实心地板、无击退、无掉落 KO、Bot 静默。
30. **走道选掌（HUB-R1，冻结；R2 按实现补记）**：布局来源 `src/data/hub.js`（已合入，缺席时 `sim/hub.js` 默认表兜底，`installHubLayout` 供测试覆盖）。`interact` 上升沿：未解锁拒绝（`hubLocked{unlock}`），否则主空→主、**副掌再按提为主掌（原主退副）**、已是主掌 ⇒ `changed:false` 回执、副空→副、双满→换副（契约 §4.4 装备表）。
31. **传送门（HUB-R1，冻结；R2 按实现补记）**：`portalReady`（⇔ 主掌已选）且 xz 进入门触发圆（`portal.radius`，sim 不读 aabb）⇒ 同 tick `phase='arena'`，p0 到裂岛出生点，loadout 保留，`match.startTime` 重置，发 `enterArena{id,x,y,z}`。过渡归外壳；传送帧 `lerpView` 跳插值。
32. **`interact` 与 hub 期 Bot 静默（HUB-R1，冻结；R2 按实现补记）**：E 键双义（skill hold + interact），分流在 **input 侧**——`input.setPhase('hub')` 下 sample 把 slap/skill 归零、只出 interact（+interactSlot）；sim 侧 `p.prev.interact` 做上升沿。hub 不调 `think`；`think` 见 hub 视图（`isHubView` fail-safe）自返零输入。
33. **hub 空挥闸（HUB-R2 新增，冻结；归 O1）**：闸门是 `playerInHub(state, p)`（`phase==='hub'` **且**人在安全区体积内），不是 phase 全局开关。闸内 `handleActions` 不启动扇击前摇、不调 `resolveSkill`、不启动战斗冲刺——零 `slapStart/slap/skill/dash` 事件、`stats.slaps` 不涨。移动、跳、`interact`、hub `switchGlove`（主副交换、无锁）照常。把人摆在裂岛盘上的旧测仍可打。免战豁免（applyHits 对 hub 内目标退回冲量）是第二道保险。不变量见契约 §14-26。
34. **skinId 与 combat.ghosts 进 getView（HUB-R2 新增，冻结；O1 导出、O2 消费、G1 锁测）**：`getView().players[].skinId`——sim 视为**不透明字符串**原样透传（不校验、不 import skins.js，缺省 null，消费端 `resolveSkin` 兜底，ADR-26）；`view.combat.ghosts`——源 `state.combat.ghosts` 经桥 `ghostsView` 翻译（yaw 还原 -Z、数值 round、`ttl/ttl0` 齐全），**恒存在**（无残影 = 空数组）、纯 JSON。两个名字冻结为 `players[].skinId` / `combat.ghosts`，皮肤五段链（F3 表 → O4 传参 → O1 透传 → O2 换件）与残影双段接线（O1 导出 → O2 绘制）都以此为对接面。形状见契约 §4.3，不变量 §14-18/19。
35. **相机 pitch 通路（HUB-R2 新增，冻结；O2 开 API、O4 每帧喂）**：`input.getLook().pitch` 是俯仰的**唯一权威源**（ADR-4 同源）。渲染句柄冻结追加 `setPitch(pitch: number)`（弧度，render 内部 clamp 防翻转），O4 每 rAF 在 `sync` 前调用；O2 的 `cameraRig` 消费该值（内部签名自便，现状 `update(dt, focus, yaw, vel)` 不吃 pitch 即本条要修的断链）。禁止 render/ui 各自维护第二份 pitch 状态、禁止把 pitch 塞进 view 快照。
36. **双区渲染子树互斥（HUB-R3 新增，冻结；归 O2，L3-10 预算前提）**：安全区与裂岛在同一世界里错开（走道 z≈-120）、从来不同框，`view.phase` 决定哪棵子树整棵 `visible=false`——hub 阶段裂岛子树整棵关（台面 InstancedMesh 是 `frustumCulled=false`，不显式关会在走道上照画整座岛），arena 阶段安全区子树整棵关（R2 已有做法的反向补齐）。叠加手段：阴影贴图每帧只烘一次、mid 档辉光只画挡光替身层、角色按材质合批（识别色与皮肤本色走顶点色）、非本区角色远距剔除、碎岩/雾凇/裂纹贴花实例化。Round 3 实测 mid 档 hub 峰值 ≈94 draw / 47.8k tris、arena ≈117 / 70.0k——L3-10（≤120 / ≤80k）两区达标；测量口唯一 = 渲染句柄 `getStats()`（契约 §7）。降耗的视觉底线归 ART_DIRECTION §17 互锁合同：八掌 idle/战斗 VFX 不许合并、皮肤剪影不许砍，预算与 HV-04 盲辨在同一份 mid 档构建上验。
37. **机位 yaw 喂入 = sim 空间（视角轮 R1 新增，冻结；O2 收口 `setLook`、O4 收口 `feedLook`）**：凡是落进 `renderer.lookYaw` 的水平角必须已是 sim 空间（yaw=0 → -Z）。`setLook` 消费规则冻结于契约 §7.1：**`simYaw` 优先**（有 simYaw 键绝不读 yaw 键——feedLook 的 payload 里 `yaw` 是相机系调试读数）；无 simYaw 键时把传入 `yaw` 当 sim 角收；null 清除、回落跟角色自身 yaw。`core/look.js lookPayload` 恒携 `simYaw = cameraYawToSimYaw(yaw)`——换算点仍只有 ADR-17 的两处，本条不新增换算点、只堵住「喂错空间」这条路。根因见 §5.1.2；全项目**只有两套角空间**（相机系 / sim 系），禁止第四套（契约 §1-11）。**R2 按实现补记**：合入的 `lookPayload` 比原裁定更严——`payload.yaw === payload.simYaw`（同值同空间，键集恰 `{yaw, pitch, simYaw, lookMode}`），相机系角**根本不出输入层**，「渲染器不得消费相机系角」由「链路上没有相机系角」保证；simYaw 优先规则原样保留（防直连调用方只给 `yaw` 键的空间歧义）。唯一相机系读数出口 = `input.getLook().yaw`。裁定本体不变。
38. **`lookMode: 'locked'|'free'`（视角轮 R1 新增，冻结；状态归 input，O4 接通道）**：`locked`（**产品缺省** = 固定人物视角）——`sample` 产出 `Input.yaw = cameraYawToSimYaw(θ)`，sim 直赋 ⇒ 人物水平面向与相机水平前向逐 tick 1:1，镜头钉身后，pitch 仍自由；`free`——面向与镜头解耦：有移动 ⇒ `Input.yaw = atan2(-moveX, -moveZ)`（面朝走向，同空间求角、非换算点），零移动 ⇒ `null`。移动换算两模式同一条公式（W 永远朝镜头前方）。**sim 与 view 快照不感知 lookMode**；禁止第二份**运行期权威**副本。切换四通道：键 V（KeyV，边沿 toggle、不占既有键）、设置项、`?look=locked|free`（仅本会话、不回写）、存档 `lookMode`（老档缺省 `'locked'`）。缺省 locked 下 `sample` 行为与 v4.2 逐位一致——既有 557 测零回归。**R2 按实现修订两处**：① 原「renderer 不感知」收窄为上句——合入实现（F4 已验、`render/look.test.js` 锁定）给渲染器一份 **payload 每帧覆盖的随帧镜像**（`setLook` 的 `lookMode` 键 / `setLookMode/getLookMode`），驱动机位跟随角选源（locked ⇒ 角色自身 yaw，喂入 lookYaw 拧不动；free ⇒ lookYaw ?? 角色 yaw——契约 §7.1/§14-35）；镜像活不过一帧，不构成第二权威，禁令原意「防状态分叉」不变。HUD 的 `#hud[data-look]` 同理是展示镜像。② **实装缺口点名（Round 2 P0，归 O4；R3 补记：已落地）**：Round 1 的 `sample()` 曾未分派、恒走 locked 分支（F4 曾判 LK-04 FAIL）——Round 2 input 分派已按契约 §14-34 封闭表合入 `src/input/index.js`（free 的 sim 半边与 render 半边自 Round 1 在位，三段闭环），G1 锁测、F4 重判 **LK-04 PASS**。回调路径按实现更正：触发 `onLookModeChange` 的是 KeyV / `toggleLookMode()`，`setLookMode` 是静默 setter（契约 §8/§14-29）。裁定本体（值域、缺省、四通道、分派公式）不变。
39. **过门相机 snap（视角轮 R1 新增，冻结；O2 实现、O4 调用）**：渲染句柄冻结追加 `snapCamera()`——跟随相机全部阻尼状态（pos/look/yaw/pitchBias/dist/lead）立即置为「当前跟随目标 + 当前 lookYaw/lookPitch」稳态、清 shake/fovKick，幂等，无本地玩家时 no-op。调用点与顺序冻结（契约 §13.2）：开局 / `enterArenaFx` / `enterHubFx` 按 `input.setLook → feedLook → snapCamera`。第二道保险归 O2：`sync` 内跟随目标单帧位移 > `CAMERA_SNAP_TELEPORT`（60m）自动 snap——hub↔arena（~120m）必触发、局内重生瞬移（≤ 2×radius = 40m）必不触发（甩镜手感保留）。snap 后相机-目标距离 ≤ `CAMERA_SNAP_MAX_DIST`（20m）且机位在视线反向半平面（身后）。禁止用「调大阻尼系数」冒充 snap——稳态置位是语义，不是调参。
