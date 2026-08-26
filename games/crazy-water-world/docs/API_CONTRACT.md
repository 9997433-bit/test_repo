# API 契约（Round 2 落地版）

> 维护者：Fable-1。基线：Round 2 合并树 commit `25fd9c6`（Round 1 冻结稿基线 `14b21c9`）。
> 本版在 Round 1 冻结稿上**只附加、不改名、不改参数顺序**；Round 1 标记为 [R2] 的目标语义凡已落地，一律改标 **[冻结]** 并按实现写实。
> 测试、探针、bench 只依赖本文符号；**§9 清单内的导出禁止改名、禁止改参数顺序**。
> 类型用 TS 记法描述（代码本体仍是 JS）。`int` = 整数，`u32` = 32 位无符号整数，数值区间用 `a..b` 闭区间。
> 标记：**[冻结]** 现状即契约；**[附加]** 本轮新收编的符号（同样冻结改名，但允许继续加可选参数/返回键）；**[R3]** 下一轮要落实的目标语义。

## 1. 总则

1. 变更纪律：冻结符号只能**附加**（新可选参数放末尾且有默认值、返回对象只加新键不删旧键、GameState 只加带默认值的新字段）。破坏性变更必须先改本文并通知全体角色。
2. 领域函数（world/explore/heroes/combat）一律 **state-in / state-out**：不 mutate 入参，返回新对象；**无事发生时返回入参原引用**（`===`），这条对 `sync*` / `tick*` 巡检类函数同样成立。
3. 所有数值单位：时间一律**秒**（模拟时间）；`meta.savedAt` 例外（壳层墙钟毫秒）。
4. 静态表（`src/data/**`）字段名冻结、数值可调（Fable-3 所有权）。引擎侧禁止硬编码任何表内数值——本轮 sim/build/explore/combat 已全面改读表，新增表字段一律先在表文件头注释语义再消费。

## 2. 失败语义与 reason 码 [冻结]

**失败 = 返回入参 state 的原引用（`===`）**。这是可测试的统一约定：

```js
const next = placeBuilding(s, "hq", 0, 0, 0);
if (next === s) { /* 失败：用 canBuild 等前置检查取原因 */ }
```

每个会失败的动词配一个**纯前置检查**，返回 Result 对象。码表与工厂在 `core/reasons.js`（`REASON` / `REASON_MESSAGE` / `allow(extra)` / `deny(code, extra)`）[冻结]：

```ts
// world / heroes 侧（core/reasons.js 口径）
type Result = { ok: true, reason: "", ...extra }
            | { ok: false, reason: ReasonCode, message: string, ...extra }
// explore 侧（explore/mods.js EXPLORE_REASON 口径，历史形状，见 §10-N5）
type ExploreResult = { ok: true, reason: "", code: "", ...extra }
                   | { ok: false, reason: string /*中文人话*/, code: ReasonCode, ...extra }
```

- 码是稳定 ASCII 字符串，**测试只断言码**（world/heroes 断言 `reason`，explore 断言 `code`）。
- `message`（world/heroes）与 explore 的 `reason` 是中文人话，允许随文案调整，**测试禁止断言**。

| ReasonCode | 触发 |
| --- | --- |
| `E_UNKNOWN_TYPE` | 建筑/英雄/鱼/海区 id 不在数据表 |
| `E_LOCKED` | 解锁双口径均未达标（§6）；英雄养伤中不可委任；海区 dockLevel/stage 门槛未达 |
| `E_BOUNDS` | 足迹越出木筏；扩建超 `MAX_RAFT_SIDE` |
| `E_OCCUPIED` | 目标格被其他建筑占用 |
| `E_UNIQUE` | 唯一建筑（hq）已存在 |
| `E_COST` | 资源不足 |
| `E_NOT_FOUND` | 按 id 找不到建筑/英雄/漂浮物/鱼池为空 |
| `E_REQUIRES_BUILDING` | 缺前置建筑（钓鱼椅/潜水船坞/广播站） |
| `E_DUPLICATE` | 重复招募同 heroKey |
| `E_MAX_STAR` / `E_MAX_LEVEL` | 已满星（5）/ 建筑已到 `maxLevel` |
| `E_INVALID_ARG` | 非法参数（expandRaft 的 dir、非法 rot、非整数坐标、非法命中点） |
| `E_WEATHER` [附加] | **探索独有**：当前天气封锁该玩法（海啸 `fishing=0` 禁钓、`diveO2=0` 禁潜）。定义在 `explore/mods.js` 的 `EXPLORE_REASON`，不进 core 码表（explore 不 import core/reasons，避免反向依赖；码面字符串按值对齐） |

前置检查清单（全部已落地 [冻结]）：

- world：`canPlace` `canBuild` `canMove` `canUpgrade` `canExpand` `canDemolish` `unlockCheck`
- heroes：`canRecruit` `canAssign` `canStarUp`
- explore：`canCast` `canDive`（ExploreResult 形状）

## 3. GameState 类型 [冻结字段集，本轮只附加]

