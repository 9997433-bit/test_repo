# API 契约（Round 1 冻结稿）

> 维护者：Fable-1。基线 commit `14b21c9`。测试、探针、bench 只依赖本文符号；**§9 清单内的导出禁止改名、禁止改参数顺序**。
> 类型用 TS 记法描述（代码本体仍是 JS）。`int` = 整数，`u32` = 32 位无符号整数，数值区间用 `a..b` 闭区间。
> 标记：**[冻结]** 现状即契约；**[R2]** Round 2 必须落实的目标语义（落实前基线行为见 §10 不一致清单）。

## 1. 总则

1. 变更纪律：冻结符号只能**附加**（新可选参数放末尾且有默认值、返回对象只加新键不删旧键、GameState 只加带默认值的新字段）。破坏性变更必须先改本文并通知全体角色。
2. 领域函数（world/explore/heroes/combat）一律 **state-in / state-out**：不 mutate 入参，返回新对象。
3. 所有数值单位：时间一律**秒**（模拟时间）；`meta.savedAt` 例外（壳层墙钟毫秒）。
4. 静态表（`src/data/**`）字段名冻结、数值可调（Fable-3 所有权）。引擎侧禁止硬编码任何表内数值。

## 2. 失败语义与 reason 码 [冻结语义 / R2 补码]

**失败 = 返回入参 state 的原引用（`===`）**。这是可测试的统一约定：

```js
const next = placeBuilding(s, "hq", 0, 0, 0);
if (next === s) { /* 失败：用 canPlace 等前置检查取原因 */ }
```

每个会失败的动词配一个**纯前置检查**，返回 Result 对象：

```ts
type Result = { ok: true, reason: "", ...extra } | { ok: false, reason: ReasonCode, message?: string }
```

- `reason`：稳定 ASCII 码（下表），测试只断言这个。
- `message`：中文人话（给 UI），允许随文案调整，**测试禁止断言**。
- 基线的 `canPlace` 把中文塞在 `reason` 里（见 §10-M4）；[R2] 迁移为码 + message。

| ReasonCode | 触发 |
| --- | --- |
| `E_UNKNOWN_TYPE` | 建筑/英雄/鱼 id 不在数据表 |
| `E_LOCKED` | `player.level` 未达 `UNLOCK_LEVEL` |
| `E_BOUNDS` | 足迹越出木筏 |
| `E_OCCUPIED` | 目标格被其他建筑占用 |
| `E_UNIQUE` | 唯一建筑（hq）已存在 |
| `E_COST` | 资源不足 |
| `E_NOT_FOUND` | 按 id 找不到建筑/英雄/漂浮物 |
| `E_REQUIRES_BUILDING` | 缺前置建筑（钓鱼椅/潜水坞/广播站） |
| `E_DUPLICATE` | 重复招募同 heroKey |
| `E_MAX_STAR` / `E_MAX_LEVEL` | 已满星（5）/ 满级 |
| `E_INVALID_ARG` | 非法参数（如 expandRaft 的 dir） |

前置检查清单：`canPlace`（已有）；[R2 附加] `canUpgrade(state, id)`、`canExpand(state, dir)`、`canRecruit(state, heroKey)`、`canStarUp(state, heroId)`、`canAssign(state, heroId, buildingId)`。

## 3. GameState 类型 [冻结字段集]

