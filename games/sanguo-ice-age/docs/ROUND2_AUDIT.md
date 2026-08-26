MODEL_SLUG: claude-fable-5-thinking-xhigh

# Round 2 审计:双核 / 三套 id / 双存档 / RNG 非确定性

> 审计范围:`js/main.js`(probeBridge、FALLBACK CORE、存档桥接)、`js/config.js`(BUILDING_IDS)、
> `js/state.js`、`js/systems/city.js`(ID_ALIASES)、`js/engine/save.js`、`js/engine/rng.js`,
> 并抽查 `systems/economy.js`、`systems/climate.js`、`systems/population.js`、`data/buildings.js`。
> 本文档只记录风险与合并策略,不改任何代码。

---

## 0. 现状盘点(事实,非推测)

### 0.1 三套建筑 id + 两张别名表

| 套 | 定义处 | id 列表 | 消费方 |
|---|---|---|---|
| 套 1 | `config.BUILDING_IDS` | `lumberyard, hunter, coalmine, ironmine, kitchen, clinic, warmhouse, barracks, academy`(9 个,火炉单独存 `city.furnaceLevel`) | `state.js createInitialState` 用它生成 `city.buildings` 的键 |
| 套 2 | `data/buildings.js` 与 `systems/city.js DEFAULT_BUILDINGS`(两处已对齐) | `furnace, lumber, hunter, coal_mine, iron_mine, house, warehouse, kitchen, clinic, hospital, wall, barracks_inf, barracks_arch, barracks_cav, academy, tavern, embassy`(17 个,snake_case) | 全部 systems(city/economy/climate/population) |
| 套 3 | `main.js` 内置内核 `BUILDINGS` | `furnace, house, lumber, hunter, coal, iron, kitchen, storage, barracks, clinic, recruit, academy, wall`(13 个,短名) | UI 内核、渲染层 `CITY_LAYOUT`、当前实际运行的游戏 |

别名表两张,方向不同、覆盖不全:

- `systems/city.js` 的 `ID_ALIASES`:套 1 → 套 2,共 6 条,其中 `storehouse` 在 `BUILDING_IDS` 里根本不存在(死别名);且**只在 `defOf()` 一处生效**(详见风险 A3)。
- `main.js` 的 `DATA_BUILDING_ALIAS`:套 2 → 套 3,共 13 条,只用于借数据表文案,机制不走它。

### 0.2 双核

- 内置内核(`main.js createCore`):扁平 state(`buildings` 为数组、顶层 `population`/`morale`/`troops`),当前实际推进游戏。
- 外部内核(`systems/*` + `state.js`):嵌套 state(`meta / city.buildings{} / people / army / heroes.roster`)。
- `probeBridge` 用形状探测决定是否交权:`Array.isArray(sample.buildings) && !!sample.resources && !!sample.population`。`createInitialState()` 返回的是嵌套结构,探测**当前必然失败**,`bridge.active === false`,外部四系统一行都没在跑。

### 0.3 双存档

- `engine/save.js`:键 `sanguo-ice-age-save-v1`,信封 `{format, version, savedAt, state}`,读档走 `normalizeState + assertState`,**只接受嵌套结构**,校验任一条不过即返回 `null`(按新游戏处理)。
- `main.js` UI 内核:键 `sanguo-ice-age-save-v1-ui`,裸 JSON `{v:1, s, heroSeq, logSeq}`,扁平结构。
- 切换开关:`extSaveAdapter = bridge.active ? ext.save : null`,**启动时定死,运行中不再变**。

### 0.4 RNG

- `engine/rng.js`:mulberry32,可播种、`getState/setState` 支持断点续随机——**全仓库零引用**(只有自己的 README 提到)。
- `systems/combat.js`、`systems/heroes.js`:接受 `rng` 参数但默认 `Math.random`。
- `main.js` 内核:抽卡、战斗胜负、掉落、升级全部裸 `Math.random`(8 处)。
- `state.meta.seed` 是死字段,没有任何代码消费它。

---

## 1. 风险清单

### A 类:会炸档(存档损坏 / 进度静默丢失)

