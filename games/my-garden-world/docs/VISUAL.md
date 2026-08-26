# 视觉规范 · 我的花园世界

国风「纸本设色」视觉系统的唯一事实来源。样式代码只有两个文件：

| 文件 | 职责 |
|------|------|
| `src/styles/tokens.css` | 全部设计令牌（颜色、圆角、层级、动效、布局刻度）与季节/昼夜覆写 |
| `src/styles/main.css` | 布局与组件样式，只允许消费令牌，不允许出现裸色值（泥土细节、噪声图除外） |

## 一、立意

墨色纸本为底，朱砂、青金、玉色、泥金设色；白日是宣纸，入夜换**磁青纸泥金**
（深青蓝纸底 + 米金文字，仿泥金写经）。界面元素统一隐喻：

- HUD 题字带一枚朱砂**印章**（`.brand::after`），选中地块盖「选」印；
- 面板是**花笺**（纸底 + 描金双框 + 左上玉晕/右下朱晕 + 标题朱砂扫尾）；
- 教程弹窗是**卷轴告示**（上下檀木轴头 + 四合暗幕）；
- 提示是**墨签**（墨底金边胶囊）。

## 二、令牌分层

`tokens.css` 内令牌分三层，**组件样式只允许使用语义层与场景层**：

1. **颜料层 `--c-*`**：传统色原料。墨分五色（焦 `#201a12` / 浓 `#2d251a` / 重
   `#4c3e2d` / 淡 `#71614c` / 清 `#9c8b70`）、宣纸/绢本、朱砂/朱磦/印泥、石青/青金、
   玉/青瓷、泥金/藤黄、胭脂、赭石、檀木。
2. **语义层**：`--text/--text-soft/--text-faint`、`--surface/--surface-2`（面板纸/卡片纸）、
   `--line/--line-strong`（描金）、`--accent`（朱砂）、`--focus`（藤黄）、`--edge-hi`
   （纸面受光内沿）、`--shadow-soft/--shadow-deep`、`--backdrop-dim`。
3. **场景层**：`--sky-*`（三段天空 + 辉光 + 暗角）、`--mtn-far/mid/near`（三重远山）、
   `--mist`、`--moon-*`、`--soil-*`（干/湿土、垄沟、圃沿、含水釉光）、`--bloom-halo`、
   `--petal-opacity`、`--grain-*`。

旧令牌名（`--ink/--paper/--vermilion/--gold/--jade/--radius/--font-*` 等）作为**兼容别名**
保留，TS 内联样式可以继续引用，昼夜切换时会一起翻色。

### 季节与昼夜驱动

状态属性挂在 `#app` 根元素上（`app.ts` 已接线）：

- `[data-season="spring|summer|autumn|winter"]`：覆写天空、远山、雾带，秋冬另调土色；
- `[data-night="1"]`：整套换磁青纸令牌（声明在季节之后，同特异度后者取胜，**勿调换顺序**）；
- 夜色不再用 `filter: saturate()` 实现（会把 `.app` 变成 fixed 后代的包含块，且整层滤镜费帧）。

## 三、场景分层与 z 刻度

```
.app（isolation:isolate，自身画天空渐变+暗角）
├─ ::before  z:0  月亮/雾带/三重远山（纯 radial-gradient 椭圆硬边剪影，零图片资源）
├─ .stage    z:1  花园
├─ .hud/.dock z:2
├─ .petals   z:3  花瓣（pointer-events:none）
├─ .sheet    z:5  花笺面板
├─ .modal    z:7  卷轴告示
├─ .toast-wrap z:9
└─ ::after   z:11 宣纸噪纹（feTurbulence data-URI，opacity/blend 由令牌控制，不拦指针）
```

层级一律取 `--z-*` 令牌，禁止手写数字。花瓣层与噪纹层必须保持
`pointer-events: none`，任何情况下不得遮挡点击。

## 四、地块状态钩子（与 TS 的契约）

`main.css` 已为下列钩子写好样式，**渲染层（`scene/garden-view.ts`，owner:
opus-garden）接上属性即可点亮**，CSS 无需再动：

| 钩子 | 含义 | 视觉表现 | 现状 |
|------|------|----------|------|
| 默认 | 干土 | 暖褐土色 + 垄沟细线 + 圃沿内描 + 前立面厚度 | ✅ 生效 |
| `.is-selected` | 选中 | 宣纸留白 + 朱砂双环 + 右上「选」印 + 微抬起 | ✅ 生效 |
| `.is-wet` 或 `[data-wet="1"]` | 水分足（`plot.watered >= def.waterNeed`） | 土色转深、表面起釉光、左上一滴水 | ⏳ 待接线 |
| `[data-wet="0"]` + `[data-stage!="empty"]` | 已栽种但缺水 | 左上虚线空水滴（提示要浇） | ⏳ 待接线 |
| `[data-fert="1"]` | 已施肥 | 铭牌行前缀金色「肥」字 | ⏳ 待接线 |
| `[data-stage="bloom"]` 或 `:has(.bloom)` | 盛开 | 土面升起暖金光晕；`.bloom` 光晕取 `currentColor`（随花色） | ✅ `:has` 兜底已生效 |
| `[data-stage="wilt"]` | 枯萎 | 土色与字牌一起褪灰 | ⏳ 待接线 |

