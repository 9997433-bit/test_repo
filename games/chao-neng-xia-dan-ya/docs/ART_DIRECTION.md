# 超能下蛋鸭 · 美术方向 ART DIRECTION

所有权：Fable-2 美术 UX（本文件 + `src/styles/**` 独占）。
组件活样板：`src/styles/gallery.html`（`npm run dev` 后访问 `/src/styles/gallery.html`）。

## 0. 一句话定位

**深夜霓虹夜市里，一群蛋形搞怪禽类把战场打成蛋液烟花。**

三支柱：

| 支柱 | 落地手段 |
| --- | --- |
| 搞怪禽类 | Canvas 矢量角色：蛋形身体、一大一小的眼睛、粗描边、呆毛；绝不使用任何版权图片/字体/音频 |
| 蛋黄金 | 唯一品牌主色。主按钮、连击、能量、评级 S、选中态一律蛋黄金；页面同屏只允许一个"金色主行动" |
| 夜市霓虹 | 冷紫夜幕压底，teal/pink/blue/violet 四色霓虹只做点缀（描边、辉光、流派色），大面积永远是夜色 |

## 1. 调色板（tokens.css 为唯一事实源）

### 夜市底色（从深到浅）

| Token | Hex | 用途 |
| --- | --- | --- |
| `--night-0` | `#0b0714` | 页面最底部渐变、印章底 |
| `--night-1` | `#140f21` | 页面主底 |
| `--night-2` | `#1d1533` | 输入槽、卡片头像底 |
| `--night-3` | `#271c46` | 面板 / 卡片主体 |
| `--night-4` | `#332457` | 浮起面板、次级按钮、hover |
| `--night-line` | `#453468` | 默认描边 |

### 蛋黄金（品牌主阶）

`--yolk-100 #fff6cf` → `--yolk-300 #ffe28a` → `--yolk-500 #ffd447`（主）→ `--yolk-600 #ffbe2e` → `--yolk-700 #ff9f1c` → `--yolk-hot #ff8a3d`（暴击/满蓄力）。
主渐变 `--grad-yolk`：300 → 500 → 700 竖向。

### 霓虹 / 元素 / 流派 / 稀有度 / 语义

- 霓虹点缀：`--neon-teal #3ee0c5`、`--neon-pink #ff6b9d`、`--neon-blue #59c2ff`、`--neon-violet #b389ff`
- 元素：`--el-fire #ff7a3d`、`--el-ice #8fd3ff`、`--el-thunder #ffe566`，各配 `-deep` 深底色用于纹样对比
- 流派：combo=pink、brute=yolk-700、elemental=blue、collide=teal、support=violet
- 稀有度 1–5：灰 `#9aa3b2` / 绿 `#63d68a` / 蓝 `#59c2ff` / 紫 `#b389ff` / 金 `#ffd447`
- 语义：`--ok #5ad66f`、`--warn #ffb020`、`--danger #ff4d6d`、`--hp #ff5c7a`

对比度红线：正文 `--ink` on `--night-1` ≈ 15:1；蛋黄按钮深字 `--ink-on-yolk #40260a` on `--yolk-500` ≥ 7:1。禁止霓虹色做小号正文。

### Canvas 侧取色

战场绘制直接使用上表 hex（Canvas 读不到 CSS 变量时硬编码同值即可），角色描边统一 `#241535`（比 night-line 更暖更深），线宽 3–3.5px @1x。

## 2. 排版

- 字体：系统栈 `--font`（Trebuchet MS / ui-rounded / PingFang / Noto Sans SC），**不引入任何 webfont**。
- 数字（连击、伤害、金币、倒计时）必须 `font-variant-numeric: tabular-nums`：挂 `.num` 或 `data-num`。
- 标题字重 800–900 + `letter-spacing 0.04–0.3em`；中文大标题配 `text-indent` 抵消末字间距。
- 字号走 `--fs-xs … --fs-2xl / --fs-display`，禁止裸 px 字号。

## 3. 空间 / 圆角 / 层级 / 辉光

- 间距 4px 基：`--sp-1..7`（4/8/12/16/24/32/48）。
- 圆角：芯片与药丸 `--radius-pill`；按钮 `--radius-sm 10`；卡片面板 `--radius 16`；大卡弹窗 `--radius-lg 22`。
- 阴影三档 `--shadow-1/2/3`；霓虹辉光 `--glow-yolk/teal/pink/danger`。**辉光只给：主行动钮、选中态、满能量、BOSS 预警**，不许满屏发光。
- z 轴：HUD `--z-hud 10` < 闪光/飘字 `--z-flash 40` < 遮罩 `70` < 弹窗 `80` < toast `90`。

## 4. 类名约定（其他代理按此消费）

**BEM-lite：`block__element--modifier`；状态一律 `.is-*` / `.has-*`（JS 只增删这两类）；枚举值一律 `data-*` 属性；数值一律 CSS 自定义属性。**

