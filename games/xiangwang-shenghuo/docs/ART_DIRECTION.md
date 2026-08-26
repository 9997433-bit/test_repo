# 美术与体验总纲（Fable-2 · Round 1 – Round 3）

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
  layout.css   骨架与断点；@import 打包下面五件（main.js 第二个引入）
  village.css  村景绘制：天空/山/地/蘑菇屋/牌匾/地块 + 场景关键帧
  yard.css     院子剪影层 .xw-yard/.xw-npc（Round 3 新增，见 §12）
  panels.css   顶梁/面板/按钮/日志等界面木作
  season.css   季节相位离散特征 + 粒子系统（选择器带 [data-season/phase]，
               靠属性特异性覆盖基础层）
  ui.css       xw- 前缀界面部件精修（Round 2 新增，@import 序列最后，
               接管 index.html 里 UI 层的素坯兜底样式）
```

- 只有 Fable-2 写 `src/styles/**`；其他角色需要新视觉状态时，
  在 DOM 上给**类名或 data 属性**即可，样式这边接。
- 旧令牌名（`--wood/--wood-dark/--paper/--ink/--gold/--leaf/--sky/--panel/
  --shadow/--radius/--font/--soil`）保留为别名，旧代码不破。
- `@keyframes pulse` 保留（旧类名兼容）。

## 11. Round 2 · 界面部件层（`src/styles/ui.css`）

UI 层曾在 `index.html` 的内联 `<style>` 里给全部 `xw-` 部件铺过素坯兜底
（那份文件不归美术改）。级联顺序是 内联兜底 → tokens → village → panels →
season → **ui.css**，同名同特异度后写者赢，所以 ui.css 能整层接管精修；
唯独带 `#app` 前缀的兜底规则是 UI 层刻意钉死的几何（地块内排版、
牌匾竖排、窄屏错位），特异度带 ID，样式层**不去抢**。

### 部件词汇表

- **进度条 `.xw-bar`**：凿进木头的浅槽（深木底 + 上下沿 inset 高光），
  `> i` 注一线金（`--gold → --gold-bright` 渐变 + 微辉光）。
  生长中的地块条是青的（`.plot.growing`），熟了、经验条、工单条是金的；
  做好的工单（`.xw-job.done`）转叶青。顶栏经验条要剥掉 `.meters span`
  的药丸壳（`.meters .xw-bar` 覆写 + `::before` 圆点摘除）。
- **小木牌按钮 `.xw-topbtn`**：与 `.panel button` 同一套橡木配方。
  底色走自定义属性 `--face`，hover 只举起不换木色（兜底的 hover 会换纸底，
  这里用同名选择器按住）；`.is-go` 金漆牌配深墨字（送去/收走），
  `.is-on` 染叶青（客人已入住），`:disabled` 统一褪色 + 不再起跳。
  顶栏里的 `.topbar .xw-topbtn` 是"刻进房梁的凹槽"变体，字色钉死米色
  ——夜里 `--paper` 变暗纸，绝不能拿它当字色。
- **种子纸包 `.xw-seed`**：米纸包 + 细木描边；`.is-on` 金纸打包、
  外圈金环、字色钉死深墨（防夜里米墨上金底）；`.off-season` 虚线封口 +
  半灰（受潮）；`.is-poor` 价签见红。`.k` 是键位小木块，
  `.xw-price` 自带小铜钱圆点。
- **工具架 `.xw-toolbar`**：与面板同配方的窄木框米纸，`grid-column: 1/-1`
  横跨面板坞两列；**必须 `min-width: 0`**——种子架窄屏横滑
  （`overflow-x: auto`）后，它的 min-content 仍会顺着 工具架→面板坞
  的链条把整页撑到一千多像素。
- **村景字牌**：`.xw-roof` 屋名圆牌、`.xw-scene-tip` 村口一句话，
  都是"纸片钉木边"，颜色全走令牌，昼夜自动换；tip 在 z=8，
  骑在相位罩和粒子之上。
- **牌匾附件**：`.xw-badge` 红灯笼角标（描边 + `--lamp-a` 联动辉光）、
  `.xw-sub` 副题、`.bldg.xw-more` 图纸本（虚线框 + 卷册图记）、
  `.bldg.is-open` 追加一圈灯气（描边色归 UI 层的 `#app` 规则）。
- **心愿单 `.xw-wish`**：虚线纸条；`.can` 换实线金边 + 金晕。
  `.xw-need` 药丸默认淡墨底，`.ok` 转叶青并加 "✓" 前缀。
- **气泡 `.xw-toast`**：檐下小木匾（深木纹 + 米字 + `--lamp-a` 暖光圈），
  固定底部居中 z=40；`.show` 淡入上浮，`.bad` 换火红木。
- **引导卡 `.xw-tut`**：信纸 + 左侧灯芯色书签（夜里透光），fixed 右下
  z=45；`.xw-dot.on` 柿橙点。`.xw-hint` 是呼吸金圈——基态就有 outline，
  reduced-motion 冻结后提示仍在（别用纯动画表达状态）。

### 收获飘字 `.xw-fx`（事件型动效契约，Round 3 增艳）

UI 层已接线（screens.js `spawnFloat`：收获时挂在那块 `.plot` 上，
找不到地块就退到 `.village` 居中飘，1200ms 后移除节点）：

```html
<button class="plot ready">…<span class="xw-fx">+2 稻米</span></button>
```

- append 到任意 position 非 static 的容器（`.plot`、`.panel` 都行）；
- 900ms `fx-float` 上浮淡出后停在透明，**节点由挂它的人在 ≥1s 后移除**；
- 默认金字，扣减用 `.xw-fx.bad`（火红）；
- 同容器连发多条时，用内联 `style="--fx-dx:10px;--fx-dy:-8px"`
  把后来的错开（错位量走独立 `translate` 属性，不碰关键帧）；
- reduced-motion 下静止显示、不上浮，信息不丢。

Round 3 增艳：字号 15.5px；换成**真描边**（`paint-order: stroke fill` +
`-webkit-text-stroke` 3.5px 深墨，text-shadow 只留暗晕兜底），金字压在
金色熟地、雪地、夜草上都读得清；节奏改为 弹出带过冲（14% 处 1.18 倍）→
26%~62% 停稳可读的一拍 → 上浮 34px 淡出，总时长仍 900ms，移除契约不变。

### 夜景对比度（Round 2 补丁）

- **根修复**：`body` 的 `color: var(--ink)` 在 `#app` 之外解析，
  吃不到夜晚换墨——`.dock` 在相位作用域内重申 `color: var(--ink)`，
  心愿标题、配方名这些没写死颜色的字夜里才不会缩进暗纸。
- 夜里田垄：描边提亮、标签换 `#f9f0da` + 深影，苗株 SVG
  `brightness(1.4)` 打一点月光（season.css）；熟地保持深墨字。
- `.xw-need` 夜里底色加深一档；写死字色的部件（顶栏按钮、is-on 种子、
  is-go 金牌）一律"米字深底 / 深字金底"，不跟令牌翻转。

### 390 顶栏

≤420px 时顶梁只收紧衬距与字号（layout.css），所有按钮仍锁
`min-height: 44px`；种子架转横滑木廊，键位提示（键盘专属）收起。

### 枯萎地块（Round 2 加笔）

灰土底上加两道 `background-size` 圈住的短裂缝 + 枯草屑，
秆子 SVG 垂头 5° 并降饱和，标签换干草色——和荒地(深土杂草)、
空地(耙沟)一眼分得开，翻土提示照旧。

## 12. Round 3 · 院子剪影层（`src/styles/yard.css`）

DOM 挂点已由 UI 层落地（screens.js `renderYard`，挂在 `.buildings`
与 `.fields` 之间），本层负责全部视觉。落地版 DOM：

```html
<div class="xw-yard" data-ref="yard" aria-hidden="true">
  <i class="xw-npc" data-kind="guest" data-id="aunt_grove"></i>
  <i class="xw-npc" data-kind="pet"   data-id="hua"  data-pet="dog"></i>
  <i class="xw-npc" data-kind="pet"   data-id="tuan" data-pet="cat"></i>
  <i class="xw-npc" data-kind="chick"></i>   <!-- 鸡舍建成后 -->
  <i class="xw-npc" data-kind="sheep"></i>   <!-- 羊圈建成后 -->
  <i class="xw-npc" data-kind="cow"></i>     <!-- 牛棚建成后 -->
</div>
```

- **kind 词表（落地版）**：`guest`（戴笠帽的村客）/ `chick` /
  `sheep` / `cow` / `pet`（配 `data-pet="dog|cat"` 分狗猫）。
  样式层另认 `chicken`、`dog`、`cat` 别名；未知 kind 回落为 guest。
  `data-id` 只作日后逐人上色的钩子，样式层不强依赖。
- **与兜底层的分工**：index.html 内联样式给过一版素坯（左下角
  flex 木凳 + `--sil` 背景剪影 + `xw-amble`）。yard.css 在级联更后端
  整层接管：容器按回 `inset:0` 全村铺开（`max-width:none`）、
  清掉 `--sil` 背景/0.72 透明度/整体投影、`nth-child(2n/3n)` 的
  节拍改写用 `(0,2,0)` 基体选择器按住；猫要 `(0,3,0)` 的
  `[data-kind="pet"][data-pet="cat"]` 才压得过兜底体格。
- **画法**：单色剪影 = `::before` 上的内联 SVG mask + 令牌色；
  `::after` 是不参与 mask 的贴地椭圆影。体格：客人 34×56、
  牛 48×35、羊 40×31、狗 34×30、猫 24×30、鸡 26×23（px）。
- **站位**：前 8 个孩子按 `nth-of-type` 派座（房前空地、牌匾廊下的
  前景草带、路边），派座不认物种；UI 层可用内联
  `style="--x:38%;--y:5%;--flip:-1"` 覆写（`--flip` 走独立 `scale`
  属性，不会被动画 transform 冲掉）；第 9~10 个叠在村中兜底,
  **第 11 个起 display:none** 防刷屏。窄屏（≤760px）整体缩至 0.8、
  改派中带站位、只站 6 只——兜底层在窄屏直接藏院子是对它自己的
  左下 flex 条而言，本层站位已避开牌匾与田垄，故保留剪影。
- **相位换装**：白日深椒褐（随季节植被微调）；黄昏暖褐 + 左侧
  2px 夕照金边（落日在画面左下）；夜晚月光青灰 + 淡灯晕
  （`drop-shadow` 作用在 mask 之后，勾的是剪影轮廓）；
  冬季雪地上天然高对比，无需补丁。
- **动效**（全 transform/opacity，负延迟 `--seed` 错拍防齐步走）：
  入场 `npc-in` 500ms 淡入；客人 `npc-wander`（±9px 踱步）+
  `npc-bob`；鸡 wander + `npc-peck`（停一停快啄两口）；
  牛羊定点 `npc-graze`（埋头久、抬头缓）；狗 wander + `npc-hop`
  （隔几秒连蹦两下）；猫定点 `npc-sway` 慢摆。
  reduced-motion 下全局归零，剪影静止站在原地，信息不丢。

## 13. 剩余视觉空缺（Round 3 收尾时点）

- 心愿「送去」成功一刻缺庆祝动效（纸条飞走/金币迸溅）。
  `spawnFloat` 已能往地块/村景挂 `.xw-fx`，交单处只要发一条带
  `text` 的 fx 信号（如 `+40 金`）即有基本反馈；纸条飞走类
  大动效需要 UI 层给临时类名。
- 嘉宾剪影暂不逐人差异化（六位共用村客画法），`data-id`
  钩子已留，后续可按人加配色/佩饰变体。
- 相位切换是瞬时换色：可给关键令牌注册 `@property <color>` +
  transition 做日落渐变（注意别与差分渲染打架）。
- 雪的横向摆动、萤火虫更不规则的路径需要更多层或 offset-path。
- 温室/码头等建筑只有牌匾，没有村景里的建筑剪影；
  温室地块只有 🏠 emoji 标记（DOM 在 UI 层）。
- 剪影动画依整表重绘节流（`renderYard` 每次 setHtml 会重启
  `npc-in`/负延迟），若未来村景改为高频重绘需换 key 复用节点。
