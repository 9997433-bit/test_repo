# SOTA 验收清单（Round 2 校准版）

逐项可勾选清单，与 `docs/ACCEPTANCE.md` 的 G/B 编号互通。勾选规则：

- `[x]` = 本轮已用可复现方法验证通过；`[ ]` = 未通过或未验证（差距写在条目内）。
- 校准基线：commit `893d94f` + 2026-08-26 08:00 UTC 前后的并发工作区。**注意：本轮验证期间 HEAD
  前移了 8 个提交**（P0 两项、P1 四项均在验证窗口内被并发修复），复测请以重跑命令的结果为准。
- 复测入口：`cd games/zaohua-xianfu && npm test && npm run probe && npm run bench`。
- Round 1 差距编号（P0-1..P2-5）沿用上一版；本轮新开项编号 R2-1..R2-10，见文末总表。

## 一、工程门槛（G0）

- [x] `npm test` 全绿 —— 实测 5 文件 34 用例通过（Round 1 为 24，新增 combat-artifacts 套件与槽型/税基/离线效率回归）。验证：`npm test`，退出码 0。
- [x] `npm run probe` ok —— `ok:true`、`portOk:true`、`exportsOk:true`，17 个契约 action 全覆盖（reducer 另有契约外 `RESUME`，probe 不要求）。
- [x] `npm run bench` ok —— 200 场 15–53ms（阈值 800ms）；**产量 checksum 1011.25 锚点未漂**（负邻接、新建筑等经营改动未破坏基线盘面）。
- [x] 目录隔离 —— `rg -n "\.\./\.\./|games/linghuashi|games/bingqi" src/ tests/ scripts/ index.html vite.config.js` 无命中（实测退出码 1）。
- [ ] 不污染仓库根 —— 根级 `package-lock.json` 仍以未跟踪状态存在，**任何人不得将其入库**（R2-10）。验证：`git status --short` 中它只能是 `??`。
- [x] `npm run build` 走通（G0.5）—— 实测构建成功（js 92KB / gzip 35KB）；preview 产物在 4180 端口实测 HTTP 200 且指向构建资产。4174 被共享工作区的 dev server 占用，独占环境发布前请按 4174 复测一次。

## 二、核心循环与仙府经营（G1/G2）

- [x] **P0-1 已修**：页签/地块点击即时重绘（G1.3/G2.1）—— `ui/app.js` 的 `tab`/`plot`/`sel-disciple` 分支均调 `repaint()`。jsdom 实测：开府→点修炼页签立即切屏、点空地立即出营造菜单（本轮一次性脚本 9/9 断言通过，方法见附录）。**该冒烟脚本尚未收编进 `tests/`（R2-7）**。
- [x] **P0-2 已修**：建筑 id 从现存 state 推导（G2.6）—— `core/state.js#nextBuildingId` 取最大编号 +1；jsdom 实测载入含 `b-7` 的档再建造得 `b-8`，全表无重复。**但 07dae75 重写回归测时把 bid 唯一性用例删了（R2-6）**。
- [x] 开府门三阵营 + 道号；开府种下 洞府/聚灵阵/灵田 —— economy 测试覆盖。
- [x] 建造扣资源、占地、唯一建筑拒绝重复 —— economy/regressions 覆盖。
- [x] 灵脉正交邻接 +15%/条 —— regressions 覆盖（4 条=×1.6）；**负邻接已实装**（炉火燎田 -8%、药烟熏苗 -5%，`mansion/layout.js`），与 GDD 邻接表两侧一致。
- [ ] 升级产量差 / 洞府门控文案浏览器实测（G2.2/G2.4）—— reducer 与 screens 逻辑在位，P0-1 解除阻塞后尚无人手玩勾验（R2-9）。

## 三、弟子（G3）

