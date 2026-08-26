# FX Hooks 席位笔记 — game.js 侧特效事件

MODEL_SLUG: claude-opus-5-thinking-high-fast

## 改动文件（仅限本席位所有权范围）

- `warcraft3-td/js/game.js`
- `.agent_workspace/notes-fx-hooks.md`（本文件）

`render.js` / `hud.js` / `main.js` / `css` / `tests` / `data.js` **零改动**。
`data.js` 未改：塔与怪本来就带 `color`，英雄带 `def.color`，特效配色直接复用，
不需要新增字段。

## 对外契约

保持不变：`tryBuild` / `upgradeSelected` / `sellSelected` / `startNextWave` /
`update` / `snapshot` / `cast` / `_hitCreep`。
`snapshot().towers` 语义不变（仍只数非 `temp` 塔）。伤害公式、造价、波次血量、
利息、木材、退款比例全部未动。

## 1. `hero._hitFlash`

`creep._hitFlash` 原本只在 `_hitCreep` 里设置。现在英雄近战挨打时同样置位：

- `_heroTakeDamage()` 在扣血后 `h._hitFlash = 0.16`（常量 `HERO_HIT_FLASH`）。
- `_tickHero()` 每帧 `h._hitFlash = max(0, h._hitFlash - dt)`，**在 game 侧自行衰减**。
  这样即使 render.js 还没接这个字段，数值也不会卡住；渲染器若像 creep 那样再减一次
  也无害（只是闪得快一点）。
- `_heroDown()` / `_reviveHero()` 会清零。
- 初始值在 `_spawnHero()` 里给了 `_hitFlash: 0`。

渲染侧接法与 creep 完全一致：`this._hitWash(ctx, h._hitFlash)`，
在 `_drawHero` 的 `ctx.translate(x, y)` 之后调用即可。

## 2. FX 事件流

所有特效统一走 `Game.prototype.fxEmit(name, kind, x, y, opts)`，
产出的条目 **只会是 render.js 已经会画的三种 kind**：`spark` / `ring` / `text`。
未知 kind 直接返回 `null`，不入队。

条目字段：

| 字段 | 说明 |
|------|------|
| `kind` | `"spark"` / `"ring"` / `"text"` |
| `name` | 触发这条特效的玩法时刻（见下表），渲染器可按名字特化，不认识就当普通 kind 画 |
| `x` `y` | 世界坐标 |
| `color` | 十六进制色，默认 `#ffe082` |
| `life` `max` | 剩余 / 初始寿命，秒 |
| `r` | 半径提示。ring 是环半径，spark 是爆散尺度 |
| `text` | 仅 `text` kind |
| `vy` | 仅 `text` kind，向上飘的速度 |
| `banner` | 仅横幅，标记「不可被裁剪」 |

便捷封装（签名向后兼容，旧调用照常工作）：

- `banner(msg, color)` — 日志 + 中央大横幅（`banner: true`）
- `float(x, y, text, color)` — 飘字
- `spark(x, y, color, r, life)` — 后两参新增，可省略
- `ring(x, y, color, life, r)`
- `fxBurst(name, x, y, {color, ring, r, sparkR, life})` — 环 + 火花一对，通用「炸开」

### 事件名清单

| name | kind | 触发点 |
|------|------|--------|
| `build` | ring + spark | `tryBuild` 建塔成功，另附 `-造价` 飘字 |
| `upgrade` | ring + spark | `upgradeSelected`，另附 `T2` / `T3` 飘字 |
| `sell` | ring + spark | `sellSelected`，配合原有 `+退款` 飘字 |
| `towerFire` | spark | `_fire` 炮口闪光，位置沿射击方向偏出塔身 |
| `impact` | spark | `_hitCreep` 弹道命中，颜色取自攻击方 `def.color`；克制倍率 ≥1.4 时 `r` 更大 |
| `kill` | ring + spark | `_killCreep`，首领用更大更红的环 |
| `leak` | ring + spark | `_leak` 漏怪，另附 `-N 生命` 飘字（首领扣 2） |
| `heroAttack` | spark | `_heroAttack` 普攻，落在英雄与目标之间 55% 处 |
| `heroHit` | spark | `_heroTakeDamage` 英雄挨打，节流 0.12s 一次 |
| `heroCast` | ring + spark | `cast()` 施法成功（含 R） |
| `heroUlt` | ring ×2 + spark | `_castR` 四个大招：外环 = 技能半径，内环 = 50% 半径 |
| `heroCyclone` | ring | 剑圣「钢铁旋风」持续期间的旋转环，节流 0.18s 一次，`r` = 技能半径 |
| `heroBuff` | ring (+spark) | 剑圣暴击/镜像、恶魔猎手变身等自身增益 |
| `heroAura` | ring | W 光环覆盖范围（半径 = `def.radius`） |
| `spellHit` | ring + spark | Q 技能命中目标 |
| `heroDown` | ring + spark | 英雄倒地（倒地点） |
| `heroRevive` | ring + spark | 英雄在要塞重生 |
| `summon` | ring + spark | 亡者复生召唤骷髅 |
| `summonExpire` | ring | 临时单位到期消散 |
| `portalCharge` | ring | 首领波前传送门蓄能脉冲 |
| `bossPortal` | ring | 首领波开始时的传送门大环 |
| `bossSpawn` | ring + spark | 首领踏入战场 |
| `bossEnrage` | ring + spark | 首领狂暴 |
| `bossStompWarn` | ring | 战争践踏预警，`life = stomp.warn`、`r = stomp.radius` |
| `bossStomp` | ring ×2 + spark | 践踏落地：外环 = 半径，内环 = 55% 半径；每座被震晕的塔头顶一枚 spark |
| `banner` | text | 所有 `banner()` 播报 |
| `float` | text | 所有 `float()` 飘字（伤害数字、赏金、STUN、AMBUSH…） |
| `spark` / `ring` | spark / ring | 直接调用旧 helper 且未指定语义时的兜底名 |

