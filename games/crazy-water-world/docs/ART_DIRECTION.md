# 美术与 UX 方向 · 夏日废海卡通（Round 1 落地版）

> 陆地没了，但防晒霜还在。末世但不丧，幽默 > 悲壮，UI 永远叫玩家「老大」。

## 0. 文件地图（谁该改哪）

| 文件 | 职责 | 改动纪律 |
| --- | --- | --- |
| `src/styles/tokens.css` | 全部 CSS 变量、字体、基础重置、`data-*` 钩子 | 加变量可以，改色值先过本文档色板 |
| `src/styles/layout.css` | 结构：网格 / 定位 / 尺寸 / 断点；顶部 `@import` 引入其余三层 | 不许写颜色和质感 |
| `src/styles/sea.css` | 皮肤：木板、遮阳棚、贴纸卡、按钮、鱼漂滑杆 | 装饰一律走伪元素，不碰点击目标 |
| `src/styles/motion.css` | 全部 `@keyframes` / `transition` / `@property` | 新动画必须过第 6 节预算 |
| `src/styles/a11y.css` | 焦点环、触控热区、色盲图案、对比 / 强制色彩偏好 | 覆盖顺序在 sea/motion 之后，别挪 |

级联顺序（Vite 内联后）：`tokens → sea → motion → a11y → layout 自身规则`。

## 1. 气质三军规

1. **末世但不丧**：残骸是玩具箱不是坟场。旧木板晒得发白也要配阳光黄描边。
2. **一切皆贴纸**：圆角 ≥10px、2–3px 墨线描边（`--ink`）、硬投影（`0 3px 0`）不用模糊投影表达「按得动」。
3. **歪一点才对**：遮阳棚歪 0.5°、启航卡歪 0.6°、救生圈斜 14°。手作感靠微小旋转，不靠噪点贴图。

母题词库：阳光、泡沫、旧木板、救生圈、歪遮阳棚、绳结、鱼漂、褪色救生衣。

## 2. 色板

### 2.1 基色（tokens.css 为唯一事实源）

| token | hex | 用途 |
| --- | --- | --- |
| `--sea-deep` | `#063544` | 深海、页面底色、夜 |
| `--sea` | `#0e7c8a` | 主海面、标题字 |
| `--sea-mid` | `#0b6b78` | 海色按钮底（白字对比 ≈5.7:1） |
| `--sea-foam` | `#d8f6f4` | 浪花、泡沫 |
| `--sea-glint` | `#9adcf0` | 高光水面、滑杆亮端 |
| `--wood` / `--wood-light` / `--wood-dark` | `#c9843a` / `#e0a35e` / `#7a4a1e` | 木筏、甲板、木纹缝 |
| `--rope` | `#d4b483` | 绳索、手账边线 |
| `--sand` / `--paper` | `#fff7e8` / `#fffdf6` | 卡片底、纸面 |
| `--sun` / `--sun-deep` | `#ffd166` / `#f4a259` | 主行动按钮、高亮、选中 |
| `--coral` | `#ff6b6b` | 危险、生命、出战 |
| `--kelp` / `--kelp-deep` | `#3dcc8a` / `#1f9e64` | 安全、食物、饱食条 |
| `--buoy` | `#ef476f` | 救生圈红、鱼漂红、遮阳棚条纹 |
| `--ink` / `--ink-soft` | `#16323c` / `#3f5a64` | 标题正文 / 次要文字 |
| `--card` | `#fff7e8f0` | 半透明面板 |

### 2.2 对比度检查表（新组合先查这里）

| 前景 × 背景 | 对比 | 结论 |
| --- | --- | --- |
| `--ink` × `--sand` | ≈12:1 | 正文随便用 |
| `--ink-soft` × `--sand` | ≈6.5:1 | 次要文字 OK |
| `#fff` × `--sea-mid` | ≈5.7:1 | 海色按钮白字 OK |
| `--ink` × `--sun` | ≈9:1 | 阳光按钮墨字 OK |
| `--ink` × `--coral` | ≈4.7:1 | 出战按钮墨字压线过 AA，别再调浅 |
| `#fff` × `--coral` | ≈2.9:1 | **禁止**：珊瑚底白字 |

### 2.3 用色守则

- 危险只用 `--coral`/`--buoy`，安全只用 `--kelp`，货币奖励只用 `--sun` 系——语义色不许串岗。
- 资源色全部使用 `--res-*`（16 个，与 `src/data/resources.js` 的 `RESOURCE_META` 逐项同步），画布浮标、后轮仓库图例都从这里取。
- 大面积深色只允许海与夜空；面板永远是奶油色系，避免「丧」。

## 3. 字体与标题层次

