# 异掌 · 美术方向（LOOK-R1 · 固定人物视角轮增补）

> 依据 `docs/VISUAL_HANDBOOK.md`（强制）与 `DESIGN_SEED.md` 视觉章。
> 底座 **B 风格化精品**（手册 §3.2），全程不混底座 A / C，不使用本仓库
> 水墨 / 墨戏系兄弟游戏的任何视觉语言。
> 本文档是渲染（Opus-2）、UI（Opus-4）、VFX 的验收依据；
> `src/styles/**` 是 **唯一正式 HUD 主题**（Round 2 起单一事实来源），
> DOM 契约见 §11，shell.css 迁移映射见 §12。
> **HUB-R1 新增**：§13 安全区大厅美术（走道 / 台座 / 展掌 / idle 特效 /
> 传送门），§14 大厅 HUD 视觉合同（`.yz-inspect` / 门提示 / 配装条 /
> 触控确认，落地在 `src/styles/hub.css`）。
> **HUB-R2 新增**：§15 角色皮肤（SkinDef 枚举 → 低面数件的渲染合同 +
> 2D 选皮肤条外观，落地在 `src/styles/menus.css`），§16 裂岛战斗 VFX
> （`src/data/vfx.js` 参数表的视觉终稿，与 §13.4 idle 关键词同韵）。
> **HUB-R3 新增**：§17 预算下的 idle 盲辨合同（HV-04 记分协议 +
> O2 W1 降耗互锁：写清降 draw/tris 时允许砍什么、不许砍什么）。
> **LOOK-R1 新增**：§18 固定人物视角（V 切换一瞬反馈 `.yz-look-flash` /
> `#hud[data-look]` 微指示 / 设置项同纸感 / 过门淡场与机位 snap
> 合拍，落地在 `src/styles/hud.css` 与 `hub.css`），§16.0 补挥击轴
> （扇击 = 水平横抽 左→右，禁上撩/下劈读向）。

## 0. 一句话定调

**暮色裂岛上的一场体面的巴掌架**：克制的暮蓝世界，被打裂的台面渗出暖金，
唯一放肆的饱和色，是你手上那只活手套。

三支柱（手册开篇四件事的本项目化）：

1. **克制** — 全局 4 个色相家族 + 1 个动态识别色；一屏一个饱和峰值。
2. **材质物理** — 手套的皮革 / 金属 / 布料 / 磨损四层分离；UI 也回答「我是什么材质」。
3. **叙事痕迹** — 岛被打过、修过、又裂开；手套被戴过、磨亮过。没有崭新的东西。

---

## 1. 色彩系统

### 1.1 基底色板（token 见 `src/styles/tokens.css`）

| 家族 | 用途 | 关键值 | 纪律 |
| --- | --- | --- | --- |
| 暮蓝 ink/dusk | 天空、底色、玻璃底 | `#0b101c` `#1a2433` `#31415c` `#5d7093` | 全部去饱和，永远不与识别色抢眼 |
| 钢灰 steel | 磨损金属框、刻线（暮蓝同族） | `#39424e` `#6b7684` `#9aa4b0` | 只做框与结构，不做大面积填充 |
| 骨白 bone | 文字、数字、准星 | `#f0ebdf` `#cfc8b8` `#9a927f` | 偏暖象牙，禁纯白 `#fff` 大面积 |
| 暖金 gold | 台面裂纹、觉醒、胜利 | `#eec678` `#cf9b45` `#8f6a2a` | 环境用色偏哑；只在裂纹、觉醒条、结算冠军行出现 |
| 绛红 danger | 死亡播报、退出确认 | `#a5524a` | 去饱和氧化红，一屏最多一处 |

配比按手册 §2-16 的 **70 / 25 / 5**：暮蓝家族 ≈70%，钢灰+骨白 ≈25%，
暖金+识别色 ≈5%。

### 1.2 饱和法（硬约束）

**全屏唯一饱和峰值 = 当前手套识别色 `--yz-accent`。**

- 天空、岛体、UI 基底全部去饱和；暖金裂纹属于环境层，饱和度压在识别色之下。
- 副掌卡、未选中的选掌 tile、他人相关信息一律 `saturate(0.3~0.55)` 退后。
- 换掌 = 换峰值：JS 改容器 `data-glove`，一次改动全 UI 跟随。

### 1.3 八掌识别色（UI 唯一来源：`tokens.css` 的 `data-glove` 映射）

| id | 名 | 识别色 | 意象 |
| --- | --- | --- | --- |
| cotton | 木棉 | `#e2604a` | 木棉花的珊瑚红，布面暖 |
| granite | 磐石 | `#cf8a3b` | 赭石断面的矿橙 |
| gale | 疾风 | `#55c07f` | 掠过苔原的绿 |
| frost | 冰霜 | `#56b8d6` | 薄冰下的青 |
| spring | 弹簧 | `#b4c53f` | 苇黄绿，带铜簧劲 |
| afterimage | 分身 | `#9d80e0` | 暮色残影紫 |
| magnet | 磁掌 | `#d8639e` | 磁极洋红 |
| meteor | 陨掌 | `#7d8bf0` | 坠落轨迹的星蓝 |

选掌界面是唯一允许多识别色同屏处，但未选中 tile 已在 CSS 中统一降饱和，
峰值始终落在已选主掌上。

注（HUB-R1 实测）：`src/data/gloves.js` 的 `color` 字段（F3 域）与本表
已出现偏差（如木棉 `#e3c988` ≠ `#e2604a`）。HUD / 样式一律走
`data-glove` → token 取色，不直读 `gloves.color`；行内 `--row-color` /
`--yz-accent` 兜底照旧可用。两表合一需与 F3 协调后另轮处理，
本方不越权改 `src/data/**`。

---

## 2. 光照法（给 Opus-2 渲染的合同）

规则一条：**光要有来源、有方向、有目的**（手册 §5）。

- **主光**：暮空冷蓝天光，方向固定（右上 40° 左右），投影形状经过设计。
- **反弹**：台面裂纹的暖金从下往上给角色底面染色 —— 阴影不是黑，是被金染的暗。
- **分离**：角色与背景用**边缘光**（rim）分离，禁止发光描边（手册 §2-4、§5.4）。
- **Bloom**：只允许出现在真实高亮发光体（裂纹芯、觉醒手套灼点），禁全屏 bloom。
- **觉醒表现**：当前手套的识别色饱和 + 亮度短暂上抬，配一圈随形 rim；不做全屏滤镜。
- 阴天化处理慎用：暮色天光已足够低反差，靠粗糙度差异撑材质（手册 §5.10）。

## 3. 材质法

角色低面数几何体不是借口：**低面数 + 廉价 shader 才廉价**（手册 §2-8），
倒角、粗糙度分离、顶点色做旧都要有。

| 对象 | 材质分离要求 |
| --- | --- |
| 手套（比头大） | 掌背皮革（哑光、折痕处微亮）/ 指节金属护片（边缘磨亮、凹处氧化）/ 腕口织物（轮廓绒毛感）/ 掌心磨亮包浆 —— 四种粗糙度肉眼可分 |
| 角色身体 | 布料为主，剪影可读（灰度测试过关），关节处褶皱聚集 |
| 裂岛台面 | 玄武岩分层 + 凿痕；**裂纹是金缮逻辑**：旧裂被暖金填过，新裂沿旧伤再开；中心被打斗磨亮，边缘风化起毛 |
| 低护栏 | 木 + 铁箍，扶握处包浆变深，铁箍锈从缝隙向下流（手册 §4.11） |
| UI | 磨砂暗玻璃 + 1px 顶部受光 + 磨损钢框 + 拉丝微纹理（已在 CSS 落实，`.yz-plate`） |

叙事痕迹自查：任一资产要能回答「谁用过它」（手册 §14-12）。

## 4. 字体系统（Round 3 · 零外链）

铁律一：**HUD 不落默认系统字体**（手册 §2-6、§9）——「默认」指未设置
`font-family` 或落回无设计的 Arial / 默认 sans；本节的**精品系统栈**是
逐字面挑选、逐平台落位的设计结果，不属此列。
铁律二：**零 CDN 字体（红线 R-13）**。Round 2 的两条字体外链 `@import`
已从 `src/styles/index.css` 拔除；`rg -n "googleapis|gstatic" src/styles`
零命中。不发一个字体网络请求：断网、首帧、弱网渲染完全一致，
无 FOIT / FOUT，也不再需要 `display=swap` 与 preconnect。

| 层 | 栈 | 用途 |
| --- | --- | --- |
| 展示 `--yz-font-display` | Rajdhani → Bahnschrift → DIN Alternate → Avenir Next Condensed → Roboto Condensed → Noto Serif SC → Source Han Serif SC → Songti SC → STSong → SimSun → serif | 标题、按钮、掌名、中央短讯 |
| 正文 `--yz-font-text` | PingFang SC → Hiragino Sans GB → Source Han Sans SC → Noto Sans SC → Microsoft YaHei → sans-serif | 说明、挑战文案、弹窗正文 |
| 数字 `--yz-font-num` | Rajdhani → Bahnschrift → DIN Alternate → Avenir Next Condensed → Roboto Condensed → PingFang SC → Microsoft YaHei → sans-serif | 计时、杀数、冷却；一律 `tabular-nums` 不跳宽 |

展示层的设计意图不变：拉丁 / 数字落 **Rajdhani 系几何工业体**，
中文落**宋**（Noto Serif SC / 思源宋 / Songti SC 系），
「机械刻度 × 碑帖笔意」的对撞是本作 HUD 的识别点。逐平台落位：

| 平台 | 拉丁 / 数字命中 | 中文命中 |
| --- | --- | --- |
| Windows 10+ | Bahnschrift（DIN 1451 血统、变量字重，与 Rajdhani 同为窄几何工业体） | SimSun（宋体兜底；装了思源宋则优先） |
| macOS / iOS | DIN Alternate（仅粗面，600 请求就近匹配真字面）→ Avenir Next Condensed（全字重几何窄体） | Songti SC / STSong |
| Android | Roboto Condensed | Noto Serif CJK（有装则中）→ serif |
| Linux | 常见装有 Rajdhani / Roboto Condensed 之一 | Noto Serif CJK SC |

规则三条：

1. 栈首 `"Rajdhani"` 只在本机已安装时命中，**不触发任何加载**；
   任何回退命中都仍是有设计的几何窄体或宋体，永远不落 Arial。
2. 全局 `font-synthesis: none` 禁伪粗体：宋体系单字重字面合成加粗
   会把小字号汉字糊成墨块，宁可就近匹配真字面。
3. 数字层几何段与展示层完全一致（数字字形跨层统一），
   中文回退走黑体 —— 数字旁的单位字不宜落宋。

选型记录：站酷小薇经实测「回」等常用字形退化为墨块，已否决；
Round 2 曾走字体 CDN 外链（命中 R-13），Round 3 拔除，
若未来需要 100% 像素一致再走**自托管**子集 woff2（禁回 CDN）。
遗留清理（归属 Opus-4，本方不碰 `index.html`）：`index.html` 头部
两条字体域 preconnect 已成死链提示，请在 Opus-4 回合摘除。

## 5. HUD 布局法

- **8px 网格**：所有间距用 `--yz-s*` token，4px 仅作半步。
- **70% 净空**：HUD 只贴边带与角落，屏幕中心 ≥70% 无 UI。预算：
  顶带 ≤48px 高；左上战况列 ≤128px 宽；左下坞 ≤88px 高；
  右上播报 ≤44vw 宽；顶部提示条一次一条；中心仅 4px 准星点。
