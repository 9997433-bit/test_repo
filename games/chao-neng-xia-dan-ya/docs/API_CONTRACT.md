# 超能下蛋鸭 · API 契约（v1.2）

- 所有者：Fable-1。读者：全体子代理。类型用 JSDoc 风格伪码表述，实现为原生 ESM JavaScript。
- **凡标「已锁定」= 现有代码/测试已固化，改动必须先过变更流程；其余为定稿接口，实现者按此落地。**
- v1.1 按实码修订四项（详见 §14）：§6.0 单一物理源、§9 `BONDS = SYNERGIES` 别名、§8.3 十八英雄权威表、§5 存档字段。
- v1.2（Round 3）：物理切换已落地——§6 全节按 `src/physics` + `core/sim.js` 适配层实码定稿，删除双物理过渡表述；新增 §6.4 游戏侧适配层契约（详见 §14）。

## 0. 契约变更流程

1. 只增不改：新增函数/事件/字段直接落地，并在本文件追加（PR 说明里标注段号）。
2. 破坏性变更（改签名、改事件 payload、改存档语义）：先在本文件改并在 §14 记录迁移说明，同轮通知受影响所有者，最后改代码与测试。
3. 事件命名：`域:动作`，全小写，连字符分词（如 `combo:change`、`fever:start`）。
4. 每个模块目录的 `index.js` 是唯一公共出口；本契约未列出的导出视为私有，随时可变。

## 1. 通用类型与枚举

```js
/** @typedef {{x:number, y:number}} Vec2 */
/** @typedef {null|'fire'|'ice'|'thunder'} Element */
//   data 层（heroes.element）用 null 表示无元素；combat 内部枚举用 'physical'
//   （ELEMENT.PHYSICAL），egg.element 缺省时按 physical 结算——两种「无元素」
//   写法由 combat 的 eggElement() 归一，UI 展示层可用 'none'。
/** @typedef {'combo'|'brute'|'elemental'|'collide'} School */
//   v1.1 定案：英雄表只有四流派（18 英雄 = 4/4/5/5）。'support' 是英雄的
//   role 标签（'dps'|'burst'|'aura'|'support'|'control'），不是 school；
//   HEROES 表不产出 support 流派。combat.SCHOOL.SUPPORT 与 data
//   BONDS.schools.support 仅作预留档位表 / 枚举完备（见 §9.1）。
/** @typedef {'chicken'|'duck'|'goose'|'bird'} Race */
//   data/heroes.js 权威写法为 'chicken'；combat.RACE 与 core/catalog 内部
//   用 'chick' 别名（RACE_ALIAS chicken→chick），新代码一律以 data 写法为准。
/** @typedef {'r'|'sr'|'ssr'} Rarity */
/** @typedef {'adventure'|'rogue'|'tower'|'raid'|'fishing'} ModeId */
/** @typedef {'minion'|'elite'|'boss'} EnemyTier */
```

角度约定：0 = 正下方，左负右正，钳制 `[-70°, +70°]`（`MAX_AIM_DEG = 70`）。物理层（`launchEgg/aimToVelocity/predictAim`）收**弧度**；游戏侧 `core/sim.js` 的 `aimVector(angleDeg, speed)` 与 UI 用**角度制**（见 §6.4）。蓄力 `power01 ∈ [0,1]` → 初速 `MIN_SPEED 220 + 500 × power01` px/s（`MAX_SPEED = 720`）。

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
| `egg:recycle` | `{eggId, reason:'out'|'sleep'|'expired'|'stalled'|'consumed'}`（v1.2：对齐物理与 sim 实码回收词汇，`'oob'` 作废） |

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
| `save:written` | `{save}`（保留名，暂未发出——实码 `writeSave` 不触总线，见 §5.1；启用前禁止占用此名） |
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

## 5. core/store —— 存档 schema `cnyd-save-v1`（v1.1 按实码重写）

### 5.1 API（`src/core/store.js`，O4；均已落地）

```js
SAVE_KEY = "cnyd-save-v1"                    // 已锁定
DEFAULT_ROSTER  // ["dash_duck","sun_bird","thunder_chick","heal_duck","guard_duck"]
STARTER_HEROES  // DEFAULT_ROSTER + ["pep_chick","mech_goose","ninja_goose"]，共 8 只
defaultSave() → Save                          // 已锁定（返回全量默认档，tests/store.test.js toEqual）
loadSave() → Save                             // 缺失/解析失败 → defaultSave()（已锁定）
writeSave(save) → save                        // 同步写 localStorage；实码不发总线事件（无 save:written）
normalizeSave(raw) → Save                     // settings/stats 浅合并；shards/heroLevels/heroStars/
                                              // stageStars/dex/owned/roster 类型校验回默认；
                                              // owned 回填 dex；未知字段【保留】（{...base,...raw}），
                                              // progression 扩展字段依赖此性质存活
resetSave() → Save                            // 删 key 并返回默认档
pref(save, key) → boolean                     // 「缺省即开启」读取：settings[key] !== false
```

### 5.2 Schema v1 全量（`defaultSave()` 基础字段，O4 所有；注释为约束）

```jsonc
{
  "version": 1,
  "gold": 260,                       // ≥0 整数；初始 260
  "shards":     { "<heroId>": 0 },   // 碎片，≥0 整数；初始 {}
  "heroLevels": { "<heroId>": 1 },   // 1..40（受星级等级上限约束）；初始 {}
  "heroStars":  { "<heroId>": 1 },   // 1..5；初始 {}
  "owned": ["dash_duck", "..."],     // 已解锁英雄；初始 = STARTER_HEROES（8 只）
  "roster": ["dash_duck", "sun_bird", "thunder_chick", "heal_duck", "guard_duck"],
                                     // 上场 5 只，长度恒 5，元素 ∈ owned
  "adventureStage": 1,               // 下一可打关 1..25（25 = 通关）
  "towerFloor": 1,                   // 下一层 1..31
  "bestRogueWave": 0,
  "bestRaidDamage": 0,
  "dex": { "<heroId>": true },       // 扁平英雄图鉴；初始 = STARTER_HEROES；owned 自动并入。
                                     // 【冻结】不得改成分类结构（progression/save.js 头注约定）
  "stageStars": { "<stageId>": 0 },  // 逐关最佳星级 0..3，stageId 如 "3-2"；初始 {}
  "fishBuff": null,                  // FishBuff|null：当前挂载的钓鱼 BUFF（老 HUD 读的镜像位）
  "fishBest": { "<zone>": 0 },       // 各海域最佳成绩；初始 {}
  "stats": { "battles": 0, "wins": 0, "eggs": 0, "bestCombo": 0 },
  "settings": { "shake": true, "reduceMotion": false }
                                     // 【冻结】恒两键（G1 toEqual 断言锁定）。
                                     // sfx/music/aimAssist 等一律走 pref() 缺省即开启，
                                     // 玩家改动后才写入；禁止扩 defaultSave() 快照
}
```

