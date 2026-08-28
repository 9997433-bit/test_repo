# 《Round 1 结论简报》· 蚀核要塞

主调度器整理。10/10 子代理已回收（3 云端 + 7 本机），产出无冲突合入 `cursor/shihe-yaosai-f69e`。
父 PR：https://github.com/9997433-bit/test_repo/pull/50

## 实测基线（合入后本机跑）

- `npm test`：**30 passed / 2 failed / 32 total**
- `npm run probe`：**PASS**，5580 步 / 93s / **35 kills / 8 leaks / coreHp 12** / 波次 5 / 未胜未败 / p99 step **0.015ms**
- `npm run bench`：**786k steps/sec**
- `npm run build`：退出码 0；主 chunk ≈1484 kB / gzip ≈359 kB（>500kB 警告）

## 已实现

| 角色 | 环境 | 落地 |
| --- | --- | --- |
| F1 架构 | local `bc-69e228d1` | ARCHITECTURE / API_CONTRACT。冻结 tick 序、棱镜折光算法、view.theta、frameEvents。 |
| F2 美术 | local `bc-672faa21` | ART_DIRECTION + tokens/hud.css。冻结 HUD class 全部有样式。 |
| F3 数值 | cloud `cursor/shihe-r1-f3-data-gdd-ac40` | GDD + 5 塔×3 级、护甲表、8 怪、20 波 + 蚀主。 |
| F4 验收 | local `bc-ca27c1a8` | L0–L3 SOTA 与 ACCEPTANCE。画面诚实条款已写。 |
| O1 引擎 | local `bc-f595c666` | WebGPU→WebGL2、三档质量、主循环防御式装配、`window.__SHIHE__`。 |
| O2 世界 | cloud `cursor/shihe-yaosai-world-620d` | 星核/环/24 插座/三轨/五塔剪影/过载过热/敌人实例。world.test 24 绿。 |
| O3 模拟 | cloud `cursor/shihe-yaosai-o3-sim-combat-08ba` | 可玩 sim + combat 曳光。无塔会败、有塔可清 5/20 波（smoke）。 |
| O4 HUD | local `bc-4ac05668` | 坞站 1–5、F 过载、暂停、画质、拾取。双签名兼容。 |
| G1 单测 | local `bc-633a5c78` | 契约测；合入后 2 红。 |
| G2 探针 | local `bc-399a0cde` | probe/bench 已能绿（清 5 波但 8 漏）。 |

## 遗留缺陷（Round 2 必须修，按杀伤排序）

1. **JSON 纯净 `-0`（P0 测红）**  
   `JSON.stringify(-0)` → `0`，`getView` 插座 `x: -0` 导致 `JSON.parse !== value`。sim 输出坐标必须 `+0`。
2. **同种子 80 步敌人仍为 0（P0 测红）**  
   波次入场有延迟；契约要求 80×0.1s 内应有怪。缩短首波 delay，或测试改为等第一只怪（G1 与 O3 对齐：首波 ≤2s 必刷）。
3. **data 出口别名未对齐**  
   F3 导出 `CONFIG/TOWERS/ENEMIES/WAVES/BOSS/ARMOR_MULT`。sim/config.js 还在找 `SIM_CONFIG/BALANCE/TOWER_TABLE/...`，构建期一堆 “is not exported”。F3 补兼容 re-export，或 O3 只读正式名。
4. **探针 5 波 8 漏未胜**  
   放置策略太弱或首波太猛。Round 2 probe 应用固定插座布局（混搭 5 塔）打满 5 波且 leaks≤2、coreHp>0。
5. **主循环双签名尚未收敛**  
   O1/O4 各试多种 `createInput`/`syncHud` 形态。Round 2 只保留 API_CONTRACT 一种，删兼容分支。
6. **弹道双画风险**  
   world/shots.js 与 combat/index.js 都可能画 `view.shots`。冻结：shots 只由 `src/combat` 画，world 不画弹道。
7. **包体**  
   主 chunk 1.48MB。O1 尽量 deep-import；不在 R2 强行削到 <500kB，但要记下预算。
8. **Pages / catalog 卡** 仍由父调度器 Round 3 接，子代理勿改 `.github`。

## 性能

模拟极快（µs 级/步）。渲染未在本父机做 GPU 长测。Round 2 必须 `npm test` 全绿、`probe` 5 波核心不破。

## SOTA 差距

约 **L1 模块内成立、整包接近 L1**：引擎+世界+sim 已合入，但 2 测红、data 别名、弹道双画、HUD 双签名会在真机上出鬼。L2（20 波+Boss、棱镜折光可辨、过载变色）未整包验收。

## Round 2 攻坚重点（注入全部 10 代理）

1. 消灭 `-0`；首波 ≤2s 出怪；同种子确定性测绿。  
2. data 与 sim 只走正式导出名。  
3. 删双签名；shots 只 combat 画。  
4. `npm test` 全绿；probe 5 波 leaks≤2。  
5. 不要改其他游戏目录，不要改 pages workflow。
