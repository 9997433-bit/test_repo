# 时尚百货城 · 设计系统 v2.0

> Round 1 / Fable-2 交付。Token 源文件：`src/styles/tokens.css`（色彩 / 排印 / 圆角 / 阴影 / 组件）与 `src/styles/motion.css`（动效）。
> 本文是唯一视觉规范，`main.css` 的一切取值以此为准；出现冲突时以 token 文件为实现基准、本文为设计意图基准。

---

## 0. 视觉定位

| 关键词 | 设计翻译 |
| --- | --- |
| 奶油白 | 页面永远是暖白纸面（`--cream-50` 系），拒绝冷灰；深色只用带玫瑰调的墨莓色 `--ink-900`，不用纯黑 |
| 玫瑰金 | 财富与成就用香槟金渐变 `--grad-gold` + 金属玫瑰金 `--grad-rosegold`，配玫瑰调投影，「赚到钱」的瞬间必须发光 |
| 珊瑚粉 | 品牌主色是珊瑚玫瑰 `--rose-500`，CTA 一律玫瑰渐变；暖珊瑚 `--coral-*` 做快餐店等热闹场景的辅助 |
| 薄荷绿 | 成功 / 完成 / 生鲜业态专属 `--mint-*`，与粉色形成互补对比，让「完成」一眼可辨 |
| 卡通通透 | 玻璃拟态三档表面 + 顶部 1.5px 内高光 `--glass-highlight` + 大圆角 + 彩色投影，界面像果冻和马卡龙 |
| 女强人逆袭 | 数值永远醒目（tabular-nums、大字号、金色），升级 / 结算给戏剧化动效（`--dur-drama`），叙事文案用 `--text-soft` 温柔托底 |

设计原则：

1. **粉是底气不是滤镜**——主色只给可点击、可获得、可庆祝的东西；信息层保持奶油白+墨莓的高对比（正文 ≥ 7:1）。
2. **通透靠层次不靠透明度堆叠**——同屏最多三档表面（页面渐变 → 玻璃卡 → 内嵌 veil），透明度值只取 token。
3. **反馈必须即时**——任何点击 90ms 内有形变或阴影响应；奖励类反馈允许夸张（弹性缓动、飘字、星光）。
4. **一切取值走 token**——组件 CSS 禁止出现裸色值 / 裸时长；原子层（`--rose-500` 等）只允许被语义层和组件层引用。

---

## 1. Token 架构

```
原子 primitive（--rose-500 …）      色板原料，组件 CSS 禁止直接引用
  └ 语义 semantic（--text-soft …）  按用途命名，跨组件复用
      └ 组件 component（--btn-primary-bg …）  main.css 逐个选择器接入
legacy 别名（--rose / --shadow …）  兼容现 main.css，Round 2 迁移完毕后删除
```

- 动效 token 独立在 `motion.css`，`tokens.css` 保持自包含（`--ease` 在其中保留字面值，避免 `motion.css` 未加载时 transition 失效）。
- **接入注意**：`index.html` 目前只引了 `tokens.css` 与 `main.css`，Round 2 需在 `tokens.css` 之后加一行 `<link rel="stylesheet" href="./src/styles/motion.css" />`。

---

## 2. 色板

### 2.1 原子色阶

