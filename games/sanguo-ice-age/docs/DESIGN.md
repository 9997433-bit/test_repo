# DESIGN.md — 三国：冰河时代（网页致敬作）

> 作者：fable-arch（Round 1）。本文件与 `ARCHITECTURE.md` 互为合同：架构文档定形状与边界，
> 本文档定**数值、美术、体验与验收**。所有数值是首版基准（v1 balance），调参必须改
> `config.js` / `data/*` 并同步更新本文表格，禁止在系统代码里私调。

---

## 1. 定位与体验支柱

**一句话**：东汉末小冰河，你是一县之令——白天派工囤柴，寒潮来时全城围着一座火炉活命；
闲时招武将、练步骑弓，讨伐流寇护住粮仓。

三大体验支柱（一切取舍以此裁决）：

1. **炉火即命脉**——火炉温度可视、可听（视觉脉动）、可焦虑：寒潮倒计时常驻 HUD。
2. **冷暖对撞的画面**——暖橙炉光 vs 冷青冰雪，一眼看懂城市当前的生死状态。
3. **小而完整的策略闭环**——4 秒一天的快节奏下，建造/民生/军事三线都有可感知的反馈。

---

## 2. 世界观与叙事基调

汉室倾颓，天降奇寒（正史「汉末小冰河」的演义化）。玩家是收拢流民的县令，非帝王视角：
文案口吻用公文与民谣混排（事件志像县志），克制悲悯、不卖惨。武将来投是乱世避寒的
落难豪杰，故招募动作叫「招贤」，货币是粮与木（乱世里安身立命之资）。

---

## 3. 核心循环

```
分钟级（每 4 秒 = 1 天）：看温度计与净增/日 → 调工人 → 排升级 → 应对事件抉择
周期级（每 7 天寒潮）：囤柴煤 → 升火炉 → 寒潮中守民心 → 潮退抢修与人口回补
元循环（60 天一局）：招贤凑阵营 → 练兵配克制 → 讨伐八关拿铁与经验 → 科技强化
                     → 第 57 天预警「甲子极寒」→ 第 60–62 天终局大考 → 结局「春回」/ 无尽模式
```

**时间换算**（源自 config：`TICK_MS=250`, `TICKS_PER_DAY=16`）：1 天 = 16 tick = 4 秒（1×速）。
一局 60 天 ≈ 4 分钟纯挂机；实际含暂停、面板操作、2×/4× 加速，目标单局体验 15–25 分钟。

---

## 4. 气候与火炉（数值合同；常量名对应 `config.CLIMATE`）

**温度公式**（climate 系统每 tick 重算）：

```
temp = baseTemp(4) + furnaceHeat + blizzardDelta + techWarmth
furnaceHeat  = furnaceHeatPerLevel(3.2) × furnace.level   （lit 时；熄火为 0）
blizzardDelta = 当前寒潮 delta（非寒潮期 0）
techWarmth   = 已研「保暖冬衣」? +2 : 0
```

**温度带**（band，边界取"小于"）：`< −6` 冰封 freeze ｜ `< 0` 严寒 cold ｜ `< 8` 微寒 chill ｜ `≥ 8` 温暖 comfort。

**燃料**（每 tick）：木耗 `fuelWoodPerTick(0.08) × level`，煤耗 `fuelCoalPerTick(0.035) × level`；
已研「窑炉改良」则 ×0.85。`auto` 模式**优先烧煤**，煤尽烧木；两者皆尽 → 熄火（lit=false），
emit `climate:fuel:out`。手动 wood/coal/off 按字面执行。

**寒潮排程**：第 k 次寒潮起于第 `7k` 天（`blizzardEveryDays=7`），持续 2 天（`blizzardDurationDays`）；
强度 `delta = blizzardTempDelta(−14) − 2×(k−1)`，下限 −20。提前 1 天 emit 预警。
**「甲子极寒」**：第 60 天起的第 9 次寒潮为脚本化特例：delta = **−26、持续 3 天**（60–62 天），
第 57 天触发脚本事件预警（`flags.greatColdWarned`）。

**生存校验**（自查表，实现后 runner 必测）：

