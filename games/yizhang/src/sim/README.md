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

- 人类固定 `p0`，Bot 是 `b0`、`b1`、`b2`（默认 3 个，`botCount` 可改）。
- `inputs` 缺省视为零输入；`yaw` 传 `null`/缺省表示保持当前朝向（Bot 不给输入不会被扭头）。
- `step` 的 `dt` 大于 1/60 会自动切子步，60Hz 与 30Hz 结果一致。
- `state` 全是纯数据，`structuredClone(state)` 后继续 `step` 结果完全一致。

### Input

```js
{ moveX, moveZ, yaw, slap, skill, switchGlove, dash, jump, moveSpace? }
```

`moveX/moveZ` 默认是世界系（input 层已按相机 yaw 转换）；传 `moveSpace: 'local'` 则由 sim 按玩家 yaw 旋转。

### 朝向约定

`yaw = 0` 面向 **-Z**，与 three 的 `mesh.rotation.y` 一致：渲染端直接 `mesh.rotation.y = player.yaw`。
`forward = (-sin(yaw), -cos(yaw))`，所以面向 +X 是 `yaw = -PI/2`。

### 事件

`state.events` / `view.events` 每次 `step` 清空重填，供渲染与音频消费：
`slapStart` `slap` `hit` `ko` `respawn` `jump` `dash` `switch` `skill` `awaken` `awakenEnd` `tileCrack` `tileBreak` `matchOver`。

## data / combat 接线

`../data/gloves.js` 与 `../combat/index.js` 还没落地时，sim 用内置兜底
（`fallback-data.js` / `fallback-combat.js`，只有木棉是调过的数值）。三种接法：

```js
import * as data from "../data/gloves.js";
import * as combat from "../combat/index.js";
installData(data);
installCombat(combat); // 显式注入（推荐）

await autoWireOptionalDeps(); // 运行时探测，文件不存在则静默保持兜底
```

sim 同时按 combat 的导出名转发 `resolveSlap / resolveSkill / tickStatuses / applyAwaken`，
所以真实 combat 合进来后调用方不用改。

`resolveSlap` 的返回约定：

```js
{ hits: [{ targetId, power, impulse: { x, y, z }, hitX, hitZ, tile, statuses, applied }] }
```

冲量由 sim 施加。若 combat 自己已经改了 state，请把该 hit 的 `applied` 置 `true`，sim 就只记分不重复推人。

## 物理要点

- 惯性：有限加速度 + 指数摩擦；击退期间 `kbT` 内失控、摩擦降到 1.15，人才滑得出去。
- 击退：水平速度冲量 + 小抬升，受击方 `knockScale` 每次 +0.075（最高 3.2），落地回一点。
- 边缘低护栏：站着走不出去；`kbT` 中且水平速度 ≥ `PHYSICS.railBlockSpeed` 的重击可以穿过去。
- 掉落：`y < config.fallY`（-8）判定出局；脚下台块碎了就没有支撑，会直接漏下去。
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
（`slapRange + playerRadius`，木棉 2.7 + 0.7），**朝向要对**（背后不吃扇）。
不想依赖扇击数值时，可以直接 `applyKnockback(state, victim, 30, 4, 0, 'p0')` 再 `step` 到掉出去。
