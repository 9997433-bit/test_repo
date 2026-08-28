# 异掌 · GDD（Round 1 玩法数值细则）

Fable-3 出品。本文只做一件事：把 DESIGN_SEED 定下的核心循环换算成**可实现、可测试的数字与公式**。
核心循环、操作、视觉规范见 `.agent_workspace/yizhang/DESIGN_SEED.md` 与 `docs/VISUAL_HANDBOOK.md`，本文不复述、不推翻。

**数值唯一来源是 `src/data/**`**。本文给出推导与意图；若文档与数据文件冲突，以数据文件为准并回修本文。
单位约定：米、秒、米/秒；角度用度。

数据文件索引：

| 文件 | 导出 | 内容 |
| --- | --- | --- |
| `src/data/gloves.js` | `GLOVES` `GLOVE_BY_ID` `MATCH` `isGloveUnlocked` | 12 掌（首发 8 + P2 生涯 4，§5.1）+ 契约对局常量 + 解锁判定 |
| `src/data/tuning.js` | `MOVEMENT` `KNOCKBACK` `METER` `RULES` `CAMERA` `CHARACTERS` | 运动 / 击退 / 掌意 / 规则扩展 / 机位与角色渲染对照登记（§15） |
| `src/data/skills.js` | `SKILLS` `SKILL_IDS` `SKILL_COMBAT_ALIASES` | 7 个主动技参数 + data→combat id 完整映射（§6） |
| `src/data/tiles.js` | `TILE` | 台面碎裂（方格拓扑，对齐 sim） |
| `src/data/bots.js` | `BOT_PERSONAS` | 3 种 Bot 人格（含互异 `skinId`） |
| `src/data/unlocks.js` | `UNLOCKS` | 局内解锁挑战 + 生涯累计解锁（§9.1） |
| `src/data/hub.js` | `HUB` | 安全区大厅布局：8 座坐标/朝向、交互半径、走道 AABB、传送门（§12） |
| `src/data/skins.js` | `SKINS` `SKIN_BY_ID` `DEFAULT_SKIN_ID` `resolveSkin` | 6 套皮肤真表（契约 §3.2 枚举组合，§13） |
| `src/data/vfx.js` | `GLOVE_VFX` `GLOVE_VFX_BY_ID` `GLOVE_VFX_BY_SKILL` `resolveGloveVfx` | 每掌战斗 VFX 参数表（§14；P2 追加掌暂缺条目，resolve 兜底木棉） |
| `src/data/story.js` | `STORY` `STORY_BY_ID` | 五拍旁白（P2 内容轮，木棉短句，§16） |

---

## 1. 对局常量

`MATCH` 与 CONTRACT.md 一字不差：`dt 1/60`、`arenaRadius 20`、`playerRadius 0.7`、`playerHeight 2`、`fallY -8`、`respawnDelay 1.2`、`invulnTime 1.0`、`matchSeconds 240`、`killsToWin 7`、`switchLock 0.4`、`awakenDuration 8`。

契约之外的规则常量在 `RULES`：

- **击杀归属**：坠落前 `killCreditSeconds = 4` 秒内最后打中你的人记击杀；超时算自坠（deaths+1、断连胜、无人得分）。
- **重生**：`respawnDelay` 后落在台心 `r < respawnCoreRadius = 4` 随机点，`invulnTime` 秒无敌。**无敌到点就结束**（P2 手感轮修复）：此前 `invulnT` 落在 sim 与 combat 的责任缝里两边都不减——重生一次就永久无敌，`isTargetable` 把人踢出命中列表，满场只剩挥空。现在活人的无敌帧由 sim `tickTimers` 唯一递减（combat 只把自己发的无敌状态抬上来、不做倒计时，两边不重复扣），`sim/sim.test.js`「无敌帧倒计时」用「同一记掌无敌期挥空、期满必中」锁死。玩家读感：重生那 1 秒放心落位，之后你是普通人——别人打得中你，你也打得中别人。
- 默认 `botCountDefault = 3`（1 人 + 3 Bot，先到 7 杀或 240s 计时结束杀数最高者胜）。

## 2. 运动模型（`MOVEMENT`）

- 走速 `walkSpeed 6.2 × 手套 moveSpeedMul`。加速度 `accel 42` → 约 0.15s 到全速；松键按 `stopDamping 10` 指数收速（约 0.3s 停稳）。这是种子要求的「有惯性」。
- 重力 `gravity 22`（游戏化取值）。轻跳 `jumpSpeed 5.2` → 顶点高度 `v²/2g ≈ 0.61m`，滞空约 0.47s。
- 冲刺：瞬时 +`dashImpulse 10.5`，`dashDuration 0.18`，冷却 `2.2`。冲刺不带击退（疾风的 `wind_rush` 才是攻击性位移）。
- 空中操控 `airControlMul 0.4`——离台后还有微弱挣扎空间，但救不回大击退（见 §4 DI）。

量感校验：横穿全岛（40m）约 6.5s；从台心走到边 3.2s。240s 一局够跑 35+ 个来回，空间不空旷。

## 3. 扇击判定与时序

- 判定体：以攻击者为顶点的水平扇形，半径 `slapRange + playerRadius(0.7)`，全角 `slapAngleDeg`，朝向 = 当前 yaw。**无锁敌无自瞄**（种子红线）。
- 时序：按下 → `windup`（前摇，可被打断）→ 命中窗 0.12s → `recovery`（后摇，**打空同样吃满**）。`slapCooldown` 自按下起算，且恒大于 `windup+0.12+recovery`，即冷却是唯一节奏约束。
- 命中效果：对目标施加水平冲量 `slapPower`，方向取**攻击者中心 → 目标中心**（不是朝向，避免贴脸扇出反直觉角度）；附加竖直 `baseKnockUp 1.8`；目标进入 `hitstun 0.32s`。
- **受击硬直只锁出招（P2 手感轮 FJ-04 落地；`hitstun-timing.test.js` 全程锁死）**：0.32s 挂的是 `stun` 状态，期间扇击 / 技能 / 冲刺全部出不了手（`canAct = false`），但**位移与击退一概不锁**——被扇飞那一段照常滑出去（否则谁也打不出岛），移动输入照常生效、DI（§4）照常拽落点。只有**扇击命中**这一条路挂它：八掌主动技各带自己的控制（冻结 / 减速 / 黏附 / 拉拽），不再叠一层双重上锁；被弹反的那掌提前返回，也不挂。时长与 `KNOCKBACK.hitstun` 同源（combat `HIT.hitstun`，两边同数由测试对照）、封顶 `hitstunMax 0.5`、恒严格小于最快扇击冷却。玩家读感一句话：**挨一掌僵的是手不是脚**——「还不了手」0.32 秒，「动不了」从来不存在。
- **表现读向（LOOK-R1，对齐 ART §16.0 挥击轴）**：扇击动画与 VFX 的读向恒为攻击者本地系**左 → 右的水平横抽**——巴掌是「抽」的不是「砸」的，禁上撩 / 禁下劈 / 禁竖抡；主掌副掌同向，换手只换哪条胳膊在抽（`render/characters.test.js` 锁死「横抽不是上撩」：命中段位移几乎全在左右轴）。此条只管表现——判定仍是上面那只水平扇形，几何与 §5 数字不因读向改变；技能自带的纵向读向（`quake_slam` 砸地、`sky_fall` 天落）不在此列。
- **命中顿帧（hit-stop，`core/juice.js`；打磨轮 LOOK-R4 冻结）**：只有**你打中人 / 你被打中**的扇击命中才定格画面——别人在远处互扇不冻你的镜头。单次 = 打中 0.08s / 被打 0.065s，power ≥ 12 的重击再加 0.035s，**封顶 `HIT_STOP.max = 0.12s`**（60fps 约 7 帧）；两次定格之间留 0.22s 冷却，连段不会剁成幻灯片。0.12 这个顶是**冻结值**（本轮复盘全席红线，`HIT_STOP.max` 不动）：想加强打击感，正道是每掌残留（§14.2-4「打完不能像没发生」）、受击一瞬去饱和闪白（从不满屏红）、击退量感（§4），**不靠加长顿帧**——顿帧一长，全游戏最快的节奏轴（疾风 cd 0.5）先被冻没。P2 手感轮给这条正道添了两块料，`max` 一格没动：其一，命中记录与事件带 **`heavy` 轻重标记**——「这一掌算不算重」由 combat 按 `HIT.heavyPowerThreshold 12`（与 `KNOCKBACK.heavyPowerThreshold`、碎地门槛同一条线）判**一次**随事件出门，下游 VFX / 音效 / 相机按它分档加重表现、不必各自再猜门槛（P3 已把 `core/juice.js` 的 `HIT_STOP.heavyPower` 从 16 收到 12，三处同源、12..16 灰区清空；收门槛只改「谁进重击档」，档位与 `max` 一格没动，最重一记仍是 0.08 + 0.035 = **0.115s** ≤ 0.12——`hit-feel-budget.test.js`「重击门槛已对齐」节 + `core/juice.test.js` 同源锁）；其二，§4.1 的起飞表——击退累积让后半局每一掌都更飘，打击感随对局自己升级，零顿帧成本。
- **不可无限连**：最快的掌（疾风 cd 0.5）命中后，受害者仍有 `0.5 − 0.32 = 0.18s` 出招权 + 全程可走位可 DI，追杀要走位跟上。
- 换掌：Q 触发 `switchLock 0.4s`（期间不能扇/放技能）；**两只掌的冷却在收起时照常回转**，鼓励「重掌起手 → 切轻掌追击」的双掌节奏。

## 4. 击退与出岛模型（核心公式）

击退速度按指数阻尼衰减：`v' = −λ·v`，地面 `groundDrag λg = 2.2`，空中 `airDrag λa = 0.35`。
线性阻尼有个好用的性质：**速度随滑行距离线性下降**，`v(x) = v0 − λg·x`。

一次命中的位移分两段（knockUp 1.8 → 滞空 `2·1.8/22 ≈ 0.16s`）：

```
空中段位移 ≈ 0.16·P（空气阻尼可忽略，落地余速 ≈ 0.95·P）
地面滑行   ≈ 0.95·P / 2.2 ≈ 0.43·P
总位移 D(P) ≈ 0.59·P
```

