# 架构（Round 3 第一波结账版）

> 维护者：Fable-1（架构 / API 契约）。基线：Round 2 合并树 commit `633f731` + Round 3 Opus-1 结账（分支 `cursor/r3-opus1-quantum-patrol-and-save-normalize-18ac`，tip `30d3eb4`：stepSim 挂巡检 + normalize 收编 + store 撤领域层 import），主分支 `cursor/crazy-water-world-c895`（Round 1 冻结稿基线 `14b21c9`）。
> 配套文档：`docs/API_CONTRACT.md`（严格契约与禁止改名清单）。改代码前先读契约。
>
> 标记约定：**[冻结]** 不得变更；**[附加]** 允许新增、不得破坏既有行为；**[R3]** 本轮要落实。

## 0. 技术选型 [冻结]

- 独立 Vite 工程 + 原生 ES Module，**零 UI 框架、零运行时依赖**（devDependencies 仅 vite / vitest / jsdom）。
- 全部游戏规则是可单测纯函数；DOM/Canvas/Audio 只存在于明确的壳层文件（见 §3）。
- 开发/预览端口 **4174**，`strictPort: true`（同仓库其他游戏用 4173 等，端口冲突时直接报错而不是漂移）。

## 1. 模块图与依赖方向

```
                    ┌──────────────────────────────┐
                    │  index.html → src/main.js    │  壳：水合存档、注入 render、启动
                    └──────────────┬───────────────┘
                                   │ boot(root, store, { render })
                    ┌──────────────▼───────────────┐
                    │ src/core/engine.js           │  rAF 循环、定步长、自动存档
                    │   stepSim() 纯量子 [冻结]     │  （对 ui/** 零依赖，D1 已关）
                    └──┬──────────────────────┬────┘
          纯模拟（每 0.1s 量子）          渲染/输入（每帧，由 main.js 注入）
             │                                │
   ┌─────────▼─────────┐            ┌─────────▼─────────────┐
   │ world/sim.js      │            │ ui/app.js render()    │──▶ ui/screens/* ui/dom.js
   │ explore/* heroes/*│            │  （唯一 DOM 组装点）    │──▶ world/canvas.js audio/sfx.js
   └─────────┬─────────┘            └─────────┬─────────────┘
             │      两侧都只通过 store 交换状态  │
   ┌─────────▼────────────────────────────────▼─────────┐
   │ core/store.js（单一状态 + normalize 钳域）           │
   │ core/rng.js（mulberry32/hashSeed/deriveRng）        │
   │ core/reasons.js（REASON 码表 + allow/deny 工厂）     │
   └─────────┬──────────────────────────────────────────┘
             │
   ┌─────────▼──────────────────────────────────────────┐
   │ 领域规则（全部纯函数，禁止 DOM / IO / 全局时间）        │
   │  world/grid.js  world/build.js  world/sim.js        │
   │  world/mods.js（派生倍率唯一读表口径）                │
   │  explore/{salvage,fishing,dive,mods}.js             │
   │  heroes/{roster,lineup}.js                          │
   │  combat/{battle,skills,ai}.js                       │
   └─────────┬──────────────────────────────────────────┘
             │
   ┌─────────▼──────────────────────────────────────────┐
   │ src/data/*（静态表：建筑/英雄/关卡/鱼/潜水/天气/资源/  │
   │            订单/事件）——引擎侧零硬编码，全部读表      │
   └────────────────────────────────────────────────────┘
```

允许的依赖边（import 方向）**[冻结，Round 2 的唯一豁免已撤销]**：

