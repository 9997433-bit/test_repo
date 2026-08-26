# 异掌 · 美术方向（Round 2）

> 依据 `docs/VISUAL_HANDBOOK.md`（强制）与 `DESIGN_SEED.md` 视觉章。
> 底座 **B 风格化精品**（手册 §3.2），全程不混底座 A / C，不使用本仓库
> 水墨 / 墨戏系兄弟游戏的任何视觉语言。
> 本文档是渲染（Opus-2）、UI（Opus-4）、VFX 的验收依据；
> `src/styles/**` 是 **唯一正式 HUD 主题**（Round 2 起单一事实来源），
> DOM 契约见 §11，shell.css 迁移映射见 §12。

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

### 1.3 八掌识别色（与 `src/data/gloves.js` 的 `color` 字段对齐）

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

## 4. 字体系统

铁律：**HUD 不落默认系统字体**（手册 §2-6、§9）。

| 层 | 栈 | 用途 |
| --- | --- | --- |
| 展示 `--yz-font-display` | Rajdhani → Noto Serif SC → Source Han Serif SC → Songti SC → serif | 标题、按钮、掌名、中央短讯 |
| 正文 `--yz-font-text` | PingFang SC → Hiragino Sans GB → Source Han Sans SC → Noto Sans SC → Microsoft YaHei → sans-serif | 说明、挑战文案、弹窗正文 |
| 数字 `--yz-font-num` | Rajdhani →（中文回退） | 计时、杀数、冷却；一律 `tabular-nums` 不跳宽 |

加载：Rajdhani 与 Noto Serif SC 均为 OFL 开源授权，经 `index.css` 顶部
`@import ... display=swap` **非阻塞**载入（CJK 按 unicode-range 分片，只下用到的片）；
断网 / 未达时按回退栈渲染，无 FOIT。全局 `font-synthesis: none` 禁伪粗体。
选型记录：站酷小薇经实测「回」等常用字形退化为墨块，已否决。
建议 Opus-4 在 `index.html` 加 `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`。
Round 2 升级路径：自托管子集化 woff2（仅收录 UI 实际用字），移除外链。

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
├── index.css    入口（含非阻塞字体外链，import 其余全部）
├── tokens.css   :root 设计令牌 + 8 掌识别色 data-glove 映射
├── fonts.css    字体栈 token + .yz-display / .yz-num 工具类
├── base.css     重置、#gl 画布、.yz-plate 玻璃材质、焦点、弱动效
├── layout.css   #hud 壳、安全区、公共关键帧
├── hud.css      顶带 / 战况列 / 播报 / 掌位坞 / 掌意条 / 冷却排 /
│                受击 / 重组 / 中央短讯 / 顶部提示
├── touch.css    虚拟摇杆 / 按钮簇（72dp 扇击、48dp 其余）
└── menus.css    配装大厅 / 选掌 / 暂停 / 设置 / 键位表 / 结算 /
                 弹窗 / 分段选择 / 降级提示
```

接入方式（Opus-4）：`import "./styles/index.css";` —— 一行即可。

## 11. DOM 契约（Round 2 · 单一事实来源）

> `src/styles/**` 是唯一正式 HUD 主题；`src/ui/shell.css` 降级为
> critical fallback（Opus-4 所有，本方只读）。Opus-4 把 `src/ui/**`
> 的节点改挂本节类名即可完成切换，样式零改动。本节覆盖一场完整
> 对局所需的全部界面：配装菜单、局内 HUD（掌意 / 冷却 / 战况 /
> 播报）、触控（摇杆 + 72dp 扇击）、暂停 / 设置、结算、降级提示。

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

本轮未改动共享只读文件（`index.html` / `package.json` /
`vite.config.js` / `README.md`），未改 `src/ui/**`（含 `shell.css`）。
`#hud`、`.yz-*` 节点由 Opus-4 按本表挂载。

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