| 局面 | 城内温度 | band |
|---|---|---|
| 开局（炉 L1，无寒潮） | 4+3.2 = 7.2 | chill |
| 第 7 天寒潮（炉 L1） | 7.2−14 = −6.8 | **freeze**（教学：第一次寒潮前必须升 L2） |
| 第 7 天寒潮（炉 L2） | 4+6.4−14 = −3.6 | cold（可熬） |
| 甲子极寒（炉 L6） | 4+19.2−26 = −2.8 | cold（＋冬衣 = −0.8，勉力可守） |
| 甲子极寒（炉 L5） | 4+16−26 = −6 | **freeze**（终局必须满炉） |

---

## 5. 民心（常量名对应 `config.MORALE`；全部**每 tick**结算，clamp [0,100]）

| 条件 | 每 tick 变化 |
|---|---|
| band = freeze | −freezeDrain(2.4) → 一整天 −38.4：冰封两天不到必崩，硬威胁 |
| band = cold | −coldDrain(0.8) → 一整天 −12.8 |
| band = chill | 0（中性带） |
| band = comfort | +comfortGain(0.35) × (1 + kitchenBonus(0.25)·⟦厨房≥1⟧ + clinicBonus(0.15)·⟦军医所≥1⟧) |
| 当 tick 口粮不足（food 扣到 0） | 额外 −starveDrain(3.5)，与温度项叠加 |
| 劫掠战败（一次性） | −8 |
| 事件抉择 | 按事件表 ±2..±10 |

**崩溃**：`morale < collapseAt(15)` 连续 **32 tick（2 天）** → 失败 D1「民变」。
进入倒计时即 emit `morale:collapse:warn` 并触发 UI 红色警告横幅。

---

## 6. 经济数值表

### 6.1 生产与消耗基准

- 工人费率（每工人每 tick，即每人每天 ×16）：**food 0.16 ｜ wood 0.14 ｜ coal 0.08 ｜ iron 0.05**。
- 建筑等级效率：产出 ×`(1 + 0.10×(level−1))`。
- 天气减产（仅 `outdoor:true` 的伐木场/猎人小屋/煤矿/铁矿）：cold ×0.85，freeze ×0.5。
- 已研科技乘区：屯田法 food ×1.15；精铁锻造 iron ×1.15。
- 口粮：平民 **0.02/人/tick**（0.32/天）；士兵 0.03/人/tick；厨房每级口粮 −3%（上限 −15%）。
- 仓储上限（每种资源同值）：`200 + 200 × warehouse.level`（L0=200，L5=1200），超出截断并 emit `res:full`。

### 6.2 建筑总表（14 座；一类一座、以升级代替多建）

通用公式（除火炉外）：`cost(toLevel) = ⌈base × toLevel^1.6⌉`（按 cost 向量逐资源算）；
`buildTicks(toLevel) = 8 × toLevel`（半天/级 × 等级）。工人槽 `slots = 2 × level`。

| id | 名称 | maxLv | 解锁(火炉≥) | base 造价向量 | 功能（等级效果） |
|---|---|---|---|---|---|
| furnace | 火炉 | 6 | — | 见 6.3 专表 | 心脏：+3.2℃/级；**其余建筑等级 ≤ 火炉等级** |
| lumberCamp | 伐木场 | 5 | 1 | wood 20 | 产木 0.14/工/tick，outdoor |
| hunterHut | 猎人小屋 | 5 | 1 | wood 25 | 产肉 0.16/工/tick，outdoor |
| coalMine | 煤矿 | 5 | 2 | wood 60 | 产煤 0.08/工/tick，outdoor |
| ironMine | 铁矿 | 5 | 3 | wood 80, coal 20 | 产铁 0.05/工/tick，outdoor |
| house | 民居 | 5 | 1 | wood 30 | 住房上限 `12 + 12×lv`（L1=24，L5=72） |
| warehouse | 仓库 | 5 | 1 | wood 40 | 仓储 +200/级 |
| kitchen | 厨房 | 5 | 2 | wood 35 | 民心恢复 +25%（≥1 即生效）；口粮 −3%/级 |
| barracks | 兵营 | 5 | 2 | wood 50, iron 10 | 士兵编制上限 `15×lv`；练兵速度 0.5 兵/tick |
| clinic | 军医所 | 5 | 2 | wood 45 | 民心恢复 +15%（≥1）；冻毙 −15%/级；伤兵痊愈 2×lv/天 |
| academy | 太学院 | 5 | 3 | wood 60, coal 10 | 解锁科技（§10）；武将授业（§8.4） |
| recruitHall | 招贤馆 | 5 | 2 | wood 50 | 招贤抽卡；等级改善品阶权重（§8.2） |
| wall | 城墙 | 5 | 3 | wood 70, iron 15 | 守城韧性 ×(1+0.15×lv)（§9.4） |
| embassy | 使节馆 | 5 | 4 | wood 90, iron 25 | 贸易（§11）；L3 解锁「结盟」事件链 |