### 给渲染器的建议

- `towerFire` 目前会走 render.js 里 spark 分支的 `_hitBurst`，也就是会掉一滴血渍粒子。
  炮口闪光更适合只出 `glow` + 几根火星，建议在 `_drawFx` 里按 `f.name === "towerFire"`
  分流。同理 `build` / `upgrade` / `sell` 更适合金色向上的碎屑而不是血。
- `bossStomp` 和 `heroUlt` 各自会在同一帧同心发两个 `ring`，按 `f.r` 差异画就是现成的
  双层冲击波；配合 `this.shake` 可以直接加屏震。
- `heroCyclone` 每 0.18s 一个环，寿命 0.28s，所以任意时刻场上有 1~2 个环，
  直接画就是旋风的层叠感；想要更密可以在渲染侧自行补间。
- `kill` 的 spark 颜色已经是怪物自身 `c.color`，可以据此染死亡尘雾。
- `heroHit` 已按 0.12s 节流，直接当「被咬一口」的火星用即可，不必再节流。

## 3. 数量上限

`_pushFx` 在 `fx.length > 640` 时调用 `_trimFx()`，把最老的非 banner 条目裁到 480 条。
横幅永远不被裁掉（`banner: true`）。压测：连续 10000 次 `fxEmit` 后 `fx` 稳定在 503 条，
两条横幅都还在；真实 12 波对局里峰值只有 99 条。

注意 `_trimFx` 会**替换 `this.fx` 的数组引用**（不是原地 splice）。render.js 每帧读
`game.fx`，没问题；如果谁缓存了这个数组引用需要改成每帧重取。条目对象本身不换，
渲染器打在条目上的 `f._burst` 之类标记仍然有效。

## 4. 验证

在 FX 钩子首次落地的 `b3f4094` 上：

- `node tests/run.mjs` → 45 passed, 0 failed
- `node tests/edges.mjs` → 6 passed, 0 failed
- `node tests/bench.mjs` → 40 塔 / 79 怪，0.182 ms/tick（改动前 0.175），gold / lives 与改前一字不差
- 行为护栏（`/tmp/fxguard.mjs`，未入库）：4 个英雄各跑 70s 完整对局、首领践踏波、
  英雄堵在路上挨打、建造/升级/出售/木材账本、整波漏光到失败。改前改后逐字段 diff，
  **唯一差异就是新增的 `hero._hitFlash`（null → 0.16）**，金币 / 生命 / 血量 / 波次 /
  塔冷却 / 退款 / `snapshot()` 全部一致。
- 浏览器实测（Chrome + CDP 驱动真实 UI）：一局里采集到 26 种 `name:kind` 组合，
  0 个不支持的 kind、0 条畸形条目；英雄近战时 60 次采样有 17 次 `_hitFlash > 0`。
- 工件：`game_fx_hooks_build_combat_hero_flash_boss_stomp_leak.mp4`、
  `hero_hit_flash_and_live_fx_event_stream.webp`、
  `leak_fx_ring_and_life_lost_float_at_keep.webp`、`fx_hooks_verification.log`。

`heroUlt` / `heroCyclone` 是在平衡席位的 `2a3645c`（R 大招 + 旋风）之上补的：

- 该 head 上 `node tests/run.mjs` → 94 passed、`node tests/edges.mjs` → 6 passed、
  `tests/bench.mjs` 0.201 ms/tick。
- 同一套行为护栏在 `2a3645c` 与补钩子之后 **逐字节完全一致**（这次连 `hero._hitFlash`
  也没差，因为 `2a3645c` 已经带上了它）。
- 四个英雄各自 `cast("r")` 均确认发出 `heroUlt:ring` ×2 + `heroUlt:spark`；
  剑圣旋风期间确认持续发出 `heroCyclone:ring`。

## 5. 留给下一轮

- 闪电链 / 溅射目前只在每个受击目标上出 `impact`，没有链路本身的事件。
  若渲染器想画完整闪电链，可以在 `_tickProjectiles` 的 chain 循环里加一个
  `name: "chainLink"` 的事件并带上 `x2` / `y2` —— 但那需要 render.js 支持一种新 kind，
  本轮刻意没做，以免破坏「只用现有三种 kind」的约定。
- `towerFire` 每发一枚 spark，40 塔齐射时每帧约 40 条事件。已被 640 上限兜住，
  但如果渲染器为它生成大量粒子，建议在渲染侧再按距离/视口做剔除。