**护栏规则**（种子：挡轻击不挡重击，规则统一为一条速度/高度判据）：
越过台缘瞬间，若向外水平速度 `≥ railStopSpeed 6.5` **或** 高度高于 `railHeight 0.45`，则出岛；否则被栏挡下、贴栏踉跄 `railDaze 0.25s`。
`baseKnockUp 1.8` 顶点只有 0.07m，翻不过栏 → 普通扇击全靠**速度**过栏；磐石砸地（knockUp 6，顶点 0.82m）与陨掌（knockUp 5，顶点 0.57m）从**高度**过栏，这就是「重击不被挡」的实现。

**斩杀窗** W(P)：受害者距台缘多远以内、一掌能直接送下去：

```
W(P) = 0.16·P + max(0, 0.95·P − 6.5) / 2.2
```

- **DI（受身操控）**：击退期间受害者移动输入按 `diInfluence 0.25 × accel` 生效，可偏转 1m 左右的落点——救不了贴边被重掌命中，但让中距离击退有博弈。
- 掉落判死：`y < fallY(−8)`，或飞出 `arenaRadius + 0.2` 且脚下无台面（含被砸塌的洞，见 §8）。

### 4.1 起飞表：没有血条，身上唯一在涨的数（P2 内容轮登记）

异掌没有血量。玩家身上唯一「越挨打越危险」的量是**击退累积**——产品名**起飞表**：被扇越多人越「轻」，同一掌把你送得越远。§4 的 D / W 公式给的是干净起点，实战里两个数都乘着这张表长。

数字登记（combat `IMPACT`，`src/combat/constants.js`；实际生效倍率在 combat 侧结算）：

- 每挨一掌 +`有效击退 × perPower 0.045`（木棉 9 ≈ +0.4，磐石 15 ≈ +0.68），封顶 `max 1.6`——木棉连吃 4 掌就顶满；
- 击退倍率 = `1 + 累积值`，顶满 ×2.6：开局木棉 D 5.3m，顶满约 13.8m、W 约 10.9m（外环大半圈进斩杀带）——**表越高，轻掌也有重掌的威胁**；
- 脱战每秒回落 `decayPerSec 0.06`（顶满凉透约 27s）：想清表就得躲出接触，正好把血条游戏的「残血龟缩」翻译成本作的「贴边逃命」；
- **坠落重生整表清零**（combat `impact` 与 sim 侧 `knockScale` 一起归位）：死一次抖掉全部累积，回台心是真正的重新开始——配合 §1 的重生无敌收尾，重生者不带旧账；
- 被弹反的那一掌，攻击者自己吃**半额**累积（`tryParry` 里 `mag × 0.5`）——读心失败双倍疼。

谁在读它：Bot 已经在读（§10 的目标加权，欺霸专挑表高的人打；`ai/bots.js` 的 `impactOf` 优先 combat `impact`、缺省退 sim `knockScale`）。view 透出的镜像是每人 `knockScale`（`sim/view.js`，1 起步、上限 3.2，落地小幅回落）；给玩家看的那块表盘 HUD **F2 已接线**（`.yz-knock` 读 `view.players[].knockScale`）。

玩家读感三句话：挨打不掉血，掉的是「站得住」；连挨几掌后自己会明显变飘，那就是该跑的信号；把人送下岛不看数值看位置——表只是把「他快飞了」提前写在脸上。

## 5. 八掌数值表与设计意图

基础表（完整字段见 `gloves.js`；D=平地总位移，W=斩杀窗，按 §4 公式取整到 0.1m）：

| 掌 | 职能 | power | range | 角度 | cd | 前摇 | 后摇 | 移速 | D | W |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 木棉 cotton | 教学·基准 | 9 | 2.6 | 110° | 0.55 | 0.16 | 0.22 | 1.05 | 5.3 | **2.4** |
| 磐石 granite | 重击 | 15 | 2.9 | 75° | 1.15 | 0.42 | 0.38 | 0.88 | 8.9 | **5.9** |
| 疾风 gale | 切入 | 7.5 | 2.4 | 95° | 0.50 | 0.13 | 0.20 | 1.08 | 4.4 | 1.5（冲刺中 11 → **3.6**）|
| 冰霜 frost | 控场 | 8.5 | 2.6 | 90° | 0.70 | 0.20 | 0.26 | 1.00 | 5.0 | 2.1 |
| 弹簧 spring | 反制 | 9.5 | 2.5 | 90° | 0.75 | 0.20 | 0.28 | 1.00 | 5.6 | 2.7 |
| 分身 afterimage | 欺诈 | 8 | 2.5 | 100° | 0.60 | 0.15 | 0.22 | 1.04 | 4.7 | 1.8 |
| 磁掌 magnet | 强制接近 | 10 | 2.7 | 85° | 0.80 | 0.22 | 0.28 | 0.96 | 5.9 | 3.0 |
| 陨掌 meteor | 清场 | 12 | 2.8 | 80° | 0.95 | 0.30 | 0.34 | 0.94 | 7.1 | 4.2 |

关键平衡结论（回应「木棉不绝望、磐石不满图秒」）：

- **贴栏人人能杀**：所有掌 power ≥ 7.5 > 栏阈值 6.5，贴脸命中必出岛——最弱的掌也不绝望。
- **木棉靠走位**：W=2.4m。从台心把人扇死需要约 5 次完美衔接（每轮净推进 ≈ 5.3 − 受害者 0.23s 回走 1.4 ≈ 3.9m），实战 8–12s 的持续压制；但把 Bot 逼进外环 2.4m 带内，一掌收尾。110° 宽角 + 0.55 cd 是新手容错。
- **磐石慢而重**：W=5.9m（外环 30% 半径带），但 0.42s 前摇 + 75° 窄角 + 0.88 移速 + 1.15 cd——挥空即被狸缘这类 Bot 惩罚。台心命中 D=8.9 < 20，**没有任何掌能从台心一掌送人下岛**。
- 分层清晰：轻掌（木棉/疾风/分身）赢在节奏与容错，重掌（磐石/陨掌）赢在单发威胁，工具掌（冰霜/弹簧/磁掌）赢在创造挥掌机会。双掌配装示例：磐石+疾风（重起手轻追击）、磁掌+磐石（拉过来砸）、冰霜+木棉（减速后连扇）。

各掌一句话意图：

- **木棉**：默认解锁的「尺子」，所有其他掌都以它为参照上下浮动。无主动技（`skillId: ""`，全表唯一——空串同时满足「skillId 必须是字符串」的数据契约测试与「无技能必须 falsy」的装配层契约；`"none"` 是 combat 内部哨兵、不进数据，接线层把 falsy 归一成它）是刻意的——教学期只学移动/扇/跳三件事。
- **磐石**：唯一 power 上 15 的掌；一切弱点（前摇/角度/移速/冷却）都是为这个数字付费。
- **疾风**：裸 power 全场最低（7.5），必须用 `wind_rush` 冲刺中出掌（+3.5 → 11）才有斩杀力——技能表达在位移里。
- **冰霜**：power 平庸，价值在把对手移速打到 65% 之后的**追身逼边**。
- **弹簧**：反制读心。0.5s 架势窗口窄，读对了把攻击者反弹 12（W≈4.2）。
- **分身**：数值几乎与木棉持平，胜负手在残影骗 Bot/人转火（Bot 目标权重 ×2）。
- **磁掌**：power 10 中上，代价是 0.96 移速与 0.22 前摇；核心是 `iron_pull` 把龟台心的人拉进掌距。
- **陨掌**：中重甲。`sky_fall` 是全游戏唯一 AoE 清场 + 最长技能冷却 11s，落地自硬直 0.5s 给足惩罚窗。

### 5.1 P2 内容轮追加：生涯四掌（表尾 append，前 8 掌顺序与数值一字未动）

四只掌走 §9.1 的**生涯累计解锁**（不占单局挑战位），设计纪律三条（`tests/glove-data.test.js` 逐条锁死）：

1. **词表复用**：`skillId` 与觉醒 `special` 只从首发 8 掌词表里取——combat handler、VFX 分派、Bot 行为**零新增语义**即可进局；新掌的差异全部表达在数值配比里。
2. **包络约束**：全部数值（range/power/cd/前后摇/移速/技能 cd/觉醒倍率）落在首发 8 掌的 min–max 包络内，不越级、不造新极值——首发表的平衡结论（§5「贴栏人人能杀 / 台心无一掌秒」）自动继承。
3. **识别色互异**：与全表 12 色两两不同（苔铁绿 / 鸦青 / 绯粉 / 茄紫，四色都避开首发 8 掌的色相带）。

| 掌 | 职能 | power | range | 角度 | cd | 前摇 | 后摇 | 移速 | D | W | 技能（复用） | 觉醒 special（复用） |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 铁茧 cocoon | 重守·反制 | 13 | 2.8 | 80° | 1.00 | 0.34 | 0.34 | 0.90 | 7.7 | **4.7** | `coil_counter` (10s) | `counter_launch` |
| 渡鸦 raven | 游猎·切入 | 8 | 2.4 | 90° | 0.55 | 0.14 | 0.21 | 1.06 | 4.7 | 1.8 | `wind_rush` (7s) | `rush_steer` |
| 常胜 victor | 压制·强制接近 | 10.5 | 2.7 | 80° | 0.80 | 0.24 | 0.28 | 0.98 | 6.2 | 3.3 | `iron_pull` (9s) | `dual_pull` |
| 不倒 tumbler | 站桩·连击 | 11 | 2.7 | 90° | 0.85 | 0.26 | 0.30 | 0.95 | 6.5 | 3.6 | `quake_slam` (8s) | `combo3` |

各掌一句话意图：