- **信息层级**：一屏一个主操作；字重 / 明度 / 尺寸三者共同表达层级，不靠颜色堆。
- 受击反馈 = 一瞬**去饱和**（`.yz-hit-flash`），禁满屏红晕（手册 §9.2）。

横屏（主战布局）：

```
┌────────────────────────────────────────────┐
│ ◇◇◇◇◇◇◇ 击杀     04:00 计时        ‖ 暂停 │  顶带 ≤48px
│                                  击杀播报 ↓ │
│                                            │
│                 ≥70% 净空                  │
│                  · 准星                    │
│                                            │
│ ┌掌意条════▷  觉醒┐                        │
│ │ [主掌][副掌]卡  │        （触屏时坞居中） │  左下坞 ≤88px
└────────────────────────────────────────────┘
```

竖屏（可用布局）：顶带不变；掌意条移至顶带下方居中；双掌卡缩小挂左上；
坞让出下半屏给摇杆与按钮簇。CSS 已按 `@media (orientation: portrait)` 自适应。

## 6. 触控规范

- 扇击钮 **≥72dp**（实做横屏 88px / 竖屏 76px）；技能 52~56px；换掌 / 冲刺 / 跳 **≥48dp**。
- 左下 `.yz-stick-zone` 为触点落区：摸哪杆在哪，闲置时半透明落点提示。
- 右侧空白 = 相机拖拽，直接落在 `#gl`（`touch-action: none` 已设）。
- 全部锚点走 `env(safe-area-inset-*)`（token `--yz-inset-*` 已封装）。
- 触控钮同样材质化：玻璃盘 + 钢圈 + 机加工内槽，按下沉入（缩放 + 提亮），
  不做发光按钮。
- 横屏优先设计；竖屏簇收紧但不低于最小尺寸。

## 7. VFX 纪律（给技能特效的合同）

按手册 §10：粒子有**形状、衰减、残留**，禁纯色光球与加法糊屏。

| 掌 | 特效方向（识别色只做点缀，不做整团染色） |
| --- | --- |
| 木棉 | 掌风压出的尘环 + 布纤维碎屑飘落 |
| 磐石 | 砸地：石屑抛物线 + 尘幕滞留 + 金缮裂纹从落点蔓延 |
| 疾风 | 冲刺残迹是被扰动的尘与草屑，不是拖尾光带 |
| 冰霜 | 霜沿地面枝晶生长（decal），冷雾贴地滚，冻结有冰壳厚度 |
| 弹簧 | 反击瞬间的金属簧圈形变 + 一声灰尘弹起 |
| 分身 | 残影保留姿态的「动作历史」，边缘先散（手册 §10.4），无蓝色光柱 |
| 磁掌 | 被拉者脚下拖出擦痕，空中尘埃被吸成弧线 |
| 陨掌 | 腾空遮蔽脚下光 → 落点冲击环掀尘 + 台面真的裂（与碎地系统联动） |

事后痕迹必查：尘、裂、擦痕至少留一样（手册 §14-13）。

## 8. 动效

- 缓动统一 `--yz-ease`（落定曲线），**禁弹跳**（手册 §9.4）。
- 时长 token：120 / 220 / 420ms；HUD 反馈用 fast，屏幕切换用 med。
- 打击感（hit-stop、震屏）属 sim/render 域，本文只约束：震屏幅度与质量挂钩，
  轻掌不震屏。
- **弱动效**：`prefers-reduced-motion` 或手动 `data-reduced-motion="1"` 时，
  扫光 / 脉动 / 入场动画全部直达终态（CSS 已落实）。

---

## 9. 拒收清单（Reject Criteria，评审逐条打勾）

来自手册 §2 十六条廉价信号 + §9/§12 UI·VFX 条目。**命中任何一条即拒收退改**；
命中 3 条以上优先修光照与材质（§2 第 1、7、10 条）。

1. 塑料高光：所有材质一个反光度，无粗糙度分离。
2. 纯色平面：大面积无变化填充色，无色相微偏移 / 脏迹。
3. 全图过饱和：饱和不受限、不聚焦。
4. 廉价发光描边：角色 / 物品 / UI 一圈纯色 glow。
5. 居中摆拍、正面对称、贴纸式等距摆放。
6. UI 默认系统字体（未设置 font-family、或落回无设计的默认栈）。
7. 均匀平光：光无方向、无来源、无阴影设计。
8. 低多边形硬边 + 塑料着色（无倒角、无法线细节）。
9. 贴图重复肉眼可见，无贴花 / 污渍层破除。
10. 皮肤 / 手套蜡感硅胶感，无 SSS、无分区。
11. 特效纯色光球 / 加法混合糊一片、无残留。
12. 背景空无一物或道具随机摆放，无使用痕迹。
13. 万物崭新零磨损。
14. Bloom 滥用、全屏泛光遮细节。
15. 配饰 / 手套无重量感、无佩戴逻辑（手套虽大于头，仍须有腕带受力）。
16. 色板互相打架，无 70/25/5 层级，多个饱和峰值同屏。
17. （UI 追加）纯白描边、双色线性渐变 + 高光斜杠按钮、OS 风按钮、金币宝石角标。
18. （UI 追加）受击用满屏红晕闪烁而非去饱和。
19. （VFX 追加）技能光不照亮施法者与环境（无环境光响应）。
20. （本作专项）出现水墨 / 宣纸 / 留白式兄弟游戏视觉语言；混用底座 A / C。

验收动作对照手册 §14 清单：灰度剪影测试、光源指认、材质三问、
饱和峰值唯一性、崭新检查、字体检查必做。

---

## 10. 交付物与文件结构

```
games/yizhang/src/styles/
├── index.css    入口（纯本地 @import，零外链零网络请求）
├── tokens.css   :root 设计令牌 + 8 掌识别色 data-glove 映射
├── fonts.css    精品系统字体栈 token + .yz-display / .yz-num 工具类
├── base.css     重置、#gl 画布、.yz-plate 玻璃材质、焦点、弱动效
├── layout.css   #hud 壳、安全区、公共关键帧
├── hud.css      顶带 / 战况列 / 播报 / 掌位坞 / 掌意条 / 冷却排 /
│                受击 / 重组 / 中央短讯 / 顶部提示 /
│                视角模式一瞬反馈 + 准星锁刻（LOOK-R1，§18）
├── touch.css    虚拟摇杆 / 按钮簇（72dp 扇击、48dp 其余）
├── menus.css    配装大厅 / 选掌 / 选皮肤条（§15.6）/ 暂停 / 设置 /
│                键位表 / 结算 / 弹窗 / 分段选择 / 降级提示
└── hub.css      安全区大厅 HUD（区名带 / .yz-inspect 说明牌 / 配装条 /
                 门提示 / 触控「选」/ 门内过渡）——末位 @import，
                 后注入压制 O4 的 src/ui/hub.css 兜底件（§14.4）
```

接入方式（Opus-4）：`import "./styles/index.css";` —— 一行即可。

## 11. DOM 契约（Round 2 · 单一事实来源）

> `src/styles/**` 是唯一正式 HUD 主题；`src/ui/shell.css` 降级为
> critical fallback（Opus-4 所有，本方只读）。Opus-4 把 `src/ui/**`
> 的节点改挂本节类名即可完成切换，样式零改动。本节覆盖一场完整
> 对局所需的全部界面：配装菜单、局内 HUD（掌意 / 冷却 / 战况 /
> 播报）、触控（摇杆 + 72dp 扇击）、暂停 / 设置、结算、降级提示。
> 大厅（HUB-R1）新增的 hub HUD 节点结构见 §14.1。

### 11.1 全局钩子

| 钩子 | 设在哪 | 作用 |
| --- | --- | --- |
| `data-glove="<id>"` | `html` / `#hud` / 掌卡 / 掌位 / tile | 切换 `--yz-accent` 识别色（子树生效） |
| `--yz-accent`（行内） | 任意容器 | 兜底：直接写色值（如 `player.color`），效果同上 |
| `data-touch="1"` | `html` / `body` / UI 根 | 显示触控层；隐藏键位章 `.yz-kbd` 与键位表 `.yz-keys` |
| `data-reduced-motion="1"` | `html` | 手动弱动效（设置项） |
| `[hidden]` | 任意屏幕 / 浮层 | 唯一显隐开关（`display:none !important`） |

结构 id 与工具类：`#gl`（全视口画布，暮蓝渐变占位）·
`#hud`（战斗 HUD 层，默认不吃指针）· `#app`（UI 挂载根，样式不干预；
根节点保留 `class="yz"` 亦可，本表已把它的字体/颜色重指到令牌）·
`.yz-plate`（磨砂玻璃材质）· `.yz-tap`（HUD 内可点元素）·
`.yz-display` / `.yz-num`（展示字 / 等宽数字）· `.yz-scroll`（可滚区）。

### 11.2 主菜单（配装大厅）

```html
<div class="yz-screen yz-screen--deep">           <!-- [hidden] 切屏 -->
  <div class="yz-lobby">
    <div class="yz-lobby-head">
      <h1 class="yz-title">异掌</h1>
      <div>
        <p class="yz-subtitle">ROUND 2 · 竖切</p>
        <p class="yz-intro">第三人称浮空擂台。选两只手套进裂岛……</p>
      </div>
    </div>
    <div class="yz-loadout">                       <!-- 双掌位 -->
      <button class="yz-slot is-active" data-glove="cotton" type="button">
        <span>主掌 · 1</span><b>木棉</b><em>标准 · 掌风冲拳</em>
      </button>
      <button class="yz-slot" data-glove="frost" type="button">…</button>
    </div>
    <div class="yz-scroll">
      <div class="yz-glove-grid">                  <!-- 8 张掌卡 -->
        <button class="yz-plate yz-glove-tile is-main" data-glove="cotton" type="button">
          <span class="yz-glove-tile-top">
            <span class="yz-glove-icon"><span class="yz-glove-swatch"></span></span>
            <span><span class="yz-glove-name yz-display">木棉</span>
                  <span class="yz-glove-role">标准型</span></span>
          </span>
          <p class="yz-glove-skill">掌风冲拳：短前冲 + 小击退。</p>
          <small class="yz-glove-awaken">觉醒 · 掌风范围翻倍</small>
          <small class="yz-lock-note">已解锁 · 布面</small>
        </button>
        <!-- 未解锁：class="… is-locked" + disabled；lock-note 写挑战文案 -->
      </div>
    </div>
    <div class="yz-lobby-foot">
      <button class="yz-btn yz-btn--primary" type="button">进 裂 岛</button>
      <button class="yz-btn yz-btn--ghost" type="button">设 置</button>
      <span class="yz-hintline">Q 键在局内切换主副掌……</span>
    </div>
  </div>
</div>
```

双选流程钩子：待填掌位挂 `.is-active`；tile 状态 `.is-main` /
`.is-off` / 同掌双位 `.is-main.is-off`（角章自动出「主·副」）/
`.is-locked`（+`disabled`）。掌位与 tile 都设 `data-glove`，
识别色边沿自动跟随；行内 `--slot-color` 兜底可用。

### 11.3 局内 HUD（父容器 `#hud`；状态类设在 `#hud` 上）

