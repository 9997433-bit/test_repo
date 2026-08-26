# API 契约

子代理必须遵守这些导出签名。测试只依赖这些符号，禁止改名。

## store

```js
createStore(seed?: Partial<GameState>): Store
store.get(): GameState
store.patch(partial): GameState
store.subscribe(fn): unsubscribe
```

`GameState` 最小字段：

```
meta: { title, version, seed, tick, speed, started }
player: { name, hunger, thirst, hp, coins, diamonds, exp, level }
resources: Record<string, number>
raft: { width, height, tiles: (null | { buildingId, level, rot, occupant })[][] }
buildings: { id, type, x, y, level, rot, occupantHeroId }[]
residents: { id, name, job, hunger, thirst, hp, mood, order }[]
heroes: { id, heroKey, star, xp, assignedBuildingId, injuredUntil }[]
world: { timeOfDay, weather, event, seaSeed }
explore: { salvage, fishing, dive }
campaign: { stage, bestStage, idleSince }
settings: { muted, reduceMotion }
```

## world

```js
canPlace(state, type, x, y, rot): { ok, reason }
placeBuilding(state, type, x, y, rot): GameState
moveBuilding(state, id, x, y, rot): GameState
upgradeBuilding(state, id): GameState
expandRaft(state, dir): GameState
tickWorld(state, dt): GameState
```

## explore

```js
spawnFlotsam(state, rng): Flotsam[]
collectFlotsam(state, id): GameState
castLine(state): FishingCast
resolveHook(state, cast, timing01): GameState
startDive(state, zone): DiveSession
diveStep(session, input, dt): DiveSession
finishDive(state, session): GameState
```

## heroes / combat

```js
recruit(state, heroKey): GameState
assignHero(state, heroId, buildingId | null): GameState
starUp(state, heroId): GameState
simulateBattle(seed, allies, enemies): BattleResult
```

`BattleResult`：`{ seed, winner, log, duration, leftover }`，相同 seed + 阵容必须字节级稳定（测试用 JSON 快照）。