- **A1|双通道交叉写入 → 进度静默清零(高危,当前被 `bridge.active=false` 碰巧压住)**
  `persist()` 在 `bridge.active` 时调 `ext.save.saveGame(core.raw)`,把**扁平** state 写进**嵌套键** `sanguo-ice-age-save-v1`。下次启动 `loadGame()` → `normalizeState` 深合并时 `heroes`(扁平档里是数组)会整体覆盖到 `heroes`(嵌套档里应为对象)→ `assertState` 报"state.heroes 类型错误" → 返回 `null` → **静默按新游戏处理,玩家进度无声蒸发**。任何让 bridge 激活的改动(见 C2)都会连带引爆本条。

- **A2|`ID_ALIASES` 只在 `defOf()` 生效,派生量全部绕过它(高危,老档读进来就是残档)**
  `warehouseCap` / `housingCapacity` / `insulation` / `climate.js` 的 warmth 统计 / `checkFurnacePrereq` 里的 `levelOf` 全部直接 `cat[id]` 或按正典 id 查询,不走别名。后果:老存档(套 1 id)里 `warmhouse`(民居)条目等级再高也**不贡献人口上限**,`lumberyard` 不贡献任何派生量;更狠的是 `checkFurnacePrereq` 按套 2 id(`lumber` 等)查等级,老档等级都挂在 `lumberyard` 下 → 查出来是 0 → **火炉永远升不上去,变相锁档**。

- **A3|`ensureState` 制造新旧双份条目 → 产出双份、后续清理必炸(高危)**
  `ensureState` 会按目录补齐全部套 2 id 条目,同时保留 state 里已有的套 1 id 条目 → `lumberyard` 与 `lumber` 并存。`economyRates` 遍历 `city.buildings` 全部键,而 `buildingOutput` 的 def 查询走 `defOf`(别名生效)→ **两个条目都能产出**,同一建筑家族双份产能。将来谁"顺手清理"别名或删除旧条目,数值前后对不上,回档即崩。

- **A4|`assertState` 一票否决 + 无备份直接弃档(中危)**
  读档任何一条校验失败(哪怕只是 `heroes.deployed` 里残留一个已删武将的 id)都整档作废且不留备份。合并期间结构必然频繁演进,这是"每次小失误都全额扣玩家进度"的放大器。

- **A5|`main.js hydrate` 的 `heroSeq` 回退可能撞 id(低危)**
  缺 `heroSeq` 字段时回退 `S.heroes.length + 1`,若历史上有过 id 空洞,新旧 hero id(`h3` 之类)可能重复,战斗点将按 id filter 会选错人。

- **A6|三种日志条目形状(低危,合并时会显性化)**
  `main.js` 内核 `{id, day, text, kind}`、`state.js` `{tick, text, level}`、`systems/city.js` `{tick, day, text, level}`。`assertState` 只查 `text`,暂不炸档,但合并后 UI 按 `kind` 上色会整体失效。

### B 类:会白屏(启动失败 / 渲染中断)

- **B1|`main.js` 装配段裸奔(中危)**
  `tryImport` 只保护动态 import。第 990 行以后的同步装配(`getElementById`、`createCityRenderer`、`createHud`…)没有任何 try/catch:`index.html` 少一个元素、`render/canvas.js` 改个导出名,整页白屏。合并期间恰恰是这些接口最容易被动的时候。

- **B2|桥接调用签名没有契约,靠巧合不崩(中危)**
  桥接以 `t.fn(core.raw, { dt, ticksPerDay, bus })` 统一调用,但四个系统第二参语义各不相同:`tickCity/tickEconomy` 当 catalog(靠 `looksLikeCatalog` 识破 `{dt,ticksPerDay,bus}` 不像目录才侥幸回落默认目录)、`tickClimate/tickPopulation` 当 cfg(会把 `{dt,ticksPerDay,bus}` 真当配置读,静默错配)。任何一方改签名,行为都会悄悄变化;systems 内部虽有 try/catch + `fails>=3` 熔断兜底不至于白屏,但会转化为 C 类静默降级。