```html
<div id="hud" data-glove="cotton">   <!-- .is-dead / .is-awakened -->
  <div class="yz-hud-top">
    <div class="yz-kill-track">
      <i class="yz-kill-pip is-filled"></i> ×7
      <span class="yz-kill-count yz-num">2/7</span>
    </div>
    <div class="yz-plate yz-timer yz-num">3:41</div>   <!-- .is-low ≤30s -->
    <button class="yz-btn-pause yz-tap" type="button" aria-label="暂停"></button>
  </div>

  <div class="yz-score">                          <!-- 全员战况，按杀排序 -->
    <div class="yz-score-row is-me" style="--row-color:#e2604a">
      <span class="yz-score-name">你</span><b class="yz-score-kills yz-num">2</b>
    </div>
    <div class="yz-score-row is-dead" style="--row-color:#56b8d6">…</div>
  </div>

  <div class="yz-feed">                           <!-- 击杀播报，右上 -->
    <div class="yz-plate yz-feed-item is-me"><strong>你</strong> 扇出岛 <strong>铁头</strong></div>
  </div>

  <div class="yz-glove-dock">                     <!-- 掌位坞 -->
    <div class="yz-meter" style="--meter:.62"><i class="yz-meter-fill"></i></div>
    <span class="yz-awaken-tag yz-display">觉 醒</span>
    <div class="yz-status-row">
      <span class="yz-plate yz-status-chip">冻结 1.2s</span>
    </div>
    <div class="yz-dock-row">
      <div class="yz-plate yz-glove-card is-active" data-glove="cotton">
        <span class="yz-glove-icon"><span class="yz-glove-swatch"></span></span>
        <span class="yz-glove-name">木棉</span><span class="yz-kbd">1</span>
      </div>
      <div class="yz-plate yz-glove-card" data-glove="frost">…</div>
      <div class="yz-cd-strip">                   <!-- 桌面冷却排；触屏自动隐藏 -->
        <span class="yz-cd-slot" style="--cd:.4"><b>扇</b><span class="yz-cd"></span></span>
        <span class="yz-cd-slot is-off"><b>技</b><span class="yz-cd"></span></span>
        <span class="yz-cd-slot"><b>冲</b><span class="yz-cd"></span></span>
      </div>
    </div>
  </div>

  <div class="yz-reticle"></div>
  <div class="yz-hit-flash"></div>                <!-- .is-on ≈120ms 去饱和 -->
  <div class="yz-plate yz-respawn">               <!-- #hud.is-dead 时自动显示 -->
    <div class="yz-respawn-title">重 组 中</div>
    <div class="yz-respawn-num yz-num">2.4</div>
    <div class="yz-respawn-sub">秒后回台</div>
  </div>
  <div class="yz-plate yz-center-note is-gold" hidden>木棉 觉醒</div>
  <div class="yz-toast">画质 MID · 自动 54fps</div> <!-- .is-on 显示；.is-gold 金 -->
</div>
```

状态与变量（JS 只碰这些）：

| 钩子 | 设在哪 | 语义 |
| --- | --- | --- |
| `#hud.is-dead` | `#hud` | 亡语：出重组浮层 + 持续去饱和 |
| `#hud.is-awakened` | `#hud`（或坞） | 掌意条转金扫光 + 觉醒章出现 |
| `--meter: 0..1` | `.yz-meter` | 掌意充能（觉醒中恒 1） |
| `--cd: 1→0` | `.yz-cd-slot` / 触钮 / swatch | 冷却剩余占比，conic 罩自动收拢 |
| `.is-low` | `.yz-timer` | 残局 ≤30s 呼吸 |
| `.is-filled` | `.yz-kill-pip` | 刻痕点亮 |
| `.is-me` / `.is-dead` | `.yz-score-row` | 本机行 / 重组中行 |
| `--row-color`（行内） | `.yz-score-row` | 玩家身份色（`player.color`） |
| `.is-me` | `.yz-feed-item` | 与本机相关的播报 |
| `.is-active` | `.yz-glove-card` | 当前出手掌 |
| `.is-off` | `.yz-cd-slot` | 该掌无主动技 |
| `.is-on` / `.is-gold` | `.yz-toast` | 显示 / 金色（觉醒、解锁） |
| `.is-on` | `.yz-hit-flash` | 受击一瞬 |
| `.is-gold` | `.yz-center-note` | 解锁 / 觉醒中央短讯 |
| `data-look="locked\|free"` | `#hud` | 视角模式装饰镜像（值 = `input.getLookMode()`，权威仍在 input）：locked 时准星两侧出 1px 短刻（§18.2） |
| `.is-on` | `.yz-look-flash` | V / 设置切换后的一瞬模式反馈（~0.9s 后 JS 移除，§18.1） |

### 11.4 触控层（父容器 `.yz-touch`，`[data-touch="1"]` 显示）

```html
<div class="yz-touch">
  <div class="yz-stick-zone">                     <!-- 左下走位落区 -->
    <div class="yz-stick"><div class="yz-stick-nub"></div></div>
  </div>
  <div class="yz-cluster">                        <!-- 右下按钮簇，grid-area 已排 -->
    <button class="yz-tbtn yz-tbtn--jump"   type="button"><b>跳</b><small>SPACE</small></button>
    <button class="yz-tbtn yz-tbtn--skill"  type="button"><span class="yz-cd"></span><b>技</b><small>E</small></button>
    <button class="yz-tbtn yz-tbtn--dash"   type="button"><b>冲</b><small>SHIFT</small></button>
    <button class="yz-tbtn yz-tbtn--switch" type="button"><span class="yz-cd"></span><b>换</b><small>Q</small></button>
    <button class="yz-tbtn yz-tbtn--slap"   type="button"><b>扇</b></button>
  </div>
</div>
```

- 摇杆：触点落区内 JS 写 `.yz-stick` 的 `--x/--y`（或行内 left/top，
  皆兼容），推杆写 `.yz-stick-nub` 的 `--sx/--sy`（或行内 transform），
  激活挂 `.is-active`。
- 按钮：按下 `.is-pressed`（或靠 `:active`）；禁用 `:disabled`
  （无主动技的技钮）；冷却在钮上设 `--cd`，钮内 `.yz-cd` 罩自动画。
  `--cd` 归 0 后罩面自然消失，无需第二个开关变量。
- 尺寸：扇击横屏 88px / 竖屏 76px（≥72dp），技 52~56px，其余 48px。
- 暂停复用顶带 `.yz-btn-pause`（48dp），不再放第二枚触控暂停钮。
- 相机拖拽：右侧空白直接落 `#gl`，触控层不拦。

### 11.5 暂停 / 设置 / 结算 / 弹窗

```html
<!-- 暂停（结算 / 设置同壳）：磨砂 frost 屏 + plate 板 -->
<div class="yz-screen yz-screen--frost" hidden>
  <div class="yz-plate yz-panel">
    <p class="yz-subtitle">PAUSED</p>
    <h2 class="yz-heading">暂 停</h2>
    <div class="yz-settings">
      <label class="yz-set"><span>画质</span>
        <span class="yz-seg">
          <button class="yz-seg-opt is-on" type="button">自动</button>
          <button class="yz-seg-opt" type="button">高</button>…
        </span>
      </label>
      <label class="yz-set"><span>视角灵敏度</span>
        <input type="range" …><span class="yz-num">1.0</span>
      </label>
    </div>
    <div class="yz-keys">                          <!-- 触屏自动隐藏 -->
      <div><span>扇击</span><kbd>左键 / F</kbd></div>…
    </div>
    <div class="yz-actions">
      <button class="yz-btn yz-btn--primary" type="button">继 续</button>
      <button class="yz-btn" type="button">重 开</button>
      <button class="yz-btn yz-btn--ghost" type="button">回 主 菜 单</button>
    </div>
  </div>
</div>

<!-- 结算：板内换 results 组件 -->
<h2 class="yz-results-title is-win">掌 下 留 名</h2>
<p class="yz-results-sub">你 先到 7 杀</p>
<div class="yz-results-row is-head">
  <span class="yz-results-rank">#</span><span class="yz-results-name">选手</span>
  <span>击杀</span><span>坠落</span>
</div>
<div class="yz-results-row is-winner is-me">
  <span class="yz-results-rank yz-num">1</span>
  <span class="yz-results-name">你</span>
  <b class="yz-results-kills yz-num">7</b>
  <span class="yz-results-deaths yz-num">2</span>
</div>
<!-- 有新解锁时追加一行金色注记 -->
<div class="yz-note is-gold">解锁：疾风</div>

<!-- 确认弹窗 -->
<div class="yz-modal-backdrop" hidden>
  <div class="yz-plate yz-modal">
    <h3 class="yz-modal-title">放弃对局？</h3>
    <p class="yz-modal-body">当前战绩不会计入。</p>
    <div class="yz-modal-actions">
      <button class="yz-btn yz-btn--ghost" type="button">留下</button>
      <button class="yz-btn yz-btn--primary" type="button">退出</button>
    </div>
  </div>
</div>
```

- 一屏只放一个 `--primary`；结算「再来一局」是 primary，
  「回主菜单」是 ghost。
- 宽板（如结算 5 行以上）用 `.yz-panel--wide`。
- 标题屏（若做开场）：`.yz-screen--deep > .yz-home >（.yz-title +
  .yz-subtitle + .yz-btn-stack > .yz-btn…）`。

### 11.6 降级提示与页脚

```html
<div class="yz-notes">                             <!-- 仅主菜单可见 -->
  <div class="yz-note">src/render 未接入 · 正在跑 Canvas2D 调试视图</div>
  <div class="yz-note is-ok">已加载 src/styles 8 份样式</div>
</div>
<div class="yz-foot">yizhang · round 2</div>
```

tone：默认警示（去饱和氧化红沿）；`.is-ok` 接入正常（暮蓝沿）；
`.is-gold` 解锁（暖金沿）。

### 11.7 共享文件声明

本轮（LOOK-R1）仅改动 `docs/ART_DIRECTION.md` 与 `src/styles/**`
（`hud.css` 增视角模式段 §18、`hub.css` 补 `.yz-warp` 时序注释，
零新 token、零新文件）；未改共享只读文件（`index.html` /
`package.json` / `vite.config.js` / `README.md`），未改
`src/ui/**`（含 `shell.css` 与 O4 的 `src/ui/hub.css`）、未改
`src/render/**` / `src/sim/**` / `src/core/**` / `src/data/**`。
`#hud`、`.yz-*` 节点由 Opus-4 按本表挂载（LOOK-R1 新增两枚钩子：
`.yz-look-flash` 节点与 `#hud[data-look]` 属性，§18）；`index.html`
里两条字体域 preconnect 的摘除也归 Opus-4（见 §4 末）。

## 12. shell.css → src/styles 迁移映射（给 Opus-4）

### 12.1 层叠事实

`core/modules.js` 的 `loadSiblingStyles()` 把 `src/styles/**` 注入
`<head>` 末尾，**恒晚于** `shell.css`（静态 import，随包先到）。
同名类以本表后注入胜出；对 shell.css 中更高权重的选择器
（`.yz-seg button[data-on]`、`.yz-btn[data-primary]:disabled`、
`.yz-tbtn[data-slap]` 等）本表已内置同名钩子别名或加权选择器压制。
**shell.css 一行未动**，仍是 `src/styles` 加载失败时的完整兜底。

### 12.2 类名映射（旧 → 新）

