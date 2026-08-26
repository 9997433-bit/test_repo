# 叙事与体验规范（Round 1 / F4 定稿 · Round 3 批次 A+B 后接线复核）

本文是文案与新手体验的**可执行规范**：口吻规则、60 秒首胜脚本、失败反馈、无障碍文案、离线回执与限时目标续期的 UX 设计，以及给其他所有者的接线清单。文案实体在 `src/data/copy.js`，读屏文案在 `src/data/a11y.js`；本文只定规则，不复制字符串。

配套：`docs/DESIGN_SYSTEM.md`（视觉/对比度承诺）、`docs/SOTA_RUBRIC.md`（A1/A6/A7/A10、D1–D6 验收）。

---

## 1. 高概念与口吻

**一句话**：事业归零的她，用一张刮刮乐签收了一整座百货城——每一块钱都是打回来的翻身仗。

口吻三原则（所有进 `copy.js` 的字符串必须过检）：

1. **短句收尾**——一条 toast ≤ 18 字，一段叙事 ≤ 2 句；能删的形容词都删。
2. **动词开头**——「刮开」「签字」「拆盒」「站稳，再冲」；按钮永远是动作，不是名词。
3. **不卖惨**——谷底只出现在第一幕第一句；此后所有失败文案都指向下一步（§4），禁止「可惜/遗憾/失败了」这类只陈述损失的词。

人称约定：对玩家用「你」；旁白不用「请」；NPC 对主角的称呼统一「老板娘 / 姐姐」，体现城主身份与亲和的两面。

---

## 2. 文案系统地图

| 导出块（copy.js） | 内容 | 消费方 | 接线状态 |
|---|---|---|---|
| `INTRO` | 开场三幕、按钮、命名 | `ui/intro.js` | **已接线** |
| `EVENTS` | 6 类突发事件（含 `resolve/decline` 收尾） | `events/randomEvents.js` | **已接线**：收尾读 `resolve`/`decline`，超时与婉拒共用 `decline`（§4 禁则） |
| `FASHION_CLIENTS` | 服装店 4 位客人 | `minigames/boutique.js` | **已接线** |
| `HUD` | 资源 pill 标签 | `app.js#paintHud` | **已接线**：标签 + `A11Y.hud.*` aria-label 双通道 |
| `SHOPS_COPY` / `SHOP_LOCKED_HINT` | 五店副文案/玩法/胜负/锁定提示 | `mall/mallView.js`、各 minigame | 部分接线：店卡 `tagline` 与锁定提示已接（mallView）；`howto/win/fail` 仍在各 minigame 本地（7.3） |
| `OFFLINE` | 离线回执面板 | `app.js#applySettle`、`core/state.js#hydrate` | **已接线**（toast 形态）：`short`/`summary`/`cappedNote` 两处消费，金额先 `formatGold`；面板键（`title/rateNote/sourcesLabel/cta`）待面板化（7.2） |
| `GOALS` | 限时目标行 + 续期播报 | `core/state.js#advanceGoal`、`mall/mallView.js#goalLine` | **已接线**：`done`/`miss`/`line` 全消费；`renewUp`/`renewDown` 有意不播（§6.2） |
| `FAIL` | 按 `actions` reason 码的失败反馈 | 各视图（`FAIL[res.reason] ?? res.toast`） | 部分接线：mallView 升级/招聘、mansion 买家具、存档导入已走；roster/labs/minigame 扣费仍直用 `res.toast`（7.2） |
| `SYSTEM` | 存档/静音/坏档提示 | `app.js#renderMore` | **已接线**（renderMore 全键，含带备份时间戳的 `corruptKept`）；`hydrate` 坏档 toast 仍硬编码（7.3） |
| `A11Y`（a11y.js） | aria-label / 读屏 / 键盘提示 | 全视图 | `intro`/`hud`/`nav`/`goal`/`dialog`/`app`/`toastRegion` 已接；`minigames`/`offline` 待接 |

