# 视觉规范 · 我的花园世界

国风「纸本设色」视觉系统的唯一事实来源。样式代码只有两个文件：

| 文件 | 职责 |
|------|------|
| `src/styles/tokens.css` | 全部设计令牌（颜色、圆角、层级、动效、布局刻度）与季节/昼夜/主题/花灵覆写 |
| `src/styles/main.css` | 布局与组件样式。新增样式必须消费令牌；存量裸色值（泥土细节、噪声图、局部高光）逐轮清退 |

## 一、立意

墨色纸本为底，朱砂、青金、玉色、泥金设色；白日是宣纸，入夜换**磁青纸泥金**
（深青蓝纸底 + 米金文字，仿泥金写经）。界面元素统一隐喻：

- HUD 题字带一枚朱砂**印章**（`.brand::after`），选中地块左上盖「选」印（`.plot.is-selected::before`）；
- 面板是**花笺**（纸底 + 描金双框 + 左上玉晕/右下朱晕 + 主题晕染 + 标题朱砂扫尾）；
- 教程弹窗是**卷轴告示**（`.modal-card::before/::after` 檀木轴头 + 令牌化暗幕）；
- 提示是**墨签**（墨底金边胶囊）；
- 摆件是**廊下挂牌**（朱绳系结 + 纸木牌面 + 印字放大）；
- 花灵是**驻园灵玉**（玉牌灵字 + 灵光雾晕，见 §六）。

## 二、令牌分层

`tokens.css` 内令牌分层，**组件样式只允许使用语义层与场景层**：

1. **颜料层 `--c-*`**：传统色原料。墨分五色（焦 `#201a12` / 浓 `#2d251a` / 重
   `#4c3e2d` / 淡 `#71614c` / 清 `#9c8b70`）、宣纸/绢本、朱砂/朱磦/印泥、石青/青金、
   玉/青瓷、泥金/藤黄、胭脂、赭石、檀木。
2. **语义层**：`--text/--text-soft/--text-faint`、`--surface/--surface-2`（面板纸/卡片纸）、
   `--line/--line-strong`（描金）、`--accent`（朱砂）、`--focus`（藤黄）、`--edge-hi`
   （纸面受光内沿）、`--shadow-soft/--shadow-deep`、`--backdrop-dim`。
3. **场景层**：`--sky-*`（三段天空 + 辉光 + 暗角）、`--mtn-far/mid/near`（三重远山）、
   `--mist`、`--moon-*`、`--soil-*`（干/湿土、垄沟、圃沿、含水釉光）、`--bloom-halo`、
   `--petal-opacity`、`--grain-*`、**摆件组 `--decor-cord/glyph/rim/glow` 与
   `--theme-wash`**、**花灵组 `--spirit-a/b/ink`（`--spirit-glyph/display` 仅由
   `[data-spirit]` 提供）**。

旧令牌名（`--ink/--paper/--vermilion/--gold/--jade/--radius/--font-*` 等）作为**兼容别名**
保留，TS 内联样式可以继续引用，昼夜切换时会一起翻色。

### 状态属性驱动（挂在 `#app` 根元素上）

- `[data-season="spring|summer|autumn|winter"]`：覆写天空、远山、雾带，秋冬另调土色（已接线）；
- `[data-night="1"]`：整套换磁青纸令牌，同时点亮挂牌夜灯 `--decor-glow`
  （声明在季节之后，同特异度后者取胜，**勿调换顺序**；已接线）；
- `[data-theme="spring|summer|autumn|winter|ink"]`：装扮主题层，见 §五（已接线：`app.ts frame()` 每帧写 `state.decorTheme`）；
- `[data-spirit="juyue|chiguang|rainbow|xueyi|suideng"]`：花灵驻园层，见 §六（已接线）；
- `[data-mode="place|visit"]`：摆放 / 访邻模式层——摆放模式罩暗幕亮锚位，访邻模式隐去自家 dock、邻园盖上舞台（已接线，样式见 main.css 对应段）。