建议接线方式（一行搞定，供 owner 参考）：

```ts
el.dataset.stage = plot.stage;
el.dataset.wet = plot.watered >= (def?.waterNeed ?? 1) ? "1" : "0";
el.dataset.fert = plot.fertilized ? "1" : "0";
```

## 五、动效规范

### 刻度

| 令牌 | 值 | 用途 |
|------|----|------|
| `--dur-quick` 110ms | 按压、悬停 |
| `--dur-base` 200ms | 入场、状态切换 |
| `--dur-slow` 340ms | 面板级转场（预留） |
| `--ease-out` | 常规缓出 |
| `--ease-brush` | 笔势（快起慢收，预留给面板转场） |
| `--ease-pop` | 弹出（toast 入场在用） |

### ⚠ 每帧重建约束（重要）

`app.ts` 的 `paint()` 目前**每个 rAF 帧**用 `replaceChildren`/`innerHTML` 重建
HUD、花园、面板、教程弹窗。被重建的元素上：

- **禁止入场动画**（会永远卡在第 0 帧 —— 若第 0 帧是 `opacity:0`，元素直接消失）；
- transition 也不会播（元素首帧即目标态），只保留声明等未来渲染层做 diff/memo 后自动生效；
- 循环动画若必须加，**第 0 帧必须等于静止态**（如 `.bloom` 的 `bloom-breathe`，卡住也无害）。

当前**允许挂动画的安全名单**（挂载一次、不被重建）：
`.toast`（入场）、`.petal`（`fall` 循环）、`.app::before/::after`。
渲染层改成增量更新后，可以再给 `.sheet/.modal/.plot` 补入场与 hover 过渡，届时更新本表。

### 花瓣（`scene/particles.ts` 契约）

- 关键帧名固定为 `fall`（TS 只覆写 `animation-delay/duration`，改名会断）；
- 轨迹在 `transform` 内完成左右摇曳（translate3d + rotate），起点 `-4vh` 屏外；
- 透明度走 `--petal-opacity`（夜间自动降到 0.42）；
- `prefers-reduced-motion: reduce` 时整层 `display:none`，同时全局动画/过渡压到 0.01ms。

## 六、组件要点

- **dock**：≤1020px 切成单行横滑（隐藏滚动条 + 两端渐隐 mask + 伪元素 `margin:auto`
  保证不满一屏时仍居中），任何按钮数量都不会溢出或挤压舞台；底部叠加
  `env(safe-area-inset-bottom)`。当前工具/面板是朱砂签（`.is-on`）。
- **sheet**：底部锚定 `calc(--dock-clear + safe-area)`，`max-width:720px` 居中，
  内容滚动时描金双框不跟着滚（用 inset box-shadow 画框）。
- **HUD pills**：`tabular-nums` 防时钟跳动；≤700px 换单行横滑。
- **plot 铭牌**：底部半透明墨底渐变保证 11px 字在任何土色上可读；进度条玉→金渐变。
- **modal 暗幕**：用 `0 0 0 100vmax var(--backdrop-dim)` 阴影铺出，不新增 DOM、不拦点击。

## 七、可达性

- 全部可点元素 `:focus-visible` 藤黄描边（地块 offset 3px）；
- 按钮最小高度 40px（触屏行 36px 圆签除外），`touch-action: manipulation`；
- 昼：浓墨 `#2d251a` on 纸 `#f7efdb` ≈ 12:1；夜：米金 `#efe5c9` on 磁青 `#2c3547` ≈ 9:1；
  土面铭牌加墨底渐变垫底后 ≥ 4.5:1；
- `color-scheme` 随昼夜切换（滚动条/表单原生件同步翻色）。

## 八、已知缺口（下一轮）

1. 地块 `data-stage/data-wet/data-fert` 待 opus-garden 接线（CSS 已就位，见 §四）。
2. 渲染层 memo 化后解锁 sheet/modal 入场动画与 plot hover 过渡（见 §五安全名单）。
3. `index.html` 的 `theme-color` 仍是旧棕色 `#3d2a1c`，建议随昼夜切换（owner: opus-engine）。
4. 花瓣颜色由 TS 内联写死，建议改读季节令牌（春桃粉/夏荷白/秋枫赤/冬雪白）。
5. 装扮主题（春晓/盛夏/秋宴/冬雪/墨雅）尚未映射到令牌覆写，可加 `[data-theme]` 一层。