```js
/** @typedef {{kind:string, value:number, name:string, battles:number}} FishBuff
 *  实码形状（progression/save.js、ui/screens/fishing.js 一致）：
 *  battles = 剩余生效场次，结算后自减，≤0 清空。
 *  v1.0 的 {id, stat, value, battlesLeft} 作废。 */
```

### 5.3 养成扩展字段（`progression/save.js` 的 `ensureProgression(save)`，O3 所有；只增不覆盖）

```jsonc
{
  "progressionVersion": 1,
  "dexEntries": {                    // 扩展图鉴（heroes 仍在扁平 save.dex）
    "enemies":   { "<id>": 0 },      // 0 未见 / 1 已见(DEX_SEEN) / 2 已拥有(DEX_OWNED)
    "artifacts": { "<id>": 0 },
    "fish":      { "<id>": 0 }
  },
  "fishing": {                       // 多条 BUFF 的真身；最强一条镜像回 save.fishBuff
    "caught": { "<fishId>": 0 },     // 捕获计数，≥1 才保留
    "buffs": [],                     // FishBuff 列表
    "nextId": 1
  },
  "rogue": { "run": null }           // 肉鸽进行中 run（临时队与账号隔离）
}
```

约定：`ensureProgression` 原地补齐并夹紧越界值，**不改** §5.2 基础字段语义；新扩展字段一律进自己的命名空间（如 `fishing.*`），由 `writeSave` 整体序列化持久化。

兼容性注记（v1.1）：Round 1 的「O3 落地时 G1 需更新 settings 断言」已被 `pref()` 方案取代——`defaultSave()` 快照不再变化，G1 断言保持原样。

## 6. physics（`src/physics/index.js`）

### 6.0 单一物理源（v1.2 定稿：切换已完成，上位条款见 ARCHITECTURE §4.0）

- `src/physics/**`（O1）是**唯一权威积分器**；§6.1–§6.3 描述其真实导出面。
- `core/sim.js`（O4）是其**游戏侧适配层**（非积分器，自身零积分代码）：实体镜像、事件→命中钩子翻译、预步力、停滞回收，并承载发射台常量（`LAUNCH_X=240, LAUNCH_Y=92, NEST_Y=648, MAX_AIM_DEG=70, MIN_SPEED=220, MAX_SPEED=720, MAX_EGG_SPEED=1900`）。battle / ui / modes 对物理的一切访问经它进行（契约见 §6.4）。v1.1 的「冻结 / 对拍先行 / 退役 / 常量迁往 `src/data`」过渡条款全部作废。
- `core/adapters.js`（O4）只做能力探测与如实报告（`describeCaps`）；物理链路**无降级分支**，combat 仍是「上游可用则用、异常时内置兜底」。
- 铁律：预测虚线与实弹必须同一套积分与碰撞代码（实码：两者都只经 `advanceEgg` 推进，sim 预步力由 `prepareEgg` 双路共用）；任何目录禁止再出现第二套积分器。

### 6.1 常量（v1.2 按 `physics/index.js` 实际出口）

经 `index.js` 导出（外部可依赖）：

| 常量 | 值 | 说明 |
| --- | --- | --- |
| `WORLD_W` / `WORLD_H` | 480 / 800 | 已锁定 |
| `GRAVITY` | 1680 | px/s²，向下 |
| `FIXED_DT` | 1/120 | 已锁定（`tests/physics.test.js` 世界时钟采样） |
| `EGG_RADIUS` | 12 | 默认半径（合法域 10–14） |
| `EGG_RESTITUTION` | 0.85 | 默认弹性（GDD 域 0.78–0.92；物理夹取 0..1.4） |
| `MAX_SPEED` | 2600 | px/s 限速默认；游戏世界建为 1900（sim `MAX_EGG_SPEED` 覆盖） |
| `SLEEP_SPEED` / `SLEEP_TIME` | 8 / 0.6 | 睡眠判定（保护期 `SPAWN_GRACE = 0.2` 为内部值） |
| `MIN_CONTACT_IMPACT` | 24 | 低于此法向冲击只修正位置：不计反弹、不发事件 |
| `CONTACT_COOLDOWN` | 0.08 | 同蛋对同体重复命中的 `fresh` 冷却窗口 |
| `SPLIT_SPEED_SCALE` | 0.7 | 分裂蛋速度继承比例 |
| `PREDICT_MAX_BOUNCES` | 3 | 弹道预测默认反弹上限 |
| `MATERIAL` | 表 | wall/brick/peg/bumper/ramp/ice/rubber/enemy 材质预设 |

内部常量（未出 `index.js`，值仅供理解，**禁止外部依赖**）：`EGG_DRAG 0.02`、`EGG_FRICTION 0.06`、`MAX_SUBSTEPS 8`、`SUBSTEP_TRAVEL_RATIO 0.5`、`SPAWN_GRACE 0.2`、`OUT_MARGIN_BOTTOM/SIDE/TOP 20/64/240`（底部即 y > 820 回收，测试锁定）、`EGG_LIFETIME 24`、`RESTING_VELOCITY 42`、`SPLIT_SPREAD π/3`、`PORTAL_COOLDOWN 0.12`、`HIT_LOG_SIZE 8`、`GRID_CELL 48`、`MAX_EVENTS 512`、`PREDICT_MAX_STEPS 360`、`PREDICT_SAMPLE_EVERY 3`。

蛋 / 静态体的**数量硬上限（24 / 80）不是物理导出**：physics 不设限，上限是 battle 层（O4）的投放策略，超额静默不生成并记统计——v1.0 把 `MAX_EGGS/MAX_STATICS/KILL_Y` 列为 physics 冻结导出名系笔误，作废。

### 6.2 类型（v1.2 按实码重写）

