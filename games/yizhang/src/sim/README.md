# src/sim · 异掌模拟层

纯逻辑，**不 import three、不碰 DOM**。渲染只读 `getView(state)` 的快照。

## 契约 API

```js
import { createMatch, step, getView, isMatchOver } from "./sim/index.js";

const state = createMatch({ seed: 1, gloveId: "cotton", offhandId: "granite", botCount: 3 });
step(state, { p0: input }, 1 / 60); // 原地更新并返回 state
const view = getView(state); // 纯 JSON 快照
const { over, winnerId, reason } = isMatchOver(state);
```

- **开局在安全区**：`createMatch` 缺省 `phase: "hub"`。要直接进裂岛（旧探针 / 纯战斗测试）传
  `phase: "arena"`、`skipHub: true` 或 `config: { skipHub: true }`。
- 人类固定 `p0`，Bot 是 `b0`、`b1`、`b2`（默认 3 个，`botCount` 可改）。
- `inputs` 缺省视为零输入；`yaw` 传 `null`/缺省表示保持当前朝向（Bot 不给输入不会被扭头）。
- `step` 的 `dt` 大于 1/60 会自动切子步，60Hz 与 30Hz 结果一致。
- `state` 全是纯数据，`structuredClone(state)` 后继续 `step` 结果完全一致。
- 对局结束后 `step` 不会自己停，`isMatchOver(state).over` 为真时由主循环决定收尾（结算界面/继续演出）。

### Input

```js
{ moveX, moveZ, yaw, slap, skill, switchGlove, dash, jump, moveSpace?, interact?, interactSlot? }
```

`moveX/moveZ` 默认是世界系（input 层已按相机 yaw 转换）；传 `moveSpace: 'local'` 则由 sim 按玩家 yaw 旋转。

`interact`（E / 触控「选」）与 `interactSlot`（`'main' | 'off'`）只在安全区里有意义，是**可选键**：
`ZERO_INPUT` 仍然是原来那 8 键（`src/ai` 的键集断言以它为基准，Bot 不需要 interact），
壳层要一个完整形状就用 `HUB_ZERO_INPUT = { ...ZERO_INPUT, interact: false, interactSlot: null }`。

## 安全区（hub）与裂岛（arena）

`view.phase ∈ { "hub", "arena" }`。两块空间**共用同一套世界坐标**，水平错开：裂岛是原点半径 20
的圆盘，安全区走道在 z ≈ -120。规则按**实体所处空间**生效，`phase` 只决定新出生点与传送门通不通：

| | 安全区体积内（`hub.zone`） | 体积外 |
| --- | --- | --- |
| 地面 | 实心走道 + 隐形墙 + 台座柱体 | 台块，碎了就漏下去 |
| 掉落 KO | 没有 | `y < fallY` 或越缘无支撑即判 |
| 击退 | 不吃（combat 已写进速度的冲量会被退回） | 照常 |
| 碎地 | 走道下没有台块，砸不到 | 照常 |

所以摆到裂岛坐标的实体永远按裂岛规则结算，`phase` 是什么都一样——老测试与老探针直接摆位就还是老行为。

```js
const s = createMatch({ seed: 1, unlocked: ["cotton", "frost"] }); // 缺省进 hub
step(s, { p0: { ...HUB_ZERO_INPUT, moveZ: -1, interact: true } }, 1 / 60);

s.phase;                    // "hub"
getView(s).hub.focusGloveId; // 靠近半径（2m）内的那只掌，没有就是 null
getView(s).hub.portalReady;  // 选过主掌没有
```

- **选掌**：靠近台座（`hub.interactRadius`）+ `interact` 上升沿装备。顺序是**先主后副**：
  主掌空 → 装主掌；已是副掌 → 提为主掌（原主掌退副掌）；副掌空 → 装副掌；两格满 → 换副掌。
  `interactSlot` 可直接指定槽位。未解锁的掌只发 `hubLocked` 事件，不装备。
- **解锁**：`createMatch({ unlocked })` 收数组 / Set / `{id:true}` / `"all"`；缺省是
  `unlock === "default"` 的掌加上调用方明确带进来的 `gloveId` / `offhandId`。
  局内解锁后壳层调 `setHubUnlocked(state, ids)`。
