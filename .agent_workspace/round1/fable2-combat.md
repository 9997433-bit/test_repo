# Round 1 · fable-2 战斗系统多维审计与完整规格

MODEL_SLUG: claude-fable-5-thinking-xhigh

> 本规格是 `games/bingqi-wangzhe/js/combat/engine.js` 的实现蓝本（opus-3 落地，gpt-sol-1 出测试）。
> 遵守 ARCHITECTURE.md 冻结 API：`estimatePower(state, lineupIds)`、
> `simulateBattle({ playerWeapons, enemyWaves, rng, speed })` → `{ winner, rounds, timeline[], rewards }`、
> `generateArenaOpponents(state, rng)`。
> 数值常量若与 fable-3 的 `data/balance.js` 冲突，以 balance.js 为准；本文件给出可直接落地的默认值。

---

## 0. 术语与总原则

- **确定性优先**：引擎内禁止 `Math.random`、`Date.now`、对象键序遍历。所有随机走注入的 `rng`。
- **整数结算**：伤害、治疗、护盾最终值一律 `Math.round` 后 `max(1, x)`（护盾/治疗允许 0 时 `max(0, x)`）。
- **播放速度无关**：`speed` 参数只写入 timeline 头部注释，**不得**影响任何模拟逻辑（不变量 I-11）。
- **引擎版本号**：timeline 头部带 `engineVersion: 1`。任何改变 rng 消耗次序的改动必须 +1，并同步更新 golden 测试。

---

## 1. 战斗单位模型（unit）

由 weapon 存档字段派生，`buildUnit(weapon, side, slot)`：

```js
unit = {
  uid,            // `${side}:${slot}` 稳定字符串，如 'P:0'、'E1:2'（E{waveIdx}）
  side,           // 'player' | 'enemy'
  slot,           // 0..4，槽位即站位（无坐标系，"前排"= 存活者中 slot 最小）
  name, element,  // element ∈ {'fire','ice','thunder'}
  type, quality,
  atkBase, hpMax, // 见 1.1 派生公式
  hp,             // 当前，初始 = hpMax
  speed,          // 见 1.2
  crit, critDmg,  // 暴击率 [0,0.60]，暴伤加成 [0,0.50]（暴击倍率 = 1.5 + critDmg）
  lifesteal,      // [0,0.35]
  dr,             // 固有减伤 [0,0.40]
  combo, counter, // 连击/反击概率，各 [0,0.30]
  skillId, cd,    // 当前剩余 CD（自身回合数计），初始 = skill.cdInit
  gauge,          // 行动条，初始 0
  shield: 0,      // 护盾值，先于 hp 扣减
  buffs: [],      // { kind, value, turnsLeft, srcUid }
  alive: true,
  actCount: 0,    // 已行动次数（羁绊/BOSS 机制用）
}
```

### 1.1 属性派生（默认值，balance.js 可覆盖）

```
qualityMult: common 1.00 / uncommon 1.15 / rare 1.35 / epic 1.65 / legendary 2.05 / mythic 2.60
atkBase = round(weapon.baseAtk * qualityMult * (1 + 0.06 * enhanceLevel)) * (1 + bondAtkPct)
hpMax   = round(weapon.baseHp  * qualityMult * (1 + 0.06 * enhanceLevel)) * (1 + bondHpPct)
```

词条（forge 词条池 → 战斗语义，全部有硬上限）：

| 词条 | 战斗字段 | 上限 |
| --- | --- | --- |
| 元素伤害 | elemBonus：己方克制倍率 1.35 → 1.35+elemBonus | +0.10 |
| 暴击 | crit | 0.60 |
| 吸血 | lifesteal | 0.35 |
| 连击 | combo | 0.30 |
| 减伤 | dr | 0.40 |
| 速度 | speed 平添 | +30 |
| 反伤 | counter | 0.30 |

### 1.2 基础速度（按兵器 type）

```
笛 110, 弓 108, 扇 106, 弩 104, 刀 102, 剑 100, 戟刃 99, 枪 98, 伞 94, 戟 96, 斧 90, 锤 86
```

神话神器另加 +4。最终 `speed = typeBase + 词条速度 + 羁绊速度`，夹在 `[40, 200]`。

---