| 色族 | 用途 | 关键档位 |
| --- | --- | --- |
| 珊瑚玫瑰 `--rose-50…900` | 品牌 / CTA / 主角 | 500 `#ef5a8f` 主色 · 600 `#d43d75` 渐变深端 · 700 `#b02a5e` 文本安全 |
| 珊瑚粉 `--coral-100…500` | 快餐店 / 暖场点缀 | 300 `#ffb28e` · 500 `#f97952` |
| 香槟金 `--gold-100…700` | 金币 / 结算 / 稀有 | 300 `#eecf8c` 金按钮亮端 · 500 `#d19f48` 深端 · 700 `#8a6329` 文本安全 |
| 玫瑰金 `--rosegold-200…500` | 勋章 / VIP / 金属描边 | 400 `#e2a084` |
| 薄荷绿 `--mint-100…600` | 成功 / 完成 / 生鲜店 | 300 `#7fdcc4` · 600 `#1e8f76` 文本安全 |
| 丁香紫 `--lilac-100…600` | 占卜屋 / 稀有度 | 300 `#c9b6ff` · 600 `#7557bf` 文本安全 |
| 奶油白 `--cream-0…300` | 纸面 / 弹层底 | 50 `#fff7f2` 页面基准 |
| 墨莓 `--ink-100…900` | 文本 / 描边中性色 | 900 `#3a2433` 标题 · 500 `#6b4b5c` 辅助 · 300 `#a98a99` 禁用 |

### 2.2 语义映射（组件 CSS 应引用这一层）

| 语义 token | 值 | 场景 |
| --- | --- | --- |
| `--text-strong` / `--text-body` | ink-900 | 标题、正文、数值 |
| `--text-soft` | ink-500 | 描述、副标题 |
| `--text-faint` | ink-300 | 占位、禁用文字 |
| `--text-brand` | rose-700 | 链接、强调、选中文字 |
| `--text-gold` | gold-700 | 收益 / 价格文本 |
| `--text-on-brand` | `#fff` | 玫瑰渐变按钮文字 |
| `--success / --warning / --danger / --info` | mint-500 / gold-500 / `#e14b64` / lilac-500 | 反馈色，各配 `-bg` 浅底 |
| `--surface-card` | `rgba(255,255,255,.86)` | 常规玻璃卡（配 `backdrop-filter: blur(var(--blur-glass))`） |
| `--surface-glass-strong` | `rgba(255,255,255,.93)` | 顶栏、底部导航 |
| `--surface-veil` | `rgba(255,255,255,.55)` | 卡片内嵌次级面 |
| `--surface-sheet` | cream-50 | 弹窗纸面 |
| `--surface-scrim` | `rgba(58,36,51,.45)` | 弹窗遮罩 |
| `--line-soft / --line-strong / --line-dashed` | 见 tokens | 分隔线 / ghost 按钮描边 / 订单虚线 |

### 2.3 对比度承诺（WCAG，奶油白 `#fff7f2` 底）

| 组合 | 对比度 | 判定 |
| --- | --- | --- |
| `--text-strong` ink-900 | 13.4 : 1 | AAA |
| `--text-soft` ink-500 | 7.1 : 1 | AAA |
| `--text-brand` rose-700（白底） | 6.3 : 1 | AA（正文可用） |
| 白字 on `--grad-brand`（500→600 段） | 3.2–4.4 : 1 | 按钮文字 ≥15px/600 字重，并加 `--btn-primary-text-shadow` 兜底 |
| ink-900 on `--grad-gold` 亮端 | 9.4 : 1 | AAA |
| `--text-success` mint-600 | ≥ 5.0 : 1 | AA |

规则：**rose-500 只做底不做字**；需要粉色文字一律 rose-700。禁用态文字 ink-300 不承诺对比度（配合禁用光标与降饱和整体传达）。

> **2026-08 实测复核**（Round 3 / F2，全表核算见 `docs/EVIDENCE.md` §3）：前三行与 grad-gold 行实测兑现；**`--text-success` 行实测仅 3.78:1，本表承诺值有误**；白字 on grad-brand 中深段与本表一致，但 0% 亮端实测 2.13:1，且 15px/600 不构成 WCAG 大字、严格 AA 口径不达标。修正建议见 EVIDENCE §3.4。

### 2.4 业态色语（五店区分）

快餐店＝珊瑚 `--coral-300`；生鲜店＝薄荷 `--mint-300`；服装店＝玫瑰 `--rose-300`；盲盒店＝香槟金 `--gold-300`；占卜屋＝丁香紫 `--lilac-300`。店卡在图标底、进度条填充、徽标上使用各自业态色，其余仍走全局语义。