- **铁茧**：磐石与弹簧之间的缺口——想要重掌威胁又想反制读心的人用它；power 13 换 0.34s 前摇与 0.90 移速，反击窗对面是 10s 技能冷却（全表反制位最贵）。
- **渡鸦**：疾风的姊妹掌，「渡」既是穿门也是掠边——power 8 比疾风裸 7.5 略高、但角度 90 < 95、冷却 0.55 > 0.50：少一分下限容错，多一分单掌斩杀（W 1.8 > 1.5）。
- **常胜**：磁掌换了脾气——拉人参数同源（`iron_pull`/`dual_pull`），power 10.5 > 磁掌 10（W 3.3 > 3.0，**拉到就多半送走**），代价是角度 80° < 85° 与前摇 0.24 > 0.22：锥更窄、出手更慢，拉完那一掌必须瞄正。
- **不倒**：站桩换装位——`quake_slam`（8s，比磐石 7s 略慢）守脚下，觉醒 `combo3` 奖励原地对扇；0.95 移速追不了人，价值全在「你过来打我」的那块台面上。

**本轮不做的两件事**（走道与视觉，均已在对应段登记）：新掌不上 3D 台座（走道仍 8 座，§12）；战斗 VFX 专属条目留给 O2（`resolveGloveVfx` 兜底木棉，§14）。

## 6. 主动技数值（`skills.js`）

| 技能 | 掌 | cd | 关键数字 | 出岛判据 |
| --- | --- | --- | --- | --- |
| quake_slam 蓄力砸地 | 磐石 | 7 | 半径 3.2，power 11→16（蓄 0.9s），knockUp 6，台伤 45 | 高度过栏 |
| wind_rush 疾冲 | 疾风 | 6 | 8m / 0.45s，途中扇击 +3.5 power，撞人推 5 | 速度过栏 |
| frost_arc 霜弧 | 冰霜 | 8 | 距 6 / 70°，减速至 65% × 2.2s，power 4 | 不出岛，铺垫 |
| coil_counter 弹簧反击 | 弹簧 | 9 | 窗口 0.5s，反弹 12 + knockUp 2.5，空放后摇 0.4 | 速度过栏 |
| phantom_swap 残影换位 | 分身 | 8 | 瞬移 4m，残影 2.5s，Bot 仇恨权重 ×2 | 不出岛，欺诈 |
| iron_pull 磁引 | 磁掌 | 9 | 锥 9m/40°，拉到面前 1.6m，到位踉跄 0.45s | 不出岛，铺垫 |
| sky_fall 陨落 | 陨掌 | 11 | 腾空 0.8s 可微调落点，半径 3.6，power 14 + knockUp 5，台伤 40，自硬直 0.5 | 高度过栏 |

冷却梯度 6→11 与技能决定性成正比：位移最短、清场最长。

技能 id 收敛（Round 3 定稿）：全游戏只有两套合法词表，映射唯一、一张表定死。

- **data id（规范名，数值与本文用它）**：`GLOVES[].skillId` ∈ { `quake_slam`, `wind_rush`, `frost_arc`, `coil_counter`, `phantom_swap`, `iron_pull`, `sky_fall` }；木棉无主动技，`skillId: ""`（空串——既是字符串又是 falsy，同时满足两份契约测试；数据里禁写 `"none"`）。
- **combat 处理器 id（运行时分派键，`src/combat/skills.js` 的 `SKILL_HANDLERS`）**：`groundPound` / `dashSlap` / `frostArc` / `parry` / `blinkSwap` / `magnetPull` / `meteorSlam`，外加内部哨兵 `"none"`。
- 两套词表由 `SKILL_COMBAT_ALIASES`（`skills.js` 导出）一一对应：7 个 data id 各有一条，另含 `none → none` 自映射，表是**完整**的。接线层（`core/modules.js` 的 `alignSkillIds`、`sim/combat-bridge.js` 的 `combatSkillId`）照此翻译后再交给 combat；falsy `skillId` 不查表，直接归一成 combat 的 `"none"`。combat 未来迁移到 data id 时删掉此表即收敛为一套。
- sim 静态 import 真实 data 与 combat（fallback-combat 已删除，无兜底战斗），`installData` / `installCombat` 只留给测试做替身。

## 7. 掌意与觉醒（`METER` + 各掌 `awakenModifiers`）

积攒（0..1）：扇中 `+0.12`、被扇 `+0.08`、技能命中 `+0.15`、挥空 `+0`、脱战每秒 `−0.01`。
经济校验：一次完整击杀往返（命中 6–8 掌 + 挨 2–3 掌）≈ `0.12×7 + 0.08×2.5 ≈ 1.0` → **节奏上约每完成一次击杀攒满一管**，觉醒成为「杀完开波」的高潮点。满条立即觉醒 `awakenDuration 8s`，结束归零；觉醒期间不再积攒。

觉醒是**玩家级状态**：8s 内换掌不清 buff，`applyAwaken` 作用于当前手套。通用增幅 `slapPowerMul 1.1–1.2`、`slapRangeMul 1.1`，外加各掌 special：

| 掌 | special | 效果 |
| --- | --- | --- |
| 木棉 | combo3 | 连续命中第 3 掌 power ×1.8（有效 17.8，W≈7.5m；2.5s 未命中重置）|
| 磐石 | slam_shatter | 砸地台伤 45→130（≥满血上限，整块直碎），半径 ×1.25 |
| 疾风 | rush_steer | 疾冲途中可转向一次（≤90°）|
| 冰霜 | freeze | 霜弧减速改冻结 0.8s |
| 弹簧 | counter_launch | 反弹附带 knockUp 4.5（弹离地，可越栏）|
| 分身 | decoy_feint | 残影每 1s 假挥掌，轻推 3 |
| 磁掌 | dual_pull | 可拉 2 人并黏住 0.6s |
| 陨掌 | crater_ring | 落点一圈台面直碎（半径 ×1.2，台伤 130）|

## 8. 台面碎裂预算（`tiles.js`，Round 2 冻结为 sim 方格拓扑）

Round 1 存在三套拓扑（F1 十二板 / F3 环扇 72 块 / O1 方格）。Round 2 **冻结为 O1 已实现的方格圆盘**（`src/sim/arena.js`），环扇方案废弃，`TILE` 字段全部对齐 sim。

结构：半径 20 圆盘铺 2.5m 方格（16×16 网格，中心落盘内的 **208 块**）。`|x| < 1.9` 的两列（32 块）是**中缝**，基准 HP 80（其余 120），天然先塌出一道纵向裂谷；`zone` 按象限分 4 区。每块实际 HP = `max(24, round(基准 × 边缘系数 × 抖动))`——边缘系数从台心 1.0 线性降到盘缘 0.75（边缘更脆），抖动 ±8% 同 seed 确定，满血上限 ≈ **130**。

数据 ↔ sim 常量映射（O1 对照校验；sim 侧改名/改值时回修此表）：

| `TILE` 字段 | sim 常量 | 值 |
| --- | --- | --- |
| `tileSize` | `ARENA.tileSize` | 2.5 |
| `baseHp` / `seamHp` | `ARENA.tileHp` / `ARENA.seamTileHp` | 120 / 80 |
| `seamHalfWidth` | `ARENA.seamHalfWidth` | 1.9 |
| `floorY` | `ARENA.floorY` | 0 |
| `slapDamagePerPower` | —（设计规格，扇击伤台待接线） | 3 |
| （重击门槛）`KNOCKBACK.heavyPowerThreshold` | —（同上） | 12 |

伤害来源：

- **技能**（已实现：combat 各技能 handler 调 `damageTilesInRadius`，桥接层 `creditTileBreak` 记账；sim 侧统一入口是 `damageTileAt` → `damageFloor`）：磐石 `quake_slam` 45（3 砸必碎任何普通块，中缝 2 砸）；陨掌 `sky_fall` 40（台心满血块 3–4 砸）。
- **觉醒**：`slam_shatter` / `crater_ring` 130 ≥ 满血上限，整块直碎。
- **重扇击**（设计规格，待接线——旧实现随 fallback-combat 删除）：有效击退 ≥ 12 的命中在受击者位置结算 `(有效击退 − 12 + slapDamageBias 4) × slapDamagePerPower 3`。磐石 15 → 21/掌（普通块 6 掌、中缝 4 掌）；陨掌 12 → 12/掌；觉醒磐石 18 → 30/掌。

其余规则：

- 两级裂纹视觉按剩余比例 `crackStages [0.66, 0.33]` 取档（sim 的 `crackOf = 1 − hp/maxHp` 是连续量，渲染负责分档）。
- **本局不复原**（`regrow: false`，sim 已满足）——边线永久改变（种子差异点 3）。
- 预算：专注拆台的磐石 ≈ 21s 一块（3 砸 × 7s cd），一局 240s 加上重掌命中的自然损耗约 15–30 块（208 块的 7–15%），另有觉醒时刻定点开洞——台面**可感知地变险**。
- 洞的判死走 §4 的「脚下无台面」分支（sim `isSupported`）：被扇过洞 = 提前出岛。

尚未接线的设计约束（字段已在 `TILE`，接线点是 sim 的 `damageFloor` 单入口，均为单点改动）：

- `innerSafeRadius 6`：格中心 `r < 6` 的 16 块台心永不碎（`damageFloor` 里跳过即可），保底立足点；接线前由 `findSpawnSpot` 的扫描兜底重生安全。
- `collapseDelaySeconds 0.6`：HP≤0 先抖 0.6s 警示再塌。sim 现为瞬时判碎，接线前由渲染做塌落表演。
- `zoneMaxCollapsedFraction 0.75`：每象限最多塌 75%，保通行走廊。

## 9. 解锁挑战（`unlocks.js`）

木棉默认解锁，首发其余 7 掌全部**单局内**可判定（`scope:"match"`，事件规格见文件头注释），难度即教学梯度；P2 追加的生涯 4 掌走**跨局累计**（`scope:"career"`，§9.1）。

判定唯一入口是数据层的 `isGloveUnlocked(id, progress)`（`gloves.js` 导出、`data/index.js` 转发；UI/core 读完存档调这里，不要自己比对）：`unlock: "default"`（木棉）恒 true，未知 id 恒 false；其余按 `UNLOCKS` 对 `progress` 判定，兼容四种形状——存档的 `{ unlocked: GloveId[] }`、扁平旗标 `{ [unlockId 或 gloveId]: true }`、挑战计数 `{ challenges: { [unlockId]: n } }`（n ≥ 该挑战 `count` 即解锁）、生涯累计 `{ stats: {...} }`（仅 career 规格按 `spec.stat` 对照，见 §9.1）。

