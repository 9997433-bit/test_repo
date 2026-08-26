# 超能下蛋鸭 · API 契约（v1.0）

- 所有者：Fable-1。读者：全体子代理。类型用 JSDoc 风格伪码表述，实现为原生 ESM JavaScript。
- **凡标「已锁定」= 现有代码/测试已固化，改动必须先过变更流程；其余为 Round 1 定稿接口，实现者按此落地。**

## 0. 契约变更流程

1. 只增不改：新增函数/事件/字段直接落地，并在本文件追加（PR 说明里标注段号）。
2. 破坏性变更（改签名、改事件 payload、改存档语义）：先在本文件改并在 §14 记录迁移说明，同轮通知受影响所有者，最后改代码与测试。
3. 事件命名：`域:动作`，全小写，连字符分词（如 `combo:change`、`fever:start`）。
4. 每个模块目录的 `index.js` 是唯一公共出口；本契约未列出的导出视为私有，随时可变。

## 1. 通用类型与枚举

```js
/** @typedef {{x:number, y:number}} Vec2 */
/** @typedef {'none'|'fire'|'ice'|'thunder'} Element */
/** @typedef {'combo'|'brute'|'elemental'|'collide'|'support'} School */
/** @typedef {'chick'|'duck'|'goose'|'bird'} Race */
/** @typedef {'adventure'|'rogue'|'tower'|'raid'|'fishing'} ModeId */
/** @typedef {'minion'|'elite'|'boss'} EnemyTier */
```

角度约定：瞄准角 `angle` 为弧度，0 = 正下方，左负右正，钳制 `[-70°, +70°]`；蓄力 `power01 ∈ [0,1]` → 初速 `220 + 500 × power01` px/s。

## 2. core/events —— 总线与事件目录

### 2.1 API（已锁定）

```js
createBus() → {
  on(type, fn) → unsubscribe,   // fn(payload)；unsubscribe() 幂等
  emit(type, payload) → void,   // 同步调用全部监听者，不捕获异常（fail fast）
}
```

全局唯一总线由 `main.js` 创建并注入各工厂；模块不得自建第二总线。

### 2.2 事件目录（发出者 → 主要消费者）

**战局流转（battle 控制器发出）**

| 事件 | payload | 消费者 |
| --- | --- | --- |
| `battle:start` | `{mode, stageId?, wave, team:heroId[]}` | ui, audio |
| `battle:wave` | `{wave, total, enemyCount}` | ui, audio |
| `battle:win` / `battle:lose` | `{result:BattleResult}` | modes, ui, audio |
| `turn:aim` | `{heroId, shotsLeft}` | ui |
| `shot:fired` | `{heroId, angle, power01, eggIds:string[]}` | ui, audio, heroes |
| `turn:end` | `{shotIndex, comboPeak}` | ui |
| `player:hurt` | `{amount, hp, source:'leak'|'touch'}` | ui, audio |

**物理桥接（battle 从 `world.events` 转发）**

| 事件 | payload |
| --- | --- |
| `egg:spawn` | `{eggId, heroId, generation, x, y}` |
| `egg:bounce` | `{eggId, bodyId, kind, x, y, nx, ny, speed}` |
| `egg:split` | `{parentId, childIds:string[]}` |
| `egg:recycle` | `{eggId, reason:'oob'|'sleep'|'consumed'}` |

**战斗结算（battle 应用 HitResult 后发出）**

| 事件 | payload |
| --- | --- |
| `hit:resolved` | `{eggId, targetId, result:HitResult}` |
| `damage:applied` | `{targetId, amount, crit, element, x, y, killed}` |
| `enemy:die` | `{enemyId, tier, x, y, overkill}` |
| `brick:break` | `{brickId, x, y, explosive}` |
| `element:stack` | `{targetId, element, stacks}` |
| `reaction:trigger` | `{kind:'vaporize'|'superconduct'|'overload'|'burn'|'freeze'|'chain', targetId, x, y, victims:string[]}` |
| `combo:change` | `{value, delta, peak}` |
| `combo:break` | `{peak}` |
| `fever:start` | `{duration}` ／ `fever:end` `{}` |
| `bond:proc` | `{school, level:2|3|4, kind}` |

