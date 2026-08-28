# 蚀核要塞 · 系统架构（ARCHITECTURE v2 · Round 2 冻结）

> 维护者：Fable-1 架构。配套文档：[`API_CONTRACT.md`](./API_CONTRACT.md)（冻结签名与数据模式，实现以该文件为准，当前 **v2**）。
> 本文回答「系统长什么样、谁负责什么、每帧发生什么」；`API_CONTRACT.md` 回答「函数怎么签、字段怎么长」。
> 标注 **[冻结]** 的内容任何代理不得单方面更改；标注 **[可调]** 的内容由对应所有者在自己的可写路径内调整。
> **Round 2 冻结决议**（对应契约 v2 CHANGELOG）：getView 数值无 `-0`/`NaN`；首波 ≤2s 出怪；data 只走正式导出名；
> `view.shots` 只由 combat 渲染；`createInput`/`syncHud` 单一签名；`SocketView.theta` 必备；frameEvents 由 main 聚合。

---

## 1. 游戏定位

独立 3D 环轨塔防。中央**星核**（hp=20）被 24 个**插座**组成的外环包围；敌人从半径 52 处生成，沿下/中/上三条轨道（y=0/4/9）**径向内冲**，抵达半径 8 即漏敌扣核。玩家用屑晶在插座上铸 5 种塔（轨炮 `rail` / 棱镜 `prism` / 霰星 `scatter` / 坠井 `well` / 星弩 `star`），可对单塔**过载**（伤害 ×2.2 持续 4s，随后停火 3s），撑过 20 波 + Boss「蚀主 `etch-lord`」。

- 引擎：Babylon.js 8，WebGPU 优先、WebGL2 回退。**[冻结]**
- 开发端口 4182；目录 `games/shihe-yaosai/` 与仓库内其它游戏零引用。**[冻结]**
- 本作不是汉字合成塔防、不是四族 RTS、不是拍击模拟——所有玩法与命名均独立。

## 2. 硬约束（全员）

1. `src/sim/**` 与 `src/data/**` **禁止 import Babylon / 触碰 DOM**（`window`、`document`、`performance` 均禁止）。纯函数 + 纯数据，Node 环境可直接跑。**[冻结]**
2. 不改 `games/` 下其它游戏、不改仓库根业务、不引入账号 / 后端 / 付费 / CDN 运行时 / 版权素材。**[冻结]**
3. 画面验收按「桌面 WebGPU 实时」：必须有 PBR 金属、星核发光、Bloom、可辨弹道、过载/过热变色；不做满屏体积神光与电影焦散。
4. 契约变更流程见 §14；未走流程前一律按 `API_CONTRACT.md` 实现。

## 3. 分层与依赖图 **[冻结]**

```
                 ┌────────────────────────────────────────────┐
                 │              src/main.js (O1)              │
                 │   装配层：唯一同时 import 所有模块的文件      │
                 └──┬────────┬────────┬────────┬────────┬─────┘
                    │        │        │        │        │
              ┌─────▼──┐ ┌───▼────┐ ┌─▼──────┐ ┌▼──────┐ ┌▼──────┐
              │ engine │ │ world  │ │ combat │ │  ui   │ │ input │
              │  (O1)  │ │  (O2)  │ │  (O3)  │ │ (O4)  │ │ (O4)  │
              └─────┬──┘ └───┬────┘ └─┬──────┘ └┬──────┘ └┬──────┘
                    │        │        │         │         │
               Babylon   Babylon   Babylon     DOM       DOM
                    │        └────┬───┘         │         │
                    │             │ (只读)      │ (只读)   │
                    │        ┌────▼─────────────▼──┐      │
                    │        │     src/data (F3)   │◄─────┘ (只读)
                    │        └────▲────────────────┘
                    │             │ (只读)
                    │        ┌────┴─────┐
                    └──X──── │ src/sim  │  ←— sim 绝不 import Babylon/DOM
                             │   (O3)   │
                             └──────────┘
```

**import 白名单**（越界即违约）：

| 模块 | 允许 import | 禁止 import |
| --- | --- | --- |
| `src/data` | 仅 `src/data` 内部 | 一切外部（Babylon、DOM、sim） |
| `src/sim` | `src/data` | Babylon、DOM、engine/world/combat/ui/input |
| `src/engine` | `@babylonjs/core`（建议深路径 import 利于摇树） | sim、world、ui |
| `src/world`、`src/combat` | `@babylonjs/core`、`src/data`（只读常量） | `src/sim`、DOM、ui |
| `src/ui`、`src/input` | DOM、`src/data`（只读常量） | Babylon、`src/sim` |
| `src/main.js` | 以上全部 | — |
| `tests/**` | `src/sim`、`src/data`（UI 测试可用 jsdom 加载 `src/ui`） | Babylon 运行时 |
| `scripts/**` | `src/sim`、`src/data` | Babylon、DOM |

