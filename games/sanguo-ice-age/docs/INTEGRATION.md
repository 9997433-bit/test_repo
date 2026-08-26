# INTEGRATION.md — Round 2 整合合同（权威）

> 作者：fable-integration（Round 2）。本文依据《Round 1 结论简报》做出**最终裁决**，
> 精度到可直接编码。与 `ARCHITECTURE.md` §3/§4/§16 的早期蓝图冲突时，**以本文为准**
> （ARCHITECTURE.md 末尾「整合」章节已声明此让位关系）。
>
> 读者：实现 `js/bridge/*` 与改造 `js/main.js` 的代理、测试代理。
> 本文撰写时的测试基线：`tests/runner.mjs` 21 绿、`tests/probes.mjs` 9 pass / 1 skip
> （skip 项 `bridge-project-view` 即等待本文 §3 的 `projectView` 落地）。

---

## 0. 裁决总览（对应 Round 1 简报问题清单）

| # | 问题 | 裁决 | 落点 |
|---|---|---|---|
| P0 | 双核分裂：main.js 内置扁平内核 + probeBridge 永不激活 | **内置内核整体退役**。main.js 只持有 state.js 权威树；视图经 `js/bridge/view.js` 的 `projectView(state)`，动作经 `js/bridge/actions.js` | §1.4 / §3 / §5 |
| P0 | 建筑 id 三套 | **以 `data/buildings.js` 的 17 个 id 为权威**（config.BUILDING_IDS 已同步）。别名表只用于读档迁移与 `defOf` 兜底；渲染键单独成表换算 | §1.2 / §7 |
| P0 | 无失败 UI | `flags.gameOver` 真值 → main.js 弹结算遮罩 + 停时 + 「重新开始」 | §3.4 / §5 restart |
| P1 | 任务未接 | boot 时 `initQuests(state, QUESTS)`；tick 尾部 `tickQuests`；领奖走 `claimQuest`（必须传 `heroCatalog: HEROES`） | §4 / §5 |
| P1 | 三兵种未接 | 权威树 `army` 升级为嵌套 `troops/wounded`（见 §1.3），出征/训练按兵种结算 | §1.3 / §5 raid、trainTroops |
| P1 | 双存档 | **只走 `config.SAVE_KEY`**，`${SAVE_KEY}-ui` 只删不写、不迁移 | §6 |
| P1 | canUpgrade 单测 | 已转绿（`city.canUpgrade` 导出被 runner/probes 识别）。红线：三套测试保持全绿，禁止改测试适配实现 | §8 |

---

## 1. 权威状态树（唯一事实源 = `js/state.js`）

### 1.1 树结构与写权属

`createInitialState(seed)` 产出的嵌套树是**全项目唯一模拟状态**。标 `(+)` 的字段为
Round 2 增补（见 §1.3），其余为现状。

```js
state = {
  meta: { version, seed, tick, day, playTimeSec, lord: { name, title } },
  resources: { food, wood, coal, iron },                  // 均 ≥ 0
  climate: { temp, blizzardDaysLeft, nextBlizzardIn, furnaceLit,
             // tickClimate 运行后追加：targetTemp, outputFactor, label,
             // severity, fuelEfficiency, fuelBurn:{coal,wood},
             // blizzardCount, blizzardSeverity, _dayMark },
  city: { furnaceLevel, warmthBuildings,
          buildings: { [id]: { level, workers, constructing, progress,
                               // 施工期追加：progressTicks, buildTicks, targetLevel
                             } } },
  people: { pop, popCap, morale, sick, hungry,
            // tickPopulation 运行后追加：moraleTarget, available, _acc },
  army: { troops: { infantry, cavalry, archer },          // (+) 嵌套化，见 §1.3
          wounded: { infantry, cavalry, archer } },       // (+)
  heroes: { roster: [{ id, level, stars, xp, garrisonBuildingId }],
            deployed: [heroId], tickets, recruitCount, shards: {},
            pendingHeroGrants?: [] },
  quests: { entries: { [id]: { id, status, progress, target, claimedAt } },
            order: [], claimed: [], readyCount },         // (+) 形状统一，见 §1.3
  stats: { battles, battleWins, battleLosses,
           troopsLost, troopsWounded, troopsTrained },    // (+)
  war: { log: [{ win, rounds, reason, lost, wounded, day }] }, // (+)
  research: { done: [] },                                 // (+)
  flags: { tutorialStep, gameOver /* false | "morale" | "extinct" */,
           gameOverReason?, victory },
  log: [{ tick, day, text, level }],                      // level ∈ LOG_LEVELS
}
```

