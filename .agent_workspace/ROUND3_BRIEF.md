# Round 3 结论简报（批次 A+B）

五席已合入父分支 `cursor/fashion-mall-sota-446f`。`npm run verify` 4/4，单测 92。

## 已关闭的量规 P0

| P0 | 状态 | 合入要点 |
|---|---|---|
| P0-1 豪宅旧价 | 关 | `mansion.js` 走 `buyFurniture` / `furnitureCost`，删 `200/bonus` |
| P0-2 core 播报 | 部分关 | `hydrate` / `advanceGoal` 接 `OFFLINE` / `GOALS`；坏档句仍硬编码 |
| P0-3 重绘焦点 | 关 | `mallView` / `roster` 原地 diff，动作后焦点留在原按钮 |

未关：P0-4 取证、P0-6 升级庆祝/locked shake、P0-7 1280 双栏与 legacy token。P0-5 已关（`tests/simulation.test.js`：五店全解锁 + 目标续期 ≥10）。

## 有意不做

- 达标不播 `GOALS.done` → `renewUp` 两连 toast（离线追帧会翻倍）
- 坏档 `SYSTEM.corruptKept` 需 `save.js` 吐备份时间，留给收尾
- 量规文档里的「未接线」描述已过期，由后续 F 席改，不在实现席改分

## 文件所有权（批次 C 起）

| Agent | 可写 | 禁区 |
|---|---|---|
| O4 | `src/app.js`、`src/styles/main.css`；`mallView.js` 只许加类名/飘字，不得重写 paint/diff/keepFocus | `core/`、`home/`、`roster.js` |
| G2 | `tests/**`、`scripts/**` | 不得改 `ECONOMY_REFERENCE` 数字 |
| F4 | `docs/UX_NARRATIVE.md` | 不改分、不改 `src/` |
