# SOTA 验收清单（Round 1 校准版）

逐项可勾选清单，与 `docs/ACCEPTANCE.md` 的 G/B 编号互通。勾选规则：

- `[x]` = 本轮已用可复现方法验证通过；`[ ]` = 未通过或未验证（差距写在条目内）。
- 校准基线：commit `419f9d7` + 2026-08-26 07:30 UTC 并发工作区（combat/mansion/disciples/screens 正在被各所有者重写，勾选状态以当时实测为准，复测请重跑本文所列命令）。
- 复测入口：`cd games/zaohua-xianfu && npm test && npm run probe && npm run bench`。

## 一、工程门槛（G0）

- [x] `npm test` 全绿 —— 实测 4 文件 24 用例通过。验证：`npm test`，退出码 0。
- [x] `npm run probe` ok —— 实测 `ok:true`，17 个 action 全覆盖、无缺失导出。验证：`npm run probe`。
- [x] `npm run bench` ok —— 实测 200 场 ≈15–40ms（阈值 800ms）。验证：`npm run bench`。
- [x] 目录隔离，无跨游戏引用 —— 实测扫描无命中。验证：`rg -n "\.\./\.\./|games/linghuashi|games/bingqi" src/ tests/ scripts/ index.html vite.config.js` 应无输出。
- [ ] 不污染仓库根 —— 工作区出现根级 `package-lock.json`（未跟踪）。**任何人不得将其入库**；验证：`git status --short /workspace/package-lock.json` 保持未跟踪或删除。
- [ ] `npm run build && npm run preview` 走通（G0.5）—— 本轮未验，发布前必测。

## 二、核心循环与仙府经营（G1/G2）

- [x] 开府门三阵营 + 道号；开府种下 洞府/聚灵阵/灵田 —— `tests/economy.test.js` 覆盖。
- [ ] **P0-1 页签与地块点击不重绘**（G1.3/G2.1）：`ui/app.js` 中 `tab`/`plot` 分支只改 `ui` 局部状态即 return，不触发 paint；`frame()` 在 `.res-bar` 存在时只刷 HUD。**后果：开府后无法切页签、无法打开营造菜单，游戏实际不可玩。** jsdom 实测：点击修炼页签后 stage 无变化、点空地后营造菜单不出现。验证（修复后）：浏览器点各页签立即切屏；建议补 jsdom UI 冒烟测试锁定。归属：Opus-4（`src/ui/**`）。
- [ ] **P0-2 建筑 id 计数器刷新后重置**（G2.6）：`core/store.js` 模块级 `let bid`，仅在 `CHOOSE_FACTION` 置 10；载档进入时 bid=1，新建从 `b-1` 起，建到第 10 座与旧档 `b-10` 撞 id，破坏升级/派遣定位。验证（修复后）：载档再建造，`new Set(state.buildings.map(b=>b.id)).size === state.buildings.length`；建议从现有 state 推导下一 id 并补回归测试。归属：Opus-1（`src/core/**`）。
- [x] 建造扣资源、占地、唯一建筑拒绝重复 —— economy/regressions 测试覆盖。
- [x] 灵脉正交邻接 +15%/条，斜角不计 —— regressions 测试覆盖（含 4 条=×1.6）。
- [ ] 升级产量差在 UI 可见（G2.2）—— screens.js 已有每秒速率与乘区拆解，待 P0-1 修复后浏览器实测勾选。
- [ ] 洞府门控文案（未解锁/地块满/资源不足）浏览器实测（G2.4）—— reducer 逻辑已有，UI 路径待 P0-1。

## 三、弟子（G3）

- [x] 派遣改变产量的数值口径 —— `yieldMultiplier` 有测试；production 按驻守弟子乘算。
- [ ] 派遣/顶替/闲置全流程浏览器实测（G3.1）—— 待 P0-1。
- [x] 传功消耗与专业成长 —— reducer + `trainCost` 实现，economy 流程覆盖；UI 实测待 P0-1。
- [ ] 礼聘费用面板与实扣一致（G3.3）—— `ui/util.js#recruitCost` 已与 store 同口径，浏览器核对待 P0-1。
- [ ] 藏经楼修业升专业浏览器实测（G3.4）—— `scriptureXp` 已实现（xpNeeded 口径统一），无 UI 实测。

## 四、修炼与突破（G4）