写权属（唯一允许写该子树的模块；UI/render 一律只读）：

| 子树 | 写者 |
|---|---|
| `meta.tick` / `meta.playTimeSec` | 仅 main.js 的 `runTick`（§4） |
| `meta.day` | `systems/climate.tickClimate`（由 tick 推导，已实现） |
| `resources` | economy（产出）、climate（燃料）、population（口粮）、actions（造价/奖励/战利品） |
| `climate.*` | 仅 climate 系统 |
| `city.*` | city 系统 + actions 的 `startUpgrade` / `assignWorkers` |
| `people.*` | population 系统（`popCap` 由 city 每 tick 同步，属既有行为） |
| `army.*` | `combat.applyBattleResult` + actions 的 `trainTroops` |
| `heroes.*` | heroes 系统 + quests 发奖（tickets / xp / grantHero） |
| `quests.*` | 仅 quests 系统 |
| `stats` / `war` | combat / heroes / actions 累计 |
| `research.done` | 仅 actions 的 `research` |
| `flags.gameOver*` | 仅 population 系统；`flags.tutorialStep` 仅 tutorial |
| `log` | 各系统经 `pushLog` |

### 1.2 建筑 id 权威集合（17 个，来自 `data/buildings.js`）

```
furnace, lumber, hunter, coal_mine, iron_mine, house, warehouse, kitchen,
barracks_inf, barracks_arch, barracks_cav, hospital, academy, tavern,
wall, embassy, clinic
```

- `config.BUILDING_IDS` = 上述 16 个槽位（不含 furnace；furnace 槽位由
  `ensureState` 自动补且与 `city.furnaceLevel` 双向对齐，属既有行为）。
- 任何新代码（systems / data / bridge / UI）书写建筑 id 字面量时**只允许**用以上 17 个。

### 1.3 Round 2 一次性 schema 增补（`SAVE_VERSION` 1 → 2）

以下改动集中一次落地，全部迁移逻辑写进 `state.normalizeState`，与已有的
`migrateBuildingIds` 同处：

1. **army 嵌套化**（裁决依据：`combat.applyBattleResult` 与 `quests.readTroopsTrained`
   均按 `army.troops.{infantry,cavalry,archer}` 读写；维持扁平会让战后兵力归零）。
   - `createInitialState`：`army = { troops: { ...START.army 去掉 wounded }, wounded: { infantry:0, cavalry:0, archer:0 } }`。`config.START.army` 保持扁平不动，仅作初值来源。
   - 迁移：旧档 `army.infantry` 等数字字段搬进 `army.troops`；旧 `army.wounded`（数字）计入 `wounded.infantry`。
   - `assertState`：改校验 `army.troops.*` 与 `army.wounded.*` 为非负数字。
2. **quests 形状统一**为 `systems/quests.js` 的 `{ entries, order, claimed, readyCount }`；
   `createInitialState` 直接产出空形状（`initQuests` 幂等，boot 再调一次无害）。
   `assertState` 中对 `quests.active/completed` 的校验删除，改校验 `entries` 为对象、
   `order/claimed` 为数组。旧档的 `active/completed` 丢弃（其内容从未被系统写入过）。