- 展示体：`--font-display`（ZCOOL KuaiLe）。**只有 400 字重**，禁止加 `font-weight: 700`（浏览器伪加粗会糊），tokens.css 已强设 400。
- 正文：`--font-body`（Noto Sans SC 400/600/700/900）。
- 数字一律 `font-variant-numeric: tabular-nums`（资源数、倒计时不跳宽）。

| 层级 | 字体 / 字号 | 用法 |
| --- | --- | --- |
| Hero | display / `--fs-hero`（44–84px clamp） | 仅标题页 h1，配 `--sun` 3px 硬投影 |
| 栏题 | display / `--fs-h2` 20px | 面板 h2，波浪下划线（`--sun-deep`，offset 6px） |
| 正文 | body 400 / `--fs-body` 14px，行高 1.55 | 面板说明 |
| 小字 | body 600 / `--fs-small` 12px | 状态条、手账 |
| 标签 | body 600 / `--fs-tiny` 11px | 仓库格资源名 |

## 4. 昼夜 / 天气天空

天空 = 双色纵向渐变，token 与 `src/data/weather.js` 逐项同步：

| 天气 | `--sky-*-hi` | `--sky-*-lo` | 情绪 |
| --- | --- | --- | --- |
| clear 晴 | `#7ec8e3` | `#0e7c8a` | 默认，度假感 |
| haze 雾 | `#9bb7c4` | `#3d6d78` | 灰蓝，慵懒 |
| rain 雨 | `#4a6270` | `#16323c` | 压低饱和不压亮度到底 |
| storm 风暴 | `#1b2a33` | `#06151b` | 唯一允许的近黑 |
| tsunami 海啸 | `#14243a` | `#3a1020` | 底部渗一点血红预警 |

接线方式（后轮 UI 只需两行 JS）：

- 在 `html` 或 `.shell` 上落 `data-weather="clear|haze|rain|storm|tsunami"`，`.sea-wrap` 背景即随 `--sky-hi/--sky-lo` 走 **1.2s**（`--dur-scene`）`@property` 颜色渐变；不支持 `@property` 的浏览器直接跳变，可接受。
- 昼夜落 `data-phase="day|dusk|night"`：CSS 夜幕 `.sea-wrap::after` 的 `--night-alpha` 取 0 / 0.14 / 0.3，同样 1.2s 淡入。
- **注意**：`canvas.js` 目前自己画夜幕（`dusk < -0.2` 时叠 28% 黑）。后轮接管 `data-phase` 后必须删掉画布那笔，否则双重变暗。
- 天气永远同时有文字标签（顶栏「晴 · 1x」已有），不许只靠天色传达。

## 5. 形状语言与母题实现

全部零资产、纯 CSS，画布轮可直接抄公式：

- **救生圈**：`conic-gradient` 四段红白 + `radial-gradient` 环形 mask（`.title-screen > div::before`）。
- **歪遮阳棚**：红白 `repeating-linear-gradient` + 半圆扇贝 mask（26px 周期）+ `rotate(-0.5deg)`（`.topbar::after`）。
- **旧木板**：奶油罩色 + 每 92–120px 一道 3px 深木缝的 `repeating-linear-gradient`（顶栏 / 船坞）。
- **绳缝**：`outline: 2px dashed` 内缩 7px（面板）。
- **鱼漂**：滑杆 thumb 上红下白对半（`input[type="range"]`）。
- **泡沫浪**：三排错尺寸 `radial-gradient` 半圆 repeat-x（标题页）。

## 6. 动效预算

| 层级 | 时长 token | 缓动 | 配额 |
| --- | --- | --- | --- |
| 触觉反馈（按压 / 悬停） | `--dur-tap` 90ms / `--dur-quick` 160ms | `--ease-out` | 不限，但只动 transform/filter/阴影档位 |
| 入场（面板 pop） | `--dur-pop` 240ms | `--ease-spring` | 每次界面切换 ≤1 个 |
| 场景（天空 / 夜幕） | `--dur-scene` 1200ms | ease | 天气切换各 1 个 |
| 环境循环 | 5–18s | ease-in-out / linear | **≤3 个且仅标题页**；游戏内环境动效全部交给画布 |

硬约束：

- 属性白名单：`transform`、`opacity`、`filter`、`background-position`、已注册颜色变量。禁动 width/height/top/left 与 box-shadow 模糊半径。
- 禁止 >3Hz 闪烁（癫痫风险），禁止整屏晃动。
- **当前实现限制**：`ui/app.js` 每帧重写 meters/panel/dock 的 `innerHTML`，这些子节点上放 keyframe 会每帧重启、`:active`/`transition` 会被打断。动画只放常驻节点（`.panel` 容器、标题页、顶栏伪元素）。按压样式已写好，等 Round 2 UI 改成脏检查渲染后自动生效。

