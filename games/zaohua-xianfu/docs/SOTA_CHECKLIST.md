# SOTA 验收清单（Round 3 复审版）

逐项可勾选清单，与 `docs/ACCEPTANCE.md` 的 G/B 编号互通。勾选规则：

- `[x]` = 已用可复现方法验证通过；`[ ]` = 未通过或未验证（差距写在条目内）。
- 复审基线：commit `274b40e`（2026-08-26 Round 3，于该提交的干净检出复测）。Round 2 开项本轮大批闭环：
  **R2-1 槽型定案**（41048af 万魂灯移通用槽，维持 1 攻/1 防/2 通）、**R2-3 修业接线**（cc73d8b TICK
  改吃仙府侧口径）、**R2-5 直入账阈值提至 60s**（bfb6aa6）、**R2-6 回归补回**（df4fc78）、
  **R2-2 的死代码已删**（c9068c0），R2-2 仅剩 UI 一句旧文案。仍开：R2-2 残余、R2-4、R2-7、R2-8、
  R2-9、R2-10。工作区另有并发未提交的数值调整（enemies/realms，应为 R2-4/R2-8 在途），复测以重跑为准。
- 复测入口：`cd games/zaohua-xianfu && npm test && npm run probe && npm run bench && node scripts/stress.mjs`。
- 差距编号沿用 R2-1..R2-10，不再新开；已闭环项与仍开项见文末总表。

## 一、工程门槛（G0）

- [x] `npm test` 全绿 —— Round 3 实测 5 文件 **37 用例**通过（Round 2 为 34；df4fc78 补回 坏档备份+saveCorrupt 事件、建筑 id 高于存档最大编号、直入账+8h 封顶 三条回归）。验证：`npm test`，退出码 0。
- [x] `npm run probe` ok —— `ok:true`、`portOk:true`、`exportsOk:true`，17 个契约 action 全覆盖（reducer 另有契约外 `RESUME`，probe 不要求）。Round 3 在 274b40e 干净检出复测通过。
- [x] `npm run bench` ok —— Round 3 实测 200 场 17–38ms（Round 2 为 15–53ms，阈值 800ms）；**产量 checksum 1011.25 锚点未漂**（槽型定案、修业接线、阈值上调均未碰经营产出数值）。
- [x] 目录隔离 —— `rg -n "\.\./\.\./|games/linghuashi|games/bingqi" src/ tests/ scripts/ index.html vite.config.js` 无命中（Round 3 在 274b40e 复扫，退出码 1）。
- [ ] 不污染仓库根 —— 根级 `package-lock.json` 仍以未跟踪状态存在，**任何人不得将其入库**（R2-10）。验证：`git status --short` 中它只能是 `??`（Round 3 复核仍为 `??`）。
- [x] `npm run build` 走通（G0.5）—— Round 3 在 274b40e 复测构建成功（js 99.7KB / gzip 37.3KB）；Round 2 已验 preview 产物 4180 端口 HTTP 200 指向构建资产。4174 被共享工作区的 dev server 占用，独占环境发布前请按 4174 复测一次。

## 二、核心循环与仙府经营（G1/G2）