- **B3|`probeBridge` 的 `makeState()` 探测在装配前执行(低危)**
  当前 `createInitialState` 无副作用所以安全;但它是模块顶层 await 阶段就跑的探针,若未来构造函数读 localStorage / 触 DOM,异常被吞、副作用不可控。

- **B4|`setCatalog` 往 state 挂不可枚举对象的模式(低危,预防性)**
  目前 `core.raw` 没有 `city`,一旦桥接激活、`ensureState` 造出 `city` 并被 `setCatalog` 挂上整张目录,`cloneState` 的 `structuredClone` 遇到函数字段会退 JSON,序列化行为随内容漂移。禁止把这个模式推广(见禁止事项 5)。

### C 类:会静默用错核(双核同跑 / 悄悄降级 / 结果不可复现)

- **C1|【全场最大的雷】`runTick` 是"叠加"不是"交接"(高危)**
  `bridge.active` 时先跑外部四系统,然后**无条件再跑 `core.tick()`**。一旦桥接激活:资源、人口、民心被两套内核各推一次(双倍速+互相覆盖),外部 `tickEconomy` 按套 2 目录结算、内核按套 3 目录再结算一遍,且**没有任何用户可见的告警**。

- **C2|形状探测判据太弱,"正确的合并动作"会当场引爆 C1(高危)**
  判据只有三条:顶层 `buildings` 是数组、有 `resources`、有 `population`。"把 `state.js` 改成扁平结构"这一看似合理的统一方向,会让探测瞬间通过 → C1(双核叠加)+ A1(存档交叉写入)同时触发。**结论:合并顺序上必须先拆 `runTick`,后动 state 结构。**

- **C3|单系统熔断后的"半桥接"状态(中危)**
  某个外部系统 `fails>=3` 被单独停用后,其余外部系统 + 内置内核继续同跑:比如气候归外部、经济归内核,两边对同一 state 的字段约定不同(`people.pop` vs `population.total`、仓储上限 300 基线 vs 460 基线),数值静默错乱,玩家只会觉得"游戏怪怪的"。

- **C4|降级不回切存档通道(中危)**
  `extSaveAdapter` 在启动时按 `bridge.active` 定死。运行中桥接全灭降级为内置内核后,`persist()` 仍走 `ext.save` 把(此时已被两核混写过的)state 写进嵌套键,放大 A1。

- **C5|RNG 全线非确定(中危,但影响横跨测试与反作弊)**
  `engine/rng.js` 零引用,`state.meta.seed` 是摆设,所有随机走 `Math.random`:回放不可复现、集成测试天然 flaky、读档刷抽卡(save-scum)零成本。另有一个实现细节坑:`rng.setState(v)` 内部走 `hashSeed(v)`,会把合法游标 `0` 映成 `1`,断点续随机在边界值上有偏差,接入存档前要修。

- **C6|同名概念双份数值、量纲不同(中危)**
  `config.CLIMATE` 有 `fuelWoodPerTick: 0.08 / fuelCoalPerTick: 0.035`(每 tick 语义),`main.js` 内核 `fuelPerDay` 自算 `2.9 / 1.25`(每日语义,0.08×16=1.28≠2.9)。统一燃料逻辑时极易拿错一套,烧柴速度差一倍以上都未必有人察觉。

---

## 2. 建议合并顺序

原则:**先拆雷管(双核叠加),再统一地基(id → state),最后并通道(存档 → RNG)**。每一步独立可验证、可回滚;顺序颠倒(尤其先动 state 结构)会同时触发 C1+C2+A1。

1. **第 0 步|拆雷管:改 `runTick` 为"非此即彼"+ 显式握手**
   `bridge.active` 时不再调 `core.tick()`(或桥接改为只读观察不写 state)。同时把 `probeBridge` 的形状猜测换成显式握手:如 `state.js` 导出 `STATE_SHAPE = "nested-v1"`,`main.js` 白名单匹配才交权。**在本步合入之前,冻结一切可能让形状探测通过的 `state.js` / systems 改动。**

