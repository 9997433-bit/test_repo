# 美术与体验总纲（Fable-2 · Round 1）

> 可写范围：本文件 + `src/styles/**`。全部视觉为 CSS / 内联 SVG（data URI），
> 零外部图片、零字体下载。目标：综艺蘑菇屋的烟火气 —— 木结构、暖黄灯、
> 菜园泥土、黄昏金边、萤火虫。治愈、慢、可停留。
> 禁止：赛博霓虹、商城弹窗感、硬阴影塑料 UI。

---

## 1. 调性关键词

木 / 纸 / 灯火 / 炊烟 / 泥土 / 薄雾 / 萤火。
一切界面都是"村里的物件"：顶栏是房梁，面板是钉在木框里的米纸，
按钮是打磨过的小木牌，标题是刻字小木匾。文案像邻居聊天，不像系统通知。

## 2. 令牌架构（`src/styles/tokens.css`）

三层结构，全部落在 CSS 自定义属性上：

1. **基底**：不随季节变化的物件色 —— `--wood-1..4`（橡木→焦木）、
   `--paper/--paper-2/--ink/--ink-soft`（米纸与墨）、`--lamp/--lamp-hot/--fire/--gold`（灯火）。
2. **季节原色 `--s-*`**：`[data-season]` 写在 `#app` 上，给出天空、远山植被、
   草地、耕土、薄雾、点缀花色的"白日原值"。
3. **相位派生**：`[data-phase]` 同样写在 `#app` 上。因为两组属性在**同一元素**
   解析，`[data-phase="dusk"/"night"]` 用 `color-mix(in oklab, var(--s-*) N%, 压色)`
   把任意季节统一压向"晚霞橘紫"或"月夜蓝黑"——4 季 × 3 相位 = 12 套调色
   自动成立，组件只消费派生令牌（`--sky-hi/--sky-lo/--horizon/--foliage/
   --ground-1/--soil-1/--mist/--glass/--celestial*/--lamp-a/--wash`），
   不需要写 12 套组合选择器。

### 季节原色速览（白日）

| 季 | 天空 | 植被 | 草地 | 点缀 `--accent` |
| --- | --- | --- | --- | --- |
| 春 | `#9fd4ee → #dff0d9` | `#7cb265` | `#86a95c` | 花瓣粉 `#f2b8c6` |
| 夏 | `#5fa8e0 → #bfe3f2` | `#3f7d4e` | `#5f9048` | 稻金 `#ecc25f` |
| 秋 | `#a9c3d6 → #f0ddb4` | `#c8813d` | `#b3924f` | 柿橙 `#d97b3f` |
| 冬 | `#b9c9da → #e9eff5` | `#8ba3b5` | 雪 `#e8edf2` | 炭火 `#cd5f3c` |

### 相位规则

| 相位 | 混色方向 | 日月 | `--lamp-a` | UI 纸色 |
| --- | --- | --- | --- | --- |
| day | 原色直通 | 小太阳，右上高挂 | 0（熄灯） | 米纸亮面 |
| dusk | 天空混 `#6e4a78/#f19153`，地物混暖褐 | 大落日，左下 | 0.85 | 纸面微暖 |
| night | 全体混 `#0b1322` 系，保留 12~42% 原色 | 月亮 + 环形山 | 1 | 暖黑纸 `#2e2820` + 米色墨 |

`--lamp-a` 是全局"灯火强度"：窗玻璃、灯笼、门口光斑、顶栏灯笼的
辉光尺寸全部 `calc(Npx * var(--lamp-a))`，白日自动熄灭，黄昏渐亮，夜晚全开。
`--wash` 是整个村景的相位光罩（黄昏橘紫渐变 / 夜晚深蓝 + 蘑菇屋侧暖光袋）。

## 3. 场景分层（`src/styles/village.css`）

`.village` 设 `isolation: isolate`，层序固定：