### 6.3 火炉专表（心脏，逐级手调；buildTicks = 12 × toLevel）

| 升至 | 造价 | 每日燃耗（木模式 / 煤模式） | 供热 |
|---|---|---|---|
| L2 | wood 90 | 2.56 / 1.12 | +6.4 |
| L3 | wood 170 | 3.84 / 1.68 | +9.6 |
| L4 | wood 240, coal 60 | 5.12 / 2.24 | +12.8 |
| L5 | wood 320, coal 140 | 6.40 / 2.80 | +16.0 |
| L6 | wood 400, coal 220, iron 80 | 7.68 / 3.36 | +19.2 |

### 6.4 开局资源与节奏校验

开局：food 150 / wood 120 / coal 0 / iron 0；人口 20（伐木场 2 人 + 猎人小屋 2 人已派）。
自查：20 人日耗粮 6.4，猎屋 L1（2 工）日产 5.12 → 微赤字逼玩家第 1 天加派/升级；
伐木场 L1 日产 4.48 − 炉 L1 日耗 1.28 = 净 +3.2，叠开局 120 木 → 第 5–6 天能凑齐 L2 火炉（90 木），
恰好赶在第 7 天首寒潮前，形成教学节拍。

---

## 7. 人口

- 每日结算（day:start）：
  增长 `morale ≥ 50 且 food > 0 且 total < housingCap` → `+max(1, ⌊total×0.04⌋)`；
  逃亡 `morale < 30` → `−max(1, ⌊total×0.05⌋)`，emit `pop:fled`；
  冻毙 前一日多数 tick 为 freeze **且**炉熄 ≥ 半天 → `−⌈total×0.02×(1−0.15×clinicLv)⌉`；
  饿毙 前一日全天 food=0 → `−⌈total×0.03⌉`。
- 人口下降后 population 系统按「超编建筑先减」回收 assigned；士兵不受平民逃亡影响。
- `population.total ≤ 0`（且士兵为 0）→ 失败 D2「绝户」。

---

## 8. 武将

### 8.1 名册（16 人 = 4 阵营 × 蓝/紫/橙/红；数值 = atk/def/lead）

| defId | 姓名 | 阵营 | 品质 | 兵种 | atk/def/lead | 技能（mini-DSL 语义） |
|---|---|---|---|---|---|---|
| zhangliao | 张辽 | wei | red | cavalry | 26/19/26 | 突袭：本队为骑兵时 power ×1.25 |
| xiahoudun | 夏侯惇 | wei | orange | infantry | 20/16/18 | 刚烈：上回合我方有损时 power ×1.10 |
| yujin | 于禁 | wei | purple | archer | 13/13/14 | 坚守：守城（raid）战 power ×1.20 |
| lidian | 李典 | wei | blue | archer | 10/9/11 | 洞察：讨伐战利品 +10% |
| guanyu | 关羽 | shu | red | infantry | 27/20/24 | 武圣：对「群」阵营敌 power ×1.30 |
| zhaoyun | 赵云 | shu | orange | cavalry | 20/15/20 | 龙胆：本队伤亡 −15% |
| huangzhong | 黄忠 | shu | purple | archer | 15/10/14 | 百步穿杨：本队为弓兵时 power ×1.20 |
| liaohua | 廖化 | shu | blue | infantry | 10/9/10 | 先锋：第 1 回合 power ×1.15（开局赠送） |
| zhouyu | 周瑜 | wu | red | archer | 24/18/27 | 火计：第 3 回合额外结算一次 50% power |
| ganning | 甘宁 | wu | orange | infantry | 21/14/18 | 百骑劫营：讨伐战首回合我方先结算 |
| taishici | 太史慈 | wu | purple | archer | 15/11/13 | 神射：兵种克制成立时额外 ×1.10 |
| dingfeng | 丁奉 | wu | blue | cavalry | 9/10/11 | 雪战：寒潮期间 power ×1.20 |
| lvbu | 吕布 | qun | red | cavalry | 30/17/20 | 无双：power ×1.20，但本队伤亡 +10% |
| gaoshun | 高顺 | qun | orange | infantry | 19/17/17 | 陷阵：目标韧性 −15% |
| huaxiong | 华雄 | qun | purple | infantry | 15/10/12 | 骁勇：对 tier ≤ 3 敌 power ×1.25 |
| zhangyan | 张燕 | qun | blue | archer | 10/8/12 | 山地：对劫掠流寇 power ×1.10 |