形状冻结：`EVENTS` 元素保持 `{ id, title, body, yes, no, reward }`，新增键只允许追加（现渲染器会忽略未知键）；`FASHION_CLIENTS` 保持 `{ need, tags, hint }` 且 `tags` 必须能在服装店 chip 池 + 成衣表中命中「完美改造」分（≥3）。

---

## 3. 60 秒首胜脚本（RUBRIC A1）

设计目标：**首个正反馈 ≤ 40s，首个可见钩子 ≤ 60s**，全程无死路、无必读长文本。

| 时间 | 幕 | 玩家动作 | 系统反馈 | 文案钩子 |
|---|---|---|---|---|
| 0–10s | 第 1 幕 刮卡 | 1 次点击「刮开」 | `sfx.rare` + 揭晓 | 谷底一句话 +「整座，归你」的反转 |
| 10–20s | 第 2 幕 签收 | 输名字（回车即提交）或直接点按钮 | 默认名「林小姐」兜底，空名不卡关 | 「签字，收下这座城」——所有权仪式感 |
| 20–30s | 第 3 幕 战袍 | 0–1 次点击（默认已选中第一套） | `aria-pressed` 选中态 + `sfx.tap` | 「翻身，从穿对衣服开始」 |
| 30–55s | 快餐店首单 | 按订单点 2–4 次出餐键 | 每次命中 `sfx.tap`，齐单弹「+N」toast | 第一笔自己赚的钱 |
| 55–60s | 回商场 | 1 次点击「返回商场」 | hero 下方限时目标行倒计时可见 | 第一个 8 分钟冲刺目标挂牌 |

关卡设计约束（改动开场时必须保持）：

- 三幕各只有**一个主按钮**；命名幕支持回车提交；战袍幕有默认选中，允许零决策通过。
- `onDone` 直落快餐店（`app.js` 现状），不经过商场——首胜之前不给任何岔路。
- 首单小费（balance 基线 ~52–76 金）足够让玩家在返回商场时看到目标进度条已动，避免「目标遥不可及」的首屏挫败。

---

## 4. 失败反馈三段式（RUBRIC A6/A10）

所有失败/拒绝文案遵循：**说事实 → 保尊严 → 给下一步**。三段可压缩进一句，但次序不换：

- 钱不够：`现金不够。回商场做两单，马上回来。`（事实 + 下一步）
- 目标超时：`这一档没赶上。降档重开——数字会等你，时间不会。`（事实 + 台阶 + 催促）
- 出餐点错：`不是这份。深呼吸，重来。`（事实 + 无损重试）
- 占卜小凶：`今天宜修身，明天宜翻盘。`（把随机负面转成节奏建议）

实现键位：`copy.js#FAIL` 的键与 `core/actions.js` 返回的 `reason` 码一一对应（`insufficient-gold`、`slots-full`、`locked`…）。视图接线写法：`toast(FAIL[res.reason] ?? res.toast)`——action 层的兜底文案不动，表演层文案可独立迭代。

禁则：失败不扣已得资源的场合，文案里不得出现损失暗示；随机玩法（盲盒/占卜）的低赏结果不用「失败」叙事，用「攒普通款/宜修身」的收集与节奏叙事。

---

## 5. 无障碍文案与交互规范（RUBRIC D1–D6）

### 5.1 焦点

- **步进换屏后，焦点交给新屏的 `h2[tabindex="-1"]`**（intro 已实现）：读屏先播标题与幕次，键盘用户按一次 Tab 即达主按钮。
- 弹窗打开时焦点移入 sheet 内第一个按钮，关闭后**焦点归还触发前的元素**；Tab 在 sheet 内循环（焦点陷阱）。
- 选中态一律 `aria-pressed` + class `on`（box-shadow 表达），**不占用 outline**——outline 留给 `:focus-visible` 焦点环（DESIGN_SYSTEM §7）。
- **动作后的重绘不许甩焦点（RUBRIC C2/D2，已落地）**：商场升级/招聘与伙伴培训/派驻改为骨架只建一次、其后原地 diff 文本/禁用态——刚点过的按钮还是原来那个 DOM 节点，焦点自然留在原地。按钮变灰（满级/满员）或整卡重建（签约）时，由 `mallView.js#keepFocus` / `roster.js#restoreFocus` 按「同排可用按钮 → 卡片本身」的候选序把焦点接住，不掉回 body。

