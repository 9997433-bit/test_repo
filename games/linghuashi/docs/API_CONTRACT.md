# 模块契约

## drawing

- `createStrokeRecognizer()` → `{ consume(points), finalize(points) }`
- `finalize` 返回 `{ type, precision, pressure, length, bounds, raw }`
- `type` ∈ `line|curve|circle|zigzag|spiral|cloud|scribble`

## combat

- `createBattle(seed, player, enemy)` 
- `cast(stroke, elementHint)` → `{ events, state }`
- `tick(dtMs)` → 敌人行动、DOT、护盾衰减

## progression

- `tickIdle(save, nowMs)` 结算挂机
- `breakthrough(save)` 境界
- `applyTalent(save, id)`

## store

- `get()`, `set(patch)`, `subscribe(fn)`
- `persist()` / `hydrate()` key = `linghuashi.save.v1`