```ts
type ResourceKey = "wood"|"plastic"|"scrap"|"rope"|"stone"|"rawFish"|"fillet"|"meal"
  |"freshWater"|"wheat"|"seed"|"salt"|"blueprint"|"hourglass"|"badge"|"shard"
  |"tool";           // [附加] 工坊配方产物，高级升级的 upgradeExtra 消耗
type Screen = "title"|"raft"|"build"|"fish"|"dive"|"heroes"|"campaign";
type WeatherId = "clear"|"haze"|"rain"|"storm"|"tsunami";
type Dir = "left"|"right"|"up"|"down";

interface GameState {
  meta: {
    title: string; version: string;
    seed: u32;            // 全局命运种子，开局后不变（新档仍写死 20260108，§10-N9）
    tick: int;            // 模拟量子计数（0.1s/量子），唯一模拟时间轴
    speed: 1|2|4;
    started: boolean;     // 读档水合时强制 false
    screen: Screen;
    savedAt?: number;     // [冻结] 墙钟毫秒，仅 saveState 写入；hydrateSave 折算离线秒数
  };
  player: {
    name: string;
    hunger: number; thirst: number; hp: number;   // 0..100（hp 下限钳 1，无硬死亡）
    coins: int; diamonds: int;                    // 已有进账：首钓 firstCatch、关卡 reward/firstClear；仍无消费方（§10-N10）
    exp: int; level: int;                         // 升级阈值 level*80
  };
  resources: Record<ResourceKey, number>;         // 允许小数（产出连续累积）；支付校验 >= 整数消耗
  raft: {
    width: int; height: int;                      // 初始 RAFT_RULES.startSize（6×5）；单边上限 MAX_RAFT_SIDE=32
    tiles: (null | TileRef)[][];                  // [height][width]，行优先
  };
  buildings: Building[];
  residents: Resident[];
  heroes: HeroInstance[];
  world: {
    timeOfDay: number;    // 0..1，一天 240s
    weather: WeatherId;
    event: null | string; // 预留（EVENTS 表已备、无消费方，§10-N11），恒 null
    seaSeed: u32;         // 海面渲染专用，不参与规则
    weatherTimer: number; // 秒；读表 durationSec 掷出
    mods?: ModsSnapshot;  // [附加] 派生倍率快照：tickWorld 每量子回写、defaultState 现算。
                          //   存档带来的 mods 一律作废重算（防手改档毒化模拟）。
                          //   消费方：explore/mods.exploreMods 优先读它，缺席回退天气表。
  };
  explore: {
    salvage: {
      flotsam: Flotsam[];
      picked?: int;         // [附加] 累计拾取数（normalize 会丢，§10-N1）
      rarePicked?: int;     // [附加] 累计稀有拾取（同上）
      lastPick?: object;    // [附加] 最近一次拾取摘要 { id,res,name,n,gain,rare,tier,tick }（同上）
    };
    fishing: {
      lastCatch: null | LastCatch;
      cast?: FishingCastOk | null;  // [附加] 进行中的竿（beginCast 写入；normalize 会丢，§10-N1；UI 现走 ctx.ui 双轨，§10-N4）
      castTick?: int;               // [附加] 抛竿时刻（同上）
      codex?: Record<string, FishCodexEntry>; // [附加] 鱼类图鉴（resolveHook 维护；normalize 会丢，§10-N1）
    };
    dive: null | DiveSession;       // [冻结] 潜水会话挂 state（M11 已关）
    diveRecord?: DiveRecord;        // [附加] 潜水生涯统计（finishDive 维护；normalize 会丢，§10-N1）
  };
  campaign: {
    stage: int;           // 下一个待打关（1 起）
    bestStage: int;
    idleSince: number;    // 秒；离线/挂机累计，stepSim 每量子经 settleOffline 清算归零
    attempts: int;        // [冻结] 当前关重试计数，作战斗 seed 盐（败 +1 / 胜清零）
  };
  settings: { muted: boolean; reduceMotion: boolean };
  log: string[];          // 最新在前，硬上限 24 条
}

interface ModsSnapshot {  // weatherMods() 的返回形状 [附加，只加键不删键]
  weather: WeatherId; name: string;
  prod: number; salvage: number; damage: number;
  hunger: number; thirst: number;
  fishing: number;        // 0 = 禁钓
  diveO2: number;         // 0 = 禁潜；已含 dive_dock 邻接省氧修正
  stillBonus: number; warnSec: number; quip: string;
  canFish: boolean; canDive: boolean;
}

interface TileRef { buildingId: string; level: int; rot: 0|90; occupant: null }
// tiles 内 level 是 buildings[].level 的镜像（placeBuilding/upgradeBuilding/moveBuilding 已双写同步）；
// occupant 仍是恒 null 的死字段（保留形状兼容，禁止读它做逻辑）。

interface Building {
  id: string;             // `${type}-${序}-${tick}`，全局唯一且防撞，禁止解析其结构
  type: keyof typeof BUILDINGS;
  x: int; y: int;         // 足迹左上角
  level: int;             // 1 起；上限 def.maxLevel ?? MAX_BUILDING_LEVEL(8)
  rot: 0|90;
  occupantHeroId: string | null;
}

interface Resident {
  id: string; name: string; job: string;
  hunger: number; thirst: number; hp: number; mood: number;  // 0..100
  order: null | { want: ResourceKey, qty: int, rewardExp: int };
}

interface HeroInstance {
  id: string;             // 恒等于 `h-${heroKey}`（每 heroKey 至多一个实例）
  heroKey: keyof typeof HEROES;
  star: 1|2|3|4|5;
  xp: int;
  assignedBuildingId: string | null;
  injuredUntil: number;   // 模拟秒；0=健康。消费方：isInjured/canAssign/readyHeroes/tickInjuries。
                          //   生产方 applyBattleInjuries 已实现但运行时无人调用（§10-N3）
}

interface Flotsam {
  id: string;             // `f-${tick}-${n}`，禁止解析
  res: ResourceKey; n: int;      // 入袋数量 ≥1（闪光件 +1）
  rare: boolean;          // 表定稀有 或 闪光升格
  x: number;              // -1..1 海面归一化横坐标（越界回绕 ±1.12）
  y: number; vx: number;  // 渲染漂移
  ttl: number;            // 秒，≤0 由 spawnFlotsam 清除
  tier?: "common"|"shiny"|"rare";  // [附加]
  phase?: number;         // [附加] 闪光相位 0..1
  shimmer?: number;       // [附加] 派生亮度 0..1（只吃 tick+phase，不读墙钟）
  bornTick?: int; maxTtl?: number; // [附加]
}

interface LastCatch {     // [附加键集，只加不删]
  miss: boolean; name: string;
  id?: string | null; grade?: "perfect"|"good"|"miss"; perfect?: boolean;
  timing?: number; window?: [number, number]; accuracy?: number;
  gained?: Partial<Record<ResourceKey, number>>; exp?: int;
  newEntry?: boolean; bonus?: null | { coins?: int, diamonds?: int };
  forced?: boolean;       // 天气强制收杆（不计图鉴、不算空军）
}

interface FishCodexEntry { // [附加]
  id: string; name: string; sea: string; rarity: string;
  caught: int; perfect: int; missed: int; encountered: int;
  bestAccuracy: number; firstTick: int | null; lastTick: int;
}

interface DiveRecord {     // [附加]
  runs: int; deaths: int; bestDepth: number; bestHaul: int;
  lastRun: { zone: string, depth: number, loot: int, alive: boolean, tick: int };
}
```

## 4. core/store.js

```ts
createStore(seed?: DeepPartial<GameState>): Store       // [冻结]
defaultState(seed?: DeepPartial<GameState>): GameState  // [冻结] 现为深合并 + normalize 钳域（M8 已关）
Store.get(): GameState
Store.patch(partial: Partial<GameState>): GameState     // 顶层浅合并！嵌套字段调用方自己展开
Store.replace(next: GameState): GameState               // 整体换引用；领域动词的结果用这个回写
Store.subscribe(fn: (s: GameState) => void): () => void
saveState(state: GameState): void                       // localStorage["cww.save.v1"]，写入时盖 meta.savedAt=Date.now()，try/catch 吞配额错
loadState(): GameState | null                           // 内部走 hydrateSave(JSON.parse(raw), Date.now())
hydrateSave(raw: unknown, nowMs: number): GameState | null  // [附加] 纯函数：任意来源存档 → 合法 GameState；
                                                        //   savedAt 差值折进 campaign.idleSince（OFFLINE_CAP_SECONDS=8h 封顶），
                                                        //   顶层既无 meta 也无 raft 的对象判坏档返回 null
OFFLINE_CAP_SECONDS: 28800                              // [附加]
```

