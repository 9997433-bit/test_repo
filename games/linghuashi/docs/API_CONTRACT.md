# 模块契约

## drawing

- `createStrokeRecognizer()` → `{ consume(points), finalize(points) }`
- `finalize` 返回 `{ type, precision, pressure, length, bounds, raw }`
- `type` ∈ `line|curve|circle|zigzag|spiral|cloud|scribble`
- `templatePoints(type, {w,h})` → 理想轨迹（键盘施法 / 教程引导 / 回归测试共用）
- `normalizeForStorage(points, n)` → 归一化 32 点（画阁存档）；`fitToCanvas` / `replayOnCanvas` 回放
- `mountPainter(canvas, {onStroke, reducedMotion})` → `{ resize, clear, playback(type), setGuide(type|null), destroy }`

## combat

- `createBattle({ player, enemy, seed, mods })`
- `cast(stroke, elementHint)` → `{ events: [{type:"cast", talisman, stroke, crit, dealt, combo}], state }`
- `tick(dtMs)`：累加器驱动敌方出手（任意 dt 出手次数守恒）、灵气回复、护盾衰减、束缚倒计时、敌特性（regen）
- `getIntent()` → `{ id: gather|strike|bound|done, label, ratio }`（意图电报）
- `computeMods(save)` → `{ dmgMult, shieldMult, healMult, controlMult, critChance, dodgeChance, qiRegenPerSec, openingShield }`
- 敌特性 traits：`swift | armored | enrage | regen | spiky`

## core

- `createTicker(stepMs, maxCatchUpMs)` → `{ advance(nowMs) → ticks, reset() }`
- `startLoop({stepMs, onTick, onFrame})` → `stop()`（rAF 驱动，退化 setInterval）

## progression

- `tickIdle(save, nowMs)` 结算挂机（8h 封顶）
- `breakthrough(save)` 境界
- `applyTalent(save, id)`（12 丹/级，5 级封顶）
- `catchBeast(save, rng)`（40 丹，3 栏）/ `releaseBeast(save, uid)` / `beastBonus(save)`
- `recordStroke(save, stroke)` 六式最佳精度；`checkInkUnlock(save)` 墨客判定；`masteredTypes(strokeStats)`
- `isStageUnlocked(save, stageId)` / `nextStage(id)` 关卡顺序解锁

## ui

- `renderApp(root, store, navigate)` → 可选 `cleanup()`（战斗/画阁返回；engine 在切屏前调用）
- `tutorialStart()` / `tutorialAdvance(state, stroke)` 教程状态机

## store

- `get()`, `set(patch)`, `subscribe(fn)`, `reset()`
- `persist()` / `hydrate()` key = `linghuashi.save.v1`（内容 version=2）
- `migrateSave(parsed)`：v1→v2 补齐 `cleared/strokeStats/bestCombo/totalWins`，由画阁反推六式精度
