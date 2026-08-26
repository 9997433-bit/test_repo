# 验收步骤（ACCEPTANCE · 终稿）

> 与 `docs/SOTA_CHECKLIST.md` 配套：清单定义「验什么、阈值多少」，本文定义「怎么验、按什么顺序」。
> 全部命令在 `games/linghuashi/` 目录内执行；验收 harness 一律写到 `/tmp/acceptance/`，**不得**向仓库新增脚本文件。
>
> **Round 3 终审**：2026-08-26 09:00–09:22 UTC，工作树实测（Round 3 开发收笔、树静默后执行；
> 终审期间契约角色交付 API_CONTRACT「Round 3 终审版」，已并入 §9 结论）。
> 历史基线：Round 1 07:17 UTC（HEAD `0265040`）；Round 2 08:24 UTC。

## 0. 环境准备

```bash
cd games/linghuashi
npm install          # node ≥ 20（本轮 v22.14.0）
```

产出判定：install 无 error；`node_modules/` 只出现在本目录。

**jsdom harness 前置**：`ui/screens.js` 起 import 了 CSS，node 直跑会报 `ERR_UNKNOWN_FILE_EXTENSION`。
先写一个 loader 存为 `/tmp/acceptance/css-loader.mjs`：

```js
export async function load(url, context, next) {
  if (url.endsWith(".css")) return { format: "module", source: "export default {};", shortCircuit: true };
  return next(url, context);
}
```

之后所有挂载 UI 的 harness 用 `node --experimental-loader /tmp/acceptance/css-loader.mjs <script>` 运行。
harness 内 import jsdom 需用绝对路径 `games/linghuashi/node_modules/jsdom/lib/api.js`（/tmp 下解析不到包名）。

## 1. 自动化门禁（每次复评必跑，顺序执行）

```bash
npm test             # vitest：全绿，exit 0
npm run probe        # 六式识别 + 400 乱涂硬误报红线（line/circle/spiral/cloud 全口径）+ 50 回合战斗冒烟
npm run bench        # 3000 笔识别基准：mismatches=0 且 p95Ms<4，exit 0
npm run build        # vite build 成功，dist/assets/*.js gzip < 100KB
```

| 门禁 | 阈值 | R1 | R2 | R3 终审 |
| --- | --- | --- | --- | --- |
| vitest | 全绿 | ✅ 20/20 | ✅ 62/62 | ✅ **105/105（14 文件）** |
| probe | exit 0，硬误报 <5% | ❌ exit 1 | ✅（口径缺 cloud） | ✅ exit 0（**全口径 8/400=2.0%**，其中 cloud 8、line/circle/spiral 0） |
| bench | exit 0、0 误配、p95<4ms | ❌ exit 2 | ✅ p95 0.212ms | ✅ exit 0（**0 误配、p95 0.183ms、战斗 0.0153ms/回合**） |
| build | 成功、gzip<100KB | ✅ 13.5KB | ✅ 31.0KB | ✅ **49 模块 / JS gzip 35.1KB / CSS gzip 5.3KB** |
| preview | HTTP 200 | ✅ | ✅ | ✅（`npx vite preview` 后 curl 实测 200） |

> R2 的两条保留意见本轮均已解除：`scripts/scribble-probe.mjs` 的 `HARD_FALSE_POSITIVE_TYPES`
> 已含 **cloud**；标准轨迹几何唯一源为 `src/drawing/synth.js`，`drawing/templates.js` 与
> `scripts/trajectories.mjs` 均降级为「取景层」（只折算画幅/平移/采样节拍，不自造几何）。

## 2. 识别精度矩阵（清单 A1/A2/A6）

把 R2 版脚本存为 `/tmp/acceptance/recog-matrix.mjs`（内容不变，见 git 历史或按 §2 参数重写）并执行
`node /tmp/acceptance/recog-matrix.mjs`。要点：六式各 200 变体（噪声/旋转/尺寸/wobble 扫参），
外加 200 个 scribble，统计混淆矩阵、命中 precision 均值与 falseBigSpellRate（判为 cloud/circle/spiral 之比）。

判定与 R3 实测：
- 六类 `accuracy` 全部 ≥ 0.98 → **全部 1.000** ✅（R1 0.98–1.00 / R2 1.000）。
- `meanPrecision` 全部 ≥ 0.85 → **0.923–1.000** ✅。
- `falseBigSpellRate` < 0.05 → **0.030**（cloud 6/200，circle/spiral 0）✅（R1 0.265 / R2 0.035）。
- 与 §1 probe 的区别：probe 是门禁自带的 400 样本全口径红线（2.0%），本矩阵是独立抽样复核。