---

## 3. 字体排印

字体栈 `--font`：PingFang SC → Hiragino Sans GB → Noto Sans SC → Microsoft YaHei。

| 语义 | token | 390 移动 | 1280 桌面 | 行高 | 字重 | 用途 |
| --- | --- | --- | --- | --- | --- | --- |
| Display | `--text-2xl` / `--text-3xl` | 28px | 34px | `--leading-tight` 1.25 | 700 | 结算数字、刮刮乐金额 |
| H1 | `--text-xl` | 22px | 28px（取 2xl） | 1.25 | 700 | 页面主标题（hero） |
| H2 | `--text-lg` | 17px | 17px | 1.25 | 700 | 面板标题 |
| Body | `--text-md` | 15px | 15px | `--leading-normal` 1.45 | 400/600 | 正文、卡片标题 |
| Caption | `--text-sm` | 13px | 13px | `--leading-loose` 1.6（长叙事） | 400 | 描述、toast |
| Label | `--text-xs` | 12px | 12px | 1.25 | 600 | 资源 pill、徽标 |
| Nav | `--text-2xs` | 11px | 12px（取 xs） | 1.25 | 600 | 底部导航标签 |

数值规范：金币 / 钻石 / 魅力值等 HUD 数字必须 `font-variant-numeric: tabular-nums`（等宽数字，跳动不抖版），字重 ≥ 600，涨跌反馈配 `fm-coin-rise` 飘字。品牌字 `letter-spacing: var(--tracking-wide)`。

---

## 4. 圆角

| token | 值 | 场景 |
| --- | --- | --- |
| `--radius-xs` | 8px | 进度条内胆、小徽标、鞋子色块 |
| `--radius-sm` | 12px | chip、家具块、小按钮 |
| `--radius-md` | 16px | 常规按钮（`--btn-radius` 14px 介于 sm/md，专供按钮）、流水线键、小游戏区 |
| `--radius-lg` | 22px | 卡片 / 面板基准（= legacy `--radius`） |
| `--radius-xl` | 28px | hero、结算大卡 |
| `--radius-pill` | 999px | 顶栏、pill、进度条外壳 |

规则：同一容器内，子元素圆角 ≤ 父元素圆角 − 4px（视觉嵌套不打架）；弹窗 sheet 用 `--modal-sheet-radius` 24px。

---

## 5. 阴影与通透

| token | 值 | 场景 |
| --- | --- | --- |
| `--shadow-1` | 0 2 8 rgba(199,59,111,.10) | pill、chip |
| `--shadow-2` | 0 6 18 rgba(199,59,111,.13) | 店卡、悬浮小件 |
| `--shadow-3` | 0 16 40 rgba(199,59,111,.16) | 面板、顶栏、导航（= legacy `--shadow` 主体） |
| `--shadow-4` | 0 24 64 rgba(139,31,74,.22) | 弹窗、结算卡 |
| `--shadow-btn` / `--shadow-btn-press` | 见 tokens | 主按钮常态 / 按压（按压时 translateY(1px) 且阴影收紧） |
| `--shadow-gold` / `--shadow-mint` | 金 / 薄荷彩色投影 | 金按钮、完成态 |
| `--glass-highlight` | inset 0 1.5px 0 rgba(255,255,255,.9) | 所有玻璃表面的顶部高光，「果冻感」的来源 |

规则：投影永远带玫瑰 / 品类色调，禁止纯黑投影；玻璃卡 = `--surface-card` + `backdrop-filter: blur(var(--blur-glass))` + `--glass-highlight`。悬浮态阴影升一档（1→2、2→3），按压降一档。

---

## 6. 渐变

