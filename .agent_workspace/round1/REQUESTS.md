# Round 1 接口请求（追加写入）

> 各代理发现契约缺口时在此追加，勿改他人代码。

## gpt-sol-2：基准夹具与结果契约

- 请在 Round 2 明确 `simulateBattle` 的 `playerWeapons` / `enemyWaves` 最低字段与空阵容行为；当前冻结 API 只有参数名，基准只能使用兼容性宽字段夹具。
- 请明确 `forgeWeapon` 的返回形状、失败形状、背包容量规则和品质字段名（`quality` 或 `rarity`），以便 1000 次权重采样能严格验证分布，而不是兼容性提取。
