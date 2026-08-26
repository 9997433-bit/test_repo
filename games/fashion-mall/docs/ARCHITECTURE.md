# 时尚百货城 · SOTA 架构说明（Round 1 / F1 定稿）

本文档是 `games/fashion-mall/` 的**可执行架构契约**：每一节先陈述基线现状（含文件与行为证据），再给出目标形态与落地改法。Round 2+ 的任何代码改动应服从本文；若需突破，先改本文再改代码。

配套文档：

- `docs/SOTA_RUBRIC.md` — 可打分验收表与基线缺口。
- `docs/MODULE_CONTRACT.md` — 模块所有权、公开接口冻结面、Round 2 分工防冲突规则。

---

## 1. 不变式（硬约束，任何 Round 不得违反）

1. **目录隔离**：全部代码、资源、文档只存在于 `games/fashion-mall/` 内；不 import 仓库根或其他游戏的任何文件；不修改仓库根文件。同仓库将并列放置其他游戏（见 §7）。
2. **零构建**：纯 ES Modules + 原生 CSS，`python3 -m http.server` 直接可玩。禁止 React/Vue/打包器/运行时依赖；`package.json` 仅承载 scripts。
3. **测试栈**：`node --test`（Node 原生 runner），核心逻辑必须能脱离 DOM 在 Node 中运行。
4. **无外部资源**：音效用 Web Audio 合成；图形用 CSS/emoji/inline SVG；不引用原作素材。
5. **单存档键**：localStorage 键固定为 `fashion-mall-save-v1`，版本升级靠信封内 `v` 字段迁移（§5），**不换键名**，避免玩家静默丢档。
6. **内容安全**：所有来自玩家或存档的字符串（`state.name`、导入 JSON 内任意字段）进入 DOM 时必须走 `textContent` 或统一转义函数，禁止直接模板插值进 `innerHTML`（基线在 `mall/mallView.js` 的 `<h1>${state.name}…</h1>` 与 `app.js` 的 toast 插值上违反了这一条，属 P0 修复项）。

---

## 2. 分层与模块地图

### 2.1 目标分层（依赖只允许自上而下引用下层）

```
┌────────────────────────────────────────────────────┐
│ app.js            组合根：装配、路由、tick 泵、全局定时器 │
├────────────────────────────────────────────────────┤
│ ui/  mall/  minigames/  fashion/  home/            │
│ partners/  research/  events/     —— 视图层（DOM）    │
├────────────────────────────────────────────────────┤
│ core/actions.js   动作层：唯一允许写 state 的入口（目标）│
├────────────────────────────────────────────────────┤
│ core/state.js  core/economy.js   —— 纯逻辑（无 DOM）   │
├────────────────────────────────────────────────────┤
│ data/balance.js  data/copy.js    —— 静态配置（无依赖）  │
├────────────────────────────────────────────────────┤
│ 边界适配器：core/save.js(localStorage)  core/audio.js  │
└────────────────────────────────────────────────────┘
```

依赖规则（`MODULE_CONTRACT.md` 有 import 白名单表）：

- `data/**` 不 import 任何东西；只导出常量与**纯函数公式**。
- `core/**` 只 import `data/**` 与 core 内部；**禁止 import 视图层、禁止触碰 `document`/`window`**（`save.js`、`audio.js` 作为边界适配器例外，但必须保持"环境缺失时静默降级"，现状已做到 `typeof localStorage === "undefined"` 守卫，保住 Node 可测性）。
- 视图层可 import `core` 与 `data`，**不得互相 import**（例如 `minigames/fastfood.js` 不得 import `mall/mallView.js`）。
- `app.js` 是唯一装配点：路由表、tick 泵、视图注册表都只在这里拼装。

### 2.2 基线符合度

基线的目录划分已经与目标一致（这是基线做对的部分，Round 2 不要推翻目录）。三处越界需要修正：