```js
/** @typedef Egg —— 实码 createEgg(opts) 产物（字段名以此为准）
 *  id:string, kind:'egg', x,y,vx,vy:number,
 *  prevX,prevY:number,             // 渲染插值用，advanceEgg 每步开头快照
 *  r:number,                       // 半径。【v1.1 勘误】实码字段是 r，不是 radius
 *                                  //（normalizeEgg 兼容 radius 别名的鸭子类型蛋）
 *  mass,invMass:number, restitution:number(夹取 0..1.4), friction:number,
 *  drag:number, gravityScale:number,
 *  alive:boolean, sleeping:boolean, restTimer:number, age:number, lifetime:number,
 *  bounces:number,                 // 累计反弹（碰撞流读取）；另有 wallHits/pegHits/
 *                                  // brickHits/eggHits/portalUses 分类计数
 *  // —— 接触账本（v1.2 新增契约，一律在 reflect 之前落账）——
 *  contacts:number, enemyContacts:number,
 *  firstContact:Contact|null, firstEnemyContact:Contact|null, lastContact:Contact|null,
 *  hitLog:Array<{id,time}>,        // 最近命中记录（定长 8），供 fresh 冷却判定
 *  splitsLeft:number,              // 分裂预算（splitEgg 消耗，≤0 不再分裂）
 *  pierce:number,                  // 剩余穿透：>0 时穿过可碎体不反弹
 *  power:number,                   // 战斗层伤害载荷，物理只透传（见 §7.2）
 *  element:Element, team:'player'|'enemy', heroId:string|null,
 *  generation:number,              // 0 主蛋，分裂 +1
 *  tags:object, data:any, angle:number, spin:number, portalCooldown:number
 */

/** @typedef Contact —— noteContact 快照（reflect 之前的入射帧）
 *  seq, eggId, bodyId, kind, team, enemy:boolean,
 *  x,y:number,                     // 接触点（碰撞盒表面）
 *  nx,ny:number, depth:number,     // 出射法线（指向把蛋推离物体的方向）
 *  ex,ey:number, vx,vy,speed:number,  // 蛋心与入射速度（reflect 前）
 *  impact:number,                  // 法向接近速度；分离中为负
 *  time, step, fresh:boolean, pierced:boolean, ghost:boolean
 *  // 命中判定契约：反弹会把蛋推出碰撞盒，事后重叠检测必然 miss——
 *  // 「打没打中」一律读 egg.enemyContacts / firstEnemyContact 或 contact 事件
 */

/** @typedef StaticBody —— 与 O1 工厂字段一致
 *  id:string,
 *  shape:'segment'|'circle'|'aabb',
 *  kind:'wall'|'ramp'|'brick'|'peg'|'bumper'|'ice'|'rubber'|'portal'|'enemy'|…,
 *  active:boolean, sensor:boolean,  // sensor 只发事件不反弹
 *  restitution:number, friction:number,   // 缺省取 MATERIAL[kind]
 *  breakable:boolean, hp:number, maxHp:number,
 *  explosive:boolean, blastRadius:number, blastPower:number,   // 炸弹砖
 *  element:Element|null, team:'neutral'|'enemy',
 *  tags:object, data:any,          // data 反向指回游戏实体（sim 层约定）
 *  hits:number, lastHitTime:number,
 *  aabb:{minX,minY,maxX,maxY},     // 缓存包围盒；移动用 moveBody，或改坐标后调 computeAABB
 *  // shape==='segment': x1,y1,x2,y2, halfThickness(半厚——v1.2 勘误：非 radius),
 *  //                    oneWay, nx,ny, length, angle
 *  // shape==='circle':  x,y,r（bumper 另有 boost：命中沿法线附加速度）
 *  // shape==='aabb':    x,y(中心), hw,hh, w,h（工厂可收 anchor:'topleft'，构造期转换一次）
 *  // kind==='portal'：sensor 圆，link(另一端 id), facing(朝向|null), exitSpeed(出口保底速度)
 *  // 敌人 = kind:'enemy' 的 AABB（v1.2 勘误：非 circle），经 body.data 关联战斗实体
 */

/** @typedef Field —— 不参与碰撞，积分前贡献加速度/阻尼；判别字段 type（v1.2 勘误：非 kind）
 *  { id, type:'fan',  x,y,w,h,hw,hh, angle, power, ax,ay, falloff }  // 区域恒定加速度，
 *                                        // falloff∈[0,1] 沿风向线性衰减
 *  { id, type:'wind', ax,ay }            // 全图恒定风
 *  { id, type:'gravity', x,y,w,h,hw,hh, gravity }   // 区域内覆盖世界重力
 *  { id, type:'slow', x,y,w,h,hw,hh, keep }         // 区域内额外阻尼（每秒保留比例）
 *  // 磁铁('magnet')未实现：追踪转向是 sim 层预步力（egg.homing），不是物理力场
 */

/** @typedef PhysicsEvent —— world.events 元素；emit 统一盖 time/step 戳；
 *  缓冲上限 512 丢最旧；用 drainEvents(world) 取走并清空。
 *  事件携带对象引用（egg/body），不是裸 id（v1.2 勘误 v1.0 形状）：
 *  {type:'spawn',   egg, x, y}
 *  {type:'contact', egg, body, contact:Contact}      // reflect 前的接触账本
 *  {type:'bounce',  egg, body|null, surface, x, y, nx, ny, impact}  // body=null 为解析式边界
 *  {type:'pierce',  egg, body, surface, x, y, nx, ny, impact}
 *  {type:'sensor',  egg, body, x, y}
 *  {type:'portal',  egg, body, to, fromX, fromY, x, y}
 *  {type:'eggHit',  egg, other, x, y, nx, ny, impact}
 *  {type:'break',   body, x, y, source}              // damageStatic 打碎
 *  {type:'split',   egg, children, x, y}
 *  {type:'explode', x, y, radius, power, source, eggs, statics, destroyed}
 *  {type:'recycle', egg, reason:'out'|'sleep'|'expired'|'consumed'|'split'|…}
 *  // v1.0 的 'egg-egg'/'sleep' 事件名与 'oob' 回收 reason 作废
 */

/** @typedef World —— createWorld(opts) 产物
 *  { eggs:Egg[], statics:StaticBody[], fields:Field[], time:number,  // 脚手架契约字段
 *    dt:number(1/120), gravity:number, maxSpeed:number,
 *    bounds:{left,top,right,bottom},
 *    boundsMode:{left,right,top:'bounce', bottom:'open'},  // 边界解析式处理，底部开放回收
 *    wallRestitution:number, wallFriction:number,
 *    stepIndex:number, accumulator:number,
 *    events:PhysicsEvent[], pendingBlasts:Blast[],
 *    stats:{bounces,wallHits,pegHits,brickHits,eggHits,portalUses,breaks,recycled,spawned},
 *    launch:{x,y},                  // 发射台（sim 层覆盖为 240,92）
 *    contactSeq:number, contactCooldown:number,
 *    seed:number, rngState:number } // 世界内建确定性随机（nextRandom）
 *  // eggs 只含活跃蛋；回收即移除（已锁定）。statics 只放关卡自定义体，
 *  // 左右墙/顶板由 bounds 解析式反弹（addArenaWalls 可改显式线段）。
 *  // 预测零副作用以 structuredClone 深比较锁定（tests/physics.test.js）。
 */
```

