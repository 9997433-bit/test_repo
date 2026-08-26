MODEL_SLUG: claude-fable-5-thinking-xhigh

# fable-4 — Round 3 UX 最终验收清单（交付 opus-4）

> 依据：`round2/BRIEF.md` R3 底线第 4 条（状态图标、AOE 弹道差异、设置页音效开关 + WebAudio 锤击/克制音）+ `round2/fable4-ux-gaps.md` 未落地项复核。
> 审计对象：commit `d15aa4e` 的 `js/ui/**`、`css/**`。所有目标文件均在 opus-4 所有权范围（`js/ui/**`、`css/**`）内；跨模块契约只准追加 `.agent_workspace/round3/REQUESTS.md`，不改 `js/core|combat|forge|data` 一行。
> 这是最终轮：P0 缺一不验收；P1 按序做，做不完不阻塞；WONTFIX 项一律不做，防止空转。

---

## 0. R2 已落地项（勿重做）

| 项 | 证据 |
| --- | --- |
| 战斗舞台 + 引擎 timeline 驱动（UI 不算一分伤害） | `js/ui/fx/battleStage.js`（`applyEngineEvent` 只消费事件）、`js/ui/components/battleReport.js` |
| 火/冰/雷/无 四套弹道（形态各异）+ 命中环 + 粒子 | `js/ui/fx/ballistics.js`（火抛物线 260ms / 冰旋晶 300ms / 雷折线 110ms / 刀气 180ms） |
| 受击闪白 + 抖动 + 伤害/暴击/治疗/DOT/护盾 飘字 | `css/fx.css` `.bunit.is-hit`、`.dmgfloat.is-*` |
| KO 慢动作（timescale 0.26 + 压暗 vignette + 倒地帧） | `battleStage.js` `slowMotion()`、`fx.css` `unit-ko` |
| 胜负「胜/败/平」朱印盖章 + 墨晕 | `js/ui/fx/verdictSeal.js`、`fx.css` `seal-stamp` |
| 资源飞币（领取挂机 + 战报奖励）+ 资源格微震 | `js/ui/fx/flyingLoot.js`、`forge.js`/`battleReport.js` 两处接入 |
| ×1/×2/×4 变速 + 跳过演出 + 长仗自动加速 | `battleStage.js` `speedBtn`/`skipBtn`/`baseRate` |
| mock 战报兜底（无单位表也有弹道与印章） | `battleStage.js` `applyMockEvent` |
| reduce-motion：以上全部有终态降级 + rAF 空闲即停 | `fx.css` 降级区、各 fx 模块 `reducedMotion()` 短路 |
| 失败态 goto 跳转（体力不足→工坊等） | `campaign.js` `refuse()`、`arena.js` `fight()` |

---

## 1. P0 清单（最终验收底线）

### P0-1 战斗状态图标（R3 钦定；现状：`status` 事件只进文字战报，冻结只有纯文字飘字）

- **目标文件**：`js/ui/icons.js`、`js/ui/fx/battleStage.js`、`css/fx.css`。
- **数据已就绪**：引擎 `status` 事件带 `{ targetUid, statusId, status, turns, value, bad }`；`dot` 事件带 `statusId/status/element`；`action` 事件带 `skipped, reason:'freeze'`。状态全集 11 种：burn 灼烧 / shock 感电 / chill 冰缓 / freeze 冻结 / mark 破绽 / weaken 弱化 / atkUp 战意 / guard 铁壁 / thorns 棘甲 / regen 淬体 / haste 疾风。
- **要做**：
  - `icons.js`：建 `STATUS_ICON` 映射，优先复用现有线描（burn→`flame`、chill/freeze→`snow`、shock→`bolt`、guard→`shield`、atkUp→`power`、haste→`recycle` 或新画）；缺的补 3–4 个 24×24 线描 path（mark 靶心裂纹、weaken 下坠箭、regen 回环叶、thorns 棘刺）。
  - `battleStage.js`：单位牌 `.bunit` 下新增 `.bunit__statuses` 图标行；收到 `status` 事件挂图标（buff 金边/debuff 朱边，用 `bad` 字段分色），`title` 写「名称·N 回合」；冻结跳过回合的 `floatText('冻结','status')` 改为 图标+字。
  - 到期消失：引擎不发 statusEnd 事件——UI 侧按 `turns` 在该单位每次 `action`/`round` 事件递减，归零移除；若 opus-4 认为误差不可接受，向 `round3/REQUESTS.md` 追加 statusEnd 事件请求（勿自改 combat）。
  - `css/fx.css`：`.bunit__statuses` 布局（≤4 枚，溢出合并成 +N）、12px 图标、出现/消失 160ms 缩放（reduce-motion 直接显隐）。