## 2. 速度条（ATB 行动条）

- 常量：`GAUGE_MAX = 1000`。
- **tick 循环**：每 tick 所有存活单位 `gauge += speed`。任何单位 `gauge >= 1000` 即进入本 tick 行动队列。
- **同 tick 排序（全序，禁止部分序）**：
  1. `gauge` 溢出量大者先（`gauge - 1000` 降序）；
  2. `speed` 大者先；
  3. `side === 'player'` 先；
  4. `slot` 小者先。
- 行动后 `gauge -= 1000`（保留溢出，速度优势可累积）。行动队列在 tick 开始时快照；队列中单位若在轮到前死亡则跳过（不消耗 rng）。
- **回合（round）定义**：从战斗开始，每当"当前双方所有存活单位自本 round 开始后均已行动 ≥1 次"即 round+1。返回值 `rounds` = 结束时的 round 数。
- **终止上限**：`MAX_ROUNDS = 50` 或 `MAX_TICKS = 20000` 或 `timeline 事件数 ≥ 4000`，任一命中即超时判定（见 §7）。

### 2.1 单位回合流程（严格顺序）

```
1. turnStart 事件；buffs 中 turnsLeft-- 并移除到期（先移除后行动）
2. 若被眩晕（stun buff）：发 stunned 事件，消耗回合，cd--（min 0），结束
3. cd--（min 0）
4. 决策（无 rng，见 §6 策略）：cd===0 → 用技能并置 cd = skill.cd；否则普攻
5. 逐 hit 结算（见 §4 伤害管线）
6. 连击判定：本回合为普攻且 combo>0 → 掷 1 次 rng；命中则追加 1 次 60% 倍率普攻（不再连锁）
7. 死亡结算：hp<=0 → alive=false，发 ko 事件（每单位一生恰好 1 次）
8. 波次/战斗结束检查
```

---

## 3. 元素循环与克制

`fire → ice → thunder → fire`（火克冰、冰克雷、雷克火）。

```js
elemMod(a, d):  克制 1.35（+ 攻方 elemBonus，+ 羁绊 0.10，总和封顶 1.55）
                被克 0.75；同属 1.00
```

克制命中时 timeline 的 damage 事件带 `elem: 'advantage' | 'disadvantage' | 'neutral'`，供 UI 播放火团/冰晶/雷链弹道与克制音效。

---

## 4. 伤害管线（每 hit，顺序即 rng 消耗次序）

```
atkEff  = atkBase * clamp(1 + Σbuff(atkUp) - Σbuff(atkDown), 0.5, 2.0)
raw     = atkEff * skill.mult
elem    = raw * elemMod(attacker, target)
mitig   = elem * (1 - min(0.40, target.dr + Σbuff(drUp)))
critRoll = rng.nextFloat()                    // rng #1（每 hit 必掷，即使 crit=0）
critMod  = critRoll < attacker.crit ? (1.5 + attacker.critDmg) : 1.0
variance = 0.95 + rng.nextFloat() * 0.10      // rng #2（每 hit 必掷）
final    = max(1, round(mitig * critMod * variance))
final    = min(final, bossCap)                // 仅 BOSS guard 词缀，见 §8
护盾吸收 → 余量扣 hp（hp 钳制 ≥ 0）
吸血     = round(实际扣除 hp 的部分 * lifesteal)，对自身治疗（不含打盾部分）
反击     : 目标存活 && 单体 hit && target.counter>0 → 掷 rng #3；命中则立即反打
           40% atkEff 的 1 hit（走同管线但禁止再触发反击/连击）
```

**rng 铁律**：`critRoll`、`variance` 每 hit 无条件消耗；`proc`（技能特效）仅当技能定义了 proc 才掷（技能表固定，静态可知）；`counter` 仅在上述条件满足时掷。目标选择**不消耗 rng**（全用确定性规则 + slot 升序破平）。

---

## 5. 技能表（12 个，含 4 神话；CD 以"自身回合"计）

通用字段：`{ id, name, type, element, cd, cdInit, target, hits[], effect?, proc? }`。
`mult` 均乘 `atkEff`。`cdInit` = 开局首个回合前的初始 CD（0 = 首回合即放）。

