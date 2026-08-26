# 《Round 2 结论简报》· 异掌

主调度器整理。10 路已合入 `cursor/yizhang-db8d`（O2/G2 直接推过父分支，其余 merge）。

## 演进对比

| 项 | Round 1 | Round 2 合入后 |
| --- | --- | --- |
| 测试 | 91/97 | **145/152**（7 红） |
| probe | 2 kills，未声明 wiring | **PASS 3 kills** 但 `usingRealCombat: false`（探针语义与 sim 标志相反） |
| build | 未强调 | **vite build 成功**，主包 ~590kB（Three） |
| 人类 id | p0 vs p1 | O4 改为 **p0** |
| data/combat | 未注入 | sim **静态 import** data + combat-bridge |
| HUD | 双 CSS | O4 改 `.yz-*`，styles 为源 |
| 朝向 | ±Z 分裂 | 冻结 yaw=0 → **-Z** |
| 碎地 | 三套拓扑 | 冻结 **sim 方格 ~208** |

## 潜在边界风险

1. `usingRealCombat = !combatMod`：探针 `installCombat` 后标志变 false，被误报未接线。生产静态桥是真 combat。
2. `src/combat/sim-integration.test.js` 仍 import 已删除的 `sim/fallback-combat.js` → 整文件加载失败。
3. `alignSkillIds` 期望 cotton.skillId 假值，F3 已改成 `"none"`。
4. `wireSimDeps` 测试仍当 sim 需要 install 才算真实；O1 默认已是真实模块。
5. 出盘掉落测试、弹簧/磁掌测试仍红（placement/摩擦/桥接）。
6. Google Fonts CDN：`src/styles/index.css` @import + index.html preconnect → SOTA R-13。
7. 低档 bloom 仍开；双 CSS 残留 shell.css（已 gated）。
8. SwiftShader 下帧率不能代表真机。

## SOTA 验收差距

L1 整包仍未签字：测试未全绿、CDN 字体、探针 wiring 标志、7 技能 id 两套词表需在运行时对齐。
L2：双掌/觉醒/碎地代码在，缺全绿与手感盲测。
L3：未做。

## Round 3 冲刺（必须）

1. **测试 152→全绿**（修测试或修实现，禁止空 expect）。
2. probe `usingRealCombat: true` 且 kills≥1。
3. 去掉 googleapis/gstatic；字体用系统精品栈或自托管。
4. 技能 id 一张表（data 与 combat 别名最终收敛）。
5. 删掉对 fallback-combat 的引用。
6. 低档关 bloom；手册廉价信号再扫一遍。
7. juice：hit-stop 短、击中扬尘已有则收束；触控与横屏再核。
8. **不要改其他游戏**。Pages 目录由父调度器在 Round 3 回收后接入。