2. **第 1 步|统一建筑 id,定套 2(`data/buildings.js` 的 snake_case)为唯一正典**
   理由:字段最全、data 与 systems 两处已对齐、消费方最多。动作:`config.BUILDING_IDS` 改为正典 id;`state.js createInitialState` 改用正典 id;`ID_ALIASES` 降级为**只读档迁移表**——在 `ensureState`(或专门的迁移函数)里做一次性改名(把 `lumberyard` 条目搬到 `lumber` 后删除旧键),而不是双份并存;`warehouseCap` / `housingCapacity` / `insulation` / `checkFurnacePrereq` / `climate.js` 的 `cat[id]` 全部改走 `defOf`(迁移完成后此层可再简化)。本步单独消灭 A2、A3。

3. **第 2 步|统一 state 结构,定嵌套为正典**
   `save.js`、`state.js`、全部 systems 都按嵌套实现,`main.js` 内核是少数派——改少数派。给内置内核加一层 view-model 适配(内核读写嵌套 state),**不要把 `state.js` 改扁平**(见 C2)。同批:`main.js` 的套 3 `BUILDINGS` 机制表退役,UI 改从 catalog 取定义,`DATA_BUILDING_ALIAS` 删除;`render/canvas.js` 的 `CITY_LAYOUT` 键名同步到正典 id。

4. **第 3 步|统一存档通道到 `engine/save.js`,单键 + 迁移器 + 弃档备份**
   写一次性迁移器把 `${SAVE_KEY}-ui` 的旧扁平档(借第 1 步迁移表)翻译成嵌套信封档,成功后删旧键;`loadGame` 校验失败时先把原始 payload 备份到 `${SAVE_KEY}-corrupt-backup` 再按新游戏处理(消 A4);`SAVE_VERSION` 升号。

5. **第 4 步|接入 RNG**
   装配层 `createRng(state.meta.seed)`,`fork` 给 combat / heroes / climate / 招募;`rng.getState()` 随存档写入、读档 `setState` 恢复(先修 `setState` 对 0 的 `hashSeed` 偏差);`main.js` 内核残余的 `Math.random` 全部改为注入。放最后是因为它不阻塞前四步,但改动面横跨所有系统,适合在结构稳定后一次做完。

6. **第 5 步|收尾清理**
   日志条目统一为 `{tick, day, text, level}`(`main.js` 的 `kind` → `level` 一次替换,UI 上色跟进);燃料常量统一到 `config.CLIMATE`(明确每 tick 语义),删除内核私有的 `2.9 / 1.25`(消 C6);删除死别名 `storehouse` 与失效注释。

---

## 3. 禁止事项

1. **禁止发明第四套建筑 id。** 包括但不限于:"临时前缀 id""新旧双写 id""camelCase 变体"。新代码一律使用套 2 正典 id;套 1 / 套 3 的旧 id 只允许出现在读档迁移表中,且迁移表只减不增。
2. **禁止在第 0 步(拆 `runTick` 叠加)合入之前,提交任何会让 `probeBridge` 形状探测通过的改动**——特别是"把 `state.js` 改成顶层扁平"这类看似正确的统一动作。
3. **禁止新增别名表**(现有 `ID_ALIASES` / `DATA_BUILDING_ALIAS` 两张封顶、只删不加),禁止在别名之上再叠别名(链式解析)。
4. **禁止绕过 `engine/save.js` 直接读写 localStorage 新键**;禁止在未附带迁移器的情况下更改 `SAVE_KEY` 或存档信封结构;校验规则(`assertState`)的收紧或放宽必须与 `SAVE_VERSION` 升号、迁移器同批提交,不许"顺手改一行让临时结构过检"。
5. **禁止往 state 里塞函数、DOM 引用或不可枚举属性**(`setCatalog` 的挂载模式到此为止,不许推广);state 必须始终满足"纯 JSON 可序列化"。
6. **禁止在新增的随机逻辑里使用 `Math.random`**(存量默认参数在第 4 步统一替换);所有随机必须经注入的 rng 实例,以保证 seed 可复现。
7. **禁止再引入"第二参各收各的"tick 签名**;新系统一律 `(state, ctx)`,`ctx` 内带 `catalog / rng / dt / bus`,并禁止在 tick 内静默吞错超出现有熔断约定(连续失败必须有用户可见的降级提示,不能只有 console.warn)。
