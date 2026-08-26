# SOTA 验收清单（终稿 · 可勾选 · 可度量）

> 维护者：Fable-4 SOTA 验收官。评测命令与手测步骤见 `docs/ACCEPTANCE.md`。
>
> **Round 3 终审快照**：2026-08-26 09:00–09:22 UTC，工作树实测（Round 3 开发已收笔，树静默后终审；
> 终审期间契约角色于 09:12 交付 API_CONTRACT「Round 3 终审版」，已并入 H5 判定）。
> 历史基线：Round 1 2026-08-26 07:17 UTC（HEAD `0265040`）；Round 2 2026-08-26 08:24 UTC。
> 本轮验收会话禁用 git，G 组按文件系统快照核查。
>
> 图例：✅ 已过 ｜ ❌ 未过 ｜ ⚠️ 部分通过/有保留 ｜ 每项都写明「度量方法 + 阈值」。
> 状态后括号内为轮次变动：（R2❌→R3✅）表示本轮修复。

## A. 绘符识别精度

- [x] **A1 六式金标准识别率 ≥ 98%** ✅
  度量：对 line/curve/circle/zigzag/spiral/cloud 各生成 ≥200 个带噪声（noise ≤0.016·size）、旋转（0–π）、尺寸（90–288px）变体，`classifyStroke` 混淆矩阵对角线 ≥98%。
  R3 实测：**六类全部 200/200（100%）**（与 R2 持平）。
- [x] **A2 识别 precision 均值 ≥ 0.85** ✅
  度量：A1 命中样本的 `precision` 均值。R3 实测：**0.923–1.000**。
- [x] **A3 水平/垂直/斜向直线均识别为 line** ✅ 度量：`tests/stroke.test.js` 三个 line 用例。R3：通过。
- [x] **A4 噪声闭合圆识别为 circle** ✅ 度量：noisyCircle 用例。R3：通过。
- [x] **A5 过短/过少采样点判为 scribble** ✅ 度量：<6 点或长度 <28px 必须返回 scribble。R3：通过。
- [x] **A6 乱涂不误爆大招：误报率 < 5%，且有门禁保护** ✅（R2⚠️「达标无门禁」→ R3 收口）
  度量：≥200 个 `synthesizeStroke("scribble")` 被判为 cloud（治疗）/circle（护盾）/spiral（AoE）的比率 <5%，且该口径进自动红线。
  R3 实测：ACCEPTANCE §2 矩阵 falseBigSpellRate=**0.030**（cloud 6/200，circle 0，spiral 0）；
  `scripts/scribble-probe.mjs` 的 `HARD_FALSE_POSITIVE_TYPES` 已含 **cloud**（line/circle/spiral/cloud 全口径），
  probe 自带 400 样本实测硬误报 8/400=**2.0%**，红线 5%，回归会被门禁拦下。R2 保留意见解除。
- [x] **A7 金标准轨迹单一来源，probe/bench 门禁绿** ✅（R2⚠️「三份平行实现」→ R3 收口）
  度量：`npm run probe` 与 `npm run bench` 均 exit 0，且标准轨迹只有一处几何实现。
  R3 实测：probe ok；bench 3000 笔 **0 mismatches**。几何唯一源=`src/drawing/synth.js`：
  `drawing/templates.js` 与 `scripts/trajectories.mjs` 均已改写为 synth 的「取景层」（只折算画幅/平移/节拍，不自造几何，文件头有约定注释）。R2 保留意见解除。
- [ ] **A8 真机手绘样本回归集** ❌ 未建（≥10 人次/式，raw 点列入 `tests/fixtures/`，识别率 ≥90%）。目录不存在。P2。
- [x] **A9 伪压感 pressure ∈ [0.15,1] 且随速度反比** ✅ R3：通过（沿用 R2 结论，probe 界内）。

## B. 战斗公平