`[data-theme]` 与 `[data-spirit]` 声明在夜色块**之后**，但**只覆写主题/灵专属变量**，
不碰语义层与场景层；组件消费这些变量时一律 `color-mix(…, var(--text))` 掺墨，
因此昼夜自动适配，与夜色覆写没有次序冲突。

## 三、场景分层与 z 刻度

```
.app（isolation:isolate，自身画天空渐变+暗角）
├─ ::before   --z-scene(0)   雾带/三重远山（纯 radial-gradient 剪影，零图片）
├─ .sky       --z-scene(0)   晨昏暖色、星、日月（层内微序 z:1 不设令牌）
├─ .stage     --z-stage(1)   挂牌行 + 陈设景物层(.decor-scene) + 花园 + 灵玉（::before/::after）
├─ .hud/.dock --z-chrome(2)
├─ .petals    --z-petals(3)  花瓣飘过全景（pointer-events:none）
├─ .sheet     --z-sheet(5)   花笺面板
├─ .coach     --z-coach(6)   教程气泡
├─ .modal     --z-modal(7)   卷轴告示
├─ .toast-wrap --z-toast(9)  墨签（可浮在卷轴之上）
└─ ::after    --z-grain(11)  宣纸噪纹（feTurbulence data-URI，不拦指针）
```

`.stage` 内部：`.decor-scene`（陈设 SVG，`scene/decor-layer.ts` 所有，自带注入式
样式与聚焦态）铺在花圃之下、`pointer-events:none`；灵玉伪元素 z:1 浮在花圃之上、
花瓣与花笺之下。

层级一律取 `--z-*` 令牌，禁止手写数字（收获/水花迸发粒子由 TS 内联 `z-index:20`
铺在最顶，属例外）。花瓣层与噪纹层必须保持 `pointer-events: none`。

## 四、地块状态钩子（与 TS 的契约）

渲染层（`scene/garden-view.ts`）以 **class** 驱动，全部已接线：

| 钩子 | 含义 | 视觉表现 |
|------|------|----------|
| 默认 | 干土 | 暖褐土色 + 垄沟细点 + 圃沿内描 + 前立面厚度 |
| `.is-selected` | 选中 | 泥金内环 + 左上朱砂「选」印 |
| `.is-wet` | 水分足 | 土色转深、表面起釉光 |
| `.is-thirsty` | 已栽种但缺水 | 右上空水滴呼吸闪烁（`.drop` 徽标） |
| `.is-ready` | 盛开可收 | 金环呼吸光晕（`breathe`） |
| `.is-wilt` | 枯萎 | 整块褪灰减亮 |
| `.is-plantable` | 持种可播 | 玉色内环 + 亮度呼吸邀请 |

水滴（`.drop/.drop.full`）与肥星（`.fert-star`）由徽标行直接渲染，不再走
`data-wet/data-fert` 属性（Round 1 文档中的 data-* 方案已被 class 方案取代）。

## 五、装扮主题 `[data-theme]`（春晓/盛夏/秋宴/冬雪/墨雅）

`tokens.css` 已备好五个主题块，只覆写 `--theme-wash`（花笺/牌面晕染）与
`--decor-cord/glyph/rim`（挂牌配色）。同一主题块**三重职责**：

1. `[data-theme]` 挂在 `#app` 上 → 全局主题：所有花笺淡染主题色、未标注挂牌换色；
2. `[data-theme]` 挂在单个 `.decor-chip` 上 → 该摆件按 `theme` 字段着色；
3. `[data-decor="…"]` 别名 → 陈设层已给每块挂牌写入 `data-decor`，主题块按
   `THEMES` 归属映射同一套色，**per-摆件着色已生效，无需接线**；元素自身命中的
   别名优先于从 `#app` 继承的全局主题。