```ts
type ResourceKey = "wood"|"plastic"|"scrap"|"rope"|"stone"|"rawFish"|"fillet"|"meal"
  |"freshWater"|"wheat"|"seed"|"salt"|"blueprint"|"hourglass"|"badge"|"shard";
type Screen = "title"|"raft"|"build"|"fish"|"dive"|"heroes"|"campaign";
type WeatherId = "clear"|"haze"|"rain"|"storm"|"tsunami";
type Dir = "left"|"right"|"up"|"down";

interface GameState {
  meta: {
    title: string; version: string;
    seed: u32;            // 全局命运种子，开局后不变
    tick: int;            // 模拟量子计数（0.1s/量子），唯一模拟时间轴
    speed: 1|2|4;
    started: boolean;     // 读档水合时强制 false
    screen: Screen;       // 基线就有，此前契约漏写
    savedAt?: number;     // [R2] 墙钟毫秒，仅存档壳层写入，离线补算用
  };
  player: {
    name: string;
    hunger: number; thirst: number; hp: number;   // 0..100（hp 下限钳 1，无硬死亡）
    coins: int; diamonds: int;                    // 基线无进出账（§10-M13）
    exp: int; level: int;                         // 升级阈值 level*80
  };
  resources: Record<ResourceKey, number>;         // 允许小数（产出连续累积）；支付校验 >= 整数消耗
  raft: {
    width: int; height: int;                      // 初始 6×5
    tiles: (null | TileRef)[][];                  // [height][width]，行优先
  };
  buildings: Building[];
  residents: Resident[];
  heroes: HeroInstance[];
  world: {
    timeOfDay: number;    // 0..1，一天 240s
    weather: WeatherId;
    event: null | string; // 预留（海盗/鲨鱼事件），基线恒 null
    seaSeed: u32;         // 海面渲染专用，不参与规则
    weatherTimer: number; // 秒；此前契约漏写
  };
  explore: {
    salvage: { flotsam: Flotsam[] };
    fishing: { lastCatch: null | { miss: boolean, name: string } };
    dive: null | DiveSession;   // [R2] 潜水会话必须挂这里（基线漏挂在 UI 模块变量，§10-M11）
  };
  campaign: {
    stage: int;           // 下一个待打关（1 起）
    bestStage: int;
    idleSince: number;    // 秒；离线/挂机累计
    attempts?: int;       // [R2] 当前关重试计数，作战斗 seed 盐
  };
  settings: { muted: boolean; reduceMotion: boolean };
  log: string[];          // 最新在前，硬上限 24 条；此前契约漏写
}

interface TileRef { buildingId: string; level: int; rot: 0|90; occupant: null }
// 注意：tiles 内 level 是 buildings[].level 的镜像（改哪个都必须双写同步）；occupant 是死字段（§10-M6）。

interface Building {
  id: string;             // `${type}-${序}-${tick}`，全局唯一，禁止解析其结构
  type: keyof typeof BUILDINGS;
  x: int; y: int;         // 足迹左上角
  level: int;             // 1 起
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
  injuredUntil: number;   // 模拟秒；0=健康。基线未消费（§10-M12）
}
```

## 4. core/store.js

```ts
createStore(seed?: DeepPartial<GameState>): Store   // [冻结]
defaultState(seed?: DeepPartial<GameState>): GameState
Store.get(): GameState
Store.patch(partial: Partial<GameState>): GameState // 顶层浅合并！嵌套字段调用方自己展开
Store.replace(next: GameState): GameState           // 整体换引用；领域动词的结果用这个回写
Store.subscribe(fn: (s: GameState) => void): () => void
saveState(state: GameState): void                   // localStorage["cww.save.v1"]，try/catch 吞配额错
loadState(): GameState | null                       // [R2] 需加 schema/版本校验
```

- `patch` 与 `replace` 每次调用同步通知全部订阅者，无去重、无批处理 [冻结]。
- `defaultState` 的 seed 合并是顶层浅合并 + meta 单独深一层；**传嵌套片段（如缺 tiles 的 raft）是调用方违规**（基线会坏档，§10-M8）。
- 存档键 `cww.save.v1` [冻结]；schema 破坏性变更时升键名 `cww.save.v2` 并写迁移。

## 5. core/engine.js 与 core/rng.js

```ts
boot(root: HTMLElement, store: Store): void         // [冻结] DOM 壳：rAF 循环 + 每 4s 自动存档
stepSim(state: GameState): GameState                // [R2 附加] 纯量子：tickWorld(s,0.1) + 派生rng刷漂浮物 + tick+1
mulberry32(seed: u32): () => number                 // [冻结] 返回 [0,1) 流
hashSeed(str: string): u32                          // [冻结] FNV-1a
pickWeighted<T>(rng, pairs: [T, number][]): T       // [冻结] 权重和>0；空数组是调用方违规
```

确定性铁律（领域层全体适用）[冻结]：

1. 随机只来自显式 `rng` 参数，或从 `(meta.seed, meta.tick, 域盐)` 现场派生的 `mulberry32`。
2. 禁止 `Math.random / Date.now / performance.now / localeCompare / Intl / crypto`。
3. 字符串比较用码点（`a < b ? -1 : a > b ? 1 : 0`）；`Array.prototype.sort` 可用（ES2019 起稳定）但比较器必须全序且确定。
4. rng 的**消费次数与顺序**是契约的一部分：在同一派生流上增删 rng 调用 = 破坏性变更。