**英雄**

| 事件 | payload |
| --- | --- |
| `hero:switch` | `{slot:0..4, heroId}` |
| `hero:energy` | `{heroId, energy, max:100}` |
| `hero:ult` | `{heroId, skillId}` |

**FX（战斗/模式发出；ui、audio 消费；纯数据）**

| 事件 | payload |
| --- | --- |
| `fx:floater` | `{x, y, text, style:'dmg'|'crit'|'burn'|'freeze'|'shock'|'heal'|'combo'|'warn'}` |
| `fx:shake` | `{power:0..1, ms}` |
| `fx:hitstop` | `{ms}`（契约值：普通暴击 30ms） |
| `fx:flash` | `{color, ms}` |

**养成 / 元进度（progression、store 发出）**

| 事件 | payload |
| --- | --- |
| `save:written` | `{save}` |
| `gold:change` | `{gold, delta}` |
| `shard:gain` | `{heroId, count}` |
| `hero:levelup` | `{heroId, level}` ／ `hero:starup` `{heroId, star}` |
| `dex:unlock` | `{heroId}` |

**模式**

| 事件 | payload |
| --- | --- |
| `mode:enter` / `mode:exit` | `{mode:ModeId}` |
| `rogue:offer` | `{wave, choices:RogueChoice[3]}` |
| `rogue:pick` | `{choice:RogueChoice}` |
| `tower:sweep` | `{floors:number, rewards}` |
| `raid:tick` | `{remaining, totalDamage}` |
| `raid:end` | `{totalDamage, tier}` |
| `fishing:cast` | `{zone}` ／ `fishing:catch` `{quality:1..3, buff:BattleBuff}` |
| `buff:gain` | `{buff:BattleBuff}` ／ `buff:expire` `{buffId}` |
| `screen:change` | `{from, to}` |

新增事件 = 在此登记 + 命名合规，即视为契约通过。

## 3. core/rng（共享底座，API 冻结）

```js
createRng(seed = 1) → {
  next() → [0,1),                 // mulberry32 变体，确定性
  range(min, max) → number,
  int(min, max) → number,          // 闭区间整数
  pick(list) → item,
  chance(p) → boolean,
  shuffle(list) → newList,
}
hashSeed(str) → uint32             // 字符串 → 稳定种子（FNV-1a）
```

## 4. core/loop

```js
createLoop({ step, render, fixedDt = FIXED_DT, maxSubSteps = 4 }) → {
  start(), stop(), pause(), resume(),
  get running() → boolean,
}
// step(fixedDt) 固定步进；render(alpha) 每 rAF 一次，alpha = 累积余量/fixedDt
// 帧间隔钳制 1/30s；页面隐藏（visibilitychange）自动 pause
```

## 5. core/store —— 存档 schema `cnyd-save-v1`

### 5.1 API

```js
SAVE_KEY = "cnyd-save-v1"                    // 已锁定
defaultSave() → Save                          // 已锁定（返回全量默认档）
loadSave() → Save                             // 缺失/解析失败 → defaultSave()（已锁定）
writeSave(save) → save                        // 同步写 localStorage，并 emit save:written
normalizeSave(raw) → Save                     // 深合并嵌套对象、非法值回默认、丢弃未知字段
```

### 5.2 Schema v1 全量（注释为约束）

