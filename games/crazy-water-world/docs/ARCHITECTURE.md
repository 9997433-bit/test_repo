# 架构（Round 1 冻结稿）

> 维护者：Fable-1（架构 / API 契约）。基线 commit `14b21c9`，分支 `cursor/crazy-water-world-c895`。
> 配套文档：`docs/API_CONTRACT.md`（严格契约与禁止改名清单）。改代码前先读契约。
>
> 标记约定：**[冻结]** 不得变更；**[R2 必改]** Round 2 必须落实；**[附加]** 允许新增、不得破坏既有行为。

## 0. 技术选型 [冻结]

- 独立 Vite 工程 + 原生 ES Module，**零 UI 框架、零运行时依赖**（devDependencies 仅 vite / vitest / jsdom）。
- 全部游戏规则是可单测纯函数；DOM/Canvas/Audio 只存在于明确的壳层文件（见 §3）。
- 开发/预览端口 **4174**，`strictPort: true`（同仓库其他游戏用 4173 等，端口冲突时直接报错而不是漂移）。

## 1. 模块图与依赖方向

```
                    ┌──────────────────────────────┐
                    │  index.html → src/main.js    │  壳：水合存档、启动
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │ src/core/engine.js  boot()   │  rAF 循环、定步长、自动存档
                    └──┬──────────────────────┬────┘
          纯模拟（每 0.1s 量子）          渲染/输入（每帧）
             │                                │
   ┌─────────▼─────────┐            ┌─────────▼─────────┐
   │ world/sim.js      │            │ ui/app.js render()│──▶ world/canvas.js
   │ explore/salvage.js│            │  （唯一 DOM 组装点）│──▶ audio/sfx.js
   └─────────┬─────────┘            └─────────┬─────────┘
             │      两侧都只通过 store 交换状态  │
   ┌─────────▼────────────────────────────────▼─────────┐
   │ core/store.js（单一状态）· core/rng.js（确定性随机）  │
   └─────────┬──────────────────────────────────────────┘
             │
   ┌─────────▼──────────────────────────────────────────┐
   │ 领域规则（全部纯函数，禁止 DOM / IO / 全局时间）        │
   │  world/grid.js  world/build.js  world/sim.js        │
   │  explore/{salvage,fishing,dive}.js                  │
   │  heroes/roster.js  combat/battle.js                 │
   └─────────┬──────────────────────────────────────────┘
             │
   ┌─────────▼──────────────────────────────────────────┐
   │ src/data/*（静态表：建筑/英雄/关卡/鱼/天气/资源）        │
   └────────────────────────────────────────────────────┘
```

允许的依赖边（import 方向）**[冻结]**：

| 发起方 | 允许 import |
| --- | --- |
| `src/data/**` | 什么都不许（叶子层，纯常量 + 无副作用工厂函数） |
| `world/ explore/ heroes/ combat/` | `src/data/**`、`core/rng.js`，以及本目录内文件 |
| `core/store.js` | `src/data/**`、`core/rng.js` |
| `core/engine.js` | `core/**`、`world/sim.js`、`explore/salvage.js`；**不得 import `ui/**`**（见缺陷 D1） |
| `ui/app.js` | 任何 `src/**` |
| `src/main.js` | `core/**`、`styles/**` |
| 任何文件 | **禁止** import 仓库根、`../../`、其他 `games/*`、任何 npm 运行时包 |

每个领域目录的 `index.js` 是对外唯一门面，UI 与测试原则上只从门面或契约列出的具体文件导入。

## 2. 时钟模型