| 越界现状 | 证据 | 目标改法 |
|---|---|---|
| 视图直接写 state（`state.gold -= cost`、`s.level += 1` 等散落 6 个视图文件） | `mall/mallView.js`、`home/mansion.js`、`partners/roster.js`、`research/labs.js`、`minigames/blindbox.js`、`minigames/fortune.js` | 新建 `core/actions.js`，收敛为 `actions.upgradeShop(state, id)`、`actions.buyFurniture(state, id)` 等纯函数，返回 `{ ok, reason?, toast? }`；视图只调 action + 重绘。数值校验（钱够不够、槽满没满）全部进 action，可被 Node 单测覆盖 |
| 小游戏赏金公式硬编码在视图 | `fastfood.js` 的 `28 + done.length * 12`、`fresh.js` 的 `18 * score`、`boutique.js` 的 `40 + score * 35`、`blindbox.js` 的 `POOL`、`fortune.js` 的 `90/20` | 全部迁入 `data/balance.js`（如 `MINIGAME_PAYOUTS`），视图只查表。这也是基线 `docs/ARCHITECTURE.md` 自己立下却未执行的规则 |
| 文案散落视图 | 各视图内大量中文字符串；`data/copy.js` 只收了 INTRO/EVENTS/FASHION_CLIENTS | 玩家可见文案逐步收口进 `data/copy.js`；Round 2 允许增量迁移，新增文案必须直接进 copy.js |

---

## 3. 状态模型与数据流

### 3.1 单一 state 树（保持）

`core/state.js#defaultState()` 是唯一的 state 形状定义处。规则：

1. **存 id，不存派生对象**。基线违反两处，是当前最大的存档隐患：
   - `state.outfit` 存整个道具对象（含 `charm` 数值）→ 改平衡后老档魅力值不更新；应存 `{ hair: "bob", … }`，渲染时查 `OUTFITS`。
   - `state.partners` 存整个伙伴对象（含 `name/title/story` 文案）→ 加新伙伴、改文案对老档全部失效；应只存 `{ id, owned, level, assigned }`，静态部分查 `PARTNERS`。
2. **单一事实来源**。基线中"伙伴驻店"存了两份：`partner.assigned` 与 `shops[id].assignees[]`，靠 `syncUnlocks` 与 roster 手工对齐。目标：只保留 `partner.assigned`，`assignees` 改为 `economy.js` 里的派生查询（`partnersAt(state, shopId)`）。
3. **瞬态不入档**。`state.toast` 目前会被 `writeSave` 一并持久化，刷新后可能弹出陈旧 toast。目标：toast/当前 tab/当前 shopId 等 UI 瞬态移出 state 树（或在 `writeSave` 时剔除白名单外字段）。

### 3.2 数据流（目标）

```
用户输入 → 视图 handler → core/actions.* (唯一写点)
                              │ 返回 {ok, toast?}
                              ▼
                        state 变更 + dirty 标记
                              ▼
tick 泵(app.js) → core/state.tick() → 同样只经 actions/grant* 写
                              ▼
        渲染：全量 paint()（路由切换时） + HUD 订阅式局部刷新（每 tick）
```

渲染契约（视图层全员遵守）：

- 每个视图导出 `render(root, state, ctx)`，**返回 dispose 函数**（无资源可清理时返回 `undefined`）。`app.js` 的 `paint()` 在替换 `#stage` 内容前必须调用上一个视图的 dispose。基线的 `fresh.js` 把 `clearInterval` 挂在 `root._cleanup` 上但 `app.js` 从不调用——切走标签后 `setInterval(spawn, 700)` 永久泄漏并向已脱离的 DOM 追加节点。这是 P0 修复项，且修法必须是统一协议而不是补一处调用。
- 每 tick 的 HUD 刷新走**局部更新**：基线 `app.js` 用 `app.querySelector(".pill")` 只刷第一个 pill（金币），升级/魅力/速率全部滞留到下次全量重绘。目标：HUD 四个 pill 各给 `id`，tick 后按脏值更新文本节点；禁止每 tick 重建 innerHTML。
- 全量 `paint()` 只发生在路由切换、intro 完成、存档导入三类事件；交互内的重绘尽量限定在视图自身子树（基线各视图已经这样做，保持）。

