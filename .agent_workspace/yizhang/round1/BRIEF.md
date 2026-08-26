# 《Round 1 结论简报》· 异掌

主调度器整理。10/10 云端子代理已回收，产出已无冲突合入 `cursor/yizhang-db8d`。
父 PR：https://github.com/9997433-bit/test_repo/pull/20

## 实测基线（合入后本机跑）

- `npm test`：**91 passed / 6 failed / 97 total**
- `npm run probe`：**PASS**，3600 步 / 60s / **2 kills** / 4 人移动 / p99 step 0.041ms
- `npm run bench`：~153871 steps/sec，4 players，dt 1/60

通过的模块内测：`src/sim/sim.test.js` 33、`src/combat/combat.test.js` 32、`src/ai/bots.test.js` 19、`tests/sim-determinism.test.js` 1。

## 已实现

| 角色 | 分支 | 落地 |
| --- | --- | --- |
| F1 架构 | `yizhang-r1-f1-architecture-96e9` | ARCHITECTURE / API_CONTRACT / OWNERSHIP。tick 序、tile ADR、yaw 待统一。 |
| F2 美术 | `yizhang-r1-art-styles-6600` | ART_DIRECTION + `src/styles/**` 暮蓝/暖金、材质化 HUD、触控 48/72dp。 |
| F3 数值 | `yizhang-r1-f3-gdd-data-13b6` | GDD + 8 掌数据、解锁、碎地、Bot 人格表。 |
| F4 验收 | `yizhang-fable4-sota-71f9` | L0–L3 清单与 ACCEPTANCE。 |
| O1 模拟 | `yizhang-o1-sim-b061` | createMatch/step/getView、击退、掉落、碎地网格、兜底 combat。人类 id **p0**。 |
| O2 渲染 | `yizhang-r1-opus2-render-c886` | Three.js 岛/角色/VFX/三档画质，smoke.html。 |
| O3 技能 AI | `yizhang-opus3-combat-ai-e6e8` | 8 技能 + brute/fox/bully，51 测绿（合入后 combat/ai 测仍绿）。 |
| O4 壳 | `yizhang-r1-opus4-shell-6263` | 主循环、触控、音频、菜单。人类 id **p1**（与 sim 冲突）。自带 fallback 与 `shell.css`。 |
| G1 单测 | `yizhang-unit-tests-2da1` | tests/* 契约测，6 条仍红。 |
| G2 探针 | `yizhang-probe-bench-26a3` | probe/bench 已能绿。 |

## 遗留缺陷（Round 2 必须修，按杀伤排序）

1. **人类 id 分裂（P0 阻塞可玩）**  
   `src/sim` 人类是 `p0`，`src/main.js` `SELF_ID = "p1"`，输入打到不存在的 id。合入后真实开局玩家可能不会动。统一为 **`p0`**。
2. **sim 未安装真实 data/combat**  
   `installData` / `installCombat` 主循环没调用；运行时仍走 sim 兜底棉掌，8 技能不会进局。main 启动后必须静态或显式注入。
3. **朝向约定分裂**  
   测试 helpers：`yaw=0` 朝 **+Z**。sim README：`yaw=0` 朝 **-Z**。导致 `tests/slap-combat` 正前方扇空。冻结：**yaw=0 朝 -Z（与 Three mesh.rotation.y 一致）**，测试改 helpers。
4. **契约测试 6 红**  
   - `isGloveUnlocked` 未从 data 导出  
   - glove 对象多了 `awakenModifiers` 等，测试用 `toEqual(expect.objectContaining)` 却对整对象 deep equal 写法有误或缺字段类型  
   - 出盘掉落：sim 护栏夹住 rim，水平出盘不一定 `alive=false`  
   - `isMatchOver` 只读 `match.over`，测试直接改 `kills` 不 step 则仍 false（应即时读 kills 或测试改 step）  
   - magnet 经 `step` 未缩短距离（技能没接到 sim）
5. **碎地三套拓扑**  
   F1：2 心 + 12 板；F3：3 环 × 24 扇 = 72；O1：2.5m 方格 ~208。渲染按自己的 island 网格。Round 2 冻结一套，sim/data/render 对齐。
6. **双 CSS**  
   F2 `src/styles` 与 O4 `src/ui/shell.css` 并存。HUD class 名可能对不上（F2 是 `.yz-*`）。O4 应改用 F2 class 契约，shell.css 只做 critical fallback。
7. **getView 形状**  
   O2 容忍残缺 view；需保证 tiles/players/events 字段与 render 对得上（hp、gloveId、awakenedT）。
8. **Pages 目录卡 / workflow** 尚未接（父调度器 Round 3 做，子代理勿改 `.github`）。

## 性能

模拟极快（µs 级/步）。渲染只在 SwiftShader/子代理侧验证过构图，本机未测 GPU。Round 2 要保证 Vite build 通过，质量档 API 被 main 的 quality probe 真正调用。

## SOTA 差距

对照 F4：约 **L1 部分达到**（walk/slap/knock/bot/probe 在模块内成立），**整包未达 L1**，因为壳与 sim 未接线。L2（双掌手感、觉醒、碎地改变落点、8 掌可辨）未验收。视觉手册底座 B 在 render smoke 与 CSS 里有，但实战 HUD 可能仍是 O4 自绘。

## Round 2 攻坚重点（注入全部 10 代理）

1. 统一 `p0`、yaw=-Z、tile 拓扑、Input 世界/朝向空间。  
2. main 注入 data+combat，玩家能扇、8 技能进局、Bot 用 `ai.think`。  
3. 测试 97→全绿；probe 保持有击杀。  
4. HUD 改用 F2 `.yz-*`；触控与 WebGL 同屏可打。  
5. 删/收缩各层 fallback，避免双模拟。  
6. 解锁 `isGloveUnlocked` + `yizhang-save-v1`。  
7. 碎地破洞必须改变 `hasFloorUnder` / 掉落。  
8. 不要改其他游戏目录，不要改 pages workflow。
