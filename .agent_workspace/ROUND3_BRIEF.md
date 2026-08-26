# Round 3 结论简报

八席已合入父分支 `cursor/fashion-mall-sota-446f`。`npm test` 94，`npm run verify` 4/4。

## 已关闭的量规 P0

| P0 | 状态 | 合入要点 |
|---|---|---|
| P0-1 豪宅旧价 | 关 | `mansion.js` 走 `buyFurniture` / `furnitureCost`，删 `200/bonus` |
| P0-2 core 播报 | 部分关 | `hydrate` / `advanceGoal` 接 `OFFLINE` / `GOALS`；坏档句与回执面板仍开 |
| P0-3 重绘焦点 | 关 | `mallView` / `roster` 原地 diff，动作后焦点留在原按钮 |
| P0-5 推进模拟入测 | 关 | `tests/simulation.test.js`：五店全解锁 + 目标续期 ≥10 |
| P0-6 升级庆祝 | 关 | 等级 pill 星光、升级/招聘飘字、locked 店卡 shake |

未关：P0-4 取证三件（C5/C6/D4，最大分池）、P0-7 1280 双栏与 legacy token。未派：F2 视觉文档、F3 经济文档。

## 有意不做

- 达标不播 `GOALS.done` → `renewUp` 两连 toast（离线追帧会翻倍）
- 坏档 `SYSTEM.corruptKept` 需 `save.js` 吐备份时间，留给收尾
- 俯视商场地图、盲盒/占卜操作深度、事件风险抉择（量规 P1）