### 5.2 键盘等效

| 场景 | 键位 | 状态 |
|---|---|---|
| 开场命名 | 回车 = 提交 | 已实现（intro.js） |
| 事件弹窗 | Esc = 关闭（等效「婉拒」）、Tab 循环 | 已实现（randomEvents 原生 `<dialog>`，降级分支手动兜） |
| 生鲜接货 | ← → 移动菜筐 | 已实现（fresh.js；fastfood 另有 1–4 数字键出餐） |
| 快餐出餐 | Tab 切换餐品、回车出餐 | 原生 button 已可用 |
| 全局导航 | Tab 顺序 = 视觉顺序 | 原生满足，勿用正 tabindex 破坏 |

键盘提示文案统一取 `a11y.js#A11Y.minigames`，以视觉可见的一行小字 + `aria-description` 双通道呈现。

### 5.3 对比度

- 文案排版遵守 DESIGN_SYSTEM §2.3 的承诺表：正文墨莓 `--text-strong` ≥ 13:1，辅助 `--text-soft` ≥ 7:1；**粉色文字一律 rose-700**（rose-500 只做底）。
- 文案侧的额外规则：**关键数字不进渐变底上的小字**——金额、倒计时只出现在 `--text-strong`/`--text-gold` 的组合上；11px 幕次标签只承载可丢失信息（丢了不影响通关）。

### 5.4 读屏播报

- toast 容器保持 `role="status" aria-live="polite"`（已有），播报文案即 toast 原文，因此 toast 必须自含主语（「星光快餐 升到 Lv.2」而非「升级成功」）。
- HUD 数值 pill 挂 `A11Y.hud.*` 生成的 aria-label（含单位与含义），避免读屏只读到裸数字。
- 装饰性 emoji（刮刮乐 🎫、店铺图标）一律 `aria-hidden="true"`，语义由相邻文本承担。

### 5.5 动效降级

`motion.css` 已实现 `prefers-reduced-motion` 全局压缩；文案侧的配套规则：**信息不得只靠动效传达**——飘字「+N」必须同时落 toast/回执文本，刮卡揭晓的中奖行是静态文本而非动画帧。

---

## 6. 离线回执与限时目标续期 UX

### 6.1 离线回执（RUBRIC A7）

目标形态是**回执面板**（非 toast）：标题「离店报告」+ 主行（时长/金额）+ 倍率说明 + 封顶提示（触发时）+ 单按钮 CTA「收下，开工」。信息优先级：金额 > 时长 > 倍率 > 封顶。

- 键位全部在 `copy.js#OFFLINE`；数值由调用方 `formatGold`/`toFixed` 后传入（copy 层不做数学，B8 格式化一致性由调用方保证）。
- 离开 < 30 分钟走轻量变体 `OFFLINE.short`（toast 即可），避免「离开 0.1 小时」这类破坏叙事的回执。
- 封顶文案（`cappedNote`）承担软召回：不指责缺席，用「这座城，需要你回来」把 8 小时上限讲成邀请。

接线现状（Round 3 批次 A+B）：**toast 形态已落地**——`core/state.js#offlineReceipt`（`hydrate` 启动路径）与 `app.js#offlineReceipt`（`applySettle` 运行路径）按「短离开走 `short` / 常规拼 `summary` / 超帽追加 `cappedNote`」消费本块，金额先 `formatGold`、时长先 `toFixed(1)`。回执**面板**形态（`title/rateNote/sourcesLabel/cta` 四键）仍未落地，对应量规 P0-2 的剩余半项（见 7.2）。

### 6.2 限时目标续期（RUBRIC A5）

续期机制已在 `core/state.js#advanceGoal` 成环（达标升档 / 超时降档），播报已全部改走 `GOALS` 键，赏金先 `formatGold`。三条播报规则（Round 3 修订）：