- [x] 派遣改变产量口径 —— `yieldMultiplier` 测试；production 按驻守弟子乘算。
- [x] 传功消耗与专业成长 —— `trainCost` + economy 覆盖。
- [ ] 派遣/礼聘/门控浏览器实测（G3.1/G3.3）—— `ui/rules.js` 已改为「由 reducer 试算」出规则展示，口径同源；浏览器核对待 R2-9。
- [ ] **AD-17 半收敛**（G3.4，R2-3）：mansion 侧已落地「藏经楼只产修业、只有驻藏经楼的弟子领修业」的口径（`production.js` 的 `scriptureXpFor/scriptureXpAward`），但 **disciples 层未消费**——`disciples/train.js#scriptureXp`（store TICK 实际调用方）仍给任意驻守弟子发修业并免费晋阶，TRAIN 的付费价值仍被架空。归属：Opus-2 接口 + Opus-1 接线。验证（修复后）：派驻灵田的弟子修业不涨，驻藏经楼的弟子修业按 `xpAt` 涨。

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
- [ ] **R2-1 槽型口径两案相撞**（G5.4，本轮最高优先）：
  - 实现侧（07dae75）：`ARTIFACT_SLOT_CAPS = 1 攻/1 防/2 通`，槽内 FIFO，测试锁定（"caps artifacts at one attack, one defend, and two utility slots"）。
  - GDD 侧（893d94f，第 149 行）：拍板「任一槽型至多 2 件（专属 + 万用）」，且基准四件套 七星灯（防）+ 万魂灯（防→万用）+ 论道图 + 朱雀弓 **必须可同时佩戴**——在现实现下第二件防具会顶掉第一件，基准套装不上，GDD 的魔族终盘方案（防槽三光 + 万用万魂灯）与进度墙校准锚点同时失效。
  - 两案共同底线「不允许 4 件同为攻击位」均满足；分歧在防具可否占两席。归属：Fable-3 与 Opus-1 对齐，**改哪一侧，哪一侧重标进度墙并同步测试与 UI**。
- [ ] 七星灯/镇岳钟浏览器战报实测（G5.5/G5.7）—— 单测已锁 mitigation/execution 在线（combat-artifacts 套件），战报可视化验证归 R2-9。

## 六、放置挂机与存档（G6）

- [x] **P1-1/AD-18 已修**：BOOT/RESUME 的 banked 结算走 `offlineEfficiency`（50% + 6%×聚灵阵总等级，封顶 90%；契约缺席回退满效率而非静默扣产）。回归用例锁定 2h 离线 = 满效率产量 × 0.56（1 级阵），府报显示「按聚灵阵折算 56%」。
- [ ] **R2-5 离线直入账阈值**：仍为 8 秒（`OFFLINE_DIRECT_SEC`），但语义已改为「≤8s 视为没离开，满效率直入账不弹匣」；G6.3 原文要求阈值 ≥60 秒。10 秒切页仍会弹匣，是否上调归 Fable-3 拍板（P2 级）。
- [x] 存档 schema 守卫：坏 JSON / 版本不符 / storage 异常回退 —— regressions 保留 loadSave 三态用例。
- [x] `saveCorrupt` 事件已实装（P2-2 已修）：`store.prepareBoot` 备份坏档并 emit，`main.js` 监听落 console 提示。**但事件发射的回归用例在 07dae75 重写中被删（R2-6）**。
- [x] 关页兜底（P2-5 已修）：`visibilitychange(hidden)` 与 `pagehide` 均调 `store.flush()`，TICK 节流窗口内的脏状态落盘。
- [x] 存档瘦身：战报只留末帧，快照 <8KB —— 回归用例锁定。
- [ ] 离线 8h 封顶行为在 `core/offline.js` 仍实现，但其回归用例同批被删（R2-6）。
- [ ] 刷新不丢浏览器实测（G6.1）—— 归 R2-9。

## 七、稳定性与性能（G7）

- [x] 200 场模拟 <800ms —— 实测 15–53ms。
- [ ] 10 分钟手玩不崩（G7.1）—— P0-1 已解除阻塞，尚未有人执行（R2-9）。
- [ ] 脚本化 soak 测试（G7.2）—— 仍无（R2-7）。建议：TICK×6000 + 随机合法 action，断言资源有限非负、state 可序列化。

## 八、视觉 / 无障碍 / 响应式（G8）