3. **新增顶层子树** `stats`（六个计数器初值 0）、`war`（`{ log: [] }`）、
   `research`（`{ done: [] }`）。`assertState` 只需校验类型存在，缺失时 `normalizeState`
   经 `mergeDefaults` 自动补齐（现有机制，无需新代码）。
4. **武将 id 统一为 `data/heroes.js` 的 snake_case**：
   - `config.START_HERO_IDS` 改为 `["liu_bei", "zhang_fei", "hua_tuo"]`。
   - config 新增 `HERO_ID_ALIASES`：`{ liubei:"liu_bei", zhangfei:"zhang_fei",
     huatuo:"hua_tuo", caocao:"cao_cao", xuchu:"xu_chu", guanyu:"guan_yu",
     sunquan:"sun_quan", zhouyu:"zhou_yu", lvbu:"lv_bu" }`（覆盖
     `systems/heroes.js` FALLBACK_HEROES 的全部旧 id）。
   - `normalizeState` 对 `heroes.roster[].id`、`heroes.deployed[]`、
     `heroes.shards` 键做同表替换。

### 1.4 main.js FALLBACK CORE 退役清单

以下代码从 `js/main.js` **删除**，禁止保留为死代码或第二内核：
`newState` / `createCore` / 内置 `BUILDINGS`、`BUILD_ORDER`、`BUILTIN_HERO_POOL`、
`QUALITY_POWER`、`QUALITY_COEF`、`loadHeroPool`、`DATA_BUILDING_ALIAS`、
`adoptBuildingText`、`DRAW_RATES`、`TARGETS`、`TECHS`、`probeBridge`、`bridge` 对象、
`UI_SAVE_KEY` 的读写。防御性动态 import（`tryImport`）随之删除：Round 2 起
systems/engine/data 全部**静态 import**，模块缺失即启动错误（快速失败优于静默降级）。
`TARGETS`（讨伐目标）由 `combat.makeRaidEncounter` 取代；`TECHS` 见 §5「research」。

---

## 2. UI 视图模型（视图契约）

消费方与其读取的字段（现状核对自 `ui/hud.js`、`ui/panels.js`、`render/canvas.js`、
`render/villagers.js`）。`projectView(state)` 必须**逐一**产出下列字段：

| 字段 | 类型 | 主要消费方 |
|---|---|---|
| `resources` | `{food,wood,coal,iron}` | hud 资源条、panels 造价染色 |
| `capacity` | `{food,wood,coal,iron}` | hud 资源条容量/满仓高亮 |
| `rates` | `{food,wood,coal,iron}`（每日净增） | hud `+x/日` |
| `temp` / `outsideTemp` | number | hud 温度计、panels 火炉页 |
| `day` / `dayProgress` / `tickInDay` | number | hud 日期与时段 |
| `morale` | number 0..100 | hud 民心条 |
| `population` | `{total,idle,assigned,housing}` | hud 人口、panels 派工 |
| `blizzard` | number 0..1（烈度，0=无寒潮） | hud 天气条、canvas 风雪 |
| `blizzardDaysLeft` / `blizzardIn` | number / number\|null | hud 天气文案 |
| `buildings` | 数组，见 §3.2 | hud 底栏、canvas 全部绘制、panels 总览 |
| `heroes` | 数组，见 §3.3 | hud 武将条、panels 点将 |
| `troops` / `army` / `troopCap` | number / 嵌套 / number | hud 底栏、panels 军务 |
| `recruitTickets` | number | hud 徽标、panels 招贤 |
| `log` | `[{id,day,text,kind}]` | hud 邸报 |
| `tech` | `{ [techId]: true }` | hud 底栏「已研 N 项」、panels 太学 |
| `lord` / `cityName` | `{name,title}` / string | hud 顶栏 |
| `furnaceLit` / `furnaceHeat` / `furnaceHeatNext` / `fuelDays` | boolean / number×3 | panels 火炉页、hud 底栏 |
| `gameOver` / `victory` | `false\|string` / boolean | main.js 结算遮罩 |
| `villagerCount` | number | render/villagers |
| `speed` / `paused` / `blizzardBanner` / `blizzardBannerSub` | UI 局部态 | hud（由 main.js 合并，见 §3.4） |