- [x] **P0-1 已修**：页签/地块点击即时重绘（G1.3/G2.1）—— `ui/app.js` 的 `tab`/`plot`/`sel-disciple` 分支均调 `repaint()`。jsdom 实测：开府→点修炼页签立即切屏、点空地立即出营造菜单（Round 2 一次性脚本 9/9 断言通过，方法见附录）。**该冒烟脚本尚未收编进 `tests/`（R2-7，Round 3 复核 tests/ 仍无 ui-smoke）**。
- [x] **P0-2 已修**：建筑 id 从现存 state 推导（G2.6）—— `core/state.js#nextBuildingId` 取最大编号 +1；jsdom 实测载入含 `b-7` 的档再建造得 `b-8`，全表无重复。回归用例已补回（df4fc78 "allocates a building id above the highest persisted numeric id"，R2-6 该项闭环）。
- [x] 开府门三阵营 + 道号；开府种下 洞府/聚灵阵/灵田 —— economy 测试覆盖。
- [x] 建造扣资源、占地、唯一建筑拒绝重复 —— economy/regressions 覆盖。
- [x] 灵脉正交邻接 +15%/条 —— regressions 覆盖（4 条=×1.6）；**负邻接已实装**（炉火燎田 -8%、药烟熏苗 -5%，`mansion/layout.js`），与 GDD 邻接表两侧一致。
- [ ] 升级产量差 / 洞府门控文案浏览器实测（G2.2/G2.4）—— reducer 与 screens 逻辑在位，P0-1 解除阻塞后尚无人手玩勾验（R2-9）。

## 三、弟子（G3）

- [x] 派遣改变产量口径 —— `yieldMultiplier` 测试；production 按驻守弟子乘算。
- [x] 传功消耗与专业成长 —— `trainCost` + economy 覆盖。
- [ ] 派遣/礼聘/门控浏览器实测（G3.1/G3.3）—— `ui/rules.js` 已改为「由 reducer 试算」出规则展示，口径同源；浏览器核对待 R2-9。
- [x] **AD-17 已收敛闭环**（G3.4，R2-3）：TICK 改经 `core/study.js#grantScriptureXp` 照仙府侧 `production.scriptureXpAward` 的账发放（cc73d8b + 277e937），`disciples/train.js` 同步改为照该账入账（47a7f1e）。最终口径：**只有驻藏经楼的弟子涨修业；修业只涨 xp、满条封顶显示「可晋阶」，专业 +1 仍须 TRAIN 付丹药灵草**——藏经楼不再白送等级，TRAIN 付费价值回归。UI 弟子页文案同步（「修业已满，可传功晋阶」，晋阶路径展示由 reducer 试算）。Round 3 运行时验证（reducer 直跑）：驻藏经楼弟子 10s 涨 xp 0.756、驻灵田弟子 xp 0、xp 灌满后 TICK 封顶在 `xpNeeded`（32）且 profession 不变。小测试债：该链路暂无专项回归用例，建议随 R2-7 一并补。

## 四、修炼与突破（G4）

- [x] 吐纳：灵气 -4、修为 +（6+境界）—— progression 覆盖。
- [x] 破境失败/成功口径 —— progression/regressions 覆盖（丹药 ×0.4、心魔 +8%/次封顶 +40%、第 9 层跨境清零）。
- [x] **P1-3 已修**：吐纳 ×10 按钮 + 自动吐纳开关（250ms 节流，灵气不足自动停）—— jsdom 实测两控件在位可点。开自动后到元婴的手动点击 ≈1 次，G4.4 达标。

## 五、战斗 / 塔 / 兽潮 / 法器（G5）