```jsonc
{
  "version": 1,
  "gold": 260,                       // ≥0 整数；初始 260（O3 定稿）
  "shards":     { "<heroId>": 0 },   // 碎片，≥0 整数
  "heroLevels": { "<heroId>": 1 },   // 1..40
  "heroStars":  { "<heroId>": 1 },   // 1..5
  "owned":  ["dash_duck", "..."],    // 已解锁英雄；初始 8 只（STARTER_HEROES）
  "roster": ["dash_duck", "sun_bird", "thunder_chick", "heal_duck", "guard_duck"],
                                     // 上场 5 只，长度恒 5，元素 ∈ owned
  "adventureStage": 1,               // 下一可打关 1..25（25 = 通关）
  "stageStars": { "<stageId>": 0 },  // 逐关最佳星级 0..3，stageId 如 "3-2"
  "towerFloor": 1,                   // 下一层 1..31
  "bestRogueWave": 0,
  "bestRaidDamage": 0,
  "dex": { "<heroId>": true },       // 图鉴；owned 自动并入
  "fishBuff": null,                  // BattleBuff|null：当前挂载的钓鱼 BUFF
  "fishBest": { "<zone>": 0 },       // 各海域最佳连击
  "stats": { "battles": 0, "wins": 0, "eggs": 0, "bestCombo": 0 },
  "settings": {
    "shake": true, "reduceMotion": false,
    "sfx": true, "music": true, "aimAssist": true
  }
}
```

```js
/** @typedef {{id:string, stat:'atk'|'crit'|'eggs', value:number, battlesLeft:number}} BattleBuff */
```

兼容性注记：Round 1 基线 `defaultSave()` 尚未含 `owned/stageStars/fishBuff/fishBest/stats` 及扩展 settings；O3 落地本 schema 时，G1 需同步更新 `tests/store.test.js` 中对 `settings` 的 `toEqual` 断言（见 OWNERSHIP §4）。

## 6. physics（`src/physics/index.js`）

### 6.1 常量（导出名冻结）

| 常量 | 值 | 说明 |
| --- | --- | --- |
| `WORLD_W` / `WORLD_H` | 480 / 800 | 已锁定 |
| `GRAVITY` | 1680 | px/s²，向下 |
| `FIXED_DT` | 1/120 | 已锁定 |
| `EGG_RADIUS` | 12 | 默认半径（合法域 10–14） |
| `EGG_RESTITUTION` | 0.85 | 默认弹性（合法域 0.78–0.92） |
| `EGG_DRAG` | 0.02 | 每秒速度衰减比例 |
| `MAX_SPEED` | 2600 | px/s 限速 |
| `MAX_SUBSTEPS` / `SUBSTEP_TRAVEL_RATIO` | 8 / 0.5 | CCD 细分 |
| `SLEEP_SPEED` / `SLEEP_TIME` / `SPAWN_GRACE` | 8 / 0.6 / 0.2 | 睡眠判定 |
| `KILL_Y` | 820 | y 超出即回收（= WORLD_H + 20） |
| `MAX_EGGS` / `MAX_STATICS` | 24 / 80 | 硬上限，超额静默丢弃 |

### 6.2 类型