1. **达标**：只播 `GOALS.done`（赏金 + 阅历）一条。`renewUp` **有意不播**——`advanceGoal` 在离线追帧时会循环跨越多档，「done → renewUp」两连每档翻倍刷屏；新档信息由商场目标行挂牌交代（Round 3 简报定案，勿按旧版「两连播」回改）。
2. **超时**：只播 `GOALS.miss` 一条；降档编号出现在目标行里即可，不重复羞辱。
3. **目标行**（`GOALS.line`）常驻商场 hero：档位 · 目标额 · 还差 · 剩余时间 · 赏金，全部格式化数值，读屏走 `A11Y.goal` 前缀（`mall/mallView.js#goalLine` / `paintGoal` 已落地）。

---

## 7. 待接线清单（按所有者 · Round 3 批次 A+B 后复核）

复核基准：`app.js`、`core/state.js`、`mall/mallView.js`、`home/mansion.js`、`partners/roster.js`、`events/randomEvents.js` 与各 minigame 的现行代码。优先级定义：**P0** = 阻塞 RUBRIC 验收或读屏可用性；**P1** = 功能已有但与 copy/a11y 键双源漂移，需收敛；**P2** = 收尾。

### 7.1 已关闭的缺口

- **事件弹窗可达性**：`randomEvents.js` 改用原生 `<dialog>.showModal()`——模态语义与焦点陷阱由平台提供，Esc 经 `cancel` 事件统一走「婉拒」路径；标题/正文挂 `aria-labelledby` / `aria-describedby`；不支持 `<dialog>` 的环境降级为 `role="dialog" aria-modal="true"` + keydown Esc（降级分支只移焦不困焦，属已知限制）。原「Esc + 焦点陷阱」待接项**已关**。
- **拒绝路径反馈 + 事件收尾归集**：事件收尾三路（接受/婉拒/超时错过）均有专属文案，含少赚金额提示与打扰退避。`randomEvents.js` 的 `ACCEPT_LINES` / `DECLINE_LINES` / `MISS_LINES` 三张本地表已删，收尾改读 `copy.js#EVENTS` 的 `resolve` / `decline`（漏填回退正文）；超时错过与婉拒结果相同（什么都没损失），按 §4 禁则共用 `decline`，不另设 `miss` 键。弹窗 footer 的 `A11Y.dialog.escHint` 亦已消费。原 P2 归集项**已关**（见 7.4）。
- **生鲜键盘（D1）**：`fresh.js` 已实现 ←→ 键控筐（`role="application"` + aria-label + 可见提示行），`fastfood.js` 追加 1–4 数字键出餐。功能缺口**已关**；提示文案未取 `A11Y.minigames.*`，归入 7.3 的漂移收敛。
- **HUD 与全局 ARIA（D3）**：`app.js#paintHud` 改用 `HUD.*` 标签 + `A11Y.hud.*` aria-label 双通道，emoji 降为装饰；根容器、toast 容器与底部导航挂上 `A11Y.app` / `A11Y.toastRegion` / `A11Y.nav.*`。原 7.2 首项**已关**。
- **商场文案收敛**：`mallView.js` 目标行走 `GOALS.line` 并挂 `A11Y.goal` 读屏前缀，锁定 toast 走 `SHOP_LOCKED_HINT`，店卡副文案接 `SHOPS_COPY[id].tagline`。原 7.3 首项**已关**。
- **core 播报接 copy（Round 3 批次 A+B，量规 P0-2 部分关）**：`state.js#hydrate` 的离线 toast 经 `offlineReceipt` 消费 `OFFLINE.short/summary/cappedNote`，`advanceGoal` 达标/超时播 `GOALS.done` / `GOALS.miss`，金额一律先 `formatGold` 再进 copy。坏档句仍硬编码（见 7.3）。
- **豪宅旧价下线（Round 3 批次 A+B，量规 P0-1 关）**：`mansion.js` 私有 `200/bonus` 价目已删，展示价与扣款全走 `actions.buyFurniture` / `furnitureCost`；`buy` 失败走 `FAIL[res.reason] ?? res.toast`，钱不够时追加已 `formatGold` 的「还差 N 金」。
- **交互重绘保焦点（Round 3 批次 A+B，量规 P0-3 关，C2/D2）**：`mallView` / `roster` 改为骨架只建一次 + 原地 diff，动作后焦点留在原按钮；变灰/换卡时的候选序与 `keepFocus` / `restoreFocus` 两处兜底见 §5.1。
- **推进模拟入测（Round 3 批次 C，量规 P0-5 关，E3）**：`tests/simulation.test.js` 对 60 分钟半活跃/纯挂机断言五店全解锁，且限时目标续期 ≥10 轮；`npm test` 现为 94 项。
- **升级庆祝与组件态（Round 3 批次 C，量规 P0-6 关，A8）**：主角升级给 `#pill-level` 挂 `levelup`（`--anim-pop-in` + 星光）；商场升级/招聘在行上飘 `--anim-coin`；未解锁店卡点击 `--anim-shake`。`prefers-reduced-motion` 下动画全关。
- **系统文案（更多页）**：`renderMore` 的静音/导出/导入/清空确认全走 `SYSTEM.*`；坏档备注用 `loadCorruptBackup().at` 拿到备份时间戳后走 `SYSTEM.corruptKept`。连同「HUD 与全局 ARIA」条的挂标，原 7.3 renderMore 项**已关**。