---

## 3. `projectView(state)` 字段对照表

### 3.1 文件与函数合同

- 落点：**`js/bridge/view.js`**，具名导出 `projectView(state)`。
  `tests/probes.mjs` 的 `bridge-project-view` 探针按此路径与导出名探测，落地后
  该探针必须从 skip 变 pass。
- **纯函数**：单参可调、不改 `state`、不读 DOM / `performance` / `Math.random`。
  允许 import：`config.js`、`data/*`、`systems/*` 的纯查询函数
  （`warehouseCap` / `workerSlots` / `defOf` / `climateConfig` / `blizzardSeverity` /
  `availableWorkers` / `assignedWorkers` / `foodDemand` / `heroPower` / `heroStats` 等）。

逐字段公式（`c = climateConfig()`，`cat = catalogOf(state.city.catalog)`，
`L(id) = state.city.buildings[id]?.level ?? 0`）：

| 视图字段 | 公式 / 来源 |
|---|---|
| `resources` | `{ ...state.resources }` |
| `capacity` | `warehouseCap(state, cat)` |
| `rates.food` | `(state.economy?.perDay?.food ?? 0) − foodDemand(state) × TICKS_PER_DAY` |
| `rates.wood` | `(state.economy?.perDay?.wood ?? 0) − (state.climate.fuelBurn?.wood ?? 0) × TICKS_PER_DAY` |
| `rates.coal` | `(state.economy?.perDay?.coal ?? 0) − (state.climate.fuelBurn?.coal ?? 0) × TICKS_PER_DAY` |
| `rates.iron` | `state.economy?.perDay?.iron ?? 0` |
| `temp` | `state.climate.temp` |
| `outsideTemp` | `c.baseTemp − min(c.seasonalDropCap, state.meta.day × c.seasonalDropPerDay) + (state.climate.blizzardDaysLeft > 0 ? c.blizzardTempDelta × blizzardSeverity(state) : 0)` |
| `day` | `state.meta.day` |
| `tickInDay` | `state.meta.tick % TICKS_PER_DAY` |
| `dayProgress` | `tickInDay / TICKS_PER_DAY` |
| `morale` | `state.people.morale` |
| `population` | `{ total: state.people.pop, idle: availableWorkers(state), assigned: assignedWorkers(state), housing: state.people.popCap }` |
| `blizzard` | `state.climate.blizzardDaysLeft > 0 ? clamp(0.3 + 0.7 × (blizzardSeverity(state) − 1) / (c.blizzardSeverityMax − 1), 0.3, 1) : 0` |
| `blizzardDaysLeft` | `state.climate.blizzardDaysLeft` |
| `blizzardIn` | `blizzardDaysLeft > 0 ? null : state.climate.nextBlizzardIn` |
| `buildings` | 见 §3.2 |
| `heroes` | 见 §3.3 |
| `army` | `{ troops: {...state.army.troops}, wounded: {...state.army.wounded} }` |
| `troops` | `army.troops.infantry + cavalry + archer` |
| `troopCap` | `TROOP_CAP_BASE + TROOP_CAP_PER_LEVEL × (L("barracks_inf") + L("barracks_arch") + L("barracks_cav"))`；两常量追加进 `config.js`（建议 20 / 30） |
| `recruitTickets` | `state.heroes.tickets` |
| `log` | `state.log.map((e, i) => ({ id: e.tick + "#" + i, day: e.day ?? dayOfTick(e.tick), text: e.text, kind: e.level }))` |
| `tech` | `Object.fromEntries((state.research?.done ?? []).map((id) => [id, true]))` |
| `lord` | `{ ...state.meta.lord }` |
| `cityName` | `config.CITY_NAME`（config 追加常量 `"拾薪城"`） |
| `furnaceLit` | `state.climate.furnaceLit` |
| `furnaceHeat` | `city.furnaceLevel × c.furnaceHeatPerLevel × (state.climate.fuelEfficiency ?? 1)` |
| `furnaceHeatNext` | 同上，等级 +1 |
| `fuelDays` | `mult = blizzardDaysLeft > 0 ? c.blizzardFuelMult : 1`；`coalDays = resources.coal / (c.fuelCoalPerTick × furnaceLevel × mult × TICKS_PER_DAY)`；`woodDays` 同理；`fuelDays = min(99, coalDays + woodDays)`（煤优先烧完再烧柴，与 `burnFuel` 一致）；`furnaceLevel ≤ 0` 或未点火 → `0` |
| `fuelMode` | 恒 `"auto"`（权威气候系统只有煤优先自动 + 点火/封火两态；面板燃料三态按钮改为两态开关，见 §5 `setFurnaceLit`） |
| `gameOver` / `victory` | `state.flags.gameOver` / `state.flags.victory` |
| `villagerCount` | `clamp(round(6 + state.people.pop × 0.55), 8, 16)` |
| `stats` | `{ ...state.stats }`（panels 战绩展示） |