```js
/** @typedef Egg
 *  id:string, x,y,vx,vy:number,
 *  prevX,prevY:number,             // 渲染插值用，stepWorld 每步开头快照
 *  radius:number,                  // 注意：字段名 radius（测试已锁定，非 r）
 *  restitution:number,
 *  element:Element, power:number,  // power = 发射时算好的伤害载荷（见 §7.2）
 *  heroId:string|null, generation:0|1|2,
 *  pierce:number, bounces:number,  // bounces 累计反弹（碰撞流读取）
 *  sleepTimer:number, spawnTime:number,
 *  flags:{ heavy?:true, ghost?:true, magnet?:true }
 */

/** @typedef StaticBody —— 与 O1 工厂字段一致
 *  id:string,
 *  shape:'segment'|'circle'|'aabb',
 *  kind:'wall'|'ramp'|'brick'|'peg'|'bomb-brick'|'ice'|'portal'|'pad'|'enemy',
 *  active:boolean, sensor:boolean,
 *  restitution:number, friction:number,
 *  breakable:boolean, hp:number, maxHp:number,
 *  explosive:boolean, blastRadius:number, blastPower:number,
 *  element:Element|null, team:'neutral'|'enemy',
 *  entityId?:string,               // kind='enemy'|'brick' 时关联战斗实体
 *  tags:object, data:any,
 *  hits:number, lastHitTime:number,
 *  aabb:{minX,minY,maxX,maxY},     // 缓存包围盒，改坐标后调 computeAABB(body)
 *  // shape==='segment': x1,y1,x2,y2, radius(半厚), oneWay, nx,ny, length, angle
 *  // shape==='circle':  x,y,r
 *  // shape==='aabb':    x,y(中心), hw,hh, w,h
 */

/** @typedef Field
 *  id:string, kind:'fan'|'magnet'|'slow',
 *  x,y,w,h:number,                 // 作用区（AABB，中心式）
 *  ax,ay:number,                   // fan：恒定加速度
 *  strength?:number                // magnet/slow 系数
 */

/** @typedef PhysicsEvent —— world.events 元素（对象池化）
 *  {type:'contact', eggId, bodyId, kind, x, y, nx, ny, speed}
 *  {type:'egg-egg', aId, bId, x, y, speed}
 *  {type:'sensor',  eggId, bodyId, kind, x, y}
 *  {type:'sleep',   eggId, x, y}
 *  {type:'recycle', eggId, reason:'oob'|'sleep'|'consumed'}
 */

/** @typedef World
 *  { time:number, eggs:Egg[], statics:StaticBody[], fields:Field[],
 *    events:PhysicsEvent[] }       // eggs 只含活跃蛋；回收即移除（已锁定）
 */
```

### 6.3 函数

```js
createWorld() → World                          // 已锁定：空数组 + time 0
stepWorld(world, dt = FIXED_DT) → world        // 已锁定签名；步进开头清空 world.events，
                                               // 调用方必须在下一次 step 前排空读取
addEgg(world, spec:Partial<Egg>) → Egg|null    // 超 MAX_EGGS → null
removeEgg(world, eggId, reason='consumed')     // 穿透耗尽/被技能消耗时用
spawnSplitEggs(world, parent, {count, spread, rng}) → Egg[]  // 继承 0.7 速度、gen+1
addStatic(world, body) → body                  // 配合 make* 工厂
removeStatic(world, bodyId) → boolean          // 破砖；增量更新宽相网格
addField(world, field) → field
clearDynamic(world)                            // 清蛋与事件，静态保留（波次间用）

// 工厂（shapes）
makeWall(x1,y1,x2,y2,opts?) / makeSegment(opts) / makeRamp(opts)
makeBrick(opts) / makePeg(opts) / makeEnemyBody({x,y,r,entityId})
computeAABB(body) → body
resetBodyIds(v=1)                              // 测试/回放复位自增 id

// 弹道预测（已锁定：第 4 参为步数、返回数组、纯函数不写 world）
predictTrajectory(origin:Vec2, velocity:Vec2, world, steps = 240, opts?) 
  → Array<{x, y, t, hit?:{bodyId, kind}}>
// 每固定步 1 个采样；空世界恰返回 steps 个；命中敌人或 opts.maxBounces(默认3)
// 提前截断；忽略动态蛋；零随机；复用 stepWorld 同一套碰撞代码
```

## 7. combat（`src/combat/index.js`）

### 7.1 主函数（签名已锁定）

```js
resolveHit(egg, target, ctx = {}) → HitResult   // 纯函数，不改任何入参
```

```js
/** @typedef HitContext（ctx，全字段可选）
 *  combo?:number=0, point?:Vec2, impactSpeed?:number,
 *  bonds?:BondsActive,             // {combo:0|2|3|4, brute:…, elemental:…, collide:…, support:…}
 *  team?:TeamModifiers,            // 光环/神器聚合（atkMul, critChance, critMul…）
 *  buffs?:BattleBuff[],            // 钓鱼/道具
 *  fever?:boolean, rng?:Rng, now?:number
 */

/** @typedef HitResult
 *  damage:number,                  // ≥0 整数；对 power 与 combo 单调不减（已锁定）
 *  crit:boolean,
 *  comboDelta:1,                   // 恒 1（已锁定）
 *  effects:Effect[],               // 施加给主目标：{kind:'element',element,stacks}
 *                                  //             |{kind:'status',status,until}
 *  reactions:Reaction[],           // {kind, bonusDamage, x?, y?}
 *  splash:SplashHit[],             // {targetId:'__aoe__'|id, damage, element, radius?}
 *                                  // 超载 AoE / 感电连锁的二次伤害，由 battle 结算
 *  events:FxEvent[],               // fx:floater 等纯数据，battle 转发总线
 *  energyGain:number               // 命中 3 / 破砖 1.5
 */
```