### 6.3 函数（v1.2 按 `src/physics/index.js` 实码导出面）

```js
// 世界与步进（已锁定：createWorld 空数组 + time 0；stepWorld 每调恰推进一步）
createWorld(opts?) → World       // opts: gravity/dt/seed/maxSpeed/bounds/boundsMode/
                                 //       statics/fields/walls
stepWorld(world, dt = world.dt ?? FIXED_DT) → world
advanceWorld(world, elapsed, maxSteps = 8) → {steps, alpha}   // 变帧累积驱动，alpha 供插值
resetWorld(world) → world                      // 清空到空场（保留参数与种子）
drainEvents(world) → PhysicsEvent[]            // 取走并清空事件缓冲（上限 512，溢出丢最旧）
drainBlasts(world) → Blast[]                   // 取走待结算爆炸
isSettled(world) → boolean                     // 全蛋回收（回合推进判据）
activeEggCount(world) → number
emit(world, event) → event                     // 入队并盖 time/step 戳
nextRandom(world) → [0,1)                      // 世界内建确定性随机（rngState 推进）

// 蛋
createEgg(opts) → Egg / normalizeEgg(egg)      // 见 §6.2；鸭子类型补齐，兼容 radius 别名
spawnEgg(world, opts|egg) → Egg                // 入场并发 spawn 事件；数量上限归 battle 层
launchEgg(world, {aim, speed, x?, y?, ...}) → Egg   // aim 弧度 0=正下；speed 220–720
aimToVelocity(aim, speed, out?) → Vec2         // UI 预览与发射共用（弧度）
recycleEgg(world, egg, reason='consumed')
renderPosition(egg, alpha, out?) → Vec2        // prev↔now 渲染插值
resetEggIds() / resetEggContacts(egg) / lastHitTimeOf(egg, bodyId) → time|-1

// 步进内核（sim 适配层 / 测试用接缝；普通调用方走 stepWorld 即可）
advanceEgg(world, egg, dt, ctx) → hits     // 兜底→prev 快照→stepEgg；
                                           // stepWorld 与预测的唯一共同推进点（同源保证）
stepEgg(world, egg, dt, ctx) → hits        // 子步 CCD + 碰撞
createStepContext(emit?) / resetStepContext(ctx, time?)   // ghost 上下文（预测用）
noteContact(world, egg, body, manifold, ctx, pierced?) → Contact|null
//  接触账本：必须在 reflect / 位置修正之前调用（命中判定契约，见 §6.2 Contact）

// 静态体与力场
addStatic(world, body|body[]) / removeStatic(world, body|id) / getStatic(world, id)
damageStatic(world, body, amount, ctx?) → {destroyed, hp, body}
//  物理只管生死与拓扑；破碎发 break 事件、炸弹砖爆炸入 pendingBlasts
markStaticsDirty(world) / syncStatics(world)
addField(world, field|field[]) / removeField(world, field)
addArenaWalls(world, opts?)                // 边界改显式线段，对应解析边转 open

// 工厂（shapes）
makeWall / makeSegment / makeRamp / makeBrick / makeBrickField / makeBombBrick
makePeg / makePegGrid / makeBumper / makeIce / makePortalPair / makeEnemy
makeFan / makeWind / makeSlowField / makeGravityField
moveBody(body, x, y, anchor?) → boolean    // 敌人漂移/下压用，内部重算 AABB
normalizeBody(body) / computeAABB(body) / resetBodyIds()
fieldContains(field, x, y) / isEnemyBody(body)

// 查询与范围结算
queryCircle / queryAABB / nearestEgg / bodyCenter / distanceToBody
overlapCircleBody / enemiesOverlapping / eggEnemyOverlaps / enemyBodies
//  注意：eggEnemyOverlaps 只答「当前几何重叠」；「打没打中」读接触账本（§6.2）
explode(world, {x, y, radius, power, damage?, falloff?, ...}) → {eggs, statics, destroyed}
resolveBlasts(world, opts?) → results[]    // 炸弹砖连锁统一展开（防深递归）
splitEgg(world, egg, {count=2, spread=π/3, speedScale=0.7, radiusScale=0.8,
                      powerScale=0.6, minSpeed=120, jitter?, consume?, force?}) → Egg[]
//  分裂预算走 egg.splitsLeft（force 可越过）；子蛋 generation+1；散布抖动走
//  nextRandom(world)——v1.1「由调用方传 rng」作废（v1.2 勘误）

// 弹道预测（纯函数零副作用：structuredClone 深比较已锁定；与实弹共用 advanceEgg）
predictTrajectory(origin:Vec2, velocity:Vec2, world, optsOrSteps?) → Array<{x,y}>
//  第 4 参两种形态（实码 normalizeArgs）：
//  · number = steps：逐步采样，空世界恰返回 steps 个（测试锁定）
//  · object：{ maxSteps=360, maxBounces=3, sampleEvery=3, includeOrigin=true,
//              stopOnEnemy?, dt?, r?, restitution?, friction?, drag?, pierce? }
predictTrajectoryDetailed(origin, velocity, world, opts?) →
  { points, bouncePoints, bounces, steps, duration, end,
    reason:'bounces'|'out'|'steps'|'enemy'|'empty',
    contacts, contactCount, enemyContacts, hitsEnemy,
    firstHit, firstEnemyHit, impact }      // 命中点 = reflect 前的接触账本
predictAim(world, aim, speed, opts?)       // 发射台语义的便捷封装（弧度）

// 对拍与桥接（O1 回归工具，compat.js）
createSimBridge(simWorld, opts?) / compareTrajectories / normalizePoints / toSimPrediction

// 碰撞与数学（供 sim / 关卡 / 测试复用）
circleVsSegment / circleVsAABB / circleVsCircle / collideCircleBody / createManifold
resolveStaticContact / resolveEggPair
TAU / clamp / closestPointOnSegment / distance / lerp / mulberry32 / normalizeAngle / reflect
```