### 3.2 `buildings[]` 条目（canvas / hud / panels 共用）

对 `["furnace", ...BUILDING_IDS]` 逐个投影：

```js
{ id,                        // 权威 id
  key,                       // 渲染键（§7 对照表；无渲染槽位 → null）
  level, workers, constructing, progress,   // 直接取槽位
  maxWorkers: workerSlots(defOf(cat, id), level),
  name, icon }               // 取自 defOf(cat, id)
```

- `render/canvas.js` 以 `CITY_LAYOUT[b.key]` 过滤，`key === null` 的条目自然不绘制，
  **canvas 不改**。
- hud 底栏 `buildings.find(b => b.key === "furnace")` 依赖 `key` 字段，保留。

### 3.3 `heroes[]` 条目（hud 武将条 / panels 点将）

`state.heroes.roster` 与 `data/heroes.js` 的 `HEROES` 按 id join：

```js
{ id, name, faction, quality, troop, title,
  level: entry.level, stars: entry.stars, xp: entry.xp,
  power: heroPower(def, { level, stars }),
  skill: def.skill?.name ?? "", skillDesc: def.skill?.desc ?? "",
  deployed: state.heroes.deployed.includes(id),
  garrisonBuildingId: entry.garrisonBuildingId }
```

def 缺失（roster 里有名册外 id）时跳过该条目并 `console.warn` 一次。

### 3.4 UI 局部态的合并（projectView 之外）

`speed`、`paused`、`blizzardBanner`、`blizzardBannerSub` 不属于模拟状态：

- main.js 维护 `ui = { speed: 1, paused: false, bannerUntil: 0 }`；
  每帧 `view = { ...projectView(state), speed, paused, blizzardBanner, blizzardBannerSub }`。
- 寒潮沿检测：main.js 记 `lastBlizzardActive`，`false→true` 时
  `bannerUntil = now + 4200ms`；`blizzardBanner = now < bannerUntil`。
- **失败遮罩（P0）**：`view.gameOver` 为真值且遮罩未显示时——`applySpeed(0)`、
  显示全屏遮罩（标题按 `"morale"→「民心尽失」`、`"extinct"→「全城覆没」`，
  正文含 `day` 与 `stats` 摘要）、唯一按钮「重新开始」→ `actions.restart()`。

### 3.5 `buildingInfo(key)`（panels 面板视图，实现在 actions 层）

panels.js 依赖此形状（现状），由 `js/bridge/actions.js` 导出，字段对照：

