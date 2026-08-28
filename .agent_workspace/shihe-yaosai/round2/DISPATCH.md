# Round 2 派发记录

| 角色 | 模型 slug | 环境 | Agent ID | 产出 |
| --- | --- | --- | --- | --- |
| Fable-1 | claude-fable-5-thinking-xhigh | local | bc-3cb6a2fc-240e-5f5e-a581-cd0f54157617 | 契约 v2 |
| Fable-2 | claude-fable-5-thinking-xhigh | local | bc-67f7ec90-44c6-5a50-80a8-fb66ba7e83da | 漏敌红/过热橙 |
| Fable-3 | claude-fable-5-thinking-xhigh | cloud | bc-b1abfc52-c1c9-505e-9627-a2a2b7263c35 | `cursor/shihe-r2-f3-data-gdd-3c35` |
| Fable-4 | claude-fable-5-thinking-xhigh | local | bc-9ed6a439-dbee-5eff-9363-7ace7df5f2a3 | SOTA 记 R1 实绩 |
| Opus-1 | claude-opus-5-thinking-high-fast | local | bc-1eee35d8-fefe-5493-985c-00c01693594b | 主循环单签名 |
| Opus-2 | claude-opus-5-thinking-high-fast | cloud | bc-656a8d93-bc60-5758-a565-e9200dfe39cd | `cursor/shihe-world-no-tracers-39cd` |
| Opus-3 | claude-opus-5-thinking-high-fast | cloud | bc-040e9936-abb4-53cd-8828-6abe82ed321c | `cursor/shihe-r2-opus3-sim-combat-321c` |
| Opus-4 | claude-opus-5-thinking-high-fast | local | bc-ca35df9a-1259-594d-b559-08ad0738723d | HUD 单签名 |
| GPT-sol-1 | gpt-5.6-sol-xhigh-fast | local | bc-eeff5f80-0d09-515f-abd7-f6779a13cd46 | 契约测 |
| GPT-sol-2 | gpt-5.6-sol-xhigh-fast | local | bc-6ad2d7f1-26c7-5d00-b387-f207b6cb4dc7 | probe 门槛（合入 O3 后仍 17 漏） |

合入后实测：`npm test` **84/84**；`npm run probe` **FAIL** 17 漏；`node src/sim/smoke.mjs --waves=5 --seed=7` **0 漏通关**。