- [x] **B1 战斗 RNG 确定性** ✅ 度量：同 seed 50 回合敌伤序列逐位一致、异 seed 不同。`tests/combat.test.js` 通过。
- [x] **B2 灵气不足不吞笔** ✅ R3：通过（events 空、状态不变、warn 日志；UI 侧「只有成符的一笔才留痕」）。
- [x] **B3 护盾先于 HP 扣减** ✅ R3：通过。
- [x] **B4 任意 dt 的 tick 结算正确** ✅ R3：通过（累计冷却制 + `MAX_CATCHUP_STRIKES=64`；`core/loop.js` 固定步长 ticker 4 用例）。
- [x] **B5 职业克制双向系数生效**（×1.18 / ×0.88）✅ R3：通过。
- [x] **B6 五行反应伤害系数生效**（蒸发 ×1.35 / 压制 ×1.2 / 受制 ×0.82）✅ R3：通过。
- [x] **B7 金雷引暴击 +15% 生效** ✅（R1❌→R2❌→R3✅）**P0 已收口**
  R3：`battle.cast` 的暴击率 = `mods.crit + react.crit`（合计钳制 ≤1），`reaction().crit` 不再是死字段。
  实测（各 2000 笔）：中性元素暴击率 19.55%，thunder→metal **34.75%**，偏移 **+15.2pp**；
  `tests/round3.test.js` 断言偏移落在 (0.10, 0.20)。
- [x] **B8 天赋/灵兽加成接入实战** ✅
  R3 实测：1 层「符咒威能」同 seed 同笔伤害比 **1.0600**；crit=0.2 灵兽 50 笔 11 次暴击（无灵兽 0 次）。
  接线：`screen-battle.modifiersFor(save)`（talent/beast 嵌套 → `normalizeModifiers`）。
- [x] **B9 胜负结算幂等，奖励只发一次** ✅（R3 升级为结构性保证）
  R3：结算走 `progression/settle.js` 的 `beginBattle`/`settleBattle`——每场分配递增 `battleId`，
  `settledBattleId` 去重，同场重复结算原样返回、换场照发（`tests/round3.test.js`）；UI 的 `settled` 闸只是第二道保险。
  jsdom 全 UI 实测：胜利后 2.2s，xp **40→40**、丹 **8→8**，活跃 interval 归 **0**（ACCEPTANCE §3.2）。
- [x] **B10 敌人出手 telegraph 可见** ✅ R3：沿用 R2（侧栏「意图」被缚/蓄势/观势，`ENEMY_TELEGRAPH_MS=400` 真实冷却口径）。真机目测归入 D7。
- [x] **B11 战斗日志上限 24 条、关键事件都有记录** ✅ R3 实测：probe logEntries=24；UI 增量 append、DOM 上限 40。
- [x] **B12 无付费强度通道** ✅ R3：通过。
- [x] **B13 墨客解锁规则单一实现** ✅ R3：`settleBattle` 内走 `unlockMo`（唯一实现，注释明言「不在结算里另起判定」）。

## C. 存档

- [x] **C1 persist→hydrate 往返不丢关键字段** ✅ R3 实测：classId/realmId/xp/qiPills/gallery（含 points 点列）逐字段相等（ACCEPTANCE §4）。
- [x] **C2 损坏 JSON 与版本不符容错** ✅ R3 强化：坏 JSON 不炸且**原始串抄进 `linghuashi.save.bak`**；更高版本档保内存态 + 备份，不销档。
- [x] **C3 离线收益上限 8h（480 分钟）** ✅ R3：通过（1920 丹 / 288 包子）。
- [x] **C4 挂机结算幂等** ✅ R3：通过（`idleClaimed` 标记；同 nowMs 二次调用零产出）。
- [x] **C5 quota 超限不崩溃** ✅ R3：通过（persist 吞 quota；备份写失败不影响读档，有单测）。
- [x] **C6 瞬态字段不入档** ⚠️→基本通过（R3 继续改善）
  R3：`TRANSIENT_KEYS` 扩为 7 键（新增 battleId/settledBattleId），写盘剔除且 **migrate 后也不从盘上带回内存**（实测盘上无）。
  保留（P2）：`screen/lastResult/lastStage/lastReward/stageId` 仍落盘——`entryScreen` 消毒使其无害，长期建议 save/session 分层。
- [x] **C7 版本迁移路径** ✅（R1❌→R2❌→R3✅）**P0 已收口**
  R3：`SAVE_VERSION=2` + `MIGRATIONS` 迁移链（v0 史前档画阁字符串→条目；v1 灵兽补 uid）+ `migrate(raw)` 纯函数
  + `normalizeSave` 夹值清洗 + 升级/读不懂前**备份原始串**。
  实测：v1 档升 v2 保留全部进度、灵兽得 uid（`ink_fox-v1-0`）、备份=原始串；version 99 与坏 JSON 均安全。
  测试：`tests/save-migrate.test.js` 16 用例 + `tests/round3.test.js` 2 用例。