| 字段 | 来源 |
|---|---|
| `key` / `name` / `icon` / `desc` | 入参渲染键原样返回；其余取 `defOf(cat, id)` |
| `tag` | `def.category` 中文映射：core→全城热源、resource→产出 + 资源名、civil→民生、military→军事 |
| `level` | 槽位 level |
| `maxLevel` | `id === "furnace" ? maxLevelOf(def) : min(maxLevelOf(def), furnaceLevelCap(state))` |
| `workers` / `maxWorkers` | 槽位 workers / `workerSlots(def, level)` |
| `cost` | `buildingCost(def, level + 1)` |
| `production` / `nextProduction` | `buildingOutput(state, id, cat)` × `TICKS_PER_DAY`；next 用「level+1 的克隆槽位」重算 |
| `extraGains` | 由 `def.population` / `def.storage` / `def.warmth` / `def.defensePerLevel` 逐项生成 `{label, now, next}` |
| `canUpgrade` / `blockedReason` | `const r = canUpgrade(state, id, cat)`；`r.ok` / `r.text ?? ""` |
| `constructing` / `progress` | 槽位原值（panels 需新增施工进度条，替代旧「即时升级」表现） |

---

## 4. tick 顺序（固定合同）

```js
// main.js —— 唯一推进入口，由 engine/loop.createLoop({ onTick: runTick }) 驱动
function runTick() {
  if (state.flags.gameOver) return;            // 停摆；渲染与遮罩继续
  state.meta.tick += 1;
  state.meta.playTimeSec += TICK_SEC;
  tickClimate(state);                          // 1 燃料→寒潮跨天→温度（内部同步 meta.day）
  tickCity(state, CATALOG);                    // 2 施工推进/完工、popCap 同步、裁超编工人
  tickEconomy(state, CATALOG);                 // 3 产出/维护→写 resources 与 state.economy
  tickPopulation(state);                       // 4 口粮→民心→疾病→生死→gameOver 判定
  const { completed } = tickQuests(state, QUESTS);   // 5 任务进度刷新
  for (const id of completed) pushLog(state, `任务「${nameOf(id)}」可领取`, "good");
}
```

顺序理由（不得调换）：climate 先行使 economy 拿到当 tick 的 `outputFactor` 与
扣完燃料后的资源；city 在 economy 前使**当 tick 完工**的建筑立即计入产出与容量；
population 在 economy 后吃的是新鲜产出；quests 最后读定稿状态。

- `meta.tick` 只在 `runTick` 自增；`meta.day` 只由 `tickClimate` 从 tick 推导
  （既有行为，双保险已内置）。其他系统禁止碰这两个字段。
- boot 顺序：`loadGame() ?? createInitialState(seed)` → `setCatalog(state, await
  loadBuildingCatalog())` → `initQuests(state, QUESTS)` → `loop.start()`。
  读档后必须重新 `setCatalog`（catalog 是不可枚举属性，不进存档）。
- combat / heroes 无 tick：全部动作驱动（§5）。

---

## 5. 动作表（`js/bridge/actions.js` — UI→模拟唯一入口）

统一约定：动作签名 `fn(state, ...args)`，同步执行，返回
`{ ok: boolean, reason?: string, ... }`；main.js 把动作绑定进 `game` 对象注入
panels。**失败必须 toast**（P0 无失败 UI 的另一半）：`r.ok === false` 时
`hud.toast(r.reason, "warn")`，动作层保证 `reason` 非空中文。

