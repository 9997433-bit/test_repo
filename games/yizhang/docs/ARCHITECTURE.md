# 异掌 · 架构总纲（Round 3 · Fable-1 冻结版）

> 状态：**冻结（R3）**。Round 2 十路已合入 `cursor/yizhang-db8d`，本文按**合并后的实际代码**定基：R2 裁定（ADR-16…22）除本文标注「修订于 R3」处外全部沿用，本轮新增 ADR-23（技能 id 词表与别名表）与 ADR-24（接线标志语义）。与旧版文档冲突处一律以本文 §10 的 ADR-16…24 为准。变更流程不变：先改本文与 `docs/API_CONTRACT.md`、在提交信息中声明，再改代码。

## 0. 一句话架构

**纯数据模拟核**（`sim` / `combat` / `data` / `ai`，零 DOM、零 three、可 `structuredClone`）＋ **单向视图流**（`getView` 纯 JSON 快照）＋ **可整体替换的外壳**（`render` / `input` / `audio` / `ui`），由 `main.js` + `core/loop` 以固定 60Hz 步进驱动、渲染插值；HUD 走 DOM，与 WebGL 画布完全分层，互不感知。

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
5. renderer.sync(view)                        # renderer 收到的已是插值后的快照
6. shell.updateHud(curView, 'p0')             # 节流 ~30Hz
```

`sim.step` 内部顺序（`src/sim/step.js`，冻结）：

```
清 events（每次 step 一次，所有子步共用事件缓冲）；随后每个子步：
combat.tickStatuses（状态倒计时·掌意衰减·满条觉醒·返回延迟命中交 sim 记账）
→ 计时器/重生 → 动作处理（换掌/冲刺/跳/扇击前摇/技能）
→ 位移积分 → 玩家互推 → 地面/护栏解算 → 前摇到帧的扇击结算（combat.resolveSlap 经桥）
→ 掉落判定（y < fallY 或出盘无支撑 ⇒ ko）→ updateMatch（胜负缓存 + matchOver 事件）
```

要点：

- **tick 顺序冻结为：input / ai → sim.step（内调 combat）→ getView → 事件消费 → render / HUD**。任何人不得在 render 或 ui 里改 state。
- **插值归编排层**：`core/interp.js` 的 `lerpView(prev, cur, alpha)` 产出插值快照，renderer 直接绘制（修订 R1 ADR-12：不再把 alpha 附给 renderer）。瞬移（重生/换位/被拉）由 lerpView 按距离阈值或 view 标记跳过插值。
- `ai.think` 目前**每个模拟 tick 调用一次**；降频到 10Hz 是允许的优化而非契约，`think` 必须容忍任意调用频率（内部自带计时记忆）。
- 按键语义（冻结）：`slap` / `skill` 是**可长按**的持续位（sim 用冷却与相位机闸门）；`jump` / `dash` / `switchGlove` 是**边沿触发**——sim 在 `player.prev` 里自做上升沿检测，输入层长报 true 不会连发。

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

### 4.3 掌意与觉醒（awaken meter）

- `meter ∈ 0..1`。记账分两处（合并后实况，冻结）：**命中收支归 combat**（`combat/constants.js` 的 `METER`：打中 `+0.06`、被打 `+0.09`、技能命中 `+0.1`、弹反 `+0.18`、非觉醒时每秒衰减 `0.008`），**击杀奖励归 sim**（`PHYSICS.meterPerKill = 0.15`——combat 看不到出局判定）。空挥不加。
- 满条自动触发：`combat.tickStatuses` 在 `meter >= 1` 且未觉醒时置 `awakenedT = 8`（`AWAKEN.duration`，与 `MATCH.awakenDuration` 同值）、`meter = 0`；`awaken` / `awakenEnd` 事件经 combat-bridge 翻译后由 sim 代发（ADR-22）。无手动引爆（ADR-7 沿用）。
- 觉醒是**人的状态**：`awakenedT > 0` 时对当前激活掌生效，换掌 buff 跟着走。combat 经 `applyAwaken(attacker, glove)` 取覆盖后的派生副本，**绝不改写 GLOVES**。
- 重生（`respawnPlayer`）：`awakenedT` 清零、`meter = min(meter, 0.35)`（保留一部分，防雪球）。

### 4.4 事件流

- `state.events` 每次 `step` 开头清空、步内追加（上限 `PHYSICS.maxEvents = 96`），`pushEvent` 自动盖 `t = state.time` 戳；`getView` 逐条浅拷贝进快照。
- **sim 是唯一事件发射者（ADR-22，由桥执行）**：动作/命中/出局/碎地/胜负事件由 sim 直发；combat 在解算中 push 的事件先落进 combat-bridge 的暂存缓冲，由桥翻译成 sim 词表（`awaken/awakenEnd/parry/meteorImpact/ghostSlap`，并补 `tileBreak` 记账）后进 `state.events`，其余暂存事件丢弃（sim 已发等价事件）。`state.events` 里永远只有 `API_CONTRACT.md` §10 词表（camelCase：`slap` `hit` `ko` `tileBreak` …）。

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
moveZ = −sx·sin(θ) − sy·cos(θ)          // θ = cameraYaw
Input.yaw = cameraYaw                    // 期望面朝 = 相机朝向；null = 保持当前朝向
```