### 6.4 游戏侧适配层 `core/sim.js`（O4；v1.2 新增——battle / ui 消费物理的唯一入口）

自身零积分代码（全部 import 自 `physics/index.js`），对战斗与渲染提供游戏语义：

```js
// 常量（定居于此，O4 所有；v1.1「迁往 src/data」方案作废）
LAUNCH_X = 240 (WORLD_W/2), LAUNCH_Y = 92, NEST_Y = 648
MAX_AIM_DEG = 70, MIN_SPEED = 220, MAX_SPEED = 720
MAX_EGG_SPEED = 1900               // 游戏世界飞行限速（覆盖物理默认 2600）
FIXED_DT / GRAVITY / WORLD_W / WORLD_H     // physics 再导出

createWorld(opts?) → GameWorld     // physics 世界 + 游戏实体视图：
//  pegs/bricks/enemies/slopes/fans/ice/portals + nestY——渲染与战斗读实体；
//  物理体挂在实体 ._body 上、body.data 反向指回实体（syncStage 派生）
syncStage(world)                   // 实体增删改 → 物理体镜像（每固定步自动调用）
makeEgg(opts) → Egg                // 物理蛋 + 战斗层字段（owner/palette/damageMul/growth/
                                   // homing/splitBudget/splitOnHit/crit/…）
aimVector(angleDeg, speed) → {vx, vy}      // 注意：角度制（physics.aimToVelocity 是弧度）
aimFromDrag(dx, dy) → {angle, power, speed}   // 拖拽位移 → 瞄准参数
stepWorld(world, dtFrame, hooks) → world
//  按 1/120 累积固定步（≤8/帧；场上无蛋清零余量），每步：syncStage → 预步力
//  （冰面阻力 0.02→0.006、追踪转向——实弹与预测共用）→ physics.stepWorld →
//  停滞回收（|v|<45px/s 持续 0.6s）→ 事件翻译成命中钩子：
//  hooks = { onWall(egg, side), onSlope(egg, slope, ev), onPeg(egg, peg, ev),
//            onBrick(egg, brick, ev),
//            onEnemy(egg, enemy, ev),     // 同蛋对同敌 0.08s 去重
//            onPortal(egg, portal), onRecycle(egg, reason) }
predictTrajectory(origin, velocity, world, opts?) →
  { points:[[x,y]], bounces, hitsEnemy, impact:[x,y]|null, target }
//  幽灵蛋走 physics.stepEgg + 同一份预步力；跑完还原事件/统计/命中计数，对外零副作用
nextId() → number                  // 游戏实体自增 id
```

关卡单向传送门语义：sim 把出口端 `kind` 降级为 `portalExit`（纯出口，不再回传）。

## 7. combat（`src/combat/index.js`）

### 7.1 主函数（签名已锁定；返回形状 v1.1 按实码修订）

```js
resolveHit(egg, target, ctx = {}) → HitResult   // 纯函数，不改任何入参
```

```js
/** @typedef HitContext（ctx，全字段可选，实码 resolve.js）
 *  now?:number, combo?:number=0, burstUntil?:number,
 *  bonds?:{mods}|BondsActive,      // computeBonds 结果或已合并 mods
 *  team?:Array, mods?:object,      // 追加修正表（光环/神器聚合）
 *  buffs?:Buff[],                  // 钓鱼/道具/爆蛋窗口 BUFF
 *  auras?, statuses?, hero?, caster?, seed?, rng?, hitIndex?, hitPoint?:Vec2
 */

/** @typedef HitResult —— 实码返回（tests/combat.test.js 锁定其中的行为断言）
 *  damage:number,                  // 有效命中 ≥1 整数（正值下限 1）；对 power 与 combo
 *                                  // 单调不减（已锁定）；power===0 / 目标无敌 / 已死 → 0
 *  effects:Effect[],               // 声明式效果（element/status/explosion/chain/heal/…），
 *                                  // battle 是唯一应用点
 *  comboDelta:number,              // 【v1.1 修正，v1.0「恒 1」作废】常规 1；连击流主蛋 2
 *                                  // （SCHOOL_MODIFIER.combo.comboGain）；无敌/已死 0
 *  events:object[],                // hit/crit/kill/blocked/shield_absorb 等纯数据事件
 *  crit:boolean, element:string,   // element 归一后含 'physical'
 *  reaction:string|null,           // vaporize|superconduct|overload
 *  saturated:string|null,          // 同元素 3 层饱和（burn|freeze|shock）
 *  combo:number, comboBefore:number, burst:boolean,
 *  killed:boolean, hpAfter:number, absorbed:number, overkill:number,
 *  breakdown:object|null           // computeDamage 逐段拆解（HUD/单测用）
 */
```

### 7.2 伤害公式（系数落 `data/constants`，F3 可调；结构冻结）

