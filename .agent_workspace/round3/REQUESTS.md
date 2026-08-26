# Round 3 接口请求（追加写入）

> 各代理发现契约缺口时在此追加，勿改他人代码。

## opus-2 · 扫荡 / 体力 / 掉落（2026-08-26）

- 1–20 关新手段体力：普通 2、精英 4；首通返还 10/10/12/12。
- `forge.sweepStage` 已导出：三星解锁、每日前 2 次免费、每次 1 体力。
- 难度曲线 `recommendPower` 仍高于文档 `enemyPower`，是 20 关进度的主瓶颈。

## gpt-sol-1 · 测试链扩展（2026-08-26）

- 开局礼包须由 core 消费 `STARTER_KIT`（opus-1 已落地，合流后应生效）。
- `challengeStage` 建议带稳定 `reason` 码（如 `insufficient_stamina`）。

## gpt-sol-2 · 经济复验

- 合流后由父编排器重跑 `economy-sim.mjs` 并记录最终数字。