- [x] 吐纳：灵气 -4、修为 +（6+境界）—— progression 测试覆盖。
- [x] 破境失败：不掉境、丹药 ×0.4、心魔 +1（+8%/次，封顶 +40%）—— progression/regressions 测试覆盖。
- [x] 破境成功：层 +1、跨境清零 —— regressions 覆盖第 9 层跨境。
- [ ] **P1-3 无自动/批量修炼**（G4.4）：到元婴需手点吐纳 ≈765 次（实测按 `REALMS` 推算），放置游戏不可接受。需自动吐纳开关或一键 ×N。归属：Opus-3（progression）+ Opus-4（UI），节奏定义归 Fable-3（GDD）。

## 五、战斗 / 塔 / 兽潮 / 法器（G5）

- [x] 同 seed 战报完全确定 —— combat + regressions 双测试锁定（含逐帧相等）。
- [x] 塔每章 10 层、5/10 层首领、失败不掉层有安慰奖 —— 测试 + reducer 实现。
- [x] 兽潮波次递增、5 波首领、失败 30% 库存税 —— regressions 精确断言税后数值。
- [x] 仙友技能表齐全 —— 工作区 battle.js 已实现全部 16 位（含嘲讽/致盲/破甲/反击/追击/后排狙击），且大招加速（太虚鼎/玄女）已接入 ultTicks。复测：`rg -n "KITS" src/combat/battle.js`。
- [x] 残阳妖铠灼烧每秒 1 次（旧版曾 4 次/秒）—— 实测 burn 事件 tick 间隔 =4（1 秒）。
- [ ] **P1-2 法器槽位规则未实施**（G5.4）：`EQUIP_ARTIFACT` 为 4 件 FIFO，无攻/防/通/通槽型校验，可 4 件全攻击。归属：Opus-1（store）+ Opus-3（口径），UI 展示归 Opus-4。验证（修复后）：佩戴第 2 件攻击位应替换原攻击位而非挤掉最旧；补 reducer 测试。
- [ ] **P1-4 万魂灯口径待拍板**（G5.6）：文案「复活一次」，实现为每个我方单位各复活一次/场（强度约 ×6）。Fable-3 定口径，实现方补测试锁定。
- [ ] 七星灯/镇岳钟浏览器战报实测（G5.5/G5.7）—— 逻辑在 `artifactLoadout`+`applyDamage` 且 zhenyue 有测试；战报可视化验证待 P0-1。
- [ ] 塔 5/10/15 层、兽潮 5/8 波首通掉落法器实测（G5.8）—— reducer 已写死掉落点，无测试与实测。建议 GPT-sol-1 补 RESOLVE_COMBAT 掉落用例。

## 六、放置挂机与存档（G6）

- [x] 存档 schema 守卫：坏 JSON / 版本不符 / storage 异常均回退 —— regressions 覆盖。
- [ ] **P1-1 离线结算未接线**（G6.2/G6.3）：`mansion/production.js` 已实现 `offlineEfficiency`（50%+6%/聚灵阵级，封顶 90%）与 `offlineProduce`，但 `core/store.js` BOOT 仍用全效率 `produce` 且离线判定阈值仅 8 秒（刷新即弹匣）。归属：Opus-1 接线 + Opus-2 提供接口；阈值建议 ≥60 秒。验证（修复后）：改 `lastTick` 提前 1h 刷新，匣金额 = 每秒产量 × 3600 × 效率。
- [ ] 刷新不丢浏览器实测（G6.1）—— 持久化逻辑存在（非 TICK 即存，TICK 4 秒节流），无 beforeunload 兜底（P2-5）。
- [ ] 损坏档未记 `saveCorrupt` 事件（G6.4）—— ARCHITECTURE 承诺未兑现，仅静默回退。P2，归属 Opus-1。

## 七、稳定性与性能（G7）

- [x] 200 场模拟 <800ms —— bench 实测约 15–40ms，余量 20 倍以上。
- [ ] 10 分钟手玩不崩（G7.1）—— 被 P0-1 阻塞，修复后必测。
- [ ] 脚本化 soak 测试（G7.2）—— 尚无；建议 GPT-sol-1 在 `tests/` 增加：TICK×6000+随机合法 action，断言资源有限非负、可序列化。

## 八、视觉 / 无障碍 / 响应式（G8）

