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
- 花灵是**驻园灵玉**（玉牌灵字 + 灵光雾晕，见 §六）；
- 邻家园圃是**串门花笺**（印章头像邻居卡、办完事盖「谢」印回执，见 §七）。

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
- `[data-theme="spring|summer|autumn|winter|ink"]`：装扮主题层，见 §五（引擎接线待补；
  tokens 已备 `:has()` 兜底，接线前从成对签名摆件推断全局主题）；
- `[data-spirit="juyue|chiguang|rainbow|xueyi|suideng"]`：花灵驻园层，见 §六
  （已接线：`ui/hud.ts` 每帧写入）。

`[data-theme]` 与 `[data-spirit]` 声明在夜色块**之后**，但**只覆写主题/灵专属变量**，
不碰语义层与场景层；组件消费这些变量时一律 `color-mix(…, var(--text))` 掺墨，
因此昼夜自动适配，与夜色覆写没有次序冲突。

## 三、场景分层与 z 刻度

```
.app（isolation:isolate，自身画天空渐变+暗角）
├─ ::before   --z-scene(0)   雾带/三重远山（纯 radial-gradient 剪影，零图片）
├─ .sky       --z-scene(0)   晨昏暖色、星、日月（层内微序 z:1 不设令牌）
├─ .stage     --z-stage(1)   挂牌行 + 陈设景物层(.decor-scene，内含摆放锚位层) + 花园 + 灵玉（::before/::after）
├─ .hud/.dock --z-chrome(2)
├─ .petals    --z-petals(3)  花瓣飘过全景（pointer-events:none）
├─ .sheet     --z-sheet(5)   花笺面板
├─ .coach     --z-coach(6)   教程气泡
├─ .modal     --z-modal(7)   卷轴告示
├─ .toast-wrap --z-toast(9)  墨签（可浮在卷轴之上）
└─ ::after    --z-grain(11)  宣纸噪纹（feTurbulence data-URI，不拦指针）
```

`.stage` 内部：`.decor-scene`（陈设 SVG，`scene/decor-layer.ts` 所有，自带注入式
样式、聚焦态与摆放模式——`.is-placing` 时锚位层浮出且只有锚位按钮吃指针事件）
铺在花圃之下、`pointer-events:none`；灵玉伪元素 z:1 浮在花圃之上、花瓣与花笺之下。

层级一律取 `--z-*` 令牌，禁止手写数字（收获/水花迸发粒子由 TS 内联 `z-index:20`
铺在最顶、陈设层注入样式的层内微序（锚位层 z:3 等）归陈设层所有，属例外）。
花瓣层与噪纹层必须保持 `pointer-events: none`。

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

全局主题的引擎接线仍差一行（owner: 引擎）。state 侧已备好——`state.decorTheme`
随「一键主题」记录、入存档 schema v3——只欠 app.ts frame() 里：

```ts
root.dataset.theme = state.decorTheme ?? "";
```

### 兜底：成对签名摆件推断（tokens.css，接线后可删）

接线到位前，tokens.css 末段的**主题兜底块**让全局主题先行生效：`[data-theme]`
缺失或为空时，`.app:where(…):has(.decor-item[data-decor="…"])` 按园中摆件推断
主题、只点亮 `--theme-wash`（花笺晕染）。规则：

1. **成对才染**：需凑齐**恰好只属于一套 THEMES 归属的两件组合**（签名对）；
   跨套歧义对（如 青石径+屏风 既合秋宴也合墨雅）不作数，单件孤品不染——
   宁缺毋滥，凑不成对保持素纸；
2. **只认入园**：以 `.decor-item`（陈设层只为落座锚位的摆件建景物节点）为准，
   收在匣中的挂牌不作数；
3. **并存有序**：多套签名对并存时按声明序后者胜（春<夏<秋<冬<墨）；
4. **让位即删**：引擎写入任何非空 `[data-theme]` 后 `:where()` 守卫不再命中，
   兜底整体让位；接线合入后该块可原样删除。兜底内的晕染值与主题块**必须一致**，
   改一处同步两处。

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

### 摆件 · 摆放模式（八锚位 tap-tap，陈设层实现）

Round 2 设计稿（UX.md 七）已由陈设层落地，视觉全部在 `decor-layer.ts` 的
注入式样式内（本样式域**不重复定义**，避免双处维护）：

- 入口 `.decor-place` 挂在挂牌行末尾（「摆放」⇄「完成」）；
- 八锚位 `.decor-anchor`（`data-anchor` 取 `eave/gate/path-west/path-east/
  pondside/corner-north/corner-south/heart`，坐标见 `decor-art.ts`
  ANCHOR_SLOTS）浮在 `.anchor-layer`，仅 `.decor-scene.is-placing` 时显示、
  只有锚位按钮吃指针事件；
- 状态钩子：空位绿呼吸虚线圈（`anchor-breath`）、占位 `[data-filled="1"]`
  琥珀实线 + 印字缩样、可替换 `.is-target` 朱描边、误点 `.is-nudge` 轻晃；
  手持挂牌 `.decor-chip.is-held` 藤黄圈、收匣挂牌 `[data-boxed="1"]` 虚线弱化；
- `prefers-reduced-motion` 的静态替身（常亮绿描边）注入层已自带。