数据流是**单向**的：`input.read()` → `sim.step()` → `sim.getView()` → `world / combat / ui` 消费。渲染侧永远不回写模拟；模拟永远不知道渲染存在。战斗表现层（combat）只把 `view.shots` 画成曳光/光束/抛物线，**不重复计算伤害**。**[R2 冻结] `view.shots` 由 `src/combat` 独占渲染：world 一律不画弹道（`world/shots.js` 通道停用/移除），否则同一条 shot 双画。**

## 4. 目录与所有权

```
games/shihe-yaosai/
├── index.html            # O4（HUD 骨架，class/id 见契约 §12）
├── package.json          # 共享只读；追加依赖需先在简报声明
├── vite.config.js        # 共享只读；端口 4182 strictPort
├── docs/
│   ├── README.md         # 文档索引（F1）
│   ├── ARCHITECTURE.md   # 本文（F1）
│   ├── API_CONTRACT.md   # 冻结契约（F1）
│   ├── ART_DIRECTION.md  # F2
│   ├── GDD.md            # F3
│   ├── SOTA_CHECKLIST.md # F4
│   └── ACCEPTANCE.md     # F4
├── src/
│   ├── main.js           # O1 装配层
│   ├── engine/           # O1：createRenderer / 质量档 / 相机 / 后处理
│   ├── world/            # O2：星核、环、插座、轨道、塔实体
│   ├── sim/              # O3：纯模拟（createMatch/step/getView）
│   ├── combat/           # O3：view.shots 的视觉呈现
│   ├── ui/               # O4：HUD 挂载与同步
│   ├── input/            # O4：键鼠 → SimInput
│   ├── data/             # F3：CONFIG/TOWERS/TOWER_ORDER/ENEMIES/WAVES/BOSS/ARMOR_MULT + 3 个查询函数（契约 §4.1）
│   └── styles/           # F2：CSS
├── tests/                # GPT-sol-1：纯 sim 单测
└── scripts/              # GPT-sol-2：probe.mjs / bench.mjs（Node 直跑 sim）
```

## 5. 运行时装配与帧循环 **[冻结]**

`src/main.js` 是唯一装配点。启动序列：

```
1. canvas = #sh-canvas
2. renderer = await createRenderer(canvas, { quality: URL ?quality 覆盖 })
   （engine 内部完成 WebGPU→WebGL2 探测、相机、后处理；不启动渲染循环）
3. match = createMatch(seed)         // seed 取 URL ?seed=，缺省 (Date.now() % 2**31)
4. buildWorld(renderer.scene, () => getView(match))
5. hud = mountHud(document, { onTowerSelect, onOverclock })
6. inp = createInput({ canvas, scene: renderer.scene, pickSocket })   // [R2 唯一签名] pickSocket 即 world 出口函数
7. renderer.engine.runRenderLoop(frame)
```

每帧 `frame()` 的**固定步长累加器**：

```
SIM_DT = 1/60                        // [冻结] 模拟步长
acc += min(realDtSec, 0.25)
frameEvents = []
n = 0
while (acc >= SIM_DT && n < 5) {     // [冻结] 每帧最多 5 个子步，防螺旋死机
  simInput = (n === 0) ? inp.read() : {}     // 输入只喂给第一个子步
  frameEvents.push(...step(match, simInput, SIM_DT).events)
  acc -= SIM_DT; n++
}
view = getView(match)
view.backend = renderer.backend      // [冻结] 唯一允许对 view 的改写：main 覆写 backend 字段
syncWorld(renderer.scene, view)
syncCombat(renderer.scene, view, frameEvents)
syncHud(view, { events: frameEvents, backend: renderer.backend })   // [R2 唯一签名] 契约 §8
renderer.scene.render()
```

要点：

- **事件必须按帧聚合，聚合点在 main**。一帧可能跑多个 sim 子步，`getView().events` 只镜像最近一次 `step` 的事件；HUD 弹条、击杀闪光等一律消费 main 收齐的 `frameEvents`（syncHud 经 `extras.events`、syncCombat 经第三参），否则会丢事件。**[冻结，R2 重申]**
- **禁止签名试探**（R2 新增，契约 §9.5）：main 按契约唯一签名直调 `createInput` / `syncHud` / `syncWorld` / `syncCombat`，Round 1 的多签名适配器删除；签名不符改实现，不加适配。**[冻结]**
- `step` / `getView` 不可重入；渲染回调内串行调用。
- 暂停不停帧：`view.paused === true` 时照常 `syncWorld/syncHud`（镜头可转、HUD 可点），只是模拟时间不前进。