- [x] 同 seed 战报完全确定 —— combat + regressions 双锁，新增「法器触发汇总确定性」用例。
- [x] 塔每章 10 层、5/10 层首领、失败不掉层有安慰奖 —— 测试 + 数据实现；章节主题六系循环无层数上限。
- [x] 仙友 KITS 16 位齐全、残阳灼烧每秒 1 次 —— 与 Round 1 结论一致，battle.js 重构（applyTriggers 接线）后测试仍绿。
- [x] `applyTriggers`/`createBus` 死代码销项 —— applyTriggers 现为战斗内核唯一触发查询（12ff624）；createBus 是 store 事件总线的实际实现。
- [x] **P1-4 已修（口径拍板）**：万魂灯 = **我方每名上阵者阵亡时各复活一次（每人每场一次）**。机制（battle.js 单位 `revived` 旗标）、data 文案、GDD 第 164 行拍板、测试（"revives every fallen ally once and never twice"）四方一致。中途经历 12ff624（改为一场一次）→ 97b32e2（反转回每人一次）的对撞，最终以 GDD 为准，**机制不再改动**。
- [x] 掉落表数据驱动（AD-9）：store 的塔/潮发放全部读 `data/artifacts.js#ARTIFACT_DROPS`（18 节点全实装，「规划」标记清空；20 件 = 2 开局 + 18 掉落），regressions 用例遍历表断言。
- [x] **R2-1 槽型口径已定案闭环**（G5.4，AD-8）：判决维持实现侧 **1 攻/1 防/2 通**（`core/state.js#ARTIFACT_SLOT_CAPS`，同槽淘汰），数据侧配套把**万魂灯从防槽移通用槽**（41048af）——复活属「命数」类容错，不减伤不回血，不占防位。移槽后基准四件套 七星灯（防）+ 万魂灯（通）+ 论道图（通）+ 朱雀弓（攻）恰好占满四槽合法，GDD 魔族终盘链（防槽三光 + 通槽万魂灯）同样合法；`simulate` 不读 slot，进度墙校准锚点保住（bench checksum 未漂佐证）。
  - 四方一致已核：机制（state.js）/ data（artifacts.js 万魂灯 `slot:"util"`）/ GDD（第 149/175/193 行改为定案文）/ UI（槽位盘各槽容量与同槽顶替文案 9a8b443、按钮按 reducer 试算决定可点性 f777a31）；测试锁定（"caps artifacts at one attack, one defend, and two utility slots"）。
  - 共同底线「不允许 4 件同为攻击位」成立（攻槽仅 1 席）。
  - 遗留提醒：Round 2 附录探针中标注「1/1/2 合法」的 朱雀/万魂/河图/太虚 组在移槽后变为 1 攻 3 通**不合法**，合法最优参照改为基准四件套（见附录更注）。
- [ ] 七星灯/镇岳钟浏览器战报实测（G5.5/G5.7）—— 单测已锁 mitigation/execution 在线（combat-artifacts 套件），战报可视化验证归 R2-9。

## 六、放置挂机与存档（G6）

- [x] **P1-1/AD-18 已修**：BOOT/RESUME 的 banked 结算走 `offlineEfficiency`（50% + 6%×聚灵阵总等级，封顶 90%；契约缺席回退满效率而非静默扣产）。回归用例锁定 2h 离线 = 满效率产量 × 0.56（1 级阵），府报显示「按聚灵阵折算 56%」。
- [x] **R2-5 已闭环**：简报「二选一」走了改代码一侧——`OFFLINE_DIRECT_SEC` 已提至 **60 秒**（bfb6aa6），≤60s 视为没离开、满效率直入账不弹匣，G6.3 原文「阈值 ≥60 秒」达标，本文门槛不再需要下调。小测试债：回归用例仍以 8s 命题（8s < 60s 仍直入账故通过），60s 边界本身未钉死，建议随 R2-7 一并补。
- [x] 存档 schema 守卫：坏 JSON / 版本不符 / storage 异常回退 —— regressions 保留 loadSave 三态用例。
- [x] `saveCorrupt` 事件已实装（P2-2 已修）：`store.prepareBoot` 备份坏档并 emit，`main.js` 监听落 console 提示。事件发射回归用例已补回（df4fc78 "backs up a malformed save, emits the corruption event, and boots a fresh state"，R2-6 该项闭环）。
- [x] 关页兜底（P2-5 已修）：`visibilitychange(hidden)` 与 `pagehide` 均调 `store.flush()`，TICK 节流窗口内的脏状态落盘。
- [x] 存档瘦身：战报只留末帧，快照 <8KB —— 回归用例锁定。
- [x] 离线 8h 封顶（`OFFLINE_CAP_SEC`）—— 回归用例已补回（df4fc78 "applies exactly 8 seconds directly and caps banked offline time at 8 hours"，R2-6 三项全部闭环）。注：阈值随后提至 60s（bfb6aa6），该用例的 8s 断言仍成立（8s < 60s 直入账），但标题与 60s 边界未更新，见 R2-7 尾巴。
- [ ] 刷新不丢浏览器实测（G6.1）—— 归 R2-9。