- **传送**：选过主掌之后走进传送门半径就切 `phase = "arena"`，人落到裂岛出生点、带 1s 无敌，
  **loadout 原样保留**，并且把对局计时重置成满时长（挑掌的时间不吃对局时长）。
  没选主掌时靠近只发 `hubPortalNear { ready: false }`。
  手动切换用 `enterArena(state, player?)` / `enterHub(state, player?)`（Round 2 回程）。
- **Bot 不进安全区**：`phase: "hub"` 时只有真人被摆到走道，Bot 留在裂岛出生点等着。

### 布局表

8 座台座（两排各 4 座：左排木棉/磐石/疾风/冰霜，右排弹簧/分身/磁掌/陨掌）目前是 sim 内置的
`DEFAULT_HUB_LAYOUT`（`hub.js`，`source: "sim-default"`）。Fable-3 的 `src/data/hub.js` 合入后
由装配层 `installHubLayout(dataHub.HUB)`（或整包 `installData(dataModule)`，会自动认 `HUB`）接管，
sim 不去 import 一个可能不存在的模块。`getHubLayout()` 读当前生效的那张表。

`view.hub`：

```js
{
  layoutId, source, origin, floorY, spawn, walkway, zone,
  portal: { x, y, z, radius, ready, near },
  interactRadius, pedestalRadius, pedestalHeight,
  focusGloveId, portalReady, portalNear, mainGloveId, offGloveId, unlocked: [...],
  pedestals: [{
    gloveId, x, y, z, yaw,          // y 是座基落点，展示掌摆在 y + height
    row, index, height, radius,
    name, color, desc, role,        // 靠近说明牌直接用
    unlock, unlocked,
    selected,                       // 布尔：这只掌在不在配装里
    slot,                           // 'main' | 'off' | null
    focused,
  }]
}
```

### 朝向约定（Round 2 冻结）

`yaw = 0` 面向 **-Z**：渲染端直接 `mesh.rotation.y = player.yaw`。

```js
import { FACE, forwardX, forwardZ, rightX, rightZ, yawFromDir } from "./sim/index.js";

FACE; // { convention: "yaw0:-Z", forwardX: 0, forwardZ: -1, rightX: 1, rightZ: 0, combatOffset: Math.PI }
forwardX(yaw) === -Math.sin(yaw);
forwardZ(yaw) === -Math.cos(yaw);
yawFromDir(dx, dz) === Math.atan2(-dx, -dz); // 世界方向 -> yaw，上面两个的逆
```

面向 +X 是 `yaw = -PI/2`。**要瞄准某个目标就用 `yawFromDir(target.x - me.x, target.z - me.z)`**，
不要用 `atan2(dx, dz)`——那是 `src/combat/util.js` 内部的 +Z 基准，两者差 `FACE.combatOffset`（PI）。
sim 与 combat 之间的相位换算只在 `combat-bridge.js` 里发生一次，别的地方不要再各自补偿。

### 事件

`state.events` / `view.events` 每次 `step` 清空重填，供渲染与音频消费：
`slapStart` `slap` `hit` `ko` `respawn` `jump` `dash` `switch` `skill` `awaken` `awakenEnd` `tileCrack` `tileBreak` `matchOver`；
安全区另有 `hubFocus` `hubEquip` `hubLocked` `hubPortalNear` `enterArena` `enterHub`。

## data / combat 接线

`deps.js` **静态** import `../data/gloves.js` 与 `../combat/index.js`，开箱即用，
不需要 main 或测试做任何注入，sim 侧也不再有第二套兜底战斗。

```js
import { createMatch, step } from "./sim/index.js"; // 8 掌数值与 8 个主动技已经在局里
```

`installData(mod)` / `installCombat(mod)` 只给测试塞替身，`resetDeps()` 回到真实模块。

探针与装配层习惯把真身再装一遍（`installCombat(await import("../combat/index.js"))`）。
那不是替身：deps 认出真身（或只做转发的薄适配器）后**折回静态桥**——朝向相位与命中形状的换算
只在 `combat-bridge.js` 做过一次，绕过去技能就全哑——`usingRealCombat` / `usingRealData` 保持 `true`。
只有认不出的表 / 缺件的函数集才算替身，那时两个布尔才是 `false`。

### combat-bridge

