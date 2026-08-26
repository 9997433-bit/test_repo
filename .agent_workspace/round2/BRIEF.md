# Round 2 结论简报

**编排时间**：2026-08-26  
**合流后验证**（父编排器本机）：`tests/run.mjs` 6/6 PASS；战斗 500 次 98ms；锻造 1000 次 30ms；forge selfcheck 15/15 PASS。

## 演进对比（相对 Round 1）

| 项 | Round 1 | Round 2 |
| --- | --- | --- |
| UI 数据源 | mock 闭环 | `inspectCapabilities.ready===true`，真实 `bqwz.save.v1` |
| 编排动词 | 缺失即失败 | challengeStage / arenaFight / setLineup 等 11 动词 + liveGame |
| 技能 id | 三套漂移 | snake_case + 53 条 `sk_*` 显式原型 + 旧名别名 |
| 经济 | 文档与 balance 分叉 | 权重/保底/掉落按 fable-3 对齐；首锻 ≥ 精钢；8 锤史诗保底 |
| 测试 | 6 skip | 核心 6 项全绿 |
| 视觉 | 文字战报 | 三套弹道、闪白飘字、KO、飞币、胜负印章、reduce-motion |
| 性能 | 未实跑 | 远低于 500ms 预算 |

## 潜在边界风险

1. **经济未达验收**：生产链路 60 分钟积极操作只到第 **9** 关。根因：core 开局仍是铜钱 200 / 精铁 30 / 体力 60；1–20 关合计 72 体力，60 分钟自然回复后仅约 70。失败重试进一步吃体力。
2. **栏位解锁三处漂移**：core `[0,3,8,15,25]` vs combat `[1,3,8,15,25]` vs balance `[0,2,4,9,14]`。
3. **碎片资源**：data 已有 6 个 shard ID，core `RESOURCE_IDS` 可能未登记。
4. **双挂机路径**：core tickIdle vs forge collectIdle 已部分隔离，仍需断言「只入账一次」。
5. **economy-sim 策略偏保守**：战力<90% 推荐才打，导致 6 负 24 分钟空转。
6. **视觉剩余**：无 WebAudio、无拖拽上阵、无单件立绘、状态无图标、AOE 弹道无差异、BOSS 无专属镜头。

## SOTA 验收差距（Round 3 必须收敛）

1. 把开局资源改为 `STARTER_KIT`（360 铜钱 / 60 精铁，够 3 锤），体力上限/回复足以支持「40–60 分钟到 20 关」（可加扫荡、提高回复或降低 1–20 关体力，但须自洽）。
2. 统一 `SLOT_UNLOCK_STAGES` 与 `RESOURCE_IDS`。
3. 补扫荡 / 首通引导，保证 3 分钟新手闭环在真实 UI 可走完。
4. P1 视觉至少落地：状态图标、AOE 弹道差异、设置页音效开关 + 简易 WebAudio 锤击/克制音。
5. README / 进度文档与真实启动方式对齐；测试链再扩：首锻保底、pity 存档、challengeStage、空体力。
6. 交叉核验：无 mock 成功路径、无双计挂机、无技能 id 漏出。