---

## 4. 时间系统：tick、追帧、离线

### 4.1 基线问题（实测行为）

- `app.js` 用 `setInterval(…, TICK_MS=250)` 且**每次固定按 `dt = 0.25s` 记账**。浏览器对后台标签把定时器节流到 ≥1s（Chrome 挂后台 5 分钟后进一步到分钟级），于是**挂后台的在线收益塌陷到前台的 ~25% 乃至 ~0.4%**，比直接关页拿 65% 离线收益还亏——数值公平性被运行环境破坏。
- `lastTick` 只在 `persist()`（4 秒一次）和 `hydrate()` 时更新，与 tick 记账脱钩；没有 `visibilitychange` 处理。
- `settleOffline` 对时钟回拨（`hours < 0`）只是恰好被 `hours < 1/60` 早退挡住，属巧合而非设计。

### 4.2 目标设计：**时间戳驱动的统一结算**

核心原则：**在线 tick 与离线结算是同一个函数的两种参数**。

```js
// core/state.js（目标签名）
export function settle(state, nowMs) {
  const dtSec = Math.max(0, (nowMs - state.lastTick) / 1000); // 时钟回拨钳为 0
  if (dtSec <= 0) return { gold: 0, mode: "none" };
  if (dtSec <= ONLINE_GAP_MAX) {        // ≤ 30s：按在线全额记账
    applyOnline(state, dtSec);
    state.lastTick = nowMs;
    return { gold: …, mode: "online" };
  }
  const r = settleOffline(state, nowMs); // > 30s：按离线 65%、8h 封顶
  state.lastTick = nowMs;
  return { …r, mode: "offline" };
}
```

- tick 泵改为：`setInterval(() => settle(state, Date.now()), TICK_MS)` + `document.addEventListener("visibilitychange", …)` 在恢复可见时立刻 `settle` 并弹回执。后台节流后每次唤醒 `dt` 自然变大，收益不再丢失；离开超过 `ONLINE_GAP_MAX` 自动降为离线倍率，堵死"挂后台优于离线"和"挂后台劣于离线"两个方向的不公平。
- `lastTick` 从此**只由 `settle` 写**，`persist()` 不再触碰（基线里 `persist` 顺手改 `lastTick` 是隐蔽耦合）。
- tick 内的结算顺序固定为管线：`收入 → 目标进度 → 等级/解锁 → 通知收集`。目标续期（§4.3）与突发事件调度也挂在这条管线上，而不是各自开 `setInterval`（基线开了 3 个常驻 interval：tick/persist/event，目标收敛为 1 个泵 + 派生调度）。

### 4.3 限时目标必须成环

基线 `state.goal` 是一次性的：完成后永远显示"已完成"，超时无任何后果，核心循环第一环（"限时经营目标"）就断了。目标：`goal` 结算进 tick 管线——完成发奖后按主角等级生成下一档（目标额、时限、奖励查 `data/balance.js` 曲线）；超时未完成则降档重发并给安慰文案。数值曲线归 F3，**机制归 core，本节只锁接口**：`rollNextGoal(state) -> goal` 放 `data/balance.js`。

---

## 5. 存档与迁移

### 5.1 信封与现状

信封格式（保持）：`{ v: <int>, savedAt: <ms>, data: <state> }`。

基线缺陷（全部实证）：

1. `save.js#migrate()` 是**死代码**——`hydrate()` 直接 `{ ...defaultState(), ...(raw?.data || raw || {}) }` 浅合并，从未走 migrate。
2. 浅合并意味着嵌套结构不回填：**只要在 `SHOPS` 里加第 6 家店，老档 `state.shops` 缺该键，`syncUnlocks` 写 `state.shops[newId].unlocked` 即 TypeError，游戏白屏**。当前架构下"扩展新店铺"直接等于"炸老档"。
3. 派生对象入档（§3.1）导致数值/文案再平衡无法触达老档。
4. 导入路径 `importSave` 只校验 `v === 1 && data` 存在，不校验字段形状，配合 innerHTML 注入（§1.6）构成 XSS 入口。