| # | id | 名称 | 载体 | cd/cdInit | 目标 | 公式与效果 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `flameSlash` | 烈焰斩 | 剑·火 | 3 / 0 | 单体（优先克制目标） | 1 hit × 180%；施加 `burn`：每回合开始扣 `round(施法者atkEff×0.25)` 真实伤害，持续 2 回合（不可暴击、无 variance、可叠加刷新不叠层） |
| 2 | `frostPierce` | 寒霜刺 | 枪·冰 | 3 / 0 | 单体 | 1 hit × 150%；施加 `slow`：目标 speed ×0.7，持续 2 回合（gauge 累积即时生效） |
| 3 | `thunderChain` | 引雷链 | 弩·雷 | 4 / 1 | 弹射 3 目标（存活敌按 hp 降序取 3，不足则轮回但同一目标最多 2 次） | 3 hit：120% / 90% / 60%，每 hit 独立掷暴击+浮动 |
| 4 | `whirlwindAxe` | 旋风裂空 | 斧 | 4 / 1 | 敌全体 | 每目标 1 hit × 95%（按 slot 升序逐个结算） |
| 5 | `quakeHammer` | 崩山震 | 锤 | 5 / 2 | 单体（当前 hp 最高敌） | 1 hit × 220%；proc（rng #3）30% 施加 `stun` 1 回合（BOSS 免疫，改为 slow 1 回合） |
| 6 | `windFanMend` | 清风归元 | 扇 | 4 / 1 | 己方 hp% 最低存活单位 | 治疗 `round(atkEff×1.2×healMod)`；再附护盾 `round(atkEff×0.4)`（护盾不叠加，取大） |
| 7 | `warFlute` | 龙吟战意 | 笛 | 5 / 2 | 己方全体 | 施加 `atkUp +0.15`，3 回合；不与自身旧 atkUp 叠加（刷新时长） |
| 8 | `jadeUmbrella` | 玉骨伞盾 | 伞 | 5 / 1 | 己方全体 + 自身 | 全体 `drUp +0.20` 2 回合；自身护盾 `round(atkEff×0.6)` |
| 9 | `galeArrow` | 追风连珠 | 弓 | 3 / 0 | 单体（hp 最低敌） | 2 hit × 130%，每 hit 独立暴击/浮动 |
| 10 | `bladeDance` | 血刃舞 | 刀 | 3 / 0 | 单体 | 1 hit × 160%；本次吸血率 = `lifesteal + 0.30`（仍受 0.35+0.30 逻辑上限 0.65） |
| 11 | `halberdSweep` | 横扫千军 | 戟/戟刃 | 4 / 1 | 前排 2 目标（存活敌 slot 最小的 2 个） | 每目标 1 hit × 140%；命中后自身获 `atkUp +0.10`（可叠 3 层、每层独立 3 回合） |
| 12 | `dragonInferno` | 真龙炎狱 | 神话·火 | 6 / 2 | 敌全体 | 每目标 1 hit × 260%；全部命中后对每个存活目标施加 `burn` 2 回合（同 #1 的 burn） |

> 神话另 3 把复用带强化参数的模板：冰神话 = `frostPierce` 参数改（mult 2.0、slow ×0.6、3 回合、cd 5）；雷神话 = `thunderChain` 改（4 弹射 140/110/80/60%、cd 5）；无属性神话 = `warFlute` 改（atkUp +0.22 且附 speedUp +12，cd 6）。数据层只加 4 条记录，引擎零新分支。

**普攻**：`basicAttack` = 1 hit × 100%，目标 = 确定性规则（§6），无 proc。

**buff 种类枚举（引擎白名单）**：`atkUp, atkDown, drUp, slow, speedUp, stun, burn, shield(挂在 unit.shield)`。未知 kind 必须抛错（防数据层拼写错）。

---

## 6. 出招与目标策略（双方共用的确定性策略函数）

自动战斗双方使用**同一个** `decideAction(unit, allies, foes)`，无 rng：

1. `cd === 0` → 用技能；否则普攻。
2. 技能目标按技能表定义；治疗/增益若无有效目标（全队满血且已有同名 buff）→ **降级为普攻**（cd 不消耗）。
3. 普攻目标优先级：
   a. 我克制（elemMod=1.35）的存活敌中 `hp` 最低者；
   b. 否则全部存活敌中 `hp` 最低者；
   c. 破平：slot 升序。