## 七、稳定性与性能（G7）

- [x] 200 场模拟 <800ms —— Round 3 实测 17–38ms（Round 2 为 15–53ms）。
- [ ] 10 分钟手玩不崩（G7.1）—— P0-1 已解除阻塞，尚未有人执行（R2-9）。
- [ ] 脚本化 soak 测试（G7.2）—— 仍无（R2-7）。建议：TICK×6000 + 随机合法 action，断言资源有限非负、state 可序列化。

## 八、视觉 / 无障碍 / 响应式（G8）

- [ ] 作品集级国风视觉（G8.1）—— 9b9b76d 水墨底 + 7164c77 五行地色/风水评签/槽位三色两轮打磨后**需重截三屏**对照 ART_DIRECTION 评审（R2-9）。
- [ ] 窄屏 390px 全流程（G8.2）—— 断点已到 420px（layout.css 860/640/420），390px 未实测。
- [x] 键盘可玩（G8.3，P2-4 已修）—— `ui/app.js` 监听 keydown，Enter/Space 激活 `[data-act][role="button"]`；jsdom 实测 Enter 触发地块无异常。
- [x] 顶栏道号转义（P2-3 已修）—— `esc(state.meta.name)`；jsdom 用道号 `<b>试探` 实测按文本渲染不注入。
- [x] `prefers-reduced-motion` 全局停动画 —— tokens/layout/mansion 三处 media query。
- [x] 资源字段名全链路一致（qi/herb/wood/ore/stone/pills/jade）。

## 九、GDD 与实现口径（Round 1 五处冲突销项 + Round 2 新增两处已判决）

- [x] 锻造房 —— GDD 已改为「仙玉 0.04/s + 全队攻 +3/级」，与实现一致。
- [x] 被克 ×0.92 —— GDD 第 111 行已写明（占优 ×1.18 / 被克 ×0.92）。
- [x] 法器升星 —— 已从 GDD 移除，无星级系统；瑶光贝改为开场护盾。
- [x] 仙友解锁 —— GDD 收敛为纯礼聘制（仙玉 6/输出位 8 + 灵石 40），与 `RECRUIT` 实扣一致。
- [ ] **R2-2 兽潮败战税基已定案，仅剩一句 UI 旧文案**（AD-12）：判决维持实现侧**未收取税**——挂机匣待领 + ≤2s 未入账尾巴全没收、「库存分毫未动」，GDD 已反转改写（41048af，第 249/254 行现为「以挂机匣为赌注」定案文并废弃库存税口径），测试锁定（"forfeits only uncollected output after a failed beast wave"），`combat/wave.js` 的 `waveReward.loseTax`（库存 30%）死分支**已删**（c9068c0）。机制/GDD/测试三方一致，唯一残余（Round 3 复核 274b40e 仍在）：
  - UI：`ui/screens.js` 兽潮页仍是 Round 1 旧文案「失败将散失三成灵草/灵木/灵矿」，玩家提示与实际结算不符——四方一致的最后一方。归属：Opus-4。验证：`rg -n "散失三成" src/` 应无命中。

## Round 3 状态总表（编号沿用 R2-*）

已闭环（Round 3 在 274b40e 复核确认）：

