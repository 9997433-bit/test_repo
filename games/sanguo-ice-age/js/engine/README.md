Engine contracts (implemented by opus-engine)。全部纯 ESM，除 `save.js` 注入的 storage 外无 DOM 依赖。

## `loop.js` — 主循环

```js
import { createLoop } from "./engine/loop.js";

const loop = createLoop({
  tickMs: TICK_MS,                  // 可省，默认 config.TICK_MS = 250
  onTick: ({ tick, tickMs, dtSec, speed }) => stepWorld(state, dtSec),
  onFrame: ({ dtMs, dtSec, alpha, tick, speed, running }) => render(state, alpha),
});

loop.start();          // 开始
loop.setSpeed(2);      // 0 = 暂停（仍渲染），1 / 2 / 4；越界自动 clamp 到 LOOP.maxSpeed
loop.getSpeed();       // → 当前倍速
loop.isRunning();      // → 是否在跑
loop.getTick();        // → 已推进的 tick 数
loop.step(3);          // 手动推进 3 个 tick（教程 / 测试）
loop.reset();          // 计数与累加器归零（读档后调用）
loop.stop();           // 停止并取消下一帧
```

- **定步长**：逻辑严格按 `tickMs` 推进，与帧率无关；倍速只放大时间流速，不改变单步大小。
- **不爆 tick**：单帧真实耗时截断到 `LOOP.maxFrameMs`（1000ms），单帧最多补 `LOOP.maxTicksPerFrame`（8）个 tick，
  溢出的积压直接丢弃。切走标签页几分钟再回来，最多补 8 个 tick。
- **暂停**：`setSpeed(0)` 冻结逻辑但保留 `onFrame`（UI 不卡死）；`stop()` 则连帧一起停。
- `onTick` / `onFrame` 抛错会被捕获并转给 `onError(err, phase)`（默认 `console.error`），循环不会中断。
- 可选注入：`now` / `schedule` / `cancel` / `speed` / `maxTicksPerFrame` / `maxFrameMs` / `onError`。
  浏览器走 `performance.now` + `requestAnimationFrame`，Node 自动退回 `Date.now` + `setTimeout`。

## `save.js` — 存档

```js
import {
  saveGame, loadGame, exportSave, importSave, clearSave, hasSave,
  createSaveAdapter, memoryStorage,
} from "./engine/save.js";

saveGame(state);            // → true / false（配额满等失败返回 false，不抛错）
loadGame();                 // → state 或 null（无存档 / 存档损坏）
exportSave(state);          // → string（带版本信封的 JSON，可复制）
importSave(json);           // → state；内容非法时 throw Error
clearSave();                // 删档
hasSave();                  // → boolean

// Node 测试 / 自定义存储：
const adapter = createSaveAdapter(memoryStorage());
adapter.saveGame(state); adapter.loadGame();
```

- 键取自 `config.SAVE_KEY`，信封为 `{ format, version, savedAt, state }`。
- 无 `localStorage`（Node）或 `localStorage` 不可写（Safari 无痕）时自动退回内存实现，调用方无需判断。
- 读档会经 `normalizeState` 补齐缺失字段，因此新增状态字段不会让老存档失效。

## `rng.js` — 可复现随机

```js
import { createRng, hashSeed } from "./engine/rng.js";

const rng = createRng(seed);      // seed 可为数字或字符串
rng.next();                       // uint32
rng.float();                      // [0,1)
rng.range(min, max);              // [min,max) 浮点
rng.int(min, max);                // [min,max] 闭区间整数
rng.pick(arr);                    // 等概率取一个（空数组 → undefined）
rng.chance(p);                    // 概率判定
rng.shuffle(arr);                 // 原地洗牌
rng.weighted(items, w => w.weight); // 按权重抽（招募 / 掉落）
rng.getState() / rng.setState(v); // 存档续随机
rng.fork("battle");               // 派生独立子随机源，互不干扰序列
```

同 seed + 同调用顺序 ⇒ 同序列。战斗、寒潮、招募请各自 `fork` 一个子源，避免互相打乱。

## `state.js` — 状态（在 `js/state.js`，不在 engine 目录）

```js
import { createInitialState, cloneState, assertState } from "../state.js";

createInitialState(seed);  // 全新存档
cloneState(state);         // 深拷贝
assertState(state);        // → { ok, errors[] } 开发期校验，不抛错
```

附带工具：`pushLog(state, text, level)`、`ensureBuilding(state, id)`、`createBuilding(level)`、
`dayOfTick(tick)`、`normalizeState(raw)`、常量 `STATE_VERSION`。

状态结构（全部可 JSON 序列化）：

```
meta      { version, seed, tick, day, playTimeSec, lord }
resources { food, wood, coal, iron }
climate   { temp, blizzardDaysLeft, nextBlizzardIn, furnaceLit }
city      { furnaceLevel, buildings: { [id]: { level, workers, constructing, progress } }, warmthBuildings }
people    { pop, popCap, morale, sick, hungry }
army      { infantry, cavalry, archer, wounded }
heroes    { roster: [{ id, level, exp, star, quality, hp, injured }], deployed: [heroId], tickets }
quests    { active: [], completed: [] }
flags     { tutorialStep, gameOver, victory }
log       [{ tick, text, level }]   // level ∈ config.LOG_LEVELS
```

开局：资源来自 `config.START`（够升 1~2 级火炉 + 建伐木场/猎人小屋），
建筑槽位按 `config.BUILDING_IDS` 全部以 `level: 0` 占位，
`heroes.roster` 预置 `config.START_HERO_IDS`（`liubei` / `zhangfei` / `huatuo`，quality 均为 `orange`）。

## `bus.js` — 事件总线（已有）

`createBus()` → `{ on(type, fn) → unsubscribe, emit(type, payload) }`

## `config.js` 新增项（engine 追加，未改动原有导出）

`TICK_SEC`、`LOOP`、`START`、`START_HERO_IDS`、`BUILDING_IDS`、`LOG_MAX`、`LOG_LEVELS`