### 7.2 伤害公式（系数落 `data/constants`，F3 可调；结构冻结）

```
egg.power = heroAtk(level,star) × (0.8 + 0.4×power01) × 0.7^generation
            × teamAtkMul × (1 + dexBonus)          ← 发射时由 battle 算好
damage = egg.power
       × bruteMul(主蛋且直殴羁绊)                    // 默认 ×1.25
       × critMul(命中暴击时)                        // 1.5 + 0.06×连击层(连击大羁绊)
       × (1 − armor/(armor+60))                     // 超导破甲期 armor 按 0
       × (1 − resist[egg.element])                  // resist ∈ [−0.5, 0.75]
       × frozenTakenMul(冻结中 ×1.25)
       × feverMul(爆蛋时刻 ×1.5) × ∏buffMul
edge: egg.power 缺省 10（已锁定）；egg.power === 0 → damage === 0（Round 2 锁定）
```

### 7.3 元素与状态

```js
createElementState() → {fire:0, ice:0, thunder:0}
applyElementStack(state, element, n=1) → stacks   // 封顶 3
resolveReactions(state, hitDamage) → Reaction[]   // 消耗层数规则见 ARCHITECTURE §5.2
tickStatuses(target, now) → {dotDamage, expired:string[]}
                                                  // battle 每 0.1s 调；灼烧结算处
```

### 7.4 连击

```js
createComboState() → {value:0, peak:0, expireAt:0, feverUntil:0}
comboHit(state, delta, now) → state               // 刷新 2.5s 窗口；≥20 且连击大羁绊 → fever
comboTick(state, now) → {broke:boolean, peak}     // 超时归零
COMBO_WINDOW = 2.5, FEVER_LAYERS = 20, FEVER_DURATION = 4
```

## 8. heroes（`src/heroes/index.js`）

### 8.1 运行时

```js
createHeroRuntime(heroId, {level=1, star=1}) → HeroRuntime
/** @typedef HeroRuntime
 *  id, def:HeroDef(只读), atk:number,
 *  energy:0..100, energyMax:100,
 *  hooks:HeroHooks, disabled:boolean
 */
gainEnergy(runtime, amount) → energy              // 封顶；变化时 battle 发 hero:energy
canUlt(runtime) → boolean                          // energy ≥ 100
```

### 8.2 Hook 接口（全部可选；纯进纯出，只能经 api 产生副作用）

```js
/** @typedef HeroHooks
 *  aura?(team) → Partial<TeamModifiers>       // 开战算一次（战鼓鸡/优雅鹅）
 *  modifyShot?(shot, api) → shot              // 改发射参数/蛋规格（齿轮鹅/元气鸡）
 *  onShotFired?(shot, api)
 *  onEggContact?(evt:PhysicsEvent, api)       // 每次反弹（鲨齿雕/倒霉鸭）
 *  onHitResolved?(evt:{eggId,targetId,result}, api)   // 手里剑鹅追加蛋
 *  onEggRecycled?(evt, api)                   // 治愈鸭
 *  onTurnEnd?(api)                            // 天堂鸟补雷
 *  onBattleStart?(api)                        // 守护鸭护盾
 *  onUltimate(api)                            // Q 技能；有大招英雄必须实现
 */

/** @typedef HeroApi —— battle 注入的能力面（拿不到 world/battle 引用）
 *  spawnEgg(spec) → eggId|null                // 受 MAX_EGGS 约束
 *  dealDamage(targetId, {amount, element})    // 走 resolveHit 同款减免
 *  applyElement(targetId, element, stacks)
 *  healPlayer(ratio) / addShield(count)
 *  grantEnergy(who:'self'|'others'|'all'|heroId, amount)
 *  addTurnModifier({dmgMul?, critChance?})    // 本回合有效
 *  freezeCombo(seconds)                       // 云朵雀
 *  query: { enemies() → EnemyView[], bricks() → BrickView[],
 *           combo() → number, time() → number }   // 均为只读快照
 *  rng() → number
 *  emit(type, payload)                        // 白名单：fx:* 与 hero:* 事件
 */
```