- **模拟量子 [冻结]**：0.1s。`boot()` 里 rAF 累加真实时间 × `meta.speed`（1/2/4），每攒满 0.1s 执行一次量子：`tickWorld(state, 0.1)` → 刷新漂浮物 → `meta.tick += 1`。`meta.tick` 是**唯一的模拟时间轴**，所有派生随机都以它为盐（§4）。
- 单帧真实 dt 上限 0.05s：掉帧时模拟变慢而不是跳变（有意为之，不算缺陷）。
- 昼夜：`timeOfDay += dt/240`，即一天 240 秒真实时间（1x 速度）。天气持续 70–120s 后按权重重掷。
- **离线补算 [R2 必改]**：契约已预留 `meta.savedAt`（存档时刻，`Date.now()` 毫秒，只允许在存/读档的壳层写入）。加载时 `elapsed = min(now - savedAt, 8h)`，按最多 120 个粗粒度块调用 `tickWorld(state, elapsed/块数)` 补产出，不补漂浮物、不掷天气事件日志。基线的 `campaign.idleSince` 一直累加但没人消费（缺陷 D8）。
- **纯模拟量子入口 [R2 必改]**：把「tickWorld + spawnFlotsam + tick++」抽成纯函数 `stepSim(state): GameState`（附加导出，见契约 §5），`boot()` 退化为「rAF + stepSim + render + 自动存档」的薄壳，让测试能驱动与线上完全一致的量子。

## 3. DOM / 副作用隔离 [冻结]

允许触碰 DOM、`window`、`performance`、`Date`、`localStorage`、`AudioContext` 的文件——**白名单**：

| 文件 | 允许的副作用 |
| --- | --- |
| `src/main.js` | `document`、`localStorage`（读档水合） |
| `src/core/engine.js` | rAF、`performance.now`、`setInterval`（自动存档） |
| `src/core/store.js` | 仅 `saveState/loadState` 两个函数内的 `localStorage` |
| `src/ui/app.js` | 全部 DOM、事件监听 |
| `src/world/canvas.js` | Canvas 2D、`window.devicePixelRatio` |
| `src/audio/sfx.js` | WebAudio |

白名单之外（`world/grid|build|sim`、`explore/**`、`heroes/**`、`combat/**`、`data/**`、`core/rng`）：

- 禁止 `Math.random`、`Date.now`、`performance.now`、`localeCompare`、`Intl`、`crypto`、`navigator`、任何 DOM API。
- 禁止修改入参（用展开或 `structuredClone` 出新值）；失败路径必须返回**原对象引用**（`===`，契约 §2）。
- 同输入必须同输出（随机性一律显式经 `rng` 参数或从 `(seed, tick, 盐)` 派生）。

## 4. RNG 策略

统一原语在 `core/rng.js`：`mulberry32`（32 位种子流）、`hashSeed`（FNV-1a 字符串→u32）、`pickWeighted`。

**祝福模式：派生瞬时流 [冻结]**。不保存 RNG 游标，每次需要随机时从 `(meta.seed, meta.tick, 域盐)` 现场派生：

```js
const rng = mulberry32((state.meta.seed ^ hashSeed("盐字符串") ^ state.meta.tick * 素数) >>> 0);
```

这样存档只需存 `seed + tick`，读档后模拟严格可复现。各域的盐与现状：

| 域 | 基线做法 | 状态 |
| --- | --- | --- |
| 天气重掷（sim.js） | `mulberry32(seed + tick)` | 符合模式，保留 |
| 钓鱼（fishing.js） | `mulberry32(seed + tick*17)` | 符合模式，保留 |
| 漂浮物（engine.js） | boot 时建一条长命流传给 `spawnFlotsam`，游标不落盘 | **[R2 必改]** 改派生模式（`stepSim` 内派生，盐 `"salvage"`），否则读档后漂浮物序列漂移 |
| 潜水（dive.js） | 完全无随机：节点/鲨鱼写死 | **[R2 必改]** 从 `(seed, tick, zone)` 派生布局 |
| 战斗（battle.js） | 调用方传 seed | 保留；UI 侧 seed 公式见缺陷 D12 |

新游戏 seed：`defaultState` 基线写死 `20260108`（缺陷 D9）。目标：壳层（main.js/ui）在「启航」时生成随机 seed 注入；测试仍用固定 seed。**seed 的生成属于壳层副作用，领域层只消费。**

## 5. 状态与存档