- `patch` 与 `replace` 每次调用同步通知全部订阅者，无去重、无批处理 [冻结]。
- `defaultState` 内部 `deepMerge`（递归对象合并）+ `normalize`：每个字段钳回合法域、缺失补默认值、tiles 按 width×height 重建、resources 全 key 补零、`world.mods` 一律现算作废存档值。**传嵌套片段不再坏档**（M8 已关）。
- **已知债（§10-N1）**：`normalize` 的 explore 分支是白名单制，只保 `salvage.flotsam` / `fishing.lastCatch` / `dive`——`fishing.codex/cast/castTick`、`salvage.picked/rarePicked/lastPick`、`diveRecord` 会在读档时丢失。
- 存档键 `cww.save.v1` [冻结]；schema 破坏性变更时升键名 `cww.save.v2` 并写迁移（迁移函数仍缺，[R3]）。

## 5. core/engine.js 与 core/rng.js

```ts
boot(root: HTMLElement, store: Store, options?: { render?: (root, store) => void } | RenderFn): void
  // [冻结] DOM 壳：rAF 循环 + 每 AUTOSAVE_MS 自动存档 + beforeunload 落盘。
  // render 由壳层（main.js）注入；不给 render 就只跑模拟（headless）。
  // core 对 ui 零依赖——静态与动态 import 都没有（D1 已关）。
stepSim(state: GameState): GameState                // [冻结] 纯量子，铁序：
  // settleOffline(s, idleSince) → tickWorld(s, 0.1) → spawnFlotsam(s, deriveRng(seed, tick, "salvage")) → idleSince=0 → tick+1
QUANTUM: 0.1  MAX_FRAME_DT: 0.05  AUTOSAVE_MS: 4000  // [附加]

mulberry32(seed: u32): () => number                 // [冻结] 返回 [0,1) 流
hashSeed(str: string): u32                          // [冻结] FNV-1a
deriveRng(seed: u32, tick: int, salt: string, nonce?: int): () => number
  // [附加·冻结] 派生瞬时流：(seed ^ hashSeed(salt) ^ imul(tick,2654435761) ^ imul(nonce,40503)) >>> 0
pickWeighted<T>(rng, pairs: [T, number][]): T       // [冻结] 权重和>0；空数组是调用方违规
```

确定性铁律（领域层全体适用）[冻结]：

1. 随机只来自显式 `rng` 参数，或 `deriveRng(meta.seed, meta.tick, 域盐, nonce)` 现场派生。
2. 禁止 `Math.random / Date.now / performance.now / localeCompare / Intl / crypto`。
3. 字符串比较用码点（`combat/ai.js byCodePoint`）；`Array.prototype.sort` 可用（ES2019 起稳定）但比较器必须全序且确定。
4. rng 的**消费次数与顺序**是契约的一部分：在同一派生流上增删 rng 调用 = 破坏性变更（战斗快照、潜水布局、拾荒序列都靠这条活着）。
5. 幂运算用逐次相乘不用 `Math.pow`（IEEE 乘法跨引擎一致，pow 不保证）——`upgradeCost` 已按此实现。

各域盐 [冻结]：天气 `deriveRng(seed, tick, "weather", roll)`（roll = 单次 tickWorld 内的重掷序号 0..7）；拾荒 `deriveRng(seed, tick, "salvage")`（stepSim 每量子重派生，游标不落盘、读档可复现，M9 已关）；钓鱼 `mulberry32(seed + tick*17)`（Round 1 口径保留）；潜水布局 `mulberry32(hashSeed("dive|" + zone + "|" + seed + "|" + tick))`；战斗 seed 归调用方（§8.7）。

## 6. world

### 6.1 解锁与报价 [冻结]

```ts
unlockCheck(state, type: string)
  : { ok: true, reason: "", need: int, needHq: int, hq: int }
  | { ok: false, reason: "E_UNKNOWN_TYPE"|"E_LOCKED", message: string, need?, needHq?, hq? }
  // 解锁双口径：player.level ≥ UNLOCK_LEVEL[type]（旧档兼容） 或 hqLevel(state) ≥ UNLOCK_HQ[type]（GDD 目标口径），
  // 任一达标即解锁。hqLevel = 已建 hq 的最高 level，没建 = 0。

upgradeCost(type: string, level: int): Record<ResourceKey, int> | null
  // L→L+1 报价 = ceil(def.upgrade[k] × def.upgradeGrowth^(L-1))，逐次相乘实现；
  // RESOURCE_META[k].tier === "rare" 的稀缺件（蓝图/沙漏等）每级固定不乘；
  // level ≥ def.upgradeExtra.fromLevel 时叠加 upgradeExtra.add（工具的主要去向）。

canBuild(state, type, x, y, rot?)      // 检查顺序 [冻结]：表存在 → unlockCheck → canPlace → 资源。ok 附 { cells, cost }
canMove(state, id, x, y, rot?)         // 忽略自身足迹后走 canPlace
canUpgrade(state, id)                  // E_NOT_FOUND / E_UNKNOWN_TYPE / E_MAX_LEVEL(cap=def.maxLevel??8) / E_COST。ok 附 { cost, level, cap }
canExpand(state, dir: Dir)             // E_INVALID_ARG / E_BOUNDS(单边>MAX_RAFT_SIDE=32) / E_COST。ok 附 { cost }
  // 扩建报价读 RAFT_RULES [冻结]：{ wood: ceil(baseWood + perTileWood × width×height), plastic: RAFT_RULES.plastic }
  //  —— 木筏越大越贵，替代 Round 1 写死的 10+w+h。
canDemolish(state, id)                 // E_NOT_FOUND。ok 附 { refund }
MAX_BUILDING_LEVEL: 8  MAX_RAFT_SIDE: 32  DIRS: ["left","right","up","down"]   // [附加]
```

### 6.2 动词 [冻结]

```ts
canPlace(state, type, x, y, rot?: 0|90, ignoreId?: string | null)
  : { ok: true, reason: "", cells: [int, int][] }
  | { ok: false, reason: ReasonCode, message: string }   // reason 已迁移为码（M4 已关）
  // 只管几何/身份：E_UNKNOWN_TYPE / E_INVALID_ARG(rot∉{0,90}、坐标非整数) / E_UNIQUE / E_BOUNDS / E_OCCUPIED。
  // 资源与解锁归 canBuild（moveBuilding 复用 canPlace 时不该再付一次钱）。

placeBuilding(state, type, x, y, rot?: 0|90): GameState  // canBuild 全过才动手；失败原引用
moveBuilding(state, id, x, y, rot?): GameState           // rot 缺省沿用原朝向；失败原引用
upgradeBuilding(state, id): GameState    // 扣 upgradeCost，level+1（tiles 同步双写），exp +12+4*旧level；到顶 E_MAX_LEVEL 拒绝
demolishBuilding(state, id): GameState   // [附加] 退 floor(cost×0.5)，清足迹，同步清被委任英雄的 assignedBuildingId，写 log
expandRaft(state, dir: Dir): GameState   // 非法 dir 返回原引用（M7 已关）；left/up 平移全部建筑坐标 +1
```