sim 收到的就是世界系（`moveSpace` 缺省 `'world'`；`'local'` 仅供测试）。**sim 不懂相机**。R2 合并后的达标方式是**唯一适配点**而非全量重写：契约面（`Input.yaw`、`view.players[].yaw`、`forwardX/forwardZ`、测试 helpers）一律 -Z 不变；内部基不同的模块各自只在一处换算——combat 内部 `yaw=0 朝 +Z`，唯一换算点是 `sim/combat-bridge.js`（`FACE.combatOffset = π`）；render 内部同为 `+Z` 基，唯一补偿点是 `core/view.js` 的 `toRenderView`（`RENDER_YAW_OFFSET = π`）；input 的相机方位角换算收敛在 `core/view.js` 的 `cameraYawToSimYaw / simYawToCameraYaw`。**除上述三处外任何文件不得再出现朝向换算**。

分工不变：**ui 建 DOM（`data-yz-*` 标记），input 绑事件**。相机朝向状态（yaw/pitch）归 input 所有，导出 `getLook()` / `setLook()`；main 把 `getLook().yaw` 回传给 `sample`，render 读同一 yaw 摆相机。禁止锁敌自动瞄（种子红线）。

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
| Draw calls / 三角形 | < 150 / < 120k（high 档全场景；方格台面必须合批/Instanced） |
| GC 压力 | `step` 热路径零分配目标；`getView` 每 tick 一次快照分配可接受 |
| 启动 | 首屏可交互 < 3s（4G 模拟），three 按需只进 `render` chunk |

## 9. 部署与端口

- 开发/预览端口 **4181**（`vite.config.js` strictPort）。`base: "./"` 相对路径构建。workflow 由父调度器接，子代理不碰 `.github/`。

## 10. 决策记录（ADR）