### 8.2 招贤（recruitHall）

- 单抽造价：**food 100 + wood 50**（招贤馆 L5 时 −20%）。
- 品阶权重（blue/purple/orange/red，%）：L1 62/30/7/1 ｜ L2 55/33/10/2 ｜ L3 48/36/13/3 ｜ L4 40/38/17/5 ｜ L5 32/40/20/8。
- 保底：`pityOrange ≥ 10` 强制 ≥orange；`pityRed ≥ 40` 强制 red；命中即清零对应计数。
- 品阶确定后在该品阶未拥有者中等权重抽取；重复（该品阶全拥有）→ 随机同品阶武将 +50 exp（`dup:true`）。

### 8.3 技能 mini-DSL（combat/economy 按 type 分发）

`mod.type ∈ { powerMult, casualtyMult, targetToughMult, lootMult, extraStrike, firstStrike }`；
`when ∈ { troop:x, enemyFaction:x, kind:"raid"|"expedition", round:n, roundFirst, blizzard, enemyTierLte:n, lostLastRound }`。
上表 16 条技能必须全部落进该 DSL，combat 系统不出现任何武将专有 if。

### 8.4 养成

- 升级经验：`expToNext(level) = 40 × level^1.5`；等级上限 20。战斗每次获 `enemy.expReward` 均分给出战武将。
- 太学院授业（action `addHeroExp`）：`food 30 + wood 20` → +20 exp，太学院每级每日限 2 次（day:start 重置，记 flags）。
- 属性成长：power 公式内 `×(1 + 0.05×(level−1))`，不改基础三维。

### 8.5 阵营协同（对应 `config.FACTION_BEATS`：吴克蜀、蜀克魏、魏克吴；群不克不被克）

出战 3 队中同阵营武将 ≥2 → 全军 power ×1.08；3 队同阵营 → ×1.15（含群）。

---

## 9. 军事

### 9.1 兵种（对应 `config.TROOP_BEATS`：步克骑、骑克弓、弓克步）

| 兵种 | 练兵造价/兵 | 练兵速度 | 军粮/tick |
|---|---|---|---|
| infantry 步 | food 5 + iron 2 | 0.5 兵/tick | 0.03 |
| cavalry 骑 | food 8 + iron 3 | 0.5 兵/tick | 0.03 |
| archer 弓 | food 5 + iron 3 | 0.5 兵/tick | 0.03 |

士兵编制上限 = `15 × barracks.level`；练兵从空闲平民转化（total−、soldiers+），解散反向返还平民。

### 9.2 战斗公式（确定性，回合制自动结算；两侧至多各 3 队）

```
power(队, 目标) = (atk×2 + lead) × (1 + 0.05×(heroLv−1)) × count^0.7
                × troopMult × factionMult × synergy × techMult × skillMults
troopMult   = 兵种克制成立 ? 1.3 : 1.0        （TROOP_BEATS）
factionMult = 阵营克制成立 ? 1.15 : 1.0       （FACTION_BEATS；群恒 1.0）
techMult    = 强弩(弓) / 骑术(骑) 已研 ? 1.10 : 1.0；精铁锻造已研全军 ×1.05
toughness(队) = (def + 30) × (1 + 0.05×(heroLv−1)) × wallMult(守方城墙, 仅 raid)
每回合：存活各队选目标（同序号优先，否则首个存活）→ 双方同时结算
casualty = round( power / toughness(目标) )，从目标 count 扣除
终止：一方全灭，或满 8 回合 → 进攻方撤退（讨伐失败：我方存活 ×0.6 返城）
伤亡去向：30% 转伤兵（wounded，军医所 2×lv/天 治愈回役），70% 阵亡
```