| shell.css（旧） | src/styles（新） | 备注 |
| --- | --- | --- |
| `.yz-hud` | `#hud` | 状态类 `.is-dead` `.is-awakened` 设在 `#hud` |
| `.yz-clock > b + span` | `.yz-plate.yz-timer.yz-num`（+顶带 `.yz-kill-track`） | `[data-urgent]` → `.is-low` |
| `.yz-score-row [data-self/data-dead]` | 同名 + `.is-me` / `.is-dead` | 行内 `--row-color` 继续可用 |
| `.yz-feed-row > em/i/s` | `.yz-plate.yz-feed-item` + `<strong>` | `[data-fading]` 淡出可继续用行内 opacity |
| `.yz-glovebox / .yz-hands / .yz-hand` | `.yz-glove-dock / .yz-dock-row / .yz-plate.yz-glove-card` | `[data-active]` → `.is-active`；`--hand-color` → 卡上 `data-glove` |
| `.yz-meter-label + .yz-meter-track` | `.yz-meter > .yz-meter-fill`（无 track 层） | `[data-awake]` → `#hud.is-awakened`；行内 width% 或 `--meter` 皆可 |
| `.yz-rings / .yz-ring`（SVG 环） | `.yz-cd-strip > .yz-cd-slot > .yz-cd` | `[data-ready]` 不再需要；conic 罩由 `--cd` 驱动 |
| `.yz-center [data-awake]` | `.yz-respawn`（死亡）/ `.yz-center-note.is-gold`（觉醒） | 死亡改由 `#hud.is-dead` 自动出浮层 |
| `.yz-toast[data-on]` | 同名 + `.is-on` | 位置/材质已接管 |
| `.yz-notes / .yz-note[data-tone]` | 同名 + `.is-ok` / `.is-gold` | — |
| `.yz-stickzone / .yz-stick-knob` | `.yz-stick-zone / .yz-stick-nub` | `[data-on]` → `.is-active` |
| `.yz-pad / .yz-pad-*` | `.yz-cluster` + `.yz-tbtn--slap/--skill/--switch/--dash/--jump` | 位置由 grid-area 接管 |
| `.yz-tbtn-cd（--cd-on）` | `.yz-cd`（只用 `--cd`） | `[data-pressed/cool/off/slap]` → `.is-pressed` / 无 / `:disabled` / `--slap` |
| `.yz-tpause` | 顶带 `.yz-btn-pause` | 触控不再放第二枚暂停钮 |
| `.yz-menu`（菜单屏） | `.yz-screen--deep > .yz-lobby` | `.yz-menu-head/foot` → `.yz-lobby-head/foot` |
| `.yz-slot [data-active="1"]` | 同名 + `.is-active`（+ `data-glove`） | span/b/em 子结构沿用 |
| `.yz-card / .yz-pick-tag / .yz-card-unlock` | `.yz-plate.yz-glove-tile`（角章由 `.is-main/.is-off` 伪元素自动生成） | `[data-picked]` → `.is-main`/`.is-off`；`[disabled]` → `.is-locked`+`disabled` |
| `.yz-grid` | `.yz-scroll > .yz-glove-grid` | — |
| `.yz-sheet.yz-panel` | `.yz-plate.yz-panel (--wide)` | `[data-modal]` 属性删除，磨砂由 `.yz-screen--frost` 承担 |
| `.yz-rows / .yz-row` | `.yz-results-row (.is-head .is-winner .is-me)` | 列：rank / name / kills / deaths |
| `.yz-kicker` | `.yz-subtitle`（旧名已接管样式，可暂缓改名） | — |
| `.yz-btn[data-primary/ghost]` | `.yz-btn--primary / --ghost`（旧属性钩子已接管） | 金渐变按钮被压制 |
| `.yz-seg button[data-on]` | `.yz-seg > .yz-seg-opt.is-on` | 金底填充被压制 |
| `.yz-keys kbd` | 同名（触屏整块自动隐藏） | — |

### 12.3 迁移后请删（本表把它们全部替代）

节点上的 `data-primary` / `data-ghost` / `data-on` / `data-awake` /
`data-pressed` / `data-cool` / `data-off` / `data-slap` /
`data-active` / `data-self` / `data-dead` / `data-modal` 钩子写法，
以及 `--cd-on`、`.yz-ring` SVG 冷却环。过渡期它们仍被本表的
别名选择器接住，不会破相；删净后可从 `src/styles` 移除别名。

---

## 13. 安全区大厅美术（HUB-R1 · 走道 / 台座 / 展掌 / 传送门）

> 给 O2（渲染 / VFX）的验收依据。几何数据唯一来源是 `src/data/hub.js`
> （F3，ADR-30）：走道 15m 宽 × 39m 长、台座净高 0.95、展掌悬浮中心
> y = 1.35、`interactRadius` 2.0、门半径 2.4——本节只管「长什么样」，
> **不得复制第二份坐标**。拒收对照 §9 全表 + §13.6 大厅追加项。

### 13.0 一句话定调

**兵器谱最后一条静巷**：暮蓝里一条被走亮的石道，八只活手套在旧台座上
呼吸，巷尾门里透出这一屏唯一一撮暖金。安全区没有战斗，所以光更暗、
更稳、更收——走到门口才允许亮起来。

构图即引导（手册 §6.4）：走道中线、两排台座的透视线、门内亮点，
三组引导线全部汇向传送门；出生点回望方向不给同级亮点，
玩家转身也知道该往哪走。

### 13.1 走道（walkway）

- **材质**：与裂岛同族玄武岩（basalt strata，分层沉积 + 凿痕），但比
  裂岛「养护过」：中线约 1.5m 宽被脚底磨亮变深（polished center path,
  worn smooth and darkened where feet pass），两侧风化起毛发灰
  （weathered dry edges）。**金缮裂纹只许出现在中线附近**，密度远低于
  裂岛——安全区没挨过打，旧伤是「搬来的老料」。
- **铺装**：石板错缝铺（staggered joints），对缝处积灰、个别板角崩口；
  以贴花 / 污渍层破除 tiling（手册 §2-9），禁肉眼可见的贴图重复。
- **边界**：`bounds` 之外坠入暮色雾海（走道是悬空的一段）；边缘以
  低护栏或石口收边，护栏沿 §3：木 + 铁箍，扶握处包浆变深，
  铁箍锈从缝隙向下流。
- **光**：主光仍是右上 40° 暮蓝天光（与裂岛同一天空，同一世界）；
  第二光源 = 巷尾门的暖金逆光，顺走道轴把台座投影拉向出生点，
  并在台座向门一侧留 rim——光有来源、有方向、有目的（手册 §5），
  禁无来源补光、禁全屏 bloom。
- **尺度参照**：台座 0.95m、护栏约 1m——走道要读成「人走的巷」，
  不是展厅摆拍。

### 13.2 石台座（pedestal）

三段式，低面数 + 倒角（禁硬边塑料着色，手册 §2-8）：

| 段 | 造型与磨损 |
| --- | --- |
| 基座 plinth | 最宽，嵌进走道石板；边缘风化圆钝，底缝一圈积灰 |
| 座身 shaft | 四面留凿痕（tool marks）；迎走道面挂**识别色漆线**——一条 2~3cm 宽的旧漆，边缘剥落露石（worn paint line, chipped edges），是台座上唯一的识别色 |
| 顶面 cap | 被无数次「取掌 / 放掌」磨亮的包浆面，中心一圈浅凹托痕 |

- 磨损有方向：迎走道面（被摸）亮，背面（没人碰）糙；灰尘只落
  朝上的面（手册 §4.11）。
- **未解锁座**：漆线退成素刻未上漆的凹槽，顶面加一圈铁箍锁环
  （iron band），整座饱和压到 0.3~0.4；禁红色大锁图标、禁灰罩布糊脸。
- 高度 / 碰撞半径对齐 `data/hub.js` 的 `pedestalHeight: 0.95` /
  `pedestalRadius: 0.6`。

### 13.3 展掌（手指朝上）

- **姿态**：掌根朝台座、五指指向 +Y（手指朝上），掌心面向走道中线
  （yaw 读 `HUB` 表：左排面 +X、右排面 -X）。轻微悬浮：几何中心
  y = 1.35（顶面上方 0.4m），呼吸浮动振幅 ≤ 0.06m、周期 3.2~4.2s、
  八座按 index 错开相位；缓动落定曲线，禁弹跳。悬浮必须有
  **接触软影**投在顶面上——浮而不飘。
- **建模**：低面数但四层材质分离照抄 §3 手套行（掌背皮革 / 指节金属
  护片 / 腕口织物 / 掌心包浆），倒角必须有。灰度剪影测试：八只掌
  **轮廓各不相同**（木棉圆钝、磐石方厚、疾风削薄、冰霜带棱、弹簧腕部
  盘簧、分身薄片错层、磁掌指端对极、陨掌背部结壳）——轮廓差异
  优先于颜色差异。
- **识别色纪律**：识别色只落在腕口织带 + 指节漆线（点缀），掌体走
  去饱和材质本色。**当前聚焦 / 主掌 = 全屏唯一饱和峰值**（识别色
  提亮 + 一圈随形 rim），其余展掌 saturate 0.35~0.5 退后；
  已装备的主 / 副掌可在台座漆线处留一枚小色标。
- **禁**：纯色光球、发光描边、方块人 / 积木手、公告牌 sprite 代替
  几何体、悬浮无影。

### 13.4 每掌 idle 特效关键词表（3m 外可辨认是谁）

判据：蒙住 UI、画面灰度化，仍能靠**形 + 动**认出是哪只掌。
识别色只做点缀（≤ 粒子总量两成着色），禁整团染色、禁加法糊屏
（手册 §10）；每座粒子预算 ≤ 40；聚焦时特效密度 ×1.5、点缀提亮，
解除后 2s 内衰回常态——状态过渡靠密度渐变，不靠开关突跳。

| 掌 | idle 关键词（形 / 动 / 残留） | 负面 |
| --- | --- | --- |
| 木棉 cotton | 布纤絮 kapok fluff：3~5 枚棉絮自掌心缓升缓落，近直线慢飘；腕带被无形掌风轻鼓动；顶面积一层极薄绒屑 | 禁羽毛 / 花瓣化，禁发光尘 |
| 磐石 granite | 岩屑悬滞 orbiting grit：5~8 粒石屑绕掌低速公转，偶发一粒失稳坠到顶面弹跳一次；指缝有细尘线流下 | 禁碎石发光，禁 idle 震屏 |
| 疾风 gale | 贴地风环 ground wind ring：一条被扰动的尘带绕台座打转（看见的是尘不是光），指端布条持续小幅拂动 | 禁拖尾光带 |
| 冰霜 frost | 垂雾 + 枝晶 low fog & dendrites：冷雾从掌沿溢出、贴顶面下垂；指尖霜晶「长出 → 融滴」循环，顶面留湿痕 | 禁雪花贴纸，禁蓝光球 |
| 弹簧 spring | 簧圈蓄放 coil quiver：腕部簧圈周期性压缩 → 弹开，弹开瞬间顶面灰尘被弹起一小撮；金属高光随簧形变游走 | 禁果冻式整体缩放 |
| 分身 afterimage | 慢残影 pose ghost：每 2~3s 剥离一帧保留姿态的残影，边缘先散（动作历史，手册 §10.4），半拍后消；残影去饱和 | 禁蓝色光柱，禁 alpha 叠糊 |
| 磁掌 magnet | 铁屑场纹 filing arcs：顶面铁屑被吸起排成 2~3 条弧线场纹、悬停微颤；偶发一次短磁弧「嗒」跳过指间（一帧亮） | 禁持续电弧刷屏 |
| 陨掌 meteor | 碎岩伴星 orbiting rubble：2~3 块小碎岩绕掌缓转；掌下顶面一道细裂里嵌余烬微光呼吸（本座唯一高亮点） | 禁火焰常燃，禁全掌泛红 |

事后痕迹（§7 同源）：绒屑 / 石屑 / 湿痕 / 铁屑至少留一样在顶面上，
特效「用过」台座。

### 13.5 传送门（portal）

- **门体**：与台座同族的玄武岩拱门（两柱一楣）；楣上金缮裂纹是
  「充能」的叙事载体——未就绪只有哑金旧纹，就绪后**纹芯亮起**
  （全场唯一允许 bloom 的发光体，§2）。柱脚被穿门者磨亮，
  门槛石中央踏凹。
