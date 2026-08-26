# 叙事与体验规范（Round 1 / F4 定稿）

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
| `EVENTS` | 6 类突发事件（含 `resolve/decline` 收尾） | `events/randomEvents.js` | 表**已接线**；`resolve/decline` 待接 |
| `FASHION_CLIENTS` | 服装店 4 位客人 | `minigames/boutique.js` | **已接线** |
| `HUD` | 资源 pill 标签 | `app.js#paintHud` | 待接线 |
| `SHOPS_COPY` / `SHOP_LOCKED_HINT` | 五店副文案/玩法/胜负/锁定提示 | `mall/mallView.js`、各 minigame | 待接线 |
| `OFFLINE` | 离线回执面板 | `app.js#applySettle`、`core/state.js#hydrate` | 待接线 |
| `GOALS` | 限时目标行 + 续期播报 | `core/state.js#advanceGoal`、`mall/mallView.js#goalLine` | 待接线 |
| `FAIL` | 按 `actions` reason 码的失败反馈 | 各视图（`FAIL[res.reason] ?? res.toast`） | 待接线 |
| `SYSTEM` | 存档/静音/坏档提示 | `app.js#renderMore` | 待接线 |
| `A11Y`（a11y.js） | aria-label / 读屏 / 键盘提示 | 全视图 | `intro` 块已接线，其余待接 |

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

### 5.2 键盘等效

| 场景 | 键位 | 状态 |
|---|---|---|
| 开场命名 | 回车 = 提交 | 已实现（intro.js） |
| 事件弹窗 | Esc = 关闭（等效「拒绝」）、Tab 循环 | 待接线（randomEvents） |
| 生鲜接货 | ← → 移动菜筐 | 待接线（fresh.js，pointer-only 是 D1 缺口） |
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

### 6.2 限时目标续期（RUBRIC A5）

续期机制已在 `core/state.js#advanceGoal` 成环（达标升档 / 超时降档），文案层的三条播报规则：

1. **达标**：`GOALS.done`（赏金 + 阅历）紧跟 `GOALS.renewUp`（新档挂牌）——先兑现，再加码，两条 toast 的次序不可颠倒。
2. **超时**：只播 `GOALS.miss` 一条；降档编号出现在目标行里即可，不重复羞辱。
3. **目标行**（`GOALS.line`）常驻商场 hero：档位 · 目标额 · 还差 · 剩余时间 · 赏金，全部格式化数值，读屏走 `A11Y.goal` 前缀。

---

## 7. 待接线清单（按所有者 · Round 2 复核）

复核基准：`app.js`、`mall/mallView.js`、`events/randomEvents.js` 与各 minigame 的现行代码。优先级定义：**P0** = 阻塞 RUBRIC 验收或读屏可用性；**P1** = 功能已有但与 copy/a11y 键双源漂移，需收敛；**P2** = 收尾。

### 7.1 本轮已关闭的缺口（events / minigame 所有者落地）

- **事件弹窗可达性**：`randomEvents.js` 改用原生 `<dialog>.showModal()`——模态语义与焦点陷阱由平台提供，Esc 经 `cancel` 事件统一走「婉拒」路径；标题/正文挂 `aria-labelledby` / `aria-describedby`；不支持 `<dialog>` 的环境降级为 `role="dialog" aria-modal="true"` + keydown Esc（降级分支只移焦不困焦，属已知限制）。原「Esc + 焦点陷阱」待接项**已关**。
- **拒绝路径反馈**：事件收尾三路（接受/婉拒/超时错过）均已有专属文案，含少赚金额提示与打扰退避——但字符串落在 `randomEvents.js` 模块内的 `ACCEPT_LINES` / `DECLINE_LINES` / `MISS_LINES` 本地表，`copy.js#EVENTS` 的 `resolve` / `decline` 两键至今零消费。UX 缺口已关，键位归集降级为 P2（见 7.4）。
- **生鲜键盘（D1）**：`fresh.js` 已实现 ←→ 键控筐（`role="application"` + aria-label + 可见提示行），`fastfood.js` 追加 1–4 数字键出餐。功能缺口**已关**；提示文案未取 `A11Y.minigames.*`，归入 7.3 的漂移收敛。

### 7.2 仍开放 —— P0

**组合根（app.js 所有者）**——HUD 接线尚未合入，本节全部保持开放：

- `paintHud`：仍硬编码 emoji+文本。改用 `HUD.*` 标签并挂 `A11Y.hud.*` aria-label——读屏目前只读到裸数字，是 D3 缺口。
- `applySettle` 离线反馈：仍是单句硬编码 toast（`state.js#hydrate` 同）。RUBRIC A7 要求的回执面板（`OFFLINE.title/summary/rateNote/cappedNote/cta`）完全未落地，短离开变体 `OFFLINE.short` 亦未接。
- 失败反馈接线：`actions.js` 的 `reason` 码机制已就位且码表已扩（新增 `bad-balance`、`level-max`、`shop-crowded` 等），但没有任何视图走 `FAIL[res.reason] ?? res.toast`——§4 三段式（A6/A10）仍只存在于 copy.js。每个视图各一行改动即可接通；`FAIL` 未覆盖的新码由 `?? res.toast` 兜底，无需先补全码表。

### 7.3 仍开放 —— P1（双源漂移，需收敛）

- `mall/mallView.js`：`goalLine` 与锁定 toast 均为本地硬编码，措辞已与 `GOALS.line` / `SHOP_LOCKED_HINT` 漂移；店卡副文案未接 `SHOPS_COPY[id].tagline`；目标行未挂 `A11Y.goal` 读屏前缀。
- `core/state.js`：`hydrate`（离线 toast、坏档提示）与 `advanceGoal`（达标/超时播报）的硬编码中文未换 `OFFLINE` / `GOALS` / `SYSTEM` 键（core import data 层合法，MODULE_CONTRACT §1）；§6.2 的「`done` → `renewUp` 两连播」未实现，达标目前只播一条。
- 各 minigame：玩法提示各自硬编码，且比 copy.js 的 `howto` 更准确（fresh/fastfood 的本地版已含键盘说明）；胜负 toast 未接 `SHOPS_COPY[id].win/fail`，键盘提示未取 `A11Y.minigames.*`。**收敛方向：以现行模块内文案为准回写 copy/a11y 键，再让视图消费**——勿用旧键直接覆盖已上线文案。
- `app.js#renderMore`：导出/坏档提示硬编码未换 `SYSTEM.*`；根容器与 toast 容器未挂 `A11Y.app` / `A11Y.toastRegion`，底部导航未挂 `A11Y.nav.*`。

### 7.4 仍开放 —— P2（收尾）

- 事件收尾文案归集：把 `randomEvents.js` 三张本地表迁入 `copy.js#EVENTS`（形状冻结允许追加键，超时路径需追加 `miss` 键），或正式废弃 `resolve` / `decline` 两键——二选一，消除双源。弹窗 footer 的 Esc 提示同理（`A11Y.dialog.escHint` 未消费）。
- **F3（数值）**：`balance.js` 本轮已导出 `rollNextGoal` / `PASSIVE_XP`，但 `EVENT_REWARDS` 仍未导出——`copy.js#EVENTS` 的内联 `reward` 继续沿基线 60–140 金区间，导出后迁为查表（不改经济）。