- **验收**：打一场含霜锁/烈焰/雷链的仗，冰缓/冻结/灼烧/感电图标随事件出现、随回合消退；冻结单位跳回合时牌上有冻结图标；reduce-motion 下图标静态可见；图鉴/战报文字行不受影响。

### P0-2 AOE 弹道差异（R3 钦定；现状：旋风斩=N 发相同单体弹道逐发飞，雷链=3 发独立弹道，与单体不可区分）

- **目标文件**：`js/ui/fx/ballistics.js`、`js/ui/fx/battleStage.js`、`css/fx.css`（如需 DOM 辅助层）。
- **数据已就绪**：旋风斩每条 damage 事件带 `tag:'aoe'`（同一 actorUid、`at` 连续）；雷链 label 为「雷链 / 雷链·2跳 / 雷链·3跳」（`tag` 缺省 `'skill'`）。
- **要做**：
  - `battleStage.js`：播放前把连续的同 actorUid + `tag:'aoe'` damage 事件聚为一组；把同 actorUid + label 匹配 `·N跳` 的连续 damage 事件聚为链。
  - `ballistics.js` 新增两个入口：
    - `sweep({from, targets, element})`：以施法者为起点的横扫弧/扩散环一次掠过全排（300–400ms），所有目标同帧闪白 + 飘字错峰 ≤60ms；
    - `chain({points, element})`：折线电弧从目标 1 依次跳目标 2/3（每跳 ~90ms），跳到即命中。
  - 命中回调仍走各自 damage 事件的 `land()`，血量顺序不变（沿用 `seq` 防乱序）。
- **验收**：`?demo=1` 竞技/试炼打到旋风斩与雷链各一次：旋风斩肉眼是「一记横扫全排同时挨打」，雷链是「电弧接力跳三口」；不再出现 3 发外形相同的并排单体弹道；同屏活跃粒子 ≤64；reduce-motion 下退化为各目标单次光斑 + 数字。

### P0-3 设置页音效开关 + WebAudio 锤击/克制音（R3 钦定；现状：全仓 0 行音频代码）

- **目标文件**：**新建** `js/ui/audio.js`；`js/ui/views/bag.js`（设置区）、`js/ui/views/forge.js`（锤击）、`js/ui/fx/battleStage.js`（命中）。
- **要做**：
  - `audio.js` 仿 `motion.js` 模式：localStorage `bqwz.ui.sound.v1`（默认开）、`soundOn()/setSound()`、懒建 AudioContext（首次用户手势内 `resume()`，规避自动播放策略）、全合成不加载资源。最少 4 个音：
    - `thud(n)` 锤击：noise burst + 90–60Hz 正弦衰减，第 3 锤更重；
    - `clang()` 克制命中：金属双音上行（短促明亮）；
    - `muffle()` 被克命中：低通闷响；
    - `shimmer()` 传说/神话揭示：三音琶音（可选，成本一函数）。
  - `bag.js` 设置卡：动效偏好下方加「音效」开/关（segmented 或 listrow + 开关），切换即存。
  - `forge.js`：每次 `strike()` 播 `thud(strikes)`；`battleStage.js`：damage 事件按 `relation` 字段（'克制'/'被克'/'普通'）分派 `clang/muffle/静默或轻点`。**音量克制**：主增益 ≤0.3，命中音随机 ±4% 音高防机枪感。
  - 备注：core 存档已有 `flags.sound` 字段但 gameAdapter 无读写动词——本轮用 UI 本地偏好即可（零契约）；如要同步进 `bqwz.save.v1`，由 opus-4 向 `round3/REQUESTS.md` 追加 setFlag 动词请求，勿直改 core。