- 单一 `createStore`；`GameState` 完整字段模式见契约 §3，**字段集合冻结**，新增字段走「附加 + 默认值」流程并同步契约。
- `store.patch` 是**顶层浅合并**——改嵌套字段必须自带展开（`{ meta: { ...s.meta, x } }`）。深层直接赋值 = 契约违规。
- 存档：`localStorage["cww.save.v1"]`，内容 = `JSON.stringify(GameState)` 全量。键前缀 `cww.` 是本游戏在 localStorage 的命名空间 **[冻结]**，其他游戏不得使用。
- 自动存档：started 状态下每 4s 一次；读档时 `started` 强制回 false（回标题屏）。
- **版本迁移 [R2 必改]**：`loadState` 目前不校验 schema（缺陷 D10）。规则：`meta.version` 与存档键版本号一起变；不兼容时改键名 `cww.save.v2` 并写迁移函数，禁止让旧档直接崩运行时。

## 6. 与同仓库其他游戏的隔离 [冻结]

1. 本游戏一切文件都在 `games/crazy-water-world/`；**禁止**改仓库根业务文件（`/test.js` 等）与其他 `games/*`。
2. 代码内禁止出现走出本目录的相对路径 import（`../../` 越过包根即违规）。
3. 端口 4174 独占且 strictPort；localStorage 键独占 `cww.` 前缀。
4. 依赖独立 `package.json` / `package-lock.json`，不使用 npm workspace，不装运行时依赖。
5. 文件所有权与并发分工见 `/.agent_workspace/PROGRESS.md` 与 `docs/OWNERSHIP.md`；共享只读文件（package.json、vite.config.js 等）只追加不删改他人段落。

## 7. 性能预算

`npm run bench` 门槛（超标即 exit 1）**[冻结]**：`tickMs ≤ 4`、`spawnMs ≤ 2`、`battleMs ≤ 12`。基线实测 0.019 / 0.002 / 0.05 ms，余量巨大——但注意 bench 目前因静默失败实际在跑 0 建筑（缺陷 D13），数字虚低。

已知热点：`tickWorld` 每量子 `structuredClone` 全量状态（每秒 10 次全深拷贝）。允许改成按需展开拷贝 **[附加]**，但「不改入参、失败返回原引用」两条铁律不变。渲染侧 60fps 目标见 `docs/SOTA_CHECKLIST.md`。

## 8. 测试与验证矩阵

| 命令 | 覆盖 | 说明 |
| --- | --- | --- |
| `npm test`（vitest + jsdom） | `tests/*.test.js`：建造合法性、产出、扩建、拾荒/钓鱼/潜水、战斗确定性、招募/委任/升星 | 只准 import 契约冻结符号 |
| `npm run probe` | 冒烟：store 启动、放 hq、时间推进、战斗返回 | 任何 FAIL exit 1 |
| `npm run bench` | tick/spawn/battle 单次耗时门槛 | 见 §7 |
| `npm run stress` | 20 次扩建 + 全建筑铺放 + 2000×0.25s tick 不死人 | 长时数值稳定性 |

Round 2 新增测试的硬性要求：战斗快照用 `JSON.stringify(simulateBattle(...))` 做**字节级**断言（契约 §8）；每修一个 §9 缺陷配一条回归测试。测试不得断言中文人话文案（会被 Fable-2/3 调整），只断言 reason 码与数值。

## 9. 已知缺陷 / 架构债（基线 `14b21c9`）

按修复归属排列（角色 → 所有权见 PROGRESS.md）。**契约层面的不一致**另见 `API_CONTRACT.md` §10。

**Opus-1（world/core）**

- D1 `core/engine.js` import 了 `ui/app.js`（下层依赖上层）。改法：`boot(root, store, renderFn)` 或由 main.js 注入 render。
- D2 领域动词全部**静默失败**（资源不够 / 等级不足 / 目标不存在时原样返回），UI 无法解释原因。改法：按契约 §2 的 `can*` 前置检查 + reason 码补齐。
- D3 `canPlace` 的 `reason` 是中文人话不是稳定码；契约 §2 定义了码表与 `message` 字段分离方案。
- D4 `upgradeBuilding` 不检查解锁等级、无最高级上限；`tiles` 里的 `level` 与 `buildings[].level` 双写（易失同步），`occupant` 字段全程死值 null。
- D5 天气重掷派生 rng 用 `(seed + tick)`，单次大 dt 调用内 tick 不变——离线补算实现时同一 tick 会重掷出同一天气。
- D6 `expandRaft` 把一切非 left/right/down 的 dir 当 up；非法 dir 应返回原引用。
- D7 `defaultState(seed)` 顶层浅合并：传部分嵌套（如只有 width 的 `raft`）会覆盖掉 tiles，坏档。
- D8 离线补算完全缺失：`campaign.idleSince` 无消费者，存档无 `savedAt`。
- D9 新档 seed 写死 `20260108`，人人同一条命运线。
- D10 `loadState` 无 schema/版本校验，坏 JSON 结构会带病进运行时。

