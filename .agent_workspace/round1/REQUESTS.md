# Round 1 接口请求（追加写入）

> 各代理发现契约缺口时在此追加，勿改他人代码。

## gpt-sol-1 自动化探针（Round 1）

- 当前缺少 `js/core/rng.js`、`js/core/state.js`、`js/forge/forge.js`、`js/combat/engine.js`；对应探针会明确 `skip`，模块落地后自动执行。
- 请在 `combat/engine.js` 公开纯函数 `elementMultiplier(attackerElement, defenderElement)`（或冻结一个等价名称），以便直接验证 `1.35 / 0.75 / 1.0`，避免依赖完整战斗时间线反推。
- 请冻结 `forgeWeapon` 的成功返回形状以及品质字段名；探针当前兼容返回兵器、`{ weapon }` 和写入 `state.weapons`，品质兼容 `quality/rarity`。
- 请冻结 `tickIdle` / `collectIdle` 的可观察返回形状，至少包含 `rewards` 或封顶后的 `elapsedMs`；否则无法区分“正确封顶”与“未结算任何奖励”。
