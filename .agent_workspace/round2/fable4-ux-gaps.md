MODEL_SLUG: claude-fable-5-thinking-xhigh

# fable-4 — Round 2 UX SOTA 差距审计（交付 opus-4）

> 依据：`round1/BRIEF.md` R2 底线（三锤时间轴、六档揭示、三套弹道、闪白+飘字、KO、边框流光、空/错误态、reduce-motion）+ `round1/fable4-ux.md` 规格 §4/§5/§6/§7/§10。
> 审计对象：`games/bingqi-wangzhe/js/ui/**`、`css/**`、`index.html`（commit `3057811`）。
> 每条给出目标文件与可测量验收方式。新建文件均在 opus-4 所有权范围内（`js/ui/**`、`css/**`）。

---

## 0. 已达标项（勿重做，防止空转）

| 项 | 证据 |
| --- | --- |
| SVG 线描国风图标全套（Tab/资源/兵器/元素） | `js/ui/icons.js`，R1 规格 P1「换 SVG」已完成 |
| 概率公示（真实权重条 + 图例，含幸运符/大师熔炉修正） | `views/forge.js` oddsBar/oddsLegend |
| 空状态组件六 Tab 全覆盖，带 CTA 跳转 | `components/feedback.js` emptyState，各 view 均调用 |
| reduce-motion 双通道（系统媒体查询 + 设置手动档）+ 全局 1ms 降级 | `js/ui/motion.js`、`css/motion.css` |
| 火花 canvas：DPR 自适应、无粒子即停 rAF、降级画静态余烬 | `js/ui/fx/sparks.js` |
| 揭示卡翻转骨架（3D 翻转、conic 光环、传说/神话光柱） | `css/forge.css` `.reveal__*` |
| 品质→CSS 变量映射（`[data-quality]` → `--q/--q-soft`）五处一致 | `css/tokens.css` |
| 无裸 alert；错误均走 toast | 全 view 走查 |

---

## 1. P0 清单（R2 底线，缺一不可）

### P0-1 三锤自动时间轴（现状：手动点三次「落锤」，无时间轴）

- **目标文件**：`js/ui/views/forge.js`（`startForge`/`strike` 重构为毫秒时间轴驱动）、`css/forge.css`、`css/motion.css`（新增冲击环/全屏白闪/蓄力关键帧）。
- **要做**：按规格 §4.1 落地总长 2,600ms 自动演出——t=0 资源扣减红字上飘（见 P0-5）；t=0–300 背景压暗至 0.72、炉光呼吸周期收紧；t=300–550 铁坯上砧（translateY 24→0 + blur 4→0）；t=600 / 1200 / 1950 三锤，接触帧同步「震屏 ±4/±6/±8px + 火星 + 砧面白闪 + `vibrate(20)/30/[10,30,50]`」；t=1800–1950 第三锤蓄力悬停 150ms；t=1950 冲击环（scale 0→2.4, 300ms）+ 全屏白闪 80ms + 粒子 timescale 0.3；t=2100 收束衔接揭示。点击任意处跳过 → 直达 t=2100 并保留末 400ms 揭示。手动逐锤点击可作为可选交互保留，但验收以自动时间轴为准。
- **验收**：录屏逐帧比对锤点时刻误差 ≤80ms；跳过后仍能看到结果揭示末 400ms；reduce-motion 下无位移动画，仅砧面单帧亮度变化 + 直接出结果。

### P0-2 品质揭示六档分级（现状：所有品质同一段 520ms 延迟 + 720ms 翻转）