| z | 元素 | 内容 |
| --- | --- | --- |
| 1 | `.sky` | 天幕渐变 + 日月辉光；`::before` 日/月盘，`::after` 云（昼/昏）或星空（夜） |
| 2 | `.mountain` | 透明容器；`::before` 远脊、`::after` 近脊（各自 clip-path + 树冠点） |
| 3 | `.ground` | 草皮条纹 + 季节小花散点；`::before` 山脚薄雾带，`::after` 蜿蜒土路 |
| 4 | `.mushroom` | 蘑菇屋按钮（见 §4） |
| 5 | `.buildings` / `.fields` | 工坊木牌匾、田垄地块 |
| 6 | `.village::before` | 相位光罩 `--wash`（`pointer-events: none`） |
| 7 | `.village::after` | 粒子画布（花瓣/萤火/落叶/雪，`pointer-events: none`） |

## 4. 蘑菇屋解剖（纯 CSS 拼贴）

```
        ~ ~ ~            ← .cap::after 炊烟（box-shadow 三朵，循环上升）
        ▯               ← .mushroom::before 烟囱（木纹 + 顶檐）
   ╭──────────╮
  ( ●  ●   ● )          ← .cap 菌盖（径向渐变 + 奶油斑点层）
   ╰──────────╯          ← .cap::before 高光月牙；冬季追加雪顶 inset 阴影
  🏮 ┌─◍─┐               ← .stem::after 红灯笼（昼暗夜亮、轻摆）
     │ ▒ │               ← .stem 菌柄；::before 圆窗（昼映天色 --glass，
     │[门]│                  昏夜亮灯 + calc(26px*--lamp-a) 辉光）
   ──┴───┴──             ← .door 木板门 + 金把手；::before 石阶
      ▽▽▽               ← .door::after 门缝灯光洒地（opacity: --lamp-a）
     ▂▂▂▂▂              ← .mushroom::after 接地椭圆影
```

交互：hover 菌盖上浮 3px，active 下压 1px；整个按钮即热区（190×185 ≥ 44px）。

## 5. 组件规范

- **工坊牌匾 `.bldg`**：橡木渐变 + 斜纹木纹 + 两枚黄铜钉（背景层实现），
  刻字用 `text-shadow` 压出凹感；每个 `data-id` 有专属单色 SVG 图记，
  以 `mask` 上色（`background: 米色`），夜晚随令牌自动换色。18 个坊全覆盖，
  未知 id 回落到小屋图记。`.off` 降饱和降亮度表示未建。
- **地块 `.plot`**：耕土渐变随季节相位自动换色。五态各有专属画法：
  `untilled` 杂草 SVG + 碎石；`empty` 耙沟纹理；`growing` 双叶幼苗
  （3.8s 轻摆）；`ready` 金穗 SVG + 金底 + 呼吸光晕（`::after` 光环 +
  1.7s 浮动）；`wilted` 垂头枯秆 + 灰土。开垦按钮 `[data-act="expand"]`
  是虚线框待垦地。
- **面板 `.panel`**：米纸底 + 深木描边 + 四角木钉（`::before/::after`）+
  纸纹叠加；`h2` 是小木匾章节牌。日志 `.log` 每条带叶形符号 +
  淡入动画 + 虚线分隔，细滚动条。
- **顶梁 `.topbar`**：深木横梁 + 横向木纹；品牌名旁挂小灯笼（夜晚辉光变大）；
  资源标签为圆点编码的纸签（金币金、幸福粉、温馨橘、人口蓝）。
- **按钮**：面板与顶梁内按钮统一"小木牌"式样，hover 上浮 + 提亮，
  active 下压 + 内凹阴影。种子按钮附叶片小点。

## 6. 动效规范

预算：村景常驻动画全部走 `transform` / `opacity`（合成器友好，60fps 目标），
唯二例外是 `ready` 光环的 `box-shadow` 呼吸（局部小面积）。

| 名称 | 目标 | 属性 | 时长/缓动 |
| --- | --- | --- | --- |
| drift-clouds | 云层 | translateX（520px 整环无缝） | 90s linear |
| twinkle | 星空 | opacity | 4.5s ease |
| rise-smoke | 炊烟 | translateY + scale + opacity | 4.6s ease-out |
| lantern-sway | 灯笼 | rotate ±4° | 4.2s alternate |
| sway | 幼苗 | rotate ±3.5° | 3.8s alternate |
| bob / glow-pulse | 成熟地块 | translateY / box-shadow | 1.7s |
| fall-drift | 花瓣/落叶 | translate3d 对角（420/360 整环） | 14~17s linear |
| snowfall | 雪 | translate3d 纵向整环 | 13s（冬夜 18s） |
| firefly-drift + flicker | 萤火 | translate3d + opacity | 26s + 3.4s |
| log-in | 日志条目 | translateY + opacity | 340ms ease-out |
| 微交互 | 按钮/牌匾/地块 | translateY ±2px | 160ms `--ease-out` |