- [ ] **C8 存档导出/导入入口** ❌ 未实现（复制 JSON 即可迁移设备）。P2。

## D. 移动端

- [x] **D1 触摸可画** ✅ R3：代码具备（touch-action:none、preventDefault、getCoalescedEvents）；真机复核见 D7。
- [x] **D2 viewport/theme-color/安全区 meta 齐全** ✅（viewport-fit=cover，preview 实测返回）。
- [x] **D3 响应式断点** ✅ R3：通过。
- [x] **D4 DPR 适配上限 2** ✅ R3：通过。
- [ ] **D5 pointer/touch 双注册去重** ⚠️（R2⚠️→R3 实测后降级为 P2）
  R3 实测（ACCEPTANCE §6）：两栈仍同时注册，**机制上**同指双事件会双采样（异坐标 24 move 得 49 点）；
  但真机双事件坐标相同，`geometry.sanitize` 合并相邻同坐标点（同坐标 24 move 得 **25 点**，识别不变），
  加上 start/end 的 `drawing`/`pointerId` 闸门，实际影响仅剩零长度的重复 `brush.extend`（无视觉后果）。
  收尾建议不变：检测 `window.PointerEvent` 时不挂 touch 栈。
- [x] **D6 多点触控与 pointercancel 防护** ✅ R3 强化：`pointercancel`/`touchcancel` 改为**丢弃半笔**（不 finalize、不施法、不留痕），
  半截笔不会拼进下一笔；第二指被闸门拒收。`tests/pointer-cancel.test.js` 6 用例。
- [ ] **D7 真机冒烟**（iOS Safari + Android Chrome 各完成一场教程战）❌ 未执行（本环境无真机）。**P1，发布前人工闸门**。
- [x] **D8 挂机页签回来不被秒** ✅ `MAX_CATCHUP_STRIKES=64` + `core/loop.js` clamp。

## E. 无障碍

- [x] **E1 键盘可走完教程战斗** ✅
  R3 实测：jsdom 全 UI harness **只按数字键 "1"（3 次）即打赢教程战并正确结算**；符键条 aria-keyshortcuts、Escape 撤退、radiogroup 方向键。真浏览器 Tab 走查归 D7。
- [x] **E2 战斗日志 aria-live 播报** ✅ `role=log aria-live=polite`；全局 `announce()` 双通道。
- [x] **E3 血条/灵气条 progressbar 语义** ✅ `meter()` 全面接入。
- [x] **E4 屏切换焦点管理** ✅ `focusScreen` + 教程 trapFocus。
- [x] **E5 静音与减动效开关** ✅（R2⚠️「减动效无 UI」→ R3 收口）
  R3：`motionToggle`（枢纽 + 画阁均有，aria-pressed，改动即落盘）经 `ui/motion-bridge.js` 写 `<html data-reduced-motion>`，
  与系统 `prefers-reduced-motion` 任一为真即减动效；画阁回放就地按新偏好重绘。
  测试：`tests/motion.test.js` 5 用例（含「不动静音等其它设置」）。静音总线沿用 R2（audio.test 6 用例）。
- [x] **E6 焦点可见样式** ✅ `:focus-visible` 朱磦环。
- [x] **E7 文本对比度 ≥ 4.5:1** ✅（R2⚠️ 4.44:1 → R3 收口）
  R3：`.stat-label` 与 `.cast-key-cost` 的 `opacity:0.6` 已改为 `color: var(--ink-mute)` 实色（#5a4933 对宣纸 6.77:1）；
  灵气不足态费用文字改朱砂满对比（`ui.css` 注释明言此设计）。

## F. 性能基准

- [x] **F1 识别性能：p95 < 4ms/笔（node 端）** ✅ R3 实测：3000 笔 p50 0.104ms / p95 **0.183ms**。
- [x] **F2 战斗结算：< 1ms/回合** ✅ R3 实测：**0.0153ms/回合**。
- [x] **F3 生产构建通过且 JS gzip < 100KB** ✅ R3 实测：49 模块，JS 87.1KB（gzip **35.1KB**）+ CSS gzip 5.3KB。
- [x] **F4 preview 服务器可用** ✅ R3 实测：HTTP 200。
- [ ] **F5 60fps 墨迹（桌面 Chrome）** ❌ 仍无实机实证（本环境无真机浏览器）。**P1，与 D7 合并为发布前人工闸门**。
- [x] **F6 零计时器/监听器泄漏** ✅ R3 实测：battle↔hub 往返 5 次后活跃 interval 恒为 **0**、resize 监听恒为 **1**（painter 单例设计如此）。
- [ ] **F7 战斗页 rAF 驱动渲染** ⚠️ 维持 R2：200ms `setInterval` 时钟 + 增量 DOM + cast 后立即 paint。达 SOTA 理想态需 rAF + accumulator。P2。