| 动作 | 签名 | 实现（权威函数） | 备注 |
|---|---|---|---|
| `startUpgrade` | `(state, key)` | `id = toId(key)`；`city.startUpgrade(state, id, CATALOG)` 返回 boolean，false 时 `reason = canUpgrade(state, id, CATALOG).text` | 升级是**排队施工**（progress 推进），不再即时完成；成功后 `renderer.pulse(key)` |
| `assignWorkers` | `(state, key, delta)` | `want = 槽位.workers + delta`；`city.assignWorkers(state, id, want, CATALOG)`（绝对数语义） | false 时 reason 取最近一条 warn 日志文案或固定「工位已满/人手不足」 |
| `recruit` | `(state, times)` | 循环 `times` 次 `heroes.recruitHero(state, null, rng, { pool: HEROES })`；首次 `ok:false` 即中断并返回已得结果 | 票价 1/抽；十连无保底（pity 列 Round 3）；`rng` 见下 |
| `deploy` | `(state, heroIds)` | `heroes.deployTeam(state, heroIds)` | 上限 5、驻防武将需先 `ungarrisonHero` |
| `raid` | `(state, send)` | `enc = combat.makeRaidEncounter(state.meta.day, rng)`；`troops = clamp(send, 0, army.troops)` 按兵种；`result = resolveBattle({ rng, attackers: { troops, heroes: getDeployedHeroes(state, HEROES) }, defenders: enc })`；`applyBattleResult(state, result)`；`pushLog` 胜/败战报摘要 | 返回 `{ ok: true, report: result, encounter: enc }`；panels 战报改读 `result.log[]`（round/attackerDamage/defenderDamage/attackerHp/defenderHp/events）。已知坑：`applyBattleResult` 读 `state.day`（权威树无此字段），动作层调用后补 `state.war.log[0].day = state.meta.day` |
| `claimQuest` | `(state, questId)` | `quests.claimQuest(state, questId, QUESTS, { heroCatalog: HEROES })` | 必传 `heroCatalog`，否则 `zhao_yun` 进 pendingHeroGrants 不发放。同坑：`claimedAt` 内部读 `state.day` 得 0，成功后动作层补 `state.quests.entries[questId].claimedAt = state.meta.day` |
| `restart` | `(state 引用替换, seed?)` | `next = createInitialState(seed ?? (Date.now() >>> 0))`；`setCatalog` + `initQuests`；main.js 整树替换持有引用；`saveGame(next)`；`loop.reset()`；关闭遮罩 | 仅在 gameOver 遮罩或系统面板二次确认后可调 |
| `trainTroops` | `(state, type, n)` | `cost = TROOPS[type].trainCost × n`；`pay` 失败 → `{ok:false}`；受 `troopCap` 约束；`army.troops[type] += n`；`stats.troopsTrained += n` | 即时训练；`trainTicks` 排队制列 Round 3。支撑 q_main_10 与三兵种编成 |
| `setFurnaceLit` | `(state, on)` | `on ? climate.lightFurnace(state) : climate.extinguishFurnace(state)` | 取代旧燃料三态按钮 |
| `garrison` / `ungarrison` | `(state, heroId, buildingId?)` | `heroes.garrisonHero` / `ungarrisonHero`（buildingId 为**权威 id**） | 驻守产出加成已由 economy.garrisonFactor 消费 |
| `research` | `(state, techId)` | 校验 `L("academy") ≥ tech.reqLevel`、未研、`pay(cost)` → `research.done.push(techId)` + 日志 | 科技表从 main.js 的 TECHS 迁至 **`data/techs.js`**（6 条原样）；乘区接入 economy 列 Round 3，本轮只做解锁记录与展示 |

确定性 rng：动作层统一 `const rng = combat.makeRng(((state.meta.seed >>> 0) ^ state.meta.tick) >>> 0)`；
每个动作调用点新建，保证同存档同 tick 重放结果一致。

---

## 6. 存档：只走 `SAVE_KEY`

1. 唯一键 = `config.SAVE_KEY`（`"sanguo-ice-age-save-v1"`），唯一通道 =
   `engine/save.js` 的 `defaultAdapter`（`saveGame` / `loadGame`）。信封、
   `normalizeState`、`assertState` 校验均已内置，桥/UI 禁止绕过。
2. **`${SAVE_KEY}-ui` 旧键处置**：boot 时 `loadGame()` 返回 null 且
   `localStorage` 存在 `-ui` 键 → `removeItem` 并 toast「检测到旧版试玩存档，已重新开局」。
   **不做数据迁移**（扁平内核结构与权威树不同构，且其桥从未激活）。此后任何代码
   不得再写该键。
3. 自动存档节奏：每 8 秒 `saveGame(state)` + `beforeunload`；`gameOver` 置真的那个
   tick 后立即存一次（保留死亡现场）。