## 6. 模拟 tick 顺序 **[冻结]**

`step(match, input, dtSec)` 内部严格按以下顺序执行。测试（GPT-sol-1）可以依赖这一顺序产生的可观测结果：

```
0. dt = clamp(dtSec, 0, CONFIG.simMaxDt=0.1)；events = []
1. 输入阶段（暂停 / 终局时也执行，终局时 place/overclock 一律 deny:'ended'）
   1a. pause：绝对置位（true=暂停 false=继续），非布尔忽略
   1b. selectedSocket：合法 [0,23] 则置位，null 清除，非法忽略
   1c. place：校验顺序 badSocket → badTower → ended → occupied → noScrap
       通过 → 扣屑晶、建塔（level=1, hp=满）、emit 'place'
   1d. overclockSocket：校验顺序 badSocket → ended → noTower → cooling
       通过 → overclockT = 4、emit 'overclock'
2. 若 paused 或 status !== 'playing' → 直接返回 { events }（时间不前进）
3. match.time += dt
4. 波次推进：备战/波间倒计时归零 → 开波 emit 'waveStart'；
   按当前波 entries 的 (delay, gap) 时间线生成敌人（spawn 细则见契约 §3.8）
5. 敌人移动：radius -= speed × slowMult × dt；theta += drift × dt
6. 塔阶段：按 socket i = 0 → 23 顺序逐塔处理（保证确定性）：
   6a. 计时器：cooldownT/overclockT/overheatT 递减；
       overclockT 触底 → overheatT = 3、emit 'overheat'
   6b. overheatT > 0 → 本塔跳过开火
   6c. 目标选择：射程内「radius 最小优先，平局取 id 小者」[冻结默认]
   6d. 开火：伤害即时结算（R1 全塔 hitscan 模型，公式见契约 §3.7），
       生成 view.shots 记录（纯视觉），hp≤0 标记待死亡
7. 死亡结算：按敌人 id 升序 emit 'kill'、加 scrap、移除
8. 漏敌结算：radius ≤ CONFIG.coreRadius → emit 'leak'、coreHp -= leakDamage、移除；
   coreHp ≤ 0 → status='lost'、emit 'lose'（lose 判定先于 win [冻结]）
9. shots 老化：t += dt / life(kind)；t ≥ 1 移除
10. 波清检测：本波全部生成完毕且场上无敌 → emit 'waveClear'（含 bonus 入账）；
    若 wave === CONFIG.waveCount(20) → status='won'、emit 'win'
11. 返回 { events }；同一份数组镜像到下一次 getView().events
```

Round 1 简化（已在简报冻结、契约 §3 有精确语义）：

- 全部伤害在**开火 tick 即时结算**；弹道飞行只是视觉。R2 若把霰星/星弩改为落点结算，事件与 view 形状不变。
- 棱镜折光：直线光束，仅做距离判定（折射搜索半径 ≤18，最多 2 段），不做视线遮挡。
- 波表：数据层写满 20 波 + Boss；模拟层至少跑通前 5 波即可交付 Round 1。

Round 2 收紧（契约 v2 冻结，实现必须跟进）：

- **getView 数值 JSON-safe**：无 `-0`/`NaN`/`Infinity`，坐标输出前归一化（`n + 0`；契约 §1）。
- **首波 ≤2s 出怪**：默认波表下 `createMatch` 后模拟 2 秒内 `enemies.length ≥ 1`（契约 §3.8；`firstWaveDelay` 建议 1.5）。
- **克制表正式名**：伤害公式走 `armorMultiplier` / `ARMOR_MULT`（契约 §3.7/§4.1），`DAMAGE_MATRIX` 与 `SIM_CONFIG` 等旧名/别名一律不认。

## 7. 空间与坐标约定 **[冻结]**

所有空间量在**纯数学层**定义，sim 输出的一切坐标是普通 `{x,y,z}` 对象，与 Babylon 无关：

