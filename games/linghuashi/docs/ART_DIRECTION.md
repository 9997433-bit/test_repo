# 灵画师 · 美术方向（Art Direction）

> 一句话：**深色绢案上摊开一幅会动的立轴** —— 宣纸为地、焦墨为骨、朱砂为魂、石青石绿为饰、泥金髹漆为框。
> 禁忌：霓虹赛博、扁平 Material、无衬线大标题、纯黑 `#000` 与纯白 `#fff`。

## 0. 文件与职责

| 文件 | 职责 |
| --- | --- |
| `src/styles/tokens.css` | 唯一色源与全部设计令牌（色、纹、影、字、动效、焦点） |
| `src/styles/ink.css` | 皮肤：绢案背景、立轴卷面、按钮 / 卡片 / 印章 / 进度条 / 画心装裱、动效 |
| `src/styles/layout.css` | 构图：立轴居中、天地杆响应式、各屏栅格与断点 |
| `src/ui/ui.css`（他组维护） | 部件层皮肤，按打包顺序在 styles/ 三件之后加载，保留覆盖权 |

**兼容承诺**：以下令牌名被 `ui/ui.css` 与 `drawing/canvas.js` 依赖，只增不删、色相不漂移：
`--ink --ink-soft --paper --paper-deep --seal --seal-bright --gold --cyan --malachite --mist --shadow --serif --script`。
画布在 JS 里自绘宣纸底（`#efe3c8 → #eaddbe → #e4d3ae`）与焦墨 `#1a120b`，纸色一族必须与其同源。

## 1. 舞台隐喻（三层材质）

1. **绢案（body）**：旧绢织纹 + 四角矿彩雾气 + 底部远山三重晕染（`body::before`）。永远比卷面深一档，让立轴"浮"起来。
2. **立轴（.screen）**：宣纸渐变（受光亮 → 本色 → 纸脚陈色）叠横向帘纹与极淡朱丝栏；上下各一根髹漆**天杆 / 地杆**（`::before/::after`，两端泥金）。切屏时自上而下**揭卷**（`sheet-unroll`）。
3. **裱件（.card / canvas.paper）**：卡片是托纸 + 白折光 + 发丝界框；画心用 7px 绫边（`--silk`）+ 1px 墨线圈裱，box-shadow 实现、零 DOM 改动。
4. **纸膜（body::after）**：全屏 6% 不透明度的 SVG 颗粒 multiply 罩层（含弹层之上），统一所有材质的"纸感"。

## 2. 色彩体系

### 墨分五色（文字与线）
| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--ink` | `#1a120b` | 焦墨：正文、笔迹（与画布 JS 同值） |
| `--ink-soft` | `#3b2a18` | 浓墨：kicker、卡内小题 |
| `--ink-mute` | `#5a4933` | 重墨：`.muted` 辅助说明（对宣纸 ≥5:1） |
| `--ink-faint / -line / -hair / -wash` | 透明度阶 | 装饰笔触 / 界线 / 发丝线 / 清墨晕 |

### 纸与装裱
`--paper #efe3c8`（画心本色）、`--paper-bright #f7eeda`（受光）、`--paper-deep #e4d3ae`（纸脚）；
`--silk #dcc7a0`（裱边绫）、`--silk-deep #c9af7f`（案面）、`--lacquer #241a12` + `--gilt #d9b954`（漆杆泥金）。

### 矿彩（点睛，不铺陈）
| 令牌 | 值 | 语义 |
| --- | --- | --- |
| `--seal` | `#7a1818` | 朱砂：印章、HP、警示、选中、焦点相关 |
| `--seal-bright` | `#b42323` | 朱磦：暴击、连击、焦点环 |
| `--cyan` | `#2f5b74` | 石青：灵气、控制、反应 |
| `--malachite` | `#3d6b4f` | 石绿：治疗、增益、已通关 |
| `--gold` | `#c9a227` | 藤黄金粉：护盾、挂机横幅、杆端 |

**用色纪律**：矿彩只做小面积语义色（≤ 版面 10%）；大面积永远是纸与墨。

## 3. 字体与文字

- 标题 `--script`：Ma Shan Zheng 手书（`.brand` 加墨色渐变 `background-clip: text`，`@supports` 兜底为实色焦墨）。
- 正文 `--serif`：Noto Serif SC。
- kicker（`.sub`）：0.42em 疏排，浓墨不透明（不再用 opacity 降对比）。
- 卡内小题（`.card h3`）：0.24em 疏排 + 发丝底线 + 34px 朱丝栏短杠。