无武将的队（敌方杂兵）用 `heroLike` 三维、level 1、无技能。每回合 emit `combat:round` 生成中文战报行。

### 9.3 讨伐（八关，`data/enemies.js`；玩家从面板选关出征）

| tier | id | 名称 | 敌方编成 | 战利品 | exp |
|---|---|---|---|---|---|
| 1 | camp1 | 山贼哨站 | 步20 | wood 60, food 40 | 30 |
| 2 | camp2 | 流寇粮屯 | 步15+弓15 | food 140 | 45 |
| 3 | camp3 | 黑山木寨 | 骑30 | wood 160, coal 40 | 60 |
| 4 | camp4 | 废弃煤井 | 弓25+步20（紫哨领） | coal 120, iron 30 | 80 |
| 5 | camp5 | 白波前营 | 骑25+弓25（紫哨领） | food 200, iron 60 | 105 |
| 6 | camp6 | 铁官旧垒 | 步30+骑25+弓20 | iron 140 | 130 |
| 7 | camp7 | 匈奴游骑 | 骑45+弓25（橙哨领） | coal 160, iron 120 | 160 |
| 8 | camp8 | 白波大营 | 步40+骑40+弓40（橙哨领） | food 300, iron 220 | 200 |

行军：去程 8 tick（半天）→ 即时结算 → 回程 8 tick；暴雪期间禁止出征（在途不受影响）。
编成教学：每关主力兵种被玩家对应克制兵种打即明显轻松（tier1 步兵营 → 上弓兵）。

### 9.4 劫掠（防守战）

第 10/20/30/40/50 天各一波（提前 1 天 emit `raid:incoming`）；波次强度 = `raidWaveFor(day)`
取 tier `⌈day/10⌉+1` 的编成 ×0.8。守方 = 玩家全部现役编队（未编队士兵按兵种平均成队，无将）；
守方韧性 ×(1+0.15×wall.level)，于禁「坚守」等 raid 技能生效。
战败：三资源各 −15%（food/wood/coal 就高扣除）、morale −8；战胜：`raidsRepelled+1`，morale +3。劫掠不致直接败局。

---

## 10. 太学院科技（一次研一项；`data/techs.js`）

| id | 名称 | 需太学院 | 造价 | 工期 | 效果 |
|---|---|---|---|---|---|
| farming | 屯田法 | 1 | wood 80 | 2 天 | food 产出 ×1.15 |
| warmwear | 保暖冬衣 | 2 | wood 120, coal 40 | 3 天 | 城内温度 +2 |
| kiln | 窑炉改良 | 2 | coal 60, iron 40 | 3 天 | 燃耗 ×0.85 |
| forge | 精铁锻造 | 3 | coal 80, iron 60 | 4 天 | iron 产出 ×1.15；全军 power ×1.05 |
| crossbow | 强弩 | 4 | wood 100, iron 80 | 4 天 | 弓兵 power ×1.10 |
| horsemanship | 骑术 | 4 | food 150, iron 60 | 4 天 | 骑兵 power ×1.10 |

---

## 11. 使节馆与贸易

- 汇率（give→get）：2 wood→1 coal ｜ 3 wood→1 iron ｜ 2 food→1 wood ｜ 2 coal→1 iron。
- 每日额度：`40 × embassy.level` 单位（按 get 侧计），day:start 重置 `trade.usedToday`。
- 使节馆每级贸易汇率折扣 5%（give 侧向下取整，至少 1）。
- L3 解锁事件链「结盟」：第 55 天前建成则第 58 天触发脚本事件（盟郡驰援 +food 300），是甲子极寒的官方减压阀。

---

## 12. 事件表（`data/events.js`；≥8，含 2 条脚本事件）

