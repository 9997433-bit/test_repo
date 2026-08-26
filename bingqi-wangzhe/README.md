# 兵器王者·炉火

独立目录中的国风放置锻造网页游戏（致敬「兵器王者」类玩法，原创实现）。
零构建依赖：纯 HTML / CSS / ES Module，静态服务器打开即玩。

## 启动

```bash
# 仓库根目录执行；换成任何静态服务器都行，端口随意
python3 -m http.server 4173 --directory games/bingqi-wangzhe
```

浏览器打开 `http://127.0.0.1:4173/`，看到「炉火初燃」一闪即入工坊。

线上独立路径（与其他游戏隔离）：

https://9997433-bit.github.io/test_repo/bingqi-wangzhe/

仓库 Pages 根地址只做游戏目录，不会把本游戏摊在站点根上。

> 必须走 http(s)，不能用 `file://` —— ES Module 与相对路径在 file 协议下会被 CORS 拦截。

无构建、无依赖、无 `npm install`：改完源码直接刷新。

真实存档键为 core 的 `bqwz.save.v1`；逻辑层就绪时界面直接读写它。
想确认现在读的是真存档还是 mock，看「背包 → 设置 → 数据来源」那一行：
写着 `core` 且四项全绿才是真的。

### URL 开关（仅作用于 mock 兜底数据）

| 参数 | 作用 |
| --- | --- |
| `?demo=1` | 载入中后期展示档：五栏满阵、传说/神话兵器、高炉阶概率、竞技第 6 名。用于视觉走查。 |
| `?fresh=1` | 忽略本地演示存档，从新档开始。 |
| `?seed=<n>` | 指定 mock 随机种子。 |

逻辑层接入后这些开关自动失效（只影响 mock 分支）。

## 测试

### 逻辑测试（无浏览器，Node ≥ 18）

```bash
node games/bingqi-wangzhe/tests/run.mjs        # 6 项核心断言，stderr 打 [PASS]/[FAIL]，stdout 是 JSON 报告
node games/bingqi-wangzhe/bench/run.mjs        # 边界用例 + 性能（战斗 500 次 / 锻造 1000 次，预算各 500ms）
node games/bingqi-wangzhe/js/forge/selfcheck.mjs   # 锻造子系统自检
```

三条命令都以退出码 0 表示通过；`tests/run.mjs` 的人读结论在 stderr，
所以 `node … 2>&1 >/dev/null` 就能只看 `[PASS]` 列表。

### 界面走查（需要浏览器）

界面层没有单测——它的正确性靠真机走一遍：起炉 → 三锤 → 揭示 → 上阵 → 出征 → 印章。
逐项对照：

| 看什么 | 怎么看 |
| --- | --- |
| 真存档还是 mock | 背包 → 设置 → 数据来源写 `core`，四枚标签全绿 |
| 音效 | 背包 → 设置 → 音效选「开启」，点「试听」应听到两声锤击加一声克制音 |
| 状态图标 | 出征后单位牌下方出现带回合数的小徽章（灼烧 / 冰缓 / 铁壁…） |
| 群体弹道 | 带溅射技的一方出手时是一片扇面，雷链是逐跳生长的折线，都不是五发单体弹 |
| 低动效 | 设置切「减少动效」，战斗直接给终局静帧，音效在「跟随动效」档下同时静音 |

## 界面结构

底部 6 Tab + 顶部资源条，移动优先（390×844），桌面居中最大 430px 卡片。
路由为 hash 形式，可直链：`#/forge` `#/campaign` `#/lineup` `#/codex` `#/arena` `#/bag`。