### 6.3 模拟 [冻结]

```ts
tickWorld(state, dt: number): GameState
  // 纯推进 dt 秒（dt≤0 或非数返回原引用）。顺序：
  // 1) 昼夜 timeOfDay += dt/240；
  // 2) 天气：weatherTimer -= dt，≤0 时按档位权重重掷（WEATHER_SCHEDULE 按 hqLevel 取最高适配档，
  //    无档回退 WEATHER_WEIGHTS），时长读 WEATHERS[*].durationSec，单次调用最多重掷 8 次；
  // 3) 生存：饥/渴流失 = dt × 0.35 × mods.hunger（口渴再 ×1.1 × mods.thirst）；断粮断水 hp 流失且产出减半；
  // 4) 居民：饥渴流失 + 床位（Σ pop + popPerLevel×(level-1)）内回心情；
  // 5) 建筑产出**全表驱动**：output/input(维持性消耗，不足整座停产且不扣)/converts(按表序抢原料、minLevel 门槛)，
  //    速率 = 表值 × level × 委任加成(1 + star × ASSIGN_RULES.basePerStar × 擅长建筑再乘 assign.mult)
  //         × 邻接加成(adjacency.likes 命中一次 ×(1+bonus)) × 天气轴(salvage 型建筑吃 mods.salvage 其余 mods.prod)
  //         × 产物修正(freshWater×stillBonus、rawFish×fishing) × dt；
  // 6) 天灾：mods.damage > 0 时玩家 hp -= damage × dt × stormShelter().mult × 0.15；
  // 7) 升级结算（阈值 level*80）；
  // 8) world.mods = weatherMods(...) 快照回写；idleSince += dt。
  // 不增 meta.tick（stepSim 负责）。禁止在此写 explore。

settleOffline(state, seconds: number): GameState
  // [附加·冻结] 离线补算：钳 [OFFLINE_MIN_SECONDS=60, OFFLINE_MAX_SECONDS=8h]，切 ≤120 块逐块 tickWorld，
  // 清 idleSince、写「离线 N 分钟」摘要日志。不补漂浮物、不留逐条天气日志。
  // 已知残留：块间共享同一 meta.tick，天气派生流每块重放（§10-N7）。

stormShelter(state, index?): { walls: int, guard: number, mult: number }
  // [附加] 风暴减伤只认「贴着庇护所（hq→house→任一非墙建筑）的围栏」：mult = max(0.15, 1 - walls × BUILDINGS.wall.guard)

// world/mods.js —— 派生倍率唯一读表口径 [附加·冻结]
weatherOf(state): WeatherDef
hqLevel(state): int
weatherMods(state, index?: AdjacencyIndex): ModsSnapshot
  // 纯派生不写 state；diveO2 已含 dive_dock 邻接省氧（dive_dock.adjacency.bonus）

// world/grid.js（world 内部 + 测试可用）
footprint(type, x, y, rot): [int, int][]
footprintOf(building): [int, int][]                     // [附加]
occupy(tiles, cells, buildingId, level, rot): tiles'    // 出新数组
clearOccupy(tiles, buildingId): tiles'
ringCells(cells): [int, int][]                          // [附加] 足迹外一圈正交邻格（去重、可越界）
adjacentBuildingIds(state, building): string[]          // [附加]
adjacencyIndex(state): Map<string, { ids: Set<string>, types: Map<string, int> }>
  // [附加·冻结] 全岛邻接一次算完，对建筑数线性；sim/mods 复用，禁止退化成 O(B²) 的逐座 filter
adjacentWalls(state, building, index?): Building[]      // [附加]
ROTATIONS: [0, 90]                                      // [附加]

// world/canvas.js（DOM 白名单）
paintSea(canvas, state, tMs): void
canvasToCell(canvas, state, clientX, clientY): { x: int, y: int }  // 可越界，调用方过 canPlace
seaLayout(state, w, h): object                          // [附加] 画面与点击共用的唯一布局真相
pickFlotsam(canvas, state, clientX, clientY, t?): string | null    // [附加]
flotsamPoint(...)  FLOTSAM_RADIUS: 20                   // [附加]
```

## 7. explore

统一约定：explore 一律通过 `explore/mods.js` 读天气（优先 `state.world.mods` 快照，缺席回退 `WEATHERS` 表），**禁止 import world/**（架构 §1）。

```ts
// explore/mods.js [附加·冻结]
EXPLORE_REASON: { REQUIRES_BUILDING, LOCKED, UNKNOWN_TYPE, NOT_FOUND, WEATHER }  // 码面与 core 对齐 + E_WEATHER
exploreMods(state): ModsSnapshot | WeatherDef
modOf(state, field: string, fallback?: number): number
weatherLabel(state): string

// explore/index.js 门面追加 [附加·冻结]
syncExploreWeather(state): GameState
  // 天气巡检总入口 = syncFishingWeather ∘ syncDiveWeather：海啸（fishing/diveO2 = 0）时
  // 强制收杆（不计图鉴不算空军，lastCatch.forced=true）+ 强制上浮（会话 done+forced，战利品照算）。
  // 两线都没受影响返回原引用，可每量子无脑调用。当前运行时无人调用（§10-N3）。
```

### 7.1 拾荒 [冻结]

```ts
spawnFlotsam(state, rng: () => number, dt: number = 0.1): Flotsam[]
  // 纯（给定 rng 流位置）：按 dt 衰减 ttl（M9 已关）、漂移 x（±1.12 回绕）、按容量概率补货。
  // 容量 cap = 10 + 拾荒船数 + Σ拾荒船等级；生成率 0.08 × (dt/0.1) × mods.salvage × 船队加成。
  // rng 消费顺序 [冻结]：刷新判定 → 种类 → 数量 → x → y → vx →（追加）相位 → 闪光判定。
  // 返回新数组不写 state；由 stepSim 用派生流（盐 "salvage"）每量子调用。

collectFlotsam(state, id): GameState        // id 不存在原引用；入袋 ×(1+0.12×Σ船等级)，稀有 +8 exp 普通 +2；
                                            // 更新 salvage.picked/rarePicked/lastPick
collectFlotsamAt(state, point, view): GameState  // [附加] 命中检测 + 拾取一步到位，未命中原引用
hitTestFlotsam(source, point, view): { ok, reason, id, item, ... }  // [附加] 二维命中，与渲染共用几何
flotsamLayout / flotsamScreenPos / flotsamRadius / salvageBonus / salvageSummary / weatherSalvageMul
FLOTSAM_KINDS  FLOTSAM_VIEW                 // [附加] 渲染几何与掉落表（渲染/命中共用一份数字）
```

### 7.2 钓鱼 [冻结]

```ts
canCast(state)          // ExploreResult：E_REQUIRES_BUILDING（缺钓鱼椅）| E_WEATHER（fishing≤0）。
                        // ok 附 { chairLevel, fishing }
fishingMul(state): number       // 天气咬钩率，轴名读 FISHING_RULES.weatherField
fishingPool(state): { sea: "near"|"deep"|"abyss", seas: string[], pool: FishDef[] }
                        // 海域按 SEAS[*].unlock 筛（always / building+level / bestStage）

castLine(state): FishingCastOk | ExploreFail
  // 确定性：rng = mulberry32(seed + tick*17)；消费顺序 [冻结]：选鱼 → 窗口漂移。
  // 窗口 = fish.window ± pad 后随漂移平移夹回 [0,1]；pad = (椅级-1)×0.03 + (fishing-1)×0.08
  //  ——天气直接换算成窗口宽窄（暴雨 1.2 好钓、风暴 0.5 收窄）。
interface FishingCastOk {
  ok: true; id: string /* cast-${tick} */; fish: FishDef;
  window: [number, number]; seed: int;                    // Round 1 冻结键
  perfect: [number, number]; good: [number, number];      // [附加] 完美带 = 窗口中心 perfectRatio 区间
  baseWindow; biteAt; travel; sweep;                      // [附加] 节奏条速度：travel 读 barSweepSec/fish.bar ×椅级×天气
  sea; seas; fishing; weather; chairLevel; poolIds; tip;  // [附加]
}