### 8.3 技能注册表（skill id 冻结；实现落 `heroes/skills/`）

| skillId | 英雄 | 主 hook | 行为摘要 |
| --- | --- | --- | --- |
| `dash_crit` | 冲鸭 | onShotFired | 首次命中必暴击 |
| `shuriken_split` | 手里剑鹅 | onHitResolved | 主蛋命中追加 2 枚小手里剑蛋（gen+1） |
| `dark_slash` | 堕羽鸦 | onUltimate | 连击≥8 时对当前目标高倍斩击 |
| `encore_energy` | 小帅鸽 | onUltimate | 刷新其他英雄 30% 能量 |
| `combo_hold` | 云朵雀 | onHitResolved | 被动：连击不衰减 4s（freezeCombo） |
| `solar_burn` | 日轮鸟 | onHitResolved | 高伤 + 火附着 |
| `heavy_gear` | 齿轮鹅 | modifyShot | 蛋变重（heavy），破砖 +1 穿透 |
| `war_drum` | 战鼓鸡 | aura | 全队攻击 +12% |
| `grudge_bounce` | 倒霉鸭 | onEggContact | 砖反弹每次 +8% 本回合伤害 |
| `extra_egg` | 元气鸡 | modifyShot | 开局回合额外 1 蛋 |
| `shock_bounce` | 雷神鸡 | onHitResolved | 雷附着，弹跳优先敌人（magnet flag） |
| `chain_groove` | 嘻哈鸭 | onHitResolved | 感电扩散到邻近 2 目标 |
| `storm_finale` | 天堂鸟 | onTurnEnd | 回合末对带电敌人补雷 |
| `blizzard` | 冰凤 | onUltimate | 冰附着；大招全场暴风雪 |
| `deep_freeze` | 帝企鹅 | aura | 冻结时长 +50%，生成冰面 |
| `feed_frenzy` | 鲨齿雕 | onEggContact | 每碰撞半径 +1（封顶 +6） |
| `antler_split` | 鹿角鸡 | onEggContact | 碰撞触发分裂（gen 上限内） |
| `yolk_heal` | 治愈鸭 | onEggRecycled | 回收蛋回复 4% 生命 |
| `shell_guard` | 守护鸭 | onBattleStart | 护盾挡 1 次漏怪伤害 |
| `waltz_slow` | 优雅鹅 | aura | 敌人行动减速光环，辅助冰系 |

## 9. data（`src/data/index.js`，F3 所有）—— 表 schema

`data` 只导出常量；以下形状冻结，数值 F3 全权调优。