抽取节奏：奇数天 day:start 后、无挂起事件时 roll 35%；按 `when(state)` 过滤 + weight 加权 + `cooldownDays≥6`。
挂起事件不暂停模拟，但 HUD 出现「政务待决」红点；抉择前不再抽新事件。

| id | 标题 | 触发条件 | 抉择 A / B（效果） |
|---|---|---|---|
| refugees | 流民叩门 | pop < housingCap | 收留：+4 人口，−30 food ／ 婉拒：morale −3 |
| caravan | 风雪商队 | day ≥ 5 | 交易：−80 wood +40 coal ／ 送客：无 |
| plague | 营中疫病 | pop ≥ 25 | 隔离：−1 人口，morale −2 ／ 硬扛：军医所≥1 则无损，否则 −3 人口 morale −5 |
| deserter | 逃兵事件 | soldiers ≥ 10 | 严惩：morale −4，士兵不减 ／ 宽宥：−2 soldiers，morale +2 |
| hunterTip | 猎户献策 | hunterHut ≥ 2 | 采纳：今日 food 产出 ×2（flags 一日 buff）／ 赏钱：−20 food，morale +2 |
| scholar | 名士避难 | recruitHall ≥ 1 | 礼遇：下次招贤半价（flags）／ 收藏赠书：+40 exp 随机武将 |
| rats | 粮仓鼠患 | food ≥ 300 | 灭鼠：−20 wood ／ 放任：food −10% |
| rebelAsk | 义军求援 | soldiers ≥ 20 | 出兵：−8 soldiers，+iron 80 morale +4 ／ 闭门：morale −2 |
| greatColdOmen | 天有异象（脚本） | day = 57 | 单选「加紧备冬」：无数值效果，纯预警甲子极寒 |
| allyRelief | 盟郡驰援（脚本） | day = 58 且 embassy ≥ 3 | 单选「拜谢」：+300 food |

---

## 13. 失败与结局（progress 系统；精确判定）

| id | 名称 | 判定 | 文案基调 |
|---|---|---|---|
| D1 revolt | 民变 | `morale < 15` 连续 32 tick（2 天） | 「炉火未熄，人心先冷。」 |
| D2 extinct | 绝户 | `population.total ≤ 0 且 soldiers ≤ 0` | 「县志至此，再无笔墨。」 |
| E1 spring | 春回（结局） | 第 62 天结束（甲子极寒撑过）时 status 仍为 playing | 结算画卷 + stats；可选「继续治县」进入无尽模式（寒潮维持 −20 上限、每 7 天循环） |

失败/结局均弹全屏结算窗（stats 四项 + 存活天数 + 重开按钮），存档保留供回看。

---

## 14. 美术方向

### 14.1 色彩体系——「一炉暖橙，压住满屏冷青」

设计铁律：暖色只允许来自**火源与 UI 纸面**；环境一律冷色。温度带驱动全局色调插值。

```css
/* css/base.css design tokens（css 变量名即合同） */
--glow-core:#ffd27d; --fire:#ff9a3c; --ember:#d95d1e;   /* 炉焰三段 */
--sky-deep:#0e1c2e;  --ice-deep:#14314a; --ice:#7fb7cc; /* 环境冷色 */
--snow:#eef4f7;      --frost:#bfe0ea;
--paper:#f0e6cf; --paper-dark:#e3d4b4; --ink:#2a221c;   /* UI 纸墨 */
--lattice:#8a5a33; --seal-red:#b3352c; --gold:#c9a35c;  /* 窗格木、印章红、描金 */
--q-blue:#4f8fdd; --q-purple:#a06bd8; --q-orange:#e6892e; --q-red:#d9483b; /* 品质色 */
```

环境色调随 band 插值：comfort 时地面雪偏暖白、天空 `--ice-deep`；freeze 时整体压向
`--sky-deep` 并提升霜霰晕影不透明度。**火炉光晕永远是画面最亮点**。

### 14.2 场景：2.5D 斜视（2:1 dimetric）