- **目标文件**：`js/ui/views/forge.js`（`openReveal` 按 `w.quality` 分档编排）、`css/forge.css`、`css/motion.css`。
- **要做**：规格 §4.2 分档表——预震 X1 = 0/0/300/500/800/1100ms；总长 900/1000/1600/2100/2800/3600ms；公共骨架：卡背 spring 入场 → 预震 → 翻转 420ms → 品质徽章盖章式落下（scale 1.6→1 + 落定轻震）→ 兵器名淡入 → 数值/词条逐条上滑错峰 60ms → CTA 行最后升起（现在 CTA 与卡同时出现，剥夺了「屏息期」）。额外演出：精钢绿光单脉冲；玄兵蓝流光绕边一圈 600ms（复用 P0-6 机制）；紫霄紫光柱 ×3 旋转；传说压暗加深至 0.85 + 金色光雨 ≤40 粒；神话翻转瞬间全屏冲击环（scale 0→3, 400ms）+ 兵器名逐字淡入（每字 240ms）+ 红金粒子环绕。
- **验收**：用 `window.bqwzApp` 暴露 debug 钩子（或 `?seed=` 固定种子）逐档触发六种品质，录屏确认时长/强度单调递增；凡铁 ≤1s、神话 ≥3.5s；reduce-motion 下降级为交叉淡入 240ms + 静态品质光晕，结果信息完整。

### P0-3 战斗视图 + 三套元素弹道 + 闪白飘字 + KO + 胜负印章（现状：完全缺失，战斗即时结算只弹文字战报）

- **目标文件**：**新建** `js/ui/views/battle.js`（全屏战斗覆盖层）、**新建** `js/ui/fx/projectiles.js`（canvas 弹道层）、**新建** `css/battle.css`（记得在 `css/main.css` 引入）；`views/campaign.js` 与 `views/arena.js` 的 `challenge()`/`fight()` 改为先进战斗视图、战报 sheet 变为战后可选回看。
- **要做**（规格 §4.3）：
  - 布局：上半敌方 1–3 波、下半我方 1–5 位（单位 chip 复用品质/元素 token），中间 canvas 覆盖全场；提供 ×1/×2/跳过。
  - 弹道三套：火=半径 10px 火球贝塞尔抛物线 380ms + 橙红拖尾 + 爆裂放射；冰=旋转六角晶直线 320ms + 碎裂 + 地面霜环（scale 0→1.8）；雷=无飞行体，80ms 折线闪 2 次 + 目标竖向雷柱 120ms。
  - 回合节拍：行动者描边高亮 + 微放大 1.06（120ms）→ 前冲 8px 回位 → 弹道 → 命中。
  - 受击：`filter: brightness(2.2)` 闪白 80ms + 击退 4px 回弹；HP 主条立即掉、红色残影层延迟 300ms 追平。
  - 伤害飘字：上飘 32px 淡出 600ms spring；普通=纸色 20px、暴击=金色 34px + 落地震字 + 「暴!」角标、克制加「克」徽章（元素色底）、被克数字缩小灰化。
  - KO：全场 timescale 0.25 持续 400ms + 目标 grayscale(1) 碎裂 6–8 片下坠 500ms。
  - 结算：胜=金色「胜」印章盖下（scale 2→1 + 震动 300ms，可复用 `assets/brand/seal.svg` 母题）；败=灰蓝「败」+ 克制推荐语；奖励逐条错峰 80ms 弹出。跳过=直接结算面板。现有 `.report__verdict` 的字距渐显不算印章，需改造并同步用于战报 sheet。
- **验收**：试炼与竞技各完整观看一场 + 跳过一场；三元素弹道各出现至少一次且肉眼可辨；暴击/克制/普通三级飘字同屏可区分；KO 慢动作可见；reduce-motion 下省略飞行、仅命中光斑 + 伤害数字、直接出结算；战斗视图关闭或切 Tab 后 rAF 停止（Performance 面板确认 CPU 归零）；DevTools 4× CPU 降速下无 >32ms 长帧；canvas 活跃粒子同屏 ≤64。

### P0-4 结构化战斗时间轴数据（现状：mock timeline 仅 `{round, kind, element, text}` 预拼 HTML，弹道层无从驱动）