策略必须是纯函数：输入相同输出相同，方便单测（不变量 I-9）。

---

## 7. 胜负、超时与奖励

- 一方全灭 → 对方 `winner`（`'player' | 'enemy'`）。波次间玩家 hp/护盾/CD **保留**，buff 清空，gauge 保留。
- 超时（§2 上限）：比较 `Σ(hp/hpMax)/存活数`（保留 4 位小数比较），高者胜；**完全相等 → 'enemy' 胜**（PvE 防挂机白嫖，竞技场即防守方胜）。发 `timeout` 事件后再发 `battleEnd`。
- **磨战衰减**：round > 30 后，所有治疗与新护盾乘 `healMod = max(0, 1 - (round-30)*0.1)`（第 40 round 起归零），确保双奶阵容必然终结。
- `rewards`：PvE 胜 = 关卡表定值 + 掉落 rng（**在 battleEnd 事件之后**、以固定顺序掷）；败 = `{ coin: floor(定值*0.2) }`。竞技场 rewards = ELO-lite 变动 `{ ratingDelta, diamond, goldOre }`。

---

## 8. 羁绊（上阵时静态计算，战斗中不变）

按存档 lineup 计算一次，写入 timeline 头部 `bonds[]`：

| 羁绊 | 条件 | 效果（作用于满足者/全队见说明） |
| --- | --- | --- |
| 同型共鸣 | 同 type ≥2 把 | 该 type 每把 `bondAtkPct += 0.10`（每种 type 只计一次，不按对数叠加） |
| 三相同辉 | 同 element ≥3 把 | 该元素每把克制倍率 +0.10（进 §3 封顶 1.55），且 `bondHpPct += 0.08` |
| 兵魂 | mythic ≥1 把 | **全队** `bondAtkPct += 0.05`、`bondHpPct += 0.05`；每把神话自身 speed +6 |

多羁绊**加法叠加**进 `bondAtkPct / bondHpPct`，最后一次性乘入 §1.1。竞技场 AI 阵容同样享受羁绊（对称性，不变量 I-10）。

## 9. BOSS 机制（词缀制，数据层按关卡配置 0–2 个）

| 词缀 | 机制（全部确定性触发，除注明外不掷 rng） |
| --- | --- |
| `enrage` 狂暴 | 首次 hp < 35%×hpMax 时：`atkUp +0.40` 永续，发 `buff` 事件；一场仅触发 1 次 |
| `guard` 护心甲 | 单 hit 对其伤害封顶 `max(1, floor(0.15 × hpMax))`；封顶发生时 damage 事件带 `capped: true` |
| `elemShield` 元素盾 | 开场护盾 = `25%×hpMax`，只吃克制元素全额伤害，非克制打盾减半；破盾时发 `shieldBreak` 并眩晕 BOSS 1 回合 |
| `swift` 迅捷 | speed ×1.3；自身每第 3 次行动（actCount%3===0）额外追加 1 次普攻（同回合内，不重置 gauge） |

BOSS 免疫 `stun`（除破盾眩晕）。每 5 关精英 BOSS 至少带 1 词缀；40 关终 BOSS 带 `enrage + elemShield`。

---

## 10. 战报时间轴（timeline）事件类型

`timeline` = 事件数组，头部对象 + 有序事件。**seq 严格自增、从 0 开始**。

```js
header = { engineVersion: 1, seedNote, bonds: [...], units: [unit 静态快照...], speed }
event  = { seq, tick, round, type, actor?, target?, ...payload }
```