| token | 场景 |
| --- | --- |
| `--grad-brand` / `--grad-brand-press` | 主 CTA 常态 / 按压 |
| `--grad-gold` | 金按钮、收益结算 |
| `--grad-rosegold` | 勋章、VIP、里程碑描边 |
| `--grad-mint` / `--grad-lilac` | 完成态、占卜稀有面 |
| `--grad-page` | 页面背景（替换 main.css 现硬编码的 body 渐变） |
| `--grad-hero` | 首屏 hero 卡 |
| `--grad-progress` | 进度条填充（玫瑰→金，寓意「努力变成钱」） |
| `--grad-nav-active` | 导航选中底 |
| `--grad-shine` | 高光扫过条纹，配 `fm-shine` 关键帧 |

---

## 7. 间距、触控与层级

- 4pt 网格：`--space-1…8` = 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40。卡片内边距 16，卡片间距 12，区块间距 16–24。
- 触控目标最小 `--tap-target` 44px（底部导航项、流水线键必须达标；现导航 `padding: 8px 0` + 11px 字未达标，Round 2 需修）。
- z-index 只用 token：toast 5 / nav 10 / modal 20 / 全屏特效 30。
- 键盘焦点：所有可交互元素 `:focus-visible { box-shadow: var(--ring-focus); }`（可叠加在原阴影后）。

---

## 8. 动效（`motion.css`）

### 8.1 时长

| token | 值 | 场景 |
| --- | --- | --- |
| `--dur-instant` | 90ms | 按压形变、chip 勾选 |
| `--dur-fast` | 160ms | hover、颜色 / 边框过渡 |
| `--dur-base` | 240ms | 卡片入场、页签切换 |
| `--dur-slow` | 360ms | toast、弹窗升起 |
| `--dur-drama` | 600ms | 刮刮乐揭晓、升级庆祝、金币飘字 |
| `--dur-ambient` | 2400ms | 掉落 / 漂浮等挂机氛围循环 |
| `--stagger-step` | 45ms | 列表级联入场：第 n 项 `animation-delay: calc(n * var(--stagger-step))` |

### 8.2 缓动

| token | 曲线 | 用途 |
| --- | --- | --- |
| `--ease-out` | (0.22, 1, 0.36, 1) | 标准出场（= legacy `--ease`） |
| `--ease-in` | (0.55, 0, 1, 0.45) | 退场收起 |
| `--ease-in-out` | (0.65, 0, 0.35, 1) | 循环氛围 |
| `--ease-spring` | (0.34, 1.56, 0.64, 1) | 弹性入场（带 5% 过冲） |
| `--ease-pop` | (0.18, 0.89, 0.32, 1.28) | 奖励弹出、数值跳动 |

### 8.3 场景 → 组合 token

| 场景 | 直接赋值 |
| --- | --- |
| 面板 / 店卡入场 | `animation: var(--anim-pop-in)`（列表配 stagger） |
| 弹窗 sheet 升起 | `animation: var(--anim-slide-up)` |
| 刮刮乐揭晓 | `animation: var(--anim-scratch)` |
| 出餐 +N 飘字 | `animation: var(--anim-coin)` |
| 点错反馈 | `animation: var(--anim-shake)` |
| 待领取呼吸 / 稀有星光 / 金光扫过 | `--anim-pulse` / `--anim-sparkle` / `--anim-shine` |
| 按钮按压 / hover / 变色 | `transition: var(--transition-press / hover / color)` |

`prefers-reduced-motion: reduce` 时全部时长压到 1ms、四个氛围循环动画置 `none`（已在 motion.css 内实现，业务侧无需处理）。

---

## 9. 组件规格与状态

### 9.1 按钮（`.btn` 系）

