# 兵器王者·炉火

独立目录中的国风放置锻造网页游戏（致敬「兵器王者」类玩法，原创实现）。
零构建依赖：纯 HTML / CSS / ES Module，静态服务器打开即玩。

## 启动

```bash
python3 -m http.server 4173 --directory games/bingqi-wangzhe
```

浏览器打开 `http://127.0.0.1:4173/`。

> 必须走 http(s)，不能用 `file://` —— ES Module 与相对路径在 file 协议下会被 CORS 拦截。

### URL 开关（仅作用于 mock 兜底数据）

| 参数 | 作用 |
| --- | --- |
| `?demo=1` | 载入中后期展示档：五栏满阵、传说/神话兵器、高炉阶概率、竞技第 6 名。用于视觉走查。 |
| `?fresh=1` | 忽略本地演示存档，从新档开始。 |
| `?seed=<n>` | 指定 mock 随机种子。 |

逻辑层接入后这些开关自动失效（只影响 mock 分支）。

## 逻辑测试（无浏览器）

```bash
node games/bingqi-wangzhe/tests/run.mjs
node games/bingqi-wangzhe/bench/run.mjs
```

## 界面结构

底部 6 Tab + 顶部资源条，移动优先（390×844），桌面居中最大 430px 卡片。
路由为 hash 形式，可直链：`#/forge` `#/campaign` `#/lineup` `#/codex` `#/arena` `#/bag`。

| Tab | 路由 | 内容 |
| --- | --- | --- |
| 工坊 | `#/forge` | 挂机领取、三阶段炉（精铁/白银/黄金）、元素偏向与幸运符/大师熔炉、品质概率条、三锤锻造演出、品质揭示卡 |
| 试炼 | `#/campaign` | 40 关主线（5 大区域，每 5 关一位精英 BOSS）、进度环、星级、战报弹层 |
| 战阵 | `#/lineup` | 5 栏位上阵（随进度解锁）、羁绊预览、三相克制统计、战力总览 |
| 图鉴 | `#/codex` | 32 把兵器网格、元素/品质/已收录筛选、收集度加成、未收录剪影 |
| 竞技 | `#/arena` | 20 名本地镜像 AI、优势/势均/劣势标记、ELO-lite 名次、战绩 |
| 背包 | `#/bag` | 兵器卡列表、品质筛选与四种排序、强化/分解/上阵、动效偏好设置 |

顶部资源条固定展示 **铜钱 / 精铁 / 体力 / 玄晶**，右上角为当前战阵战力。
体力每 6 分钟 +1（上限 120），资源变动时资源格会有一次高亮跳动。

## UI 层架构

```
js/ui/
  app.js                 # mountApp(root, game)：外壳 + 路由 + 6 Tab
  gameAdapter.js         # 逻辑层适配：真实模块与 mock 逐项混合
  dom.js                 # 极简 hyperscript
  icons.js               # 内联 SVG 图标集（线描国风）
  format.js              # 数值 / 品质 / 元素 / 资源文案
  motion.js              # prefers-reduced-motion 策略、波纹、触感
  art/furnace.js         # 炉膛 / 铁锤 / 远山插画
  fx/sparks.js           # Canvas 火花粒子场
  components/            # 资源条、Tab、兵器卡、战报、吐司、空状态、弹层
  views/                 # forge / campaign / lineup / codex / arena / bag
  mock/                  # 兜底数据与兜底逻辑（详见下节）
css/
  main.css               # 入口，@import 以下分片
  tokens.css base.css layout.css components.css forge.css views.css motion.css
assets/
  brand/                 # 印章、卡背、favicon
  textures/              # 墨点噪声、麻布纹、祥云纹
```

## 挂载与逻辑层后注入

`mountApp` 的签名遵守 `ARCHITECTURE.md` 冻结契约，并且**允许 game 为任意占位对象**
（包括 `js/main.js` 现在传入的 `{ boot: true }`）：

```js
import { mountApp } from './ui/app.js';

const app = mountApp(document.getElementById('app'), { boot: true });
// …逻辑层就绪后热替换，界面无需重载：
app.setGame(realGame);
```

`app` 句柄同时挂在 `window.bqwzApp` 上，方便非 `main.js` 的接入方与调试取用。

### 期望的注入形状

任一分支缺失都合法，缺什么由 mock 顶上：

```js
mountApp(root, {
  state,                                   // core/state.js createInitialState()
  bus,                                     // core/events.js createBus()
  rng,                                     // core/rng.js createRng()
  data:   { weapons, stages, skills, strings },
  forge:  { previewForge, forgeWeapon, enhanceWeapon, dismantleWeapon, collectIdle },
  combat: { estimatePower, simulateBattle, generateArenaOpponents },
  save() {}
});
```

适配器会自动把冻结签名里的 `state` 首参补上（例如 `previewForge(state, opts)` →
UI 侧调用 `game.previewForge(opts)`），并把每一项的来源记录在 `game.capabilities` 中。
背包页「设置 → 数据来源」会显示当前是 `core` 还是 `mock`。

### mock 兜底

`js/ui/mock/` 是 UI 的临时逻辑层，只为在 `core/forge/combat/data` 落地前
把界面开发与验收解耦，**不是最终实现**：

- `mock/data.js` —— 32 把兵器原型（覆盖剑刀枪戟弓弩斧锤扇笛伞戟刃 + 4 把神话）、
  40 关关卡、17 个技能、7 类词条、20 名竞技对手。
- `mock/mockGame.js` —— mulberry32 随机、品质权重、元素克制（火→冰→雷→火，
  克制 ×1.35 / 被克 ×0.75）、体力回复、挂机 8 小时封顶结算、回合制速度条战斗、
  ELO-lite 竞技。

mock 存档键为 `bqwz.ui.mock.v1`，**刻意与逻辑层的 `bqwz.save.v1` 区分**，不会污染真实存档。

## 视觉与动效

- 色板：墨底 `#0b0a09`、朱砂 `#c23a2b`、鎏金 `#e4b84a`、青冰 `#7ec8e3`、雷紫 `#9b6bff`。
- 品质色：凡铁灰 / 精钢绿 / 玄兵蓝 / 紫霄紫 / 传说橙 / 神话红金；传说与神话卡带周期掠光。
- 标题用衬线（宋/楷 fallback 栈），正文用系统无衬线，数值用等宽数字。
- 锻造演出：炉心呼吸光 + 三锤震屏 + Canvas 火花（DPR 自适应，无粒子时不跑 rAF）。

### prefers-reduced-motion

三档策略，系统偏好之外还允许玩家在「背包 → 设置」里手动覆盖（存 `bqwz.ui.motion.v1`）：

- 系统 `prefers-reduced-motion: reduce` 或手动选「减少动效」时，`<html>` 加 `reduce-motion`，
  所有 transition / animation 压到 1ms，循环动画不再迭代。
- 火花粒子改为一次性静态余烬（不启动 rAF 循环），揭示卡直接翻到正面，
  按钮不产生波纹节点，震屏与触感反馈关闭。
- 「一锤定音（跳过演出）」在低动效下从第一锤起就可用。

## 目录与所有权

见仓库 `.agent_workspace/ARCHITECTURE.md`。本目录中 `index.html`、`css/**`、
`js/ui/**`、`assets/**`、`README.md` 由 UI 代理维护；
`js/core|forge|combat|data|tests|bench` 属于其他代理，请勿交叉修改。