| 掌 | 挑战 | 教的是 |
| --- | --- | --- |
| 磐石 | 百掌不倦：单局命中 15 掌 | 基本命中节奏 |
| 疾风 | 追风：冲刺结束 2s 内击杀 | 冲刺接掌 |
| 冰霜 | 稳如寒潭：零坠落取胜 | 边缘自保 |
| 弹簧 | 受身反杀：被扇后 3s 内反杀攻击者 | 受击不慌、DI 反打 |
| 分身 | 残影连斩：8s 内 2 杀 | 连续压制 |
| 磁掌 | 引狼入渊：3 次外环击杀（起飞点距边 ≤3m）| 逼边意识 |
| 陨掌 | 掌意如虹：单局 2 次觉醒 | 掌意经济 |

存档由 UI/core 层写 `localStorage` key `yizhang-save-v1`；数据层只定义规格。Bot 不受解锁限制。

### 9.1 生涯累计解锁（P2 内容轮，`scope:"career"`）

单局挑战教技巧，生涯解锁奖励**坚持**——四只 P2 掌（§5.1）不考单局爆发，只看攒了多少：

| 掌 | 挑战 | `stat`（存档 stats 字段） | `count` |
| --- | --- | --- | --- |
| 铁茧 cocoon | 百炼成茧 | `totalSlapHits` | 300 |
| 渡鸦 raven | 掠门之羽 | `portalCrossings` | 20 |
| 常胜 victor | 十胜成名 | `wins` | 10 |
| 不倒 tumbler | 屡仆屡起 | `matches` | 25 |

机制对照（与 `scope:"match"` 的分工）：

- **计数来源是存档 stats**（`src/core/storage.js` 的 `DEFAULTS.stats`），不是局内事件流。`totalSlapHits` / `portalCrossings` 是 P2 新增累计字段：`recordMatch` 先 spread 再覆写（结算一场不清生涯计数），穿门走 `recordPortalCrossing()`；老档缺字段由 `loadSave` 的 stats spread 补 0，不清档、不升版本。
- **判定仍走 `isGloveUnlocked`**：career 规格按 `spec.stat` 直接读 `progress.stats`，达 `count` 即解锁；`{ unlocked: [...] }` 名单等旧通路依然优先兼容。
- **core 的单局结算不误报**：career 规格没有 `event` 字段，`progressMeets` 认不出（落 default false）——「本局新解锁」弹报只属于单局挑战；生涯掌达标后由菜单/走道下一次读档时点亮。
- **接线状态**：`recordMatch` 的 `slapHits` 入参与 `recordPortalCrossing()` 已就位（storage 域），main.js 结算/过门处的调用属 UI/core 域，随下一轮接线；接线前四掌照常可经 `unlocked` 名单或 stats 手动达标点亮。

阈值推导：一局 240s 约命中 12–20 掌 → 300 命中 ≈ 18–25 局，与「场次 25」同带；「穿门 20」≈ 每局一次过门；「胜 10」按对 Bot 胜率 40–60% ≈ 17–25 局——四条都落在**同一个投入带**（≈ 20 局上下），先到哪只看玩法偏好，不制造「最后一只掌远得离谱」的断崖。

## 10. Bot 人格（`bots.js`）

无血条，因此「残血」统一映射为**台权劣势**（贴边距离 + 硬直状态），由 `targetBias` 加权；「快出局了」的连续读数是 §4.1 的起飞表（`impactOf` 优先 combat `impact`、缺省退 sim `knockScale`）：

| 人格 | 打法 | 关键参数 | 配掌 | 皮肤 |
| --- | --- | --- | --- | --- |
| brute 蛮古 | 直线硬冲贪掌 | aggression .9，reaction .28s，mistake .18，punishRead .2 | 磐石+陨掌 | wildhorn 荒角 |
| fox 狸缘 | 沿边绕走抓后摇 | circling .85，punishRead .85，mistake .08，edgeCaution .75 | 疾风+冰霜 | crane 鹤羽 |
| bully 欺霸 | 专打背身/硬直/贴边 | backstabBias .8，targetBias{edge 1.0, hitstun 1.0} | 磁掌+分身 | nuo 傩面 |

可战胜性由三个旋钮保证：`reactionSeconds`（感知延迟 0.2–0.28）、`mistakeRate`（.08–.18 随机失误）、`punishRead`（只有狸缘接近人类的抓后摇水平）。磐石 Bot（蛮古）0.42s 前摇 + 高失误率 = 木棉玩家的第一个「可学习」对手：引它挥空 → 绕背 → 两三掌送下岛。

皮肤（契约 §3.2 规则 3，ADR-26）：`skinId` 纯装饰、不挂数值；三人互异且不等于默认皮肤 `drifter`，Bot 不得全员同一造型。id 取皮肤词表 v1 冻结值，逐 id 对应 `src/data/skins.js` 真表（HUB-R2 已落地，见 §13）；壳层 `assignSkins` 对表里查无此 id 的值仍会安全回落轮转，行为不破。

## 11. 调参指南（改哪个数字、动什么）

| 症状 | 旋钮 | 方向 |
| --- | --- | --- |
| 全场太容易死 / 太肉 | `railStopSpeed 6.5` | 升 → 所有掌斩杀窗同步收窄 |
| 击退整体太飘 / 太钝 | `groundDrag 2.2` | 升 → D、W 全表等比缩 |
| 某掌强弱 | 该掌 `slapPower`（每 ±1 ≈ W ±0.6m）| 先动 power，再动 cd/前摇 |
| 连段压制感 | `hitstun 0.32` vs 最快 cd 0.5 | hitstun 永远要小于最快 cd |
| 后半局太爆炸 / 成长感不足 | `IMPACT.perPower 0.045` / `max 1.6`（§4.1） | 动 max 先算顶满倍率 1+max；凉得快慢另有 `decayPerSec` |
| 觉醒太频繁 | `METER.onSlapHit 0.12` | 降 0.01 ≈ 多打一掌 |
| 拆台太快/太慢 | `TILE.baseHp 120` 或技能 `tileDamage` | 保持「磐石 3 砸一块」的读感 |
| Bot 太强/太弱 | `mistakeRate` / `reactionSeconds` | 别动数值表，动人格 |

## 12. 安全区大厅与走道选掌（`hub.js`，HUB-R1，ADR-30）

布局唯一来源是 `src/data/hub.js` 的 `HUB`（契约 §3.3）：sim 经 `installData` / `installHubLayout` 接管后快照进 `state.hub.layout`，render/ui 从 `view.hub` 读，**任何模块不得硬编码第二份坐标**。坐标与 O1 `sim/hub.js` 内置默认表逐字段对齐——data 表缺席时行为不变，落地后 `deps.usingDataHub === true`，唯一的表内差异是 `pedestals` 数组顺序改为 GLOVES 图鉴顺序（契约硬约束 1；O1 默认表按排交错，坐标相同）。

**P2 内容轮批注：走道仍 8 座**。掌表已扩到 12（§5.1），但生涯 4 掌**本轮不上 3D 台座**——台座序 = GLOVES 图鉴**前 8**（`src/data/hub.test.js` 锁前缀对照）。生涯掌解锁后经 2D 选掌网格进配装；要给它们加座位（第五排 / 门侧对排）属布局改版，先过契约 §3.3 再动表。

**空间总览**：安全区与裂岛共用世界坐标。裂岛 = 原点半径 20 圆盘；走道整体在 z ≈ −120，安全区最近点（zone 北缘 z = −98）距裂岛圆心 98m，远大于「半径 20 + 2m 缓冲」的 22m 红线（硬约束 3）。走道沿 −Z 推进：出生 +Z 端 → 两排台掌 → 传送门 −Z 端，与 yaw = 0 → −Z 同向，开局镜头即面向走道纵深（ADR-17）。

| 项 | 值 | 说明 |
| --- | --- | --- |
| 走道 `bounds` | x ∈ [−7.5, 7.5]，z ∈ [−141, −102] | 15m 宽 × 39m 长；sim 硬钳制（走不出去、掉不下去） |
| 出生点 `spawn` | (0, −106)，yaw 0 | 距门 31m，walkSpeed 6.2 约 5s 走完，途中 8 座全部入视 |
| 台座 ×8 | x = ±4.2，z = −113 / −119 / −125 / −131 | 两排各 4 座，同排间距 6m；实体碰撞半径 0.6，座高 0.95 |
| 展掌悬浮 | y = 1.35 | floorY 0 + 座高 0.95 + 悬浮余量 0.4；手指朝上（+Y），idle VFX 归 O2 |
| 交互半径 | 2.0 | 契约区间 [1.6, 2.2] 取中偏上 |
| 传送门 | 中心 (0, −137)，yaw π（门面朝 +Z 迎向玩家） | 触发 AABB：x ∈ [−2.4, 2.4]，z ∈ [−139.4, −134.6]（半径 2.4 的外切正方形） |

**台座顺序与朝向**：`pedestals` 数组顺序 = GLOVES 图鉴顺序（聚焦并列时 sim 取表序靠前者）；空间上左排由近到远 = 木棉/磐石/疾风/冰霜——默认掌离出生点最近，**步行顺序即教学梯度**；右排 = 弹簧/分身/磁掌/陨掌。朝向遵守 ADR-17（forward(yaw) = (−sin yaw, −cos yaw)）：左排 yaw = −π/2 面向 +X、右排 +π/2 面向 −X，展掌永远面向走道中线，玩家走来看到的是掌心而不是掌背。

**交互半径为什么是 2.0**：

- 台座离走道中线 4.2 > 2.2（区间上限）：沿中线直走不误触发说明牌，想看哪只掌就朝它跨两三步（约 2.2m 进圈）。
- 同排间距 6m、对排 8.4m，均 > 2 × 2.0 = 4m：任何站位至多落进一座交互圈，聚焦无歧义（硬约束 2）。
- 台座实体碰撞 = 座半径 0.6 + playerRadius 0.7 = 1.3 < 2.0：贴到台边仍在圈内，不会「被实体挤开就丢焦点」。