- **门洞 · 未就绪**（`portalReady === false`）：惰性石面 + 薄雾下沉，
  看得见门后的暗，不发光；语义提示交给 HUD「先选一只掌」。
- **门洞 · 就绪**：**不是纯色光幕**。配方 = 空间扭曲透镜（背景经门洞
  折射微畸变）＋ 门内暮蓝 → 暖金的深度渐变（越深越金，有纵深）＋
  细尘被吸入的弧线流（向门心收束，交代「往里走」）＋ 门楣金纹亮。
  门光必须照亮门前约 2m 地面与走近角色的迎门面（环境光响应，
  手册 §10 / 拒收 19）。
- **穿门过渡**：`.yz-warp` 淡场——金光快闪（120ms）→ 慢淡回
  （420ms）；禁加载条、禁全屏死白。门这侧留残留：被搅散的尘流
  约 3s 内重新聚拢。
- **构图**：门是走道灭点与全场第二亮点（第一是当前掌）；
  门与八座台座共享同一暮蓝天光，不另起色板。

### 13.6 大厅拒收追加（并入 §9 逐条打勾）

21. 展掌是纯色光球 / 公告牌 sprite，或方块人 / 积木手审美。
22. 台座、门崭新零磨损，漆线像刚喷的贴纸。
23. 门洞是单色平面光幕 / 纯 additive 漩涡，或门光不照亮门前地面。
24. 八座 idle 特效只靠换色区分（形与动全同、只换 hue）。
25. 大厅另起色板或天光方向与裂岛相悖（两区同一世界、同一暮空）。

---

## 14. 大厅 HUD 视觉合同（`.yz-inspect` / 门提示 / 配装条 / 触控确认）

> 数据面冻结在 `API_CONTRACT.md` §13.1，DOM 由 O4 在 `src/ui/hub.js`
> 挂载。**行为门归 O4**（`data-phase` 显隐、战斗件让位、「选」钮出没
> 都在 O4 的 `src/ui/hub.css`），**外观归本表** `src/styles/hub.css`：
> 经 `loadSiblingStyles()` 注入 `<head>` 末尾、恒晚于 O4 的静态
> import——同权重后到胜出，O4 件降为完整兜底（与 shell.css 同策略，
> §12.1）。本表文件里**不声明任何 display 显隐**，双方职责不混。

### 14.1 结构与状态钩子（O4 已挂，重申冻结）

```
#hud[data-phase="hub"]
└── .yz-hub-hud
    ├── .yz-plate.yz-hub-title       区名带（顶部中央，锚 --yz-inset-t）
    ├── .yz-plate.yz-inspect         说明牌 .is-on / .is-locked ＋ data-glove
    │   ├── .yz-inspect-head > .yz-inspect-name ＋ .yz-inspect-role
    │   ├── .yz-inspect-desc
    │   └── .yz-inspect-cta > .yz-inspect-key ＋ .yz-inspect-cta-text
    │                         ＋ .yz-inspect-slot
    ├── .yz-plate.yz-loadout-strip   配装条 data-glove=主掌
    │   └── .yz-loadout-slot(.is-empty) ×2 ＋ .yz-loadout-sep
    └── .yz-plate.yz-portal-hint     门提示 .is-ready / .is-near
.yz-touch[data-phase="hub"]
└── .yz-tbtn.yz-tbtn--interact.yz-hub-confirm   触控「选」
.yz-warp(.is-on)                     门内过渡淡场（盖全屏）
```

### 14.2 布局（横屏优先，全部锚 safe-area）

- **底部中央信息柱**（自下而上）：门提示（`--yz-inset-b` + 44）→
  配装条（+ 84）→ 说明牌（+ 132）。全部锚 `--yz-inset-*`
  （`env(safe-area-inset-*)` 已封装成 token）；说明牌宽
  ≤ `min(360px, 100vw − 左右 inset)`。说明牌只在聚焦时出现，
  常驻只有三条窄带——屏幕中心仍 ≥ 70% 净空（§5）。
- **触控**：「选」钮 80 × 80px（竖屏 76px，均 ≥ 72dp，token
  `--yz-touch-confirm`），右缘 inset 锚定、位于按钮簇上方；
  大厅收起扇 / 技 / 换三钮（O4 行为门），「选」是唯一主操作。
- **竖屏**：下半屏让给摇杆 / 按钮簇（与 §5 掌意条同一策略）——
  配装条、门提示上移到区名带下方（inset-t + 44 / + 82），区名带
  收起副标题；说明牌留底部、抬到 inset-b + 236px（「选」钮纵向
  区间之上）、宽收到 min(332px, …)。**矮横屏**（高 ≤ 480px）
  信息柱整体下压一档、区名带字距收窄。

### 14.3 材质与字（拒绝系统字体糊一块）

- 四件全部走 `.yz-plate`：磨砂暗玻璃 + 1px 顶部受光 + 磨损钢框 +
  拉丝微纹理（§3 UI 行）。说明牌左沿一条**识别色旧漆线**（两端
  剥落渐隐、微高光芯），漆光在玻璃上留极淡染晕；锁态漆线退成
  素刻钢槽、整牌 `saturate(0.25)`。
- 字体：掌名 / 区名 / 门提示 / 配装名 = `--yz-font-display`
  （几何工业 × 宋对撞，§4）；一句话说明 = `--yz-font-text`；
  确认键帽 = `--yz-font-num`，做成**金属小键帽**（拉丝钢面 +
  顶部受光 + 底压暗），不是 OS 默认 kbd。
- **识别色纪律**：HUD 内识别色只出现在四处点缀——说明牌漆线、
  role 小字、配装条主掌菱标、「选」钮描沿；门提示 ready 态的
  暖金是一屏唯一金色（金 = 门的语义，与 §1 暖金纪律一致）。
- **状态语义**：`.is-ready` 金字 + 金门楣线；`.is-near` 骨白 +
  明度呼吸（禁缩放弹跳），若主掌已选（配装条 `data-glove` 非空）
  门楣线转金——「先选一只掌」永远不披金。
- 动效：说明牌入场 = 10px 上移落定（`--yz-t-med`）、退场淡出；
  `.yz-warp` = 金芯快闪（120ms）→ 慢淡回（420ms）；
  弱动效（系统偏好或 `data-reduced-motion="1"`）一律直达终态。

### 14.4 层叠与文件纪律

- `src/styles/hub.css` 由 `index.css` **末位** `@import`（晚于
  touch.css，保证 `.yz-hub-confirm` 尺寸盖过 `.yz-tbtn` 基类）。
- 本表缺席（styles 加载失败）时 O4 的 `src/ui/hub.css` 兜底完整
  可用；本表到场即整套材质化——两边类名一字不差。
- token 增量只有 `--yz-touch-confirm: 80px`（tokens.css 触控段）；
  其余全部复用既有 token，不造第二套色板 / 间距。

---

## 15. 角色皮肤（HUB-R2 · 竞技场低面数件 + 菜单剪影）

> 给 O2（渲染）与 O4（2D 选皮肤条）的验收依据。数据唯一来源是
> `src/data/skins.js`（F3，ADR-26）：六套 SkinDef =
> `build × headgear × back × palette (+trim)` 的**枚举组合**，id 词表
> （drifter / mason / crane / reed / nuo / wildhorn）与枚举值冻结在
> 契约 §3.2，`trim` 微调参词表在 GDD §13.3——本节只管「每个枚举值
> 长什么样」，**不复制第二份表**。O2 对每个枚举值各做一次几何 /
> 材质件，F3 填组合表，两边零协商并行（契约 §3.2 开篇）。
> 消费链：`resolveSkin(p.skinId ?? persona?.skinId)`（对象级兜底，
> 未知一律落 drifter）。拒收对照 §9 全表 + §15.7 追加项。

### 15.0 一句话定调

**同一条巷子里六个路人**：都是暮蓝世界里被风尘磨旧的布衣客，
换皮肤换的是「他是谁」——剪影与灰阶，不是「他多强」——
skinId 纯装饰（ADR-26），也永远抢不走你手上那只活手套的饱和峰值。

三条铁律：

1. **剪影即身份**：灰度化后六套两两可辨（§15.5 判据）；区分度全部
   来自 build × headgear × back 的**形**，配色只是第二道保险。
2. **识别色载体不可少**（契约 §3.2 规则 1）：每套皮肤的背件必须
   承载**当前激活掌识别色**，皮肤只换载体形状，不能取消它。
3. **零素材下载**（契约 §3.2 规则 4）：全部低面数几何 + 程序化
   材质 + 顶点色做旧；禁贴图包、禁照片素材、禁版权民俗纹样
   （傩面必须原创剪影）。

### 15.1 体型档 `build` → 剪影比例（三档）

比例唯一来源是壳层 `core/skins.js` 的 `BUILD_SCALE`
（height / mass / shoulder 三个乘子）——2D 选皮肤条已在用它画剪影，
O2 的 3D 映射用**同一张表**，两域不许各调各的：

| 档 | height | mass | shoulder | 3D 落法（O2） | 灰度剪影 key |
| --- | --- | --- | --- | --- | --- |
| slim | 1.08 | 0.84 | 0.90 | 躯干拉长、四肢与躯干截面收窄、肩线收 | 高挑一头，颈长 |
| stock | 1.00 | 1.02 | 1.02 | 基准网格微调，缺省身形 | 中庸参照系 |
| broad | 0.96 | 1.24 | 1.28 | 躯干墩短、截面加厚、肩线外扩 | 宽出一肩，重心低 |

- **判定不变**：碰撞胶囊（playerRadius 0.7）、受击盒、动画根节点
  一律不随 build 变——体型是网格缩放不是物理；剪影允许超出胶囊的
  只有布料与配件（肩线、下摆、背件），且外扩 ≤ 0.1m。
- **头不缩放**：头部与手套尺寸恒定——「手套比头大」的比例喜剧
  是本作身份，broad 靠躯干读宽，不靠把头做小。
- 验收：战斗镜头距离（8~12m）灰度下三档能分档
  （slim 长一头 / broad 宽一肩，stock 居中）。

### 15.2 头部件 `headgear` → 六件剪影（灰度主判据）

六件形制互不相同（`src/data/skins.test.js` 锁死六套 headgear 互异），
剪影轴各占一格：**加高**（topknot / horns）、**加宽**（strawHat）、
**贴头盖脸**（hood / mask）、**无件**（bare）。低面数 + 倒角照 §3，
每件都要回答「谁戴过它」（手册 §14-12）：

| 件 | 用于 | 造型（低面数 + 倒角） | 材质与磨损 | trim |
| --- | --- | --- | --- | --- |
| hood 兜帽 | drifter | 整片布罩前探盖过眉线，脸窝进阴影；后颈堆两道定型折 | clothDim 布面；帽沿磨白、折痕处发亮 | `hoodDepth` 0.55 = 前探深度系数（越大脸越藏） |
| bare 光头 | mason | 无件——头皮弧线 + 耳形就是剪影 | skin 色；石匠头顶落一层极薄石粉（顶面灰，§4.11 逻辑） | — |
| topknot 发髻 | crane | 头顶束髻一球 + 髻绳一圈，剪影加高一拳 | 发色走 clothDim；髻绳是 palette.accent 一点（丹色，全身唯一） | — |
| strawHat 斗笠 | reed | 宽檐锥笠，全表最宽头件；檐口沿苇编方向起毛 | leather 苇编（编织有方向性）；笠带 accent；檐缘晒褪色 | `hatRadius` 0.42m = 笠檐半径（剪影关键，勿缩） |
| mask 傩面 | nuo | 面具盖全脸、略宽于颊；额头拱、下颌收——非贴脸平板 | 木胎漆面（微高光）；accent 漆纹两道；边缘磕漆露木；眼缝是**暗缝** | — |
| horns 荒角 | wildhorn | 双角自颅侧外张再前勾，剪影加高加宽 | 骨色 accent，根部缠皮绳（leather）；尖端磨圆——旧物不是新猎 | `hornSpread` 0.5m = 双角外张半距 |