| type | 必带 payload | 说明 |
| --- | --- | --- |
| `battleStart` | `waveCount` | 首事件 |
| `waveStart` | `wave, enemyUids[]` | 每波一次 |
| `turnStart` | `actor` | 单位回合开始 |
| `action` | `actor, kind:'skill'|'basic'|'counter'|'extra', skillId?` | 决策结果 |
| `damage` | `actor, target, value, elem, crit:boolean, capped?, shielded?` | 每 hit 一条；`shielded`= 被盾吸收量 |
| `dot` | `target, value, kind:'burn'` | 灼烧结算 |
| `heal` | `actor, target, value` | 治疗（含吸血，吸血 `actor===target` 且带 `kind:'lifesteal'`） |
| `shieldGain` | `target, value` | 护盾生成/刷新 |
| `shieldBreak` | `target` | BOSS 元素盾破 |
| `buff` / `debuff` | `target, kind, value, turns` | 施加增减益 |
| `stunned` | `actor` | 回合被眩晕跳过 |
| `ko` | `target, killer` | 每单位至多一次 |
| `waveClear` | `wave` | |
| `timeout` | `hpScorePlayer, hpScoreEnemy` | 仅超时 |
| `battleEnd` | `winner, rounds` | 末事件（rewards 掷点在其后、不进 timeline） |

UI（opus-4）以事件类型驱动画布弹道与受击闪白；引擎不含任何渲染字段。

---

## 11. 竞技场本地 AI

### 11.1 对手生成 `generateArenaOpponents(state, rng)` → 20 名

1. `p = estimatePower(state, state.lineup)`；若阵容为空取 200 保底。
2. 第 i 名（i=0..19，榜单从弱到强）目标战力 `t_i = p * (0.70 + 0.04*i)`（0.70×–1.46×）。
3. **配队规则**（每名对手，rng 消耗顺序固定：名字→元素骨架→类型→逐把品质微调）：
   - 阵容 5 把；元素骨架从 `[3,1,1] / [2,2,1] / [1,2,2]` 中 `rng.pick`，保证 ≥2 种元素；
   - 若骨架含"3 同元素"→ 天然凑出三相同辉；再强制其中 2 把同 type 凑同型共鸣（AI 永远吃满至少 1 条羁绊）；
   - i ≥ 14 的对手额外必带 1 个支援位（扇或伞或笛）与 1 把神话（吃兵魂）；
   - 从原型池按元素/类型过滤后 `rng.pick` 原型，品质取使单把战力最接近 `t_i/5` 的档位，最后统一乘缩放系数 `t_i / Σ实际战力` 夹在 `[0.9, 1.1]`，超出则整体升/降一档品质重算一次（至多 1 次，防死循环）；
   - 生成结果必须满足 `|estimatePower(对手) - t_i| / t_i ≤ 0.05`（不变量 I-8）。
4. 对手记录：`{ id, name, rating: 900 + 15*i, lineup:[weapon...], powerCache }`。列表存入 `state.arena.opponents`，每日刷新。

### 11.2 战斗内"出牌"

竞技场不存在独立 AI 大脑：**双方复用 §6 的同一策略函数**（对称、可测）。防守方 = 对手生成的 lineup；进攻方 = 玩家 lineup。超时判防守方胜（§7）。

### 11.3 ELO-lite

```
expected = 1 / (1 + 10^((ratingOpp - ratingMe)/400))
ratingDelta = round(32 * ((win?1:0) - expected))   // 夹在 [-24, +24]
ratingMe = max(800, ratingMe + ratingDelta)
```

奖励：胜 `{ diamond: 8, goldOre: 2 }`，败 `{ diamond: 2 }`；每日 5 次进攻由 state 层限制，引擎不管。

---

## 12. 可单测不变量（gpt-sol-1 直接照抄成用例）