- **目标文件**：`js/ui/mock/mockGame.js`（`runBattle` 时间轴条目增加结构化字段）、`js/ui/components/battleReport.js`（改为从结构化字段渲染文字行，去掉 `html:` 注入路径）。
- **要做**：每条时间轴补 `{ t, actorSide, actorIndex, targetIndex, element, damage, isCrit, elementMod(1.35|1.0|0.75), targetHpAfter, isKO, wave, skillId? }`；`text` 可保留供战报行使用。战斗视图**只消费 timeline，不自行计算伤害**。同一契约以追加方式写入 `.agent_workspace/round2/REQUESTS.md`，请求 opus-3 的 `simulateBattle` 输出同形状（UI 侧先以 mock 形状开发，core 接入后视图代码不变）。
- **验收**：`battle.js` 内无任何伤害/克制计算；mock 与真实引擎切换（`gameAdapter` ready 前后）战斗视图无需改动即可播放。

### P0-5 资源飞币 + count-up + 扣减飘字（现状：领取挂机只有 toast，资源变化直接跳数）

- **目标文件**：**新建** `js/ui/fx/floaters.js`（`countUp(el, from, to, 400ms)`、`flyIcons(fromRect, toRect, resId, n)`、`floatText(anchor, text, kind)` 三个工具）、`js/ui/components/resourceBar.js`（暴露各资源格锚点、接入 count-up）、`js/ui/views/forge.js`（领取挂机与锻造扣减两处接入）、`css/motion.css`。
- **要做**：领取挂机 = 3–5 枚资源小图标从卡片沿贝塞尔飞向资源条（600ms，错峰 60ms）→ 到达时资源格微震 + 数字 count-up 400ms + toast 三连；锻造起炉 = 资源条对应项红色 `-20` 小字上飘 400ms。数字容器统一 `font-variant-numeric: tabular-nums`。
- **验收**：录屏领取一次可见「飞币 + count-up + toast」三连；reduce-motion 下无飞行、数字直接落定终值。

### P0-6 品质边框「绕边」流光（现状：传说/神话 wcard 是对角掠光 `card-sheen`，非沿边框跑圈——R1 遗留明确点名）

- **目标文件**：`css/components.css`（`.wcard` 传说/神话）、`css/forge.css`（揭示卡玄兵档）、`css/tokens.css`（补 `--q-glow-rare/epic/legendary/mythic` 柔光 token）、`css/motion.css`。
- **要做**：用已注册的 `@property --sweep`（angle）+ `conic-gradient` 描边（border-mask 或双层伪元素镂空）实现光点**沿边框循环**；揭示卡玄兵档跑一圈 600ms；传说/神话兵器卡常驻慢速绕边（可与现有对角掠光叠加或替换）。
- **验收**：背包中放一把传说与一把神话（`?demo=1`），肉眼可见光点沿卡片四边循环而非斜向扫过；reduce-motion 下退化为静态品质光晕（不循环）。

### P0-7 错误态补全（现状：空态达标；错误态只有 toast，缺规格 §7 的恢复路径）

- **目标文件**：`js/ui/components/feedback.js`（toaster 支持 action 按钮、同类合并、同屏 1 条后到顶替、错误左侧 danger 竖条）、`js/ui/views/forge.js`（资源不足路径）、`js/ui/views/campaign.js`（体力不足/阵容为空路径）、`css/components.css`。
- **要做**：
  - 资源不足：主 CTA **不禁用**（现为 `disabled`），点击后按钮左右晃动 ±6px 240ms + 资源条缺口项红闪 2 次 + toast「精铁不足，还差 N」附 [去获取]（跳产出关卡）。
  - 体力不足：modal 显示「体力将于 mm:ss 后 +1」倒计时 + [去竞技（不耗体力）] / [知道了]。
  - 阵容为空点挑战：抖动 + toast 附 [去战阵]。
  - 每日次数用尽（大师熔炉/竞技）：按钮变倒计时态「明日 05:00 重置」，非报错（竞技现在是 emptyState + 禁用，改为按钮倒计时态）。
- **验收**：重置存档后逐项人为触发四种错误，全部有恢复路径 CTA、无一处裸 alert、同屏 toast 永不超过 1 条。