负面（并入 §15.7 拒收）：兜帽里发光眼睛、面具眼缝发光、
荒角做成崭新尖角、斗笠成了 UFO 圆盘（檐要有苇编的塌与波）。

### 15.3 背件 `back` → 三种识别色载体（换掌可读性）

背件是**当前激活掌识别色**在角色身上的唯一落点（契约 §3.2 规则 1；
换掌可读性 = 视觉契约）。色源纪律与 §1.3 注一致：渲染域读
`GLOVE_BY_ID[activeGloveId].color`，UI 域走 `data-glove` token——
不造第三份色源。

| 件 | 用于 | 造型 | 识别色承载面 | trim |
| --- | --- | --- | --- | --- |
| panel 背板 | drifter / reed | 竖窄木板贴背，皮绳十字捆扎 | 板中一条**旧漆条**（2~3cm 宽，两端剥落露木——与台座漆线、说明牌漆线同一语言，§13.2 / §14.3） | — |
| banner 背旗 | crane / nuo | 旗杆压在右肩后，小旗面随步一摆（布料二次运动，手册 §11.4：延迟 + 阻尼，禁刚体旗） | **旗面布**整片识别色（压过哑光布纹，非荧光）；旗缘磨边、下摆一道撕口 | `bannerHeight` 1.25 鹤羽高扬 / 0.95 傩面收敛 |
| pack 行囊 | mason / wildhorn | 革包一坨挂右腰后，随奔跑小幅颠动 | 包上一条**识别色织带 / 盖布**横过包体 | `packBulk` 1.2 = 石契的鼓行囊 |

- **换掌（Q）表现**：载体颜色在 ≤220ms（`--yz-t-med` 同拍）内
  落定到新掌识别色——材质底色插值，**不闪光、不发光、不放粒子**；
  换掌的动静归手套本体，背件只是安静跟色。
- 载体面积纪律：识别色面 ≤ 背件表面 1/3（旗面例外，它本来就是
  「一面色旗」）；其余部分走 leather / clothDim 压灰。
- **禁**：emissive 旗面 / 漆条；背件整件染识别色再镶金边；
  取消背件（皮肤可以换载体形状，不能没有载体）。

### 15.4 `palette` 五段 → 材质槽（衣料永远让位识别色）

palette 是皮肤自己的**去饱和**衣料色（F3 已按 §1.2 压饱和，
灰阶阶梯见 GDD §13.2：crane 最亮 → nuo 最暗）。O2 的材质槽映射：

| 段 | 落在哪 | 材质要求 |
| --- | --- | --- |
| cloth | 主衣料（上衣 / 蓑衣 / 兽皮的大面积） | 布纹粗糙度 + 顶点色做旧（下摆、肘部脏一档），禁纯色平面填充（§9-2） |
| clothDim | 兜帽 / 衣料暗部 / 裤腿 / 发色 | 与 cloth 同族更暗，褶皱聚集处（§3 角色行） |
| leather | 束带 / 靴 / 行囊 / 笠编 / 角根皮绳 | 粗糙度低于布、磨亮处包浆（扣眼、背带受力点） |
| accent | 皮肤**自饰**：髻绳 / 傩纹 / 笠带 / 骨角 / 捆绳 | 压饱和的性格色——**不是**手套识别色，饱和度必须落在识别色之下 |
| skin | 露肤：脸、颈（手腕以下被手套吞掉） | 微 SSS 感、禁蜡感硅胶（§9-10）；肤色随皮肤设定微偏 |

一人身上的饱和排序（高 → 低）恒为：激活掌识别色（手套本体 +
背件载体）＞ palette.accent ＞ cloth 家族。皮肤永远不参与
「全屏唯一饱和峰值」竞争（§1.2）。

### 15.5 灰度验收（法）

蒙住 UI、画面灰度化、战斗镜头 8~12m、暂停任意一帧：

1. 六套两两可辨。三族先分（build × back 同捆）：
   stock+panel（行脚 / 苇笠）、slim+banner（鹤羽 / 傩面）、
   broad+pack（石契 / 荒角）；族内靠 headgear 一眼定
   （兜帽 vs 斗笠、发髻 vs 面具、光头 vs 荒角）。
2. 明度阶梯兜底：鹤羽最亮 → 傩面最暗（GDD §13.2），同族两套
   灰阶至少差一档。
3. 实战同屏 ≤4 人（p0 + 三 bot）：bot 人格皮肤
   wildhorn / crane / nuo 三族全占且 ≠ 缺省 drifter
   （契约 §3.2 规则 3）——同屏天然不撞剪影。

### 15.6 菜单 2D 选皮肤条（外观已落 `src/styles/menus.css`）

DOM 归 O4（`src/ui/menu.js`，结构行内兜底照旧）：

```
.yz-skin-strip                       横向滚动条（配掌板内）
└── .yz-plate.yz-glove-tile.yz-skin-tile[data-skin=<id>]  (.is-main = 当前穿着)
    ├── svg.yz-skin-figure[data-skin][data-build][data-headgear][data-back]
    └── .yz-glove-name               皮肤名
```

钩子纪律（O4 已定，重申冻结）：皮肤一律走 `data-*` 属性
（`[data-skin="nuo"]`、`[data-headgear="mask"]`），**不给每套皮肤
造类名**——皮肤表随 F3 增删，选择器不跟着改。本表补的外观：

- **背件识别色接管**：剪影里的识别色承载面（banner 旗面 / pack
  织带 / panel 漆条——`menu.js` 里都是各自 back 组的第 2 个图元）
  由 CSS `fill: var(--yz-accent)` 接管为**当前主掌识别色**（菜单根
  `data-glove` = 主掌，换主掌六个剪影同步换色）——2D 预览与 3D
  同一条「载体跟掌走」规则（§15.3），玩家在选皮肤时就看见
  这个机制。headgear / 衣料仍走 palette 本色，2D 与 3D 同纪律：
  识别色只在背件。
- **未选中退后**：非 `.is-main` 的剪影 `saturate(0.4)` 降饱和
  （§1.2 同款），峰值留给当前穿着那套。
- **着章**：`.is-main` 角章文字由掌卡的「主」改写为「着」——
  皮肤问「穿着哪套」，不问主副。
- 剪影落影一点（drop-shadow）：小图元离玻璃板，浮而不飘
  （§13.3 展掌同理）。

O4 兜底纪律不变：`menus.css` 缺席时行内结构样式独立成活；
本表只补外观不碰排布。

### 15.7 皮肤拒收追加（并入 §9 逐条打勾）

26. 皮肤挂战斗数值，或剪影超出碰撞胶囊 >0.1m 读成「更大的人」
    （ADR-26 / §15.1）。
27. 背件不带激活掌识别色、载体被取消，或识别色外溢染了整身衣料。
28. 灰度下六套只能靠配色区分（build / headgear / back 形不异），
    或头件靠发光（兜帽眼睛、面具眼缝）刷存在。
29. 出现贴图包 / 照片素材 / 版权民俗纹样；傩面撞现实剧种脸谱。

---

## 16. 裂岛战斗 VFX（HUB-R2 · 每掌扇击 + 技能的视觉终稿）

> 给 O2（VFX 渲染分派）的验收依据。参数唯一来源是
> `src/data/vfx.js`（F3）：扇击事件带 gloveId →
> `GLOVE_VFX_BY_ID[gloveId].slap`（burst / trail / residue / decal /
> finisher），技能事件的 skillId（契约 §3.1 右列 handler id）→
> `GLOVE_VFX_BY_SKILL[skillId]`，分身残影读 O1 导出的
> `view.combat.ghosts`、视觉规格取 afterimage 的 `skill.ghosts`。
> 本节按**表内字段名**给每个形状关键词一份可实现终稿——O2 照
> §13.4（大厅 idle）→ vfx.js（参数）→ 本节（终稿）三份同一套词汇
> 实现，**不出现第三套词汇**；改关键词 = 改识别语言，先过本表
> （GDD §14.2 同款流程）。判定几何（slapRange / slapAngleDeg /
> 技能半径）O2 从 `gloves.js` / combat 自取，VFX 不复制战斗数字。

### 16.0 韵脚规则：同一门功夫的快慢架

大厅 idle（§13.4）与战斗特效是**同一元素表的两种时值**：idle 是
慢架——缓、环境化、无接触；战斗是快架——快、有接触点、按寿命
衰减。八掌的「材料」两边共用（棉絮 / 石屑 / 尘带草屑 / 霜雾 /
簧圈 / 残影 / 铁屑 / 余烬），观众在大厅认识它、在裂岛认出它。

战斗三段式（字段即节拍）：

| 段 | 语义 | 时值纪律 |
| --- | --- | --- |
| `burst` | 接触一瞬的主形 | ≤0.5s，起手帧贴合判定几何：视觉边 = 判定边 ±10%，**特效不许谎报范围** |
| `trail` | 过程痕（挥击 / 位移沿途） | 0.3~0.9s，贴掌 / 贴地，不是拖尾光带 |
| `residue`（+`decal`） | 事后残留（尘 / 屑 / 霜 / 烬 + 贴花） | 1~3s（贴花 4~8s），打完不能像没发生（手册 §14-13） |

通则（vfx.test.js 已锁数据面，这里锁画面）：

- **挥击轴 = 水平横抽（LOOK-R1 收口）**：扇击（slap）的读向恒为
  攻击者本地系**左 → 右的水平横扇**——burst 楔形与 trail 沿水平弧
  展开、纵向压扁（贴地楔高纪律不变）；禁上撩、禁下劈、禁竖抡读向，
  巴掌是**抽**的不是砸的。此条只约束扇击；技能自带的纵向读向
  （groundPound 砸地、meteorSlam 天落等）不在此列。
- 粒子有形状，寿命内**变小 / 变暗 / 变散**收场，禁 pop 消失、
  禁纯色光球（§9-11）；三列关键词八掌互异，禁同团换 hue。
- 识别色只做点缀：着色粒子 ≤ `identMaxShare`（0.2），色源即表内
  `ident`（= `GLOVE_BY_ID[id].color`，同一对象字段）。
- 加法混合只给真高温：全表 additive 仅陨掌 `embers`；余烬必须
  照亮落点一小圈地面与近旁角色（环境光响应，拒收 §9-19）。
- hit-stop / 震屏归 sim 与 core juice（§8）；VFX 不自己抖镜头。
- 预算：slap 一次 ≤30 粒、技能一次 ≤60 粒，同屏粒子总量 ≤240，
  同类 decal 同屏 ≤4（超限先淡最旧）；数量降档走 `core/quality.js`
  已有档位，降档减 count 不减种类——残留可以变稀，不许消失。

### 16.1 木棉 cotton（轻掌打的是空气）

- **slap** `gustFan`：掌风沿判定扇面压出**贴地尘楔**（高 0.45m），
  灰是从地上掀起来的、不是凭空生成的白雾；`fiberWisp` ×6 布纤维
  随掌风打横摆动（sway 0.3）；residue `fluff` ×5 棉絮缓落 1.6s——
  与 idle 缓升的絮是同一枚材料，只是这次被打横了。
- **finisher**（觉醒 combo3 第三掌）：同形 ×1.5 + 追加 4 枚絮，
  **不换形不加光**——觉醒的「大」是范围与量，不是亮度。
