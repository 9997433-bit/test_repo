# 美术方向 · 水墨令牌系统（Round 1 定稿）

> **北极星**：一张摊开在案上的《长坂坡战图》。任意一屏截图应像「印出来的棋谱」，而不是「网页表单」。
> 全部视觉只允许四种材质：**纸、墨、朱砂、泥金**。单位就是汉字本身。

## 1. 材质世界观

| 材质 | 职责 | 禁则 |
| --- | --- | --- |
| 纸（宣纸） | 舞台。所有底色、卡面、面板都是纸的某一阶 | 不出现纯白 `#fff` |
| 墨（焦浓淡宿） | 角色。文字、边框、按钮、阴影全部是墨 | 不出现纯黑 `#000` |
| 朱砂（印泥） | 系统之手。印章、警示、交互焦点、伤害反馈 | 不用于大面积填充 |
| 金（泥金） | 只留给武将与胜利 | 出现频率最低，物以稀为贵 |

其余禁则沿袭基线：Emoji 不做主视觉；无照片级贴图；无外链图片资源。

## 2. 设计令牌

`src/styles/tokens.css` 是唯一事实源；组件层禁止出现裸色值 / 裸阴影 / 裸缓动。摘录：

| 组 | 令牌 | 值 | 用途 |
| --- | --- | --- | --- |
| 纸 | `--paper-bright / --paper / --paper-deep / --paper-shadow` | `#fbf5e6 / #f3ead6 / #e6d7b8 / #d8c59d` | 受光卡面 / 基准（= theme-color，勿改）/ 陈化 / 折痕 |
| 墨 | `--ink-strong / --ink / --ink-soft / --ink-faint` | `#16110b / #211a12 / #4a4033 / #8b8071` | 焦墨标题 / 浓墨正文 / 淡墨次级 / 宿墨提示 |
| 朱砂 | `--cinnabar-bright / --cinnabar / --cinnabar-deep` | `#d2503c / #b23a2f / #8c281f` | 印面高光 / 基准 / 边缘吃墨 |
| 金 | `--gold-bright / --gold / --gold-ink` | `#e8c56f / #c9a24a / #9a7524` | 辉光 / 装饰线 / 纸上可读金字 |
| 品阶 | `--tier-1…5` | `#6e6455 / #2f7d54 / #31619c / #6d3d91 / #b4560f` | 白 / 石绿 / 青花 / 紫棠 / 赭火（矿物颜料系，非荧光游戏色） |
| 阵营 | `--ai-steel` | `#5a6d7a` | 敌方半区青灰罩染 |

每个品阶配三件套：`--tier-N`（字色）、`--tier-N-line`（描边）、`--tier-N-wash`（底晕），一枚棋子的品阶由**字色 + 描边 + 底部批条**三处同时表达，色弱玩家仍可靠批条位置与描边深浅辨识。

辅助令牌：`--radius-cut`（四角略歪的手裁圆角）、`--shadow-flat/card/raised/panel`（纸上的东西只会「叠」不会「浮」，阴影短而实）、`--ease-brush`（起笔快收笔缓）、`--ease-snap`（震颤/盖章）、RGB 三元组（`--ink-rgb` 等，供 alpha 合成）。

## 3. 纸张质感配方（零图片，内联 SVG < 2 KB）

自下而上：

1. **布光**：`body` 四层渐变 —— 顶部天光、左右下角陈化暗斑、纵向微吃色。
2. **细颗粒** `--tex-grain`：`feTurbulence fractalNoise 0.9/3oct` 经 `feColorMatrix` 阈值化成稀疏墨点（不是均匀灰噪）。
3. **帘纹** `--tex-fiber`：`baseFrequency 0.006 0.16` 的各向异性噪声，阈值化后成横向长纤维，即宣纸抄纸痕。
4. **晕边**：`body::after` 径向渐变，四角吃墨至 `rgba(ink,.12)`。

关键决策：**颗粒与帘纹压在一切内容之上**（`z-index: var(--z-texture)`，`pointer-events: none`），覆层与面板也在其下 —— 卡、格、飘字、结算页共享同一张纸，消除「网页贴片感」。