| 态 | Primary（玫瑰） | Gold（香槟金） | Ghost（白底） |
| --- | --- | --- | --- |
| Default | `--btn-primary-bg` + `--btn-primary-shadow`，白字加 `--btn-primary-text-shadow` | `--btn-gold-bg` + `--btn-gold-shadow`，ink-900 字 | `--btn-ghost-bg` + `--btn-ghost-border`，无投影 |
| Hover(指针设备) | translateY(-1px)，阴影升档 | 同左 + 可加 `--anim-shine` | 边框转 `--line-strong`，底转 cream-100 |
| Active/按压 | `--btn-primary-bg-press` + `--btn-primary-shadow-press`，scale(0.97)，`--transition-press` | 渐变深端加重，scale(0.97) | 底转 cream-200 |
| Focus-visible | 原样式 + `--ring-focus` | 同左 | 同左 |
| Disabled | `--btn-disabled-bg` + `--btn-disabled-text`，无投影无形变，`cursor: not-allowed` | 同左 | 同左 |
| Loading | 文字降透明 0.6 + 内置 spinner（用 `--dur-ambient` 旋转） | 同左 | 同左 |

尺寸：高度 ≥ 44px，`--btn-pad-y/x` 10/16，圆角 `--btn-radius` 14px，字号 md 15px / 600。

### 9.2 店卡（`.shop-card`）

- Default：`--card-bg` + `--card-shadow` + 圆角 `--card-radius` 18px，业态色徽标。
- Hover：translateY(-3px) scale(1.02)（现有），阴影升到 `--shadow-3`。
- Active：scale(0.98)。
- Locked：`grayscale(0.7) opacity(0.7)`（现有）+ 左上角锁徽标 + 点击 `--anim-shake`；locked 卡不做 hover 上浮。
- 新解锁：入场 `--anim-pop-in` + `--anim-sparkle` 星光一次。

### 9.3 底部导航（`.nav`）

- 容器 `--nav-bg` + blur + `--shadow-3` + `--glass-highlight`，圆角 `--nav-radius` 20px。
- 项：默认 `--nav-text` ink-500 / 11px；选中 `--nav-active-bg` 渐变底 + ink-900 / 700 字重；切换过渡 `--dur-base`。
- 有红点事务（可领取）时项内徽标用 `--danger` + `--anim-pulse`。
- 触控高度补到 ≥ 44px。

### 9.4 订单 chip（`.chip`）

Todo：白底 + `--chip-border` 虚线；Done：`--chip-done-bg` 薄荷底 + 实线 `--chip-done-border` + 勾选瞬间 scale 弹一下（`--dur-instant`）。

### 9.5 进度条（`.progress`）

轨道 `--progress-track`，填充 `--progress-fill`（玫瑰→金），高度 `--progress-height` 8px，宽度变化过渡 `--dur-slow`；满格瞬间填充叠加 `--anim-shine` 一次。

### 9.6 弹窗（`.modal`）

遮罩 `--modal-scrim` 淡入 `--dur-fast`；sheet `--surface-sheet` + `--modal-sheet-radius` 24 + `--shadow-4`，入场 `--anim-slide-up`。390 宽度 `min(380px, 100%)`；1280 见 §10。

### 9.7 Toast / HUD pill

Toast：`--toast-bg` 墨莓底 + `--toast-text` 奶油字，13px，入场 `--anim-pop-in`，z `--z-toast`。
HUD pill：`--hud-pill-bg` + `--hud-pill-shadow`，12px/600 + tabular-nums，数值变更时 `--anim-coin` 飘字副本。

---

## 10. 布局规范

断点：**390**（设计基准，320–743 通用）→ **744** 平板过渡 → **960**（现 main.css 已有）→ **1280** 桌面完整版。

### 10.1 移动 390（单列流）