- 网格 9×9 城区 + 外圈资源点；`TILE_W=64, TILE_H=32`；建筑按 `col+row` 排序绘制。
- **地块坐标表（合同，与 `data/buildings.js` 的 plot 字段一致）**：
  furnace(4,4) 居中；kitchen(3,4)、warehouse(5,4)、house(4,5)、clinic(3,5)、academy(5,5)、
  recruitHall(3,3)、embassy(5,3)、barracks(4,2)、wall 以门楼(4,7)代表 + 周界环墙描绘；
  外圈：coalMine(1,2)、ironMine(7,2)、lumberCamp(1,6)、hunterHut(7,6)。
- 建筑画法：程序化「基座棱柱 + 双坡屋顶」剪影，暖侧屋面深瓦色、冷侧覆雪白；
  L0 显示为夯土地基虚线框，升级在建时叠脚手架横线纹；等级以檐下灯笼数量（1–6 盏）表达。
- 火炉特写：中心塔炉，顶部火口呼吸式光晕（半径 `90 + 30×level` px，加法混合，
  正弦 ±6% 闪烁）；熄火时光晕熄灭只余青烟——玩家一眼即知断供。

### 14.3 小人通勤（`render/citizens.js`，纯视觉）

- 显示数 `min(population.total, 48)`；6×10px 双色块小人（袄色 = 工作建筑主色），两帧点头式步行。
- 行为脚本：住宅 ↔ 所派建筑之间沿网格曼哈顿路径往返，端点驻留 2s；回程肩上叠一枚
  资源色小方块（运货感）。cold 带步速 ×1.2（缩着跑）；freeze 带全部缩回屋内，街道空城。
- 用 `onFrame` 的 alpha 插值移动；对象池复用，不入 state、不入存档。

### 14.4 雪粒子（`render/snow.js`）

- 常态三层视差：速度 18/34/60 px/s，粒径 1/1.6/2.4px，透明度 .35/.55/.85，总量 600。
- 暴雪：总量 ×2（cap 1200）、附加横向风速 120–200 px/s、加 20 条白色风迹短线；
  屏幕四角霜霰晕影（径向白霜 overlay）随 temp<0 渐显。
- 静雪表达：温度 <0 时屋顶雪盖厚度 +、地面雪反光调亮。

### 14.5 UI：中国传统窗格

- 右侧 dock（360px）与 modal 均为「窗格框」：纸面底（--paper）+ 3px 木框（--lattice）
  + 四角回纹角花（inline SVG data-URI border-image）+ 标题栏左侧一枚印章红方章（当前 tab 名）。
- 字体栈：`"STKaiti","KaiTi","Noto Serif SC",serif`（标题）；正文 `"Noto Serif SC",serif`。
- 按钮：墨线描边纸底，hover 填 --paper-dark，主按钮印章红底白字；禁用降饱和 + 灰墨。
- HUD 顶栏：通长纸卷条——左「第 N 天 ｜ 寒潮将至：M 日」，中温度计（汞柱按 band 分色：
  红橙/青/深青/白），右四资源（图标 + 存量 + 每日净增，负值印章红）+ 民心 + 人口。
- 资源图标程序化：肉（骨腿剪影）、木（原木截面年轮）、煤（黑菱块）、铁（锭形）——canvas 12×12 一次绘制成 dataURL 复用。

### 14.6 动效与反馈

完工建筑白光一闪 + 灯笼点亮；招到橙/红将全屏斜向绸带横幅；寒潮开始 0.5s 冷色闪屏 +
横幅「寒潮至」；民心告警时 HUD 民心数字印章红闪烁。所有动效 ≤ 600ms，可被 `?fx=off` 关闭。

### 14.7 音频（P2 可选，默认静音开关）

零二进制约束下用 WebAudio 程序化：风声 = 过滤白噪声（增益随暴雪）、炉火 = 低频爆裂粒子噪声、
UI 点击 = 短促木鱼脉冲。不做音乐。

---

## 15. UX 布局与操作

```
┌───────────────────────────── HUD 纸卷顶栏 ─────────────────────────────┐
│ 第N天·寒潮倒计时 │ 温度计 │ 肉 木 煤 铁(+净增/日) │ 民心 │ 人口 │
├──────────────────────────────────────────────┬────────────────────────┤
│                                              │  窗格 dock（360px）    │
│           2.5D 城市场景 canvas               │  [城建][武将][军务]    │
│     （拖拽平移／滚轮缩放／点建筑开面板）     │  [政务][系统] 5 tab    │
│                                              │                        │
├──────────────────────────────────────────────┴────────────────────────┤
│              底部中：⏸ 暂停 ｜ 1× 2× 4× ｜ 提示语滚动                │
└─────────────────────────────────────────────────────────────────────────┘
```