| 编号 | 判决/修复 | 落地提交 | 复核证据 |
| --- | --- | --- | --- |
| R2-1 | 槽型维持 1 攻/1 防/2 通，万魂灯移通用槽，基准四件套合法，四方一致 | 41048af（GDD/data）+ 9a8b443/f777a31（UI） | `rg -n '"wanhun".*slot: "util"' src/data/artifacts.js` 命中；37 用例含槽容量锁 |
| R2-3 | TICK 经 `core/study.js` 吃仙府侧修业账；xp 满条封顶，晋阶仍须 TRAIN 付费 | cc73d8b + 47a7f1e + 277e937 | reducer 直跑：驻藏经楼涨 xp、驻灵田为 0、灌满后 profession 不变 |
| R2-5 | `OFFLINE_DIRECT_SEC` 提至 60s，满足 G6.3「阈值 ≥60 秒」 | bfb6aa6 | `rg -n "OFFLINE_DIRECT_SEC = 60" src/core/offline.js` 命中 |
| R2-6 | 三条被删回归全部补回：坏档+saveCorrupt、bid 唯一、直入账+8h 封顶 | df4fc78 | `rg -n "b-7\|saveCorrupt\|OFFLINE_CAP" tests/` 命中；`npm test` 37 绿 |
| R2-2 之死代码 | `waveReward` 败战 `loseTax` 死分支已删 | c9068c0 | `rg -n loseTax src/` 无命中 |

仍开项（按优先级）：

| 级别 | 编号 | 一句话 | 归属 | 验证命令 |
| --- | --- | --- | --- | --- |
| P1 | R2-2 残余 | 税基已定案未收取税，四方只差 UI：兽潮页旧文案「失败将散失三成」仍在 | Opus-4 | `rg -n "散失三成" src/` 应无命中 |
| P1 | R2-4 | 终盘缺口扩大：仓库内 stress 矩阵（合法终盘套）渡劫 9 层 F40 = 85/22/0（人/神/魔），**神族也低于 60% 线**；飞升 1 层才 100/100/93 | Fable-3 / Opus-3（工作区已见 enemies/realms 未提交改动） | `node scripts/stress.mjs` 看 tribulation-9 |
| P2 | R2-8 | 塔 45 层五种探针场景三阵营全 0%，与「渡劫：45 层之后仍有压力」文案不符 | Fable-3 / Opus-3 | `node scripts/stress.mjs` 看各场景 F45 |
| 测试债 | R2-7 | UI 冒烟（jsdom 9 断言）与 soak 仍在仓库外（tests/ 仍只有 5 文件）；顺带补 修业接线与 60s 直入账边界两条小回归 | GPT-sol-1 | `ls tests/` 出现 ui-smoke / soak |
| 验收债 | R2-9 | 浏览器手玩验收（10 分钟 / 390px / 三屏截图 / 战报可视化）仍未执行，Round 3 主调度器补 | Opus-4 | `npm run dev` → 4174 手玩 |
| 纪律 | R2-10 | 根 `package-lock.json` 仍未跟踪，禁止入库 | 全员 | `git status --short` 只见 `??` |

## 附录：平衡探针数据（Round 3 以仓库内矩阵为准）

### 塔层胜率矩阵（**权威**：`node scripts/stress.mjs`，1e2128c 固化入库，274b40e 实跑）

60 seed/格 × 6 检查层 × 3 阵营 × 5 场景 = 5400 场，`ok:true`、`invalid:0`、耗时 ≈324ms。
五套法器均为 1/1/2 定案下**合法**配装。单元格「人/神/魔」，单值表示三阵营相同：

| 场景（境界 · 建筑 · 法器） | F20 | F25 | F30 | F35 | F40 | F45 |
| --- | --- | --- | --- | --- | --- | --- |
| spirit-5：化神 5 · 8 级 · 基准套（诛魔/七星/万魂/论道） | 100 | 100 | 0 | 0 | 0 | 0 |
| mahayana-5：大乘 5 · 12 级 · 基准套 | 100 | 100 | 100 | 100/95/80 | 0 | 0 |
| tribulation-9：渡劫 9 · 12 级 · 终盘套（朱雀/七星/万魂/河图） | 100 | 100 | 100 | 100 | **85/22/0** | 0 |
| tribulation-9-no-revive：同上去万魂灯（换太虚） | 100 | 100 | 100 | 100 | **0** | 0 |
| ascend-1：飞升 1 · 12 级 · 终盘套 | 100 | 100 | 100 | 100 | 100/100/93 | 0 |