### 5.2 目标迁移管线

```js
// core/save.js（目标）
const CURRENT_VERSION = 2;
const MIGRATIONS = {
  // 每个函数：把 vN 的 data 原地升到 vN+1，纯函数、可单测
  1: (d) => ({ ...d,
    outfit: mapValues(d.outfit, (item) => item.id ?? item), // 对象 → id
    partners: d.partners.map(({ id, owned, level, assigned }) => ({ id, owned, level, assigned })),
  }),
};

export function migrate(raw) {
  if (!raw?.v || !raw.data) return null;          // 认不出 → 交给坏档流程
  let { v, data } = raw;
  while (v < CURRENT_VERSION) { data = MIGRATIONS[v](data); v += 1; }
  return data;
}
```

配套规则：

- **加载序**：`loadSave → migrate → deepFill(defaultState(), data) → 形状校验 → hydrate`。`deepFill` 递归回填缺失键（新店、新槽位自动补默认值），解决 §5.1 第 2 条；对 `shops`/`partners` 这类"按配置表生成"的集合，按 `SHOPS`/`PARTNERS` 当前表逐 id 补齐。
- **坏档不清档**：迁移或校验抛错时，把原始串备份到 `fashion-mall-save-v1.corrupt`（同 localStorage），再开新档并提示玩家可导出备份；禁止静默 `removeItem`。
- **写档白名单**：`writeSave` 按 schema 白名单序列化，瞬态字段（toast 等）出不了档。
- **每次 state 形状变更必须**：`CURRENT_VERSION + 1`、补一个 `MIGRATIONS[n]`、在 `tests/save.test.js` 加"旧档原文 → 迁移 → 断言新形状"用例（旧档原文用字符串常量固化，防止用当前代码生成"伪旧档"）。
- 导出/导入沿用信封；导入走与加载完全相同的 `migrate + deepFill + 校验` 管线，因此天然支持导入旧版本导出档。

---

## 6. 插件点 A：扩展新店铺

目标是把"加一家店"收敛为**两处声明 + 一个新文件**，零散改动为零：

1. **`data/balance.js`**：向 `SHOPS` 追加一条（id/name/specialty/unlockLevel/base/growth/staffSlots/color/emoji/blurb）。经济系统（`shopRate`、`totalOnlinePerSec`、升级/招聘成本、商场网格、伙伴派驻列表）全部遍历 `SHOPS`，自动生效——基线这部分已经做对。
2. **`minigames/<id>.js`**：新建视图，遵守渲染契约（§3.2）：`export function render(root, state, ctx): dispose?`，赏金查 `MINIGAME_PAYOUTS[id]`。
3. **注册表**：基线在 `app.js` 硬编码 `SHOP_VIEW = { fastfood: renderFastfood, … }`，可接受但要求与 `SHOPS` 一致性有测试兜底。目标形态：`minigames/index.js` 导出 `SHOP_VIEWS` 注册表，`app.js` 只 import 注册表；`node --test` 断言 `SHOPS 每个 id 在注册表中存在`，防止"配置加了店、视图忘了注册"上线才发现。
4. **存档兼容**：依赖 §5.2 的 `deepFill` 按 `SHOPS` 补齐老档缺失店铺。**在迁移管线落地前，禁止向 `SHOPS` 加店**（会炸老档，见 §5.1）。

伙伴、家具、研发节点、换装件、突发事件的扩展方式同构：只增配置行（`PARTNERS`/`FURNITURE`/`RESEARCH_NODES`/`OUTFITS`/`EVENTS`），逻辑层全部按表遍历，不新增代码分支。

---

## 7. 插件点 B：同仓库扩展新游戏