## 3. 战斗公平（清单 B 组）

### 3.1 确定性重放（B1）

同 seed 跑两次 50 回合，断言两次玩家 HP 序列逐位一致；换 seed 应变化。
R3：`tests/combat.test.js` 覆盖，vitest 绿 ✅。

### 3.2 结算幂等 / 奖励只发一次（B9）+ 纯键盘施法（E1）+ 泄漏（F6）

三项合一的 jsdom 全 UI harness，存为 `/tmp/acceptance/reward-loop.mjs`，要点：

- store 预置 `{ classId:"jian", screen:"hub", stageId:"tutorial", tutorialDone:true }`
  （**必须 tutorialDone:true**，否则教程弹层挡住施法）；
- canvas `getContext` 用 Proxy stub、`AudioContext` 用假类、`matchMedia` 补 stub；
- 包裹 `window.setInterval/clearInterval` 与 `window.addEventListener` 计数；
- `boot` 后 navigate("battle")，循环派发 `KeyboardEvent("keydown",{key:"1"})` 直至切到结算屏；
- 胜利后等 2.2s 比对 xp/qiPills；再 battle↔hub 往返 5 次读计数。

R3 实测（exit 0）：

```json
{ "wonByKeyboard": true, "presses": 3,
  "reward": { "xpBefore": 40, "xpAfter2s": 40, "pillsBefore": 8, "pillsAfter2s": 8 },
  "rewardIdempotent": true, "intervalsAfterWin": 0,
  "leakReport": { "activeIntervals": 0, "resizeListeners": 1 },
  "galleryEntries": 3, "galleryHasPoints": true }
```

结构性保证（R3 新增）：结算已迁到 `progression/settle.js`——`beginBattle` 分配递增 `battleId`，
`settleBattle` 以 `settledBattleId` 去重（同场重复结算原样返回、换场照发），
`tests/round3.test.js` 断言；battleId/settledBattleId 均为瞬态键不落盘。

### 3.3 克制与养成接线（B5/B7/B8）

- 克制比 ≈1.18：vitest ✅。
- 天赋接入（B8）：同 seed 同笔，`talents:{might:1}` 与空天赋对照（modifiers 按 UI 同款
  `{ talent:{atk:talentMult(...)}, beast:beastBonus(save) }` 组装）。
  R3 实测：伤害 38.936 → 41.272，比值 **1.0600** ✅；crit=0.2 灵兽 50 笔 **11 次**暴击（无灵兽 0 次）✅。
- **金雷引（B7，R2 的 P0）**：`battle.cast` 暴击率 = `mods.crit + react.crit`（钳 ≤1）。
  R3 实测（各 2000 笔，`/tmp/acceptance/crit-lift.mjs`）：中性 19.55% → thunder→metal **34.75%**，
  偏移 **+15.2pp** ≈ 契约值 0.15 ✅；`tests/round3.test.js` 断言偏移 ∈ (0.10, 0.20)。**已收口**。

### 3.4 telegraph（B10）

沿用 R2 结论：侧栏「意图」被缚/蓄势/观势，蓄势窗口 400ms 按真实冷却计算 ✅（代码 + jsdom）。
真机目测（strike 前预警可辨识）归入 §6 真机冒烟（未执行，P1）。

### 3.5 键盘施法（E1）

已并入 §3.2 harness：**仅按 "1" 三次即胜、结算幂等、画阁留痕（带点列）** ✅。

## 4. 存档（清单 C 组）

1. 自动化：`store.test.js`（容错）、`progression.test.js`（8h 上限）、`gallery.test.js`（点列清洗/上限/体积）、
   `contract.test.js`（挂机幂等）、**`save-migrate.test.js`（16 用例：迁移链/备份/夹值/幂等/不改入参）**、
   `round3.test.js`（v1→v2 迁移 + hydrate 备份）。R3 全 ✅。
2. 综合 harness `/tmp/acceptance/save-roundtrip.mjs`，R3 实测（exit 0）：

```json
{ "roundtrip": true, "transientOnDisk": [], "migrated": true,
  "migratedUid": "ink_fox-v1-0", "backupIsOriginal": true,
  "futureSafe": true, "brokenSafe": true, "v0ok": true, "SAVE_VERSION": 2 }
```

   覆盖：persist→hydrate 逐字段往返（含 gallery points）；瞬态 7 键盘上不存在；
   **v1 旧档升 v2**（灵兽补 uid、settings 保留）且备份=原始串；version 99 保内存态 + 备份；
   坏 JSON 不炸 + 备份；v0 史前档（画阁字符串）升级保住六式进度。