- [ ] 作品集级国风视觉（G8.1）—— 9b9b76d 水墨底 + 7164c77 五行地色/风水评签/槽位三色两轮打磨后**需重截三屏**对照 ART_DIRECTION 评审（R2-9）。
- [ ] 窄屏 390px 全流程（G8.2）—— 断点已到 420px（layout.css 860/640/420），390px 未实测。
- [x] 键盘可玩（G8.3，P2-4 已修）—— `ui/app.js` 监听 keydown，Enter/Space 激活 `[data-act][role="button"]`；jsdom 实测 Enter 触发地块无异常。
- [x] 顶栏道号转义（P2-3 已修）—— `esc(state.meta.name)`；jsdom 用道号 `<b>试探` 实测按文本渲染不注入。
- [x] `prefers-reduced-motion` 全局停动画 —— tokens/layout/mansion 三处 media query。
- [x] 资源字段名全链路一致（qi/herb/wood/ore/stone/pills/jade）。

## 九、GDD 与实现口径（Round 1 五处冲突销项 + 本轮新增）

- [x] 锻造房 —— GDD 已改为「仙玉 0.04/s + 全队攻 +3/级」，与实现一致。
- [x] 被克 ×0.92 —— GDD 第 111 行已写明（占优 ×1.18 / 被克 ×0.92）。
- [x] 法器升星 —— 已从 GDD 移除，无星级系统；瑶光贝改为开场护盾。
- [x] 仙友解锁 —— GDD 收敛为纯礼聘制（仙玉 6/输出位 8 + 灵石 40），与 `RECRUIT` 实扣一致。
- [ ] **R2-2 兽潮败战税基三方分裂**（AD-12，与 R2-1 并列最高优先）：
  - GDD（893d94f，第 254-256 行）：拍板**库存税**（结算瞬间库存 herb/wood/ore 各 30%），明文「废弃未收取口径」，并指示 store 文案改为库存说法。
  - store（07dae75，几乎同时落地）：反向实现**未收取税**（挂机匣待领 + ≤2s 未入账尾巴全没收，「库存分毫未动」），测试锁定（"forfeits only uncollected output after a failed beast wave"）。
  - UI（screens.js 兽潮页）：停留 Round 1 旧文案「失败将散失三成灵草/灵木/灵矿」——恰与 GDD 新拍板一致、与实现相悖。
  - 三方各执一词，玩家看到的提示与实际结算不符。归属：Fable-3 与 Opus-1 二选一，败方同步改测试与 UI 文案。

## Round 2 仍开项总表（按优先级）

| 级别 | 编号 | 一句话 | 归属 | 验证命令 |
| --- | --- | --- | --- | --- |
| P0' | R2-1 | 法器槽型两案相撞：GDD「专属+万用≤2」 vs 实现「1攻/1防/2通」，GDD 基准四件套装不上 | Fable-3 + Opus-1 | 拍板后 `npm test` + 按新口径试装双防 |
| P0' | R2-2 | 兽潮税基三方分裂：GDD 库存税 / store 未收取税 / UI 旧文案 | Fable-3 + Opus-1 | 拍板后 `rg -n "散失" src/ docs/GDD.md` 三处同口径 + `npm test` |
| P1 | R2-3 | 藏经楼：disciples 层未消费 mansion 新口径，任意驻守弟子仍免费晋阶 | Opus-2 + Opus-1 | 建藏经楼+派驻灵田弟子，断言其 xp 不涨 |
| P1 | R2-4 | 魔族终盘：渡劫 9 层合法配装 F40 0%（人族 97%），需 飞升+万魂灯 才 85%；GDD 补链方案依赖 R2-1 判决 | Fable-3 / Opus-3 | 附录平衡探针命令 |
| P2 | R2-5 | 离线直入账阈值 8s vs 验收 ≥60s，口径待拍板 | Fable-3 | `rg -n OFFLINE_DIRECT_SEC src/core/offline.js` |
| P2 | R2-8 | 塔 45 层在 飞升+三战力建筑 12 级下三阵营 0%，与「渡劫：45 层之后仍有压力」文案不符 | Fable-3 / Opus-3 | 附录平衡探针命令 |
| 测试债 | R2-6 | 回归三用例被 07dae75 重写删除：bid 唯一、saveCorrupt 事件、离线 8h 封顶 | GPT-sol-1 | `rg -n "b-7|saveCorrupt|OFFLINE_CAP" tests/` 应有命中 |
| 测试债 | R2-7 | UI 冒烟（jsdom 9 断言）与 soak 仍在仓库外 | GPT-sol-1 | `ls tests/` 出现 ui-smoke / soak |
| 验收债 | R2-9 | 浏览器手玩验收（10 分钟 / 390px / 三屏截图 / 战报可视化）自 P0 修复后无人执行 | Opus-4 | `npm run dev` → 4174 手玩 |
| 纪律 | R2-10 | 根 `package-lock.json` 仍未跟踪，禁止入库 | 全员 | `git status --short` 只见 `??` |