## 6. world

```ts
canPlace(state, type: string, x: int, y: int, rot?: 0|90, ignoreId?: string | null)
  : { ok: true, reason: "", cells: [int, int][] }   // cells = 足迹格 [x,y]，placeBuilding 复用，冻结
  | { ok: false, reason: string }                   // [R2] reason 迁移为码，另加 message

placeBuilding(state, type, x, y, rot?: 0|90): GameState
  // 检查顺序 [冻结]：表存在 → UNLOCK_LEVEL → canPlace → 资源支付。任一失败返回原引用。
  // 成功：扣资源、追加 Building、occupy 足迹、写 log。

moveBuilding(state, id, x, y, rot): GameState       // 失败（id 不存在 / 新位不合法）返回原引用
upgradeBuilding(state, id): GameState               // 扣 def.upgrade，level+1，exp +12+4*旧level
                                                    // [R2] 补最高级上限与 E_MAX_LEVEL
expandRaft(state, dir: Dir): GameState
  // 花费 { wood: 10+width+height, plastic: 4 }；left/up 会整体平移全部建筑坐标 +1
  // [R2] 非法 dir 返回原引用（基线当 "up" 处理，§10-M7）

tickWorld(state, dt: number): GameState
  // 纯推进 dt 秒：昼夜、天气重掷（派生 rng）、玩家/居民饥渴、建筑产出（受天气 prod/salvage、
  // 委任英雄 1+star*0.12 加成）、风暴伤害（围栏每座 -12% 减伤，地板 15%）、升级结算、idleSince。
  // 不增 meta.tick（stepSim/engine 负责）。禁止在此写 explore。

// world/grid.js（world 内部 + 测试可用）
footprint(type, x, y, rot): [int, int][]
occupy(tiles, cells, buildingId, level, rot): tiles'    // 出新数组
clearOccupy(tiles, buildingId): tiles'

// world/canvas.js（DOM 白名单）
paintSea(canvas, state, tMs): void
canvasToCell(canvas, state, clientX, clientY): { x: int, y: int }  // 可越界，调用方过 canPlace
```

## 7. explore

```ts
interface Flotsam {
  id: string;             // `f-${tick}-${n}`，禁止解析
  res: ResourceKey; n: int;      // 入袋数量 ≥1
  rare: boolean;
  x: number;              // -1..1 海面归一化横坐标
  y: number; vx: number;  // 渲染漂移
  ttl: number;            // 秒，≤0 由 spawnFlotsam 清除
}

spawnFlotsam(state, rng: () => number): Flotsam[]
  // 纯（给定 rng 流位置）：衰减 ttl、漂移 x、按容量 cap = 10 + 2*拾荒船数 概率补货；
  // storm/tsunami 生成率 ×0.35。返回新数组，不写 state。
  // 已知硬伤：ttl 每次调用固定 -0.1（隐含量子 0.1s，§10-M9）。[R2] 由 stepSim 用派生流调用。

collectFlotsam(state, id): GameState                // id 不存在返回原引用；稀有 +8 exp，普通 +2

type FishingCast =
  | { ok: false, reason: string }                                  // 缺钓鱼椅
  | { ok: true, id: string, fish: FishDef, window: [number, number], seed: int };
castLine(state): FishingCast
  // 确定性：rng = mulberry32(seed + tick*17)。鱼池：near 常驻；有 dive_dock 时并入 deep+far。
resolveHook(state, cast, timing01: number): GameState
  // cast.ok=false → 原引用。timing01 ∈ window → 鱼入袋 +6 exp；否则记 miss（miss 不是失败，返回新 state）。

interface DiveNode { id: string; x: number; y: number; res: ResourceKey; n: int }
type DiveSession =
  | { ok: false, reason: string }
  | { ok: true, zone: string, oxygen: number /*0..100*/, x: number /*0..100*/,
      depth: number /*0..90*/, loot: DiveNode[], alive: boolean, done: boolean,
      sharks: { x, y, vx }[], nodes: DiveNode[] };

startDive(state, zone?: string): DiveSession        // 缺 dive_dock → {ok:false}
  // [R2] 布局必须从 (seed, tick, zone) 派生（基线写死同一布局，§10-M10）
diveStep(session, input: { x?: -1..1, y?: -1..1, surface?: boolean }, dt: number): DiveSession
  // 纯；氧耗 6 + depth*0.04 每秒；鲨距 <6 判死；depth<8 时 surface 或氧尽可活着结束。
finishDive(state, session): GameState
  // 前置条件 [冻结]：session 必须是 ok 会话（传 {ok:false} 是调用方违规——基线会抛异常，§10-M10）。
  // alive → loot 入袋 + 每件 10 exp；死亡 → hp -18（下限 8）。总是清 explore.dive = null。
```