- [ ] 作品集级国风视觉（G8.1）—— tokens/布局已具雏形（水墨底+朱砂金），需三屏截图对照 ART_DIRECTION 评审后勾选。
- [ ] 窄屏 390px 全流程（G8.2）—— 已有 860/720px 断点，390px 未实测。
- [ ] 键盘可玩（G8.3）—— screens.js 地块已加 `role="button" tabindex="0"`，但 `ui/app.js` 只监听 click，无 keydown → Enter/Space 无效。P2-4，归属 Opus-4。
- [ ] **P2-3 顶栏道号未转义**：screens.js 全面走 `esc()`，但 `ui/app.js` 顶栏 `${state.meta.name}` 裸插值（maxlength=8 缓解，仍需堵死）。归属 Opus-4。
- [x] `prefers-reduced-motion` 全局停动画 —— tokens.css 已实现。
- [x] 资源字段名全链路一致（qi/herb/wood/ore/stone/pills/jade）—— data/store/production/HUD/文档抽查一致。

## 九、GDD 与实现口径冲突（P2，Fable-3 与实现方对齐后逐条销项）

- [ ] 锻造房：GDD「法器经验与攻击法器碎片」 vs 实现「仙玉 0.04/s + 全队攻」。
- [ ] 兽潮失败税：GDD「当波 30% 未收取资源」 vs 实现「库存 herb/wood/ore 各 30%」（UI 文案与实现一致，GDD 不一致）。
- [ ] 被克伤害 ×0.92 存在于 `factionAdvantage` 但 GDD 只写克制 ×1.18。
- [ ] 法器升星缺失：GDD 仙玉用途含「法器升星」、瑶光贝「3 星起触发两次」，均无星级系统。
- [ ] 仙友解锁途径：GDD「悬赏、塔层、剧情」 vs 实现仅仙玉+灵石礼聘。

## Round 1 差距总表（按优先级）

| 级别 | 编号 | 一句话 | 归属 |
| --- | --- | --- | --- |
| P0 | P0-1 | 页签/地块点击不重绘，开府后不可玩 | Opus-4 |
| P0 | P0-2 | 载档后建筑 id 会重复（bid 重置） | Opus-1 |
| P1 | P1-1 | 离线效率/阈值未接进 BOOT | Opus-1 / Opus-2 |
| P1 | P1-2 | 法器四槽无槽型校验 | Opus-1 / Opus-3 |
| P1 | P1-3 | 无自动修炼，到元婴需 ~765 次手点 | Opus-3 / Opus-4 / Fable-3 |
| P1 | P1-4 | 万魂灯每单位复活一次 vs 文案一次/场 | Fable-3 拍板 |
| P2 | P2-1 | GDD 五处口径冲突（见第九节） | Fable-3 |
| P2 | P2-2 | 损坏档不记 saveCorrupt 事件 | Opus-1 |
| P2 | P2-3 | 顶栏道号未转义 | Opus-4 |
| P2 | P2-4 | role=button 无键盘激活 | Opus-4 |
| P2 | P2-5 | 无 beforeunload 落盘兜底（≤4s 损失） | Opus-1 |
| 测试债 | T-1 | 无 UI 冒烟测试（P0-1 本可被捕获） | GPT-sol-1 |
| 测试债 | T-2 | 无 soak / 掉落 / 平衡回归探针 | GPT-sol-1 / GPT-sol-2 |

## 附录：Round 1 实测数据（2026-08-26，固定 seed 各 60–100 场）

塔层胜率（`simulate` 批量复测，方法：构造对应 state 后按 seed 扫描）：

| 配置 | F1 | F3 | F5 | F8 | F10 | F15 | F20 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 新档三阵营（练气 1 层/3 人） | 100% | 100% | 0% | 0% | 0% | 0% | 0% |
| 筑基 5 层/5 人/丹房 3 | — | 100% | 77% | 100% | 0% | 0% | 0% |
| 元婴 1 层/6 人/丹锻 5 | — | — | — | — | 83% | 0% | 0% |
| 元婴 9 层/6 人/丹锻 8+塔奖法器 | — | — | — | — | 100% | 100% | 32% |
| 化神 1 层/6 人/丹锻 8+法器 | — | — | — | — | — | 100% | 82% |

结论：20 层全程可通，首领层（5/10/20）是清晰的养成墙，与 B1–B4 阈值吻合；兽潮第 1 波新档 100%。
基准：200 场 15–40ms（阈值 800ms）；产量 5000 次迭代 ≈14–30ms。

复测提示：上表由一次性脚本测得（构造 state → 扫 seed → 统计 winner），建议 GPT-sol-2 将其固化为 `scripts/balance.mjs` 纳入 CI，阈值取 ACCEPTANCE B 系列。
