# 异掌 · Round 1 接口契约（实现必须遵守）

模拟与渲染分离。`src/sim`、`src/data`、`src/combat`、`src/ai` **禁止** import `three` 或 DOM。

## 数据 `src/data/gloves.js`

```js
export const GLOVES = [/* 8 只，见 DESIGN_SEED */];
export const GLOVE_BY_ID = Object.fromEntries(GLOVES.map((g) => [g.id, g]));
export const MATCH = {
  dt: 1 / 60,
  arenaRadius: 20,
  playerRadius: 0.7,
  playerHeight: 2,
  fallY: -8,
  respawnDelay: 1.2,
  invulnTime: 1.0,
  matchSeconds: 240,
  killsToWin: 7,
  switchLock: 0.4,
  awakenDuration: 8,
};
```

每只手套至少包含：`id, name, role, color, slapRange, slapAngleDeg, slapPower, slapCooldown, windup, recovery, skillId, skillCooldown, unlock`。

## 模拟 `src/sim/index.js`

```js
export function createMatch(opts)
// opts: { seed:number, gloveId:string, offhandId:string, botCount?:number }
// 返回可变 state。测试侧 structuredClone 后再 step。

export function step(state, inputs, dt)
// inputs: Record<playerId, Input> ；缺省视为零输入
// 原地更新 state 并返回 state

export function getView(state)
// 纯 JSON 快照，供渲染。不得返回 class / 函数

export function isMatchOver(state) // { over:boolean, winnerId?:string, reason?:string }
```

`Input`：

```js
{
  moveX: number,      // -1..1
  moveZ: number,      // -1..1  相对相机前方由 input 层已转换或 sim 用 yaw
  yaw: number,        // 弧度
  slap: boolean,
  skill: boolean,
  switchGlove: boolean,
  dash: boolean,
  jump: boolean,
}
```

玩家字段（最低集）：`id, kind ('human'|'bot'), x, y, z, yaw, vx, vy, vz, gloveId, offhandId, activeSlot (0|1), meter (0..1), awakenedT, statuses[], alive, invulnT, respawnT, kills, deaths`。

击退：给水平速度冲量。掉落：`y < fallY` 或水平离台心 `> arenaRadius + 0.2` 且脚下无台。碎地：台面子块 HP，重击降低 HP，HP<=0 该块消失。

## 战斗 `src/combat/index.js`

```js
export function resolveSlap(state, attacker, glove, now) // 命中列表与冲量
export function resolveSkill(state, attacker, glove, now)
export function tickStatuses(state, dt)
export function applyAwaken(attacker, glove) // 觉醒期间覆盖 range/power
```

由 `sim.step` 调用，不反向依赖 render。

## AI `src/ai/bots.js`

```js
export function think(view, botId, rng) // 返回 Input
```

三种性格：`brute` 硬冲、`fox` 绕边、`bully` 打残血/背后。性格写在 bot 的 `persona` 字段。

## 渲染 `src/render/index.js`

```js
export function createRenderer(canvas, opts)
export function sync(view)
export function resize(width, height, dpr)
export function setQuality(tier) // 'high'|'mid'|'low'
export function dispose()
```

Three.js 只存在于此目录。质量档见 DESIGN_SEED。

## 输入 `src/input/index.js`

```js
export function createInput(dom, canvas)
export function sample(cameraYaw) // Input
export function setEnabled(boolean)
```

键鼠 + 触屏摇杆归一。触控按钮走 DOM，画布区 `touch-action: none` 只转视角。

## 音频 `src/audio/index.js`

```js
export function createAudio()
export function unlock() // 首次 pointer
export function play(name, opts)
```

无外部音频文件，WebAudio 合成。

## UI `src/ui/shell.js`

主菜单选双掌、局内 HUD、结算、暂停。触控控件 DOM。样式只引用 `src/styles`。

## 主循环 `src/main.js` + `src/core/loop.js`

固定模拟 1/60，渲染插值。后台 hidden 暂停。