## 7. 减弱动态（双通道）

1. 系统偏好：全部动画声明包在 `@media (prefers-reduced-motion: no-preference)` 内；`reduce` 命中时一刀切压到 0.01ms。
2. 游戏设置：`settings.reduceMotion` → 后轮 UI 在 `html` 或 `.shell` 落 `data-reduce-motion="on"`，CSS 侧同样全局冻结。画布侧已尊重该设置（波浪冻结），保持一致。

冻结清单：太阳浮动、浪drift、小船摇、救生圈摆、面板 pop、天空渐变（跳变代替）。按钮按压位移保留（0.01ms 即时档，不属于「动态」）。

## 8. 色盲友好

原则：**颜色永不孤军**，每个用色状态必须另有图案 / 图标 / 文字 / 位置中的至少一样。

- 三条状态条：饱食 = 纯色 + 光泽 / 口渴 = 45° 白斜纹 / 生命 = 横向细纹，另各缝 9px 图标（🍗💧❤️），红绿色盲下依旧三形三态。
- 语义按钮：出战（珊瑚）/ 吃喝交单（海藻绿）都配墨字 + 中文动词，不靠底色识别。
- 资源：仓库格永远「名字 + 数量」，`--res-*` 色只做辅助；后轮画布浮标除颜色外需加形状区分（见第 11 节）。
- 天气：天色变化必配顶栏文字。
- 选中态（dock active / build primary）：阳光黄 **+ 上浮 2px 位移**，双通道。

## 9. 触控与窄屏

- `pointer: coarse` 下：dock 按钮 ≥48px、面板按钮 ≥44px、滑杆 38px 高热区；`touch-action: manipulation` 去 300ms 延迟。
- 刘海安全区：顶栏 `safe-area-inset-top`、船坞 `safe-area-inset-bottom`（index.html 已 `viewport-fit=cover`）。
- ≤760px：左右浮层改上下分列（操作面板贴顶 36vh、仓库贴底 24vh），让出海面中心给木筏；dock 横滚 + scroll-snap，首尾 `margin-inline: auto` 实现「不溢出居中、溢出可达」。
- ≤380px：状态条收窄到 56px。

## 10. 口吻

- 称呼固定「老大」。失败自嘲，不恐吓：✅「跑了。鱼对你的手速表示遗憾」 ❌「失败！资源不足！」
- 标题页三件套：标语徽章（海上拾荒，摸鱼不慌）→ Hero 标题 → 一句破木筏碎碎念。
- 手账（log）永远第一人称吐槽体，最新一条阳光黄高亮。

## 11. 后轮接口（UI / world / canvas 直接吃）

- 变量：`--sky-*`、`--res-*`、`--dur-*`、`--ease-*`、`--tap-*`、全部基色。
- 钩子：`data-weather`、`data-phase`、`data-reduce-motion`（挂 `html` 或 `.shell` 均可，变量自动继承）。
- 工具类：`.visually-hidden`（读屏专用文本）。
- 待办移交：① `ui/app.js` 改脏检查渲染（否则按压 / 点击目标每帧被换掉）；② 状态条加 `role="meter"` + `aria-label`；③ `#timing` 滑杆每帧被重置 value，钓鱼交互需修。

## 12. Round 2 美术验收标准

- [ ] 五种天气 `data-weather` 切换，天空 1.2s 渐变、夜幕 `data-phase` 三档淡入，画布夜幕不叠加。
- [ ] `data-reduce-motion="on"` 时页面无任何循环动画（DevTools Animations 面板为空）。
- [ ] 375px 宽 iPhone 视口：无横向滚动、面板不遮木筏中心、所有按钮热区 ≥44px。
- [ ] 键盘 Tab 走查：每个可交互元素有虚线焦点环，顺序合理。
- [ ] 灰阶截图（模拟全色盲）下：三条状态条、选中 dock、出战按钮仍可分辨。
- [ ] 出战胜利 / 惜败文案符合第 10 节口吻；所有面板文字对比 ≥4.5:1。
- [ ] 无 UI 框架、无图片资源引入；`npm run build` CSS 总量 <30KB。

## 13. 留给 world / canvas 轮（本轮未做，勿在 CSS 补）

- 木筏水彩木纹与浪花描边（替换现在的纯色格子）、建筑图形化图标。
- 拾取粒子：浮标被点击后弹性吸入仓库方向 + 泡沫爆点。
- 建造落成木槌震动帧、海面泡沫粒子带、雨 / 风暴粒子（雨丝、浪头白沫）。
- 浮标形状区分（圆 = 普通、星 = 稀有），与第 8 节色盲原则配套。
- 鲨鱼 / 潜水场景的深海光柱与气泡。