| 通道 | 约定 | 例 |
| --- | --- | --- |
| 块/元素/变体 | `block__elem--mod` | `.btn--primary`、`.hero-card__portrait`、`.bar--boss` |
| 状态（JS 切换） | `.is-*` / `.has-*` | `.is-selected` `.is-active` `.is-locked` `.is-dead` `.is-low` `.is-ready` `.is-fever` `.is-bump` `.is-on` `.is-boss` `.has-item` |
| 枚举（JS 赋值） | `data-*` | `data-element="fire|ice|thunder"`、`data-school="combo|brute|elemental|collide|support"`、`data-rarity="1..5"`、`data-grade="S|A|B|C"`、`data-tier="0..3"` |
| 数值（JS 赋值） | 内联自定义属性 | `--value`(条 0..1)、`--energy`(0..1)、`--i`(入场序号)、`--fx-x/--fx-y/--fx-color`(飘字) |
| 动效工具 | `fx-` 前缀 | `.fx-enter` `.fx-pop-in` `.fx-shake-sm/md/lg` `.fx-float` `.fx-combo-flash` |
| 工具类 | `u-` 前缀 + `.sr-only` | `.u-hidden` `.u-dim` `.u-center` |

### 组件清单（现成可用）

| 组件 | 类 | 备注 |
| --- | --- | --- |
| 按钮 | `.btn` + `--primary/--ghost/--danger/--lg/--sm/--icon` | 命中区全部 ≥44px |
| 面板 | `.panel` `.panel__title` | 通用容器 |
| 英雄卡 | `.hero-card` + `__portrait/__name/__lv/__meta` | `data-rarity`、`.is-selected/.is-locked`；5 星自带流光 |
| 三选一 | `.pick-card` + `__icon/__title/__desc` | 肉鸽/神器选卡 |
| 芯片 | `.chip` (+`data-element`/`data-school`/`--reward`/`.is-active`) | 元素芯片自带色盲纹样+字形 |
| 流派点 | `.school-dot[data-school]` | 卡片角标 |
| 进度条 | `.bar` + `__fill/__label` + `--hp/--energy/--xp/--boss` | `--value` 驱动 scaleX；`.is-low` 脉冲 |
| 星级 | `.stars` > `.stars__star.is-on` | |
| 键帽 | `.kbd` | 键盘教程 |
| 页签 | `.tab-bar` > `.tab.is-active` | 模式切换 |
| 列表行 | `.list-row` + `__label/__value` | 结算/图鉴/排行 |
| 属性对 | `.stat` + `__value/__label` | |
| 遮罩弹窗 | `.overlay` > `.modal` + `__title/__actions`；`.pause-menu` | |
| Toast | `.toast` + `--ok/--danger` | |
| 屏幕 | `.screen` + `--battle/--wide`、`.screen__title` | 自带入场动画 |
| 布局 | `.menu-grid` `.team-bar` `.card-grid` `.pick-row` | |
| 舞台 | `.stage-frame` > `#stage` | HUD 全部绝对定位在 frame 内 |
| HUD 顶栏 | `.hud-top` > `.wave-pill(.is-boss)` `.player-hp` `.hud-score` | |
| 连击 | `.combo[data-tier]` + `__count/__label`、`.is-fever`、`.fx-combo-flash` | 见 §6 |
| 英雄坞 | `.hero-dock` > `.hero-slot[data-school]` + `__key/__name` | `--energy`、`.is-active/.is-dead/.is-charged` |
| 大招钮 | `.ult-btn` + `__key` | `--energy` conic 环、`.is-ready` 呼吸 |
| 道具槽 | `.item-slot(.has-item)` + `__count` | |
| BOSS 预警 | `.boss-warning` + `__text` | JS 播 2.5s 后移除节点 |
| 瞄准读数 | `.aim-readout` | |
| 提示条 | `.hud-hint` | |
| 结算 | `.result(--win/--lose)` + `__grade[data-grade]/__title/__stars/__rows/__rewards/__actions` | |
| 飘字 | `.fx-float(--crit/--heal)` | `--fx-x/y/color`，animationend 自删 |

## 5. 战斗 HUD 契约（给 Opus-4）

```html
<div class="stage-frame">
  <canvas id="stage" width="480" height="800"></canvas>
  <div class="fx-combo-flash"></div>          <!-- 常驻，JS 重挂 .is-on 播一次 -->
  <div class="hud-top"> 波次/血条/金币/暂停 </div>
  <div class="combo" data-tier="0"> ×n / COMBO </div>
  <div class="boss-warning">…</div>            <!-- 需要时插入，播完删 -->
  <span class="fx-float">…</span>              <!-- 命中时插入，播完删 -->
  <div class="hud-hint">…</div>
</div>
<div class="hero-dock"> 5×.hero-slot + .ult-btn </div>
```

- 一次性动画的重播模式统一为：`el.classList.remove(x); void el.offsetWidth; el.classList.add(x)`。
- 数值更新只改内联自定义属性（`--value/--energy`），布局零重排。
- 连击层级：`data-tier` 0=灰(1–4) / 1=金(5–9) / 2=热橙(10–19) / 3=粉(20+)，满 20 加 `.is-fever`。