## G. 目录隔离

> 本轮验收禁用 git 命令，G 组按文件系统快照核查；提交前请按 ACCEPTANCE §8 用 git 复核一遍。

- [x] **G1 游戏代码全部位于 `games/linghuashi/`** ✅ 快照：目录外无本游戏文件。
- [x] **G2 不改仓库根业务文件** ✅ 快照：`test.js` 未动。
- [ ] **G3 根目录不新增未跟踪文件** ❌（R1⚠️→R3 仍在）
  快照：工作区根仍有**未跟踪 `package-lock.json`**（88B，环境安装副产物）。**严禁提交该文件**；
  由执行 git 的一方在提交前删除（本轮验收会话无 git 权限，无法代劳）。P1（提交纪律，非代码缺陷）。
- [x] **G4 独立 npm 依赖树**（devDependencies 仅 vite/vitest/jsdom）✅。
- [x] **G5 构建产物隔离**（node_modules/dist/.vite 在本目录 .gitignore）✅。
- [x] **G6 分支纪律**（仅在 `cursor/linghuashi-sota-a345` 工作）✅ 沿用（本轮禁 git，未复核）。

## H. 工程与文档

- [x] **H1 vitest 全绿** ✅ R3 实测：**14 文件 105 用例全过**
  （新增 save-migrate 16 / hub-beasts 11 / pointer-cancel 6 / motion 5 / round3 5；R2 为 62、R1 为 20）。
- [x] **H2 probe 门禁 exit 0** ✅ 六式识别 + 400 乱涂**全口径**硬误报红线（含 cloud，实测 2.0%）+ 50 回合战斗冒烟。
- [x] **H3 bench 门禁 exit 0** ✅ 3000 笔 0 误配、p95 0.183ms、战斗 0.0153ms/回合。
- [ ] **H4 单测覆盖新增纯函数** ⚠️（R3 大幅改善，留小尾巴）
  已补：migrate/normalizeSave/备份、settle 恰好一次、releaseBeast/收放循环不刷包子、evolve/reroll（经 beast-panel）、
  applyTalent 定价、motion-bridge、pointercancel 丢弃、crit 偏移。
  仍缺（P2）：`normalizeModifiers`（扁平/嵌套/越界钳制）与 `keyboardStroke`（精度封顶/型不符降级）的直接单测——
  两者已被 B7/B8 统计断言与全 UI harness 间接覆盖。
- [x] **H5 API_CONTRACT.md 与实现同步** ⚠️→基本收口（R2❌ 整体过期 → R3 契约 v3 终审版落地）
  R3 终审（09:12 交付）：契约已重写为「Round 3 终审版」——正文按终态逐文件核读；
  §9-A 收口账（mods.js 删除、settle 接线、migrate 链、轨迹单源、reaction.crit、A6 口径、E5 开关等 10 条）
  与 §9-B 残余账（14 条，均带处置裁定）经抽查与代码一致；store 节已写 SAVE_VERSION=2 与三件套硬约束。
  残余（P2 执行项，契约已裁定、代码未动手）：`classes/talents.js#battleModifiers`（最后一处 modifiers 死代码，
  §9-B-1 裁定删除）、`core/events.js`、`progression/unlock.js`、两个 barrel（§9-B-2/4/5）、
  screen-hub 本地 TALENT_COST 双写（§9-B-8）。零调用方、不影响运行，属下一次源码变更的清理清单。
- [ ] **H6 六职业手感差异可感知** ⚠️ 数据差异 + 天赋生效（B8）+ telegraph（B10）齐备；5 人盲测未做。P2。

---

## 终审结论（Round 3 · 2026-08-26 09:10 UTC）

### 实测门禁总表