结论（Round 3）：
1. 1–35 层随境界逐段放行，B1/B2/B3 线全过（F35 = 100/95/80 ≥ 60%）；
2. **万魂灯仍是终盘承重墙**——终盘套去掉它 F40 三阵营全崩到 0%；R2-1 判决以移通用槽的方式把它保进了合法套，终盘结构成立；
3. **R2-4 缺口比 Round 2 认知更宽**：渡劫 9 层合法终盘套 F40 = 85/22/0，**神族 22% 与魔族 0% 都低于 B4 的 60% 线**，飞升 1 层才回到 100/100/93；
4. F45 五场景全 0%，`REALMS` 渡劫 perk 文案「45 层之后仍有压力」暂无实据（R2-8）。

### UI 冒烟（Round 2 jsdom 一次性脚本，9/9 通过；R2-7 待收编）

方法：jsdom 建 `#app` → `createStore`+`createUI` → BOOT。断言：开府门三卡；选阵营即入沙盘；
道号 `<b>试探` 顶栏按文本渲染；点修炼页签 stage 立即含「吐纳」；吐纳×10/自动吐纳按钮在位；
点空地 stage 立即含 `data-act="build"`；地块 `role="button"` 且 Enter 可激活；
载入含 `b-7` 的档再建造得 `b-8` 且全表 id 唯一。建议 GPT-sol-1 原样收编为 `tests/ui-smoke.test.js`。

### Round 2 一次性塔层探针（历史留档，基线 893d94f，方法未入库）

> Round 3 更注：此表为 Round 2 场外脚本所测，状态构造与入库矩阵不同（法器组、建筑加成等差异），
> 读数不能与上面的权威矩阵混用，仅留档对照。**合法性标注已按 R2-1 定案反转**——万魂灯移通用槽后，
> 「含万魂灯四件套」（七星灯/万魂/论道/朱雀）成为合法基准，原标「1/1/2 合法」的
> 朱雀/万魂/河图/太虚 组变为 1 攻 3 通不合法。已在行内改注。
> 「固化为脚本纳入仓库」的建议已由 1e2128c 落成 `scripts/stress.mjs`（尚未挂 CI/npm script）。

| 配置（合法配装另注） | F20 | F25 | F30 | F35 | F40 | F45 |
| --- | --- | --- | --- | --- | --- | --- |
| 化神 5 层 · 建筑 8 级 | 100/100/100 | 100/100/93 | 0 | 0 | 0 | 0 |
| 大乘 5 层 · 建筑 12 级 | 100 | 100 | 100 | 100/98/88 | 0 | 0 |
| 渡劫 9 层 · 基准四件套 七星灯/万魂/论道/朱雀（**定案后合法**） | 100 | 100 | 100 | 100 | 98/85/18 | 0 |
| 渡劫 9 层 · 朱雀/万魂/河图/太虚（原注合法，**定案后 1 攻 3 通不合法**） | 100 | 100 | 100 | 100 | 97/60/0 | 0 |
| 渡劫 9 层 · 无万魂灯组（合法） | 100 | 100 | 100 | 100 | 7/2/0 | 0 |
| 飞升 · 朱雀/万魂/河图/太虚（**定案后不合法**） | 100 | 100 | 100 | 100 | 100/100/85 | 0 |

### 工程基线（Round 3 于 274b40e 干净检出复测）

`npm test` 37 用例全绿（5 文件）；`npm run probe` ok；`npm run bench` 200 场 17–38ms、产量 checksum 1011.25（锚点未漂）；
`node scripts/stress.mjs` 5400 场 `ok:true`；构建 99.7KB(js)/gzip 37.3KB；隔离扫描零命中；根 `package-lock.json` 仍为 `??` 未跟踪。