**门与传送**：门 AABB 最近角到最近一排台座（±4.2, −131）约 4.0m > 交互半径 2.0——门触发区不与任何台座交互圈相交（硬约束 4），站在冰霜/陨掌前读说明不会误穿门。门提示区（AABB 各边外扩 interactRadius，契约 §4.4）与末排交互圈仅在门角有一小片重叠：那里 HUD 同时显示说明牌与门提示，属预期，不影响传送判定。

**验收对照**（F4 / G1 引用；`src/data/hub.test.js` 已全部锁死，改坐标先过它）：

| 硬约束（契约 §3.3） | 本表取值 | 裕量 |
| --- | --- | --- |
| 1. 恰好 8 座、gloveId 唯一、顺序 = 图鉴 | 8 座，cotton→meteor | 测试逐项断言 |
| 2. interactRadius ∈ [1.6, 2.2]；座距 > 2r | 2.0；最小座距 6m | 6 − 4 = 2m |
| 3. 全部几何距裂岛盘（20 + 2m）不重叠 | 最近点离原点 98m | 76m |
| 4. spawn/座/门都在 bounds 内；门区不碰交互圈 | 门−座净距 ≈ 4.0m | 2.0m |

**调参指南**（动数前先看这里，改完跑 `src/data/hub.test.js`）：

| 症状 | 旋钮 | 边界 |
| --- | --- | --- |
| 说明牌太灵敏 / 太迟钝 | `interactRadius 2.0` | 硬区间 [1.6, 2.2]；恒 < 台座离中线 4.2、> 实体碰撞 1.3 |
| 走道太挤 / 太空 | `ROW_X 4.2`、`ROW_Z` 间距 6 | 座距恒 > 2 × interactRadius；ROW_X 恒 > interactRadius |
| 误入传送门 | `PORTAL_RADIUS 2.4`、门−末排 z 距 6 | 门 AABB 与台座交互圈净距恒 > 0 |
| 安全区整体搬家 | `HUB_Z −120` | zone 最近缘距裂岛圆心恒 > 22m |

## 13. 皮肤真表（`skins.js`，HUB-R2，ADR-26；契约 §3.2）

`src/data/skins.js` 是壳层 `core/skins.js` 头注预告的那份「真表」：导出 `SKINS` / `SKIN_BY_ID` / `DEFAULT_SKIN_ID`（`'drifter'`）/ `resolveSkin`，`data/index.js` 已转发。壳层 `resolveSkins(dataModule)` 拿到 `src/data` 命名空间即自动翻 `source:'data'`，兜底表（ash/kiln/… 六套原创 id）退役为数据缺席时的降级，两套不混用；兜底 id 不升格为默认皮肤。

### 13.1 形状取舍（真表用哪套字段）

场上有两套候选形状：壳层兜底表的**比例数值**形状（`build:{height,mass,shoulder}` + `cloth/trim/accent` + `accessory`），和契约 §3.2 冻结的**枚举组合**形状（`build/headgear/back/palette`）。真表**只用契约形状**，理由：

- 契约已冻结且 O2 的实现策略围绕它设计——每个枚举值各做一次几何/材质件，F3 填组合表即可并行（§3.2 开篇）；比例数值形状无法保证「配件形制互异」这条灰度剪影底线。
- 枚举可测：`build ∈ {slim,stock,broad}`、`headgear` 六选一、`back` 三选一，词表越界直接测试红（`src/data/skins.test.js`）。

消费分两层，各管各的：**对象级**兜底走数据层 `resolveSkin(id)`（未知/缺省 → `SKIN_BY_ID[DEFAULT_SKIN_ID]`，契约 §14-17）；**id 级**归一（存档往返、`assignSkins` 分配）仍走壳层 `normalizeSkinId(id, resolveSkins(data))`，壳层零改动。渲染通路（契约 §3.2-6，v4.2 按实现登记）：真表经 `createRenderer(canvas, { data, skins })` 喂给 O2，render 侧先过壳层 `skinAppearance()` 把真表（枚举）与兜底表（比例数值）归一成同一份外观模型再落件——归一发生在壳层/render 域，本表的形状取舍不受影响。

### 13.2 皮肤表 v1（id 词表冻结于契约 §3.2；表序 = 大厅选择器顺序）

| id | 名 | 定位 | build | headgear | back | 衣料底色 / 灰阶位 |
| --- | --- | --- | --- | --- | --- | --- |
| `drifter` | 行脚 | **缺省**；风尘行脚客 | stock | hood | panel | 尘灰蓝 `#5d6572`，中间灰阶 |
| `mason` | 石契 | 宽肩石匠 | broad | bare | pack | 赭土 `#8a6f4d`，中高灰阶 |
| `crane` | 鹤羽 | 瘦高背旗（Bot fox） | slim | topknot | banner | 鹤羽灰白 `#b9bfc2`，全表最亮 |
| `reed` | 苇笠 | 斗笠蓑客 | stock | strawHat | panel | 苇绿 `#4c6248`，中低灰阶 |
| `nuo` | 傩面 | 傩戏面客（Bot bully；原创民俗剪影） | slim | mask | banner | 夜漆青黑 `#2f2b3a`，全表最暗 |
| `wildhorn` | 荒角 | 兽角蛮客（Bot brute） | broad | horns | pack | 生革锈褐 `#6e4a33`，暗暖灰阶 |

**灰度剪影判据**（测试锁死）：六套 `headgear` 互不相同——蒙掉颜色，头部剪影件就够认人；`build × back` 又把六套分成三族两两对照（stock+panel / slim+banner / broad+pack），族内靠 headgear 分（兜帽 vs 斗笠、发髻 vs 面具、光头 vs 荒角）。配色再补一层保险：衣料明度从鹤羽（最亮）到傩面（最暗）拉开阶梯。

**纪律**：`skinId` 纯装饰、不挂数值（ADR-26，测试断言表内无战斗键）；`back` 件必须承载当前激活掌识别色（§3.2 规则 1，皮肤只换载体形状不能取消）；palette 全部压饱和——全屏唯一饱和峰值永远是当前掌识别色（ART §1.2）；Bot 三人格 wildhorn/crane/nuo 互异且 ≠ `drifter`（§3.2 规则 3）。新皮肤 / 新枚举值 = 先登记契约 §3.2 再进表。

### 13.3 `trim` 微调参词表（F3/O2 协商制，先登记再用；O2 可安全忽略）

| 键 | 类型 | 用于 | 语义 |
| --- | --- | --- | --- |
| `hoodDepth` | number | drifter | 兜帽前探深度系数（0..1，越大脸越藏） |
| `packBulk` | number | mason | 行囊体积倍率（1 = 基准背包件） |
| `bannerHeight` | number | crane / nuo | 背旗高度倍率（鹤羽 1.25 高扬、傩面 0.95 收敛） |
| `hatRadius` | number | reed | 笠檐半径（米，剪影关键） |
| `hornSpread` | number | wildhorn | 双角外张半距（米） |

## 14. 每掌战斗 VFX 参数表（`vfx.js`，HUB-R2；Round 1 遗留 3）

大厅 idle 特效已可辨（ART §13.4，O2 已渲染）；本表管**裂岛里的扇击与技能**——Round 1 里它们还是一套通用壳。`src/data/vfx.js` 导出 `GLOVE_VFX`（数组，GLOVES 图鉴顺序）/ `GLOVE_VFX_BY_ID` / `GLOVE_VFX_BY_SKILL` / `resolveGloveVfx`，`data/index.js` 已转发。渲染域的**每掌一形分派词**（大厅 idle 八词 × 战斗八词）登记在 §14.3，与实现同词。

**消费方式（O2 分派）**：扇击事件带 gloveId → `GLOVE_VFX_BY_ID[gloveId].slap`；技能事件线上的 `skillId` 是 §3.1 右列 handler id → `GLOVE_VFX_BY_SKILL[skillId]`（表内 `skill.skillId` 就登记为 handler id，木棉无主动技不在此表）；分身残影读 `view.combat.ghosts`（O1 导出），视觉规格取 afterimage 的 `skill.ghosts`；未知/缺省 gloveId `resolveGloveVfx` 回落木棉（与 `createMatch` 同一约定）。

**P2 内容轮批注：追加掌暂缺专属条目，条目归 O2**。生涯 4 掌（§5.1）本轮**不进本表**——`GLOVE_VFX` 仍 8 条（GLOVES 图鉴前缀，`src/data/vfx.test.js` 锁前缀对照 + 兜底断言）：它们的扇击经 `resolveGloveVfx` 落**木棉**的絮扇壳，技能因复用首发 skillId 天然命中 `GLOVE_VFX_BY_SKILL` 原主掌的形（渡鸦疾冲 = 疾风的 `rushWake`，以此类推）——缺的只是「一掌一形」的专属识别，不缺表演。O2 补条目时按 §14.2 四条纪律逐掌过（burst/trail/residue 三列继续互异、识别色 ≤ 0.2、additive 仍只给真高温），渲染分派词表（§14.3 的 `COMBAT_VFX_KIND` / `IDLE_VFX_KIND` / `PALM_SHAPE` / `GLOVE_TINT` 四张 render 镜像）同步补键。

**职责边界**：判定几何（`slapRange`/`slapAngleDeg`/技能半径）的唯一事实源仍是 `gloves.js`/combat，O2 按 gloveId 自取——本表**不复制战斗数字**，只带视觉参数（形状关键词、粒子数、寿命秒、高度米、贴花种类）；识别色 `ident` 直接引用 `GLOVE_BY_ID[id].color`，不产生第三份色源（HUD/样式仍走 tokens.css，ART §1.3 注）。

### 14.1 八掌速览（完整参数见 `vfx.js`；关键词与 ART §16 逐掌对齐，通用纪律见 ART §7；扇击读向 = 左→右水平横抽，见 §3 与 ART §16.0 挥击轴）