## 8. heroes / combat

```ts
recruit(state, heroKey): GameState
  // 失败（未知 key / 已有同 key / 无广播站且已有英雄）→ 原引用。首个英雄免广播站 [冻结]。
assignHero(state, heroId, buildingId: string | null): GameState
  // null = 卸任。[R2] 必须：校验两 id 存在；被顶替英雄的 assignedBuildingId 同步清空（基线悬挂，§10-M12）。
starUp(state, heroId): GameState                    // 消耗 shard = star*10；star≥5 或不足 → 原引用
```

### simulateBattle —— 确定性是硬约束

```ts
type BattleUnit =                                    // 联盟侧
  { id: string, heroKey: string, star: 1..5 }
  |                                                  // 敌方侧（来自 STAGES 或测试内联）
  { key: string, name: string, hp: number, atk: number, def: number,
    spd: number, lane: "front"|"back", skill?: SkillDef };

simulateBattle(seed: u32, allies: BattleUnit[], enemies: BattleUnit[]): BattleResult

interface BattleResult {                             // 键集与键序 [冻结]（JSON 快照按此序列化）
  seed: u32;
  winner: "ally" | "enemy" | "draw";                 // 24 回合双方存活 = draw
  log: string[];                                     // 人读战报；快照包含它，改文案=改快照
  duration: int;                                     // 回合数 ≤24
  leftover: { id: string, name: string, side: "ally"|"enemy", hp: number /*≥0*/ }[];
}
```

确定性要求（全部 [冻结]，违反=红线）：

1. `JSON.stringify(simulateBattle(seed, A, E))` 对相同 `(seed, A, E)` **字节级相等**，跨 Node / 浏览器 / 平台。
2. 唯一随机源是 `mulberry32(seed)`；rng 消费顺序：先按 enemies 数组序为每个敌人掷 id 后缀，再进回合循环按行动序掷目标选择。增删任何 rng 调用 = 破坏快照的契约变更，需重新落盘快照并在 PR 里声明。
3. 行动序：存活单位按 `spd` 降序，平速按名字**码点**升序（基线用 `localeCompare`，是必修项 §10-M14）。
4. 禁止读墙钟/环境；数字格式化只允许 `toFixed`（规范定义、跨引擎一致）。
5. 规模：双方 1..5 个单位；[R2] 超过 5 个取前 5（确定性截断）。基线不设限（§10-M15）。
6. 伤害公式 `max(4, atk - def*0.45)`；技能 kind ∈ `taunt|multishot|heal|aoe|burst|buff|hook`。[R2] 所有 kind 尊重 `skill.star` 解锁门槛并实现 `buff`（基线只有 taunt 检查门槛、buff 未实现，§10-M14）。
7. 战斗 seed 归调用方：推荐 `hash(meta.seed, stage, campaign.attempts)`，保证重试可变、回放可复现。

## 9. 禁止改名的导出清单 [冻结]