### P0-8 reduce-motion 对新增演出逐项回归

- **目标文件**：`css/motion.css` 降级区、以及 P0-1~P0-6 全部新增动效的 JS 入口（沿用 `reducedMotion()` 短路模式）。
- **要做**：新演出全部接入 §5 替代表——时间轴→直接终态；弹道→命中处单次光斑 + 数字；飞币→直接落定；印章→直接显示；粒子全关；`vibrate` 不调用。
- **验收**：设置切「减少动效」后跑通 起炉→揭示→出征→领取→竞技 全流程：无位移动画、无粒子、无震动，且每一步结果信息完整可读。

---

## 2. P1 清单（R2 应做，做完 P0 后按序推进）

### P1-1 锻造接触帧与炉膛观感（R2 简报点名「锻造接触帧」「炉膛偏鼎」）

- **目标文件**：`js/ui/art/furnace.js`、`css/forge.css`。
- **要做**：锤击命中瞬间与砧面白闪/震屏严格同帧（现在 `hammer-swing` 320ms 与 `flash-out` 280ms 同时起播，命中感糊）；锤应落在铁砧的铁坯上（现在炉/砧分离、锤悬空砸向炉体，且炉腹双耳造型偏「鼎」，建议收窄上沿、强化炉门与砧位构图）；三炉阶色温微调已有，保持。
- **验收**：录屏逐帧检查，锤头最低点帧 = 白闪起始帧（±1 帧）；截图对比新旧炉膛构图。

### P1-2 试炼战力对比染色与克制提示

- **目标文件**：`js/ui/views/campaign.js`、`css/views.css`。
- **要做**：关卡行/出征卡战力数字染色——我方 ≥ 推荐 = `--ok`、差 15% 内 = `--warn`、更低 = `--danger`；当前关元素被我方克制时提示「宜携 X 兵器」。
- **验收**：`?demo=1` 与新档各看一次，三种颜色均出现；提示文案与克制环（火克冰克雷克火）一致。

### P1-3 竞技策略外显

- **目标文件**：`js/ui/views/arena.js`、`js/ui/mock/mockGame.js`（`arenaOpponents` 增加 `elements: []` 阵容元素数组）。
- **要做**：对手行显示全阵容元素预览（如 🔥🔥✻ 用 SVG 元素图标）而非单元素；战力高于自己的行加 `--warn` 微光「高风险高积分」；次数用尽按钮倒计时态（与 P0-7 合并）。
- **验收**：对手列表每行可见 2–5 个元素图标；高战力行有视觉区分。

### P1-4 战阵 Δ 战力飘字 + 数字滚动

- **目标文件**：`js/ui/views/lineup.js`（复用 P0-5 的 `countUp`/`floatText`）。
- **要做**：换阵/卸下时 powerplate 数字滚动 400ms，并在其旁弹 `Δ+320` 绿 / `Δ-180` 红飘字；羁绊差 1 把时显示 `2/3` 进度徽章（点击自动筛选可留 R3）。
- **验收**：换一把更强/更弱兵器各一次，Δ 方向与颜色正确、终值与 `estimatePower()` 一致。

### P1-5 图鉴收集钩子

- **目标文件**：`js/ui/views/codex.js`、`css/views.css`。
- **要做**：神话未收录剪影槽描红金边 + 常驻微流光（吊胃口）；收集进度条推进时金色流光扫过；跨加成阈值弹 toast「图鉴加成提升至 +X%」。
- **验收**：锻出新兵器后切图鉴，进度条有扫光；神话空槽与普通空槽有视觉差。

### P1-6 首启新手 3 分钟线

- **目标文件**：`js/ui/views/forge.js`、`js/ui/app.js`、`js/ui/views/campaign.js`。
- **要做**：首锻前主 CTA 常驻金光脉冲（现 `btn-sheen` 常亮，应改为「资源足够且未首锻」才脉冲）；首锻揭示后 CTA 收敛为 [上阵] 单按钮直通战阵；上阵后战阵页顶部横幅 [前往第 1 关]；首胜插入一次性祝贺卡。全程零弹窗教程。
- **验收**：`?fresh=1` 新档走一遍：锻→上阵→首战 ≤3 分钟且每步只有一个高亮主路径。