- 每个游戏 = `games/<slug>/` 一个自包含目录，内含自己的 `index.html`、`src/`、`tests/`、`docs/`、`package.json`（仅 scripts）。**游戏之间零 import、零共享运行时**。
- 仓库根不放游戏代码；如未来需要游戏大厅/索引页，做成独立的 `games/index.html` 静态清单，只放链接，不引任何游戏模块。
- 共享代码策略：当前**禁止**建 `games/_shared/`。两个游戏出现雷同代码时先容忍复制；只有 ≥3 个游戏需要同一能力（如存档信封、合成音效）时，才提取 `games/_shared/<pkg>/` 并要求各游戏按副本拷贝（vendor）而非跨目录 import，保证"删掉任一游戏目录，其余游戏不受影响"这一根不变式。
- 本游戏对外的全部约定就是目录边界本身；`window.__FASHION_MALL__` 调试句柄仅供测试/演示（§9），不构成对其他游戏的 API。

---

## 8. 视图层横切规范（安全 / 无障碍 / 动效）

1. **转义**：新建 `ui/dom.js` 提供 `esc(str)` 与 `el(tag, props, children)` 小工具；所有插入用户可控字符串的位置改造完毕前，`state.name`、toast、导入档中的字符串一律 `textContent`。
2. **无障碍底线**（详细验收在 RUBRIC D 维）：toast 挂 `role="status" aria-live="polite"`；事件弹窗 `role="dialog" aria-modal="true"` + 焦点陷阱 + Esc 关闭；底部 nav 按钮加 `aria-current="page"`；接物小游戏必须给键盘左右键等效操作；`:focus-visible` 全局焦点环，选中态不得占用 `outline`（基线 `.choices button.on` 用 outline 表达选中，与焦点环冲突，改 `box-shadow` 或边框）。
3. **动效**：入场 240–360ms、弹性 ≤1.05（tokens 已有 `--ease`）；新增 `@media (prefers-reduced-motion: reduce)` 全局降级为不透明度渐变。
4. **音频**：`sfx` 增加 `mute` 开关并入档（用户偏好属于可持久数据）；修复基线 bug——`fastfood.js` 调 `sfx.beep?.()` 但 `sfx` 对象上没有 `beep`（它是独立导出的函数），失误音从未响过。

---

## 9. 测试接缝与性能预算

- **纯逻辑层可测**是本架构最重要的接缝：`data/` + `core/`（除两个边界适配器的浏览器分支）必须在 Node 裸跑。动作层落地后，"钱不够不能升级""碎片不足不能签约""盲盒期望值"这类规则全部可以脱离 DOM 断言。
- `window.__FASHION_MALL__ = { state, paint }` 保留，作为浏览器端冒烟/录屏的注入点；未来补 `actions` 进句柄。
- 性能预算（bench 兜底线，写死在 `scripts/bench.mjs`）：sim 吞吐 ≥ 50,000 ticks/s（基线实测 ~312k，现行 2,000 地板形同虚设）；单次 `settle` 含 8h 离线路径 < 1ms。浏览器侧预算（人工/录屏验收）：主界面 60fps、小游戏 ≥30fps、切页交互 < 100ms 可见反馈。
- DOM 层测试不强制自动化（约束 §1.3），但每个 Round 交付需附录屏证据走查 RUBRIC 的 A/D 维条目。

---

## 10. 基线差距索引

按危害排序的 P0 工程缺口（完整打分见 `SOTA_RUBRIC.md`）：

1. 存档迁移管线缺失 + 派生对象入档 → 任何内容扩展都会炸老档（§5.1）。
2. 固定 dt 的 setInterval tick → 后台收益塌陷、在线/离线不统一（§4.1）。
3. 视图 dispose 协议缺失 → fresh 小游戏计时器泄漏（§3.2）。
4. innerHTML 注入 `state.name`/toast → 导入档 XSS（§1.6）。
5. 盲盒/占卜期望值为正（60 花费 vs 90.2 期望、30 vs 66.7）→ 无限印钞，经济失衡（RUBRIC B6）。
6. 视图直写 state + 赏金公式散落视图 → 数值不可测、F3 无法安全调参（§2.2）。
7. 限时目标一次性、无障碍零实现、`sfx.beep` 失效等体验缺口（§4.3、§8）。