3. 迁移纪律（写进 `store.js` 注释）：改字段 = `SAVE_VERSION`+1 + `MIGRATIONS` 补一步 + 往返单测三件套。
   **C7 已收口**；`screen/lastResult` 等会话字段仍落盘（entryScreen 消毒，无害，清单 C6 保留 P2）。

## 5. 无障碍（清单 E 组）

键盘走查脚本（全程不碰鼠标）：

1. `npm run dev` → Chrome 打开本地端口。
2. Tab「开卷入世」→ Enter；选职卡 radiogroup（方向键）→ Enter；「以此入世」→ Enter。
3. 枢纽 Tab 到秘境 → Enter 进战斗（首场教程弹层 trapFocus，Esc 或「开卷落笔」关闭）。
4. 数字键 1–6 施法（或 Tab 到符键条）；Esc 撤退。
5. 结算屏 Tab「回枢纽」→ Enter。

R3 状态：第 4 步由 §3.2 harness 自动化实证 ✅；aria-live、progressbar、focusScreen、:focus-visible、
静音总线沿用 R2 全绿。本轮新收口：
- **E5 减动效开关** ✅：枢纽与画阁各有 `motionToggle`（aria-pressed、即改即落盘），经 `motion-bridge`
  写 `<html data-reduced-motion>`，与系统偏好任一为真即生效；`tests/motion.test.js` 5 用例。
- **E7 对比度** ✅：`.stat-label`/`.cast-key-cost` 由 `opacity:0.6` 改为 `--ink-mute` 实色（6.77:1）；
  灵气不足态费用文字保持朱砂满对比。
真浏览器目测走查与读屏播报体验并入 §6 真机冒烟（未执行）。

## 6. 移动端（清单 D 组）

1. **双栈双采样实测（D5）**：harness `/tmp/acceptance/touch-dual.mjs`——挂 `mountPainter` 后对同一笔
   同时派发 pointer 与 touch 事件。R3 实测：
   - 双事件**同坐标**（真机实态）：24 move 采样 **25 点**（`geometry.sanitize` 合并相邻同坐标点），识别 line 正常；
   - 双事件坐标偏移 0.4px（机制验证）：采样 **49 点**，证明两栈仍同时监听。
   结论：真机实际影响被 sanitize 去重 + `drawing`/`pointerId` 闸门兜住，仅剩零长度重复 `brush.extend`；
   单栈化（检测 `window.PointerEvent` 时不挂 touch）降级为 P2 打磨项。
2. **取消防护（D6）** ✅ R3 强化：`pointercancel`/`touchcancel` 丢弃半笔（不 finalize、不施法、不留痕、
   不拼进下一笔），`painter.cancel()` 供换屏主动作废；`tests/pointer-cancel.test.js` 6 用例。
3. 双指同时按下：第二指 start 被闸门拒收 ✅（代码级 + 用例）。
4. **真机冒烟（D7）：未执行**（本验收环境无 iOS/Android 真机）。发布前人工执行：
   两平台各完成一场教程战，顺带录 F5 帧率（Performance 面板 10s 连续画螺旋 ≥58fps、无 >50ms 长任务）、
   目测 B10 telegraph、走一遍 §5 Tab 脚本。**这是唯一悬置的发布闸门（P1）。**
5. 布局断点：≤860px 战斗单列、≤800px 枢纽单列 ✅（CSS 审查，沿用 R2）。

## 7. 性能（清单 F 组）

1. `npm run bench`：R3 ✅ p95 **0.183ms**、0 误配、战斗 0.0153ms/回合、exit 0。
2. 60fps 墨迹（F5）：**未执行**（无实机），并入 §6-4 真机冒烟。
3. 泄漏（F6）：§3.2 harness 实测 battle↔hub 往返 5 次后 **活跃 interval 恒 0、resize 恒 1（painter 单例）** ✅。
   真浏览器复核命令：连打 5 场后 Console `getEventListeners(window).resize?.length` 恒定。
4. 战斗时钟仍为 200ms setInterval + 增量 DOM（F7 ⚠️ P2，rAF+accumulator 留作打磨）。

## 8. 目录隔离（清单 G 组）

> 本轮验收会话禁用 git，以下命令供**提交前**自查：

