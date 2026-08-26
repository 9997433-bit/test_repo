# API 契约（基线）

系统模块必须导出下列纯函数。UI 只通过 `store.dispatch` 与订阅通信。

## Farm `src/systems/farm/index.js`

```js
export function till(state, { plotId }) 
export function plant(state, { plotId, cropId })
export function harvest(state, { plotId })
export function expandPlot(state)
export function tickPlots(state, dtMs)
export function seasonFactor(crop, season)
```

## Production `src/systems/production/index.js`

```js
export function enqueueJob(state, { buildingId, recipeId })
export function collectJob(state, { buildingId, slot })
export function feedAnimal(state, { buildingId, slot })
export function unlockSlot(state, { buildingId })
export function tickProduction(state, dtMs)
export function canCraft(state, recipeId)
```

## Village `src/systems/village/index.js`

```js
export function acceptWish(state, { wishId })
export function deliverWish(state, { wishId })
export function refreshWishes(state, nowMs)
export function inviteGuest(state, { guestId })
export function cook(state, { recipeId, guestId })
export function build(state, { buildingId })
export function petPlay(state, { petId })
export function stallSell(state, { itemId, qty })
export function tickVillage(state, dtMs)
```

## Store action 类型（字符串常量）

`farm/till` `farm/plant` `farm/harvest` `farm/expand`  
`prod/enqueue` `prod/collect` `prod/feed` `prod/unlock`  
`village/wish` `village/deliver` `village/invite` `village/cook`  
`village/build` `village/pet` `village/stall`  
`meta/tick` `meta/save` `meta/load` `meta/settings`

错误以 `{ ok:false, reason }` 返回，不抛到 UI。