```
egg.power = heroAtk(level,star) × (0.8 + 0.4×power01) × 0.7^generation
            × teamAtkMul × (1 + dexBonus)          ← 发射时由 battle 算好
damage（实码 computeDamage 段序，breakdown 逐段可断言）：
  (base × schoolMult × atkMult + flat)
  × comboMult × collisionMult × reactionMult × burstMult × globalMult
  × critMult(命中暴击时)                            // 基准 1.6 + critDmg + 连击层暴伤
  × vulnerability(冻结等易伤)
  × armorMitigation = 100/(100+armor×(1−shred))     // ARMOR_K = 100
  × (1 − resist[element])                           // resist 夹取 [−0.5, 0.9]
  → value > 0 ? Math.max(1, round(value)) : 0       // 正值下限 1；非正值出 0
edge（实码，Round 2 已收紧）：egg.power **字段缺失**时 baseAttack 依次兜底
  egg.damage / egg.atk / ctx.hero.atk / ctx.caster.atk，最终 DEFAULT_EGG_POWER = 10
  （已锁定）；显式 power ≤ 0 按 0 结算 ⇒ **power === 0 → damage === 0 已实现**，
  tests/combat.test.js 对应 describe.skip 只欠 G1 摘除。
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

v1.1 注：实码的触发词汇表是 `heroes/constants.js` 的 `TRIGGERS`
（`onBattleStart/onLaunch/onHit/onBrickBreak/onPegHit/onKill/onCombo/onEggRecycled/onTurnEnd/onUltimate/aura`）。
下表为 v1.0 hook 语义，对应关系：`modifyShot/onShotFired → onLaunch`、`onEggContact → onPegHit/onBrickBreak`、
`onHitResolved → onHit`。括号中的示例英雄以 §8.3 十八英雄表为准（倒霉鸭 / 云朵雀已进预留，不再作示例）。

```js
/** @typedef HeroHooks
 *  aura?(team) → Partial<TeamModifiers>       // 开战算一次（战鼓鸡/优雅鹅/帝企鹅）
 *  modifyShot?(shot, api) → shot              // 改发射参数/蛋规格（齿轮鹅/冲鸭）
 *  onShotFired?(shot, api)
 *  onEggContact?(evt:PhysicsEvent, api)       // 每次反弹（鲨齿雕/鹿角鸡）
 *  onHitResolved?(evt:{eggId,targetId,result}, api)   // 手里剑鹅追加蛋
 *  onEggRecycled?(evt, api)                   // 治愈鸭
 *  onTurnEnd?(api)                            // 天堂鸟补雷
 *  onBattleStart?(api)                        // 元气鸡额外蛋
 *  onUltimate(api)                            // Q 技能；有大招英雄必须实现
 */

/** @typedef HeroApi —— battle 注入的能力面（拿不到 world/battle 引用）
 *  spawnEgg(spec) → eggId|null                // 受 MAX_EGGS 约束
 *  dealDamage(targetId, {amount, element})    // 走 resolveHit 同款减免
 *  applyElement(targetId, element, stacks)
 *  healPlayer(ratio) / addShield(count)
 *  grantEnergy(who:'self'|'others'|'all'|heroId, amount)
 *  addTurnModifier({dmgMul?, critChance?})    // 本回合有效
 *  freezeCombo(seconds)                       // 连击衰减冻结（预留英雄 lark 用，接口保留）
 *  query: { enemies() → EnemyView[], bricks() → BrickView[],
 *           combo() → number, time() → number }   // 均为只读快照
 *  rng() → number
 *  emit(type, payload)                        // 白名单：fx:* 与 hero:* 事件
 */
```

### 8.3 十八英雄权威表（v1.1；数据源 `data/heroes.js` + `data/skills.js`，F3 所有）

**这是全仓唯一英雄口径**：18 只上场 + 2 只预留。v1.0 的 20 只表及其 skill id
（`dark_slash/encore_energy/heavy_gear/extra_egg/storm_finale/deep_freeze/feed_frenzy/waltz_slow` 等旧名）作废；
`heroes/skills.js` 的 `SKILL_ALIASES` 负责把历史别名映射到实 id，新代码禁止再写旧名。

| heroId | 名字 | race | school | rarity | element | skill（trigger） | 主动大招 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `dash_duck` | 冲鸭 | duck | combo | r | — | `dash_crit`（onFire） | golden_smash |
| `ninja_goose` | 手里剑鹅 | goose | combo | sr | — | `shuriken_split`（onHit） | golden_smash |
| `fallen_crow` | 堕羽鸦 | bird | combo | ssr | — | `dusk_slash`（active·100） | dusk_slash |
| `dandy_pigeon` | 小帅鸽 | bird | combo | sr | — | `encore_wing`（active·90） | encore_wing |
| `sun_bird` | 日轮鸟 | bird | brute | ssr | fire | `solar_burn`（onHit） | golden_smash |
| `mech_goose` | 齿轮鹅 | goose | brute | sr | — | `gear_egg`（onFire） | golden_smash |
| `drum_chick` | 战鼓鸡 | chicken | brute | r | — | `war_drum`（aura） | golden_smash |
| `pep_chick` | 元气鸡 | chicken | brute | r | — | `pep_start`（onBattleStart） | golden_smash |
| `thunder_chick` | 雷神鸡 | chicken | elemental | sr | thunder | `shock_bounce`（onHit） | golden_smash |
| `hiphop_duck` | 嘻哈鸭 | duck | elemental | r | thunder | `chain_groove`（onHit） | golden_smash |
| `bird_of_paradise` | 天堂鸟 | bird | elemental | sr | thunder | `afterglow_bolt`（onTurnEnd） | golden_smash |
| `ice_phoenix` | 冰凤 | bird | elemental | ssr | ice | `blizzard`（active·120） | blizzard |
| `emperor_penguin` | 帝企鹅 | bird | elemental | sr | ice | `glacier_march`（aura） | golden_smash |
| `shark_eagle` | 鲨齿雕 | bird | collide | ssr | — | `feeding_frenzy`（onCollide） | golden_smash |
| `deer_chick` | 鹿角鸡 | chicken | collide | sr | — | `antler_split`（onCollide） | golden_smash |
| `heal_duck` | 治愈鸭 | duck | collide | r | — | `yolk_heal`（onRecall） | golden_smash |
| `guard_duck` | 守护鸭 | duck | collide | r | — | `shell_guard`（active·80） | shell_guard |
| `grace_goose` | 优雅鹅 | goose | collide | r | ice | `grace_waltz`（aura） | golden_smash |

- 口径校验（与 `data/synergies.js` 头注一致）：流派 4/4/5/5；种族 鸡 4 / 鸭 4 / 鹅 3 / 鸟 7。
- `golden_smash`（active·100）为通用大招：被动型英雄的默认 Q（`data/skills.js`，owner: null）。
- **预留**：`RESERVED_HERO_IDS = ["lark", "unlucky_duck"]`（云朵雀 / 倒霉鸭）——不进 `HEROES` 表、不上场、不进图鉴统计；扩表 = F3 移入 HEROES 并走 §0 变更流程。
- `HeroDef` 实码字段：`id/name/race/school/role/rarity/element/atk/energy/skill/ult/starPerks[4]/palette/desc`（`role ∈ dps|burst|aura|support|control` 仅 UI 展示）。等级成长不在 HeroDef（无 `atkGrowth` 字段），走 `data/progression.js` 的 `LEVEL_CURVE`；每星 +8% 攻见 `STAR_RULES`。
- 表键 === `hero.id`、id 唯一非空由 `tests/heroes.test.js` 锁定；「18 英雄全员到齐」测试已解锁。

## 9. data（`src/data/index.js`，F3 所有）—— 表 schema（v1.1 按实码重写）

`data` 只导出常量、零逻辑；`data/index.js` 只做 re-export。实码导出总表：

```js
// data/index.js（唯一出口；DATA_VERSION = 1）
export { HEROES, HERO_LIST, RESERVED_HERO_IDS } from "./heroes.js";      // §8.3 权威表
export { SKILLS, SKILL_LIST } from "./skills.js";                        // 19 技能静态表
export { SCHOOLS, SYNERGIES, RACES, RACE_TECH, BONDS, BOND_TABLE } from "./synergies.js";
                                              // ★ v1.1：BONDS 别名已落地（见 §9.1）