全局主题已接线（Round 3）：`state.decorTheme`（存档 v3 字段，`applyTheme` 时写入、迁移时清洗），
`app.ts frame()` 每帧同步 `root.dataset.theme = state.decorTheme ?? ""`——玩家最后套用的主题
染遍花笺与挂牌，跨会话保持。

主题色一览：春晓桃夭（胭脂）、盛夏石青荷风、秋宴赭金、冬雪青瓷、墨雅焦墨泥金。

## 六、庭院摆件层与花灵驻园层

### 摆件 · 挂牌 + 陈设景物（均已生效）

摆件入景分两层。**景物层**归 `scene/decor-layer.ts`（自带注入式样式）：SVG 画进
园中槽位、点按挂牌可聚焦。**挂牌行**归本样式域，每个 `.decor-chip` 渲染为檐下挂牌：

- `::before` 画朱绳与绳结（`--decor-cord`）；
- `::first-letter` 把文本首字（即摆件 glyph，如「灯 纱灯」的「灯」）放大设色
  （`--decor-glyph` 掺墨），纯 CSS 拿到印字；陈设层聚焦反白（`.is-focus`）时
  印字随之反白；
- 牌面 `--surface-*` 纸底 + 泥金牌沿 + 主题晕染，昼夜自动翻色；per-摆件配色
  由 `[data-decor]` 别名驱动（见 §五），已生效；
- 入夜 `--decor-glow` 点灯（挂牌泛暖光）；
- `plaque-sway` 以绳结为轴轻曳，`nth-child` 错开周期与相位。

挂牌行高与花园高度联动：`.decor-row` 48px（≤640px 42px）+ 4px 间距 =
`.garden { height: calc(100% - 52px) }`（≤640px 46px），改其一必须同步另一处；
陈设层注入样式把行锁成单行横滑，正是为了不破坏这个恒等式。

### 花灵 · 驻园灵玉（已全链路生效）

出战花灵以「灵玉」悬于园心上空（两侧檐角与月洞门都是陈设槽位，中央上空常空）：
玉牌里一枚灵字（菊/池/蝶/雪/灯），外罩灵光雾晕徐徐起伏，入夜灵光更盛。
**零新增 DOM**——本体与雾晕分别画在 `.stage::after/::before` 上，显隐由
`--spirit-display` 控制。

接线现状：`ui/hud.ts` 每帧把 `state.activeSpirit` 写到根节点
`data-spirit`（`SPIRIT_ATTR`），灵玉随请灵/休灵即时切换；
`audio/soundscape.ts` 监听同一属性驱动环境音，视听同源。空值或未知 id 不命中
`[data-spirit]` 令牌块 → 伪元素保持 `display:none`，优雅降级。

花灵面板的请灵卡（带 `aria-pressed` 的 `.card`）：首字放大作灵字、出战卡罩
灵光；`panels.ts` 已写入 `b.dataset.spirit = s.id`，per-灵配色**已生效**。

## 七、动效规范

### 刻度

| 令牌 | 值 | 用途 |
|------|----|------|
| `--dur-quick` 110ms | 按压、悬停 |
| `--dur-base` 200ms | 入场、状态切换 |
| `--dur-slow` 340ms | 面板级转场（预留） |
| `--ease-out` | 常规缓出 |
| `--ease-brush` | 笔势（快起慢收，预留给面板转场） |
| `--ease-pop` | 弹出（toast 入场在用） |

### 重建约束与安全名单

渲染层已增量化（节点常驻、只写变化），入场动画可以安全使用。仍需遵守：
**循环动画的第 0 帧尽量等于静止态**（重建瞬间不跳变）。当前动画清单：

- 入场：`.toast`（toastin）、`.sheet/.modal-card`（sheetup，面板切换时才重建）、
  `.modal`（fadein）、`.plot-art.pop`（阶段切换时）；