| 掌 | 扇击 burst（主形） | trail（过程痕） | residue（残留） | 技能（handler id → 形） |
| --- | --- | --- | --- | --- |
| 木棉 | `gustFan` 掌风压出的贴地尘楔 | `fiberWisp` 布纤维碎屑 | `fluff` 棉絮缓落 | 无；觉醒 combo3 第三掌走 `slap.finisher`（同形 ×1.5，不换形不加光） |
| 磐石 | `stoneWedge` 石屑抛物线楔 | `gritDrag` 重尘拖曳 | `grit` 石屑弹跳滞留 + 金缮裂纹贴花 | `groundPound` → `slamShock`：尘幕 2s + 放射金缮裂纹 |
| 疾风 | `windShear` 被扰动的尘与草屑 | `chaffWake` 贴地草屑尾流 | `chaff` 打旋沉降 | `dashSlap` → `rushWake`：地面尘线 + 双布条 |
| 冰霜 | `rimeFan` 扇面闪结霜晶 | `coldFog` 贴地冷雾 | `frost` 化成湿痕 + 枝晶贴花 | `frostArc` → `dendriteWave`：枝晶波前；觉醒冻结带 `iceShell` 厚度 0.08m |
| 弹簧 | `coilSnap` 簧圈形变 + 高光游走 | `coilArc` 三圈簧弧 | `dustPop` 弹起的灰 | `parry` → `coilGuard`：压缩 0.12s → 释放弹尘 |
| 分身 | `ghostCut` 挥击剥离残影 | `poseGhost` 保留姿态、边缘先散、去饱和 | `ashMotes` 灰烬微尘 | `blinkSwap` → `swapVeil`：换位两端各留残影（ghosts ×2，寿命 0.7s，禁蓝色光柱） |
| 磁掌 | `fieldArcs` 尘埃吸成弧线场纹 | `filingStream` 铁屑流 | `filings` 铁屑微颤 + 拖擦贴花 | `magnetPull` → `pullField`：场弧收束 + 一帧磁弧 `snapFlash`（禁持续电弧） |
| 陨掌 | `emberImpact` 冲击环 + 余烬迸散 | `emberStreak` 余烬拖痕 | `embers` 呼吸余烬（全表唯一 additive）+ 焦痕贴花 | `meteorSlam` → `craterFall`：腾空遮光 → 冲击环 + 尘幕 + 焦痕环 |

### 14.2 纪律（`src/data/vfx.test.js` 逐条锁死）

1. **禁纯色光球**：burst 形 / trail 痕 / residue 残留三列各自八掌互异，不许「同团换 hue」（拒收 §9-11 的数据层前置）。
2. **识别色只做点缀**：着色粒子占比 ≤ `identMaxShare`（0.2，ART §13.4 的两成纪律战斗同用）。
3. **加法混合只给真高温**：全表 `blend:"additive"` 仅陨掌余烬，其余 Normal（手册 §10）。
4. **事后残留必查**：每掌 residue 有种类、数量 ≥1、寿命 >0——尘/屑/霜/烬至少留一样，打完不能像没发生（手册 §14-13）。

**调参指南**：想让某掌特效更「重」，先动 residue `count`/`lifeSeconds`（残留即重量感），再动 burst 寿命；不要加发光、不要动三列关键词（改词 = 改识别语言，需过 F2 视觉规范）；改完跑 `src/data/vfx.test.js` 与 `src/data/skins.test.js`。

### 14.3 渲染分派词表（HUB-R3 同词登记；分派词归 render 域，本表不复制进 `src/data`）

数据参数（`vfx.js` 的 burst / trail / residue / decal 字段词）之外，渲染域另有两张**每掌一形**的分派表——参数、分派、终稿三处互引不出第四套词汇（ART §17.4 同款纪律），本节按实现原词登记：

- **战斗分派** = `src/render/combat-vfx.js` 的 `COMBAT_VFX_KIND`：八键 = GLOVES 八 id（cotton / granite / gale / frost / spring / afterimage / magnet / meteor），八形互异；afterimage = `phase`，**不是** mirror（SOTA HG-06 / 契约 v4.2 已锁）。技能走 `SKILL_VFX_KIND` 同形放大（键 = §3.1 左列 data id，七条；木棉无主动技不在表），认不出退回持掌词（`combatVfxKind` 兜底 `fanwake`）——每掌技能与扇击同形，殊途同归。
- **大厅 idle 分派** = `src/render/hub-vfx.js` 的 `IDLE_VFX_KIND`（八键八形，认不出退 `fluff`）；中文八词与 ART §17.1 底线形表同词。

| 掌 | idle kind（中文八词，ART §17.1） | 战斗 kind（`COMBAT_VFX_KIND`） |
| --- | --- | --- |
| 木棉 cotton | `fluff` 棉絮 | `fanwake` 絮扇 |
| 磐石 granite | `grit` 岩屑 | `slab` 岩楔 |
| 疾风 gale | `streak` 风带 | `gust` 风刃 |
| 冰霜 frost | `mist` 霜雾 | `rime` 霜弧 |
| 弹簧 spring | `coil` 簧弧 | `recoil` 簧弹 |
| 分身 afterimage | `ghost` 残影 | `phase` 错位 |
| 磁掌 magnet | `pull` 磁弧 | `flux` 磁弧 |
| 陨掌 meteor | `ember` 余烬 | `cinder` 陨坑 |

idle 与战斗逐掌**押韵不复制**（ART §16.0 快慢架 / §17.4 对齐表）：`fluff`↔`fanwake`、`grit`↔`slab`、`streak`↔`gust`、`mist`↔`rime`、`coil`↔`recoil`、`ghost`↔`phase`、`pull`↔`flux`、`ember`↔`cinder`。

分层一句话：`vfx.js`（§14 本表）管**参数**、`COMBAT_VFX_KIND` / `IDLE_VFX_KIND` 管**分派**、ART §16 管**终稿**。分派词活在 render 域，数据红线不变（`src/data` 禁 import three / DOM / Math.random）：本表不登记 render 词为字段，render 也不复制本表数字。

## 15. 固定人物视角与机位（`CAMERA`，LOOK-R1…R4；契约 v4.4 ADR-37…39）

### 15.1 视角模式 `lookMode`

值域冻结为两词 `'locked' | 'free'`（第三值先登记契约再用）。**产品缺省 `lookMode = 'locked'` = 固定人物视角**：镜头钉在角色身后、绕不到正脸（渲染侧硬顶兜底，§15.3），**人物水平面向 ≡ 相机水平前向**——`Input.yaw = cameraYawToSimYaw(θ)` 由 sim 直赋、无平滑，等式逐 tick 精确成立（契约不变量 §14-30）；上下看（pitch）不受影响，照走 ADR-35 通路。

`free` 为**可切换**的自由视角（LOOK-R2 已落地，LK-04 收口）：镜头与面向解耦——分派整只收在 `input.sample()`：**移动矢量非零**时送 `yawFromDir(moveX, moveZ)`，面朝走向（= 世界系移动方向 `atan2(−moveX, −moveZ)`，§14-31）；**零位移**送 `yaw: null`，sim 见非有限值保持当前朝向——静止转镜头，人一动不动；W+S 对消的合零矢量同样落回 null，不会原地翻身。**locked 仍 1:1**：恒送 `cameraYawToSimYaw(θ)`，与视角轮之前的既有行为逐字一致（`input/index.test.js`「Input.yaw 按 lookMode 分派」与 `sim/look-yaw.test.js` 两侧锁死）。两种模式下移动换算是同一条公式：W 永远朝镜头水平前方。运行时权威只住在 input（`getLook().lookMode`）；sim 与 view 快照不感知 lookMode，renderer 持有的只是随帧镜像（ADR-38 v4.4 措辞），驱动的唯一分支是机位跟随角选源（契约 §14-35）：locked 用角色 yaw / free 用喂入的 `simYaw`。free 下面向与视线是**两个独立的角**，画面里角色可以露出侧面甚至正脸——这是特性不是回归；locked 的「绕不到正脸」另有渲染侧硬顶兜底（§15.3）。

**切换五通道**（初值链左优先：URL > 存档 > 缺省 locked；任一通道切换都只换跟随角选源、**不传送机位**，见 §15.4）：

| 通道 | 行为 |
| --- | --- |
| 键 **V**（`KeyV`） | 上升沿 toggle；不占用既有键位、不置位任何动作；落盘存档 |
| 触屏「视」钮 | V 键的触控对应物（打磨轮 LOOK-R4 F2 补上——此前触屏玩家没有任何切视角入口，复盘 P1）：触控层（`.yz-touch`）一颗单字「视」钮，点按走同一条上升沿 toggle、同一枚回执小字（触屏本就收起键帽）、同样落盘；触控层收着时不占通道。布点纪律归 ART §11.4（不得挤乱 `.yz-cluster` 既有栅格），实现措辞以 `ui/touch.js` 为准、合入后如有出入回修本文 |
| 设置面板「视角模式」 | 「固定视角 / 自由视角」两段分段器（与画质同一套 `.yz-seg`）；经 `onSettingsChange → input.setLookMode`（静默 setter，不触发 `onLookModeChange`）收敛后落盘，与 V 键殊途同归于 `shell.setLookMode` 的同一枚回执 |
| URL `?look=locked\|free` | 仅本次会话，不回写存档；非法值忽略、走存档链 |
| 存档 `lookMode` | 老档缺字段 / 非法值一律补 `'locked'` |

**上下看反转（打磨轮 LOOK-R4 F2；设置面板「Y 轴反转」，复盘 P2）**：两段开关，缺省**关** = 维持现向；开 = 只把上下看（pitch）的方向反过来，左右转向与灵敏度都不碰——给「推杆看天」手癖的玩家。反转在输入层进角度前就定号（`applyLook` 按 `invertY` 取正负，链路后段拿到的 pitch 已是玩家想要的方向——`core/look.js` 头注锁死「不要在链路上再翻第二次」）；键鼠与触屏拖动吃同一开关。落盘存档 `invertY`（缺省 `false`，老档缺字段 = 不反转）；输入层旋钮（`input.setInvertY`）与存档字段早已在位，本轮 F2 补的是设置面板上那一行开关。