- **验收**：设置关音效后锻造/战斗全程 0 声音且不创建 AudioContext；开着时三锤三声、克制与被克命中音色可分；刷新后开关状态保持；音效开关与动效开关互不影响。

### P0-4 三锤自动时间轴 + 接触帧同帧（R2 P0-1 + P1-1 遗留，两轮未动；现状：手动点三次「落锤」，`hammer-swing` 320ms 与 `flash-out` 280ms 同时起播，命中感糊）

- **目标文件**：`js/ui/views/forge.js`（`startForge`/`strike` 改时间轴驱动）、`css/forge.css`、`css/motion.css`。
- **要做**：起炉后自动演出（总长 ~2.4s）：t≈600/1200/1950 三锤，第三锤前蓄力悬停 150ms；每锤的震屏/白闪/火花/haptic 与锤头最低点同帧（把 `flash-out` 延至 `hammer-swing` 的命中关键帧起播，或拆 swing 为 抬锤+落锤 两段）；点击炉区任意处直接跳到揭示；主按钮在演出期间变「跳过」。haptic 档位顺手改为 20/30/[10,30,50]。手动逐锤可整段删除——验收只认自动时间轴。
- **验收**：录屏逐帧：锤头最低点帧 = 白闪起始帧（±1 帧）；三锤时刻误差 ≤80ms；跳过后仍能看到揭示；reduce-motion 下无位移动画、直接出结果。

### P0-5 品质揭示六档分级（R2 P0-2 遗留，两轮未动；现状：所有品质同一段 520ms 延迟 + 翻转，传说/神话仅多一簇火花和 toast）

- **目标文件**：`js/ui/views/forge.js`（`openReveal` 按 `w.quality` 分档）、`css/forge.css`、`css/motion.css`。
- **要做**（可裁剪的最小分档，比 R2 规格收窄）：
  - 预震延迟 0/0/300/500/800/1100ms，总长梯度 凡铁 ≤1s → 神话 ≥3s；
  - 品质横幅改「盖章式」落定（scale 1.6→1 + 轻震），CTA 行（收入行囊/再锻）延后至卡面落定后升起——现在 CTA 与卡同帧出现，屏息期为零；
  - 玄兵及以上加档位光效：玄兵边光一圈、紫霄光柱、传说金雨（≤40 粒）、神话全屏冲击环 + 兵器名逐字淡入；
  - 全部走 `reducedMotion()` 短路：交叉淡入 240ms + 静态品质光晕。
- **验收**：`?demo=1`（或 `window.bqwzApp` debug 钩子）逐档触发六种品质，录屏确认时长/强度单调递增；凡铁与神话的观感差一眼可辨；reduce-motion 下结果信息完整。

### P0-6 克制/被克飘字徽章（R2 P0-3 尾巴；现状：damage 事件的 `relation`/`multiplier` 字段完全未用，克制打击与普通打击飘字一模一样）

- **目标文件**：`js/ui/fx/battleStage.js`（damage 分支按 `e.relation` 加档）、`css/fx.css`（`.dmgfloat.is-adv` / `.is-resist`）。
- **要做**：relation==='克制' → 飘字带元素色底「克」角标、字号 +2；'被克' → 数字缩小灰化；暴击已有金色大字保持。P0-3 的音效分派复用同一分支。
- **验收**：一场混元素战斗同屏可分辨 普通/暴击/克制/被克 四级飘字；文字战报行不变。