另有 `--tex-grain-light`（纸色斑驳，专用于印章漏白）与 `--tex-hills`（`feGaussianBlur` 晕染的远山两叠，行军道背景）。

## 4. 组件规范

- **印章**（`.seal`、`.panel::after`）：朱砂底纸色字（阴文），四角略歪的印面圆角，`inset` 阴影做边缘吃墨，`--tex-grain-light` 盖在字上做「印泥没铺匀」的漏白，微旋转。面板右上角另钤一枚「斗」字小印作落款。
- **HUD**（`.hud`）：三块小牌匾分立（波次·时辰 / 馒头·征兵 / 斩获），数字 `tabular-nums` 防 30Hz 刷新跳宽，关键数值朱砂加大。提示条 `.toast` 是一条「朱批」，前缀斜切短横。
- **半区**（`.half`）：我方内衬金线（主场），敌方罩染青灰 `--ai-steel`（山雨欲来）；敌我不靠文案也能一眼区分。
- **阿斗**（`.adou`）：斗字背后一圈泥金晕（`::before` 光环，敌方为青灰晕），标签与红心竖排成小签。
- **行军道**（`.lane`）：容器背景 = 顶部晨雾渐变 + 底部远山两叠；canvas 透明，山影从画布后透出。canvas 内部画风归 JS（见 §9）。
- **棋盘**（`.grid`/`.cell`）：阵图底（淡墨衬 + 内描线），格子是手裁纸片；锁格为麻绳纹封条、「锁」字隐约可见（提示铲子目标，替代原先的纯透明）；落点 `.drop` 朱砂框脉动。
- **手牌**（`.card`）：受光小纸片，短实阴影；选中态抬起 6px 微旋并压朱砂框；空槽是虚线纸位。
- **按钮**：`button.ink` 是一块墨锭（焦墨渐变 + 压边 + `:active` 按下触感）；`#btn-recruit` 竖排 `writing-mode: vertical-rl`，像一枚长条闲章立在兵营旁。
- **覆层**（`.overlay`/`.panel`）：册页装裱 —— 焦墨外框 → 纸衬 5px → 墨线 → 金丝内缘（`inset box-shadow` 四层），下方短实投影；覆层墨色渐暗 + 2px `backdrop-filter`（有 `@supports` 兜底）。

## 5. 动效契约（纯 CSS，`src/styles/motion.css`）

> **冻结容错铁律**：所有关键帧把最强帧放在 0%（震颤首帧就有位移和朱砂边闪、合并首帧就是放大金闪、英雄光环 0% 即满辉）。设计初衷是抵御旧渲染层的 30Hz 全量重建（动画每帧被重置回 0%，只剩首帧）；本轮并行 R1 已把 `main.js` 改为同构 diff（`morphChildren`），DOM 身份稳定、动画可播全程 —— 该铁律保留为防回归的兜底。

| class | 语义 | 触发方 | 时长 | 现状 |
| --- | --- | --- | --- | --- |
| `.shake`（挂 `.half` 上） | 阿斗受创：半区震颤 + 朱砂内边闪 | `main.js` leak 事件 | 360ms | **已接线** |
| `.cell.drop` | 候选落点：朱砂框脉动 | `main.js` decorate（hover） | 0.9s 循环 | **已接线** |
| `.cell.selected` | 合并起手源格：常亮朱砂 + 微抬（`.drop.selected` 时停用脉动，与候选落点区分） | `main.js` decorate（selectedCell） | 静态 | **已接线** |
| `.cell.hero::before` 等 | 武将辉光呼吸 | 自动（class 即生效） | 2.4s 循环 | 生效 |
| `.overlay` / `.panel` | 覆层入场（起点不透明度 ≥0.85） | 自动 | ≈300ms | 生效 |
| `.fx-merge`（挂合并格） | 合并升阶：放大金闪 + 朱砂涟漪扩散 | 渲染层 merge 事件，≈480ms 后移除 | 480ms | 待 JS 接线 |
| `.fx-awaken`（挂武将格） | 觉醒：金/朱双环冲击波，落笔定身 | 渲染层 hero-awaken 事件，≈700ms 后移除 | 700ms | 待 JS 接线 |
| `.fx-float` | 伤害/馒头飘字（纸色描边保可读） | 渲染层创建元素 | 800ms | 待 JS 接线 |