castCursor(cast, elapsedSec): number        // [附加] 0..1 三角波指针
gradeCast(cast, timing01): { grade: "perfect"|"good"|"miss", hit, perfect, timing, offset, accuracy }  // [附加] 纯判定
GRADES: { PERFECT, GOOD, MISS }             // [附加]

resolveHook(state, cast, timing01): GameState
  // cast.ok=false → 原引用。命中入袋（完美 ×FISHING_RULES.perfectMult，蓝图/徽章/碎片/沙漏等唯一掉落不翻倍），
  // exp 读 fish.xp（完美翻倍取整）；图鉴 codex 命中与空军都记（encountered/caught/perfect/missed/bestAccuracy）；
  // 首钓（newEntry）发 fish.firstCatch 的 coins/diamonds 进 player。miss 不是失败，返回新 state 记 lastCatch。

beginCast(state): GameState                 // [附加] castLine 写进 explore.fishing.cast（刷新不丢）；失败原引用
hookCast(state, timing01): GameState        // [附加] 用 state 里的竿收杆；无竿原引用；天气已禁钓则强制收杆
syncFishingWeather(state): GameState        // [附加] 正在钓且 fishing=0 → 强制收杆；否则原引用
fishCodex(state): { total, known, seas, entries[] }      // [附加] 图鉴面板数据
fishingHud(state): { canCast, reason, code, chairLevel, fishing, weather, sea, seas,
                     casting, fish, window, sweep, lastCatch }   // [附加] 钓鱼屏 HUD 快照
```

### 7.3 潜水 [冻结]

```ts
canDive(state, zone?: string)   // ExploreResult，检查顺序 [冻结]：海区存在 → 有船坞 → dockLevel → stage → 天气。
                                // 码：E_UNKNOWN_TYPE / E_REQUIRES_BUILDING / E_LOCKED / E_WEATHER。ok 附 { zone, dockLevel, diveO2 }
diveZones(state): { id, name, flavor, oxygen, sharks, rareChance, unlocked, reason, code }[]  // [附加] 海区面板
diveO2Mul(state): number        // [附加] 天气氧耗倍率，轴名读 DIVE_RULES.weatherField
DIVE_ZONES  DIVE_RULES  DEFAULT_ZONE: "wreck"   // [附加] 均转发 data/dive.js（双表已收敛为单一真源）

startDive(state, zone?: string): DiveSession
  // 布局从 mulberry32(hashSeed(`dive|${zone}|${seed}|${tick}`)) 派生（M10 已关）：
  // 节点数/掉落读 DIVE_ZONES[zone].nodeCount/nodes（加权），稀有点 ≤1 个按 rareChance 掷且压深水段，
  // 气泡补氧点、鲨鱼数量/速度读表。氧上限 = max(40, def.oxygen + DIVE_RULES.oxygenPerDockLevel×(船坞级-1))。
  // rng 消费顺序 = 源码顺序（普通点 → 稀有点 → 气泡 → 鲨鱼）[冻结]：增删任何 rng 调用即破坏 (seed,tick,zone) 重放。

type DiveSession =
  | { ok: false, reason: string, code: string, ... }
  | { ok: true, zone, zoneName, seed: u32, startedTick: int,
      oxygen, oxygenMax, x /*0..100*/, depth /*0..maxDepth*/, maxDepth /*90*/,
      loot: DiveNode[], alive: boolean, done: boolean,
      sharks: { id, x, y, vx, vy, speed, aggro }[], nodes: DiveNode[],
      bubbles: { id, x, y, amount }[],
      time, bestDepth, danger /*0..1*/, warning, surfaced, forced?, dockLevel,
      o2Base, o2PerDepth, o2Mult,      // 氧耗三件套随会话走（diveStep 纯函数拿不到 state）
      weather, message };
interface DiveNode { id; x; y; res: ResourceKey; n: int; kind: "node"|"rare"; rare: boolean; depthBand; label? }

diveStep(session, input: { x?: -1..1, y?: -1..1, surface?: boolean, boost?: boolean }, dt, opts?: { o2Mult?: number }): DiveSession
  // 纯；dt 钳 [0,2] 并按 0.05s 子步积分（低帧不穿模）。氧耗 = (o2Base + depth×o2PerDepth) × o2Mult ×(boost?1.6:1)；
  // 鲨距 < DIVE_RULES.sharkRadius 判死；depth < surfaceDepth 时 surface 或氧尽可活着结束；
  // 鲨鱼不进 surfaceDepth+咬距 以浅（上浮永远是活路）。旧档会话缺新字段先 hydrate 补默认值。
  // 已结束/非 ok 会话/dt≤0 返回原引用。opts.o2Mult 供 advanceDive 每步刷新天气倍率。

finishDive(state, session = state.explore.dive): GameState
  // 前置条件放宽 [冻结]：非 ok 会话不再抛异常（M10 已关）——explore.dive 有残留就清 null，否则原引用。
  // alive → loot 入袋 + 每件 DIVE_RULES.xpPerLoot exp；死亡 → hp -DIVE_RULES.failHpLoss（下限 8）。
  // 总是清 explore.dive = null 并更新 explore.diveRecord。

