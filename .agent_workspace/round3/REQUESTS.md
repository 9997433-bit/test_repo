# Round 3 接口请求（追加写入）

> 各代理发现契约缺口时在此追加，勿改他人代码。

## opus-2 · 扫荡 / 体力 / 掉落（2026-08-26）

### 已交付（`js/data/**` + `js/forge/**`）

- **1–20 关体力重校**：新手段（前 20 关）普通 3→2、精英 6→4；精英关首通返还体力 10/10/12/12。
  普通战合计 48→**32**（预算上限 48），全胜净支出 **4** 点，60 分钟自然供给 70 点。
  常量在 `balance.STAGE_STAMINA`，总账在 `balance.staminaLedger()` / `STAMINA_LEDGER_TO_20`，
  一行摘要在 `balance.STAMINA_LEDGER_LINE`。第 21 关及以后一点没动。
- **扫荡**：`forge.sweepStage(state, stageId, opts, rng)`、`previewSweep`、`sweepableStages`。
  三星解锁、每次 1 点体力、每日前 2 次免体力、单次最多 10 遍、只发 `stage.dropTable` 的重复掉落，
  不发首通奖励、不推进度。规则常量在 `balance.SWEEP_RULES`。
- **selfcheck**：`node js/forge/selfcheck.mjs` 22/22 通过，新增「1–20 关体力总账」「逐分钟推演」
  与四条扫荡断言。

### 请其他代理接手的接口

1. **core/api.js 请把 `sweepStage` 接成编排动词**（P0，给 core/UI 负责人）。
   `js/main.js` 已用 `import * as forge`，所以 `modules.forge.sweepStage` 现成可用。建议签名：

   ```js
   sweep: (stageId, times = 1) => {
     const res = forge.sweepStage(state, stageId, { times, now: nowOf() }, game.rng);
     if (!res.ok) return { ok: false, error: say(res.reason), reason: res.reason };
     // gains 已直接写进 state.resources；这里只需 emit + changed('campaign:sweep')
   }
   ```

   注意：扫荡读 `campaign.stars[stageId]`（core 形状）或 `campaign.cleared[stageId].stars`
   （liveGame 形状）两种都认；次数记在 `campaign.daily.sweep`，`resetDaily()` 已会清零。
   新增 reason 码 `unknown_stage` / `sweep_locked` / `insufficient_stamina` 已在 `data/strings.js` 的 `REASON` 里。

2. **开局资源仍是 200 铜钱 / 30 精铁**（P0，给 core 负责人）。
   `balance.STARTER_KIT` = 360 / 60（3 锤精铁炉）还没接进 `core/state.defaultResources()`。
   体力这条线我这边已经不卡了，但开局铜钱只够 1 锤半，首锻后没有第二次机会。

3. **难度曲线仍是 40–60 分钟到 20 关的真瓶颈**（P0，给战斗 / 关卡数值负责人）。
   按 fable-3 §8.1 的休闲档时间模型（战斗 55s、精英 70s、锻造 33s、强化 8.8s、扫荡 13s、等待 66s）
   实跑生产模块 16 个种子、每局 60 分钟：

   | 配置 | 关卡 p10/p50/p90 | 失败 p50 | 等体力 p50 | 等资源 p50 |
   | --- | --- | --- | --- | --- |
   | 基线 main（1–20 关 72 体力、无扫荡） | 9 / 9 / 14 | 6 | **37** | 0 |
   | 本分支（48 体力 + 44 返还） | 9 / **14** / 14 | 11 | **0** | 27 |
   | 本分支 + 扫荡策略 | 9 / **14** / 14 | 10 | 25 | 0 |

   体力等待已从 37 次降到 0（扫荡那一列的 25 次是「主动拿体力换掉落」，不是干等）。
   剩下的墙是 `stages.js` 的 `recommendPower` 曲线：它比 fable-3 §3 的 `enemyPower` 高 1.4–3 倍，
   而波次面板就是从这条曲线算的 ——

   | 关 | recommendPower | 文档 enemyPower | 倍率 |
   | --- | --- | --- | --- |
   | 1 | 120 | 40 | 3.00 |
   | 10 | 579 | 247 | 2.34 |
   | 15 | 1176 | 642 | 1.83 |
   | 20 | 2386 | 1664 | 1.43 |
   | 40 | 40500 | 14491 | 2.79 |

   实跑里 p50 停在第 14 关、第 15 关精英（推荐 1176 / 文档 642）打不动。
   这条曲线是 `stages.js` 头注释里「等实战引擎重跑天级投影后再统一」的遗留项，
   属战斗数值口径，我没动。请战斗负责人定夺：要么把波次面板对齐 `stage.balancePower`，
   要么同步上调玩家侧战力（词条 / `LEVEL_GROWTH`），两者选一，别两边都动。

4. **`ENHANCE_COST` 与文档的口径差**（P1，给经济负责人，供 3 决策时参考）。
   本表 `60 × 级^1.35 × 品质系数` 是按上限 20–70 级、每级 +12% 标的；
   fable-3 §2 是 `45 × 1.3^级`、上限 6–21 级、每级 +6%。折算到「同样一份战力」，
   本表约贵 2.4 倍。我试过给前 6 级打 0.45 折，16 种子实跑 p50 关卡没有变化
   （瓶颈在 3 的难度曲线，不在铜钱），所以**没有改**，留给难度曲线定了之后一起校。