| 发起方 | 允许 import |
| --- | --- |
| `src/data/**` | 什么都不许（叶子层，纯常量 + 无副作用工厂函数） |
| `core/reasons.js` | 什么都不许（叶子层） |
| `world/ explore/ heroes/ combat/` | `src/data/**`、`core/rng.js`、`core/reasons.js`，以及本目录内文件 |
| `core/store.js` | `src/data/**`、`core/rng.js`；**不再 import 任何领域层**（Round 2 的 `world/mods.js` 豁免已撤：`defaultState` 不再预算 `world.mods`，快照盖章归 `tickWorld`，契约 §10-N6 已关） |
| `core/engine.js` | `core/**`、`world/sim.js`、`explore/index.js`、`heroes/index.js`（巡检与下潜结账走各域门面）；**不得 import `ui/**`（静态与动态都禁，D1 已关并有此现状）** |
| `ui/**` | 任何 `src/**` |
| `src/main.js` | `core/**`、`ui/app.js`（render 注入）、`styles/**` |
| 任何文件 | **禁止** import 仓库根、`../../`、其他 `games/*`、任何 npm 运行时包 |

跨域读数不走 import 的两个特例 [冻结]：

1. **explore 读天气不 import world**：`world/sim.js` 每量子把 `weatherMods()` 结果落成 `state.world.mods` 快照，`explore/mods.js` 优先读快照、缺席时按 `data/weather.js` 回退——数值只有一份，依赖边也没破。快照现在**只由 `tickWorld` 盖章**（`defaultState` 不再预算，存档带来的 mods 由 normalize 剥离）：新档第一个量子之前 mods 缺席，回退路径因此不是死代码。
2. **explore 的失败码不 import core/reasons**：`EXPLORE_REASON` 按值复刻码面字符串（另加探索独有 `E_WEATHER`），避免反向依赖；码面必须与 `core/reasons.js` 保持字面一致。

每个领域目录的 `index.js` 是对外唯一门面，UI 与测试原则上只从门面或契约列出的具体文件导入。

## 2. 时钟模型

- **模拟量子 [冻结]**：0.1s（`engine.QUANTUM`）。`boot()` 里 rAF 累加真实时间 × `meta.speed`（1/2/4），每攒满 0.1s 执行一次 `stepSim`。`meta.tick` 是**唯一的模拟时间轴**，所有派生随机都以它为盐（§4），伤病到期时刻也锚在它上面（`heroes.nowSeconds = tick × 0.1`）。
- **纯量子入口 `stepSim` [冻结]**，铁序（Round 3 起）：`settleOffline(s, idleSince)` → `tickWorld(s, 0.1)`（内含 `world.mods` 盖章） → `spawnFlotsam(s, deriveRng(seed, tick, "salvage"))`（只换 `salvage.flotsam`，`picked/rarePicked/lastPick` 累计字段保留） → `tickInjuries(s)` → `syncExploreWeather(s)` → 被巡检拽上来的 `explore.dive.done` 会话当场 `finishDive` 结账 → `idleSince = 0` → `tick += 1`。测试驱动与线上完全一致的时间轴。巡检铁律：排在 `tickWorld` 之后（读到的就是本量子刚盖章的新天气）、**不消费随机数**（拾荒派生流与接线前逐位一致；巡检日后要掷骰必须另派独立盐，不许蹭 `"salvage"` 游标）；无事时巡检与结账全部原引用短路，挂满每个量子的成本为零。接线已如约改变挂机日志序列（归队 / 强制收杆 / 强制上浮 / 下潜结账日志入流）——契约 §10-N3 已关。
- 单帧真实 dt 上限 0.05s：掉帧时模拟变慢而不是跳变（有意为之，不算缺陷）。
- 昼夜：`timeOfDay += dt/240`，一天 240 秒（1x 速度）。天气时长读 `WEATHERS[*].durationSec`；权重按 `hqLevel` 取 `WEATHER_SCHEDULE` 档位（开荒期不出海啸），无档回退 `WEATHER_WEIGHTS`。
- **离线补算 [冻结]**：`saveState` 盖 `meta.savedAt`（墙钟毫秒，仅存档壳层写）；`hydrateSave` 把差值折进 `campaign.idleSince`（8h 封顶）；`stepSim` 首步 `settleOffline` 切 ≤120 块粗粒度 `tickWorld` 补产出，不补漂浮物、不留逐条天气日志。残留：块间天气派生流重放（契约 §10-N7）。

## 3. DOM / 副作用隔离 [冻结]

允许触碰 DOM、`window`、`performance`、`Date`、`localStorage`、`AudioContext` 的文件——**白名单**：