```js
// heroes.js（已锁定导出名 HEROES / HERO_LIST；表键 === hero.id，测试锁定）
/** @typedef HeroDef
 *  id, name, race:Race, school:School, element:Element,
 *  atk:number, atkGrowth:number,      // atk(L) = atk + atkGrowth×(L-1)
 *  skill:skillId(§8.3), ultName:string, desc:string,
 *  rarity:1|2|3,
 *  eggMods?:{radius?, restitution?, flags?}
 */

// stages.js
/** @typedef StageDef
 *  id:'1-1'..'6-4', chapter:1..6, index:1..4, name,
 *  theme:'farm'|'night-market'|'volcano'|'glacier'|'circuit'|'kitchen',
 *  layout:LayoutItem[],               // {make:'brick'|'peg'|'ramp'|…, ...工厂参数}
 *  waves:Array<{enemies:Array<{id, x, y}>}>,   // 1..3 波，同屏 ≤12
 *  boss?:enemyId,                     // index===4 必填
 *  rewards:{gold, shards?:{heroId:n}},
 *  par:{time:number, hpRatio:number}  // 三星判定参数
 */

// enemies.js
/** @typedef EnemyDef
 *  id, name, tier:EnemyTier, hp, armor,
 *  resist:{fire, ice, thunder},       // ∈ [-0.5, 0.75]
 *  radius, touchDamage,
 *  behavior:'idle'|'patrol'|'sink'|'shield'|'heal'|'summon'
 *           |'boss_fryer'|'boss_statue'|'boss_incubator',
 *  actions?:object                    // behavior 参数（BOSS 行动表）
 */

// bonds.js
/** BONDS = { [school]: { 2:BondEffect, 3:BondEffect, 4:BondEffect } }
 *  @typedef BondEffect {name, desc, mods:Partial<TeamModifiers>, kind?:string}
 */

// artifacts.js（肉鸽神器）
/** @typedef ArtifactDef {id, name, rarity:1..3, desc, mods:Partial<TeamModifiers>} */

// 其余导出：BUFFS（钓鱼 BattleBuff 池）、RAID_TIERS（[{minDamage, rewards}]）、
// FISHING_ZONES（3 海域节奏参数）、ROGUE_POOLS（三选一奖池权重）
```

```js
/** @typedef TeamModifiers —— 光环/羁绊/神器统一聚合形状
 *  atkMul:1, critChance:0.10, critMul:1.5, dmgMul:1,
 *  extraEggs:0, eggRadiusAdd:0, energyGainMul:1,
 *  comboWindowAdd:0, freezeDurationMul:1, enemySlowMul:1, shields:0
 */
```

## 10. progression（`src/progression/index.js`，O3 所有）

```js
heroStats(heroId, level, star) → {atk, energyMax:100}
levelGoldCost(level) → gold            // 升到 level+1 的花费
starShardCost(star) → shards           // 升到 star+1
levelUpHero(save, heroId) → save'      // 纯函数：钱不够/满级返回原 save
starUpHero(save, heroId) → save'
dexAtkBonus(save) → 0..0.15
computeBonds(heroIds) → BondsActive    // 五流派人数 → 激活档位 {school: 0|2|3|4}
buildTeam(save, heroIds[5]) → TeamSnapshot
   // {members:HeroRuntime[5], bonds, mods:TeamModifiers（含 aura+dex 聚合）}
grantBattleRewards(save, result:BattleResult) → {save', gained:{gold, shards}}
sweepRewards(save) → {save', rewards}          // 塔扫荡纯公式，不模拟
rollRogueOffer(rng, wave, taken) → RogueChoice[3]
rollFishingBuff(rng, zone, quality) → BattleBuff
consumeFishBuff(save) → {save', buff|null}     // 出战扣 battlesLeft
/** @typedef RogueChoice {kind:'hero'|'artifact', id, rarity} */
```

## 11. modes（`src/modes/index.js`，O4 所有）

### 11.1 共享战斗控制器