### P1-7 触觉档位与粒子预算对齐

- **目标文件**：`js/ui/views/forge.js`（vibrate 档位 10/20/26 → 20/30/[10,30,50]）、`js/ui/fx/sparks.js`（burst 计数 70/100/170/220 远超规格上限，需封顶或分帧发射使同屏活跃粒子 ≤64）。
- **验收**：DevTools 4× CPU 降速下三锤 + 神话揭示无 >32ms 长帧；`sparkField.active` 峰值 ≤64。

### P1-8 无障碍播报

- **目标文件**：`js/ui/views/forge.js`、`js/ui/views/battle.js`。
- **要做**：锻造结果 `aria-live="assertive"` 播报（「锻得 紫霄·青霜，攻击 420」）；战斗逐帧 log 不进 live region，仅结算播报胜负。
- **验收**：VoiceOver/NVDA（或 Chrome a11y 面板）确认揭示后有一次完整播报、战斗过程无噪音播报。

### P1-9 存档异常态（依赖 core 钩子，钩子缺失则顺延 R3）

- **目标文件**：`js/ui/app.js` 或 `js/main.js` 边界、`js/ui/components/feedback.js`。
- **要做**：hydrate 失败 → 全屏「兵谱残卷受损」恢复页（[导出损坏存档] textarea / [重铸新档] 红色二次确认）；localStorage 不可写 → 顶部常驻 `--warn` 警示条 + [重试写入]。需要 opus-1 暴露失败信号，先在 `round2/REQUESTS.md` 追加请求。
- **验收**：手工塞坏 `localStorage[SAVE_KEY]` 后刷新出恢复页；Safari 隐私模式（或 mock 抛错的 storage adapter）出警示条。

---

## 3. 可留 Round 3 的项（本轮明确不做，防止挤占 P0）

| 项 | 理由 |
| --- | --- |
| WebAudio 合成锤击/克制音（可关） | 规格 P2；R2 底线不含音效，vibrate 已覆盖触感 |
| 拖拽上阵（长按抓起 + ghost 跟手） | 点选两步上阵已达标且是无障碍兜底；规格可砍序列第 3 位 |
| 长按快速预览浮层 / 下拉刷新罗盘 | 详情抽屉与手动刷新可替代 |
| 兵器单件立绘（41 把 assets） | 纯资产工作量大；现有类型 sigil + 品质色可读 |
| spotlight 遮罩教程、桌面键盘网格方向键导航 | 规格 P2；首启线（P1-6）已够用 |
| 神话名毛笔字逐字**描边**入场 | R2 先做逐字淡入（P0-2 内），描边质感 R3 |
| Tab 横滑手势 + 底部滑动指示条 | 现 per-tab glow 可用；手势与滚动冲突处理成本高 |
| 竞技防守阵容独立编辑页 | 直接复用当前战阵（规格可砍第 8 位） |
| 羁绊行点击自动筛选兵器库 | P1-4 的进度徽章先行，强引导 R3 |

---

## 4. 统一验收流程（opus-4 自测口径）

1. `python3 -m http.server` 起静态服务，分别以新档（`?fresh=1`）与演示档（`?demo=1`）走查。
2. 每个 P0 完成后录屏归档：三锤时间轴、六档揭示（逐档）、火/冰/雷三场战斗、KO、领取三连、绕边流光。
3. reduce-motion 回归：设置切「减少动效」重跑上述全部路径。
4. 性能：DevTools Performance 4× CPU 降速录三锤 + 神话揭示 + 一场战斗，无 >32ms 长帧；切后台 Tab 后 rAF 全停。
5. 跨模块契约（P0-4 timeline、P1-9 存档钩子）只追加 `.agent_workspace/round2/REQUESTS.md`，不改 `js/core|combat|forge|data` 一行。