| 门禁 | 阈值 | R1 | R2 | R3 终审 |
| --- | --- | --- | --- | --- |
| vitest | 全绿 | ✅ 20 | ✅ 62 | ✅ **105/105（14 文件）** |
| probe | exit 0，硬误报全口径 <5% | ❌ | ✅（缺 cloud 口径） | ✅ **2.0%（含 cloud）** |
| bench | exit 0、0 误配、p95<4ms | ❌ | ✅ 0.212ms | ✅ **0 误配、p95 0.183ms** |
| build | 成功、JS gzip<100KB | ✅ | ✅ 31.0KB | ✅ **35.1KB（49 模块）** |
| preview | HTTP 200 | ✅ | ✅ | ✅ |
| 识别矩阵 | 六式 ≥98%、误爆 <5% | ❌ 26.5% | ✅ 3.5% | ✅ **100% / 3.0%** |
| 奖励幂等（jsdom 全 UI） | xp/丹 2s 不变 | ❌ | ✅ | ✅ **40→40 / 8→8，interval=0** |
| 键盘施法（jsdom 全 UI） | 纯键盘可胜 | ❌ | ✅ | ✅ **3 键胜** |
| 存档迁移 | v1→v2 保进度 + 备份 | — | ❌ 无链 | ✅ **迁移+备份+坏档三路实测** |
| 泄漏 | 5 场后 interval=0 | ❌ | ✅ | ✅ **0 / resize 恒 1** |

### Round 3 必收口项清账（8 项）

| # | 收口项 | 判定 |
| --- | --- | --- |
| 1 | B7 crit 定案 | ✅ 消费 react.crit，实测 +15.2pp，单测锁定 |
| 2 | A6 红线补 cloud | ✅ probe 全口径 2.0%，六式 100% 未跌 |
| 3 | A7 金标准合一 | ✅ synth.js 唯一几何源，另两处降为取景层 |
| 4 | C7 迁移链 | ✅ v0/v1→v2 + .bak 备份 + 18 用例 |
| 5 | H5 契约重写 + 清死代码 | ⚠️ 契约 v3 终审版已交付、mods.js 已删；battleModifiers 等 §9-B 死代码留待执行 |
| 6 | D5 触摸单栈 / D7 真机 | ⚠️ 单栈未做（实测影响已被 sanitize 兜住，降 P2）；D7 真机未执行（P1） |
| 7 | G3 清根 | ❌ 根 package-lock.json 仍在，移交提交方处理 |
| 8 | 收尾打磨 | ✅ E7 实色、E5 减动效开关、H4 +43 用例；C8 未做（P2） |

### 剩余问题（终稿定级）

**P0（阻断发布）：无。**

| # | P1（发布前应处理） | 清单项 |
| --- | --- | --- |
| 1 | 真机人工冒烟未做：iOS/Android 教程战、60fps 录制、telegraph/Tab 走查目测 | D7/F5（捎带 B10/E1） |
| 2 | 提交前删除工作区根未跟踪 `package-lock.json` | G3 |

| # | P2（不阻断，后续打磨） | 清单项 |
| --- | --- | --- |
| 3 | 执行契约 §9-B 死代码删除清单（battleModifiers/events.js/progression-unlock/barrels/TALENT_COST 双写） | H5 |
| 4 | PointerEvent 可用时不挂 touch 栈（现由 sanitize 去重兜底） | D5 |
| 5 | 战斗时钟上 rAF + accumulator | F7 |
| 6 | 真机手绘 fixtures、存档导出/导入、职业盲测、会话字段分层 | A8/C8/H6/C6 |
| 7 | `normalizeModifiers`/`keyboardStroke` 直接单测 | H4 |

### 发布判定

**结论：达到可发布的网页 SOTA 水位（有条件通过）。**
自动化可验证的全部维度——识别精度与防误爆（含门禁保护）、战斗公平（确定性/幂等/养成接线/克制反应/金雷引）、
存档安全（迁移链/备份/容错/幂等）、无障碍主干（纯键盘通关/aria-live/对比度/减动效）、性能（识别 p95 0.18ms、
战斗 0.015ms/回合、gzip 35KB、零泄漏）——均以实测证据通过，且关键阈值都有自动红线防回归；
契约（API_CONTRACT v3）与实现同步，残余死代码全部零调用方且已带删除裁定。
条件：发布动作前完成上表 2 项 P1——真机人工冒烟（本环境无法代劳）与提交时清根。
两项均不涉及玩法与数据安全，不构成 P0。