**文案**（契约 §13.2 归本文定，LOOK-R2 按实现对账后登记，与 `ui/hud.js` `LOOK_LABEL`、`ui/shell.js` 键位表 / 设置板逐字同词）：切换**不开中央 toast**——模式提示只有准星下那一枚回执小字（`.yz-look-flash`，F2 ART §18.1）：「视角锁定 / 自由视角」+ 键帽 V（触屏收起键帽、文本照常），亮约 **0.9s**（`LOOK_FLASH_MS = 900`；比 toast 1.6s 短，它是确认回执不是通知），连按只重置计时、不排队不叠字；键位表行 =「切换视角 V」（另有「视角 鼠标」一行）；设置面板段 = 标签「视角模式」+「固定视角 / 自由视角」两段。旧版登记的 1.2s 隔字 toast「锁 定 视 角 / 自 由 视 角」作废——实现从未挂载（`main.js` 明写反馈只有回执一枚，模式提示不与战斗信息抢眼；`shell.test.js`「中央短讯那块大字不跟着开」锁死）。改词先过 F2 视觉规范。

### 15.2 机位距离 / 阻尼对照表（`CAMERA`）

镜头实现是 O2 域（`render/camera.js`），但「跟多远、多黏」是手感数字——`CAMERA` 表把它们登记进数据层供本文与测试引用。表是**登记不是接管**（同 §8 TILE↔sim 的对照模式）：render 侧改名 / 改值时回修此表，`src/data/tuning.test.js` 逐项锁两边同数，禁止另造一套。

| `CAMERA` 字段 | 值 | 实现对应（`render/camera.js` / 契约 §7.1） |
| --- | --- | --- |
| `dist` | 7.4 | 机位距离初值（camera `state.dist`，开机第一帧） |
| `restDist` | 7.1 | 静止跟随距离 `REST_DIST`：目标距离基准，snap 落位直接用它 |
| `distSpeedGain` / `distSpeedMax` / `distAirGain` | 0.11 / 1.6 / 0.12 | 目标距离 = restDist + min(1.6, 速度×0.11) + 滞空高度×0.12——地面全速 6.2 稳态 ≈ 7.8，冲刺顶到 8.7 |
| `basePitch` | 0.22 | 静止俯角 `BASE_PITCH`（rad）；pitch 上限 ±π/2.6 与 input 同值 |
| `yawDamping` | 7.5 | 方位角弹簧（走最短弧，跨 ±π 不兜整圈） |
| `posDamping` / `posDampingY` | 6.2 / 5 | 机位弹簧（竖直略慢：转身画面才有重量） |
| `lookDamping` / `lookDampingY` | 9 / 7 | 视点弹簧（恒快于机位：先看后到） |
| `distDamping` | 3.2 | 距离弹簧 |
| `pitchDamping` | 14 | 抬头量弹簧 |
| `snapTeleport` | 60 | = 契约 `CAMERA_SNAP_TELEPORT`（§7.1）；render 导出同名常量，实现已向表看齐 |
| `snapMaxDist` | 20 | = 契约 `CAMERA_SNAP_MAX_DIST`（§7.1） |
| `lockedYawSpan` | π/2 − 0.1（≈84°） | = render `LOCKED_YAW_SPAN`：locked 迟滞硬顶的背后半平面上限（LOOK-R2 O2，§15.3）；恒**严格 >** `behindLimit`——R3 咬合闸在内先咬，本值是更靠外的最后一道墙，关系由 `tuning.test.js` 锁死 |
| `lockedHoldRate` / `lockedHoldMin` / `lockedHoldMax` | 30 / 0.25 / 1.2 | = render `LOCKED_HOLD_*`：硬顶生效带宽 = rate×dt 夹进 [min, max] rad（`lockedHoldSlack`，LOOK-R2 O2，§15.3） |
| `behindLimit` | π/2.4（≈75°） | = render `BEHIND_LIMIT`：跟随角咬合闸极角上限（LOOK-R3 O2） |
| `behindShell` | 2 | = render `BEHIND_SHELL`：机位半径 > dist×本系数时松闸（重生追赶不横跳） |

**过门机位 snap（ADR-39）**：hub（z ≈ −120）与裂岛（原点）错开 ~120m，过门 / 开局 / 换跟随目标一律 `snapCamera()` 吸附，时序冻结为 `input.setLook → feedLook → snapCamera`（契约 §13.2，顺序反了 = snap 到旧角度）。自动保险：跟随目标单帧位移 > `snapTeleport 60` 时渲染器自 snap（实现常量 `CAMERA_SNAP_TELEPORT`，已取代内部 `TELEPORT_DIST 16`），局内重生瞬移（≤ 2×arenaRadius = 40m）不得触发、弹簧甩镜手感保留；snap 后相机-目标距离 ≤ `snapMaxDist 20` 且机位在身后半平面（§14-32/33）。吸附名单只认「世界位置换了一处」的传送时刻——**切视角模式不在名单里**（§15.4）。

**模型瞬移 ≠ 机位瞬移（复盘 P0-3，`CHARACTERS` 登记）**：`CHARACTERS.teleportDistance = 16`（render `TELEPORT_DISTANCE`）管模型插值跳过；`snapTeleport 60` 管机位。两数故意不同，`tuning.test.js` 对照 render 源码同数。产品读感（人闪现、镜头追、40m 重生落在 16–60 之间）见 §15.6。

**调参指南**：想镜头更贴身 / 更远先动 `restDist`（`dist` 初值同步 ±，两值保持 0.3 内）；想更「跟手」升 `posDamping`/`lookDamping`，但保持 look > pos（先看后到的次序别倒，`tuning.test.js` 锁死）；snap 两阈值是契约面，改值先过 §7.1 再动表。任何一处改完跑 `src/data/tuning.test.js`——它对照 render 实现逐项断言，两边不同数先红。

### 15.3 locked 绕不到正脸：背后半平面硬顶（LOOK-R2 O2 已合入，`render/camera.js`；按实现登记）

**产品承诺**：固定人物视角下镜头永远待在角色**背后**，任何转法都绕不到正脸。§15.1 的跟随角选源只保证**目标**机位在背后；弹簧阻尼只是「慢一点」，720°/s 级快速转身时实际机位仍会被甩出背后半平面——所以渲染侧另有一条**硬顶**，它是钳制不是又一层弹簧。

- **几何**：背后半平面按 `LOCKED_YAW_SPAN = π/2 − 0.1` rad（≈ 84°）判——机位方位角允许落后角色面向至多这个夹角。0.1 rad 余量让「机位到角色前向的投影」恒为确定的负数（restDist 7.1 上约 −0.7m），断言拿到的不是可正可负的 0。
- **夹两处**：目标 yaw 与机位本体各夹各的——机位弹簧（λ 6.2）比 yaw 弹簧（7.5）跟得还慢，只夹 yaw 时持续快转仍能把实际机位甩出界。机位收回时绕 focus **只转不推**：半径与高度不动，构图（距离、俯角）不变，读感是「镜头被转身推着走」。
- **迟滞（整只让路）**：**上一帧还在半平面里**才拽得动这一帧（yaw 与机位各记各的迟滞位）；生效带宽 = `LOCKED_HOLD_RATE 30 rad/s` × dt 夹进 [0.25, 1.2] rad。30 rad/s ≈ 1700°/s，真人甩鼠标的持续转速远在其下——常规转速（≤270°/s）下硬顶逐位不介入、手感一行没改；一帧落后超出带宽 = 朝向被瞬移（切 V 那一帧壳层还没把角色转到视线上、重生改写朝向），硬拽就是一记甩镜，硬顶整只让路、归位交给弹簧。
- **free 不夹**：renderer 只在 locked 时把角色 yaw 当 `behindYaw` 传进 `camera.update`，free 不传——自由视角本来就允许绕到侧面 / 正脸（契约 §14-35 双分支）。

锁测：`render/look.test.js`「locked 背后半平面硬顶（camera.js）」与「同一角色 yaw，free 与 locked 的机位分野」（720°/s 甩视角 locked 恒在背后、free 同一甩法不受硬顶；常规转速逐位不介入）。`LOCKED_YAW_SPAN` / `LOCKED_HOLD_*` 是 R2 O2 域实现常量，仅 locked（`behindYaw`）生效。LOOK-R3 O2 另加跟随角咬合闸 `BEHIND_LIMIT` / `BEHIND_SHELL`（`holdBehindLimit`，state `behindHeld`）：急甩 8 rad/s 也不翻正脸，重生级 40m 追赶途中松闸不横跳；两闸都跑。`CAMERA` 表（§15.2）已登记 `lockedYawSpan` / `lockedHold*`（R2）与 `behindLimit` / `behindShell`（R3）及 snap 两阈值，`tuning.test.js` 对照 render 同数并锁死 `lockedYawSpan > behindLimit` 的两闸关系（复盘 P1-6）。

### 15.4 切视角模式不传送机位（LOOK-R2 O2 已合入；按实现登记）

locked ↔ free 换的是「机位绕谁转」（§14-35 选源），角色还站在原地——镜头顺着弹簧转过去即可，**不吸附**。snap（§15.2，ADR-39）只给「世界位置整个换了一处」的传送时刻：过门 hub ↔ arena、结算回程、换跟随目标、观战切回跟随、开局第一帧，外加单帧位移超阈值的自动保险；`renderer.setLookMode` 与 payload 携 `lookMode` 都**不武装吸附**——硬吸一下就成了过门那种瞬移。

- free 里把视线转到正脸再切回 locked：归位走**纯弹簧**——§15.3 的硬顶因「落后太多 = 朝向被瞬移」整只让路，逐帧走位与纯弹簧逐位相同，不甩镜、不飞跃。
- 切模式与过门互不干扰：换区照常武装吸附，切模式帧与同区帧都不武装——两件事各归各。
- 锁测：`render/look.test.js`「切视角模式不吸附机位」四测。实机复核走冒烟台（`render/smoke.js`）：`?look=locked|free` 定起始模式，运行时按 V（与壳层同键位）来回切，镜头只顺弹簧转过去。

### 15.5 free 急转不甩镜：背后闸的放手带（打磨轮 LOOK-R4 O2 已合入，`render/camera.js`；按实现登记）

**产品承诺**：自由视角里怎么甩鼠标，画面转的就是你甩的那一下——机位不再自己补一记十几米的横甩。固定视角的「钉在背后」一个字没变（§15.3 两道闸照跑，硬顶仍是硬顶）。

