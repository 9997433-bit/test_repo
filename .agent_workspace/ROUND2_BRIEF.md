# Round 2 结论简报

对照 Round 1：离线折算、槽型、掉落表、兽潮税、技能触发、视觉令牌均已落地。`npm test` 34 绿，checksum 1011.25 未漂。

## 演进对比

| 债 | Round 1 | Round 2 |
| --- | --- | --- |
| AD-18 离线效率 | 未进 BOOT | banked 路径已折算，聚灵阵有卖点 |
| AD-8 槽型 | 4 格 FIFO | 定案 1 攻 / 1 防 / 2 通；万魂灯改 util 保住基准套 |
| AD-12 兽潮税 | 扣库存 30% | 定案只散失未收取（匣+未入账尾巴） |
| AD-9 掉落 | 硬编码 | ARTIFACT_DROPS 18 节点 |
| 技能/法器 | applyTriggers 死 | 已接线，战报带 by |
| UI | 页签可点 | 槽位盘试算、两条晋阶文案 |
| 测试 | 24 + 场外 | 34 + stress 1–30 层 |

## 潜在边界风险（Round 3 必收）

1. **AD-17 半闭环**：mansion 已导出 `scriptureXpAward`，store TICK 与 `disciples/train.js` 仍可能走旧「满条免费升专业」。Owner: Opus-1（TICK）+ Opus-4（train.js）。
2. **`waveReward.loseTax` 死代码**仍在 combat/wave.js。Owner: Opus-3。
3. **魔族 F40 弱**：人族高、魔族低，缺治疗。Owner: Fable-3 用掉落/数值，勿改 KITS 与 skillDesc 脱节。
4. **离线直入账 8s vs 验收 ≥60s**。Owner: Opus-1 或 Fable-4 改门槛，二选一对齐。
5. **回归误删**：bid 唯一 / saveCorrupt / 8h 封顶需 GPT-sol-1 补回。
6. **塔 45 层全阵营 0%** 与「可打到飞升」文案不符。Owner: Fable-3 或改文案。
7. **AD-13/14/16/21/22** 覆盖守卫、迁移链、阈值、RECRUIT 无注入 rng、等级 clamp。Owner: Opus-1 + Fable-1 文档。
8. ACCEPTANCE/SOTA 仍有定案前残文（G5.4、R2-1）。Owner: Fable-4。
9. UI 给 `data-slot` / `.fengshui[data-tier]` 钩子尚未全部打上。Owner: Opus-4。
10. 浏览器手玩验收未做。Round 3 主调度器会补。

## SOTA 验收差距

- 玩法闭环：开府到塔 20 已稳；终盘与魔族路线未达「全阵营可飞升」。
- 文档四方已大体同口径，残文与死代码要清。
- 测试链：34 单测 + probe/bench 绿，缺 UI 冒烟常驻与 8h/坏档补测。
- 隔离与 4174 保持。