样式域只补一处：挂牌行空态 `.decor-empty`（「庭中尚空…」）做成纸底虚线
邀请纸签，空态有形而非一行裸文字。注入层的裸色值与手写 z 清退列在 §十一。

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

## 七、访邻花笺（邻家花园互访）

邻访（UX.md 六的设计稿）已由面板层落地为**花笺双页**：`ui/panels.ts` 的
`renderVisit` 在一张 `.sheet.visit-sheet` 里切换「邻居名录 ⇄ 某家园子」，
入口暂为 HUD 资源栏的 `.pill-visit`（dock「访邻」印章落地前的过渡，开园解锁）。
面板层只写结构性内联样式（横幅排布、圃画高度、印章头像底色）；**设色与状态
视觉归本样式域**，钩子契约如下：

| 钩子 | 含义 | 视觉表现 |
|------|------|----------|
| `.pill-visit` | HUD 临时串门入口 | 题字体 + 首字「邻」朱砂掺墨放大，悬停藤黄圈 |
| `.neighbor-card` | 名录里的邻居卡 | 交情心档（`h4 small`）换朱砂 |
| `.neighbor-card.owned` | 未到阶 · 剪影卡空态 | 整卡灰化 + 虚线框（「隔篱只见花影」，不隐藏留期待） |
| `.visit-banner` | 访客横幅 | 纸带 + 左上玉晕，名号题字体，心档朱砂 |
| `.visit-tool[data-tool]` | 访客动作 chip（浇/摘） | 选中沿用 `.chip.is-on` 朱砂；`:disabled` 转虚线（今日无事可做的可视注脚） |
| `.visit-plot` | 邻家花圃卡 | 圃画与铭牌居中 |
| `.visit-plot.is-on` | 可作业圃 | 邀请环 + `invite` 呼吸；**随当前动作换色**——帮浇水石青掺墨（水色）、摘一枝泥金掺墨 + 盛放光晕。动作态由 `.visit-sheet:has(.visit-tool[data-tool="pick"].is-on)` 读取，零 TS 接线 |
| `.visit-plot.owned` | 已谢过（已浇/已摘） | 盖「谢」印回执（`::after`，同印章语系）+ 整圃退饱和让位 |

掺墨（`color-mix(…, var(--text))`）保证邀请环昼夜自动适配。空态一览
（对应 UX.md 6.5，全部有形）：

| 空态 | 承载 |
|------|------|
| 邻居未到结识等级 | `.neighbor-card.owned` 剪影卡 |
| 今日已叨扰 / 余量用尽 | 卡片余量行文案（`.muted`），卡仍可入园只看 |
| 无缺水圃 / 无盛放花 | `.visit-tool:disabled` 虚线 + 注脚一行 |
| 进园后无事可做 | 横幅问候语换「坐坐就好…」，素纸不加饰 |

## 八、动效规范

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
  `.stage::before/::after`（spirit-halo/bob，挂载一次不重建）、
  `.visit-plot.is-on`（invite 复用——第 0 帧即静止态，访邻页逐次作业整页重绘
  也不跳变）。
- 陈设层注入动效（decor-sway/settle、anchor-breath/nudge 等）连同其
  reduced-motion 替身归 `decor-layer.ts` 自管，不入本清单。

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

## 九、组件要点

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

## 十、可达性

- 全部可点元素 `:focus-visible` 藤黄描边（地块 offset 3px）；
- 按钮最小高度 40px（触屏行 36px 圆签除外）；
- 昼：浓墨 `#2d251a` on 纸 `#f7efdb` ≈ 12:1；夜：米金 `#efe5c9` on 磁青 `#2c3547` ≈ 9:1；
  土面铭牌加墨底渐变垫底后 ≥ 4.5:1；
- 灵玉/挂牌均 `aria-hidden` 语境内（装饰层），不产生读屏噪音；
- 邻家花圃与摆放锚位均为 `<button>` 带中文 `aria-label`；进出摆放模式经
  `aria-live` 播报（归陈设层/面板层）；「谢」印是 `::after` 装饰，
  状态语义由圃卡 `aria-label` 与铭牌文字承担；
- `color-scheme` 随昼夜切换（滚动条/表单原生件同步翻色）。

## 十一、已知缺口（下一轮）

1. `root.dataset.theme` 一行接线（owner: 引擎）：state 侧 `decorTheme` 已入
   存档 v3，tokens 兜底已让主题先行生效（§五）；接上后**删除 tokens.css
   末段的主题兜底块**。
2. 花瓣颜色由 TS 内联写死，建议改读季节令牌（春桃粉/夏荷白/秋枫赤/冬雪白）。
3. `index.html` 的 `theme-color` 仍是旧棕色 `#3d2a1c`，建议随昼夜切换（owner: 引擎）。
4. `decor-layer.ts` 的注入式 `<style>` 里仍有裸色值与手写 z（属陈设层所有），
   摆放模式落地后体量更大（锚位/手持/收匣一整段），并回样式域、改读令牌的
   优先级上调。
5. 访邻面板的结构性内联样式（横幅排布、圃画高度、印章头像）宜迁到样式域
   （owner: 面板层；`.pill-visit` 入口在 dock「访邻」印章落地后一并撤除）。
6. `main.css` 存量裸色值（土面高光、进度条渐变、星点等）继续向令牌收敛。