毛病出在哪（本轮复盘 P0）：free 的跟随角直接来自鼠标增量，没有速率限制，一帧跨过半圈是常态。§15.3 的跟随角咬合闸（`behindLimit`）此时若照旧把机位硬按回锥边，机位要绕着焦点整段横旋——restDist 7.1 下一帧转过 π 就是 2 × 7.1 × sin((π − 75°)/2) ≈ **11.2m** 的甩镜，比它要防的毛病还难看。

**放手带**（`behindReleaseSlack`，free 专用）：两条判据任一成立，闸整只松手——机位这一帧原地不动，交给弹簧自己荡回背后（约 0.1m/帧量级）：

- 跟随角这一帧自己转过了带宽——鼠标猛甩、或壳层改写视线；
- 偏离已超出闸宽 + 带宽——角没跳但焦点被搬走了（人被瞬移到镜头跟前、半径还没出 §15.3 的工作壳层）。

带宽与 §15.3 硬顶**同源**（同一个 `lockedHoldSlack`：30 rad/s × dt 夹进 [0.25, 1.2] rad，60fps 下约 0.5 rad ≈ 28.6°/帧）：真人持续甩镜远在这条线之下，常规转速闸照旧咬合、手感一行没变；掉帧时 dt 变大、带宽跟着放宽。松手后要等机位重新荡进锥内（偏离 ≤ `behindLimit`）才重新咬合——回程不会在带宽边界上再补第二记甩镜。

**只给 free，locked 照旧硬顶**：locked 的跟随角是角色自己的朝向（`render/characters.js` 另有转身阻尼），一帧跨不过带宽；「绕不到正脸」是硬承诺（§15.3），那条路上闸必须是硬顶。数值零改动：`behindLimit` / `behindShell` 与 §15.3 各常量全部原数，本节只加「什么时候松手」。锁测：`render/look-camera.test.js`「free 视线一帧跨过闸宽：闸让路，不绕焦点横旋」——一帧甩过 π 的单帧位移与切 V 同级而非十来米横旋；让路那一帧机位原地不动、闸当场松开；locked 同一记猛拉照旧被硬顶按在背后；放手带与 R2 硬顶同源、掉帧一起放宽。

### 15.6 重生读感：人瞬移、镜头追（模型 16m ≠ 机位 60m；打磨轮 LOOK-R4 登记）

被扇下岛再回来那一下，画面里发生的是两件不同的事：**人**是「啪」地闪现在台心——角色模型单帧挪位超过 **16m**（`render/characters.js` 的 `TELEPORT_DISTANCE`，数据层登记名 `CHARACTERS.teleportDistance`）就直接跳过去、不许滑步漂移，重生从坠点回台心通常远超这个数；**镜头**不跳——机位保留一段弹簧甩镜追过去，只有超过 **60m**（`snapTeleport`，§15.2）的跨区传送（过门 hub ↔ 裂岛）才让机位瞬移。两个阈值**故意不是同一个数**：局内重生位移封在 2×arenaRadius = 40m，恰好落在 16 与 60 之间——人已经站回场里、镜头甩过去找他，有「被丢回战场」的分量，又不会黑一下切画面。登记与对照断言见 §15.2（`CHARACTERS.teleportDistance`，本轮 F1 已入 `tuning.js`，`tuning.test.js` 锁两边同数）；谁都不许把两个数改成同一个。

### 15.7 重获指针锁的那一下，左键不扇（打磨轮 LOOK-R4 O4 已合入，`input/index.js`）

暂停、失焦、结算都会把鼠标指针锁还给系统；玩家回来点一下画布重新抓锁，浏览器只当它是一次普通左键。修掉之前，这一下既申请了锁又扇了一巴掌——大厅里被 `inHub` 挡着看不出来，裂岛里就是一记空挥、白吃一次冷却（复盘 P1）。现在这一下**整只吞掉**：边沿不补、按住位也不置位（否则锁一到手那一帧就成了「按住连扇」，白挥只是从一下变成一串），它只干一件事——把锁抓回来。吞的判据与真正去申请锁的条件**逐字一致**：想要锁（设置「指针锁定」开着）、此刻没锁、环境支持锁；少一条都算正常左键，照常扇击兼拖拽——玩家关了指针锁定、或浏览器没这个 API 时，行为一分不变。

## 16. 五拍旁白（`story.js`，P2 内容轮）

说话的只有木棉——教学掌兼引路人，短句、不训话。`src/data/story.js` 导出 `STORY`（5 拍，深冻结）/ `STORY_BY_ID`，`data/index.js` 已转发；每拍 `id / trigger / lines / once` 四字段，全部 `once: true`（每份存档只放一次，已放列表归存档层，本表不管状态）。

| 拍 | id | trigger | 句数 |
| --- | --- | --- | --- |
| 初来 | `arrive` | `hub_first_enter` 第一次进走道 | 3 |
| 拾掌 | `first_glove` | `glove_first_pickup` 第一次选定主掌 | 3 |
| 过门 | `portal` | `portal_first_cross` 第一次穿门 | 3 |
| 首杀或首坠 | `first_blood` | `first_kill_or_fall` 首杀**或**首坠，先到先触发（共用一拍，输赢都有话说） | 3 |
| 首胜 | `first_win` | `match_first_win` 第一次胜场 | 4 |

**纪律**（`src/data/story.test.js` 锁死）：全线合计 ≤ 20 句（现 16）、单句 ≤ 18 字——旁白是佐料不是主菜，一拍三四句就闭嘴。触发词只登记语义，事件接线（何时命中 trigger、上屏样式、已放列表落档）归 UI/core 域，随下一轮接线；接线前本表是纯登记，不影响任何现有流程。

### 16.1 玩家读到的故事线：木棉的五拍掌语（F3 落文，台词以 `story.js` 为准）

「掌语」= 掌会说话。全线只有一位说话人：**木棉**——你的第一只掌、全表数值基准（§5），也是唯一从走道陪你走进裂岛的角色。五拍连读是一条极简的师徒线，只在五个「第一次」各开口一次，之后永远闭嘴：

1. **初来**：定世界观——你是被风吹到这儿的，「这条走道尽头，有一扇门」；不催、不训，「先别急，一步一步来」。
2. **拾掌**：定关系——「掌一暖，就认主了」，掌是认主的伙伴不是捡起的武器；「别怕它重，重的是心事」顺手立住木棉的温度。
3. **过门**：定规则——「掉下去可不算数」「记住脚下，比记住对手要紧」，把 §4 的出岛判死翻成一句叮嘱；「去吧，我陪着你」把门变成有人送行的门。
4. **首杀或首坠**（共用一拍、先到先触发）：定态度——同一段词两头都接得住：首杀时「岛缘不讲情面」是冷冷的见证，首坠时「下去的人不是输，是学得慢」是不煽情的安慰；收在「揉揉掌心，继续」，输赢都往前走。
5. **首胜**：收束——「胜负是浪，你是船」给玩法定调（单局输赢不是这游戏的重量），末句「……我也有点想睡了」是全线唯一一次木棉露出自己；故事到此把话筒还给玩法，此后再无剧情打扰。

写作纪律沿用 §16（合计 ≤ 20 句、单句 ≤ 18 字、全部 once）之外再加一条：**说话权是木棉的人设资产**——生涯四掌（§5.1）与首发七掌都不说话，新增台词先问「这句非木棉说不可吗」，答不上来就不写。木棉不解说数值、不复述 HUD 已有的信息，它只负责在玩家心里立一个「有人陪着」的锚。

## 17. 玩家读本（P2 内容轮，F3——给会打游戏、不读代码的人）

本节**零新数值、零新机制**：只把本轮改动翻成玩家语言，出处在括号里；与技术节冲突时以 `src/data/**` 与对应节为准。

**1. 没有血条，看「起飞表」。** 你不会被打死，只会被打飞。挨打不掉血，掉的是「站得住」：连挨几掌人会越来越飘，同一掌能把你送出两倍多远（§4.1，倍率封顶 ×2.6）。躲开接触一阵子会慢慢缓回来；掉下岛重生直接清零。表盘 HUD **F2 已接线**（§4.1，`.yz-knock` 读起飞表）；判断自己危不危险：这掌被扇得比刚才远，就该跑了。

**2. 挨打只是「还不了手」，不是「动不了」。** 被扇中后 0.32 秒出不了招——扇击、技能、冲刺都锁；但走位从来不锁，被扇飞照样滑、方向键照样能拽落点（§3、§4 DI）。最快的掌冷却 0.5s，所以最坏也有 0.18s 空档还手：贴脸没有无限连，挨一掌别慌。

**3. 重生无敌会结束了。** 掉下去 1.2 秒后回台心，带 1 秒无敌——到点准时消失。之前有个 bug 让这层无敌永不结束（重生过的人谁都打不中，满场互相挥空），已修（§1）。规则从此只有一句：重生第 1 秒放心落位，之后你就是普通人。

**4. 木棉会跟你说话——一共只说五次。** 第一次进走道、第一次握掌、第一次穿门、第一次击杀或坠落、第一次赢，各一小段短句，每份存档只放一次（§16/§16.1）。这是全游戏唯一的剧情线，说话的只有你的第一只掌；它不教数值，只陪着你。

**5. 四只新掌，靠「玩下去」解锁。** 铁茧（重掌带反击）= 累计扇中 300 掌；渡鸦（快掌带冲刺）= 累计穿门 20 次；常胜（拉人重推）= 累计赢 10 场；不倒（守脚下连击）= 累计打满 25 场（§5.1/§9.1）。四条都落在 20 局上下，不考操作只考坚持，先解锁哪只看你怎么玩。注意：**走道台座仍是原来 8 座**——新掌不在走道上，解锁后在 **2D 配掌台**（选掌网格）里换上（§12）。

**6. 打击感会更重，但不会更「卡」。** 命中定格封死在 0.12 秒，这条红线不动（§3）。加重走的是别的路：本轮给「重击」立了一条统一门槛（力道 ≥ 12 算重，与砸碎台面同一条线），重的那几掌特效、音效跟着加重，定格档也在向这条线对齐（§3），轻掌的节奏一帧不欠；再加上起飞表让后半局每掌更飘——爽感往上走，手上的快不打折。

——完。实现方（Opus-1/3）如需新增字段，在 `src/data` 内追加并同步本文；不要在 sim/combat 里写裸数字。
