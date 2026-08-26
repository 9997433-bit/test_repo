# Round 1 接口请求（追加写入）

> 各代理发现契约缺口时在此追加，勿改他人代码。

## gpt-sol-1 自动化探针（Round 1）

- 落地后应公开 `elementMultiplier(attackerElement, defenderElement)`（或冻结等价名）。
- 冻结 `forgeWeapon` 成功返回形状与品质字段名（统一 `quality`）。
- 冻结 `tickIdle` / `collectIdle` 可观察返回形状，至少含 `rewards` 或封顶后的 `elapsedMs`。

## gpt-sol-2：基准夹具与结果契约

- 明确 `simulateBattle` 的 `playerWeapons` / `enemyWaves` 最低字段与空阵容行为。
- 明确 `forgeWeapon` 失败形状、背包容量规则。
- Round 2 阈值建议：战斗 500 次 ≤500ms；锻造 1000 次 ≤500ms；边界不抛错且无 NaN。