- 快捷键：`Space` 暂停；`1/2/3` = 1×/2×/4×；`B/H/J/Z` 直达城建/武将/军务/政务；`Esc` 关面板/modal。
- 点击场景建筑 = 打开城建 tab 并定位该建筑卡；卡内含：等级、工人 ±、升级按钮（含造价与不可用原因 tooltip）。
- 新手引导（flags.tutorialStep 0→3）：① 点亮火炉卡 ② 给猎屋加派 1 人 ③ 首寒潮预警时弹「囤柴升炉」提示。三步后不再打扰。
- 事件抉择、战报为 modal；toast 顶部居中 3s 淡出，同类合并。
- 最低支持 1280×720；≥1600 时场景放大、dock 不变。

---

## 16. 平衡自查基线（test/probes 附带断言的软目标）

1. 默认操作序列（脚本：按 §6.4 节奏建造）下第 7 天寒潮**不减员**、民心 ≥ 45。
2. 完全挂机（零操作）在第 7–9 天间因 freeze 进入民变倒计时——失败要教学出「火炉优先」。
3. 60 天通关所需总铁 ≈ 700–900（炉 L6 + 兵 + 科技），铁矿 L3×4 工 + 讨伐 tier4/6 战利品可达成。
4. 任一资源在正常局中不应连续 5 天顶仓（仓库升级有意义）。

---

## 17. SOTA 验收清单（交付判定；P0 全过才算完成）

### P0 — 必须全绿

- [ ] `python3 -m http.server 4173` 打开即玩；首屏可交互 < 1s（本地）；控制台 0 error / 0 warning（10 分钟自动游玩）。
- [ ] 零 npm 依赖、零二进制资产（`git ls-files` 无图片/音频/字体文件）。
- [ ] `node tests/runner.mjs`（≥25 断言）、`tests/bench.mjs`（10k tick < 250ms）、`tests/probes.mjs`（200 序列不变量 + 确定性哈希）全部通过。
- [ ] 存档：刷新页面续玩；导出/导入 JSON 往返深等；坏档导入被拒且不崩。
- [ ] 14 建筑全部可建/可升至满级；火炉等级上限约束在 UI 与模拟双侧生效。
- [ ] 16 武将全部可获得且技能生效（战报中可见乘区）；抽卡保底可复现。
- [ ] 步骑弓、魏蜀吴克制乘区在战报数值中可验证；八关讨伐 + 5 波劫掠可完整打通。
- [ ] 三条终局路径均可触发：D1 民变、D2 绝户、E1 春回（含无尽模式入口）。
- [ ] 寒潮提前 1 天预警（HUD 横幅 + bus 事件）；HUD 展示四资源每日净增。
- [ ] 性能：1080p 暴雪场景（1200 粒子 + 48 小人）≥ 55fps；模拟 tick ≤ 2ms。
- [ ] 键鼠完备：全部功能可用鼠标完成；Space/1/2/3/Esc 快捷键生效；按钮有 hover/active/disabled 三态。
- [ ] 面板文字对比度 ≥ 4.5:1；按钮可聚焦（键盘 Tab 可达）。

### P1 — 应有（缺失需在交付说明中列明理由）

- [ ] 新手三步引导；不可用操作的 reason tooltip 全覆盖。
- [ ] 1280×720 至 4K 自适应；DPR≥2 下画面清晰无糊。
- [ ] 小人通勤、屋顶积雪、炉焰呼吸光晕、霜霰晕影全部呈现且随状态变化。
- [ ] 事件志留存 200 条内可回看；战报 modal 逐回合中文描述。
- [ ] `?seed=` 复盘同一局；`?difficulty=` 三档生效。

### P2 — 加分

- [ ] WebAudio 程序化风声/炉火（默认关）。
- [ ] 结局「春回」结算画卷（stats 水墨排版）。
- [ ] `?fx=off` 低特效模式（粒子减半、动效关闭）。