- **I-1 种子确定性**：同 `seed` + 同输入 → 两次 `simulateBattle` 的 `winner/rounds/rewards` 全等，`timeline` 深度相等（JSON 序列化逐字节一致）。
- **I-2 必然终止**：任意（含双奶互殴、0 攻）输入，事件数 ≤ 4000，最后一条恒为 `battleEnd`，`winner ∈ {'player','enemy'}`。
- **I-3 伤害上下界**：每条 `damage.value ≥ 1` 且 `≤ round(actor.atkBase * 2.0 * 2.6 * 1.55 * 2.0 * 1.05) + 1`（buff 上限×最大倍率×克制封顶×最大暴击×浮动上限）；burn 的 `dot.value ≤ atkBase * 2.0 * 0.25 + 1`。
- **I-4 HP 合法性**：任意时刻 `0 ≤ hp ≤ hpMax`；`ko` 每 uid ≤1 次；`ko` 之后该 uid 不再出现在 `actor` 位（反击/dot 亦然）。
- **I-5 元素表精确**：`elemMod` 9 组合逐一断言 = 1.35/0.75/1.0（无词条无羁绊时）。
- **I-6 CD 遵约**：对每 uid，两次 `action.kind==='skill'` 之间的自身 `turnStart` 数 ≥ `skill.cd`；首个技能前 turnStart 数 ≥ `cdInit`。
- **I-7 强弱单调**：镜像阵容 A vs A'（A' 全属性 ×10），任意 20 个种子下 A' 全胜。
- **I-8 竞技场战力带**：`generateArenaOpponents` 恒返回 20 名，战力误差 ≤5%，rating 严格递增，同 seed 结果全等。
- **I-9 策略纯函数**：`decideAction` 相同快照输入 100 次输出全等，且不触碰 rng（用 throw-on-call 的假 rng 验证）。
- **I-10 对称性**：把 playerWeapons 与 enemyWaves 单波互换、同 seed，胜者恰好翻转（超时平局例外：恒防守/enemy 胜）。
- **I-11 播放速度无关**：`speed ∈ {1,2,4}` 三次模拟 timeline（去掉 header.speed 字段后）逐字节一致。
- **I-12 estimatePower 无副作用**：不消耗 rng（throw-on-call 假 rng）、不修改 state（深冻结输入）。
- **I-13 seq 单调**：`timeline` 事件 `seq` 从 0 严格 +1；`tick/round` 单调不减。
- **I-14 Golden 回放**：固定 fixture（2v2、seed=42）的 timeline JSON 哈希写死在测试里；engineVersion 不变时哈希不得漂移。
- **I-15 奖励守恒**：PvE 同 seed 同关卡两次模拟 rewards 全等；败方 rewards 恒为 `{coin: floor(定值*0.2)}`；ELO delta ∈ [-24,24]。

---

## 13. 实现陷阱备忘（写给 opus-3）

1. **rng 消耗次序就是存档格式**：新增任何一次掷点（如新词缀 proc）都会平移后续序列、打爆 I-14 golden。规则：新掷点只能追加在"该 hit 现有掷点之后"，且必须 bump `engineVersion` + 重录 golden。
2. **crit/variance 必须无条件掷**（即使 crit=0），否则"某单位暴击率从 0 变 0.05"会改变整场序列，导致平衡性微调引发回放雪崩。
3. **行动队列快照**：同 tick 多单位过阈值时先快照再逐个行动；行动中死亡者跳过且**不掷任何点**。
4. **AoE 目标快照**：`whirlwindAxe/dragonInferno` 在 action 开始时快照目标数组，逐 hit 检查 `alive`，死者跳过（不掷点），禁止结算中途重新选目标。
5. **buff 到期时机**：统一"回合开始先减寿再行动"；warFlute 刷新时长而非叠层，halberdSweep 每层独立计时——用 `buffs[]` 数组多条目实现，别用单字段覆盖。
6. **slow 与 gauge**：speed 改变只影响之后的 tick 累积，禁止回溯修改已有 gauge。
7. **吸血基数**：= 实际扣 hp 的量（打在护盾上的部分不吸），且在 BOSS `guard` 封顶**之后**计算。
8. **波次续场**：玩家侧 hp/shield/cd/gauge 保留、buff 清空；忘了清 buff 会让 warFlute 跨波永动。
9. **超时比较用整数**：`Σ(hp/hpMax)` 浮点直接比较有平台风险，实现为 `Σ(hp*10000/hpMax)` 取整后比。
10. **排序稳定性**：所有排序给全序比较器（最后必落到 slot/uid），禁止依赖 `Array.sort` 的稳定性兜底语义不清的并列。
11. **rewards 掷点位置**：必须在模拟结束后固定顺序掷，且败局不掷（I-15）；否则"先算奖励再判胜负"会污染序列。
12. **深拷贝入参**：`simulateBattle` 不得改写传入的 weapons/waves 对象（UI 会复用它们渲染阵容面板）。

## 14. 对其他代理的接口请求

无新增契约请求；一切在冻结 API 内可实现。fable-3 请在 `balance.js` 落地 §1.1 品质倍率、§1.2 速度表、§7 奖励定值时保持字段名一致（`qualityMult/speedByType/arenaRewards`）。