| 文件 | 允许的副作用 |
| --- | --- |
| `src/main.js` | `document`、`localStorage`（读档水合）、render 注入 |
| `src/core/engine.js` | rAF、`performance.now`、`setInterval`（自动存档）、`beforeunload` 落盘 |
| `src/core/store.js` | 仅 `saveState/loadState` 两个函数内的 `localStorage` 与 `Date.now`（写 savedAt） |
| `src/ui/**` | 全部 DOM、事件监听（app.js 组装，screens/* 分屏，dom.js 工具） |
| `src/world/canvas.js` | Canvas 2D、`window.devicePixelRatio` |
| `src/audio/sfx.js` | WebAudio |

白名单之外（`world/grid|build|sim|mods`、`explore/**`、`heroes/**`、`combat/**`、`data/**`、`core/rng|reasons|events`）：

- 禁止 `Math.random`、`Date.now`、`performance.now`、`localeCompare`、`Intl`、`crypto`、`navigator`、任何 DOM API。
- 禁止修改入参（用展开出新值）；失败路径与「无事发生」路径必须返回**原对象引用**（`===`，契约 §2）。
- 同输入必须同输出（随机性一律显式经 `rng` 参数或 `deriveRng(seed, tick, 盐, nonce)` 派生）。

## 4. RNG 策略

统一原语在 `core/rng.js`：`mulberry32`（32 位种子流）、`hashSeed`（FNV-1a 字符串→u32）、`deriveRng`（派生瞬时流 [附加·冻结]）、`pickWeighted`。

**祝福模式：派生瞬时流 [冻结]**。不保存 RNG 游标，每次需要随机时从 `(meta.seed, meta.tick, 域盐, nonce)` 现场派生。存档只需存 `seed + tick`，读档后模拟严格可复现。各域现状：

| 域 | 落地做法 | 状态 |
| --- | --- | --- |
| 天气重掷（sim.js） | `deriveRng(seed, tick, "weather", roll)`，roll = 单次调用内重掷序号 | 冻结；离线分块重放残留见契约 §10-N7 |
| 拾荒（engine.stepSim） | 每量子 `deriveRng(seed, tick, "salvage")` 传给 `spawnFlotsam`，游标不落盘 | 冻结（Round 1 长命流已废，读档可复现） |
| 钓鱼（fishing.js） | `mulberry32(seed + tick*17)` | 冻结（Round 1 口径保留） |
| 潜水布局（dive.js） | `mulberry32(hashSeed("dive|zone|seed|tick"))`，(seed,tick,zone) 定一张图 | 冻结（写死布局已废） |
| 战斗（battle.js） | 调用方传 seed；campaign 已统一调 `battleSeed(state, stage, attempts)` | 冻结；`STAGE_RULES.seedFormula` 文案待对齐（契约 §10-N2） |

新游戏 seed：`defaultState` 仍写死 `20260108`（D9 未落，契约 §10-N9）。目标不变：壳层「启航」时生成随机 seed 注入；测试仍用固定 seed。**seed 的生成属于壳层副作用，领域层只消费。**

## 5. 状态与存档

- 单一 `createStore`；`GameState` 完整字段模式见契约 §3，**字段集合冻结**，新增字段走「附加 + 默认值」流程并同步契约。本轮附加：`meta.savedAt`、`world.mods`、`campaign.attempts`、explore 侧 `fishing.cast/castTick/codex`、`salvage.picked/rarePicked/lastPick`、`diveRecord`、资源 `tool`。
- `store.patch` 是**顶层浅合并**——改嵌套字段必须自带展开（`{ meta: { ...s.meta, x } }`）。深层直接赋值 = 契约违规。
- 存档：`localStorage["cww.save.v1"]`，内容 = `JSON.stringify(GameState)` 全量 + `savedAt`。键前缀 `cww.` 是本游戏在 localStorage 的命名空间 **[冻结]**。
- 自动存档：started 状态下每 4s 一次 + `beforeunload` 落盘；读档时 `started` 强制回 false（回标题屏）。
- **读档健壮性 [冻结]**：`hydrateSave/normalize` 深合并 + 逐字段钳域 + tiles 重建 + 存档 `world.mods` 剥离（首个量子 `tickWorld` 重新盖章），坏 JSON/脏档不再毒化模拟（D10 钳域侧已关）。explore 分支已从整段白名单改为**逐字段收编 + 钳域**（图鉴 / 拾荒计数 / 潜水战绩 / 进行中的竿全部落档不丢，契约 §4 与 §10-N1 已关）。
- **版本迁移 [R3]**：`meta.version` 与存档键版本号一起变；不兼容时改键名 `cww.save.v2` 并写迁移函数，禁止让旧档直接崩运行时。当前只有钳域没有迁移。

## 6. 与同仓库其他游戏的隔离 [冻结]

1. 本游戏一切文件都在 `games/crazy-water-world/`；**禁止**改仓库根业务文件（`/test.js` 等）与其他 `games/*`。
2. 代码内禁止出现走出本目录的相对路径 import（`../../` 越过包根即违规）。
3. 端口 4174 独占且 strictPort；localStorage 键独占 `cww.` 前缀。
4. 依赖独立 `package.json` / `package-lock.json`，不使用 npm workspace，不装运行时依赖。
5. 文件所有权与并发分工见 `/.agent_workspace/PROGRESS.md` 与 `docs/OWNERSHIP.md`；共享只读文件（package.json、vite.config.js 等）只追加不删改他人段落。

## 7. 性能预算

`npm run bench` 门槛（超标即 exit 1）**[冻结]**：`tickMs ≤ 4`、`spawnMs ≤ 2`、`battleMs ≤ 12`。Round 2 实测（64 建筑、12 类全覆盖、24×24 木筏）：tick p95 0.021ms / stepSim 0.024ms / spawn 0.006ms / battle 0.134ms，全预算内且负载真实（D18 已关）。

结构性要点：

- `tickWorld` 已弃整状态 `structuredClone`，改按需展开拷贝（`structuredClone` 只剩 `defaultState` 一处）。
- 建筑表启动时 `compileBuildings` 编译一次（摊平 output/input/converts），tick 热路径零 `Object.entries`。
- 邻接查询走 `adjacencyIndex(state)` 一次建索引（对建筑数线性），sim/mods 共享传递，**禁止**退化成逐座 `filter` 的 O(B²)。
- 渲染侧一次建 DOM、每帧只改 text/style/class，60fps 目标见 `docs/SOTA_CHECKLIST.md`。

## 8. 测试与验证矩阵

| 命令 | 覆盖 | 说明 |
| --- | --- | --- |
| `npm test`（vitest + jsdom） | `tests/*.test.js`：建造/升级/扩建 reason 码、旋转落位、表驱动产出、拾荒/钓鱼/潜水、战斗确定性与快照、招募/委任/升星、stepSim 纯度、hydrateSave | 只准 import 契约冻结符号 |
| `npm run probe` | 冒烟：store 启动、放 hq、时间推进、战斗返回、隔离 realpath 断言 | 任何 FAIL exit 1 |
| `npm run bench` | tick/stepSim/spawn/battle 耗时门槛（真实 64 建筑负载） | 见 §7 |
| `npm run stress` | 密铺 + 30 关 × 128 seed × 双跑 digest（3840 场 0 错配）+ 长时数值稳定 | 确定性与稳定性 |
| `src/ui/e2e/`（smoke/fresh） | 真 Chrome 六屏走查 47 断言 | 未入 `npm test` 门禁（[R3]，SOTA 清单 I 节） |

测试硬性要求 [冻结]：战斗快照用 `JSON.stringify(simulateBattle(...))` 做**字节级**断言（契约 §8）；每修一个缺陷配一条回归测试；测试不得断言中文人话文案（会被 Fable-2/3 调整），只断言 reason/code 码与数值——world/heroes 断言 `reason`，explore 断言 `code`（契约 §2/§10-N5）。

## 9. 缺陷账本（Round 2 合并树 `633f731` 复盘）

Round 1 账本 D1–D18 处置如下；**残留项与新发现统一并入契约 §10 的 N 编号清单**（单一账本，不再两处记）。

**已关**：D1（engine→ui 依赖，render 注入）、D2/D3（reason 码 + 全套 can*）、D4（maxLevel 上限 + tiles.level 双写同步维护）、D6（expandRaft 非法 dir）、D7（defaultState 深合并 + normalize）、D8（savedAt/idleSince/settleOffline 全链）、D10（读档钳域；版本迁移仍缺 → §5 [R3]）、D11（潜水布局派生 + finishDive 防御 + spawnFlotsam 用 dt + 拾荒派生流）、D12（assignHero 校验/悬挂引用；`applyBattleInjuries` 已由 campaign 战后调用，战败有代价；战斗 seed 统一 `combat.battleSeed` 重试盐）、D13（MAX_SIDE 截断 + 关卡 5 敌编队 + 阵容勾选取舍 UI + `selectLineup` 自动配队）、D14（UI 差异更新，钓鱼可玩）、D16（移动/旋转/拆除 UI）、D18（bench 真负载）。

**部分关/残留**（详见契约 §10 对应条目）：

| 旧编号 | 残留内容 | 契约条目 | 归属 |
| --- | --- | --- | --- |
| D5 | 离线分块的天气派生流重放（tick 不变、nonce 未掺块序） | N7 | Opus-1 |
| D9 | 新档 seed 写死 20260108 | N9 | Opus-4（壳层）|
| D15 | 钓鱼 cast 仍在 `ctx.ui` 双轨（潜水侧已入 state） | N4 | Opus-4 |
| D17 | 居民恒 1 人、事件恒 null、coins 无消费 | N10 / N11 | Opus-1 + Fable-3 |

（D12 的最后残留 N3②——`tickInjuries` 未挂量子——已随 Round 3 结账关闭，D12 全关。）

**Round 2 新发现的处置**（同表在契约 §10）：**已关（Round 3 第一波结账，Opus-1，`engine.js`/`store.js` 两文件）**：N1 normalize 丢探索附加字段、N3 巡检未入量子（海啸对进行中会话已有强制收杆/上浮 + 当场结账）、N6 store→world/mods 豁免边（盖章迁走方案）。**仍开**：N2 `STAGE_RULES.seedFormula` 文案过期（Fable-3 一行）；N5 can* 两套形状（Fable-1 定收敛方案）；N8 双份常量口径（各归属方同步）。

## 10. Round 3 进度与剩余落地顺序

**第一波已结账（Opus-1）**：N3——stepSim 挂 `tickInjuries` + `syncExploreWeather`，被巡检拽上来的 done 会话当场 `finishDive` 结账（§2 铁序，拾荒派生流逐位不变，挂机日志序列改变已声明）；N1——`normalize` 逐字段收编探索附加字段（契约 §4）；N6——`world.mods` 盖章交还 `tickWorld`，`core/store` 不再 import 领域层（§1 豁免撤销）。验收记账归 Fable-4（`docs/ACCEPTANCE.md`）。

剩余顺序建议：

1. **收敛探索 UI 双轨**（N4，Opus-4）：fish 屏迁移到 `beginCast/hookCast`（state 路径），刷新不丢竿、`syncFishingWeather` 才管得到 UI 的竿；同性质残留（自 N3 移入）：dive 屏仍直调 `diveStep` 不刷新 `o2Mult`，宜同批退回消费 `advanceDive`（海啸禁潜的强制上浮已由量子巡检兜底，剩的是非零倍率天气的氧耗时效性）。迁移前两条路径都冻结。
2. **N2 文案与 N8 双份常量**：`STAGE_RULES.seedFormula` 改一行（Fable-3）；双份常量按归属方收敛为读表/读契约常量。
3. 事件/居民/coins 消费（N10/N11）依赖 Fable-3 数值与 Opus 接线，可与上面并行；D9（N9 随机 seed）与版本迁移是壳层小活，见缝插针。
4. **N5 收敛**（explore 结果补 `message` 字段的附加式方案）与 **N7**（离线块序掺 nonce）排低优先，不阻塞其他线。