| 量 | 定义 |
| --- | --- |
| 插座角 | `θᵢ = i / 24 × 2π`，`i ∈ [0,23]` |
| 位置换算 | `x = cos(θ)·r`，`z = sin(θ)·r`，`y = laneY[lane]` |
| 轨道高度 | `laneY = [0, 4, 9]`（下/中/上） |
| 插座环半径 | `CONFIG.socketRadius = 40` |
| 敌人生成半径 | `CONFIG.spawnRadius = 52` |
| 星核（漏敌）半径 | `CONFIG.coreRadius = 8` |
| 朝向角 | `heading = atan2(dz, dx)`；`heading = 0` 朝 `+X` |
| 单位 | 距离=世界单位；时间=秒；角度=弧度 |

**Babylon 映射由 world 层独占**：`mesh.rotation.y` 与 `heading` 的符号换算（Babylon 默认左手系）是 O2 的内部实现；若实测方向相反，只允许改 world 层映射，**不许**反过来要求 sim 改数据。敌人内冲朝向可由 `θ+π` 推得，塔炮口朝向可由该塔最近一条 shot 的 `from→to` 推得，view 不额外携带 heading。

## 8. 渲染管线与质量档

后端探测（O1）：`navigator.gpu` 存在且 `WebGPUEngine` 初始化成功 → `backend='webgpu'`；否则回退 `Engine`（WebGL2）→ `backend='webgl2'`；两者皆失败 → reject `Error('shihe:no-backend')`。**[冻结]**

质量档 **[冻结]**（`setQuality(tier)` 可随时切换）：

| tier | Bloom | GlowLayer | 阴影 | 备注 |
| --- | --- | --- | --- | --- |
| `high` | ✓ | ✓ | ✓（单方向光 ShadowGenerator） | webgpu 默认 |
| `mid` | ✓ | ✓ | ✗ | webgl2 默认 |
| `low` | ✗ | ✗ | ✗ | 后处理全关；星核仍靠自发光材质可辨 |

URL `?quality=high|mid|low` 覆盖自动档（main 解析后传入 `createRenderer`）。

职责切分 **[冻结]**：

- **engine（O1）**：Engine/Scene、ArcRotateCamera（目标 `(0,4,0)`，初始半径 ≈95，beta 上限 ≈1.35，radius 限 `[40,160]` **[可调]**）、DefaultRenderingPipeline（Bloom）、GlowLayer、阴影光源 + ShadowGenerator、resize 监听、dispose。
- **world（O2）**：星核（自发光 + 受击脉冲）、外环、24 插座、三层轨道示意环、塔实体（含过载/过热变色）、场景照明（半球光 + 核心点光）、拾取代理。敌人建议 thin instance / 实例化网格。**[R2 冻结] 不渲染 `view.shots`**——弹道视觉归 combat 独占，world 内的 shots 渲染通道停用/移除。
- **combat（O3）**：`view.shots` 的**唯一渲染方 [R2 冻结]** + 消费 `frameEvents`，画曳光（tracer）、光束（beam）、散射（pellet）、抛物线（arc）、脉冲环（pulse）；对象池复用，上限 128。

`scene.metadata` 命名空间 **[冻结]**，避免三方互踩：

| key | 所有者 | 用途 |
| --- | --- | --- |
| `scene.metadata.shEngine` | O1 | `{ pipeline, glow, shadow\|null, quality }` |
| `scene.metadata.shWorld` | O2 | world 的节点句柄 |
| `scene.metadata.shCombat` | O3 | 弹道对象池 |
| `mesh.metadata.shSocket` | O2 | 插座拾取标记（number 0..23），`pickSocket` 依赖它 |

world 构建网格时若发现 `scene.metadata.shEngine?.shadow` 存在，应把主要网格注册为投/受影者；不存在（mid/low）则跳过，null 安全。

## 9. 确定性与随机 **[冻结]**

- 唯一随机源：`createMatch(seed)` 内部持有的 mulberry32 PRNG（参考实现见契约 §3.8）。`src/sim`、`src/data` 内**禁用** `Math.random`、`Date.now`、`performance.now`。
- 种子规范化：`seed` 非有限数或缺省 → `1`；否则 `seed >>> 0`。
- 确定性保证：同一 seed + 同一 `(input, dtSec)` 调用序列 → 任意时刻 `getView` 深度相等。这是 GPT-sol-1 的核心测试之一。
- RNG 消耗次序 = tick 顺序中出现次序（先 spawn 后散射抖动等）；改动任何消耗点都会改变后续序列，属于破坏性变更，需走 §14。

## 10. 错误策略（摘要，全文见契约 §11）