**Opus-2（explore）**

- D11 `startDive` 布局写死（每次潜水同一批节点/鲨鱼），`zone` 参数无内容差异；`finishDive` 收到失败会话（`{ok:false}`）会因 `session.loot` undefined 直接抛异常。`spawnFlotsam` 的 ttl 衰减写死 0.1 而不是用 dt 参数；engine 的拾荒 rng 游标不落盘（§4）。

**Opus-3（heroes/combat）**

- D12 战斗确定性隐患：出手排序用 `name.localeCompare`（ICU/locale 相关，跨环境不保证字节稳定），必须换码点比较。技能层：`skill.star` 解锁星级只对 taunt 生效（burst/aoe/heal/multishot 无视星级门槛）；`buff` 类型（微醺之龙）在 battle.js 根本没实现；multishot 是恒定 ×1.15 而非多段。UI 侧战斗 seed = `meta.seed + stage*99`，重打同关永远同结果，需要加 `campaign.attempts` 盐（字段归 Opus-3 提、契约已预留）。`assignHero` 不校验 hero/building 存在；被顶替英雄的 `assignedBuildingId` 变悬挂引用。`injuredUntil` 全程死字段。
- D13 「5v5」未成立：关卡只配 4 个敌人（数据归 Fable-3），我方人数无上限也无上阵选择。契约 §8 规定双方 1–5、超出确定性截断。

**Opus-4（ui/main/audio）**

- D14 `render()` 每帧重写左右面板 `innerHTML` → 钓鱼滑条 `#timing` 每帧被重置回 50，**钓鱼小游戏在 UI 上实际不可玩**；也导致按钮焦点丢失。需改成按 state 变化的差异更新或把频繁重绘限制在 canvas。
- D15 潜水会话与钓鱼 cast 存在 ui/app.js 模块级变量里，没进 `state.explore.dive/fishing`——刷新即丢，且与契约的 GameState 定义矛盾；dive 模拟用写死 dt=0.032 跑在渲染路径里。
- D16 GDD 要求的拖拽移动（`moveBuilding`）与旋转（rot 90）逻辑层已有、UI 完全没接（永远 rot=0）；无拆除入口。
- D17 居民系统只剩装饰：`fulfillOrder` 写死 `residents[0]`、无居民招募、`house.pop` 无消费者；饥渴归零按 GDD 应产能减半，基线只扣血。`player.coins/diamonds` 无任何进出账。

**GPT-sol（tests/scripts）**

- D18 bench.mjs 因 D2 静默失败：8 次扩建只成功 1 次、hq 买不起，最终 0 建筑在跑基准（输出 `buildings: 0`），门槛形同虚设。修 D2 后 bench 应断言 `buildings > 0`。

## 10. Round 2 落地顺序建议

1. 先冻结契约（`API_CONTRACT.md` 已列禁止改名清单），各角色只做自己所有权内文件。
2. Opus-1 先落 D2/D3（reason 码）+ `stepSim`，因为 Opus-2/3/4 与 GPT-sol 的工作都踩在失败语义和量子入口上。
3. Opus-3 的 D12 换排序比较器会改变既有战斗快照——快照测试必须在该修复**之后**由 GPT-sol 重新落盘。
4. D14/D15（UI 可玩性）不依赖别人，可并行。
5. 数据表数值（5 敌人编队、平衡）由 Fable-3 在 `src/data/**` 独立调，引擎按契约字段消费，互不阻塞。