export { ENEMIES, ELITE_MODS, BOSSES, BOSS_LIST } from "./enemies.js";
export { CHAPTERS, STAGES, CHAPTER_SCALING, LAYOUT_FEATURES } from "./stages.js";
export { ARTIFACTS, ROGUE_RULES, ROGUE_WAVE_SCALING, ROGUE_WAVE_BANDS } from "./artifacts.js";
export { TOWER_FLOORS, TOWER_RULES } from "./tower.js";
export { RAID } from "./raid.js";
export { FISHING_SEAS, FISHING_RULES } from "./fishing.js";
export { LEVEL_CURVE, LEVEL_BAND_BONUSES, STAR_RULES, DEX_MILESTONES } from "./progression.js";
export { BATTLE_ITEMS, ITEM_RULES } from "./items.js";
export { ELEMENTS, REACTIONS, SAME_ELEMENT } from "./elements.js";
export { BALANCE } from "./balance.js";
```

### 9.1 羁绊：`BONDS` = `SYNERGIES` 的战斗投影别名（v1.1 核心修订，已落地，消灭「数据契约分裂」）

```js
// synergies.js —— 羁绊唯一数值源（同文件两张同源表 + 一个等价别名，F3 维护）

/** SYNERGIES = { [school]: SynergyDef } —— 设计语汇原始表
 *  school ∈ 'combo'|'brute'|'elemental'|'collide'
 *  @typedef SynergyDef
 *   school:School,
 *   tiers: [                          // 恒 3 档，按人数 2/3/4 升序
 *     { count:2, name, desc, mod },   // 小羁绊
 *     { count:3, name, desc, mod },   // 大羁绊
 *     { count:4, name, desc, mod },   // 禽王光环·X
 *   ]
 *   // mod 用设计键（synergies.js 头注释）：teamAtkPct、eggBurstMult、
 *   // stacksToProc、dmgPerBouncePct、autoEnchantFirstEgg(布尔)…
 */

/** BONDS = { schools, races } —— combat 消费的战斗投影（与 SYNERGIES 同源同文件）
 *  schools[school].tiers[i] / races[race].tiers[i]，i = 0/1/2 对应 2/3/4 人档；
 *  每档 { count, name, desc, mods }，mods 只用 combat MOD_SPEC 词汇，
 *  档位不累计（高档 mods 已折叠低档效果）；
 *  schools 额外含 support 预留流派（18 只无人携带，仅保证枚举完备）；
 *  races 里 chicken/chick 双键指同一对象（容两种 race 口径）；
 *  与 SYNERGIES 冲突时以 BONDS 为战斗事实源。
 */

/** BOND_TABLE = BONDS —— 等价别名，供历史读取链（DATA.BONDS ?? DATA.BOND_TABLE）。 */
```

消费契约（实码已闭环）：

1. `data/index.js` re-export `SYNERGIES / BONDS / BOND_TABLE`（已落地）；**禁止**在 `src/data` 之外再出现流派数值表当数据源，改数只准改 `data/synergies.js`。
2. `combat/bonds.js`（O2）：主读 `SYNERGIES`，经 `synergyBondTable()` + `translateSynergyMod`（`SYNERGY_MOD_MAP`）把设计键显式翻成 `{mods, flags, raw}`——能进战斗管线的数值键 → MOD_SPEC `mods`；布尔开关 → `flags`；物理/经济域键 → `raw` 由对应层自取。数据第 3 档已是「禽王光环·X」（`crownIncluded`），不再叠通用 `CROWN_AURA`。历史键 `DATA.BONDS/BOND_TABLE` 用计算属性访问（打包器不再报缺失导出警告）。种族场上羁绊读 `BONDS.races`。
3. 内置兜底表（combat 的 `DEFAULT_SCHOOL_BONDS/DEFAULT_RACE_BONDS`、heroes 的内置常量）只在 data 表缺失时生效（打底合并可补 data 没有的 support），**不得对外充当数值源**；`heroes/squad.js` 的 `buildBonds()` 主读 `BONDS.schools`（回退 `SYNERGIES`）。
4. `RACE_TECH` 是图鉴科技（按 `save.dex` 已拥有数激活：鸡 4 / 鸭 4 / 鹅 3 / 鸟 5，肉鸽隔离），与场上人数种族羁绊（`BONDS.races`）是两个系统，不可混淆。
5. v1.0 的 `data/bonds.js` 文件与 `{2:…,3:…,4:…}` 档位对象形状作废。

### 9.2 其余表 schema（形状冻结，数值 F3 全权调优）

```js
// heroes.js —— HeroDef 见 §8.3（已锁定导出名 HEROES / HERO_LIST；表键 === hero.id）

// skills.js
/** @typedef SkillDef
 *  id, name, desc, owner:heroId|null,
 *  trigger:'active'|'onFire'|'onHit'|'onCollide'|'onTurnEnd'|'onRecall'|'onBattleStart'|'aura',
 *  energyCost?:number,               // 仅 active
 *  params:object                     // 数值参数；starPerks[].mod 覆盖同名键
 */

