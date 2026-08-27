# 异掌 · GDD（Round 1 玩法数值细则）

Fable-3 出品。本文只做一件事：把 DESIGN_SEED 定下的核心循环换算成**可实现、可测试的数字与公式**。
核心循环、操作、视觉规范见 `.agent_workspace/yizhang/DESIGN_SEED.md` 与 `docs/VISUAL_HANDBOOK.md`，本文不复述、不推翻。

**数值唯一来源是 `src/data/**`**。本文给出推导与意图；若文档与数据文件冲突，以数据文件为准并回修本文。
单位约定：米、秒、米/秒；角度用度。

数据文件索引：

| 文件 | 导出 | 内容 |
| --- | --- | --- |
| `src/data/gloves.js` | `GLOVES` `GLOVE_BY_ID` `MATCH` `isGloveUnlocked` | 8 掌 + 契约对局常量 + 解锁判定 |
| `src/data/tuning.js` | `MOVEMENT` `KNOCKBACK` `METER` `RULES` | 运动 / 击退 / 掌意 / 规则扩展 |
| `src/data/skills.js` | `SKILLS` `SKILL_IDS` `SKILL_COMBAT_ALIASES` | 7 个主动技参数 + data→combat id 完整映射（§6） |
| `src/data/tiles.js` | `TILE` | 台面碎裂（方格拓扑，对齐 sim） |
| `src/data/bots.js` | `BOT_PERSONAS` | 3 种 Bot 人格（含互异 `skinId`） |
| `src/data/unlocks.js` | `UNLOCKS` | 局内解锁挑战 |
| `src/data/hub.js` | `HUB` | 安全区大厅布局：8 座坐标/朝向、交互半径、走道 AABB、传送门（§12） |

---

## 1. 对局常量

`MATCH` 与 CONTRACT.md 一字不差：`dt 1/60`、`arenaRadius 20`、`playerRadius 0.7`、`playerHeight 2`、`fallY -8`、`respawnDelay 1.2`、`invulnTime 1.0`、`matchSeconds 240`、`killsToWin 7`、`switchLock 0.4`、`awakenDuration 8`。

契约之外的规则常量在 `RULES`：

- **击杀归属**：坠落前 `killCreditSeconds = 4` 秒内最后打中你的人记击杀；超时算自坠（deaths+1、断连胜、无人得分）。
- **重生**：`respawnDelay` 后落在台心 `r < respawnCoreRadius = 4` 随机点，`invulnTime` 秒无敌。
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
- **不可无限连**：最快的掌（疾风 cd 0.5）命中后，受害者仍有 `0.5 − 0.32 = 0.18s` 行动权 + DI，追杀要走位跟上。
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

## 9. 局内解锁挑战（`unlocks.js`）

木棉默认解锁，其余 7 掌全部**单局内**可判定（事件规格见文件头注释），难度即教学梯度。

判定唯一入口是数据层的 `isGloveUnlocked(id, progress)`（`gloves.js` 导出、`data/index.js` 转发；UI/core 读完存档调这里，不要自己比对）：`unlock: "default"`（木棉）恒 true，未知 id 恒 false；其余按 `UNLOCKS` 对 `progress` 判定，兼容三种形状——存档的 `{ unlocked: GloveId[] }`、扁平旗标 `{ [unlockId 或 gloveId]: true }`、挑战计数 `{ challenges: { [unlockId]: n } }`（n ≥ 该挑战 `count` 即解锁）。

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

## 10. Bot 人格（`bots.js`）

无血条，因此「残血」统一映射为**台权劣势**（贴边距离 + 硬直状态），由 `targetBias` 加权：

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
| 觉醒太频繁 | `METER.onSlapHit 0.12` | 降 0.01 ≈ 多打一掌 |
| 拆台太快/太慢 | `TILE.baseHp 120` 或技能 `tileDamage` | 保持「磐石 3 砸一块」的读感 |
| Bot 太强/太弱 | `mistakeRate` / `reactionSeconds` | 别动数值表，动人格 |

## 12. 安全区大厅与走道选掌（`hub.js`，HUB-R1，ADR-30）

布局唯一来源是 `src/data/hub.js` 的 `HUB`（契约 §3.3）：sim 经 `installData` / `installHubLayout` 接管后快照进 `state.hub.layout`，render/ui 从 `view.hub` 读，**任何模块不得硬编码第二份坐标**。坐标与 O1 `sim/hub.js` 内置默认表逐字段对齐——data 表缺席时行为不变，落地后 `deps.usingDataHub === true`，唯一的表内差异是 `pedestals` 数组顺序改为 GLOVES 图鉴顺序（契约硬约束 1；O1 默认表按排交错，坐标相同）。

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

消费分两层，各管各的：**对象级**兜底走数据层 `resolveSkin(id)`（未知/缺省 → `SKIN_BY_ID[DEFAULT_SKIN_ID]`，契约 §14-17）；**id 级**归一（存档往返、`assignSkins` 分配）仍走壳层 `normalizeSkinId(id, resolveSkins(data))`，壳层零改动。

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

——完。实现方（Opus-1/3）如需新增字段，在 `src/data` 内追加并同步本文；不要在 sim/combat 里写裸数字。