### P0-7 错误态最小恢复路径（R2 P0-7 遗留；现状：toaster 无 action 按钮、可同屏 3 条；资源不足时主 CTA 直接 `disabled`；竞技次数用尽是 emptyState + 禁行）

- **目标文件**：`js/ui/components/feedback.js`（toast 支持 `{action:{label,onClick}}`、同文合并、错误类同屏仅 1 条）、`js/ui/views/forge.js`（资源不足：CTA 不禁用，点击→按钮晃动 ±6px + 资源条缺口项红闪 + toast「精铁不足，还差 N」附 [去试炼]）、`js/ui/views/arena.js`（次数用尽：emptyState 改为按钮倒计时态「明日辰时重置」）、`css/components.css`。
- **说明**：campaign 的 `refuse()` 已有 goto 跳转，给它补 action 按钮即可；体力倒计时 modal（R2 规格）降为 toast 文案带 mm:ss，不做弹窗。
- **验收**：新档逐项触发 资源不足/体力不足/阵容为空/次数用尽 四种错误，均有一键恢复路径；同屏错误 toast 永不超过 1 条；无裸 alert。

### P0-8 reduce-motion 与性能横切回归

- **目标文件**：`css/motion.css` 降级区 + P0-1~P0-6 全部新增动效的 JS 入口；`js/ui/fx/sparks.js`（burst 计数 70/100/170/220 封顶或分帧，使同屏活跃 ≤64，吸收 R2 P1-7）。
- **验收**：设置切「减少动效」跑通 起炉→揭示→出征→领取→竞技：无位移动画、无粒子、无震动（音效独立于动效开关）；DevTools 4× CPU 降速录 三锤+神话揭示+一场 AOE 战斗 无 >32ms 长帧；`sparkField.active` 峰值 ≤64；切后台 rAF 全停。

---

## 2. P1 清单（P0 全绿后按序推进，做不完不阻塞验收）

### P1-1 资源 count-up + 锻造扣减飘字（R2 P0-5 尾巴）

- `js/ui/components/resourceBar.js`：数字变化改 400ms count-up（`tabular-nums` 已由 `.t-num` 覆盖，确认即可）；`js/ui/views/forge.js`：`startForge` 成功时对应资源格红色 `-N` 上飘 400ms；`css/fx.css`。
- 验收：领取挂机可见「飞币 + count-up + toast」三连；起炉可见红字扣减；reduce-motion 直接落定终值。

### P1-2 品质边框「绕边」流光（R1/R2 连续点名；现状：传说/神话仍是对角掠光 `card-sheen`，`@property --sweep` 注册了没人用）

- `css/components.css`（`.wcard` 传说/神话双层伪元素 conic 描边）、`css/motion.css`、`css/tokens.css`（补 `--q-glow-*` 柔光 token）。
- 验收：`?demo=1` 背包里传说/神话卡光点沿四边循环而非斜扫；reduce-motion 退化为静态光晕。

### P1-3 试炼战力对比染色 + 克制提示

- `js/ui/views/campaign.js`（战力数字：≥推荐 `--ok`、差 15% 内 `--warn`、更低 `--danger`；当前关提示「宜携 X 兵器」）、`css/views.css`。
- 验收：三种颜色均可触发；提示与克制环（火克冰、冰克雷、雷克火）一致。

### P1-4 竞技策略外显

- `js/ui/views/arena.js`：对手行显示阵容元素预览。注意：`arenaOpponents()` 现只给单 `element`，全阵容元素数组需 opus-4 向 `round3/REQUESTS.md` 追加字段请求（opus-3 的 `ARENA_SKILL_POOL` 生成逻辑里 lineup 每员已有 element）；字段没来之前退化为「单元素 × 人数」显示。战力高于自己的行加 `--warn` 微光。
- 验收：对手行可见元素构成与风险提示。

### P1-5 战阵 Δ 战力飘字

- `js/ui/views/lineup.js`：换阵/卸下时 powerplate 数字滚动（复用 P1-1 count-up）+ `Δ+320` 绿 / `Δ-180` 红飘字。
- 验收：换强/弱各一次，方向颜色正确、终值与 `estimatePower()` 一致。