```bash
git -C /workspace status --short | grep -v "games/linghuashi/" ; echo "---"
git -C /workspace diff --stat HEAD -- . ':!games/linghuashi'
```

判定：两条输出除空行/`---` 外为空。
R3 文件系统快照：`games/linghuashi/` 外仅有根 `package-lock.json`（88B 未跟踪副产物）与原有 `test.js`。
**严禁提交根 package-lock.json，提交前直接删除**（根目录无 .gitignore，新增它本身也算根改动）。

## 9. Round 3 终审结论（2026-08-26 09:10 UTC）

### 本轮已收口（R2 遗留 → R3 已过）

| R2 问题 | 清单项 | R3 证据 |
| --- | --- | --- |
| reaction().crit 死字段（金雷引不生效） | B7 | cast 消费 react.crit；实测暴击率 +15.2pp；round3.test 锁定 |
| 乱涂红线不含 cloud，达标无门禁 | A6 | probe 全口径（含 cloud）8/400=2.0%，红线 5% |
| 金标准轨迹三份平行实现 | A7 | synth.js 唯一几何源；templates/trajectories 降为取景层；bench 0 误配 |
| 存档无迁移链（version≠1 即弃档） | C7 | SAVE_VERSION=2、MIGRATIONS v0/v1、.bak 备份、18 用例 + harness 三路实测 |
| settle.js 未接线、恰好一次靠 UI 标志 | B9/H5-3 | beginBattle/settleBattle + battleId 去重接入 screen-battle |
| combat/mods.js 死代码 | H5-1 | 模块已删除 |
| API_CONTRACT 整体过期 | H5 | 重写为「Round 3 终审版」：§9-A 收口账 10 条 + §9-B 残余账 14 条（带处置），抽查与代码一致 |
| 三栏异种无放生 UI、包子闭环 | （R2 遗留） | beast-panel 收伏/合成/洗练/放生（两步确认、返还半价、收放不刷包子），hub-beasts 11 用例 |
| reducedMotion 无 UI 开关 | E5 | motionToggle（hub+gallery）+ motion-bridge + 5 用例 |
| opacity 小字对比度 4.44:1 | E7 | 两处改 --ink-mute 实色（6.77:1） |
| pointercancel 收半截笔误施法风险 | D6 | cancel 改丢弃语义 + 6 用例 |
| 天赋定价双份常量（TALENT_COST 漂移） | H5-12 | talents.js 导出 TALENT_COST/TALENT_MAX_LEVEL 唯一源 |

### 仍未过（终稿定级）

**P0：无。**

| # | 问题 | 清单项 | 级别 |
| --- | --- | --- | --- |
| 1 | 真机人工冒烟未做（iOS/Android 教程战、60fps 录制、telegraph/Tab 目测） | D7/F5 | **P1（发布闸门）** |
| 2 | 提交前删除工作区根未跟踪 `package-lock.json` | G3 | **P1（提交纪律）** |
| 3 | 执行契约 §9-B 死代码删除清单：`talents.battleModifiers`、`core/events.js`、`progression/unlock.js`、两个 barrel、screen-hub TALENT_COST 双写（均零调用方，契约已裁定处置） | H5 | P2 |
| 4 | pointer+touch 双栈未单栈化（实测影响已被 sanitize 兜住） | D5 | P2 |
| 5 | 战斗时钟未上 rAF | F7 | P2 |
| 6 | 手绘 fixtures、导出/导入、盲测、会话字段分层、normalizeModifiers/keyboardStroke 直测 | A8/C8/H6/C6/H4 | P2 |

### 发布判定

**达到可发布的网页 SOTA 水位——有条件通过。**

自动化可验证的全部维度均以实测通过且有红线防回归：识别（六式 100%、乱涂全口径 2–3%、p95 0.18ms）、
战斗公平（确定性、结构性恰好一次、养成/克制/反应/暴击全接线并可统计验证）、存档（迁移链 + 备份 + 三路容错）、
无障碍（纯键盘通关、aria 语义、对比度、减动效/静音开关）、工程（105 用例、gzip 35KB、零泄漏）、
文档（API_CONTRACT v3 与实现同步，残余死代码零调用方且已带删除裁定）。

发布条件（均不涉及玩法正确性与数据安全，不构成 P0）：
1. 人工完成一次 iOS + Android 真机冒烟与桌面 60fps 录制（§6-4）；
2. 提交时按 §8 清根，勿带根 `package-lock.json`。