// stages.js
/** @typedef StageDef
 *  id:'1-1'..'6-4', chapter:1..6, index:1..4, name, theme,
 *  layout:LayoutItem[],               // {make:'brick'|'peg'|'ramp'|…, ...工厂参数}
 *  waves:Array<{enemies:Array<{id, x, y}>}>,   // 1..3 波，同屏 ≤12
 *  boss?:enemyId,                     // index===4 必填
 *  rewards:{gold, shards?:{heroId:n}},
 *  par:{time:number, hpRatio:number}  // 三星判定参数
 */

// enemies.js
/** @typedef EnemyDef
 *  id, name, tier:EnemyTier, hp, armor,
 *  resist:{fire, ice, thunder},       // combat 夹取 [-0.5, 0.9]
 *  radius, touchDamage,
 *  behavior:'idle'|'patrol'|'sink'|'shield'|'heal'|'summon'
 *           |'boss_fryer'|'boss_statue'|'boss_incubator',
 *  actions?:object                    // behavior 参数（BOSS 行动表）
 */

// artifacts.js（肉鸽神器）
/** @typedef ArtifactDef {id, name, rarity, desc, mods} */
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
- v1.1（Round 2，按实码修订，Fable-1）：
  1. **§6.0 单一物理源**：`src/physics` 定为唯一权威积分器，`core/sim.js` 冻结并给出退役路线（对拍 → adapters 切换 → 常量迁移 → 删除）；§6.1/§6.2/§6.3 全部按 `src/physics` 实码导出面重写。**破坏性勘误**：蛋半径字段实为 `r`（v1.0 的 `radius` 声明作废）；`MAX_EGGS/MAX_STATICS/KILL_Y` 不是 physics 导出（上限是 battle 层策略）；`predictTrajectory` 第 4 参扩展为 `number|options` 双形态（数字形态语义不变，仍与既有测试兼容）。
  2. **§9.1 BONDS = SYNERGIES 投影别名（已落地）**：羁绊唯一数值源收敛到 `data/synergies.js`——`SYNERGIES`（设计语汇，school 直键、`tiers[{count,name,desc,mod}]`）+ `BONDS`（combat 投影 `{schools, races}`、MOD_SPEC 词汇、含 support 预留与 chicken/chick 双键）+ `BOND_TABLE = BONDS`，三者经 `data/index.js` re-export；`combat/bonds.js` 主读 SYNERGIES 经 `translateSynergyMod` 翻译（build 缺失导出警告消除），`heroes/squad.js` 主读 `BONDS.schools`；内置兜底表降级为缺表 fallback。v1.0 `data/bonds.js` 文件与 `{2,3,4}` 档位对象形状作废。受影响所有者：F3（synergies.js 双表）、O2（读取翻译链）、O3（squad 数值吃 data 表）。
  3. **§8.3 十八英雄权威表**：18 只（4/4/5/5）+ `RESERVED_HERO_IDS = ["lark","unlucky_duck"]`；v1.0 的 20 只表与旧 skill id 作废，历史别名由 `heroes/skills.js` `SKILL_ALIASES` 容错；§1 枚举同步修订（School 四流派、Race 权威写法 `chicken`、Rarity `r|sr|ssr`、Element data 层用 `null` / combat 层用 `physical`）。
  4. **§5 存档字段**：schema 按 `core/store.js` + `progression/save.js` 实码重写——settings 恒双键 + `pref()` 缺省即开启；`FishBuff = {kind,value,name,battles}`（v1.0 `BattleBuff` 形状作废）；新增 §5.3 养成扩展命名空间（`progressionVersion/dexEntries/fishing/rogue`）；`writeSave` 不发总线事件；`normalizeSave` 保留未知字段（非「丢弃」）。
  5. **§7 战斗**：`HitResult` 按实码补全（`comboDelta` 恒 1 作废：1 / 连击流 2 / 无效目标 0；正伤害下限 1）；伤害公式改为 `computeDamage` 实码段序；`power===0 → damage===0` **已实现**（O2 Round 2 收紧），对应 skip 测试待 G1 摘除。
- v1.2（Round 3，双物理表述定稿，Fable-1）：
  1. **§6.0 单一物理源已落地**：战斗全链路切到 `src/physics`（Round 2 O4 合入，预测/实弹 9308 采样点误差 0）；`core/sim.js` 重铸为其**游戏侧适配层**（零积分代码，实体镜像 + 事件翻译 + 预步力 + 停滞回收）；v1.1 的「冻结 / 对拍先行 / 退役路线 / 发射台常量迁往 `src/data`」过渡条款全部作废——发射台常量定居 `core/sim.js`（O4 所有）。新增 **§6.4** 记录适配层契约（游戏形态 `createWorld/syncStage/makeEgg/aimVector(角度制)/aimFromDrag/stepWorld(world,dt,hooks)/predictTrajectory`、命中钩子词汇表、`MAX_EGG_SPEED = 1900`）。
  2. **§6.1–§6.3 按实码导出面重写**：常量表对齐 `physics/index.js` 实际出口（内部常量单列，禁止外部依赖）；新增**接触账本契约**（`noteContact` 在 reflect 之前落账、`Contact` 快照 typedef、`firstEnemyHit` 命中判定——事后重叠检测必然 miss）；事件词汇更新为 `spawn/contact/bounce/pierce/sensor/portal/eggHit/break/split/explode/recycle`，事件携带对象引用并盖 `time/step` 戳（v1.0 `egg-egg`/`sleep` 事件与 `'oob'` 回收 reason 作废）；导出面新增 `advanceEgg/stepEgg/createStepContext/renderPosition/nextRandom/makeEnemy/moveBody/eggEnemyOverlaps/compat 对拍工具/碰撞与数学原语`。
  3. **破坏性勘误**（v1.2）：敌人碰撞盒为 `kind:'enemy'` 的 **AABB**（v1.1 的 circle 作废）；segment 半厚字段为 `halfThickness`（非 `radius`）；`Field` 判别字段为 `type`（`fan/wind/gravity/slow`，磁铁未实现——追踪是 sim 预步力）；NaN/非有限蛋**就地修复不回收**（v1.1「按 oob 回收」作废，`tests/physics.test.js` 锁定）；`splitEgg` 散布走 `nextRandom(world)` 且分裂预算走 `egg.splitsLeft`（「调用方传 rng」「generation 上限 2 停止分裂」作废）；世界内建确定性随机（`seed/rngState`）。
  4. 其余章节（§5 存档、§7 战斗、§8 英雄、§9 数据、§10–§13）沿用 v1.1，本轮未变更。