| Tab | 路由 | 内容 |
| --- | --- | --- |
| 工坊 | `#/forge` | 挂机领取、三阶段炉（精铁/白银/黄金）、元素偏向与幸运符/大师熔炉、品质概率条、三锤锻造演出、品质揭示卡 |
| 试炼 | `#/campaign` | 40 关主线（8 章，每 5 关一位精英 BOSS）、进度环、星级、战报弹层 |
| 战阵 | `#/lineup` | 5 栏位上阵（随进度解锁）、羁绊预览、三相克制统计、战力总览 |
| 图鉴 | `#/codex` | 兵器网格（真实数据 41 把）、元素/品质/已收录筛选、收集度加成、未收录剪影 |
| 竞技 | `#/arena` | 20 名本地镜像 AI、优势/势均/劣势标记、ELO-lite 名次、战绩 |
| 背包 | `#/bag` | 兵器卡列表、品质筛选与四种排序、强化/分解/上阵、动效与音效设置 |

顶部资源条固定展示 **铜钱 / 精铁 / 体力 / 玄晶**，右上角为当前战阵战力。
体力每 6 分钟 +1（上限 120），资源变动时资源格会有一次高亮跳动。

## UI 层架构

```
js/ui/
  app.js                 # mountApp(root, game)：外壳 + 路由 + 6 Tab + 逻辑层热替换
  gameAdapter.js         # ready 检测与整体切换：liveGame ↔ mockGame
  dom.js                 # 极简 hyperscript
  icons.js               # 内联 SVG 图标集（线描国风）
  format.js              # 数值 / 品质 / 元素 / 资源文案
  motion.js              # prefers-reduced-motion 策略、波纹、触感
  audio.js               # WebAudio 现场合成的音效（无音频文件）
  art/furnace.js         # 炉膛 / 铁锤 / 远山插画
  live/liveGame.js       # 真实玩法：core + data + forge + combat 的界面门面
  fx/sparks.js           # Canvas 火花粒子场
  fx/ballistics.js       # Canvas 元素弹道（火 / 冰 / 雷 / 无）
  fx/battleStage.js      # 战报演出：单位牌、血条、闪白、飘字、KO 慢动作
  fx/verdictSeal.js      # 胜负印章
  fx/flyingLoot.js       # 领取资源的飞币动画
  components/            # 资源条、Tab、兵器卡、战报、吐司、空状态、弹层
  views/                 # forge / campaign / lineup / codex / arena / bag
  mock/                  # 兜底数据与兜底逻辑（详见下节）
css/
  main.css               # 入口，@import 以下分片
  tokens.css base.css layout.css components.css forge.css views.css fx.css motion.css
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

### ready 是怎么测出来的

界面按**整体**在真实存档与 mock 之间切换，不做逐函数混搭——
`combat.estimatePower` 读 core 的 state、兵器却由 mock 生成，只会得到一个两边都不自洽的界面。

判定分三步（`gameAdapter.js`）：

1. **core 运行时在场**：注入对象上同时有 `state`、`bus` 与 `tick()`（即 `createGame()` 的产物）。
2. **取模块**：候选依次是注入对象的顶层 `data / forge / combat`、`modules.*`、`raw.*`，
   最后是 `probeLogicModules()` 用动态 `import()` 取回的 `js/data|forge|combat/index.js`。
   用动态导入而不是静态 import 是为了**逻辑层语法出错时只让本次探测失败**，
   Promise reject，界面照常以 mock 跑，不会白屏。
3. **函数点名**：`forge` 要齐 `previewForge / forgeWeapon / enhanceWeapon / dismantleWeapon /
   collectIdle / previewIdle / computeWeaponStats / enhanceCostFor / levelCapFor / setWeaponLock`，
   `combat` 要齐 `estimatePower / simulateBattle / generateArenaOpponents / computeBonds /
   arenaOpponentToWaves / createCombatRng`，`data` 要有非空的 `weapons`、`stages` 与章节表。
   少一个就算该子系统未就绪。

第 2 步是**点名择优**，不是「取第一个非空的」：`core/api.js` 的
`game.forge / game.combat` 是给界面用的**门面**，只挑了五六个动词，
点名单上的 `computeWeaponStats`、`arenaOpponentToWaves` 并不在其中。
若只看字段在不在，门面就会顶掉 `game.raw.*` 里那份完整命名空间，
四项永远绿不齐——界面照样能用，数字却全是 mock 编的，这种失败最难被发现。
所以每个候选都要过一遍点名单，谁齐用谁。

四项全绿才 `ready`，此时由 `live/liveGame.js` 接管全部玩法；
否则整体退回 mock，同时仍订阅 core 的事件总线。
探测在首帧之前完成（约百毫秒，超时保护 3 秒），期间保留开机画面，
避免「mock 一闪再跳真实存档」的数字跳变。

各子系统的到位情况记录在 `game.capabilities` 里，背包页「设置 → 数据来源」直接读它，
`game.source` 会是 `core` / `core-runtime + mock` / `mockGame` 之一。

### 期望的注入形状

```js
mountApp(root, createGame({ /* core options */ }));   // 仓库内模块自动探测