- 容器 `max-width: 430px` 居中，左右安全边距 12px，底部 `padding-bottom: var(--safe-bottom)` 88px 让位悬浮导航；支持 `env(safe-area-inset-bottom)` 叠加。
- 结构自上而下：顶栏 pill（sticky 视觉，玻璃强档）→ toast 插槽 → hero（xl 圆角）→ 内容面板流（间距 12）。
- `mall-grid` 2 列，gap 12（升级：现 10 → 12 对齐 4pt）；店卡最小高 118px。
- 流水线 `.line` 4 列等分，键高 ≥ 56px（拇指热区）。
- 底部导航 fixed，宽 `min(406px, 100% - 24px)`，5 等分。
- 弹窗从底部感升起（slide-up），sheet 最大 380px。

### 10.2 桌面 1280（双栏工作台）

- 容器 1200px 居中（960–1279 沿用现有 980px 单列，此档为过渡）。
- 双栏：主内容 `minmax(0, 1fr)` + 右侧固定 336px 侧栏；栏距 24。
- 侧栏常驻：HUD 资源卡、当前订单 / 目标、伙伴速览——移动端要下滑找的信息在桌面常驻右侧。
- `mall-grid` 4 列；hero 高度压缩为横幅（文案与按钮左右分布）。
- 导航移出 fixed：转为顶栏内水平页签（现 960 断点已 `position: static`，1280 延续并右对齐到顶栏）。
- 弹窗 sheet 放宽到 440px，遮罩不变；hover 态在桌面全量启用（移动端不依赖 hover）。
- 字号升级：H1 取 `--text-2xl`，Display 取 `--text-3xl`，导航标签取 `--text-xs`，其余不变。

---

## 11. Round 2 对 `main.css` 的改造清单（完成状态复核）

> Round 2 / Fable-2 复核：以下状态逐项对照已 token 化的 `main.css` 核实。✅ 已完成 · ◐ 部分完成。

| # | 事项 | 状态 | 核实说明 |
| --- | --- | --- | --- |
| 1 | `index.html` 引入 `motion.css` | ✅ | 已按 tokens → motion → main 顺序引入 |
| 2 | 硬编码值全量替换为 token | ✅ | body → `--grad-page`、hero → `--grad-hero`、`.btn` → `--btn-primary-*`、导航选中 → `--nav-active-bg`（渐变底经 `::before` 透明度过渡）、`.chip` / `.progress` / `.modal` / `.toast` / `.pill` 全部接入；`rgba(58,36,51,…)` / `#f0d4de` / `#e4b8c6` 等裸值已从 main.css 清零。唯一新增字面值 `--doll-skin: #ffd8c4` 位于 main.css §0「组件 token 缺口补丁」，属 token 层定义，合规（后续应并入 tokens.css） |
| 3 | 按 §9 补组件态 | ◐ | 已做：按钮 press（`--btn-primary-bg-press` + 阴影收紧 + translateY(1px) scale(0.97)）、disabled、focus-visible（全局焦点环 + 各组件叠加）、chip 勾选弹跳（`fm-chip-check`）。仍缺：按钮 loading 态、locked 店卡点击 `--anim-shake`（`mallView.js` 现仅 toast 提示）、新解锁 `--anim-sparkle`、进度条满格 `--anim-shine`、导航红点 `--danger` + `--anim-pulse`（导航尚无红点元素） |
| 4 | 触控修复 ≥ 44px | ✅ | 导航项 `min-height: var(--tap-target)`；流水线键 56px（`--line-key-height`）；`.choices` 与面板注入按钮也已拉齐 |
| 5 | 1280 布局升级（§10） | ◐ | 已做：容器 1200px、`mall-grid` 4 列、gap 10 → 12（`--space-3`）、导航标签升 `--text-xs`、弹窗 sheet 放宽 440px、H1 升 `--text-2xl`。仍缺：**双栏工作台未做**——无 `minmax(0, 1fr)` + 336px 侧栏栅格，侧栏常驻内容（HUD 资源卡 / 当前订单目标 / 伙伴速览）均无；导航仅 static + 右对齐，未真正并入顶栏（DOM 中 nav 仍在页面底部）；hero 未压缩为左右分布横幅；Display 未升 `--text-3xl` |
| 6 | 入场动效接线 | ✅ | hero / panel / 店卡 / toast 均挂 `--anim-pop-in`，店卡以 `:nth-child` 接 `--stagger-step`；弹窗 `--anim-slide-up` + 遮罩 `fm-scrim-in` 淡入；出餐/收益飘字已由 `minigames/ui.js` 的 `.mg-float`（`animation: var(--anim-coin)`）与 `floatText()` 完成 JS 挂类名；`prefers-reduced-motion` 在 motion.css 与 main.css 双层兜底 |
| 7 | 删 legacy 别名 + 关键帧收编 | ◐ | 已做：main.css 旧 `@keyframes pop / fall` 已收编为 `fm-*`（`fall` → `fm-item-fall`，`pop` 由 motion.css `fm-pop-in` 取代），main.css 自身已零 legacy 引用。仍缺：tokens.css 第 10 段 legacy 别名暂不能删——JS 注入样式（`fashion` / `research` / `events` / `home` / `partners` 各自 `styles.js`，及 `mallView.js`、`app.js` 内联样式）仍引用 `--rose-deep` / `--gold` / `--ink-soft` / `--radius` / `--shadow` / `--ease` 等约 88 处 |