属性白名单：`transform` / `opacity`，以及**小面积、短时长**的 `box-shadow` / `text-shadow`；禁止动画 `filter` / `width` / `top`。`prefers-reduced-motion: reduce` 时全部动效退化为静态终帧。

**注意**：diff 渲染层的 `syncAttrs` 会回写 `class`，JS 侧临时挂的 `.fx-*` 只在两次 patch 之间存活；接线时应在渲染输出里带上该 class（按事件 + 时间戳），而不是事后往真实 DOM 上贴。

## 6. 可读性与无障碍

- 纸底 `#f3ead6` 上的对比度（WCAG，棋子字号 ≥26px 按大字判定）：墨 ≈14:1，朱砂 ≈5.0:1，品阶 1–5 ≈4.9 / 4.2 / 5.3 / 6.4 / 4.1:1，金字 `--gold-ink` ≈3.6:1（另有金辉光加持）—— 全部 ≥3:1 大字达标。
- 品阶三重编码（字色/描边/批条），不单靠颜色。
- 触控：`touch-action: manipulation` 灭双击缩放延迟；格子与卡在 320px 屏上 ≥55px；`env(safe-area-inset-bottom)` 留出全面屏底条。
- 悬停效果仅 `(hover: hover) and (pointer: fine)` 下启用，触屏无粘滞悬停。

## 7. 性能预算

- 新增资源：4 枚内联 SVG 纹理合计 <2KB，无网络请求、无位图。
- 全局纹理为 `position: fixed` 静态层，无动画，合成一次。
- `backdrop-filter` 仅覆层使用且模糊半径 2px；动画不碰 `filter`。
- 真正的帧率瓶颈是渲染层 30Hz innerHTML 重建（`ARCHITECTURE.md` §10），非样式层。

## 8. 文件结构与级联顺序

```
src/styles/
  ink.css      入口，只做 @import（Vite 内联合并）
  tokens.css   设计令牌（唯一事实源）
  base.css     宣纸舞台、全局肌理、题字与印章
  hud.css      牌匾计分条 + 朱批
  board.css    半区 / 阿斗 / 行军道 / 阵图棋盘
  cards.css    兵营手牌 + 按钮
  pieces.css   棋子品阶着色（cell 与 card 共用，须在两者之后）
  overlay.css  册页面板与覆层
  motion.css   全部关键帧（冻结容错设计）
```

## 9. 边界与遗留缺口（移交 R2+）

**与渲染层的分工**：`src/styles/**` 拥有 `.cell / .card / .hud / .half / .overlay` 等骨架元件与全部关键帧；渲染层在 `render.js` 内注入 `zy-*` 前缀的微元件样式（品阶点、卡面标签、教程条），只允许引用 tokens.css 变量、不得覆写骨架元件 —— 当前双方已按此运行（`zy-pips` 主动避开了批条区）。

1. **`.fx-merge` / `.fx-awaken` / `.fx-float` 无人触发**：渲染层尚未在 merge / hero-awaken / kill 事件上输出 class 或飘字元素；注意 §5 的 diff-回写陷阱。
2. **行军道 canvas 内部画风**归 `ui/lane.js`（JS 域）：敌军应为墨团拖尾、路径加飞白、血条改朱砂短批；本轮只重做了容器（远山 + 晨雾）。
3. **字体 CDN 依赖**（P3）：`Ma Shan Zheng` 全量约数 MB，实际用字 <100 个，建议子集化自托管（预估 <30KB woff2），同时消除首屏 FOUT。
4. **红心是纯文本串**（`♥♥♡`），无法逐颗做丢心动画；建议渲染层拆成逐颗 `<span>` 后再加 CSS。
5. **技能「泼墨」全屏特效**需要一个稳定 DOM 层（建议 `#app` 旁挂 `#fx-layer`，diff 不触碰），CSS 侧待该容器落地后补规范。
6. 胜负结算页可加「盖章」仪式感（成功盖金印 / 失败盖墨印），依赖结算 DOM 提供可挂点。
7. （跨域观察，非美术）`sfx.unlock()` 里 `new AudioContext()` 无 try/catch，音频初始化异常会连带吞掉 `api.start()`；建议 JS 侧包一层。