粒子画布统一 420×360 平铺，位移取平铺尺寸整数倍保证首尾无缝。

## 7. 粒子矩阵（`src/styles/season.css`）

| | day | dusk | night |
| --- | --- | --- | --- |
| 春 | 花瓣斜飘 | 萤火虫 | 萤火虫 |
| 夏 | （无，晴空） | 萤火虫 | 萤火虫 |
| 秋 | 落叶 | 萤火虫 | 萤火虫 |
| 冬 | 雪 | 雪 | 慢雪（18s、降透明度） |

季节离散特征另有：冬季山脊/菌盖积雪、地块覆霜、土路发白；
黄昏晚霞染云 + 菌盖左侧夕照描边；夜晚月面环形山 + 牌匾灯气。

## 8. 无障碍

- **触控热区**：`tokens.css` 里 `button, select { min-height/min-width: 44px }`
  全局兜底；地块、牌匾、蘑菇屋、顶栏按钮实际都 ≥ 44px。
- **焦点**：`:focus-visible` 3px 金色描边（夜晚换灯黄），offset 2px。
- **对比**：米纸墨字 ≈ 10:1；牌匾米字/深木 ≥ 5:1；地块标签加投影兜底；
  夜晚 UI 切换为暖黑纸 + 米色墨并同步 `color-scheme: dark`。
- **reduced-motion**：全局把动画/过渡压到 0.01ms —— 炊烟、萤火、雪、云
  静止但仍可见，场景叙事不丢失，只去掉运动。
- **prefers-contrast: more**：按钮追加 `currentColor` 描边。
- 粒子与光罩层 `pointer-events: none`，永不挡点击。

## 9. 响应式

### 390px（手机竖屏）

- 顶梁换行：品牌 1.02rem，资源签 0.8rem 圆点纸签可换行。
- 村景 480px 高：蘑菇屋缩至 0.82 靠左，田垄 3 列（56×52，仍 > 44px）
  居右，工坊牌匾变成村口**一条可横滑的木牌廊**（`overflow-x: auto`）。
- 面板坞单列，日志在下。

### 1280px（桌面）

- 舞台加高至 580px，蘑菇屋放大 1.12，田垄 5 列（66×60），
  牌匾群回到村子中部两三排。
- 顶梁与面板坞用 `padding-inline: max(16px, calc((100% - 1240px)/2))`
  居中收拢内容，背景横向铺满。

## 10. 文件地图与写作约定

```
src/styles/
  tokens.css   令牌 + 重置 + 无障碍基线（main.js 首个引入）
  layout.css   骨架与断点；@import 打包下面三件（main.js 第二个引入）
  village.css  村景绘制：天空/山/地/蘑菇屋/牌匾/地块 + 场景关键帧
  panels.css   顶梁/面板/按钮/日志等界面木作
  season.css   季节相位离散特征 + 粒子系统（选择器带 [data-season/phase]，
               靠属性特异性覆盖基础层）
```

- 只有 Fable-2 写 `src/styles/**`；其他角色需要新视觉状态时，
  在 DOM 上给**类名或 data 属性**即可，样式这边接。
- 旧令牌名（`--wood/--wood-dark/--paper/--ink/--gold/--leaf/--sky/--panel/
  --shadow/--radius/--font/--soil`）保留为别名，旧代码不破。
- `@keyframes pulse` 保留（旧类名兼容）。

## 11. 已知空缺（Round 2 候选）

- 相位切换是瞬时换色：CSS 自定义属性未注册 `@property`，渐变无法插值。
  可给关键令牌注册 `<color>` 类型 + transition 做日落渐变。
- NPC / 动物 / 嘉宾在村景里还没有形象（需要 UI 层给挂点元素）。
- 收获时"+N 上浮数字"、播种轻弹等**事件型**动效需要 JS 加临时类名配合。
- 雪的横向摆动、萤火虫更不规则的路径需要更多层或 offset-path。
- 温室/码头等建筑目前只有牌匾，没有村景里的建筑剪影。