## 附录：Round 2 实测数据与方法（2026-08-26，基线 893d94f）

### UI 冒烟（jsdom 一次性脚本，9/9 通过）

方法：jsdom 建 `#app` → `createStore`+`createUI` → BOOT。断言：开府门三卡；选阵营即入沙盘；
道号 `<b>试探` 顶栏按文本渲染；点修炼页签 stage 立即含「吐纳」；吐纳×10/自动吐纳按钮在位；
点空地 stage 立即含 `data-act="build"`；地块 `role="button"` 且 Enter 可激活；
载入含 `b-7` 的档再建造得 `b-8` 且全表 id 唯一。建议 GPT-sol-1 原样收编为 `tests/ui-smoke.test.js`。

### 塔层胜率探针（`simulate` 直跑，60 seed/格，丹房+锻造+演武场 各同级）

| 配置（合法配装另注） | F20 | F25 | F30 | F35 | F40 | F45 |
| --- | --- | --- | --- | --- | --- | --- |
| 化神 5 层 · 建筑 8 级 | 100/100/100 | 100/100/93 | 0 | 0 | 0 | 0 |
| 大乘 5 层 · 建筑 12 级 | 100 | 100 | 100 | 100/98/88 | 0 | 0 |
| 渡劫 9 层 · 建筑 12 级 · 含万魂灯四件套 | 100 | 100 | 100 | 100 | 98/85/18 | 0 |
| 渡劫 9 层 · **1/1/2 合法**（朱雀/万魂/河图/太虚） | 100 | 100 | 100 | 100 | 97/60/0 | 0 |
| 渡劫 9 层 · 1/1/2 合法（无万魂灯） | 100 | 100 | 100 | 100 | 7/2/0 | 0 |
| 飞升 · 1/1/2 合法（朱雀/万魂/河图/太虚） | 100 | 100 | 100 | 100 | 100/100/85 | 0 |

单元格「人/神/魔」，单值表示三阵营相同。结论：
1. 1–40 层随境界逐段放行，与 GDD 进度墙表（30 seed）走势吻合；
2. **万魂灯是终盘承重墙**——去掉它 F40 从 97% 崩到 7%，槽型判决（R2-1）直接决定终盘成立与否；
3. **魔族比人族慢约一个大境界**：F40 人族渡劫 9 可过（97%），魔族需飞升且必带万魂灯（85%）（R2-4）；
4. F45 所有探针配置为 0%，`REALMS` 渡劫 perk 文案「45 层之后仍有压力」暂无实据（R2-8）。

方法：构造 `{meta, realm, buildings(丹/锻/演武), party(6 人本阵营), equipped}` → `towerEnemy(floor).foes`
→ 60 seed 扫 `simulate` 统计 winner。建议 GPT-sol-2 固化为 `scripts/balance.mjs` 纳入 CI。

### 工程基线

`npm test` 34 用例全绿；`npm run probe` ok；`npm run bench` 200 场 15–53ms、产量 checksum 1011.25（锚点未漂）；
构建 92KB(js)/gzip 35KB；隔离扫描零命中。