- 无主动技（skill null），技能位不做表现。
- 韵：idle 絮缓升缓落 → 战斗絮被掌风射出去再慢下来。
- 负面：掌风做成半透明白球；「空气刀」光刃；絮变发光尘。

### 16.2 磐石 granite（重量 = 掀起了多少东西）

- **slap** `stoneWedge`：8 粒石屑沿抛物线（chipArc parabola）迸出
  楔形，`gritDrag` 重尘拖曳 0.6s 贴地滞留；residue `grit` ×10
  落地**弹一次**（bounce 1）再躺 2.5s；decal `kintsugiCrack`
  0.4 缩尺金缮裂纹 6s——与裂岛碎地同一美术语言（§3 台面行）。
- **skill** `groundPound` → `slamShock`：环状尘幕（dustCurtain
  高 1.2m、2s）自砸点掀起，chip ×14，`kintsugiCrackRadial`
  五辐条放射裂纹 8s；**裂纹金芯是本掌特效唯一亮点**（§2 bloom
  白名单成员）。
- 韵：idle 悬滞岩屑偶发失稳一坠 → 战斗整把掀起来。
- 负面：石屑发光；冲击波做成纯色圆环片；idle 式震屏挪进 slap
  （震屏归 sim 按质量给）。

### 16.3 疾风 gale（看见的是尘，不是光）

- **slap** `windShear`：被剪断的气流用**尘与草屑**显形（chaff ×7，
  0.35s）；`chaffWake` 贴地草屑尾流（groundHug）；residue `chaff`
  ×6 打旋沉降（settle swirl）1.4s。
- **skill** `dashSlap` → `rushWake`：冲刺沿途一条**被犁开的地面
  尘线**（dustLine 0.8s）+ 两条布带残迹（streamerCount 2——读得出
  「有人刚穿过去」的布，不是速度线光带）；residue `chaff` ×8。
- 韵：idle 贴地风环绕台座打转 → 战斗风环被拉直成一条冲刺线。
- 负面：拖尾光带 / 速度线 shader；风做成可见的青色气流体。

### 16.4 冰霜 frost（霜真的化了）

- **slap** `rimeFan`：判定扇面边沿**一瞬结晶**（dendriteFlash，
  枝晶闪结 0.4s），`coldFog` 冷雾贴地滚 0.9s；residue `frost` ×8
  融成**湿痕**（melt wetMark）3s——湿痕是「霜来过」的证据；
  decal `dendrite` 枝晶自触点生长 0.35s、存 4s。
- **skill** `frostArc` → `dendriteWave`：枝晶作为**波前**沿地面
  推进（growSeconds 0.45），贴地雾高 0.4m、1.6s；觉醒冻结挂
  `iceShell`：**有厚度的冰壳**（0.08m）包住被冻者，冰是折射
  几何体不是蓝光罩，壳面有裂纹与气泡。
- 韵：idle 指尖霜晶「长出 → 融滴」 → 战斗同一循环加速到一掌内。
- 负面：雪花贴纸粒子；蓝色光球；全屏冷色滤镜；冻结 = 套蓝 shader。

### 16.5 弹簧 spring（金属的劲全在高光上）

- **slap** `coilSnap`：腕部簧圈压缩 → 弹开一瞬（0.3s），
  **金属高光沿簧丝游走**（glintTravel——反光在动，不是簧在发光）；
  `coilArc` 三圈簧弧残形 0.35s 渐散；residue `dustPop` ×5
  被弹起的灰一小撮 1.0s。
- **skill** `parry` → `coilGuard`：架招时簧圈**压缩蓄势 0.12s**
  （compressSeconds，与格挡窗口同拍读秒），反击成功瞬间弹开 +
  高光走簧 + `dustPop` ×8——「弹」的表现全部是机械形变。
- 韵：idle 簧圈周期性蓄放 → 战斗真的把人弹出去。
- 负面：整体果冻缩放（§13.4 同款）；簧圈电光；弹开加白闪帧。

### 16.6 分身 afterimage（残影是动作历史，不是能量体）

残影（ghost）跨 slap / skill 共用一份材质规格，O2 做一次：

- **本体**：角色网格当帧姿态的一次性拷贝（keepPose——包括手套与
  背件轮廓，剪影必须完整）。
- **材质**：去饱和（desaturate 0.8~0.85，向灰坍缩不是变蓝）、
  亮度 ×0.8 略沉；**无 emissive、无描边、无蓝色光柱**
  （§13.4 / 手册 §10.4 同款负面）。
- **消散**：**边缘先散**（edgeDissolve）——噪声阈值从剪影边缘向
  内啃，躯干中心最后消失；灰度下残影与本体可分、且轮廓完整期
  ≥ 寿命的 60%。多具残影**不许 alpha 叠糊**：同屏 ghost ≤3 具
  （slap 1 + skill 2），重叠处以后到者为准，不做加法叠亮。

分段：

- **slap** `ghostCut`：挥掌剥离一帧残影（trail `poseGhost` ×1，
  0.45s）；residue `ashMotes` ×6 灰烬微尘 1.2s——残影散成的灰。
- **skill** `blinkSwap` → `swapVeil`：换位两端各留一具残影
  （ghosts count 2、spawnInterval 0.12s、life 0.7s、desaturate
  0.85——逐条对应 O1 的 `view.combat.ghosts`，O2 只按上述材质
  渲染）；出发点空气**向内一收**（细尘吸入），到达点细尘先外推
  半拍人再到（手册 §10.4 传送配方的减法版）；veil 是一片薄纱状
  空间微扭曲，**不是光幕**；residue `ashMotes` ×10。
- 韵：idle 每 2~3s 慢剥离一帧 → 战斗每次挥击 / 换位快剥离，
  desaturate / edgeDissolve 参数两边同源。
- 负面：蓝色光柱；alpha 叠糊；残影发光描边；残影带识别色整体染。

### 16.7 磁掌 magnet（尘埃排队，铁屑作证）

- **slap** `fieldArcs`：空中尘埃被吸成 **3 条弧线场纹**（0.4s，
  看见的是被组织的尘埃，磁场本身不可见）；`filingStream` 铁屑
  细流涌向掌心 0.5s；residue `filings` ×9 铁屑落地**微颤**
  （quiver）2s；decal `dragScuff` 被拉者脚下拖擦痕 4s——事后
  读得出「他是被拖过来的」。
- **skill** `magnetPull` → `pullField`：场弧向掌心收束 +
  `snapFlash` 短磁弧「嗒」跳过指间——**一帧亮**（frames 1，
  §13.4 同款纪律，禁持续电弧刷屏）；residue `filings` ×12 +
  `dragScuff` 5s。
- 韵：idle 顶面铁屑排成静弧 → 战斗整场尘埃都开始排队。
- 负面：持续电弧；紫色闪电贴纸；磁力做成半透明色球 / 波纹圈。

### 16.8 陨掌 meteor（预警用影子，余烬是唯一高温）

- **slap** `emberImpact`：冲击环掀尘（shockRing——环是**尘与压力
  波**掀起的实物，不是光圈片）+ 余烬迸散 0.5s；`emberStreak`
  余烬拖痕 0.6s；residue `embers` ×7 呼吸明灭 2.8s（blend
  additive——全表唯一，它真的是高温），余烬照亮落点一小圈地面；
  decal `scorch` 焦痕 6s。
- **skill** `meteorSlam` → `craterFall`：腾空时 `leapShadow`
  **遮蔽脚下光**——落区先暗下来，影子就是预警（禁光柱 / 红圈
  预警贴片）；落点 shockRing 0.6s + dustCurtain 高 1.4m、2.2s +
  `embers` ×14 + `scorchRing` 焦痕环 8s；与碎地系统联动——
  台面真的裂（§7 同源）。
- 韵：idle 碎岩伴星 + 裂缝余烬呼吸 → 战斗整块天花板砸下来。
- 负面：全掌常燃火焰；全身泛红；additive 溢出到余烬之外；
  预警画光圈。

### 16.9 战斗 VFX 拒收追加（并入 §9 逐条打勾）

30. 任一掌的 burst / trail / residue 退化成「色球 / 光带 / 光点」
    三件套，或八掌同形换 hue（数据面 vfx.test.js 先红，画面这里再验）。
31. 残影带蓝光 / 描边 / emissive，或多具残影 alpha 叠成一坨亮。
32. 特效谎报判定：视觉边越出判定边 >10%，或起手帧与命中帧错拍。
33. additive 出现在陨掌余烬之外；或发光体（余烬、金缮裂纹芯）
    不照亮环境（§9-19 的本作实例化）。
34. 任一掌打完 2s 场上无残留（residue / decal 全灭，违手册 §14-13）。

---

## 17. 预算下的 idle 盲辨合同（HUB-R3 · HV-04 记分 × W1 降耗互锁）

> Round 3 两件事在同一个大厅里发生：O2 要把 mid 档压进 L3-10
> （draw ≤120 / tris ≤80k；Round 2 实测 hub mid 是 draw 305 /
> tris 138k，BRIEF W1），F4 要按 HV-04 记分——遮掌名按 idle 认掌
> **≥6/8**（SOTA §11 / ACCEPTANCE §12.5）。本节是两者的互锁合同：
> 写清降耗**允许砍什么、不许砍什么**，避免预算刀落下去把八种 idle
> 合并成一种光。§13.4 关键词表原文不动、依旧是形与动的唯一终稿；
> 本节只加「底线形」与「记分协议」，全部用既有词汇，不另造词。
> idle 分派的实现词 = `src/render/hub-vfx.js` 的 `IDLE_VFX_KIND`
> （八键八形，认不出退 `fluff`）；战斗分派词见 §17.4。

### 17.1 八掌底线形（降到最低档也必须活着的那一条）

判据继承 §13.4：蒙 UI、画面灰度化、3m 判距，靠**形 + 动**认掌——
颜色只是第二道保险，盲辨记分不算它。降档砍数量、砍层数、砍次级
细节，**不砍下表这一条底线**；表内中文八词与 `IDLE_VFX_KIND` 的
实现注释同词（棉絮 / 岩屑 / 风带 / 霜雾 / 簧弧 / 残影 / 磁弧 / 余烬）：

| 掌 | idle kind | 底线形（low 档也必须在场） | 动向签名 |
| --- | --- | --- | --- |
| 木棉 cotton | `fluff` 棉絮 | ≥2 枚大而软、几乎不受重力的絮团缓升横荡，慢慢化开 | 升 · 荡 |
| 磐石 granite | `grit` 岩屑 | ≥3 粒**有体积**的碎石绕掌低速公转，偶发掉渣下坠 | 绕 · 坠 |
| 疾风 gale | `streak` 风带 | ≥2 条头尾渐隐、被噪声撕出断续的贴掌风带绕圈 | 环绕（快） |
| 冰霜 frost | `mist` 霜雾 | 冷雾自掌口溢出**向下淌**，台沿 ≥3 根冰棱在场 | 降 · 淌 |
| 弹簧 spring | `coil` 簧弧 | 一条真螺旋压缩 → 弹开，掌随之被顶起一截 | 纵向蓄放 |
| 分身 afterimage | `ghost` 残影 | ≥1 具保留掌形轮廓的半透复本错位闪现、再收回本体 | 错位 · 闪 |
| 磁掌 magnet | `pull` 磁弧 | ≥4 条向掌心收束的牵引线，线上亮段持续向内跑 | 向心收束 |
| 陨掌 meteor | `ember` 余烬 | 上升余烬（白热 → 暗红变色退场）+ 下落的灰，双向对流 | 升烬 · 落灰 |

