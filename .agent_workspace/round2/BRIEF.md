# 《Round 2 结论简报》

10/10 已回收并合入 `cursor/chao-neng-xia-dan-ya-799d`。

## 演进对比（相对 Round 1）

| 缺口 | Round 1 | Round 2 |
| --- | --- | --- |
| 双物理 | 战斗走 `core/sim.js`，上游已就绪未切 | O4 切到 `src/physics`，预测/实弹 9308 点误差 0 |
| BONDS | combat 读不到，build 警告 | F3 导出别名 + O2 主读 SYNERGIES |
| 18/20 英雄 | 口径分裂 | F3/O3/F1 统一 18 + 2 预留 |
| 红测 | combat 3 红 | G1 按真实契约改断言；O2 后仍可能有 skip |
| 基准 | 空脚手架无效数字 | G2 真物理 p99 ≪ 4ms |
| 手感 | 清单未接 | F2 juice class + O4 停顿/震屏/连击音高/准星 |

F4 重评：P0 0/22 → 约 17/22，**未达 L1**（评审时 O4 尚未合入，Round 3 须复评）。

## 潜在边界风险

1. 战斗仍可能只消费 `resolveHit.damage`，忽略 `effects`/`comboDelta` → 爆蛋双实现风险。
2. 直殴身份 ×1.25 与羁绊主蛋 ×1.25 叠乘（×1.5625），F3 需裁决。
3. `art.js` 的 `race === "chick"` 对不上数据表 `"chicken"`。
4. 暂停 Esc 叠弹窗；多点触控无 pointerId。
5. F2 juice 挂在 `fx.css`，O4 未保证挂上 `.fx-hitstop` / `data-reduced-motion`。
6. `core/skills.js` / `combat/skills.js` 仍可能残留 20 英雄口径。
7. 物理 `structuredClone` 时需排除 `world.grid` / `_stamp`。
8. 传送门桥映射双向 vs sim 单向。

## SOTA 验收差距（Round 3 冲刺）

- 复评 F4 清单，目标 L1（P0 全过）并尽量吃 P1。
- 自动化链：`npm test` 全绿（含零威力 skip 解锁）、probe/bench/build 干净。
- 确定性：固定步积分，同种子可复现。
- 文档与实码对齐（契约 v1.1 已写退役路线，确认 sim 已是适配层）。
- 第 1 章 + 四模式手工回归，键盘/触控可达。