R1 裁定（1–15）中仍然有效的沿用；被 Round 2 推翻的标注「已废除/修订」；Round 3 的修订与新增（19/21/22 修订，23/24 新增）已并入下表。**实现一律以最新裁定为准。**

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
17. **yaw = 0 面向 -Z（冻结；R3 补注）**：`forward = (-sin yaw, -cos yaw)`。相机 yaw、`Input.yaw`、`view.players[].yaw`、测试 helpers 同一约定；摇杆→世界系换算公式见 §5.1。R2 已达标，方式是**唯一适配点**：内部基不同的模块只在 `sim/combat-bridge.js`（combat ±π）、`core/view.js toRenderView`（render +π）、`core/view.js cameraYawToSimYaw`（相机方位角）三处换算，见 §5.1；不得新增第四处。
18. **台面拓扑 = sim 方格网格（新，冻结）**：`src/sim/arena.js` 的 2.5m 方格圆盘（约 208 块）是唯一拓扑，`view.arena` 的形状即渲染输入。理由：sim 侧支撑/伤害/重生/probe 全链已在此拓扑上通过，render 只需按 `origin/tileSize/cols + tiles[].x,z` 建板即可；而改 sim 迁就 72 扇环要重写 arena/floor/spawn 全部逻辑。**O1 保持、O2 消费、O3 走 `damageTileAt`，禁止发明第四套拓扑。**
19. **依赖接线 = 静态桥（修订于 R3）**：`src/sim/deps.js` 静态 `import "../data/gloves.js"`（运行时权威掌表）与 `"./combat-bridge.js"`（其内静态 `import "../combat/index.js"`）——生产路径零动态注入，**import sim 即已接线**。`installData/installCombat/resetDeps` 保留**仅供测试替身**，`autoWireOptionalDeps` 已删除。main 启动断言 `getDeps().usingRealData && usingRealCombat` 为 true（为假 = 替身泄漏，亮降级横幅），传给 shell/render 的掌表与 MATCH 一律取自 `sim.getGloves()/getMatchConfig()`。**R3 必改**：`core/modules.js` 的 `wireSimDeps` 注入路径与 `alignSkillIds` 删除（O4）、`scripts/harness.mjs` 的 `installSimulationDependencies` 不再 install（G2）——向已接线的 sim 再 install 真实模块＝绕过桥，见 ADR-24。
20. **isMatchOver 即时判定（新，冻结）**：`isMatchOver(state)` 是**纯读的活谓词**，不要求先 `step`：`over ⇔ state.match.over ∨ ∃p: p.kills ≥ killsToWin ∨ state.time ≥ matchSeconds`。调用不改 state、不发事件；`step` 内的 `updateMatch` 仍负责把结果缓存进 `state.match` 并发 `matchOver` 事件——**事件需要 step，布尔真值不需要**。语义细则见 API_CONTRACT §4。
21. **降级政策：单产线路径（修订于 R3）**：产线路径 = 真实模块。`core/fallback/**`（O4 降级件）只在**模块 import 失败/缺席**时于启动期挂载（`loadSiblingModules` 捕获），且必须亮降级横幅；**局中不换件**——真实 sim 已加载后其运行期异常按错误暴露（暂停+提示），不得静默切到占位模拟。sim 侧的兜底战斗（`sim/fallback-combat.js`）已在 R2 删除：combat 经桥静态 import，坏了即 sim 整体 import 失败，降级单位是**整个 sim**（换 `core/fallback/sim.js`），不存在「sim 真、combat 假」的中间态。所有 fallback 件必须遵守冻结约定（p0、-Z、方格 view 形状），保证换件不换协议。
22. **sim 是唯一事件发射者（修订于 R3：由桥执行）**：`state.events` 里只允许 API_CONTRACT §10 词表。combat 解算中 push 的事件被 combat-bridge 的暂存缓冲截获，翻译（`awaken/awakenEnd/parry/meteorImpact/ghostSlap` + `tileBreak` 记账）后由 sim 代发，未登记的暂存事件丢弃。O4 的 `core/view.js normalizeEvent` 是 shell 内部适配（`ko → killerId/victimId` 等），不改变线上词表。
23. **技能 id：两套词表 + 一张别名表（新，冻结）**：数据 id（`quake_slam / wind_rush / frost_arc / coil_counter / phantom_swap / iron_pull / sky_fall`，木棉为哨兵 `"none"`、禁 null）是公共词表——`GloveDef.skillId`、图鉴、GDD 用它；handler id（`groundPound / dashSlap / frostArc / parry / blinkSwap / magnetPull / meteorSlam`）是 combat 的分派键——`skill` 事件与 `HitRecord.skillId` 携带它。两者之间**只有一张翻译表**：`src/sim/combat-bridge.js` 的 `SKILL_ALIAS`（`combatSkillId()` 是唯一运行时翻译点），全表冻结在 API_CONTRACT §3.1。重复副本 R3 删除：`data/skills.js` 的 `SKILL_COMBAT_ALIASES`（F3）、`core/modules.js` 的 `SKILL_ALIASES + alignSkillIds`（O4）。combat 内部的宽容归一化表（`combat/skills.js`）是防御性实现细节，不具规范地位、不得新增依赖。
24. **接线标志语义（新，冻结）**：`usingRealCombat === true ⇔ combatMod === null ⇔ 生产静态桥在岗`；`usingRealData` 同理。`installCombat / installData` 传**任何非 null 模块**都会把标志置 false——即使传的是真实 `src/combat` 命名空间，因为绕过桥（朝向换算、命中翻译、事件消化全丢）就不是产线路径。所以「标志为 false」读作**「测试替身在场」**，不是「combat 缺席」。产线与探针的正确姿势是**什么都不装**、直接断言两标志为 true；R2 探针误报 `usingRealCombat: false` 的根因正是先 install 再测。