4. 版本：`SAVE_VERSION` 1 → 2；§1.3 全部迁移写在 `normalizeState`，v1 旧档读入后
   自动升级，`assertState` 按新形状校验。

---

## 7. `ID_ALIASES` 仅迁移

1. 三张别名表的**唯一合法用途**：
   - `config.BUILDING_ID_ALIASES` + `resolveBuildingId`：`normalizeState` 读档迁移
     （`migrateBuildingIds` 已实现）。
   - `systems/city.js` 的 `ID_ALIASES`：仅 `defOf` 对未知 id 的兜底查询，防旧存档
     中途炸掉。
   - `config.HERO_ID_ALIASES`（§1.3 新增）：仅 `normalizeState` 武将 id 迁移。
2. **禁止**：新代码以旧 id 书写字面量；数据表 / 任务表 / bridge / UI 引用别名；
   给别名表加"新→新"的映射。别名表只增不删（老存档永续可读），但每一项都应只在
   迁移路径上被命中。
3. 渲染键 ≠ 建筑 id。`render/canvas.js` 的 `CITY_LAYOUT` 键是**表现层坐标键**，
   与权威 id 的换算表唯一落点在 `js/bridge/view.js`：

```js
export const RENDER_KEY_TO_ID = {
  furnace: "furnace", house: "house", lumber: "lumber", hunter: "hunter",
  coal: "coal_mine", iron: "iron_mine", storage: "warehouse", kitchen: "kitchen",
  clinic: "clinic", barracks: "barracks_inf", recruit: "tavern",
  academy: "academy", wall: "wall",
};
// 反表 ID_TO_RENDER_KEY 由上表推导；无渲染槽位（key=null，仅面板可达）：
//   barracks_arch, barracks_cav, hospital, embassy
```

`toId(key) = RENDER_KEY_TO_ID[key] ?? resolveBuildingId(key)`——动作层入口统一换算，
systems 永远只见权威 id。

---

## 8. 给实现者的硬约束（8 条）

1. **单一事实源**：模拟状态只存在于 state.js 权威树一份。§1.4 清单里的
   main.js 内置内核代码全部删除，禁止任何形式的双内核或"临时兜底模拟"。
2. **单向数据流**：UI / render 只消费 `projectView` 的产物与 `game` 动作对象，
   禁止直接读写 `state`；systems 只被 `runTick` 与 `js/bridge/actions.js` 调用。
3. **id 纪律**：建筑 id 只用 §1.2 的 17 个、武将 id 只用 `data/heroes.js` 名册；
   别名表只出现在 §7 列出的三个迁移/兜底点；渲染键必须经 `RENDER_KEY_TO_ID` 换算后
   才能进入 systems。
4. **存档纪律**：唯一键 `SAVE_KEY`、唯一通道 `engine/save.js`；`-ui` 键只删不写；
   `SAVE_VERSION=2` 的全部迁移集中在 `normalizeState`，不得散落各处。
5. **`projectView` 纯函数**：`projectView(state)` 单参可调、无副作用、不依赖
   DOM/`performance`/`Math.random`；UI 局部态（speed/paused/banner）只在 main.js 合并层存在。
6. **tick 纪律**：顺序固定 climate→city→economy→population→quests；`meta.tick`
   只由 `runTick` 自增；`gameOver` 后 `runTick` 短路但渲染循环与遮罩继续。
7. **失败必反馈**：动作返回 `ok:false` 必 toast（reason 非空中文）；
   `flags.gameOver` 真值必出全屏结算遮罩 + 可用的 `restart`。静默失败即缺陷。
8. **测试红线**：`node tests/runner.mjs`、`tests/probes.mjs`、`tests/bench.mjs`
   全绿交付；`bridge-project-view` 探针必须由 skip 转 pass；禁止修改测试来适配实现
   （发现测试本身与本文冲突时，先在 PR 描述中援引本文条款再议）。