- **sim 永不因运行期输入抛异常**：非法放置/过载 → `deny` 事件（理由码冻结）；未实现的保留输入静默忽略；`createMatch` 对坏 seed 做归一化而非抛错。
- **engine 用带前缀的 Error 拒绝**：`shihe:no-canvas`、`shihe:no-backend`。main 捕获后在 `.sh-toast` 显示可读信息。
- **world / combat / ui 的 sync 函数必须 null 安全**：空 view、空数组、未知枚举值一律容忍，不抛错、不崩帧。
- **前向兼容**：所有消费方必须忽略未知的事件类型与未知字段。

## 11. 性能预算 **[可调，超预算需先协商]**

| 项 | 预算 |
| --- | --- |
| `step()` 单次（60 敌 + 24 塔） | ≤ 2 ms（bench.mjs 度量） |
| 同屏敌人 | ≤ 60 |
| 同屏 shots | ≤ 128（sim 侧超限丢最旧，纯视觉无碍） |
| Draw call（high 档） | < 150（敌人/弹道实例化） |
| 目标帧率 | 桌面 WebGPU 60fps；WebGL2 mid 档 ≥ 45fps |

`getView` 每次调用返回新鲜 JSON-pure 对象；O3 可做内部缓冲复用，但返回值必须满足 `structuredClone` 安全（无函数、无类实例、无 NaN/Infinity，**R2 起额外禁 `-0`**——逐数满足 JSON round-trip `Object.is` 相等，契约 §1）。

## 12. 测试与验证

- `npm test`（vitest，node 环境）：`tests/**` 只测纯 sim + data。契约 §14 列出了**保证可测的最小断言集**（形状、数值 JSON-safe 无 `-0`、首波 ≤2s、放置扣费、deny、确定性、漏敌败北、过载时序），`createMatch/step/getView` 必须绿。R2 完成定义：`npm test` 全绿 + probe 5 波 leaks≤2 且 coreHp>0 + build exit 0。
- `npm run probe`（GPT-sol-2）：Node 直跑 sim 的脚本化对局，输出 JSON 摘要（波数、击杀、剩余核血），用于无浏览器冒烟。
- `npm run bench`：固定 seed 脚本化 20 波，统计 `step` 耗时分布。
- 浏览器验收（F4）：`:4182` 可见环 + 核 + 三层轨道；能放 3 种塔过 5 波；WebGPU/WebGL2 均能亮。

## 13. Round 路线

- **R1（已交付）**：目录可启动、可放塔（≥3 种）、可过 ≥5 波、双后端能亮、纯 sim 测试绿。
- **R2（本轮，按 `round2/BRIEF.md` 靶向修缺陷，不新开玩法）**：完成定义 = `npm test` 全绿、`npm run probe` 5 波 leaks≤2 且 coreHp>0、`npm run build` exit 0；冻结决议 = getView 无 `-0`、首波 ≤2s、data 正式导出名、shots 只 combat 画、单一签名、`SocketView.theta`、frameEvents 聚合（契约 v2 CHANGELOG）。玩法预留位（`upgradeSocket`/`sellSocket`/`callWave`/`pierce`/棱镜视线遮挡/落点结算/Boss 特技）仍为 RESERVED，不强制实现。
- **R3**：父调度器接 catalog / pages workflow，本目录不动。

## 14. 契约变更流程与已知风险

**流程**：任何人要改冻结项 → 在自己简报中提出 → 由架构（F1）在 `API_CONTRACT.md` 升版（v1 → v2，附 CHANGELOG）→ 其余代理跟进。禁止「代码先行、文档追认」。

**已知风险与既定裁决**：

1. `view.backend`：sim 是纯层不知道渲染后端，冻结为 sim 返回 `'sim'`、main 覆写为真实后端（§5）。谁绕过 main 直接消费 `getView` 将看到 `'sim'`，属预期。
2. 渲染需要角度：简报的视图「至少含」清单没有 θ，契约将 `theta` 升格为**必备字段**——v1 冻结 `EnemyView.theta`，v2 起 `SocketView.theta` 同样必备（契约 §2.2），O2/O3 都按含 `theta` 实现，渲染层不得自行推导后回写。
3. 棱镜折光的原文有歧义，契约 §3.6 给出唯一裁决（段1 塔→主目标全额；主目标 18 内存在另一棱镜则折出段2 打次目标，伤害 × `refractRatio`），实现以契约为准。
4. 多子步丢事件：HUD/战斗闪光必须消费 `frameEvents` 聚合数组而非 `view.events`（§5）。
5. Babylon 左手系朝向符号：由 world 层吸收（§7），sim 数据永不翻转。