beginDive(state, zone?): GameState          // [附加] startDive 写进 explore.dive；失败原引用
advanceDive(state, input, dt): GameState    // [附加] 推进 state 里的会话，每步刷新天气 o2Mult；天气禁潜 → 强制上浮
syncDiveWeather(state): GameState           // [附加] 正在潜且 diveO2=0 → 强制上浮（done+forced）；否则原引用
diveHud(state): { active, zone, oxygen, oxygenPct, depth, loot, danger, warning, diveO2, o2Mult, ... }  // [附加]
```

## 8. heroes / combat

### 8.1 花名册 [冻结]

```ts
canRecruit(state, heroKey)   // E_UNKNOWN_TYPE / E_DUPLICATE / E_REQUIRES_BUILDING（首个英雄免广播站 [冻结]）
recruit(state, heroKey): GameState
canAssign(state, heroId, buildingId | null)
  // 校验两 id 存在（M12 已关）；null = 卸任永远允许（养伤也能撤）；养伤中上岗 E_LOCKED；
  // ok 附 { hero, building, displaced, unassign } —— displaced 是将被顶掉的英雄
assignHero(state, heroId, buildingId | null): GameState
  // 委任互斥：建筑侧 occupantHeroId 与英雄侧 assignedBuildingId 双向同步，被顶替者两侧一起清（无悬挂引用）
canStarUp(state, heroId)     // E_NOT_FOUND / E_MAX_STAR / E_COST（need = star × SHARD_PER_STAR）
starUp(state, heroId): GameState
MAX_STAR: 5  SHARD_PER_STAR: 10  RECRUIT_BUILDING: "radio"   // [附加]
```

### 8.2 伤病 —— 与 meta.tick 时间轴真联动 [附加·冻结]

```ts
TICK_SECONDS: 0.1            // 与 engine.QUANTUM 同值双份（依赖边禁止 heroes import engine，见架构 §1）
INJURY_SECONDS: 300
nowSeconds(state): number    // = meta.tick × 0.1，唯一时刻口径
isInjured(state, hero, now?): boolean
injuryRemaining(state, hero, now?): number   // 健康/到期 = 0，UI 倒计时用

applyBattleInjuries(state, result: BattleResult, seconds?: number): GameState
  // 战报里 side="ally" 且 hp≤0 的英雄（按 id 匹配）→ injuredUntil = 对齐量子网格的 now+span（只延长不缩短），
  // 双侧同步离岗（委任加成当场消失）。无人阵亡返回原引用。
  // 当前运行时无人调用（§10-N3）。

tickInjuries(state): GameState   // 每量子推进：到期销假 + 归队日志；没人到期返回原引用（可零成本挂 stepSim）
clearHealed(state): GameState    // 手动销假（读档清理用）；无变化原引用

// heroes/lineup.js [附加·冻结]
MAX_LINEUP: 5
heroPower(heroKey, star): number      // 排序评分；成长读 HEROES[key].growth（缺省 0.18），与战斗同口径
toBattleUnit(hero): BattleUnit
isReady(state, hero, now?): boolean   // 已知 key 且不在养伤
readyHeroes(state): HeroInstance[]    // 战力降序，平局按 heroKey 码点
selectLineup(state, max?): BattleUnit[]
  // 确定性上阵：取战力前 cap 名；全无前排时用板凳最强前排换最弱；返回前排在前 —— 决定入场序号。
  // 当前 UI 未消费（campaign 用 heroes.slice(0,5)，§10-N3）。
```

### 8.3 simulateBattle —— 确定性是硬约束

```ts
type BattleUnit =                                    // 联盟侧
  { id: string, heroKey: string, star: 1..5 }
  |                                                  // 敌方侧（来自 STAGES 或测试内联）或联盟侧内联数值块
  { key: string, name: string, hp: number, atk: number, def: number,
    spd: number, lane: "front"|"back", skill?: SkillDef };

simulateBattle(seed: u32, allies: BattleUnit[], enemies: BattleUnit[]): BattleResult