- 循环：`.petal` 等粒子（fall/rise/firefly）、`.plot-art .sway/.glow`、
  `.plot.is-ready`（breathe）、`.is-plantable`（invite）、`.is-thirsty .drop`（thirst）、
  `.coach`（coachfloat）、`.coach-target .seal`（coachring）、`.stars i`（twinkle）、
  `.decor-chip`（plaque-sway，摆件行仅在装扮变化时重建）、
  `.stage::before/::after`（spirit-halo/bob，挂载一次不重建）。

### 花瓣（`scene/particles.ts` 契约）

- 关键帧名固定为 `fall`（TS 只覆写 `animation-delay/duration`，改名会断）；
- 透明度走 `--petal-opacity`（夜间自动降到 0.42）；
- 粒子颜色仍由 TS 内联写死（改读季节令牌列入缺口）。

### 减少动态（`prefers-reduced-motion: reduce`）

三段策略，CSS 与 TS 双侧配合：

1. **全局钳制**：动画/过渡压到 0.01ms、单次播放、延迟归零（负延迟循环被钳短会闪帧）；
2. **装饰循环关停**：`.petals` 整层 `display:none`（TS 侧 `particles.ts` 同时不再
   挂粒子与迸发/水花）；挂牌摆动、灵玉起伏、教程气泡浮动、花枝摇曳 `animation:none`；
3. **静态替身**：靠动画传达的状态提示换成常亮样式——盛放地块给金环+光晕，
   教程目标给藤黄描边。星空保留（静态星点无动效负担）。

## 八、组件要点

- **dock**：≤1020px 切成单行横滑（隐藏滚动条 + 两端渐隐 mask + 首尾 `margin:auto`
  保证不满一屏时仍居中），≤640px 再放大圆签；底部叠加 `env(safe-area-inset-bottom)`。
- **sheet**：底部锚定 `calc(--dock-clear + safe-area)`，`max-width:720px` 居中；
  描金双框 = 1px 描金 border + 内缩 5px 的淡金 `outline`（都画在边框盒上，内容滚动不跟随）。
- **HUD pills**：`tabular-nums` 防时钟跳动。
- **plot 铭牌**：底部半透明墨底渐变保证 11px 字在任何土色上可读；进度条玉→金渐变。
- **modal**：暗幕取 `--backdrop-dim` 令牌 + 轻微 backdrop blur；卡片上下檀木轴头
  仿卷轴（`--c-wood` 三段渐变圆杆）。
- **摆件行高**：`.decor-row` 高度与 `.garden { height: calc(100% - 52px) }` 联动
  （≤640px 为 46px），改其一必须同步另一处。

## 九、可达性

- 全部可点元素 `:focus-visible` 藤黄描边（地块 offset 3px）；
- 按钮最小高度 40px（触屏行 36px 圆签除外）；
- 昼：浓墨 `#2d251a` on 纸 `#f7efdb` ≈ 12:1；夜：米金 `#efe5c9` on 磁青 `#2c3547` ≈ 9:1；
  土面铭牌加墨底渐变垫底后 ≥ 4.5:1；
- 灵玉/挂牌均 `aria-hidden` 语境内（装饰层），不产生读屏噪音；
- `color-scheme` 随昼夜切换（滚动条/表单原生件同步翻色）。

## 十、已知缺口（下一轮）

1. ✅ ~~`root.dataset.theme` 接线~~（Round 3 已完成，见 §五）。
2. 花瓣颜色由 TS 内联写死，建议改读季节令牌（春桃粉/夏荷白/秋枫赤/冬雪白）。
3. `index.html` 的 `theme-color` 仍是旧棕色 `#3d2a1c`，建议随昼夜切换（owner: 引擎）。
4. `decor-layer.ts` 的注入式 `<style>` 里仍有裸色值与手写 z（属陈设层所有）；
   长期应并回样式域、改读令牌。
5. `main.css` 存量裸色值（土面高光、进度条渐变、星点等）继续向令牌收敛；
   Round 3 新增的摆放/访邻两段样式已消费令牌，仅借花笺纸条底色两枚裸值待并入颜料层。
