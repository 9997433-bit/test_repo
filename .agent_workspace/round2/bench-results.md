MODEL_SLUG: gpt-5.6-sol-xhigh-fast

# Round 2 · gpt-sol-2 生产模块实测

- 日期：2026-08-26 UTC
- Node：v22.14.0（linux/x64）
- 被测提交：`5e3e67b`
- 命令：`node games/bingqi-wangzhe/bench/run.mjs`
- 命令：`node games/bingqi-wangzhe/bench/economy-sim.mjs`

## 性能

| 指标 | 生产模块实测 | 目标 | 结论 |
| --- | ---: | ---: | --- |
| 战斗模拟 500 次 | 84.853 ms | ≤500 ms | PASS |
| 锻造采样 1000 次 | 26.168 ms | ≤500 ms | PASS |

锻造分布：`common=526, uncommon=287, rare=141, epic=37, legendary=8, mythic=1`。

## 边界

`空阵容`、`满 5 兵器`、`种子 0`、`超大伤害`、`0 体力` 全部 PASS；均未抛错，递归数值检查未发现 `NaN` / `Infinity`。

## 经济模拟

- 固定种子：`20260826`
- 生产链路：`core/state + data/{balance,stages,weapons} + forge + combat/engine`
- 积极操作 60 分钟：第 **9** 关，9 战 9 胜，未到第 20 关
- 第 20 关到达分钟：无
- 40–60 分钟目标：FAIL
- 硬上限依据：生产关卡表 1–20 关合计消耗 144 体力；生产初始状态为 60 体力，60 分钟自然恢复后仅有 70 体力，且尚未计算失败重试