interface BattleResult {   // 键序 [冻结]：Round 1 五键在前，附加键在后；整个对象参与字节级快照
  seed: u32;
  winner: "ally" | "enemy" | "draw";                 // 24 回合双方存活 = draw
  log: string[];                                     // 人读战报；快照包含它，改文案=改快照
  duration: int;                                     // 回合数 ≤ MAX_ROUNDS(24)
  leftover: { id, name, side, hp /*≥0*/, maxHp, lane }[];   // maxHp/lane 为附加键
  truncated: boolean;                                // [附加] 任一侧被截到 5 人
  survivors: { ally: int, enemy: int };              // [附加]
  casualties: { ally: string[], enemy: string[] };   // [附加]
  mvp: null | { id, name, side, damage };            // [附加]
}
```

确定性要求（全部 [冻结]，违反=红线）：

1. `JSON.stringify(simulateBattle(seed, A, E))` 对相同 `(seed, A, E)` **字节级相等**，跨 Node / 浏览器 / 平台（stress 已按 30 关 × 128 seed × 双跑 digest 验证）。
2. 唯一随机源是 `mulberry32(seed)`；rng 消费顺序：先按 enemies 数组序为每个敌人掷 1 次 id 后缀，再进回合循环按行动序每次目标选择掷 1 次（连珠周期回合每额外段各 1 次；治疗选目标、AOE 溅射不消费随机）。增删任何 rng 调用 = 破坏快照的契约变更，需重新落盘快照并在 PR 里声明。
3. 行动序：`spd` 降序 → 名字**码点**升序 → 我方优先 → 入场序号升序（`combat/ai.js actionOrder`；localeCompare 已根除，M14 已关）。
4. 禁止读墙钟/环境；数字格式化只允许 `toFixed`（规范定义、跨引擎一致）。
5. 规模：双方各取前 `MAX_SIDE`(5) 个（确定性截断，`truncated` 标记，M15 上限侧已关）。
6. 伤害公式 [冻结]：`max(DMG_FLOOR=4, 有效攻 − 目标def×(1−pierce)×DEF_FACTOR=0.45)`；护盾先于血量吃伤害。
   有效攻 = atk × (1 + 酒劲层数×atkPerStack) × (1 − min(0.45, wither×0.1))；
   有效减伤 = min(0.5, 嘲讽减伤 + min(buffMaxDr, 层数×drPerStack))。
7. **技能全面读表** [冻结]：`planFor(skill, star)` 统一翻译七种 kind ∈ `taunt|multishot|heal|aoe|burst|buff|hook`；
   **所有 kind 尊重 `skill.star` 门槛**（未达星一律返回 null 完全不生效，M14 已关）；
   周期读 `skill.period`（缺省回落 `DEFAULT_PERIOD`，0 = 仅首回合，null 周期类被动永不触发）；
   `buff`（酒劲）已实现：每 period 回合 +1 层（上限 `BUFF_MAX_STACKS=3`），每层 +value 攻并换减伤；
   连珠段数读 `value`（每两星 +1 段，段伤 ×0.62 衰减）；爆发四星起冷却 −1 回合；铁钩把后排拽前排并减速。
8. **成长读表** [冻结]：联盟侧属性 = base × RARITY_MULT[rarity] × (1 + (star−1) × HEROES[key].growth)，
   表缺 growth 回落 `STAR_GROWTH=0.18`。
9. 战斗 seed 归调用方 [冻结]：`battleSeed(state, stage, attempts?) = hashSeed("cww-battle|" + seed + "|" + stage + "|" + attempts)`
   （attempts 缺省读 campaign.attempts），保证重试可变、回放可复现。
   **注意**：线上 campaign 屏现用私有公式 `hashSeed(seed + ":" + stage + ":" + attempts)`，与本导出并存双轨（§10-N2，R3 必须二选一冻结）。

## 9. 禁止改名的导出清单 [冻结]

| 文件 | 导出 |
| --- | --- |
| `core/store.js` | `createStore` `defaultState` `saveState` `loadState` `hydrateSave` `OFFLINE_CAP_SECONDS` |
| `core/rng.js` | `mulberry32` `hashSeed` `deriveRng` `pickWeighted` |
| `core/engine.js` | `boot` `stepSim` `QUANTUM` `MAX_FRAME_DT` `AUTOSAVE_MS` |
| `core/events.js` | `createBus` |
| `core/reasons.js` | `REASON` `REASON_MESSAGE` `allow` `deny` |
| `world/build.js` | `placeBuilding` `moveBuilding` `upgradeBuilding` `demolishBuilding` `expandRaft` `canPlace`(转发) `canBuild` `canMove` `canUpgrade` `canExpand` `canDemolish` `unlockCheck` `upgradeCost` `footprint`(转发) `MAX_BUILDING_LEVEL` `MAX_RAFT_SIDE` `DIRS` |
| `world/grid.js` | `canPlace` `occupy` `clearOccupy` `footprint` `footprintOf` `ringCells` `adjacentBuildingIds` `adjacencyIndex` `adjacentWalls` `ROTATIONS` |
| `world/sim.js` | `tickWorld` `settleOffline` `stormShelter` `OFFLINE_MAX_SECONDS` `OFFLINE_MIN_SECONDS` |
| `world/mods.js` | `weatherMods` `weatherOf` `hqLevel` |
| `world/canvas.js` | `paintSea` `canvasToCell` `pickFlotsam` `seaLayout` `flotsamPoint` `FLOTSAM_RADIUS` |
| `world/index.js` | 上述 world 门面转发 + `REASON` `REASON_MESSAGE` 转发 |
| `explore/salvage.js` | `spawnFlotsam` `collectFlotsam` `collectFlotsamAt` `hitTestFlotsam` `flotsamLayout` `flotsamScreenPos` `flotsamRadius` `salvageBonus` `salvageSummary` `weatherSalvageMul` `FLOTSAM_KINDS` `FLOTSAM_VIEW` |
| `explore/fishing.js` | `castLine` `canCast` `resolveHook` `beginCast` `hookCast` `gradeCast` `castCursor` `fishingPool` `fishingMul` `fishingHud` `fishCodex` `syncFishingWeather` `GRADES` |
| `explore/dive.js` | `startDive` `canDive` `diveZones` `diveStep` `finishDive` `beginDive` `advanceDive` `diveHud` `diveO2Mul` `syncDiveWeather` `DIVE_ZONES`(转发) `DIVE_RULES`(转发) `DEFAULT_ZONE` |
| `explore/mods.js` | `EXPLORE_REASON` `exploreMods` `modOf` `weatherLabel` |
| `explore/index.js` | 上述 explore 门面转发 + `syncExploreWeather` |
| `heroes/roster.js` | `recruit` `assignHero` `starUp` `canRecruit` `canAssign` `canStarUp` `applyBattleInjuries` `clearHealed` `tickInjuries` `injuryRemaining` `findHero` `hasRecruitStation` `isInjured` `nowSeconds` `MAX_STAR` `SHARD_PER_STAR` `RECRUIT_BUILDING` `TICK_SECONDS` `INJURY_SECONDS` |
| `heroes/lineup.js` | `selectLineup` `readyHeroes` `heroPower` `toBattleUnit` `isReady` `MAX_LINEUP` |
| `heroes/index.js` | 上述 heroes 门面转发 |
| `combat/battle.js` | `simulateBattle` `battleSeed` `MAX_ROUNDS` `MAX_SIDE` `STAR_GROWTH` `DAMAGE_CONSTANTS` |
| `combat/skills.js` | `planFor` `onPeriod` `effectiveAtk` `effectiveDr` `rawDamage` `SKILL_KINDS` `DEFAULT_PERIOD` `BUFF_MAX_STACKS` `DMG_FLOOR` `DEF_FACTOR` `WITHER_STEP` `WITHER_CAP` `DR_CAP` |
| `combat/ai.js` | `byCodePoint` `living` `anyAlive` `actionOrder` `pickTarget` `pickBackTarget` `weakestAlly` |
| `combat/index.js` | `simulateBattle` `battleSeed` `MAX_ROUNDS` `MAX_SIDE` `DAMAGE_CONSTANTS` `planFor` `onPeriod` `SKILL_KINDS` `DEFAULT_PERIOD` `BUFF_MAX_STACKS` `actionOrder` `pickTarget` `byCodePoint` |
| `ui/app.js` | `render` `nextGoal` |
| `audio/sfx.js` | `blip` `setMuted` `isMuted` `resumeAudio` |
| `data/buildings.js` | `BUILDINGS` `UNLOCK_LEVEL` `UNLOCK_HQ` `RAFT_RULES` |
| `data/heroes.js` | `HEROES` `RARITY_MULT` `ASSIGN_RULES` `STAR_RULES` |
| `data/stages.js` | `STAGES` `STAGE_RULES` |
| `data/fish.js` | `FISH` `SEAS` `FISHING_RULES` |
| `data/dive.js` | `DIVE_ZONES` `DIVE_RULES` |
| `data/weather.js` | `WEATHERS` `WEATHER_WEIGHTS` `WEATHER_SCHEDULE` |
| `data/resources.js` | `RESOURCE_KEYS` `RESOURCE_META` `emptyResources` |
| `data/orders.js` | `ORDER_POOL` `RESIDENT_POOL` `ORDER_RULES` |
| `data/events.js` | `EVENTS` `EVENT_RULES` |

数据表字段名同样冻结（Round 1 字段集 + 本轮附加字段）：

- `BuildingDef{id,name,w,h,unique?,cost,upgrade,pop?,desc}` + `maxLevel` `upgradeGrowth` `upgradeExtra{fromLevel,add}` `output` `input` `converts[{in,out,perSec,minLevel}]` `adjacency{likes,bonus,desc}` `salvage?` `popPerLevel` `guard`(wall) `guardAdj`(wall) `perks`
- `HeroDef{key,name,rarity,role,lane,base{hp,atk,def,spd},skill{name,star,kind,value},blurb}` + `skill.period` `skill.target` `skill.desc` `growth` `assign{likes,mult}` `recruitCost` `unlockHint`
- `FishDef{id,name,weight,value,window,sea}` + `rarity` `bar` `xp` `firstCatch` `lore`
- `WeatherDef{id,name,salvage,prod,damage,sky}` + `hunger` `thirst` `fishing` `diveO2` `stillBonus` `durationSec` `warnSec` `quip`
- `StageDef{id,name,exp,hourglass,enemies}` + `boss` `intro` `reward` `firstClear` `mechanics`
- `DiveZoneDef{id,name,unlock{dockLevel,stage?},oxygen,o2DrainBase,o2DrainPerDepth,sharks{count,speed},nodeCount,nodes,rareChance,rares,flavor}`
- `SeaDef{id,name,unlock{always?|building,level?|stage?},desc}`
- `ResourceMeta{name,color}` + `tier` `shape` `from` `into`

数值随便调（Fable-3），字段不许动。**引擎读表字段一旦被消费即冻结语义**：`output/input/converts/adjacency/upgradeGrowth/upgradeExtra/maxLevel/durationSec/growth/period/bar/xp/firstCatch/unlock/o2Drain*` 等已全部有消费方，改语义 = 破坏性变更。

## 10. 实现与契约的不一致清单（Round 2 复盘版）

Round 1 的 M1–M16 处置：M1/M2/M3（契约文本缺口）本版收编完毕；M4/M5（reason 码与 can* 配套）、M6（tiles.level 双写，已同步维护，occupant 保留死值）、M7（expandRaft 非法 dir）、M8（defaultState 坏档）、M9（ttl/dt 与拾荒游标）、M10（潜水布局与 finishDive 抛异常）、M11（会话挂 state）、M13（savedAt/离线补算/读档钳域）、M14（localeCompare/门槛/buff/multishot）、M16（钓鱼滑条/移动/旋转/拆除 UI）**已修并按实现写进上文**；M12、M15 部分残留并入下表。

现存不一致（N 编号；修复归属见 ARCHITECTURE §9 / PROGRESS.md）：

- **N1 store.normalize 白名单丢探索附加字段（已知债）**。`normalize` 的 explore 分支只保 `salvage.flotsam`、`fishing.lastCatch`、`dive` 三项——读档会丢 `fishing.codex`（图鉴清零）、`fishing.cast/castTick`（竿丢了倒还合理但与 beginCast 语义矛盾）、`salvage.picked/rarePicked/lastPick`、`diveRecord`（生涯统计清零）。修法：explore 分支逐字段收编 + 钳域，禁止再用整段白名单。
- **N2 战斗 seed 双公式**。`combat.battleSeed`（`cww-battle|seed|stage|attempts`，零消费）与 `ui/screens/campaign.js` 私有 `hashSeed(seed:stage:attempts)`（线上真身）并存；`STAGE_RULES.seedFormula` 文案还停在更早的 `"meta.seed + stage*99"`。R3 必须三处收敛为一个公式（建议以 `combat.battleSeed` 为准，campaign 改调它，seedFormula 文案跟随）。
- **N3 导出已冻结、运行时零接线的三组符号**。① `applyBattleInjuries`：campaign 战后不调用，战败仍零代价；② `tickInjuries` / `syncExploreWeather`：`stepSim` 不调用——海啸对**进行中**的钓鱼/潜水没有强制收杆/上浮（只有新开一竿/新下潜被 `canCast/canDive` 拦截；UI 潜水路径直调 `diveStep` 且不刷新 `o2Mult`）；③ `selectLineup/readyHeroes`：campaign 的 `teamOf` 仍是 `heroes.slice(0,5)`，不排伤员、不保前排、不可取舍。接线时注意：往 `stepSim` 追加步骤属**附加**（放在 tick+1 之前、用独立盐），但会改变挂机日志序列，需同步声明。
- **N4 钓鱼 cast 双轨**。契约字段 `explore.fishing.cast`（`beginCast/hookCast` 读写）与 fish 屏的 `ctx.ui.fish.cast`（`castLine/resolveHook` 直连）并存，线上走后者：刷新丢竿、`syncFishingWeather` 管不到 UI 的竿、`fishingHud.casting` 恒 false。R3 决定 UI 是否迁移到 state 路径；迁移前两条路径都冻结。
- **N5 can* 返回形状两套口径**。world/heroes：`{ ok:false, reason: E_码, message: 中文 }`；explore：`{ ok:false, reason: 中文, code: E_码 }`。两者都已被测试与 UI 消费，**都不许动**。R3 收敛方案（附加式）：explore 结果补 `message` 字段（= 现 reason 文案），文案迁过去后 reason 逐步对齐为码；期间测试铁律不变——world/heroes 断言 `reason`，explore 断言 `code`。
- **N6 core/store.js import world/mods.js**。为了 `defaultState` 落 `world.mods` 快照违反了「core 不 import 领域层」的冻结依赖边（无环：mods→grid→reasons 全是下层）。本版临时豁免并记录于 ARCHITECTURE §1；R3 二选一：正式放宽该边，或把快照盖章挪到 stepSim/调用方、defaultState 不再算 mods（消费方 `exploreMods` 已有缺席回退，可平滑迁移）。
- **N7 离线补算的天气派生流按块重放**。`settleOffline` 分块调 `tickWorld` 时 `meta.tick` 不变，`deriveRng(seed, tick, "weather", roll)` 每块重掷出同一序列（roll 只在单次调用内区分）。观感问题非安全问题（D5 残留）；修法：把块序号掺进 nonce。
- **N8 展示层成长口径漂移**。campaign 的 `hpTable` 写死 `×(1+(star-1)*0.18)` 不读 `HEROES[key].growth`——growth=0.2 的英雄血条分母偏小（被 clamp 掩盖）。同族双份常量（数值一致、口径双写，改数值时必须同步）：`STAR_RULES` vs roster 的 `MAX_STAR/SHARD_PER_STAR`；`lineup.DEFAULT_GROWTH` vs `combat.STAR_GROWTH`；`ui/screens/dive.js` 复写的 `MAX_DEPTH/SURFACE_DEPTH`；`heroes.TICK_SECONDS` vs `engine.QUANTUM`（这对属依赖边约束下的有意双份，其余建议 R3 收敛为读表/读契约常量）。
- **N9 新档 seed 仍写死 20260108**（D9 未落）。目标不变：壳层「启航」时生成随机 seed 注入，领域层只消费；测试仍用固定 seed。
- **N10 coins/diamonds 只进不出**。首钓/订单/关卡多路进账已通，全游戏零消费方。
- **N11 事件与居民增员未上线**。`EVENTS/EVENT_RULES`、`ORDER_POOL.tier3`、`RESIDENT_POOL.recruit`、`wall.guardAdj` 已有表无消费方；`world.event` 恒 null；居民恒 1 人。
- **N12 5v5 取舍 UI 缺位**（M15 残留）。上限与截断已冻结生效（`MAX_SIDE`/`STAGE_RULES.teamCap`），但无阵容选择界面，`selectLineup` 悬空（并入 N3③）。

修复完成一条，就把对应条目从本节删除并在 `docs/ACCEPTANCE.md` 记账。