### 7.2 仍开放 —— P0

- 离线回执**面板化**（A7）：toast 文案已接 `OFFLINE` 键（见 §6.1 与 7.1），但回执面板形态仍未落地——`OFFLINE.title/rateNote/sourcesLabel/cta` 四键零消费，`applySettle` 与 `hydrate` 仍以 toast 呈现。对应量规 P0-2 的剩余半项。
- 失败反馈补全（A6/A10）：`FAIL[res.reason] ?? res.toast` 已在 `mallView.js#runner`（升级/招聘）、`mansion.js#buy`、`app.js` 存档导入三处接通；`roster.js#commit`、`labs.js` 与盲盒/占卜的入场扣费（`payFee`）仍直用 `res.toast`。每处一行改动即可接通；`FAIL` 未覆盖的新码（`bad-balance`、`shop-crowded`…）由 `?? res.toast` 兜底，无需先补全码表。
- 量规侧仍开的 P0（非文案席位，此处只记账不认领）：**P0-7 1280 双栏工作台与 legacy token 退役**。P0-4 取证已留档 `docs/EVIDENCE.md`（内存无累积泄漏、主界面/生鲜 60fps、对比度揪出 success 字色与豪宅徽标不达标）。

### 7.3 仍开放 —— P1（双源漂移，需收敛）

- `core/state.js` 坏档句：`hydrate` 的坏档 toast 仍硬编码「旧存档无法识别，已备份原档并开新档」。`SYSTEM.corruptKept` 在此处未接——该键需要备份时间戳，而 `readSaveData` 只返回 `{ data, corrupt }`，不吐 `backupCorrupt` 写入的 `at`；等 `save.js` 在读档路径吐出备份时间再换键（Round 3 简报留给收尾）。「更多」页的坏档备注已带时间戳走 `corruptKept`（见 7.1），两处口径暂不一致。
- 各 minigame：玩法提示各自硬编码，且比 copy.js 的 `howto` 更准确（fresh/fastfood 的本地版已含键盘说明）；胜负 toast 未接 `SHOPS_COPY[id].win/fail`，键盘提示未取 `A11Y.minigames.*`。**收敛方向：以现行模块内文案为准回写 copy/a11y 键，再让视图消费**——勿用旧键直接覆盖已上线文案。

### 7.4 仍开放 —— P2（收尾）

- 事件收尾文案归集**已关**：双源已消除，`randomEvents.js` 读 `EVENTS` 的 `resolve` / `decline`，`A11Y.dialog.escHint` 已消费（详见 7.1）；超时与婉拒共用 `decline`，`miss` 键不再需要追加。
- **F3（数值）**：`balance.js` 已导出 `rollNextGoal` / `PASSIVE_XP`，但 `EVENT_REWARDS` 仍未导出——`copy.js#EVENTS` 的内联 `reward` 继续沿基线 60–140 金区间，导出后迁为查表（不改经济）。