## 6. 动效原则

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--dur-1` 90ms | 按压反馈 | `--ease-out` |
| `--dur-2` 160ms | hover/状态切换 | `--ease-out` |
| `--dur-3` 260ms | 入场/连击弹跳 | `--ease-pop`（回弹） |
| `--dur-4` 480ms | 结算盖章/大转场 | `--ease-pop` |

- **只允许动 `transform` / `opacity` / `background-position` / `filter`**，禁止动 width/height/top/left（60fps 红线）。
- 连击反馈链：命中 → `.combo__count.is-bump` 弹跳 → 每 5 连 `.fx-combo-flash.is-on` 全屏蛋黄闪 → 20 连 `.is-fever` 流光。
- 震屏三档 `.fx-shake-sm/md/lg`（命中/爆炸/BOSS），只挂 `.stage-frame`。
- 命中停顿 30ms 由 JS 控制主循环，CSS 不参与。

### reduce-motion 双通道（必须遵守）

1. 系统通道：`@media (prefers-reduced-motion: reduce)` 自动生效。
2. 游戏内设置：JS 在 `<html>` 上切 `data-reduced-motion="on|off"`，随存档持久化；`"off"` 可覆盖系统偏好（玩家显式要动效）。

生效时：所有动画压到 1ms 播完（保终态）、全屏闪光与卡面流光 `display:none`、震屏禁用；辉光、边框、配色等静态反馈全部保留，信息不丢失。

## 7. 无障碍

- **触控**：一切可点目标 ≥ `--tap-min` 44px（`.btn--sm` 靠 padding 补足；`.hero-slot` 56×64）。舞台 `touch-action: none`，普通按钮 `touch-action: manipulation`。
- **色盲三重编码**：元素信息 = 色相 + 纹样 + 字形。条纹`▲`=火、圆点`❆`=冰、网格`⚡`=雷（纹样 token：`--pat-stripes/--pat-dots/--pat-grid`；圆点必须配 `background-size: 8px 8px`）。Canvas 里的元素残留同样要画对应纹样/图标，不许只换色。
- **键盘**：全局 `:focus-visible` 蛋黄 3px 外环；键位角标用 `.kbd` 与 `.hero-slot__key`。
- **屏幕阅读**：图标钮必须带 `aria-label`；纯装饰层（闪光/飘字容器）`pointer-events:none` 且不进 tab 序。
- 安全区：外壳与 `.hero-dock`、`.toast` 已含 `env(safe-area-inset-*)`。

## 8. Canvas 角色画风规范（给 Opus 系）

1. **蛋形轮廓**：身体 = 竖椭圆（scale 1 : 1.18），万物皆蛋。
2. **粗描边**：统一 `#241535`，3–3.5px，先 fill 后 stroke。
3. **搞怪五官**：双眼一大一小（半径比约 9:6.5），瞳孔偏移制造呆滞感；扁嘴用横椭圆。
4. **高光贴左上**：白色 25–80% 透明小圆/圆角条。
5. **配色**：主体取英雄流派色或蛋黄阶，肚皮一律 `--yolk-100`。
6. 钉=蓝圆+高光点，砖=圆角矩形+顶部亮条，敌人=果冻拱形+大眼。示例代码见 `gallery.html` 内 `duck()/peg()/brick()/slime()`。
7. 弹道预测线：`setLineDash([4,10])`、`rgba(255,212,71,.85)`、3px。
8. 残影：同形状 alpha 0.25/0.5 两帧拖尾。

## 9. 加载序与文件职责（勿改挂载）

`index.html` 只挂 3 个文件：`tokens.css → layout.css → fx.css`。
`layout.css` 顶部 `@import` 聚合 `base.css → components.css → hud.css`。
最终生效序：tokens → base → components → hud → layout → fx（fx 必须最末，reduce-motion 覆盖在其底部）。

| 文件 | 职责 |
| --- | --- |
| `tokens.css` | 全部设计令牌（含旧脚手架别名 `--bg/--panel/--yolk/…` 勿删） |
| `base.css` | reset、夜市底景、排版、焦点环、滚动条、工具类 |
| `components.css` | 按钮/卡片/芯片/条/星级/页签/列表/弹窗/toast |
| `hud.css` | 战斗 HUD 全件 |
| `layout.css` | 应用壳、招牌、屏幕、舞台框、结算屏、响应式 |
| `fx.css` | 全部 `@keyframes`、动画绑定、入场工具、reduce-motion |

## 10. 禁止事项

- 禁止任何外部图片 / webfont / 图标库 / 版权素材；图形只用 CSS 渐变、Unicode 字形、Canvas 矢量。
- 禁止裸色值进组件（一律走 token）；禁止在 `src/styles/**` 之外写样式或内联 style 写视觉（内联仅限传数值型自定义属性）。
- 禁止大面积 `backdrop-filter`（仅 `.overlay` 一处）与满屏辉光。
- 禁止用颜色作为唯一信息通道。