### P1-6 首启引导线（R3 简报第 3 条的 UI 侧）

- `js/ui/views/forge.js`（`btn-sheen` 常亮改为「资源足够且未首锻」才脉冲；首锻揭示 CTA 收敛为 [上阵] 直通战阵）、`js/ui/views/campaign.js`（上阵后顶部横幅 [前往第 1 关]）、`js/ui/app.js`。扫荡按钮依赖 core 动词，钩子没来就不做 UI 桩。
- 验收：`?fresh=1` 新档 锻→上阵→首战 ≤3 分钟，每步只有一个高亮主路径，零弹窗教程。

### P1-7 无障碍播报

- `js/ui/views/forge.js`：揭示结果 `aria-live="assertive"` 一次性播报（「锻得 紫霄·青霜」）；`battleStage.js`：战中 log 保持 `aria-live="off"`（已是），结算后只播报胜负一句。
- 验收：Chrome a11y 面板确认揭示/结算各一次播报，战斗过程无噪音。

---

## 3. WONTFIX（最终轮明确不做，勿动）

| 项 | 理由 |
| --- | --- |
| 拖拽上阵（长按抓起 + ghost） | 点选两步上阵已达标且是无障碍兜底；规格可砍位 |
| 兵器单件立绘（41 把资产） | 纯资产工作量，类型 sigil + 品质色已可读 |
| spotlight 遮罩教程 / 桌面键盘网格导航 | 规格 P2；P1-6 首启线已够 |
| 神话名毛笔逐字**描边**入场 | P0-5 的逐字淡入已给足仪式感 |
| Tab 横滑手势 + 滑动指示条 | 与滚动冲突处理成本高，per-tab glow 可用 |
| 竞技防守阵容独立编辑页 | 直接复用当前战阵 |
| 羁绊行点击自动筛选兵器库 | 现有 2/3 文案已可读，强引导收益低 |
| 长按快速预览浮层 / 下拉刷新罗盘 | 详情抽屉与手动刷新可替代 |
| BGM 背景音乐 | R3 底线只含音效；`flags.music` 默认 false 保持 |
| BOSS 专属镜头（R2 简报提及） | `is-boss` 大牌 + 朱红描边已有辨识度，镜头系统投入不成比例 |
| HP 红色残影层（延迟 300ms 追平） | 主条 220ms 过渡 + `is-low` 变色已可读 |
| 图鉴收集流光 / 神话剪影槽（R2 P1-5） | 纯锦上添花，让位给 P0 |
| 存档异常态恢复页（R2 P1-9） | 依赖 opus-1 hydrate 失败钩子，两轮未到位；最终轮不再挂起等待 |
| 战斗弹层改全屏视图 | 弹层内舞台 + 变速/跳过已达验收口径 |
| mock timeline 结构化改造（R2 P0-4 原案） | 引擎 timeline 已是事实来源，mock 兜底保持现状即可 |

---

## 4. 统一验收流程（opus-4 自测口径）

1. `python3 -m http.server` 起静态服务，`?fresh=1` 新档 + `?demo=1` 演示档各走查一遍。
2. 每个 P0 录屏归档：三锤自动时间轴（含接触帧逐帧）、六档揭示逐档、状态图标一场、旋风斩 + 雷链各一次、克制/被克飘字、音效开关开/关对照（录屏带系统声）。
3. reduce-motion 回归：设置切「减少动效」重跑全部路径；确认音效开关独立生效。
4. 性能：DevTools Performance 4× CPU 降速录 三锤 + 神话揭示 + 一场 AOE 战斗，无 >32ms 长帧；切后台 Tab 后 rAF 全停；`sparkField.active` ≤64。
5. 契约纪律：状态到期事件、竞技阵容元素数组、`flags.sound` 同步动词——一律追加 `round3/REQUESTS.md`，不改 `js/core|combat|forge|data`。