// 或者由接入方显式提供（覆盖仓库内的默认实现）：
mountApp(root, Object.assign(coreRuntime, {
  data:   { WEAPONS, STAGES, SKILLS, SKILL_BY_ID, /* … */ },
  forge:  { previewForge, forgeWeapon, enhanceWeapon, dismantleWeapon, collectIdle, /* … */ },
  combat: { estimatePower, simulateBattle, generateArenaOpponents, /* … */ }
}));
```

冻结签名里的 `state` 首参由 `live/liveGame.js` 补上
（例如 `previewForge(state, opts)` → UI 侧调用 `game.previewForge(opts)`）。
出征、竞技、上阵这些**编排动词**默认也由 `liveGame` 用 core 原语组合出来；
若逻辑层日后自带 `challengeStage / arenaFight / setLineup`（顶层或 `modules.orchestrator`），
会优先用逻辑层的版本。所有编排动词失败时统一返回 `{ ok: false, error, goto?, resource? }`，
视图据此弹吐司，并按 `goto` 把玩家送到能解决问题的那一页。

### mock 兜底

`js/ui/mock/` 是 UI 的**兜底**逻辑层，只在上面的 ready 检测没过时顶上
（例如某个逻辑层模块导入失败、或导出缺项），**不是最终实现**：

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

### 战斗演出

战报不再是一列文字。`fx/battleStage.js` 把 combat 引擎吐出的 timeline 播成一段仗：
上下两排单位牌（带血条与元素色）、中缝波次横幅与回合标，
整场压缩到 8 秒左右（长仗自动加速，另有 ×1/×2/×4 与「跳过演出」）。

| 效果 | 实现 |
| --- | --- |
| 元素弹道 | `fx/ballistics.js`：火为抛物火弹带余烬拖尾（260ms），冰为自旋棱形冰锥碎裂成霜（300ms），雷为折线闪电瞬发闪断（110ms），无属性为银色刀气（180ms）。additive 合成，空闲时不跑 rAF。 |
| 群体弹道 | 同一次出手打出的多条伤害归成一组，由首条事件一口气演完：溅射走**扇形横扫**（以施法者为心张开波面，波前扫到谁谁才结算，340ms），跳跃技走**连锁折线**（逐跳生长，每跳 90ms 落定后再跳下一个）。判据只认引擎已经写在事件里的东西——`tag === 'aoe'` 归扇形，`label` 带「·N跳」且打到两个以上目标归连锁，其余仍是一发一发的单体弹。 |
| 状态图标 | 单位牌下方一排小徽章：灼烧 / 冰缓 / 冻结 / 感电 / 破绽 / 弱化 / 战意 / 铁壁 / 棘甲 / 淬体 / 疾风，负面描虚线框，角标是剩余回合。引擎只在**挂上**状态时发事件，掉落由界面随 `round` 事件自己数，击破与过波整备时清理。徽章在快进与低动效下照给——那是信息，不是动画。 |
| 受击闪白 | 命中回调触发 `.bunit.is-hit`：白色遮罩 240ms 闪一次 + 单位牌抖动，同时飘伤害数字（暴击另有配色）。 |
| KO 慢动作 | `kill` 事件把演出时间缩放到 0.26×、弹道降到 0.4×，持续 560ms，画面同时压暗降饱和并压一层暗角。 |
| 胜负印章 | `fx/verdictSeal.js`：朱印从 2.6× 高处砸下并回弹，落定后墨迹晕开；身后战场同时压暗，印章下方给出回合数与存活数。 |
| 领取飞币 | `fx/flyingLoot.js`：用 Web Animations API 把资源图标从领取按钮抛向顶部资源条对应格子，落点跳动一次。起终点是运行时算出来的两个矩形，所以不用 CSS class。 |

战斗层对未知技能 id 会合成一个同名技能，战报里会印成 `施展【sk_leiting_tu】`；
逻辑层不归界面改，于是 `liveGame` 随战报捎一张 id→名字的字典，演出时换回「雷霆突」。

### 音效

`js/ui/audio.js` 全部现场合成，**仓库里没有也不会有音频文件**——
零请求、零版权风险、离线可用，改音色就是改几行包络。

| cue | 合成方式 |
| --- | --- |
| 锤击 ×3 | 低频砸击正弦 + 噪声瞬态 + 三条不成整数比的金属泛音；一锤比一锤高、比一锤重，第三锤另加一记余韵 |
| 克制 / 被克 | 纯五度上行双音（亮）对小二度下行闷音（钝），闭着眼也听得出这一下吃不吃亏 |
| 命中 / 暴击 | 短噪声击 + 方波脆响，暴击更亮更长；连打时 70ms 内只出一声，不然是一片糊掉的噪音 |
| 扇形 / 连锁 | 扇形是一段扫频噪声，连锁是三粒逐级升高的电火花 |
| 击破 / 胜 / 负 | 下坠锯齿 + 噪声尾 / 五声音阶三音上行 / 两音下行长衰减 |
| 品质揭示 | 按品质取和弦，凡铁两音、神话六音，传说以上另铺一层高频气声 |
| 飞币 / 失败提示 | 两枚高频短音；操作被拒时一记低沉方波，吐司会飘走，声音不会被漏看 |

偏好三档，存 `bqwz.ui.audio.v1`（音量另存 `bqwz.ui.audio.vol.v1`），
在「背包 → 设置 → 音效」里切：

| 档位 | 行为 |
| --- | --- |
| 跟随动效 | 低动效（含系统 `prefers-reduced-motion`）时静音 |
| 开启 | 恒开，低动效下也响——给「只想关动画、不想关声音」的人 |
| 关闭 | 恒闭，`play()` 直接返回 `false`，一个音源节点都不建 |

`AudioContext` 只在第一次真实按下时创建（各家浏览器的自动播放策略），
之前的 `play()` 一律静默丢弃：「第一次点击没声音」远好过「控制台一片 autoplay 报错」。

### prefers-reduced-motion

三档策略，系统偏好之外还允许玩家在「背包 → 设置」里手动覆盖（存 `bqwz.ui.motion.v1`）：

- 系统 `prefers-reduced-motion: reduce` 或手动选「减少动效」时，`<html>` 加 `reduce-motion`，
  所有 transition / animation 压到 1ms，循环动画不再迭代。
- 火花粒子改为一次性静态余烬（不启动 rAF 循环），揭示卡直接翻到正面，
  按钮不产生波纹节点，震屏与触感反馈关闭。
- 「一锤定音（跳过演出）」在低动效下从第一锤起就可用。
- 战斗演出整体退化为静态终局：不创建弹道 canvas、不跑 rAF，
  一次性渲染终局血量、完整文字战报与印章；飞币退化为落点跳动一次。
- 音效在「跟随动效」档下一并静音（想留声音就把音效切到「开启」）。
- 状态图标不受影响：徽章是战况信息，只是不再有弹出动画。

## 目录与所有权

见仓库 `.agent_workspace/ARCHITECTURE.md`。本目录中 `index.html`、`css/**`、
`js/ui/**`、`assets/**`、`README.md` 由 UI 代理维护；
`js/core|forge|combat|data|tests|bench` 属于其他代理，请勿交叉修改。