动向签名是本表的抗降档保险：升 / 绕 / 环 / 降 / 弹 / 闪 / 收 /
对流八种运动矢量互异——粒子再稀、几何再省，**只要矢量语言还在**，
灰度低分辨率下仍可辨。八条底线两两不同构，这就是「八掌不共用
一套粒子」在最低档的具体含义。

### 17.2 盲辨协议（HV-04 记分 · 与 ACCEPTANCE §12.5 同一条线）

执行细则（视觉侧，F4 记分时照此摆场）：

1. **场**：`?phase=hub&unlock=all`，八座全解锁、全 idle 常态
   （不聚焦——聚焦 ×1.5 密度是加分项不是及格线）。
2. **遮**：遮 HUD 掌名——`hud=0` 关掉整层 HUD，或遮挡
   `.yz-inspect` 说明牌与配装条掌名；台座本体（漆线、掌模）不遮，
   但记分以形为主，任一争议座以**灰度截图**复核裁决。
3. **看**：逐座走到 3m 判距（§13.4 判距），每座观察 ≥ 一个完整
   idle 周期（约 4s，覆盖残影 2~3s 剥离与簧圈整拍蓄放）；
   顺序打乱，观察者报掌名。
4. **判**：8 座答对 **≥6** 过；**记分档 = W1 修完后的 mid 档**
   （记分与预算同一份构建，不许拿 high 档截图交差）；low 档
   不记分，但抽验 2 座确认 §17.1 底线形未归零。
5. 证据并入 §12.6 证据包：8 座 mid 档录屏或逐座截图 + 争议座
   灰度复核图。

### 17.3 预算合同（W1：允许砍什么 / 不许砍什么）

**允许**（点名放行，砍这些不算视觉回退）：

1. **hub 阶段整棵关掉裂岛子树**——对称于现状「arena 时 hub 根
   `visible = false`」（`render/hub.js` 已做）的反向。安全区看不见
   裂岛；门内的暮蓝 → 暖金纵深是门自己的材质（§13.5 配方），
   不依赖裂岛在场。
2. **共享几何 / 实例化**：八座 plinth / 座环已是 InstancedMesh，
   可继续推进——掌模自同一基础网格参数化变形、特效小几何
   （石屑 / 冰棱一类）全局共享一份 geometry。§13.3 的「八掌轮廓
   各不相同」约束的是**剪影结果**，不约束几何来源。
3. **mid / low 降粒子数、层数、发射率**：延续现行阶梯（发射率
   mid ×0.75 / low ×0.45，逐效果 count 递减）且允许更狠。降档
   次序：先砍粒子数 → 再砍次级层（掉渣、亮段、染晕、接触软影
   之外的杂影）→ 再砍阴影与辉光——**主形（§17.1 底线）永远是
   最后一位，且永远不许归零**。
4. **距离 LOD**：非聚焦远座密度再降一档；走近 3m 判距内恢复
   §13.4 常态密度即可——盲辨在 3m 判，远处稀疏不扣分。

**禁止**（预算不是理由，命中即拒收）：

1. **八掌共用同一套粒子**：`IDLE_VFX_KIND` 八键八形是合同
   （拒收 §13.6-24 的实现面）。两种以上 idle 合并成同一发射器 /
   同一形状、只换 hue 或只换 count，直接拒收。
2. **纯色光球**（§9-11 / 红线 R-05）：任何档位都不许把形退化成
   billboard 光点——低档的絮还是絮、屑还是屑，可以更少更小，
   不能变成「一个亮点」。
3. **用 Bloom 冒充可辨**：low 档无辉光（`QUALITY.low.bloom ===
   false`）是既成事实，可辨性必须在**无辉光**下成立；不许靠加
   发光强度给某掌「补辨识度」，辉光白名单不变（余烬、金缮
   裂纹芯，§2）。
4. **底线形归零**：任何档、任何座 idle 完全静止或零发射
   （≠ 密度低），按 HV-04 FAIL 计。

互锁验收：W1（draw ≤120 / tris ≤80k）与 HV-04（≥6/8）在**同一份
mid 档构建**上验——预算达标但盲辨不过，W1 不算收口；反之亦然。

### 17.4 战斗 VFX 同词交叉引用（零新增词汇）

战斗侧的可辨语言已在三处写清，本节不再造第四套词，只锁对齐关系：

- **视觉终稿** = §16（16.1–16.8 逐掌，含负面清单与三段式时值）；
- **参数表** = `src/data/vfx.js`（burst / trail / residue / decal
  字段词，`GLOVE_VFX_BY_ID` / `GLOVE_VFX_BY_SKILL`）；
- **渲染分派** = `src/render/combat-vfx.js` 的 `COMBAT_VFX_KIND`
  八词：cotton→`fanwake`、granite→`slab`、gale→`gust`、
  frost→`rime`、spring→`recoil`、afterimage→`phase`（非 mirror，
  SOTA HG-06 已锁）、magnet→`flux`、meteor→`cinder`；技能走
  `SKILL_VFX_KIND` 同形放大。

台座 idle（§17.1）与战斗 kind 逐掌押韵不复制（§16.0 快慢架）：
`fluff`↔`fanwake`、`grit`↔`slab`、`streak`↔`gust`、`mist`↔`rime`、
`coil`↔`recoil`、`ghost`↔`phase`、`pull`↔`flux`、`ember`↔`cinder`。
W1 压 draw call 同样适用于战斗侧，但纪律照抄 §16.0 既有条款：
**降档减 count 不减种类，残留可以变稀、不许消失**——战斗粒子
预算数字（slap ≤30 / 技能 ≤60 / 同屏 ≤240）以 §16.0 为准，
本节不重开第二份数字。

---

## 18. 固定人物视角（LOOK-R1 · 锁视角反馈 / 设置项 / 过门淡场合拍）

> 给 O4（DOM / 行为）与 O2（过门表现）的验收依据。行为契约冻结在
> `API_CONTRACT.md` §7.1/§8/§13.2 与 ADR-37/38/39：`lookMode` 状态
> **只住 input**，sim / render / view 快照都不感知——本节全部钩子
> 都是 HUD 装饰，读 `input.getLookMode()` 即可，不得为样式另设第二份
> 模式状态源。样式已落 `src/styles/hud.css`（`.yz-look-flash` +
> `#hud[data-look]`）与 `src/styles/hub.css`（`.yz-warp` 时序注释），
> DOM 由 O4 挂载。拒收对照 §9 全表 + §18.5 追加项。

### 18.0 一句话定调

**锁视角是手感，不是横幅**：模式切换的全部视觉动静 = 准星旁一行
小字亮 0.9 秒 + 准星两侧多出两道 1px 短刻。战斗视野一寸不让，
中心 ≥70% 净空（§5）在两种模式下逐帧成立。

### 18.1 V 切换一瞬反馈（`.yz-look-flash`）

DOM（O4 挂载，`#hud` 内常驻节点，与 `.yz-toast` 同策略）：

```html
<div class="yz-look-flash" role="status">视角锁定<kbd>V</kbd></div>
```

- JS 只做两件事：写文本（「视角锁定 / 自由视角」，终稿归 F3/GDD，
  容 4~6 字）+ 加 `.is-on`，约 **0.9s** 后移除——比 toast（1.6s）
  短，它是**确认回执**不是通知；连按 V 重置计时即可，不排队。
  V 键与设置项两条切换路（契约 §13.2）走同一枚反馈。
- 外观（已落）：准星下方 24px、水平居中；`--yz-font-display` 11px、
  0.24em 字距、骨白灰（`--yz-text-mute`）、极薄暗底（35% ink）、
  无框无金无发光；入场 120ms 4px 落定、退场 220ms 淡出；
  弱动效直达终态。
- `<kbd>` 是缩号金属键帽（`.yz-inspect-key` 同族更小）；触屏
  （`data-touch="1"`）没有 V 键，键帽整枚隐藏、文本照常。
- **负面**：常驻大字、全屏横幅、识别色 / 暖金披身、发光描边、
  图标闪烁——模式提示永远不与战斗信息抢眼。

### 18.2 锁视角常驻微指示（`#hud[data-look]`）

- O4 在 `#hud` 上贴 `data-look="locked|free"`（初值与切换随
  `input.getLookMode()` 同步；这只是装饰镜像，权威仍在 input，
  ADR-38——渲染器与 view 快照照旧不感知）。
- `locked`：准星两侧 ±9px 各一道 5×1px 短刻（30% 骨白）——读作
  「面向已夹紧到视线」；`free` / 未贴属性 = 裸点，与旧 DOM 完全
  同相（O4 未接线时零视觉变化）。
- 就这两道刻。禁锁形图标、禁边角常驻文字、禁给准星加圈 / 加光 /
  加识别色。

### 18.3 设置项「视角模式」（复用既有纸感，零新组件）

- 落在暂停 / 设置板既有 `.yz-settings` 内：一行 `.yz-set`（标签
  「视角模式」）+ `.yz-seg`（两枚 `.yz-seg-opt`：「固定视角 /
  自由视角」，当前态 `.is-on`）——与画质分段选择**完全同一套**
  玻璃 + 钢框材质，不做新控件、不加新 token。
- 键位表 `.yz-keys` 加一行「切换视角 · V」即入（结构不变，
  触屏整块照旧隐藏）。
- **负面（本轮点名）**：游戏风加载条、霓虹描边、发光 toggle、
  滑动开关拟物皮肤——设置板是纸感玻璃，视角项不许自成一派。

### 18.4 过门淡场与机位 snap 合拍（`.yz-warp` 时序合同）

`.yz-warp` 配方不变（§13.5/§14.3：金芯快闪 120ms → 慢淡回 420ms，
禁加载条、禁全屏死白）。LOOK-R1 追加时序纪律（ADR-39 / 契约 §13.2）：

1. **淡场是剪辑遮罩，不是等待画面**：`.is-on` 只许停留一拍
   （≤160ms）；`input.setLook → feedLook → snapCamera` 在峰值帧内
   完成，慢淡回开始时**身后构图必须已经立好**——观众看到的是
   「金光一闪，人已站在新地方、镜头已在背后」，不是「镜头正在
   飞过去」。
2. 峰值中心透光（暮蓝压边到 74% 才至 0.98）：任何时刻都看得见
   场景在换，无全屏死黑帧、无死白帧。
3. 淡回途中禁再动机位：snap 幂等、重复调用无害，但淡回中出现
   弹簧飞行 = 违契约不变量 §14-32。`lerpView` 传送帧跳插值
   （ADR-31）与本条叠加——角色不滑步、机位不飞行，幕布只负责
   遮那一帧剪辑点。
4. 弱动效（`prefers-reduced-motion` / `data-reduced-motion="1"`）：
   淡场直达终态 = 硬切——snap 本就瞬时，时序合同同样成立。

### 18.5 视角轮拒收追加（并入 §9 逐条打勾）

35. 模式切换出现常驻大字 / 全屏横幅 / **发光贴片糊 HUD**，或锁视角
    指示抢眼（识别色 / 暖金披身、准星加圈加光）。
36. 设置项「视角模式」出现游戏风加载条 / 霓虹描边 / 发光 toggle，
    与既有纸感面板不同套。
37. 过门淡场峰值滞留 >160ms，或淡回结束时机位仍在飞（身后构图
    未立）——淡场退化成「加载画面」语义。
38. 扇击读向出现上撩 / 下劈 / 竖抡（违 §16.0 挥击轴：水平横抽
    左→右）。
39. 出现现实厂牌 / **官方手套名**（文案或贴图字样均算）；方块人 /
    积木手、纯色光球回潮（§9-11 / §13.6-21 重申，本轮点名）。