| 文件 | 导出 |
| --- | --- |
| `core/store.js` | `createStore` `defaultState` `saveState` `loadState` |
| `core/rng.js` | `mulberry32` `hashSeed` `pickWeighted` |
| `core/engine.js` | `boot`（[R2 附加] `stepSim`） |
| `core/events.js` | `createBus` |
| `world/build.js` | `placeBuilding` `moveBuilding` `upgradeBuilding` `expandRaft` `canPlace`(转发) |
| `world/grid.js` | `canPlace` `occupy` `clearOccupy` `footprint` |
| `world/sim.js` | `tickWorld` |
| `world/canvas.js` | `paintSea` `canvasToCell` |
| `world/index.js` | 上述 world 门面转发 |
| `explore/salvage.js` | `spawnFlotsam` `collectFlotsam` |
| `explore/fishing.js` | `castLine` `resolveHook` |
| `explore/dive.js` | `startDive` `diveStep` `finishDive` |
| `explore/index.js` | 上述 explore 门面转发 |
| `heroes/roster.js` / `heroes/index.js` | `recruit` `assignHero` `starUp` |
| `combat/battle.js` / `combat/index.js` | `simulateBattle` |
| `ui/app.js` | `render` |
| `audio/sfx.js` | `blip` `setMuted` |
| `data/buildings.js` | `BUILDINGS` `UNLOCK_LEVEL` |
| `data/heroes.js` | `HEROES` `RARITY_MULT` |
| `data/stages.js` | `STAGES` |
| `data/fish.js` | `FISH` |
| `data/weather.js` | `WEATHERS` `WEATHER_WEIGHTS` |
| `data/resources.js` | `RESOURCE_KEYS` `RESOURCE_META` `emptyResources` |

数据表字段名同样冻结：`BuildingDef{id,name,w,h,unique?,cost,upgrade,pop?,desc}`、`HeroDef{key,name,rarity,role,lane,base{hp,atk,def,spd},skill{name,star,kind,value},blurb}`、`FishDef{id,name,weight,value,window,sea}`、`WeatherDef{id,name,salvage,prod,damage,sky}`、`StageDef{id,name,exp,hourglass,enemies}`。数值随便调（Fable-3），字段不许动。

## 10. 基线实现与契约的不一致清单（只记录，修复归 Round 2 对应所有权角色）

架构级缺陷编号（D1–D18）见 `ARCHITECTURE.md` §9；此处是**契约文本 vs 基线代码**的逐条出入：

- M1 旧契约写 `engine.tick(dt, store)`——该导出从未存在，实际是 `boot(root, store)`。本版已改为以 `boot` 为冻结项、`stepSim` 为 R2 附加项。
- M2 旧契约漏了实际被 main/ui/engine 依赖的 `store.replace`、`defaultState`、`saveState`、`loadState`。本版已收编。
- M3 旧契约的 GameState 漏字段：`meta.screen`、`world.weatherTimer`、`log`、`residents[].order` 结构、`explore.*` 具体形状。本版已补全。
- M4 `canPlace` 失败时 `reason` 为中文人话（"超出木筏"等），非稳定码；成功时携带未声明的 `cells`。目标语义见 §2/§6。
- M5 所有动词静默失败且无 `can*` 前置检查配套（仅 canPlace 存在）→ §2。
- M6 `TileRef.occupant` 恒为 null 的死字段；`TileRef.level` 与 `Building.level` 双写。
- M7 `expandRaft` 非法 dir 落入 "up" 分支而非返回原引用。
- M8 `defaultState` 顶层浅合并允许被嵌套片段坏档（契约现规定为调用方违规，但实现仍应加防）。
- M9 `spawnFlotsam` ttl 衰减硬编码 0.1，未用 dt；engine 的长命 rng 流游标不落盘，读档后拾荒序列不可复现。
- M10 `startDive` 无随机（布局写死、zone 无差异）；`finishDive({ok:false})` 抛 TypeError 而非按前置条件拒绝。
- M11 潜水会话/钓鱼 cast 存在 `ui/app.js` 模块级变量而非 `state.explore.dive/fishing`，与 §3 类型定义矛盾，刷新即丢。
- M12 `assignHero` 不校验 id、顶替产生悬挂 `assignedBuildingId`；`injuredUntil`、`player.coins/diamonds`、`house.pop` 均为无消费者死字段。
- M13 存档无 `meta.savedAt`、无离线补算、`loadState` 无版本/schema 校验。
- M14 `simulateBattle` 用 `localeCompare` 排平速单位（跨环境字节稳定性风险）；`skill.star` 门槛仅 taunt 生效；`buff` kind 未实现；multishot 为恒定 ×1.15。
- M15 5v5 未成立：`STAGES` 每关仅 4 敌、我方无 5 人上限与选阵；UI 战斗 seed（`meta.seed + stage*99`）缺重试盐。
- M16 UI 每帧重写面板 innerHTML 导致 `#timing` 滑条重置——钓鱼判定逻辑正确但 UI 不可玩；`moveBuilding`/rot 90/拆除均无 UI 入口。

修复完成一条，就把对应条目从本节删除并在 `docs/ACCEPTANCE.md` 记账。