## 4. 材质与纹理（全部内联 SVG / 渐变，零资源请求）

- `--grain`：feTurbulence 细颗粒，仅经全局纸膜一层使用。
- `--laid`：24px 周期横向帘纹（抄纸竹帘水痕）。
- `--columns`：57px 周期极淡朱丝栏直栏。
- 绢织纹：body 上两组交叉 repeating-linear-gradient。

## 5. 动效三式（皆守 `prefers-reduced-motion: reduce`）

| 动效 | 实现 | 时长 / 缓动 |
| --- | --- | --- |
| **卷轴展开** | `.screen` 切屏 `sheet-unroll`：clip-path 自上而下揭开 + 14px 上移淡入 | `--dur-slow 520ms` / `--ease-brush` |
| **印章落下** | `.stamp` `stamp-drop`：2 倍高空压下、微回弹钤稳 | 460ms / `--ease-drop`（回弹） |
| **墨晕扩散** | 按钮 hover 内阴影 `--seal-wash` 洇开 + 1px 上浮；墨条 `width` 以 `--ease-brush` 收笔 | `--dur-fast/mid` |

reduce 时：两支 keyframes 关停、按钮/墨条 transition 与位移全撤（画布回显淡出由 JS 自行判断 media）。

## 6. 部件规范

- **按钮**：手裁纸签（四角微不对称圆角 `2px 6px 3px 5px / …`），hover 只动边、字、影，**不改 background-color**，把底色覆盖权留给 `ui.css` 的 `.primary` / `.toggle`。
- **进度条 `.bar`**：10px 圆头墨条，三向渐变（HP 朱砂、灵气石青、护盾藤黄），上亮下沉的釉面内影。
- **战斗手账 `.log`**：顶部 16px mask 渐隐 + 细滚动条。
- **画心 `canvas.paper`**：`0 0 0 7px --silk` 绫边 + 1px 墨线 + 投影；四周留 10px margin 防裱边溢出。
- **朱砂印 `.stamp`**：双线印框（border + inset shadow）、印泥薄晕底、-8° 钤斜；卷首/结算放大至 64px。
- **选中态**：`.class-card.active` 朱框 + 洇红内影 + 右上角一方 16px 装饰小印（空 content，状态语义由 `aria-checked` 承担）。
- **竖题 `.vtitle`**：仿引首章 —— 竖排手书、细朱框、印泥底；≤720px 隐藏。

## 7. 构图与响应式

- 立轴宽 ≤1140px；≥960px 视口时留 30px 天地与 ≥38px 案面边距，天地杆左右各出头 16px。
- ≤959px：卷面铺满，天地杆内收 12px 防横向滚动（body 已 `overflow-x: clip` 兜底）。
- 枢纽 840px、对战 920px、竖题/画布高度 720px 三档断点；对战侧栏桌面端 `sticky`。
- 栅格轨道一律 `minmax(0, …)` 防长文本撑破。

## 8. 可访问性红线

- 焦点：全站 `:focus-visible` 朱磦 3px 环 + 2px offset（`ink.css` 兜底，`ui.css` 精调），绫边画布上焦点环压在裱边上依然可见。
- 对比：正文焦墨 ≈13:1；`.muted` 重墨 ≥5:1；石青/朱砂小字 ≥4.5:1。`prefers-contrast: more` 时界线加深、辅助字回浓墨。
- `color-scheme: light` 显式声明；纸膜 `pointer-events: none` 永不挡交互。
- 动效全部可关（见 §5）；装饰性 pseudo 一律空 content。

## 9. 已知缺口 / 后续愿望

- 暗色"夜读"主题未做：`ui.css` 存在硬编码纸色（如 `rgba(255,250,240,.55)`、`#fdf7ea`），需先令牌化才能翻色。
- `cast-flash`（ui.css）终帧硬编码旧按钮底色，与新底色有一帧极轻微色差；待 ui 组改为 `var()`。
- 墨迹飞白 / 印章金石残边（mask 撕边）未做，需引入更重的 SVG mask，性价比待议。
- Google Fonts 离线时手书标题回退 Noto Serif SC，卷首气质略折损；可考虑本地子集化字体。