```js
createBattle(cfg:BattleConfig, deps:{bus, rng}) → Battle
/** @typedef BattleConfig
 *  mode:ModeId, team:TeamSnapshot,
 *  layout:LayoutItem[], waves:WaveDef[],
 *  rules:{playerHp:100, timeLimitSec?, endless?:boolean, shotsPerTurn:1},
 *  seed:number, buffs:BattleBuff[]
 */

Battle {
  get state() → 'intro'|'aiming'|'flying'|'resolving'|'won'|'lost'|'paused'
  step(dt)                        // 固定步进（core/loop 驱动）；见 ARCHITECTURE §3
  fire(angle, power01) → boolean  // 仅 aiming 态生效
  castUltimate(slot:0..4) → boolean
  switchHero(slot) → boolean
  pause() / resume()
  getSnapshot() → BattleSnapshot  // 渲染专用只读视图，每帧调用零分配（复用对象）
  get result() → BattleResult|null
}

/** @typedef BattleSnapshot
 *  state, world(只读引用), enemies:EnemyView[], playerHp, shield,
 *  combo:{value, peak, feverUntil}, wave:{current, total},
 *  team:[{heroId, energy, disabled}], activeSlot, timer?:{remaining},
 *  aim?:{angle, power01, trajectory:Array<{x,y}>}
 */

/** @typedef BattleResult
 *  win:boolean, mode, stageId?, seed,
 *  stats:{time, comboPeak, damageTotal, bricksCleared, hpLeft},
 *  stars?:0..3, wave?:number, totalDamage?:number
 */
```

### 11.2 模式工厂

```js
createAdventureRun(save, stageId, deps) → {battle, finish() → {save', stars, rewards}}
createRogueRun(seed, deps) → {battle, wave, pendingOffer:RogueChoice[]|null,
                              pick(i:0..2), finish() → {save', bestWave}}
createTowerRun(save, floor, deps) → {battle, finish() → {save'}}
sweepTower(save) → {save', rewards}            // 委托 progression.sweepRewards
createRaidRun(save, deps) → {battle(60s 规则), finish() → {save', tier}}
createFishingSession(zone, deps) → {
  cast(), tap(tMs), get state(),               // 节奏窗口判定，无物理世界
  finish() → {save', buff:BattleBuff|null}
}
```

## 12. ui（`src/ui/index.js`，O4 所有）

```js
createScreenManager(rootEl, {bus, save}) → {show(name, params?), current}
// 屏幕名：'menu'|'team'|'adventure-map'|'battle'|'result'|'rogue'|'tower'
//        |'raid'|'fishing'|'dex'|'settings'
registerScreen(name, factory)     // factory(ctx) → {mount(el, params), unmount()}

createBattleRenderer(canvas) → {
  render(snapshot:BattleSnapshot, alpha),      // 蛋按 prev↔now 插值
  rebuildStaticLayer(world),                   // 砖破碎时调（离屏静态层）
  resize()                                     // DPR 封顶 2
}

createAimController(canvas, battle, {bus}) → {attach(), detach()}
// Pointer Events：按下→拖拽出角度与力度→松开 fire；每帧至多一次 predictTrajectory
// 键盘：←/→ ±2°、Space 蓄力/松开发射、1-5 换英雄、Q 大招、Esc 暂停
```

## 13. audio（`src/audio/index.js`，O4 所有）

```js
initAudio(bus, settings) → {setEnabled(sfx, music), suspend(), resume()}
// AudioContext 首次用户手势惰性创建；失败静默禁音
```

| 触发事件 | 合成音色 |
| --- | --- |
| `shot:fired` | 「啵」短促正弦 pop，音高随 power01 |
| `egg:bounce` | 「嘀」三角波，音高随 speed，20ms |
| `damage:applied`(crit) | 双层方波重音 |
| `combo:change` | 五声音阶阶梯上行（层数取模） |
| `reaction:trigger` | 元素专属短琶音 |
| `enemy:die` / `brick:break` | 噪声 burst + 低通扫频 |
| `fever:start` | 上行滑音 + 节拍开启 |
| `battle:win` / `battle:lose` | 3 音号角 / 下行半音 |
| BOSS 波（`battle:wave` 含 boss） | 低频鼓点循环 |

## 14. 变更记录

- v1.0（Round 1）：初版定稿。与既有锁定项（G1 测试、脚手架签名、O1/O3 在途命名）逐一核对：`predictTrajectory` 第 4 参为步数、蛋字段 `radius`、`world.eggs` 回收即移除、`resolveHit` 单调性与 `comboDelta===1`、`SAVE_KEY`、`createBus` 形状均保持不变。
