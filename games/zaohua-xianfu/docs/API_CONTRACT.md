# API 契约

## Store actions

| type | payload | 效果 |
| --- | --- | --- |
| `BOOT` | `{ now }` | 载入或建档，结算离线 |
| `CHOOSE_FACTION` | `{ faction, name }` | 人/神/魔 + 道号 |
| `TICK` | `{ now, dt }` | 资源与修炼推进 |
| `BUILD` | `{ type, x, y }` | 占地建造 |
| `UPGRADE` | `{ id }` | 建筑升级 |
| `ASSIGN` | `{ discipleId, buildingId }` | 派遣 |
| `RECRUIT` | `{ heroId }` | 解锁仙友入府 |
| `TRAIN` | `{ discipleId }` | 消耗丹药升专业 |
| `CULTIVATE` | `{}` | 吞吐灵气涨修为 |
| `BREAKTHROUGH` | `{ now }` | 尝试破境 |
| `SET_PARTY` | `{ heroIds }` | 6 席，主角必须在场 |
| `EQUIP_ARTIFACT` | `{ artifactId, slot }` | 攻击/防御/通用 |
| `START_TOWER` | `{ now }` | 挑战当前层 |
| `START_WAVE` | `{ now }` | 兽潮下一波 |
| `RESOLVE_COMBAT` | `{ now }` | 结算当前战斗 |
| `COLLECT_OFFLINE` | `{ now }` | 领取挂机匣 |
| `RESET` | `{}` | 清档 |

## 纯函数导出

- `mansion/production.js` → `produce(state, dtSec)`
- `mansion/layout.js` → `adjacencyBonus(grid, x, y)`
- `combat/battle.js` → `simulate(input)`
- `combat/artifacts.js` → `applyTriggers(ctx, event)`
- `progression/realm.js` → `breakthroughChance(state)`
- `disciples/assign.js` → `yieldMultiplier(disciple, building)`

返回值不得改输入对象。