`combat-bridge.js` 是 sim 与 `src/combat` 之间**唯一**的适配点，收敛三处约定差：

| 差异 | 处理 |
| --- | --- |
| combat 的 `yaw=0` 面向 +Z | 进出 combat 时整体加/减 `FACE.combatOffset` |
| 掌表的 `skillId` 三套词表：data（`iron_pull`）、combat handler（`magnetPull`）、文档短名（`pull`） | `SKILL_ALIAS` 三套都收，`none`/空值归一成 `"none"` |
| combat 命中是 `{ id, impulse }` 且冲量已写进目标速度 | 转成 `{ targetId, impulse, applied: true }` |
| combat 有自己的 `cd` / `busyUntil` | 出招时机由 sim 的 attack 状态机独占，调用前清零，避免两套冷却互卡 |
| combat 的事件字段名（`attackerId` / `playerId`）与碎地记账 | 收进暂存区翻译成 sim 事件，并补 `brokenCount` / `stats.tilesBroken` |

`resolveSlap` 给 sim 的返回约定：

```js
{ hits: [{ targetId, power, impulse: { x, y, z }, hitX, hitZ, tile, statuses, applied }] }
```

`applied: true` 表示冲量已经写进目标速度，sim 只补记账（失控窗口 `kbT`、`knockScale`、连段、事件），
不重复推人。掌意与觉醒完全由 combat 记账，sim 只在击杀时补 `PHYSICS.meterPerKill`。

## 物理要点

- 惯性：有限加速度 + 指数摩擦；击退期间 `kbT` 内失控、摩擦降到 1.15，人才滑得出去。
- 击退：水平速度冲量 + 小抬升，受击方 `knockScale` 每次 +0.075（最高 3.2），落地回一点。
- 边缘低护栏：站着走不出去；**`kbT > 0`（被扇飞）时护栏完全失效**，击退必须能把人送出岛。
- 掉落：`y < config.fallY`（-8）判定出局；或者水平半径 > `arenaRadius + 0.2` 且脚下无台，
  一旦掉到台面高度以下就立刻出局（GDD §4，`tests/match-lifecycle` 要的是越缘即开始重生计时）。
  脚下台块碎了就没有支撑，会直接漏下去。
- 台面：`arena.tiles` 是圆盘上的方格，各自有 `hp/maxHp/alive/zone/seam`，`damageTileAt(state,x,z,amount)` 是唯一入口。

## 怎么单测“扇下岛”

```js
import { createMatch, step, getPlayer, ZERO_INPUT } from "../sim/index.js";

const s = createMatch({ seed: 8, botCount: 1 });
const a = getPlayer(s, "p0");
const b = getPlayer(s, "b0");

// 摆位：a 站在 b 内侧，面向 +X（yaw = -PI/2），b 贴边
Object.assign(a, { x: 16.6, y: 0, z: 0, yaw: -Math.PI / 2, vx: 0, vy: 0, vz: 0, invulnT: 0 });
Object.assign(b, { x: 19.3, y: 0, z: 0, vx: 0, vy: 0, vz: 0, invulnT: 0 });

let ko = null;
for (let i = 0; i < 360 && !ko; i++) {
  step(s, { p0: { ...ZERO_INPUT, slap: true, yaw: -Math.PI / 2 } }, 1 / 60);
  ko = s.events.find((e) => e.type === "ko") || null;
}

// ko.id === 'b0'，ko.by === 'p0'，a.kills === 1，b.deaths === 1
```

要点：**先把 `invulnT` 清零**（开局没有无敌，但重组后有 1s），**位置要在扇程内**
（`slapRange + playerRadius`，木棉 2.6 + 0.7），**朝向要对**（背后不吃扇），
**等过前摇**（木棉 `windup` 0.16s，磐石 0.42s，命中在前摇结束那一帧才结算）。
不想依赖扇击数值时，可以直接 `applyKnockback(state, victim, 30, 4, 0, 'p0')` 再 `step` 到掉出去。

## isMatchOver

`isMatchOver(state)` 不依赖 `step` 是否已经锁定：任一玩家 `kills >= killsToWin`，
或 `secondsLeft <= 0`，立刻返回 `{ over: true, winnerId, reason }`。
`step` 用同一份 `decideMatch()` 落锁并发 `matchOver` 事件，两条路答案一致。