### 11.1 仍缺事项（移交下一轮）

按影响排序：

1. **1280 双栏工作台**（§10.2）：主内容 `minmax(0, 1fr)` + 右侧固定 336px 常驻侧栏（HUD 资源卡 / 当前订单目标 / 伙伴速览），栏距 24；hero 压缩为横幅（文案与按钮左右分布）；导航真正并入顶栏。涉及 main.css 栅格与 `app.js` 骨架结构调整。
2. **组件态补完**（§9）：按钮 loading、locked 店卡点击 shake、新解锁 sparkle、进度条满格 shine、导航红点 pulse——后四项均需 JS 挂类名配合。
3. **legacy 别名退役**（§1）：先把 JS 注入样式的 legacy 引用迁到语义 / 组件层，再删 tokens.css 第 10 段；顺带清理 `app.js` / `mallView.js` 内联样式里的裸值（`#f0d4de`、`#fff` 等），并把 main.css §0 缺口补丁并入 tokens.css。
4. **1280 Display 字号**：结算 / 大数值处升 `--text-3xl`（相关样式散落在小游戏注入样式中，随第 3 条迁移时一并处理）。

### 11.2 取证证据链接（Round 3 / F2，对应量规 C5 / C6 / D4）

本设计系统涉及的三项实测取证已留档 `docs/EVIDENCE.md`，与 §11 状态表相关的结论：

| 取证项 | 证据 | 与本文的关联 |
| --- | --- | --- |
| 内存 / DOM 节点（C5） | EVIDENCE §1：主商场挂机 30 分钟、121 采样点，挂载节点 93→94 零增长，四次事件弹窗循环无累积滞留（首次事件后一处有界单代滞留已单列待查） | 印证 §8 动效挂类名 + 自删（飘字/星光）不留节点残渣 |
| 帧率（C6） | EVIDENCE §2：主界面 60.0fps、生鲜局内满负载 60.0fps，零掉帧（软渲容器保守下界） | 印证 §5/§8 毛玻璃 + 动效组合在移动基准视口内无帧预算压力 |
| 对比度 AA（D4） | EVIDENCE §3：token 全表核算 + axe 六视图审计（1 违例） | §2.3 两处承诺值修正（见上方注记）；axe 唯一违例 `.fm-room-badge` 恰为 §11 项 7 legacy 别名（`--rose-deep` 当文字色）待迁清单内，修法见 EVIDENCE §3.4-3 |

---

## 12. 暂不覆盖

- 深色模式：女性向暖色玻璃风在深色下需要整套重调，V1 不做，token 分层已为未来留位。
- 自定义字体（如圆体 webfont）：为保加载性能与离线可用，V1 用系统栈。
