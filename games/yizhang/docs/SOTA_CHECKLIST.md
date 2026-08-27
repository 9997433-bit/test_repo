# 异掌 · SOTA 分级验收清单（Round 1–3）

维护者：Fable-4（SOTA 验收）。上游依据：`.agent_workspace/yizhang/DESIGN_SEED.md`、`.agent_workspace/yizhang/CONTRACT.md`、`games/yizhang/docs/VISUAL_HANDBOOK.md`。
执行规程见同目录 `ACCEPTANCE.md`。数值调参（击退量、掌意增速等）以 Fable-3 的 `GDD.md` 为单一事实源；本清单只锁**契约常量、行为、可验证阈值**。

> **当前生效轮次：固定人物视角轮（Look Round 1–3，父分支 `cursor/yizhang-look-db8d`）—— 验收以 §12 为唯一记分表。**
> §11 是大厅轮（`cursor/yizhang-hub-db8d`，视角轮分支即由其拉出，基线 `7340300`）的记分表，其 HG/HB/HV 条目被 §12 回归门（LG-06）引用作防回退基准；§10 是手感轮存档；§0–§9 是骨架→精品系列存档。各段均不得删改。

## 0. 判定规则

- 每一项都是**二值可勾选项**，附验证方法（命令 / 文件 / 操作脚本）。勾选只由验收流程执行，开发代理不自勾。
- 所有命令默认在 `games/yizhang/` 目录下执行，Node ≥ 20。
- **R- 系列为否决项**：命中即整轮 REJECT，与完成度无关（生效轮次见 §6）。
- 分级：L0 骨架 → L1 可玩竖切 → L2 系统纵深 → L3 精品面。上级默认包含下级：验 L2 时 L0/L1 必须仍然全绿（防回退）。

### 轮次门槛（Gate）

| 轮次 | 必须全绿 | 允许桩 / 豁免 |
|---|---|---|
| Round 1 | L0 全部；L1 全部；T-01 / T-02 / T-05 / T-07 / T-09 真实断言；红线 R-10～R-13 零命中 | 木棉外 7 掌技能与觉醒、碎地、觉醒条可为**可调用不抛错的接口桩**；T-03 / T-04 / T-06 / T-08 允许 `todo/skip` 占位但文件必须存在；R-01～R-09 不计 |
| Round 2 | **退出门 G-01～G-07 全绿（见下小节，记分前置）**；L2 全部（含 L0/L1 复验）；T-01～T-09 全部真实断言 | L3 可部分；R-01～R-09 记警告不否决，但警告清单必须写进验收报告（重点按 §5.1 风险图排查） |
| Round 3 | **终局门 RG-01～RG-06 全绿（§9，重定标）**；红线 R-10～R-13 零命中 | L2/L3/M 全表转 stretch（§9.0：命中记分不否决，本轮不发 L3 签字）；R-01～R-09 维持记警告 |

### Round 2 退出门（Exit Gate · 全部二值，缺一不发 PASS）

依据 Round 1 复核（§8）增设。Round 2 验收先过这道门再开 L2 记分；**门内任何一项红 → 直接 REJECT，不再往下记分**。静态面命令并入 ACCEPTANCE §2 第 2 步。

- [ ] **G-01 测试全绿** — `npm test` 97/97 通过、退出码 0。现红 6 条必须转绿：`tests/glove-data`×2（schema、`isGloveUnlocked` 未导出）、`tests/match-lifecycle`×2（出台缘不判死、`isMatchOver` 不即时读 kills）、`tests/skills` magnet、`tests/slap-combat` 正前方命中（yaw 约定）。
- [ ] **G-02 探针有击杀** — `npm run probe` 状态 `pass` 且 `kills ≥ 1`；**探针自带的零杀 `soft-pass` 从本轮起按 FAIL 计**。基线：Round 1 实测 2 kills，不得回退到 0。
- [ ] **G-03 构建过** — `npm run build`（vite）退出码 0。
- [ ] **G-04 人类 id 统一 `p0`** — `src/main.js` 不得再有 `SELF_ID = "p1"`；输入采样、相机 `followId`、HUD/结算的 self 判定全部指向 `p0`（与 `src/sim/state.js` 一致）。验证：`rg -n '"p1"' src/main.js` 零命中 + 手动开局能走能扇。
- [ ] **G-05 八技能经 `step` 可达** — 裸 `createMatch/step`（不手动 `installData/installCombat`）即触发真实 `resolveSkill`：要么 sim 静态引入 data/combat（`src/sim/deps.js` 头注 TODO 路线），要么 main 启动时显式注入且测试口径与运行时一致。金丝雀：`tests/skills.test.js` 两条（spring/magnet）裸调必须绿；8 个 `skillId` 各至少 1 条经 `step` 的断言。
- [ ] **G-06 触控 CSS 在场且生效** — `src/styles/touch.css` 被 `loadSiblingStyles` 注入并真实驱动触控层：`data-touch="1"` 下扇击钮 ≥72×72、其余钮 ≥48×48 CSS px、间距 ≥8px 可量测（touch.css 实做 88/76、48）。
- [ ] **G-07 红线清零（R-13，Round 1 已命中）** — `src/styles/index.css` 的两条 Google Fonts `@import` 移除，字体自托管子集 woff2 或程序化字形（`fonts.css` 注释已写升级路径）；`rg -n "googleapis|gstatic" src dist` 零命中。

---

## 1. L0 · 骨架（scaffold）

- [ ] **L0-01 目录与入口齐备** — `package.json`、`vite.config.js`、`index.html`、`src/{sim,data,combat,ai,render,input,audio,ui,core,styles}`、`src/main.js`、`tests/`、`scripts/`、`docs/` 全部存在。验证：`ls` 对照 CONTRACT.md 模块表。
- [ ] **L0-02 脚本可跑** — `npm run dev` 起在 **4181** 端口；`npm test`、`npm run build`、`npm run probe` 均能退出码 0（内容可为最小实现）。验证：逐条执行。
- [ ] **L0-03 依赖纪律** — 运行时依赖仅 `three`；无 React/Vue；无版权资产；构建产物零外部 CDN / 运行时网络请求。验证：`package.json` 审读 + `rg -n "https?://" src index.html`（只允许出现在注释/文档字符串）。
- [ ] **L0-04 契约模块边界** — `src/sim`、`src/data`、`src/combat`、`src/ai` 不 import `three`、不触 DOM（`window/document/navigator`）。验证：见 T-09 命令。
- [ ] **L0-05 契约签名齐** — `createMatch/step/getView/isMatchOver`、`resolveSlap/resolveSkill/tickStatuses/applyAwaken`、`think`、`createRenderer/sync/resize/setQuality/dispose`、`createInput/sample/setEnabled`、`createAudio/unlock/play` 按 CONTRACT.md 导出。验证：import 冒烟测试（T-09 一部分）。
- [ ] **L0-06 MATCH 常量与契约逐字一致** — `dt=1/60, arenaRadius=20, playerRadius=0.7, playerHeight=2, fallY=-8, respawnDelay=1.2, invulnTime=1.0, matchSeconds=240, killsToWin=7, switchLock=0.4, awakenDuration=8`。验证：单测断言（并入 L1-08）。
- [ ] **L0-07 隔离** — 改动只落在 `games/yizhang/**` 与本代理工作区；不碰 `games/` 其他游戏、仓库根 workflow。验证：`git diff --name-only <base>` 审读。

## 2. L1 · 可玩竖切（Round 1 完成线）

- [ ] **L1-01 走位带惯性** — WASD 移动有加减速曲线（非瞬时满速/瞬停）；yaw 随鼠标转。验证：手动 + 可选速度斜坡单测。
- [ ] **L1-02 第三人称相机** — 相机跟随、鼠标（触屏为右侧空白拖动）转向；**无任何锁敌 / 自动瞄准**（红线 R-12）。验证：手动 + `rg -in "lock.?on|auto.?aim" src` 无功能命中。
- [ ] **L1-03 木棉扇击三段** — 前摇 `windup` → 锥形命中判定 → 后摇 `recovery`；**打空同样吃后摇**；前摇期间无判定帧。验证：T-01 + 手动。
- [ ] **L1-04 击退是速度冲量** — 命中写入 `vx/vz` 水平冲量而非瞬移，方向与大小可测。验证：T-02。
- [ ] **L1-05 掉岛-重生闭环** — `y < fallY` 或水平离台心 `> arenaRadius + 0.2` 且脚下无台 → 死亡；`respawnDelay=1.2s` 后重生并带 `invulnTime=1.0s`；kills/deaths 记账、连胜断。验证：T-05。
- [ ] **L1-06 至少 1 个能战的 Bot** — `think(view, botId, rng)` 返回合法 Input；会追、会扇、能把人扇下岛也会被扇下岛。验证：手动 + T-07 活性断言。
- [ ] **L1-07 触控壳出现且尺寸达标** — 触屏（或 devtools 触控仿真）下出现：左虚拟摇杆、右下扇击大钮 **≥72×72 CSS px**、技能/换掌/冲刺/跳钮 **≥48×48 CSS px**、钮间距 ≥8px；摇杆与扇击真实驱动输入；canvas 区 `touch-action: none` 只转视角。验证：devtools 量测 + 手动。
- [ ] **L1-08 八掌数据表齐** — `GLOVES` 含 cotton/granite/gale/frost/spring/afterimage/magnet/meteor 共 8 条，每条含契约最低字段（`id,name,role,color,slapRange,slapAngleDeg,slapPower,slapCooldown,windup,recovery,skillId,skillCooldown,unlock`）；`GLOVE_BY_ID` 与 `MATCH` 导出正确。验证：schema 单测（含 L0-06）。
- [ ] **L1-09 L2 接口桩可调** — `resolveSkill`、`applyAwaken`、碎地块数据字段（子块 HP 结构）存在且调用不抛错（允许 no-op）。验证：冒烟单测。
- [ ] **L1-10 命中/击退/掉落单测全绿** — `npm test` 退出码 0，且包含 T-01/T-02/T-05 的真实断言。
- [ ] **L1-11 固定步主循环** — 模拟固定 1/60 + 渲染插值；`document.hidden` 时暂停，回前台不发生 dt 累积爆炸（累积步数封顶）。验证：代码审读 + 切后台 30s 回来手动验证。
- [ ] **L1-12 视图纯净 & 状态可克隆** — `getView(state)` 深等于 `JSON.parse(JSON.stringify(view))`（无函数/类实例）；`structuredClone(state)` 后可继续 `step`。验证：单测。

## 3. L2 · 系统纵深（Round 2 完成线）

- [ ] **L2-01 双掌配装** — 主菜单选主掌+副掌；Q/换掌钮切换 `activeSlot`，`switchLock=0.4s` 内禁扇禁技能；HUD 显示当前/副掌与锁定倒计时。验证：手动 + 切换锁单测。
- [ ] **L2-02 掌意三来源** — 扇中 / 被扇 / 技能命中三种事件都涨 `meter`（数值按 GDD），HUD 有材质化掌意条。验证：单测（三来源各断言一次）+ 手动。
- [ ] **L2-03 觉醒 8s** — meter 满触发觉醒，`applyAwaken` 覆盖 range/power/行为，持续 `awakenDuration=8s` 后精确还原；觉醒有可见形态变化与音效。验证：单测（时序+还原）+ 手动。
- [ ] **L2-04 台面碎裂改变边线** — 4 个可破坏区由子块组成，子块有 HP；重击（磐石砸地、陨掌落地、觉醒强击）扣 HP；HP≤0 子块消失，人可从洞掉落，掉落判定跟随新边线。验证：碎地单测（砸穿→站上去→掉落）+ 手动。
- [ ] **L2-05 八掌主动技全实装** — 8 个 `skillId` 行为互异：磐石蓄力砸地小范围击飞、疾风面向冲刺途中可扇、冰霜霜弧减速、弹簧 0.5s 反击、分身残影+短距换位、磁掌拉近面前 1 人、陨掌腾空砸下；木棉无主动但扇速最快。验证：技能矩阵单测（每技能 ≥1 断言）+ T-03/T-04。
- [ ] **L2-06 八掌觉醒全实装** — 每掌觉醒至少 1 条可测差异（木棉第 3 下强击退、磐石砸裂地面、疾风冲刺可转向一次、冰霜可冻 0.8s、弹簧弹回附带小跳、分身残影假挥掌、磁掌拉 2 人短暂黏住、陨掌落地裂一圈台）。验证：觉醒矩阵单测。
- [ ] **L2-07 手感差异化** — 数据层：任意两掌在 `(slapRange, slapAngleDeg, slapPower, slapCooldown, windup, recovery)` 六元组上不完全相同（单测）；体验层：盲玩识别 ≥6/8（评分卡见 ACCEPTANCE §7）。
- [ ] **L2-08 三种 Bot 性格可区分** — brute 硬冲 / fox 绕边 / bully 偏残血与绕背；headless 统计可分（如 fox 平均离台心距离 > brute；bully 目标选择偏向低连胜/残血目标），探针输出统计。验证：`npm run probe` 性格统计段。
- [ ] **L2-09 解锁与存档健壮** — 局内挑战完成 → 解锁 flag → `localStorage['yizhang-save-v1']`；损坏/缺失存档回退默认不崩溃；cotton 永远可用。验证：T-06。
- [ ] **L2-10 完整对局流** — 4 分钟或先到 7 杀结束；结算界面（击杀/死亡/最长连胜/达成的挑战）；可再来一局；暂停菜单可用。验证：手动 + `isMatchOver` 单测。
- [ ] **L2-11 新系统进 view 并有表现** — 换掌、掌意、觉醒、碎地全部进 `getView`，渲染与音频有对应表现（占位表现可，精品度归 L3）。验证：view 字段单测 + 手动。
- [ ] **L2-12 确定性（联网铺路）** — 同 seed + 同输入序列，3600 步后两次运行 `getView` 序列化逐字节一致。验证：T-08。

## 4. L3 · 精品面（Round 3 完成线）

### 视觉与表现（对照 VISUAL_HANDBOOK，底座 B）

- [ ] **L3-01 底座 B 一致性** — 风格化精品；不混底座 A/C；不复用仓库水墨风；主体灰度剪影可读（手册 §14-1）。验证：截图灰度化评审。
- [ ] **L3-02 色彩纪律** — 暮蓝天空 + 暖黄裂纹为基调，限 4–6 色相；全图饱和峰值只落在**当前手套识别色**（手册 §5.11、§2-16）。验证：截图评审 + 取色抽查。
- [ ] **L3-03 材质分离** — 手套比头大，但皮革/金属/布/磨损粗糙度肉眼可辨（手册 §4.1/4.2/4.3/4.10）；岛面石材有层理、被踩磨亮的路径、裂纹发暖黄光。验证：三材质特写截图对比 + 渲染参数核查（roughness 至少 3 档）。
- [ ] **L3-04 有理由的光** — 单一明确主光方向 + 反弹色染色的暗部；无死黑、无均匀平光（手册 §5.3、§14-2/9）。验证：截图逐亮部指认光源。
- [ ] **L3-05 VFX 有形状-衰减-残留** — 扇击/技能/觉醒/碎地特效粒子有形状与生命周期变化，事后留尘/裂纹贴花/余烬（手册 §10）；重击有 2–4 帧 hit-stop 与按质量分级的相机震动（手册 §11.3）。验证：慢放录屏评审。
- [ ] **L3-06 HUD 材质化** — 70% 屏幕无 UI；条/钮有材质框与磨损；伤害反馈不用全屏红闪；**自带可分发字体或程序化字形**（禁裸系统字体栈），字重/字距有层级；触控钮同样材质化（手册 §9.2）。验证：devtools computed font + 截图评审。
- [ ] **L3-07 动画质感** — 扇击有预备-发力-跟随的时间分配；击退有过冲-回稳；手套/布饰随动滞后 1–3 帧（手册 §11.1/11.2）。验证：慢放录屏。
- [ ] **L3-08 合成音频分层** — WebAudio 合成：挥空/命中/碎地/觉醒/坠落至少 5 类，有优先级与音量 duck，无爆音；首次 pointer 解锁。验证：手动 + `src/audio` 审读。

### 移动端硬指标（M-）

- [ ] **M-01 横屏优先、竖屏可玩** — 竖屏下布局重排，摇杆/扇钮不被遮挡不重叠。验证：真机双方向实测。
- [ ] **M-02 触控目标尺寸** — 复验 L1-07：普通钮 ≥48×48 CSS px、扇击 ≥72×72、间距 ≥8px（真机量测）。
- [ ] **M-03 安全区** — HUD 与触控钮应用 `env(safe-area-inset-*)`，刘海/圆角/手势条不遮挡。验证：真机（或仿真 notch）。
- [ ] **M-04 DPR 封顶 2** — `min(devicePixelRatio, 2)` 生效。验证：代码 + 3x 设备实测渲染分辨率。
- [ ] **M-05 画质自动分档** — 启动 ≤2s 探测定 high/mid/low，可手动覆盖，档位影响可见（分辨率/阴影/粒子数）。验证：手动 + CPU 节流复测。
- [ ] **M-06 中端 Android 帧率** — 1v3 战斗（含觉醒+碎地同屏）30s 采样：avg ≥50fps 且 p95 帧时长 ≤25ms；**不达标则自动降档到 low 后必须回到 ≥50fps**。测量协议见 ACCEPTANCE §8。
- [ ] **M-07 多点触控无误触** — 摇杆+扇击同时按住正常；canvas 拖动只转视角不滚动页面。验证：真机。

### 性能与工程（L3-09～12）

- [ ] **L3-09 桌面 60fps** — 常规开发机 high 档 1v3 战斗稳 60fps。验证：ACCEPTANCE §8 协议。
- [ ] **L3-10 预算** — 构建 JS gzip 总量 ≤1.2MB；mid 档 draw calls ≤120、三角形 ≤80k（`renderer.info` 读数）；战斗 30s 无每帧 GC 尖峰（热路径对象池/复用）。验证：`npm run build` + du；devtools Performance 面板。
- [ ] **L3-11 headless 模拟预算** — Node 20 下平均 `step` ≤0.5ms；60s 模拟 heap 增长 ≤20MB。验证：`npm run bench` / probe 输出。
- [ ] **L3-12 加载** — 本地 `npm run preview` 冷加载到可操作 ≤3s；产物零外链。验证：devtools Network（禁缓存）。

---

## 5. R- · 廉价信号否决表（手册 cheap-signal → reject）

| ID | 廉价信号 | 手册出处 | 本游戏检查点 | 检查方法 |
|---|---|---|---|---|
| **R-01** | 塑料高光 / 万物同一反光度 | §2-1、§4 | 手套的金属/皮革/布必须粗糙度分离；岛面石材≠塑料 | 三材质特写截图对比；render 材质参数核查 |
| **R-02** | 发光描边（glow outline） | §2-4、§5.4 | 主体突出只许用边缘光+明度对比；禁 OutlinePass/描边 shader/选中光圈 | `rg -in "outline" src/render src/styles` 排查 + 截图 |
| **R-03** | Bloom 糊屏 | §2-14 | 全屏泛光禁止；bloom（若有）只作用于真实高亮发射源，low 档可关 | 后期链参数核查 + 截图 |
| **R-04** | 系统字体 HUD | §2-6、§9 | HUD/菜单/触控钮禁裸系统字体栈；自带可分发字体或程序化字形，字重字距有层级 | devtools computed font + `src/styles` 字体声明 |
| **R-05** | 纯色光球 / additive blob VFX | §2-11、§10 | 所有特效粒子要有形状、生命周期衰减、事后残留；禁纯 additive 糊屏 | 慢放录屏 + VFX 代码审读 |
| **R-06** | 居中摆拍 / 贴纸式等距摆放 | §2-5、§6.7 | 主菜单、结算界面构图不对称、有层次遮挡 | 截图评审 |
| **R-07** | 均匀平光（无方向无阴影设计） | §2-7 | 场景必须有单一有理由主光与阴影形状 | 截图逐亮部指认光源 |
| **R-08** | 万物崭新零磨损 | §2-13、§4.10 | 岛面、手套、HUD 框至少各有一处叙事性磨损 | 截图评审（手册 §14-5） |
| **R-09** | 全图过饱和 / 彩虹色板 | §2-3、§2-16 | 饱和只留给当前手套识别色；违者拒 | 截图取色抽查 |
| **R-10** | 混用底座 A/C、仓库水墨风 | §3 | 全部美术资产只许底座 B 语言 | 横向一致性评审（手册 §14-15） |
| **R-11** | IP 触碰 | 种子红线 | 官方手套名、徽章跑图、方块人审美、商标——一律禁 | `rg -in "roblox|slap battle" games/yizhang` + 命名/美术评审 |
| **R-12** | 锁敌自动瞄 | 种子红线 | 任何形式的 lock-on / aim assist 禁 | 代码排查 + 手动 |
| **R-13** | 版权资产 / 运行时外链 | 种子红线 | 音频全合成、模型全几何体、零 CDN | L0-03 命令 + 构建产物审读 |

**生效轮次**：红线组 **R-10～R-13 全轮即时否决**；美术组 **R-01～R-09** Round 1 不计（占位美术豁免）、Round 2 记警告并列入报告、Round 3 命中即否决。

### 5.1 Round 2 廉价信号风险图（真 CSS + Three 落地后的实测排查点）

Round 1 时美术组豁免；现在 `src/styles`（F2）与 `src/render`（Three）都是真实现，下表是 Fable-4 复核（§8）在代码里实际找到的风险点。Round 2 验收按表逐条留证据（截图 / rg 输出 / computed style），命中记 WARNING 入报告；Round 3 起按 R 表否决。

| # | 风险 | 现状证据（复核实查） | 关联 R 项 | 检查方法 / 处置 |
|---|---|---|---|---|
| K-1 | **双 HUD 同名类打架** | `src/ui/shell.css`（291 处 `yz-*`）与 `src/styles/**` 定义同名类；styles 经 `loadSiblingStyles` 后注入、靠层叠序压住 shell.css，双源随时漂移反转 | R-04 / R-06 / R-08 的证据污染源 | devtools 逐关键类（计时、掌位、触控钮）核对生效样式来源；处置：shell.css 收缩为 critical fallback，视觉唯一真源归 `src/styles` |
| K-2 | **字体 token 分叉 → 系统字体 HUD** | shell.css 自定义 `--yz-display/--yz-body/--yz-num`（系统字体栈：Songti SC / Georgia…），而 F2 `fonts.css` 定义的是 `--yz-font-display/--yz-font-text/--yz-font-num` —— 变量名对不上，shell 侧规则赢时 HUD 落系统字体 | **R-04** | devtools computed font 抽 HUD 计时 / 掌名 / 按钮三处；处置：统一 token 名（向 `--yz-font-*` 收敛） |
| K-3 | **字体外链 CDN** | `src/styles/index.css` 两条 googleapis `@import` 原样进 `dist` 内联 CSS 串 | **R-13（已命中，见 §8）** | 退出门 G-07；零命中后复查 `rg -n "googleapis|gstatic" src dist` |
| K-4 | **fallback Canvas2D 顶班 = 整场塑料/平光** | `createRenderer` 抛错即静默降级到 `src/core/fallback/render2d.js`（平光、无材质、无主光、自绘 2D 视图）；main 只发一条降级 toast 就继续开局 | R-01 / R-07（以整场形式命中） | 验收截图前必须先验渲染器身份：降级提示零条、走 Three 路径；若实机常态落 2D，按 R-01/R-07 记 WARNING 并指派修复 |
| K-5 | **bloom 全档常开** | `src/render/config.js` 三档均带 `bloomStrength` 0.7–0.9；选择性 bloom 层（`bloomSelf` 标记）设计合规，但 low 档应可关（R-03 检查点原文） | R-03 | 截图评审强度（只许真实发射源发光）；low 档验证可关闭 |
| K-6 | **UI 发光 / 光球边界** | 觉醒条 sweep 高光动画、手套 swatch 径向渐变光球式图标（shell.css / hud.css） | R-02 / R-05 边界 | 截图评审判读：当前判 UI 装饰可接受，但不得扩散到 3D 主体（无 OutlinePass、无选中光圈） |

---

## 6. T- · 必备测试与探针（MUST EXIST）

载体：`npm test`（vitest，`tests/**`，GPT-sol-1 负责）与 `npm run probe` / `npm run bench`（`scripts/**`，GPT-sol-2 负责）。建议在测试标题内带 `[T-xx]` 便于验收 grep；验收以行为断言为准。

| ID | 名称 | 必须断言的行为 | 载体 | 真实生效轮次 |
|---|---|---|---|---|
| **T-01** | 扇击命中锥 | 锥内（range 内且 ≤slapAngleDeg/2）命中；超距、角度外、正背后不命中；前摇期间无判定；一次扇击不重复命中同一目标 | vitest | Round 1 |
| **T-02** | 击退向量 | 冲量写入 `vx/vz` 非瞬移；方向与 GDD 约定一致（沿攻击朝向水平分量）；大小随 `slapPower` 单调递增 | vitest | Round 1 |
| **T-03** | 弹簧反击 | 反击窗口 0.5s 内被扇 → 攻击者吃反向冲量、防守者免/减击退（按 GDD）；窗口外正常；觉醒时弹回附带 `vy>0` 小跳 | vitest | Round 2 |
| **T-04** | 磁掌拉近 | 面前最近 1 人被拉至面前近距；背后/超距目标不拉；觉醒拉 2 人并施加短暂黏滞 status 且到时清除 | vitest | Round 2 |
| **T-05** | 掉落/重生 | `y<fallY` 与出台缘+0.2 无支撑两种死法；respawn 1.2s、invuln 1.0s 时序精确；kills/deaths 记账；连胜断 | vitest | Round 1 |
| **T-06** | 解锁 flags | 挑战完成置 flag；写读 `yizhang-save-v1` roundtrip；损坏 JSON 回退默认不抛；cotton 恒可用 | vitest（jsdom/mock storage） | Round 2（R1 可 todo） |
| **T-07** | 60s 1+3 Bot headless | `createMatch({seed, botCount:3})` + 1 human（零输入或脚本输入）跑 3600 步 ×3 个固定 seed：零异常；全场无 NaN/Infinity；坐标有界（\|x\|,\|z\| ≤ 40，y ≥ fallY-5 或已判死）；活性：bot 扇击尝试 ≥10 且发生 ≥1 次命中或掉落；输出 `avgStepMs` | probe + vitest 冒烟 | Round 1 |
| **T-08** | 确定性 | 同 seed + 同输入序列两次独立运行，3600 步后 `getView` 序列化逐字节一致 | probe | Round 2 |
| **T-09** | 契约静态探针 | `src/{sim,data,combat,ai}` 无 `three`/DOM 引用；契约导出齐全可 import；`getView` JSON-pure | rg + vitest 冒烟 | Round 1 |

验收 grep（七项存在性速查）：

```sh
rg -l "T-0[1-9]" tests scripts   # 或按行为逐条核对
```

---

## 7. 快速索引：轮次 × 必查项

- **Round 1**：L0-01…07；L1-01…12；T-01/02/05/07/09；R-10…13。**实测判定见 §8：REJECT。**
- **Round 2**：先过退出门 G-01…07（§0）；复验 L0/L1；L2-01…12；T-01…09 全部；R-01…09 警告扫描（按 §5.1 风险图）；R-10…13。
- **Round 3**：复验 L0/L1/L2；L3-01…12；M-01…07（真机）；R-01…13 全表零命中；性能协议实测报告（ACCEPTANCE §8）。

---

## 8. Round 1 实测记分（Fable-4 复核 · Round 2 开工基线）

复核对象：`cursor/yizhang-db8d` @ `863bd0d`（Round 1 十路合入后）。复核日期：2026-08-26。
实测：`npm test` **91/97（6 红，退出码非 0）**；`npm run probe` **PASS**（3600 步 / **2 kills** / 4 人全移动 / p99 0.042ms / `ai:"think"`，单 seed `0x1a2b3c4d`）；`npm run build` 退出码 0（gzip 主 chunk ≈158KB，含 three）。

### 判定：Round 1 = REJECT（L1 未达 + 红线 1 命中）

**L0：6/7。** L0-03 FAIL：`src/styles/index.css` 顶部两条 `@import url("https://fonts.googleapis.com/…")` 原样进入 `dist`（`dist/assets/index-*.js` 内联 CSS 串可查），构建产物存在运行时外链 —— 同时命中红线 **R-13（零 CDN）**。其余 L0 项绿（T-09 静态检查零命中：sim/data/combat/ai 无 three、无 DOM）。

**L1：未达 —— 12 项中 3 绿 / 1 部分 / 8 FAIL。** 判定原则：模块内绿 ≠ 整包绿，按整包记。

| 项 | 判定 | 一句话证据 |
|---|---|---|
| L1-01 走位惯性 | FAIL | sim 模块绿，但 `src/main.js` `SELF_ID="p1"` 而 sim 人类是 `p0`（`src/sim/state.js`）——实机输入打到不存在的 id，玩家不动 |
| L1-02 第三人称相机 | FAIL | `createRenderer({ followId: "p1" })` 跟随不存在的玩家 |
| L1-03 木棉三段 | FAIL | `src/combat` 内测绿，但默认 `step` 走 `sim/fallback-combat`（无人调 `installData/installCombat`）；契约测 `tests/slap-combat` 正前方命中红（yaw 约定分裂） |
| L1-04 击退冲量 | FAIL | 同上：模块绿、契约测红（正前方目标零加速） |
| L1-05 掉岛-重生 | FAIL | 出台缘死法契约测红（护栏把人夹在 rim 上不判死）；`y<fallY` 路径绿 |
| L1-06 能战 Bot | PASS | probe 2 kills、`ai:"think"`、4 人全移动 |
| L1-07 触控壳 | FAIL | `src/styles/touch.css` 在场且尺寸达标（88/76、48、间距 8），但输入经 `SELF_ID="p1"` 落空 —— CSS 有、驱动断 |
| L1-08 八掌数据表 | FAIL | `GLOVES` 8 条在，但 `tests/glove-data` 两红：字段 schema 不合 + `isGloveUnlocked` 未导出 |
| L1-09 L2 接口桩 | PASS | `resolveSkill / applyAwaken / 碎地子块字段` 存在可调不抛错 |
| L1-10 单测全绿 | FAIL | 91/97，退出码非 0 |
| L1-11 固定步主循环 | 部分 | `core/loop.js` 固定 1/60 + 插值 + `hidden` 暂停 + 累积封顶（代码审读绿）；切后台 30s 手动复验未做 |
| L1-12 视图纯净/可克隆 | PASS | sim 内测 + `tests/sim-determinism` 绿 |

**L2 / L3：维持未验收，定义与条目不变**（Round 2/3 按原表执行）。L2 当前明知的硬阻塞：默认 `step` 用兜底棉掌 —— `installData/installCombat` 无人调、`src/sim/deps.js` 的 `autoWireOptionalDeps` 也无人调，8 技能进不了局；`tests/skills.test.js` 裸 `createMatch/step` 就是金丝雀（magnet 红）。修法进退出门 G-05。

**T 表现状：** T-09 绿；T-07 部分（probe 单 seed，且允许零杀 `soft-pass`，距「3 固定 seed + 活性硬断言」规格有差）；T-01/02/05 契约测各有红；T-03 spring 绿、T-04 magnet 红；T-06 红（`isGloveUnlocked` 缺）；T-08 部分（vitest 侧 1 条确定性绿，probe 侧双跑逐字节对比未做）。

**红线：** **R-13 命中**（Google Fonts CDN，上文）。R-10 / R-11 / R-12 零命中（关键词扫描只中检查命令自身；无 lock-on 功能命中）。

**结转：** 全部 FAIL 项收敛为退出门 G-01～G-07（§0），廉价信号预扫收敛为 §5.1 风险图。

---

## 9. Round 3 终局门（Final Gate · 重定标）与实测记分

### 9.0 重定标声明

Round 3 调度指令（父调度器 · 异掌 R3）将本轮验收目标收敛为六项**终局门 RG-01～RG-06**；原 §0 Round 3 行的「L3 全部 + M-01～07（真机）+ 性能实测报告」**转为 stretch**：命中即记分入报告，不齐不单独否决。理由：Round 2 合入后 L1 主链已通、L2 代码在但测试未全绿（见 `.agent_workspace/yizhang/round2/BRIEF.md`），单轮内 L3 精品面与真机矩阵无法与测试全绿并行压实；**本轮不发 L3 签字**，L3/M 条目定义原样保留供后续补验。红线 R-10～R-13 不受重定标影响，全轮即时否决。

### 9.1 终局门定义（全部二值，缺一不发 PASS）

- [ ] **RG-01 测试全绿** — `npm test` 退出码 0、零红、**零文件加载失败**。分母注意：`src/combat/sim-integration.test.js` **整文件加载失败**（import 已删除的 `sim/fallback-combat.js`）时其 8 条用例根本不进分母——首验口径 152（145 绿）、复验口径 158（156 绿）、修复加载后全绿目标 ≈ **166/166**。「152/152」只是下达指令时点的速记，验收以**退出码 0** 为准。
- [ ] **RG-02 探针击杀 + 真实战斗** — `npm run probe` `status:"pass"` 且 `kills ≥ 1`，且真实战斗接线为真：字段现名 **`wiredCombat`**（由 `usingRealCombat` 更名，读数仍取自 sim；语义与更名经过见 §9.2），probe 已内建 `wiredCombat !== true` 即抛错的硬断言。
- [ ] **RG-03 构建过** — `npm run build`（vite）退出码 0。
- [ ] **RG-04 零 googleapis/gstatic** — `rg -n "googleapis|gstatic" src dist index.html` 零命中（R-13 静态面；注意 `index.html` 不在 `src` 下，必须单列）。
- [ ] **RG-05 人类 id 唯一 `p0`** — `rg -n '"p1"' src/main.js` 零命中；probe roster 校验 human=`p0`。
- [ ] **RG-06 八掌经裸 `step` 可达** — 不做任何 `install*`，裸 `createMatch/step` 下 8 个 glove 各有 ≥1 条可观测行为断言（7 个主动技行为互异生效 + cotton `"none"` 安全 no-op），且全程 `getDeps().usingRealData && usingRealCombat`。

### 9.2 `usingRealCombat` 标志语义（勘定 · Round 2 简报风险 #1 落档）

**代码事实**（`src/sim/deps.js`）：sim **静态 import** 真实 `../data/gloves.js` 与 `./combat-bridge.js`（桥内接真实 `src/combat`）；`installData/installCombat` 仅供测试装替身；`usingRealCombat = !combatMod` —— **true = 没装替身 = 正在用静态引入的真实战斗桥**。生产（浏览器 main、裸 `createMatch/step`）无人调 `install*`，恒为 true（实测：裸路径 `usingRealData=true usingRealCombat=true`）。语义没有写反，**是探针的读法反了**。

**探针为何读到 false**：`scripts/harness.mjs` 的 `installSimulationDependencies` 只要看到 `installCombat` 钩子存在，就把原生 `src/combat/index.js` 装进去——标志按定义翻成 false，probe 再打印「real combat not wired」。这是**自伤误报**：装进去的模块本身就是真实 combat，但它讲 combat 原生方言（yaw 朝 +Z、自带 `cd/busyUntil`、返回形状不同），**绕过了 combat-bridge 的适配**——探针实际压的是一条「混合方言」路径：技能在这条路径上会哑（`tests/skills.test.js` 两条金丝雀红的根因即此），扇击恰好方言兼容所以仍能出 kills。

**修法（GPT-sol-2）**：harness 删除 `installSimulationDependencies` 自装（ADR-19 后静态接线是默认）；探针即自然回报真值并真正压测生产路径。
**判读规则（验收侧）**：harness 修复前，probe 的 `usingRealCombat:false` **不按未接线记**，以裸路径 `getDeps()` 读数与 RG-06 矩阵为准；修复后按字面判读，false 即门红。

**勘定后续（@ `8dff71e` 已落地，复验确认）**：harness 自装已删除；probe 改为**硬断言**接线（`wiredCombat !== true` 直接抛「production combat is not statically wired」），输出字段由 `usingRealCombat` **更名为 `wiredCombat`**（读数仍取自 sim 的 `usingRealCombat`）；`deps.js` 增加**真身识别**——把真实模块（或其等价翻译版）装回去折算为静态路径、不再当替身，`installCombat(真实 combat)` 不再翻假标志。自此按字面判读。

### 9.3 Round 3 实测记分（首验基线 @ `160122a` → 复验 @ `8dff71e`）

复核对象：`cursor/yizhang-db8d`。复核日期 2026-08-26，全部命令实测重跑两轮：**首验**在 Round 2 合入态 `160122a`（R3 执行代理工作未落地时的诚实基线）；**复验**在合入 R3 修复（probe 静态接线、字体摘除、出盘判死、技能 id 定稿、测试对齐）后的 `8dff71e`。

| 门 | 首验 @ `160122a` | 复验 @ `8dff71e` | 复验证据 |
|---|---|---|---|
| RG-01 测试全绿 | FAIL：145/152（7 红）+ 1 文件加载失败 | **FAIL（收窄）**：156/158（2 红）+ 同一文件仍加载失败 | 余红分解见 §9.4：`sim-integration.test.js` 仍 import 已删除的 `fallback-combat.js`（8 条不进分母，修复后全绿目标 ≈166）；`glove-data` awakenModifiers schema；`wiring` data 装表期望值变化 |
| RG-02 探针 | PASS（按 §9.2 判读：kills=3 但标志误报 false） | **PASS（字面）** | `status:"pass"`、`kills=1`（≥1 达标；由 3 降 1 系探针改压真实桥路径，未回退到 0）、`wiredCombat:true`、探针打印「real combat wired」、p99StepMs=0.111、`ai:"think"`、botSlapAttempts=4884 |
| RG-03 构建 | PASS | PASS | vite 退出码 0；主 chunk 590kB / gzip ≈160kB（含 three），总 gzip 远低于 1.2MB 预算 |
| RG-04 零 googleapis | FAIL：CSS `@import` ×2 + preconnect ×2，全进 dist | **FAIL（收窄）** | `src/styles/index.css` 两条 `@import` 已拔除（src 与 dist 的 CSS 零命中，字体改系统精品栈）；**残留 `index.html` 17–18 行两条 preconnect**，原样拷进 `dist/index.html`——已无实际字体请求跟随，但按 R-13「零 CDN/零外链」字面仍命中，删两行即绿（Opus-4） |
| RG-05 p0 | PASS | PASS | `SELF_ID="p0"`（`src/core/view.js`）；`rg '"p1"' src/main.js` 零命中；probe roster 校验 human=p0 通过 |
| RG-06 八掌经裸 step | PASS | PASS | 裸矩阵 8/8（无任何 `install*`）：granite 目标位移、gale 冲刺 8.16m、frost 挂 `slow`、spring 反弹 vz=10.81、afterimage 换位 3.00m、magnet 拉近 4.00→1.40m、meteor 腾空 4.65 + 目标冲量 2.47、cotton（`skillId:null`）安全 no-op；全程 `usingRealData/usingRealCombat=true` |

**判定（@ `8dff71e`）：REJECT——但只差两口气。** 4/6 门绿；RG-01 余 2 红 + 1 加载失败（全是测试侧，见 §9.4），RG-04 余 `index.html` 两行死 preconnect（同时是 R-13 红线字面命中，按规则仍即时否决）。两项修复合计约 3 个文件的小改；修完复跑本表即可签发 R3 PASS。绿项终验时只需复跑防回退。

**补记（三验 @ `af10784`，全套命令重跑）**：木棉 `skillId` 定稿为空串（同时满足字符串契约与 falsy 契约，`2807a9f`）连带 `glove-data` schema 转绿——测试 **157/158（1 红）** + 同一文件加载失败；probe PASS（kills=1、`wiredCombat:true`）、build 过、裸矩阵 8/8、p0 零命中均复跑无回退。**R3 签发 PASS 只剩三处**：① `sim-integration.test.js` 死 import（§9.4 #0）；② `wiring` data 装表期望（§9.4 #5）；③ `index.html` 17–18 两行 preconnect（RG-04）。判定维持 REJECT。

### 9.4 RG-01 红项分解（首验七红一载 → 复验二红一载 → 三验一红一载）

首验 7 红中 **6 条是测试陈旧**（ADR-19 静态接线 / schema 冻结 / 技能哨兵之后没跟上），**1 条疑似实现 bug**；另有 1 个文件加载失败。修测试或修实现均可，**禁止空 expect**（§4 造假条款照常适用）。复验（@ `8dff71e`）后状态如下：

| # | 红项 | 根因 | 复验状态 | 指派 |
|---|---|---|---|---|
| 0 | `src/combat/sim-integration.test.js`（整文件加载失败） | import 已删除的 `sim/fallback-combat.js` | **仍红** —— 文件第 11 行原样，8 条用例仍不进分母 | GPT-sol-1（改写对照组） |
| 1 | `tests/glove-data` schema | 测试期望 `awakenModifiers:{slapRangeMul,…,special}` 形状，F3 实表已是 `{params:{…}}` 形状 | **已绿（三验 @ `af10784`）** —— F3 数据侧定稿（含木棉 `skillId:""`，`2807a9f`） | 已结（Fable-3） |
| 2 | `tests/match-lifecycle` 出台缘 | 摆位后第 1 步 `alive` 即 false——判死时机与测试口径分裂 | **已绿** —— sim 出盘判死跟随新口径（`173ab5d`/`0148af8`） | 已结（Opus-1） |
| 3–4 | `tests/skills` spring/magnet | `beforeEach` `installCombat(原生 combat)` 压掉静态桥 → 混合方言技能哑（§9.2）；裸路径 8/8 绿 | **已绿** —— 测试删掉 `install*` 改走裸路径 | 已结（GPT-sol-1） |
| 5 | `wiring` data 装表 | 期望 install 后掌表数值变化；ADR-19 后静态默认就是真表（1.15 = 1.15，无从「变」） | **仍红** —— 期望未更新 | GPT-sol-1 |
| 6 | `wiring` usingRealCombat | 期望 install 后为 true；旧语义 install ⇒ false | **已绿** —— deps.js 真身识别落地（§9.2 勘定后续） | 已结（Opus-1/GPT-sol-2） |
| 7 | `wiring` alignSkillIds | 期望 `cotton.skillId` 为假值；与当时的 `"none"` 哨兵冲突 | **已绿** —— F3 定稿 `skillId:null`（`97cf017`），假值成立 | 已结（Fable-3） |

**剩余清单（RG-01 转绿的全部工作，三验后）**：#0 改写 sim-integration 对照组、#5 更新 wiring 装表期望——两处全在测试侧，无实现改动。

### 9.5 Stretch 与遗留（不否决，入报告 · 复验后更新）

- **L2/L3/M 全表 stretch**：本轮无 L3 签字；L2 代码在（双掌/觉醒/碎地/技能矩阵）但以 RG-01 全绿 + 手感盲测（ACCEPTANCE §7）为签字前提。
- **技能 id「一张表」部分收敛**（R3 冲刺第 4 条）：data 侧 id 已定稿（8 掌 `skillId` 冻结、木棉 `null` 哨兵，`97cf017`），但四处别名表仍并存——`data/skills.js` `SKILL_COMBAT_ALIASES`、`sim/combat-bridge.js` `SKILL_ALIAS`、`core/modules.js` `SKILL_ALIASES`、`combat/skills.js` `SKILL_ALIASES`；运行时靠桥收敛结果正确，但四表随时漂移，记 WARNING。
- **bloom 三档常开**（strength 0.9/0.8/0.7，`src/render/config.js`，复验无变化）：low 档可关未做（R-03 检查点原文），记 WARNING。
- **probe 单 seed**（对局 seed `0x1a2b3c4d`、bot rng `0x5eed1234`，复验无变化）：距 T-07 规格「3 固定 seed」有差，记 WARNING（GPT-sol-2）。
- **注释级 fallback-combat 残留**：`sim/deps.js` 头注仍引旧文件名（`data/tiles.js` 已清）；`sim-integration.test.js` 的**活引用**归 §9.4 #0，不在本条。不否决，顺手清。
- **probe kills 基线漂移**：改压真实桥路径后 kills 3→1（单 seed 下的合法波动，≥1 硬门达标、未回退到 0）；终验如需更稳读数，3-seed 硬化后取分布。

---

## 10. 手感轮（Feel Round 1–3）验收清单 —— 方向 / 皮肤 / 每掌 VFX / 打击感

维护者：Fable-4。上游依据：`.agent_workspace/yizhang-feel/GOAL.md`（用户原话四条）、`.agent_workspace/yizhang-feel/OWNERSHIP.md`（握手四条）。执行规程见 `ACCEPTANCE.md` §11。数值定稿（僵直时长、冲击强度等）归 Fable-3 `GDD.md`；本表只锁行为、契约与可验证阈值。
判定规则沿用 §0：全部二值可勾选、勾选只由验收流程执行、红线即时否决、上级默认包含下级（复验防回退）。

### 10.0 轮次门槛（手感轮 Gate）

| 轮次 | 必须全绿 | 允许延后 / 最小实现 |
|---|---|---|
| Round 1（L1 可玩线） | FG-01…06 全部；FD-01…05、FD-07、FD-08；FS-01…04；FV-01、FV-03；FJ-01、FJ-05；FT-01/02/03/05/06 真实断言；红线 FR-01…05 与 R-10…13 零命中 | FS-05 Bot 皮肤可先最小两款；FV-02 允许"分派表 8 键在、视觉打磨延后"；FJ-02/03/04 允许最小实现（在场可感即可）；FV-04/05、FS-06 评审延后；FT-04/07 可 todo 占位 |
| Round 2 | 复验 Round 1 全绿（回退按 FAIL 计）；FS-05、FS-06；FV-02、FV-04；FJ-02、FJ-03、FJ-04 全实装；FT-01…08 全部真实断言；§10.8 洞 1–6 逐条销号 | FV-05 盲测预跑（记录不记分）；打击感评分卡预跑 |
| Round 3（SOTA 签字） | 复验全表；FV-05 盲测 ≥6/8；打击感四维评分卡（§7 复用）无 <3 分项；真机触屏方向复验（FD-08 触屏段）；性能不回归（probe p99StepMs ≤0.5ms、桌面 high 档 60fps）；红线全表零命中 | — |

### 10.1 FG- 回归门（每轮前置；任何一项红 → 直接 REJECT，不再往下记分）

- [ ] **FG-01 测试全绿且不减量** — `npm test` 退出码 0，通过数 **≥197**（开工基线 @ `be97cee`：197/197、17 文件）。唯一预期改动：`src/core/view.test.js` 第 130 行「yaw+π」断言必须随 FD-01 同 PR 翻转为「原样透传」，属预期改绿不算回退；除此之外弱化/删除既有断言按造假计（§4 规则 4 照常适用）。
- [ ] **FG-02 探针不回归** — `npm run probe` `status:"pass"`、**`wiredCombat:true`**、`kills ≥ 1`、`ai:"think"`、`movedPlayers:4`（基线：kills=2、p99StepMs≈0.099、botSlapAttempts=3818）。加僵直 / hit-stop 调参后必须复跑：kills 允许波动但 ≥1 硬门；`botSlapAttempts` 低于基线一半（<1900）须书面解释（Bot 被连续僵直挂机的哨兵）。
- [ ] **FG-03 构建过** — `npm run build`（vite）退出码 0（基线：通过，主 chunk 含 three）。
- [ ] **FG-04 base 与端口不动** — `vite.config.js` 保持 `base: "./"`、dev 与 preview 均 **4181** + strictPort。验证：`rg -n 'base:|4181' vite.config.js`。
- [ ] **FG-05 隔离** — 改动只落 `games/yizhang/**`（及编排工作区 `.agent_workspace/yizhang-feel/**`）；不碰 `games/` 其他游戏、`pages/`、`.github/workflows`、不复制第二份游戏目录。验证：`git diff --name-only origin/main...HEAD` 审读。
- [ ] **FG-06 依赖与外链纪律** — 运行时依赖仍仅 `three`；`rg -n "googleapis|gstatic" src dist index.html` 零命中（上一系列已清零，不得回潮）；皮肤/VFX 全部低面数几何 + 程序纹理，零下载素材。

### 10.2 FD- 方向与操控（用户目标 1 —— 自动化必须锁死）

**背景（开工实测，防假达标）**：`src/input/index.js` 的输入层**今天就是自洽的**——只按 W 时 `sample(c)` 输出恰为 `forward(cameraYawToSimYaw(c))`。整轴反转的唯一来源是 `src/core/view.js` `RENDER_YAW_OFFSET = Math.PI`：`src/render/camera.js` 已按 yaw=0→-Z 建（身后 = +(sin yaw, cos yaw)），`toRenderView` 再加 π 把相机放到角色**面前**，于是 W 朝相机走、A/D 镜像、鼠标右移镜头跑反。**只写输入层单测会天然全绿、构成假达标**；本组必须包含「修复前红、修复后绿」的渲染侧断言（FD-01、FD-06 是防造假锚点）。

- [ ] **FD-01 渲染朝向归零** — `RENDER_YAW_OFFSET === 0`（或 `toRenderView` 不再改 yaw）：`toRenderView({players:[{yaw:0.5}]}).players[0].yaw === 0.5`。`core/view.test.js:130` 的 `0.5 + Math.PI` 断言同 PR 翻转。验证：单测（当前红，修复后绿）。
- [ ] **FD-02 W = 远离相机（屏幕深处）** — 单测：任取 ≥4 个相机方位角 `c`（含非轴对齐值），只按 W 时 `sample(c)` 的 `(moveX,moveZ)` 与 `(forwardX(yaw), forwardZ(yaw))`（`src/sim/math.js`，`yaw = sample(c).yaw`）点积 ≥0.999 且模 ≈1；只按 S 点积 ≤ -0.999。
- [ ] **FD-03 A = 屏幕左** — 同法：只按 A 时 `(moveX,moveZ)` 与 `(rightX(yaw), rightZ(yaw))` 点积 ≤ -0.999（相机在身后时屏幕左 = 负右手向）；D 相反 ≥0.999。
- [ ] **FD-04 鼠标右移 = 右转** — 单测：mousemove `+dx`（pointer-lock 或拖拽路径任一）前后两次 `sample()` 的 sim yaw 满足 `dot(forward(yaw₂), right(yaw₁)) > 0`（面向向右手侧偏转，FACE 约定 yaw=0→-Z、right(0)=+X）；`-dx` 反向。触屏右侧拖拽 `+dx` 同断言。
- [ ] **FD-05 触屏摇杆与 WASD 同映射** — 单测：`setStick(0,-1)` 与按 W 输出同向（点积 ≥0.999）；`setStick(-1,0)` 与 A 同向。
- [ ] **FD-06 相机在身后（几何锁）** — 单测：`createCameraRig` 按渲染链路（收 `toRenderView` 后的 yaw）更新收敛后，`dot(camPos − focus, (forwardX(simYaw), forwardZ(simYaw))) < 0`——相机必须在角色面向的**反方向**半平面。此断言在 +π 偏移下必红，是本组「修了没修」的判决性证据。
- [ ] **FD-07 换算点纪律** — 相机方位角→sim yaw 仍只经 `cameraYawToSimYaw`（ADR-17），禁第四套约定；修复后原「render +π」换算点归零，`docs/OWNERSHIP.md` 第 5 条修订注需同步（F1 所有权，验收核对不代改）。验证：`rg -n "cameraYawToSimYaw|RENDER_YAW_OFFSET" src` 审读。
- [ ] **FD-08 手动全链** — 按 ACCEPTANCE §11.4 方向脚本实机走一遍并录屏：W 走向屏幕深处、S 走向相机、A 屏幕左、D 屏幕右、鼠标右移镜头与角色右转、转身 180° 后重验（证明相机相对而非世界绝对轴）、触屏仿真摇杆 + 右拖同映射。

### 10.3 FS- 皮肤（用户目标 2）

- [ ] **FS-01 皮肤表 ≥6** — `src/data/skins.js` 导出 `SKINS`（长度 ≥6）/ `SKIN_BY_ID` / `DEFAULT_SKIN_ID`（OWNERSHIP 握手 2）；每条至少含 `id`、`name` 与几何剪影 / 配色 / 配件三类描述字段；任意两条在三类中至少一类不同。验证：schema + 两两对比单测。
- [ ] **FS-02 大厅可选** — 主菜单/大厅有皮肤选择 UI：≥6 套全部可选、选中即预览、进局后本人模型用所选皮肤。验证：手动 + 截图。
- [ ] **FS-03 存档记住** — `yizhang-save-v1` 增 `skinId`：写读 roundtrip；刷新页面后大厅默认选中上次皮肤；损坏 / 缺失 / 旧档（无 skinId 字段）回退 `DEFAULT_SKIN_ID` 不崩。验证：单测 + 手动刷新。
- [ ] **FS-04 skinId 进 view** — `createMatch` 吃人类 `skinId`、Bot 用 `persona.skinId`；`getView().players[].skinId` 存在且 JSON-pure。验证：单测。
- [ ] **FS-05 Bot 不同模** — 默认 1+3 开局同屏出现 ≥3 种不同 `skinId`（含人类），Bot 不得全员同款；渲染侧 Bot 模型按 skinId 构建（不再全员同一胶囊）。验证：单测（getView skinId 集合大小）+ 同屏截图。
- [ ] **FS-06 剪影可辨（SOTA 面）** — 6+ 套皮肤灰度截图并排，剪影/明度两两可辨（手册 §14-1 同法）；差异靠几何与配件，不靠换色贴皮或贴图包。验证：灰度评审。

### 10.4 FV- 每掌 VFX 与残影（用户目标 3）

- [ ] **FV-01 事件带掌 id** — 命中/技能/残影事件（经 `normalizeEvent`）携带 `gloveId`（技能另带 `skillId`），8 掌各至少一条事件形状断言（OWNERSHIP 握手 3）。验证：单测。
- [ ] **FV-02 渲染按掌分派** — 渲染 VFX 按 `gloveId`+`skillId` 分派：分派表 8 键齐全（静态单测）；任意两掌的扇击/技能特效参数（形状/色/运动）不全同；**禁止 8 掌共用一个光球**。验证：单测 + 慢放录屏逐掌确认。
- [ ] **FV-03 残影可见** — `getView()` 暴露 `ghosts`（源 `state.combat.ghosts`，含位置与剩余时长；OWNERSHIP 握手 4），单测；渲染画半透明分身；实机放分身技能后录屏画面上可见 ≥1 个残影。
- [ ] **FV-04 特效纪律** — 每掌特效有形状-衰减-残留三段（手册 §10）；禁纯色 additive 光球（R-05）、禁发光描边（R-02）、禁 Bloom 糊屏（R-03；顺手清「low 档 bloom 不可关」遗留 WARNING）。验证：慢放评审。
- [ ] **FV-05 八掌识别卡（Round 3 记分）** — 盲测：隐藏 HUD 掌名，逐掌放扇击+技能各一次，评审按特效猜掌 id，**≥6/8 命中**（协议 ACCEPTANCE §11.5）。

### 10.5 FJ- 打击感与僵直（用户目标 4）

- [ ] **FJ-01 hit-stop ≤120ms** — 单测锁：`HIT_STOP.max ≤ 0.12` 且 `hitStopFor` 任何分支 ≤ max；只在**本人参与**的扇击命中触发（旁观互扇不定格）；两次定格间有冷却（连段不幻灯片化）。基线 `src/core/juice.js` max=0.09 已达标；本轮加强手感时**不得越 0.12 上界**。
- [ ] **FJ-02 接触扬尘** — 命中在**接触点**触发扬尘粒子爆（挂命中事件坐标，非全屏、非纯光球），随 power 分级。验证：代码审读（vfx 生成点）+ 实机慢放录屏。
- [ ] **FJ-03 短相机冲击** — 本人参与的命中触发相机 shake/fovKick（基线 `renderer.js` 事件→`cameraRig.impulse` 已接线）：本人参与强度 > 旁观；冲击 ≤0.5s 内衰减回稳；冲击上限（camera.js clamp 1.4 / 6.5）不得放宽。验证：单测（rig 衰减）或代码审读 + 录屏。
- [ ] **FJ-04 受击僵直** — 被扇命中挂短暂僵直（`stun` 或等价 status；`src/sim/physics.js` 已认 `kind==="stun"` → canAct=false，**基线 combat 从不下发，本轮补**）：期间不能扇/放技能、不阻击退位移；时长以 GDD 定稿为准且 **≤0.5s**、到时精确清除。验证：时序单测（挂载/期间 canAct=false/到期清除）+ 渲染可见姿态变化录屏。
- [ ] **FJ-05 禁红晕糊屏** — 受击反馈维持去饱和帧（`.yz-hit-flash`），禁新增满屏红 vignette / 红闪；postfx 常驻暗角（uVignette 0.42）是构图暗角，不得改造成受击驱动红晕。验证：`rg -in "vignette" src/render src/styles` 判读 + 录屏。

### 10.6 FT- 测试锁表（MUST EXIST；载体 vitest `tests/**`+`src/**`、probe `scripts/**`）

| ID | 锁什么 | 关联条目 | 责任 | 真实生效轮次 |
|---|---|---|---|---|
| **FT-01** | 输入方向矩阵：W/S/A/D/摇杆/鼠标 ±dx，≥4 个非平凡相机角 | FD-02/03/04/05 | G1 | Round 1 |
| **FT-02** | 渲染朝向锁：偏移常量归零 + 透传 + 相机半平面几何断言 | FD-01/06 | G1 | Round 1 |
| **FT-03** | 皮肤 schema 两两差异 + 存档 roundtrip/回退 + view 字段 | FS-01/03/04 | G1 | Round 1 |
| **FT-04** | VFX 事件形状 ×8 + 分派表 8 键齐全 + 两两参数不全同 | FV-01/02 | G1 | Round 2（R1 至少事件形状） |
| **FT-05** | 残影进 view：ghosts 字段、位置、ttl 衰减 | FV-03 | G1 | Round 1 |
| **FT-06** | hit-stop 上界：显式断言 ≤0.12 + 本人限定 + 冷却 | FJ-01 | G1 | Round 1 |
| **FT-07** | 僵直时序：status 挂载 / 期间 canAct=false / 到期清除 | FJ-04 | G1 | Round 2（R1 可 todo） |
| **FT-08** | 探针不回归：wiredCombat/kills 硬门；可选手感统计段（命中数/僵直计数） | FG-02 | G2 | Round 1 |

### 10.7 L1 可玩线 vs SOTA 线（差距标注 · 开工基线 @ `be97cee` 实测 2026-08-27）

| 用户目标 | 现状基线（Fable-4 实测） | L1 可玩线（Round 1 全绿即达） | SOTA 线（Round 2/3 才算兑现） |
|---|---|---|---|
| 1 方向 | 反转在场：`RENDER_YAW_OFFSET=π` 致相机在脸前；输入层自洽（W=forward(sample.yaw)），单测输入层会假绿 | FD-01…05/07/08：轴向正确、实机可玩 | FD-06 几何锁防回潮；真机触屏复验；转向手感（阻尼/灵敏度）进评分卡 |
| 2 皮肤 | 零基础：无 `skins.js`、无选择 UI、存档无 skinId、getView 无 skinId，全员同一胶囊 | FS-01…04：≥6 套可选、可存、进局生效 | FS-05/06：Bot 多样、灰度剪影两两可辨、差异靠几何配件而非换色 |
| 3 每掌 VFX | `vfx.js` 为通用激波+尘环，无按掌分派；`ghosts` 在 combat 态（`ghostSlap` 事件在）但 getView 不导出、渲染不画 | FV-01/03：事件带掌 id、残影实机可见 | FV-02/04/05：8 掌分派齐、形状-衰减-残留、盲测 ≥6/8 |
| 4 打击感 | hit-stop 在场（90ms、本人限定、冷却 0.14s，有测）；相机冲击已接事件；**无**接触点扬尘；僵直通道 sim 认但 combat 不下发；无红晕（去饱和帧） | FJ-01/05：上界锁死、红晕禁令成文生效 | FJ-02/03/04 全实装 + 四维评分卡（§7）无 <3 分项 |

### 10.8 Round 2/3 必须补的洞（Round 1 已知无法收口的部分，验收侧备案）

1. **假达标陷阱（最高优先）**：输入层单测今天就绿；若 Round 1 只交 FT-01 而不动 `RENDER_YAW_OFFSET`，方向照旧反。Round 2 复核必须在当前代码上复现 FD-01/FD-06 的红/绿状态（把偏移临时改回 π 应见两测红），防「只写测试不修实现」。
2. **测试互斥点**：`core/view.test.js:130`（+π 断言）与 FD-01 不能同时绿；哪个 PR 改 `view.js` 就必须同 PR 翻转该断言，否则 FG-01 挡下——多代理并行时这是最可能的合并冲突点。
3. **文档-代码漂移**：ADR-17 修订注（`docs/OWNERSHIP.md` 第 5 条）仍写「`core/view.js toRenderView`（render +π）」；F1 需同步修订为归零后的表述，Round 2 验收核对。
4. **残影双段接线**：ghosts 要 O1（getView 导出）与 O2（渲染绘制）两段齐；Round 1 若只通一段残影仍不可见，FV-03 只记部分，Round 2 必收口。
5. **皮肤五段链**：data（F3）→ 大厅 UI（O4）→ 存档（O4）→ sim/getView（O1）→ 渲染 mesh（O2），跨 5 个所有权；任何一段缺失整链不可见。Round 2 重点查三个断点：「选了但进局不生效」「存了但刷新丢失」「Bot persona 未接 skinId」。
6. **僵直的连锁效应**：combat 下发 stun 会改变 Bot 行为与 probe kills 分布；每次调参后复跑 probe（FG-02：kills≥1、movedPlayers=4、botSlapAttempts 哨兵）；僵直叠加击退可能把「被连扇」变成死锁体验，时长上界 0.5s 不得放宽。
7. **打击感过量风险**：hit-stop + 扬尘 + 冲击 + 僵直四层叠加，连段可能幻灯片化/晕屏；Round 3 按 §7 评分卡裁量；hit-stop 冷却（0.14s）与相机冲击 clamp（1.4/6.5）是防过量的既有闸门，不得放宽。
8. **遗留 WARNING 结转**（上一系列 §9.5）：技能 id 四处别名表并存（与 FV-01 事件带 skillId 直接相关，Round 2 顺手收敛为一张表）；bloom 三档常开 low 不可关（FV-04 一并清）；probe 单 seed（FT-08 硬化时顺手上 3-seed）。
9. **真机缺口**：Round 1–2 触屏全靠 devtools 仿真；Round 3 必须真机验方向（FD-08 触屏段）与多点触控（摇杆+扇击同按不互斥）。
10. **性能回归口**：8 掌 VFX + 残影 + 扬尘全实装后粒子预算（`config.js` dustBudget 900/380/140）可能超；Round 3 复测 probe p99StepMs（基线 0.099ms，红线 0.5ms）与桌面 high 档 60fps。

### 10.9 FR- 红线增补（手感轮即时否决，叠加 §5 的 R-10…13）

| ID | 红线 | 依据 | 检查方法 |
|---|---|---|---|
| **FR-01** | 满屏红晕 / 红闪回潮 | 用户明令（GOAL 验收线） | `rg -in "vignette" src` 判读 + 录屏；FJ-05 |
| **FR-02** | 第四套朝向约定 | ADR-17 / OWNERSHIP 红线 | `cameraYawToSimYaw` 之外新增相机→sim 换算即中；rg 审读 |
| **FR-03** | 复制第二份游戏目录 / 改其他 `games/*` | GOAL 首段 | `git diff --name-only` 审读（FG-05） |
| **FR-04** | 皮肤用下载贴图 / 版权素材 | OWNERSHIP 红线（R-13 同源） | 资产审读 + `rg -n "https?://" src` |
| **FR-05** | 弱化既有断言骗绿（删测试、改阈值、空 expect） | §4 造假条款 | 测试 diff 审读（FG-01 唯一豁免：view.test.js:130 翻转） |

---

## 11. 安全区大厅轮（Hub Round 1–3）验收清单 —— 安全区 → 走道选掌 → 传送门 → 裂岛

维护者：Fable-4（SOTA 验收）。上游依据：`.agent_workspace/yizhang-hub/GOAL.md`（用户原话）、`.agent_workspace/yizhang-hub/OWNERSHIP.md`（握手四条）、`docs/ARCHITECTURE.md` §4.6（双区状态机）、`docs/API_CONTRACT.md` §3.3/§4.4（HUB 布局与大厅交互语义）、`docs/GDD.md` §12（布局数值，F3 单一事实源）。执行规程见 `ACCEPTANCE.md` §12。
**大厅 ADR 记 29…32（手感轮占用 25…28）**：ADR-29 双区状态机与安全区免战、ADR-30 走道选掌与 `HUB` 布局、ADR-31 传送门、ADR-32 `interact` 输入与 Bot 静默。
判定规则沿用 §0：全部二值可勾选、勾选只由验收流程执行、红线即时否决、上级默认包含下级（复验防回退）。**契约-实现漂移收口（§11.6 洞 4）前，验收按实现名判读**（`phase/skipHub`、`portalNear`、`hubLocked`、`enterArena/enterHub`）。

### 11.0 轮次门槛（Hub Gate）

| 轮次 | 必须全绿 | 允许延后 / 最小实现 |
|---|---|---|
| Round 1（L1 可玩线） | HG-01…06 全部（HG-02 修复探针对齐后复跑）；HB-01…12 全部；HV-01/02/03 至少几何桩级在场（可辨形，材质打磨延后）；HT-01…07 真实断言；红线 HR-01…05、FR-01…05、R-10…13 零命中 | HV-04 idle VFX 允许「按掌分派在、粒子打磨延后」但禁纯色光球；HV-05 门体允许几何桩 + 现有 `.yz-warp` 淡场；HV-06（F2 真源归一）延后；HB-12 回程 UX 打磨延后（API 面已锁）；HT-08 可 todo 占位 |
| Round 2 | 复验 Round 1 全绿（回退按 FAIL 计）；HV-01…06 全实装；§11.6 洞 1–7 逐条销号；HT-01…08 全部真实断言 | HV-04 盲辨预跑（记录不记分） |
| Round 3（SOTA 签字） | 复验全表；HV-04 八掌 idle 盲辨 ≥6/8（协议 ACCEPTANCE §12.5）；真机触控走完大厅全链（HB-11 真机段）；性能不回归（probe p99StepMs ≤0.5ms、桌面 high 档 60fps、hub 场景 draw calls 并入 L3-10 预算）；红线全表零命中 | — |

### 11.1 HG- 回归门（每轮前置；任何一项红 → 直接 REJECT，不再往下记分）

- [x] **HG-01 测试全绿且不减量** — `npm test` 退出码 0，通过数 **≥306**（开工基线 @ `1b4371f`：306/306、23 文件）。弱化/删除既有断言按造假计（§4 规则 4；FR-05 同源）。
- [x] **HG-02 探针走通大厅全链** — `npm run probe` 退出码 0、`status:"pass"`，输出 `hubJourney` 段：hub 起步（`mainGloveId=null`、`portalReady=false`）→ 聚焦目标掌（`focusObserved`）→ 装主掌（`equippedAtStep`）→ 穿门（`enteredArenaAtStep` 有值，≤1200 步）→ `arenaKills ≥ 1`；`wiredCombat:true`、`ai:"think"` 沿用。**开工实测即红**（`probe must start in hub phase; got arena`，详见 §11.5 基线与 §11.6 洞 3）：harness 缺省 `phase:'arena'` 与 probe 的 hub 剧本对齐失败，一行修复归 GPT-sol-2；修复合入前本门按「已知红、待修」记，不发 PASS。
- [x] **HG-03 构建过** — `npm run build`（vite）退出码 0（基线通过，主 chunk 含 three >500kB 警告既知）。
- [x] **HG-04 隔离** — 改动只落 `games/yizhang/**` 与 `.agent_workspace/yizhang-hub/**`；不碰其他 `games/*`、`pages/`、workflow、不复制第二份游戏目录（FR-03 同源）。验证：`git diff --name-only origin/main...HEAD` 审读。
- [x] **HG-05 依赖与外链纪律** — 运行时依赖仍仅 `three`；`rg -n "googleapis|gstatic" src dist index.html` 零命中；大厅场景（走道/台座/展掌/门）全部低面数几何 + 程序纹理，零下载素材（R-13/FR-04 同源）。
- [x] **HG-06 手感轮回归抽验（用户回归线：键鼠方向 / 皮肤 / 战斗 VFX）** — ① 方向：`RENDER_YAW_OFFSET === 0` 静态在位 + FD-06 相机半平面单测仍绿 + 大厅走道里 W=屏幕深处实机复验（§12.4 步 2）；② 皮肤：FS-03/04 存档 roundtrip 与 `view.players[].skinId` 单测仍绿 + 选非默认皮肤后走道与裂岛模型均生效；③ 战斗 VFX：FV-01/02/03 事件带掌 id、渲染分派表 8 键、ghosts 单测仍绿 + 传送后放技能特效无回退；④ hit-stop：FJ-01 上界锁仍绿。任何一项回退按该项 FAIL 计并引用 §10 原条目定位。

### 11.2 HB- 大厅流程行为（sim/壳层，全部自动化可锁）

- [x] **HB-01 开局在安全区、不在裂岛中央** — 产品路径（`main.startMatch` 不带 `skipHub`）⇒ `createMatch` 缺省 `phase='hub'`（`sim/state.js resolvePhase`；`skipHub`/`phase:'arena'`/`config.skipHub` 三条旧路保留）；p0 落 `HUB.spawn` (0, −106)、yaw=0 面向门；断言 `Math.hypot(p0.x, p0.z) > 22`（裂岛盘 20+2m 缓冲之外）；相机跟在角色身后、开局即面向走道纵深。验证：`src/sim/sim.test.js`「默认 phase=hub」+ 手动开局录屏。
- [x] **HB-02 八座台座布局硬约束** — `view.hub.pedestals.length === 8`、`gloveId` 唯一覆盖 8 掌、顺序 = GLOVES 图鉴顺序；`interactRadius` 2.0 ∈ [1.6, 2.2]；任两座间距 > 2×interactRadius；大厅全部几何距裂岛盘（20+2m）不重叠；spawn/座/门都在 bounds 内、门区不碰任何交互圈；数据表深冻结、JSON 纯净。验证：`src/data/hub.test.js` ×10（契约 §3.3 硬约束 1–4 逐条）。
- [x] **HB-03 靠近聚焦 / 离开取消** — p0 入 interactRadius ⇒ `focusGloveId` = 该掌 + `hubFocus` 事件；离圈 ⇒ null；并列取台座表序靠前（同 seed 稳定）。验证：`tests/hub-flow.test.js`「靠近时聚焦」「离开交互半径后取消聚焦」。
- [x] **HB-04 interact 边沿装备、长按不连发** — E / 触控「选」输出 `interact` 持续位，sim 在 `p.prev.interact` 做上升沿；按住按键走到另一座不得重复消费同一次按下。验证：tests/hub-flow 第 1 条（按住换座不装）+ `src/input/index.test.js`「安全区的 interact 采样」组。
- [x] **HB-05 双掌先主后副** — 主空装主 → 已是主掌 no-op（`changed:false`）→ 副掌再按提为主掌（原主退副）→ 副空装副 → 双满换副；副掌未选时写回玩家 `offhandId = mainGloveId`（不让人白捡没选过的掌）；`hubEquip` 事件带 `slot/changed`；HUD 配装条主/副实时更新。验证：`src/core/hub-flow.test.js`「equipIntent · 先主后副」×6 + tests/hub-flow 主副装备序列。
- [x] **HB-06 未解锁可见但拒绝** — `unlocked` 缺省 fail-closed（`unlock==='default'` 集合 + 调用方明确携带的两掌；cotton 恒可用；空集回落表首掌防八座全灰）；聚焦未解锁掌 + interact ⇒ 配装逐字段不变、发 `hubLocked {unlock}`、说明牌写解锁条件而非「按 E」、toast 报解锁条件。验证：tests/hub-flow 第 2 条 + hub-flow.test.js「未解锁的台座显示解锁条件」。
- [x] **HB-07 门未就绪提示** — `portalReady === false`（主掌未选）时进门圈：不传送、发 `hubPortalNear {ready:false}`、toast「传送门认掌不认人 · 先挑一只主掌」、HUD 门提示三段语气（先选掌 → 已就绪 → 门前）状态驱动。验证：hub-flow.test.js「传送门三段语气」「没选主掌时走进传送门不放行」。
- [x] **HB-08 传送同 tick、loadout 保留、计时域切换** — `portalReady ∧ 进门半径`（现实现为圆形 `portal.radius=2.4`，穿门即传送、无需再按 interact，键鼠触控同路径）⇒ 同 tick `phase='arena'`、p0 走既有出生链路落岛上（`hypot < arenaRadius`、`hasFloorUnder` true、`invulnT ≥ invulnTime`）、`gloveId/offhandId` 原样保留、对局计时从进岛起算（`match.startTime = state.time`）、`isMatchOver` 在 hub 恒 `over:false`（逛大厅不吃对局时间）。验证：tests/hub-flow 第 3 条 + `src/ai/view-contract.test.js` hub 集成。
- [x] **HB-09 安全区免战** — hub 体积内：`applyKnockback` 返回 0、无 KO/掉落判定、combat `inSafeZone` 拒绝出招（`resolveSlap/resolveSkill` 返回 `reason:'hub'`）；被连扇 180 帧位置/deaths/hitsTaken 零变化。规则按「实体所处空间」生效——摆在裂岛坐标的旧测不受影响。验证：tests/hub-flow 第 4 条 + `src/combat/util.js inSafeZone`（sim 单份实现，combat 不抄第二份）。
- [x] **HB-10 Bot 仅 arena 出现** — hub 开局 Bot 全部落裂岛盘（原点 20m 内）不进走道（`state.js`「安全区不放 Bot」，距安全区最近缘 ≥78m，大厅视野不可见）；`think` 在 hub 视图下恒零输入（`isHubView` fail-safe：缺 phase 但带 hub 数据也休眠）；main 在 hub 期不喂 Bot 输入；传送后 Bot 才开打（probe `arenaKills ≥ 1` 佐证活性）。验证：`src/ai/bots.test.js`「安全区守卫」组 + view-contract「phase=hub 时 think 一律零输入」。
- [x] **HB-11 触控与键鼠同一套靠近+确认** — `input.setPhase('hub')` 下 E 只发 interact、扇击/技能不出（安全区不对展掌开技）；触控「选」按钮走 `setTouchButton('interact', down, {slot})` 同通路、可指定主/副槽；确认键章触屏显示「选」键鼠显示「E」（`.yz-inspect-key`，独立于被触屏隐藏的 `.yz-kbd`）；切回 arena 后 E 复位技能。触控钮尺寸沿用 L1-07/G-06 阈值。验证：`src/input/index.test.js` interact 组 + hub-flow.test.js「触控写『选』」+ devtools 触控仿真实测。
- [x] **HB-12 存档写回与回程 API** — 传送帧 `rememberHubLoadout → updateSave({loadout})` 把走道所选落盘（「直接进裂岛」与「再来一局」吃它）；`enterHub(state)` 回程 API 在场且有测（sim.test.js「enterHub 能把人送回安全区再选」）、`main.returnToHub` 不刷新页面回大厅；2D `.yz-home` 配掌板降为暂停面板备选入口、不删（HR-05 红线）。验证：单测 + 手动存档链（§12.4 步 8）。

### 11.3 HV- 走道与传送门渲染（SOTA 面；**开工实测 O2/F2 未合入**——`rg -i "hub|pedestal|portal" src/render` 零命中，本组全红起步，见 §11.6 洞 1/2）

- [x] **HV-01 3D 安全区场景在场** — hub 阶段画面有可见走道地面与边界（对应 bounds/walkway 15×39m），与裂岛同世界摆放（z≈−120）不穿帮不遮挡；隐形墙位置与 sim 钳制一致（贴墙走无穿模、无「撞空气」错位）。验证：实机录屏 + 走道边界绕一圈。
- [x] **HV-02 台座 ×8 有形有源** — 座体高 0.95、位置/朝向全部读 `view.hub.pedestals`（禁第二份硬编码坐标，HR-04）；SOTA 面：台座有磨损与该掌识别色漆线（`color` 字段）。验证：代码审读（数据源唯一）+ 截图。
- [x] **HV-03 展掌手指朝上 + 悬浮呼吸** — 掌模型掌心/手指朝 +Y、几何中心 y=1.35（数据表 `GLOVE_HOVER_Y`）、轻微悬浮或呼吸；yaw 面向走道中线（左排面 +X、右排面 −X，ADR-17 直用零补偿）。验证：截图 + 慢放。
- [x] **HV-04 idle VFX 可辨掌** — 8 座各有可辨识 idle 特效（霜雾/岩屑/风带/磁弧等，特效语言归 F2/O2 规范）；禁纯色光球（R-05）、禁发光描边（R-02）、禁 Bloom 糊屏（R-03）。Round 3 盲辨：遮掌名按 idle 特效认掌 **≥6/8**（协议 §12.5）。
- [x] **HV-05 传送门可见 + 门内过渡** — 走道尽头有门体（位置读 `view.hub.portal`）；`portalReady` 前后有可辨状态差（未就绪暗 / 就绪亮，识别色克制）；穿门过渡为短淡场/门光（现 `.yz-warp` ≤400ms），**禁加载条糊屏**（HR-03）。验证：录屏对比。
- [x] **HV-06 大厅 HUD 视觉真源归一** — F2 在 `src/styles/**` 落 `.yz-inspect`/说明牌/门提示/配装条视觉终稿（饱和识别色只给当前聚焦掌，R-09 纪律）；O4 的 `src/ui/hub.css` 收缩为结构性 fallback，双源同名类不打架（上一系列 K-1 风险的大厅版，§11.6 洞 2）。验证：devtools 生效样式来源核对 + 截图。

### 11.4 HT- 测试锁表（MUST EXIST；开工在场性实测 @ `1b4371f`）

| ID | 锁什么 | 关联条目 | 载体（实测在场性） | 责任 | 生效轮次 |
|---|---|---|---|---|---|
| **HT-01** | hub 确定性流程：聚焦/边沿装备/未解锁/传送/免战 | HB-03…09 | `tests/hub-flow.test.js` ×4 ✅ | G1 | Round 1 |
| **HT-02** | HUB 布局硬约束 1–4 + 深冻结 + sim 接管冒烟 | HB-02 | `src/data/hub.test.js` ×10 ✅ | F3/G1 | Round 1 |
| **HT-03** | interact 采样：hub/arena 键位切换、触控槽位、禁用不外泄 | HB-04/11 | `src/input/index.test.js` interact 组 ✅ | O4/G1 | Round 1 |
| **HT-04** | Bot 安全区守卫：`isHubView`、零输入、fail-safe 偏不出手 | HB-10 | `src/ai/bots.test.js` + `view-contract.test.js` ✅ | O3/G1 | Round 1 |
| **HT-05** | phase 缺省 hub / skipHub 三条旧路 / enterHub 回程 | HB-01/12 | `src/sim/sim.test.js` ✅ | O1 | Round 1 |
| **HT-06** | 探针大厅全链：hub 起步→聚焦→装掌→穿门→arena kills≥1 | HG-02 | `scripts/probe.mjs` hubJourney ✅在场 **❌当前红**（洞 3） | G2 | Round 1 |
| **HT-07** | 壳层视图模型：CTA 六态、说明牌、门三段语气、键盘 E 整链 | HB-05/06/07/11 | `src/core/hub-flow.test.js` ✅ | O4/G1 | Round 1 |
| **HT-08** | 渲染消费冒烟：台座 mesh=8、坐标源自 view.hub、门体在场 | HV-01/02/05 | 待 O2 落地后补 | O2/G1 | Round 2 |

### 11.5 L1 可玩线 vs SOTA 线（差距标注 · 开工基线 @ `1b4371f` 实测 2026-08-27）

**基线实测**：`npm test` **306/306**（23 文件）退出码 0；`npm run probe` **FAIL 退出码 1**（`probe must start in hub phase; got arena`，洞 3）；`npm run build` 退出码 0；`rg -i "hub|pedestal|portal" src/render` **零命中**（O2 未合入）；`src/styles/**` 无大厅样式、`docs/ART_DIRECTION.md` 无大厅章节（F2 未合入）；`RENDER_YAW_OFFSET = 0` 在位、`rg googleapis src index.html` 零命中（手感轮成果未回潮）。

**编排层补记（O2 合入后，@ `86e619f` / 父分支 `320bf54`）**：`src/render/hub.js` + `hub-palm.js` + `hub-vfx.js` + `hub.test.js` 已合入；`npm test` 升至 **330/330**（24 文件）。洞 1「O2 渲染整章缺席」关闭；HV-01…05 改按合入后画面复验，不再按「盲走」记。洞 2（F2 视觉真源）与洞 3（probe 缺省 arena）仍开。

**编排层补记（F2 合入后）**：`docs/ART_DIRECTION.md` §13/§14 与 `src/styles/hub.css` 已合入（后注入压制 O4 `ui/hub.css` 兜底）。洞 2 的「F2 缺席」关闭；Round 2 只剩「devtools 逐类核对生效来源 / O4 收缩为结构 fallback」。洞 3 仍开。

**编排层补记（G2 @ `9767c02`）**：`scripts/probe.mjs` 显式 `phase:'hub'`。本机复跑 `npm run probe` **PASS**（3600 步，hub→arena，`arenaKills:1`，`wiredCombat:true`，`hubJourney.equippedAtStep=51` / `enteredArenaAtStep=227`）。洞 3 / HG-02 关闭。harness 缺省仍为 arena。

| 用户目标 | 现状基线（Fable-4 实测） | L1 可玩线（Round 1 全绿即达） | SOTA 线（Round 2/3 才算兑现） |
|---|---|---|---|
| 开局在另一区域（安全区） | sim/壳层全链在：缺省 `phase='hub'`、p0 落走道 (0,−106)、免战免掉落、Bot 留裂岛；**3D 画面无走道**（O2 缺席，「盲走」） | HB-01 + HV-01 几何桩：脚下有可见走道 | 场景光影/磨损/暮蓝暖黄按 R 表评审；灰度剪影可读 |
| 走道两排手套 + 台子、指朝上、对应特效 | 数据/sim 面 8 座齐（HB-02 十测锁死：坐标/朝向/硬约束）；渲染零呈现 | HV-02/03 桩级：8 座可辨形、掌指朝上 +Y | HV-04 idle 盲辨 ≥6/8 + 台座磨损与识别色漆线 |
| 靠近能选择和说明 | 聚焦/装备/说明牌/CTA 六态/触控「选」全链在且有测（HT-01/03/07）；键鼠触控同通路 | 已达，复验即可 | F2 说明牌材质化（HV-06）+ 饱和识别色纪律 |
| 传送门进格斗区 | sim 传送/计时域/免战边界在且有测；`.yz-warp` 淡场在；probe 全链剧本在但**当前红** | HG-02 修复 + HB-07/08 复验 | HV-05 门体可见 + 就绪状态差 + 门内粒子 |

### 11.6 Round 2/3 必须补的洞（Round 1 已知无法收口的部分，验收侧备案）

1. **O2 渲染整章缺席（最高优先）**：`src/render` 零 hub 消费——现在进大厅是「盲走」：HUD/聚焦/装备/传送全对，但画面没有走道、台座、展掌、门。GOAL 验收线「8 座展示掌可走过去看、可辨特效」整条不可测。Round 1 若 O2 不落地，HV-01…05 全部记 FAIL/延后并在判定表明示；Round 2 必须收口，HT-08 渲染冒烟随行。
2. **F2 视觉真源缺席 + 双 CSS 回潮风险**：`.yz-inspect` 等类名现由 O4 `src/ui/hub.css` 顶班；契约 §13 规定「类名由 F2 在 `src/styles` 定义，shell 按语义挂类」。F2 落地后同名类两源（上一系列 §5.1 K-1 风险的大厅版）——Round 2 裁定：视觉唯一真源归 `src/styles`，`ui/hub.css` 收缩为结构 fallback，devtools 逐类核对生效来源。
3. **probe 对齐漂移（开工即红，HG-02 挡）**：`scripts/harness.mjs createFourPlayerMatch` 缺省 `phase:'arena'`（护旧探针与 feel-probe），`scripts/probe.mjs` 的 hub 剧本调用未传 `phase:'hub'` 覆盖——`8f178d6` 调和 harness 时漏掉，探针自身 `createHubJourney` 硬断言 hub 起步故直接 FAIL。一行修复（probe 调用处显式传 `phase:'hub'`）归 GPT-sol-2；修复后 HG-02 按字面判读。
4. **契约-实现漂移表（F1 vs O1/O4，Round 2 必须收口一边）**：契约 §4.1/§4.4 为冻结文本但与实现有七处名/义漂移——① 选项名 `startPhase`（§4.1 注释称缺省 `'arena'`）vs 实现 `phase`/`skipHub`（缺省 `'hub'`；硬约束 20 与实现一致、§4.1 注释自相矛盾）；② 事件 `phaseChange{from,to,yaw}` vs 实现 `enterArena`/`enterHub`；③ `hubDeny{reason:'locked'}` vs 实现 `hubLocked{unlock}`；④ HubView `nearPortal`/`mainChosen/offChosen` vs 实现 `portalNear`/`mainGloveId/offGloveId`；⑤ 传送触发「进 `portal.aabb`」vs 实现圆形 `portal.radius`（数据表两种字段都给，sim 只读 radius）；⑥ 装备规则「已落位 ⇒ no-op」vs 实现「副掌再按提为主掌」（promote，UX 更优）；⑦ 音效映射 `hubEquip→equip / hubDeny→deny / phaseChange→portal` vs main 实际按实现事件名接。收口方向建议：契约向实现修（实现已被 306 测锁定）；收口前验收按实现名判读，防 G1 按契约名写测锁不住实现。
5. **hub 内 switchGlove 交换语义未验**：契约 §4.4 定义 hub 里换掌键 = 主副交换（无 switchLock 代价）；实现是否落地未核。Round 2 核对：落地则补测，未落地则契约随洞 4 一并修。
6. **回程链路 UX**：`enterHub` API + `returnToHub`（重开一局落 hub）在场；「对局结束结算板 → 回安全区再选」的入口与原局回程（不重开）归 Round 2（GOAL §7），验收补手动步骤。
7. **hub 阶段渲染性能预算**：O2 落地后走道 8 座 idle VFX + 同世界裂岛常驻——Round 2 复测 draw calls（mid ≤120 沿用 L3-10）与 probe p99StepMs（红线 0.5ms）；关注 78m+ 外裂岛的雾/视距剔除处理。
8. **真机缺口**：Round 1–2 触控靠 devtools 仿真；Round 3 真机走完「摇杆走道 → 选按钮装掌 → 穿门 → 开打」全链 + 多点触控不互斥。
9. **皮肤 UI 与走道选掌的入口层级**：大厅选皮肤（手感轮 FS-02）与走道选掌并存后谁在主菜单、谁进走道，Round 2 定稿；皮肤在 hub 走道模型上同样生效（HG-06 ② 抽验）。
10. **isMatchOver 计时域回归哨兵**：hub 恒 `over:false` 依赖 `enteredArenaAt`/`match.startTime` 记账；任何动对局计时的 PR 必须复跑 tests/hub-flow 传送条与 sim 计时测，防「逛大厅吃对局时间」回潮。

### 11.7 HR- 红线增补（大厅轮即时否决，叠加 §10.9 FR-01…05 与 §5 R-10…13）

| ID | 红线 | 依据 | 检查方法 |
|---|---|---|---|
| **HR-01** | 开局把玩家扔进裂岛中央（缺省回退 arena） | 用户验收线（GOAL） | HB-01 断言 + `main.js` 审读（产品路径不带 `skipHub`） |
| **HR-02** | 大厅绕过解锁（未解锁掌可装备 / `unlocked` 缺省 fail-open） | GOAL §4 | HB-06 单测 + `resolveUnlocked` 审读 |
| **HR-03** | 传送用加载条糊屏 | GOAL §6 明令 | 录屏 + `rg -in "loading|progress" src/ui src/render` 判读 |
| **HR-04** | 渲染/UI 硬编码第二份台座/门坐标（绕过 `view.hub`） | 契约 §3.3 | O2/O4 代码审读：坐标只准来自 `view.hub` |
| **HR-05** | 删 2D 配掌板到无法配装 | GOAL 附则 | `.yz-home` 与暂停入口在场性 + 手动 |

### 11.8 Round 2 复验记分（F4 复验席 @ 父分支 `06b92b8`，2026-08-27，全套命令实跑）

**执行口径**：九席合入后的收口前复验。工作分支 `cursor/yizhang-hub-r2-f4-sota-db8d`（仅动本文件与 `ACCEPTANCE.md`）。自动化全套实跑；视觉面用 headless Chrome（SwiftShader WebGL）开 `src/render/smoke.html` 截图替代交互实机——§12.4 键鼠十步与 devtools 触控仿真**未做**（无交互桌面环境），归 Round 3 真机段。判定明细与 probe JSON 原文见 ACCEPTANCE §12.9。

**三件套实测**（勾选依据，非抄父调度数字）：

- `npm test`：**500/500（37 文件）**，退出码 0（基线 306 → 合入后 500，零红零减量，HG-01 绿）。
- `npm run probe`：**PASS** 退出码 0。hubJourney 全链：`focusObserved:true`、`equippedAtStep:51`、`enteredArenaAtStep:227`（≤1200）、`arenaKills:1`、`wiredCombat:true`、`ai:"think"`、`p99StepMs:0.109`、`botSlapAttempts:3779`（> 哨兵 1900）。HG-02 按字面绿（洞 3 已关，不再按开工 `got arena` 记红）。
- `npm run build`：退出码 0（主 chunk 663kB / gzip 183kB，>500kB 警告既知）。

**HG-06 抽验明细**：① `RENDER_YAW_OFFSET === 0`（`core/view.js:21`）+ FD-06 相机半平面测仍绿；② 皮肤全链——F3 真表六 id `drifter/mason/crane/reed/nuo/wildhorn`（DEFAULT `drifter`），`render/skins.js` 经 `skinAppearance()` 吃契约枚举，`main.js` `createRenderer({ …, skins: skinTable, data: dataModule })` 喂真表，冒烟 `?skin=wildhorn&botskins=1` HUD 实读 `皮肤 wildhorn/wildhorn/crane/nuo`；③ `COMBAT_VFX_KIND` 8 键 8 形（`fanwake/slab/gust/rime/recoil/phase/flux/cinder`，afterimage=`phase` 非 mirror），`combat-vfx.test.js` 14 测绿；④ `HIT_STOP.max = 0.12` 且 `juice.test.js` 上界锁 15 测绿（见 WARNING W2）。

**HV 冒烟证据（headless 截图）**：`?phase=hub&unlock=all&tour=1&hud=1` —— 走道地面/边界摆块/黄中线可见（HV-01）；多座台座带识别色圈线同框、坐标全部读 `view.hub`（`render/hub.js` 遍历 `hub.pedestals`/`hub.portal.radius`，HR-04 零命中，HV-02）；展掌指朝上 +Y、悬浮呼吸帧可见（HV-03）；granite 岩屑悬滞、magnet 收束弧线截图可辨（HV-04，盲辨预跑：截图分辨率下仅确认 2/8 座，完整 8 座盲辨归 Round 3 记分）；门体两态实证——`picked=0` 门封（冷灰暗膜）vs 缺省门通（暖橙亮面），无加载条（HV-05）。HV-06 以静态尺子代替 devtools 逐类核对：`src/ui/hub-css.test.js` 24 测锁 `ui/hub.css` 禁颜色/字体/材质属性（外观唯一真源归 `src/styles/hub.css`），且 `main.js` boot 里 styles 加载成功即不点亮 `data-yz-fallback`——两套 CSS 不同时上场。

**Round 2 新增八条复验（全部落实）**：

1. **空挥闸是空间闸**（ADR-33/O1）：`sim/step.js` 以 `gated = playerInHub(state, p)` 分别拦 dash / slap / skill（同文件 129/157/174 行），按实体所处空间判定而非 phase 全局；裂岛坐标旧测不受影响，`hub-actions.test.js` 在测。
2. **皮肤 mesh**：`render/characters.test.js` 15 测锁「不同 skinId ≠ 同一胶囊」「真表六套剪影互不相同」「八配件各自成形」；`accessoryFromAppearance`（`render/skins.js`）映射 hood/horns/mask 直用、back banner→banner、back pack→sash、topknot/strawHat→turban——六套配件互异：drifter=hood、mason=sash、crane=banner、reed=turban、nuo=mask、wildhorn=horns。
3. **每掌战斗 VFX**：8 掌 8 形（见 HG-06③）；whiff 发 `slapWhiff` 带 `gloveId`（`combat/index.js`）无残渣路径；O3 事件 `gloveId` 经 `combat-bridge`/`applyHits` 透传到渲染分派。
4. **残影**：`view.combat.ghosts` ← `combat-bridge.ghostsView`（yaw 减 `FACE.combatOffset` 还原 -Z 约定，`gloveId` 透传）；渲染半透复本按 `ttl/ttl0` 淡出（`characters.js`）。
5. **相机 pitch**：`setLook({pitch,yaw?})`/`setPitch`/`getLook` 齐（`render/index.js`）；O4 `feedLook` 每帧喂（`main.js`）、渲染器无 setter 时 no-op（`core/look.js` 有测）；正=往下看与 `src/input` 同约定（`camera.js` 头注 + 冒烟 `?pitch=0.6` HUD 实读 pitch 0.59 俯视）。
6. **再来一局 ≠ 回安全区**：`core/entry.js` `ENTRY.RESTART → skipHub:true` 回裂岛、`ENTRY.HUB → skipHub:false` 且不预填主副掌（`entry.test.js` 9 测）。
7. **hub 换掌**：`swapHubLoadout` 主副交换、无 switchLock（`step.js` hub 分支）；`sim.test.js`「hub 内换掌 = 主副交换」在测。
8. **契约按实现名**：`API_CONTRACT.md` v4.1 §0 名义漂移收口表在场（七处全按实现名改写），`startPhase/phaseChange/hubDeny/nearPortal` 全文仅存于死名登记行，禁再作 FAIL 依据。

**红线扫描（全零命中）**：`roblox|slap battle` 零；`outline` 仅 `base.css` a11y focus 环（非 glow outline）；`vignette` 仅 postfx 0.42 构图暗角；`lock-on/auto-aim` 零；`ZERO_INPUT` 不含 `interact`（`HUB_ZERO_INPUT` 单独扩展，Bot 键集不污染）；`createMatch` 缺省仍 `hub`（`resolvePhase` 三条旧路保留）；测试数量 500 无删减。

**洞 1–10 销号状态**：洞 1 **关**（O2 已合 + 截图实证）；洞 2 **关**（`styles/hub.css` 真源 + `hub-css.test.js` 尺子）；洞 3 **关**（G2 显式 `phase:'hub'`，本机 probe PASS；harness 缺省仍 arena 护 feel-probe，维持不改）；洞 4 **关**（契约 v4.1 向实现收口）；洞 5 **关**（swap 语义落地有测）；洞 6 **关**（entry 分叉落地有测）；洞 7 **已测记警告**（p99StepMs 0.109 ≤0.5 绿；draw calls 冒烟 HUD 实读超预算，见 W1）；洞 8 **延后 Round 3**（真机）；洞 9 **记现状**（皮肤选择器在主菜单选皮肤板 `ui/menu.js`、2D 配掌板退居暂停备选 `ui/shell.js`；走道选掌为主路径——入口层级已定稿，不冲突）；洞 10 **关**（`tests/hub-flow.test.js` 4 测复跑绿，含传送计时域条）。

**WARNING 清单（记录不否决）**：

- **W1 渲染预算超标**：冒烟 HUD 实读 mid 档 hub draw 305 / tris 138k、arena draw 352 / tris 95k——均超 L3-10 预算（mid ≤120 draw / ≤80k tris）。L3-10 系 Round 3 记分项，本轮记 WARNING；归 O2（走道 8 座 + idle VFX + 同世界裂岛合并/实例化收敛）。
- **W2 hit-stop 零余量**：`HIT_STOP.max` 由基线 0.09 提至 0.12，恰在 FJ-01 上界（≤0.12 合规）；后续任何加强必越界，调参前先看 `juice.test.js`。
- **W3 探针横幅噪音**：`scripts/probe.mjs` / `feel-probe.mjs` 硬编码 `MODEL_SLUG: gpt-5.6-sol-xhigh-fast` 打印（G2 席残留），不影响判定；归 G2 顺手清。
- **W4/W5 结转**：probe 单 seed（T-07 3-seed 规格差）；bloom 三档常开 low 不可关（R-03/FV-04）。

**判定：大厅轮 Round 2 = PASS-WITH-WARNINGS**（判定表与证据包见 ACCEPTANCE §12.9）。

### 11.9 Round 3 签字记分（F4 签字席 @ 父分支 `3f179a9`，2026-08-27，全套命令实跑）

**执行口径**：Round 3 十席（Wave 1–3 九席合入后）的签字复验。工作分支 `cursor/yizhang-hub-r3-f4-sota-db8d`（仅动本文件与 `ACCEPTANCE.md`）。自动化全套实跑；视觉与预算面用 headless Chrome 148（SwiftShader WebGL，CDP 驱动 `smoke.html?manual=1` 逐帧）实测——§12.4 键鼠十步与 devtools 触控仿真在本环境仍**不可做**（无交互桌面），与 §11.8 同口径如实标注，归真机段。判定明细与命令原文见 ACCEPTANCE §12.10。

**三件套 + bench 实测**（勾选依据，非抄父调度数字）：

- `npm test`：**557/557（40 文件）**，退出码 0（Round 2 基线 500 → 557，零红零减量；G1 `tests/round3-hub-sota.test.js` 8 条锁表在场且绿）。
- `npm run probe`：**PASS** 退出码 0，**3/3 固定 seed**（`0x1a2b3c4d` / `0x5eed1234` / `0xc0ffee42`）各自 hub→arena 全链（`focusObserved:true`、`equippedAtStep:51`、`enteredArenaAtStep:227`）、`arenaKills` 1/2/2（均 ≥1）、`wiredCombat:true`、`ai:"think"`；`p99StepMs` 0.117/0.102/0.111；横幅 **`MODEL_SLUG: yizhang-probe`**（`process.env.MODEL_SLUG` 可覆盖，锁测在场）。
- `npm run build`：退出码 0；主 chunk 677.60kB / gzip 187.18kB，全部 JS gzip 合计 ≈255kB（≤1.2MB 预算）。
- `npm run bench`：96,096 steps/s（≈0.0104ms/step，L3-11 红线 0.5ms 远达标），`wiredCombat:true`。

**W1–W5 销号（全部按本机实测 / 代码审，不按 §11.8 旧读数记红）**：

- **W1 渲染预算 → 关（L3-10 判绿，大厅轮记分口径）**。自测方法：headless Chrome + CDP 驱动 `smoke.html?quality=mid&manual=1&hud=1&seed=7`（1280×720、dpr 1），`smoke.step(1/60)` 逐帧 ×1500 读 `getStats()` 记分区峰值——**hub 峰值 94 draw / 47,761 tris**（1085 帧）、**arena 峰值 111 draw / 68,597 tris**（415 帧）；另跑纯 arena 压力位（`?phase=arena&crumble=1.2`，900 帧含碎地）峰值 **113 draw / 69,905 tris**。均 ≤120 / ≤80k，与 O2 报数（94/47.8k、117/70.0k）同量级。代码审：`renderer.js` 两处 `this.island.setActive(!inHub)`（151/503 行）落实 ADR-36 双区子树互斥；`hub.test.js` 锁 hub 子树 draw ≤52。L3-10 第三子句（30s 无每帧 GC 尖峰）headless 无 devtools Performance，以 sim 侧代证（probe `maxStepMs≈1.4ms`、p99 0.117ms、bench 稳态）如实记部分。
- **W3 探针横幅 → 关**。缺省 `yizhang-probe`（环境变量可覆盖），`round3-hub-sota.test.js` 明断言「不是 `gpt-5.6-sol-xhigh-fast`」。
- **W4 单 seed → 关**。`DEFAULT_PROBE_SEEDS` 三固定 seed 冻结（源码常量 + 锁测），本机 3/3 PASS（读数见上）。
- **W5 bloom low → 关（按实现勾，不再当缺口）**。`QUALITY.low.bloom === false`（`config.js`，辉光支链整个不建）；`postfx.test.js` 锁 low `bloomEnabled=false` 且合成着色器不编译 bloom 采样、high/mid 保持选择性辉光。R-03 low 档可关检查点闭合。
- **W2 hit-stop 零余量 → 结转哨兵**（`HIT_STOP.max = 0.12` 恰在 FJ-01 上界，`juice.test.js` 锁；调参前先看锁测，不算缺口）。

**HV-04 盲辨（Round 3 记分 · 诚实口径：预跑/部分，不发满分勾）**：按 ART §17.2 摆场（mid 档、`unlock=all`、`hud=0`、逐座 3m 判距）headless 逐座三连拍 24 张 + 争议座复核 16 张。**静帧口径 6/8 座签名形即辨**：granite 岩屑绕掌、gale 风带环绕、frost 台沿冰棱+雾、spring 真螺旋蓄放、afterimage 半透错位复本、magnet 向心收束线。cotton / meteor 两座细粒子静帧弱（billboard 朝向与运动为主的层，photo 静帧拍不实）；改用跟随相机（p0 站进交互圈、正常渲染路径）复核确认粒子在场且动向符合 §17.1 底线形（絮团升荡 / 余烬升+落灰），无一座归零、无纯色光球。**完整交互盲辨（动帧、乱序遮名、观察者报名）本环境做不到，正式 ≥6/8 记分延后真机段**——预跑证据强于 Round 2 的 2/8，但不假勾满分。

**Round 3 新增十项核验（逐条实查代码与锁测）**：

1. **空挥闸 = `playerInHub` 空间闸**：`step.js:107` `gated = playerInHub(state, p)` 分别拦 dash/slap/skill；408/422 行 hub 地面与免掉落同源（R2 项复验无回退）。
2. **皮肤六套剪影 + `skinAppearance` 握手**：`data/skins.js` 六 id（drifter/mason/crane/reed/nuo/wildhorn，DEFAULT `drifter`）；`render/skins.js` 经 `core/skins.js skinAppearance()` 吃契约枚举；`characters.test.js` 剪影互异锁测绿。
3. **8 掌战斗 VFX 分派**：`COMBAT_VFX_KIND` 八键八形（`fanwake/slab/gust/rime/recoil/phase/flux/cinder`），`round3-hub-sota.test.js` 明断言 afterimage=`phase` ≠ mirror。
4. **残影 yaw -Z + ttl/ttl0**：`combat-bridge.js ghostsView` yaw 减 `FACE.combatOffset` 还原 -Z 约定、`ttl0` 缺失以当前 `ttl` 兜底；O3 补「回灌残影缺 ttl0 第一帧补基准」测试；`characters.js:1345` 按 `ttl/ttl0` 淡出。
5. **`setLook` pitch**：`render/index.js` 导出 `setLook/setPitch/getLook`；`core/look.js feedLook`（无 setter 时 no-op，有测）；`main.js:175` 每帧喂 `input.getLook()`。
6. **再来一局 ≠ 回安全区**：`core/entry.js` `ENTRY.RESTART → skipHub:true`（带同一副掌回裂岛）/ `ENTRY.HUB → skipHub:false` 不预填；O4 文案归 entry 单一真源（RESTART 句携带将沿用的掌名、暂停「回安全区」明说弃局）+ `.yz-warp` 淡场；`entry.test.js` 16 测。
7. **`enterHub` 清计时域**：`state.js:219-245` 清 `dashT/switchLockT`、`activeSlot=0`、statuses/attack/respawnT/kbT 复位、hub focus/portalNear 归零、发 `enterHub` 事件；**`gloveId/offhandId` 原样保留**（原局回程带装）——与壳层 ENTRY.HUB「重开新局不预填」二义分明。
8. **O3 回程不在走道结算**：`combat/index.js:393`（冲刺段回安全区当场作废、不写 vx/vz）、`:446`（pending 延迟结算不分种类整笔作废，含 `meteorImpact` 纯表现事件不发）、`:505`（残影假掌不替回安全区者补刀）；`vfx-events.test.js` 29 测锁。
9. **契约 v4.2 / ADR-36**：`API_CONTRACT.md` v4.2 修订说明 ①–⑤（皮肤通路 / VFX 分派词 / ADR-36+getStats / hub 换掌交换改写 / 进局入口语义），零新 API；ADR-36 正文在 ARCHITECTURE §10 与契约 §7 补记，与 `renderer.js` 实现互证。
10. **GDD §14.3 同词**：idle 八词（`fluff/grit/streak/mist/coil/ghost/pull/ember`）与 `hub-vfx.js IDLE_VFX_KIND`、战斗八词与 `COMBAT_VFX_KIND` 逐词比对一致，中文八词与 ART §17.1 底线形表同词。

**HG-06 抽验**：① `RENDER_YAW_OFFSET === 0`（`view.js:21`）+ FD-06/朝向锁测在 557 内绿；② 皮肤链单测绿（skins schema / characters 剪影 / view.skinId）；③ VFX 八键锁测绿；④ `HIT_STOP.max=0.12` 上界锁绿。

**红线扫描（全零命中）**：`googleapis|gstatic` src/dist/index.html 零；`roblox|slap battle` 仅检查命令与文档自引；官方手套名/方块人零；`loading|progress` src/ui src/render 零（无加载条）；`RENDER_YAW_OFFSET=0` 未回 PI；`createMatch` 缺省 hub（`resolvePhase` 三条旧路保留，`round3-hub-sota` 锁）；测试 500→557 零减量；隔离干净（diff 过滤后零残留）。

**洞 1–10 终态**：1/2/3/4/5/6/10 **关**（R2 已关，复验无回退）；洞 7 **关**（W1 修复本机实测两区峰值均入预算，见上）；洞 9 **关**（入口层级 R2 定稿维持）；洞 8 **延后真机**（本环境无真机，不假装过）。

**WARNING 清单（只留真还红的）**：

- **真机段未做**（洞 8 + §12.4 交互十步 + HV-04 完整盲辨 + M-01…07）：headless 环境无交互桌面与真机，全部如实延后；有真机后按 §12.4/§12.5 补验即可销。
- **W2 hit-stop 零余量哨兵**结转（非缺口，调参闸门）。
- **L3-10 GC 子句部分**：渲染侧 30s Performance 采样 headless 做不了，sim 侧读数代证（见 W1 条）。

**判定：大厅轮 Round 3 = PASS-WITH-WARNINGS**（判定表与证据见 ACCEPTANCE §12.10；WARNING 全部为环境性延后与哨兵，无实现缺口）。

---

## 12. 固定人物视角轮（Look Round 1–3）验收清单 —— 视角空间修复 / lookMode / 过门吸附

维护者：Fable-4（SOTA 验收）。上游依据：`.agent_workspace/yizhang-look/GOAL.md`（用户原话：视角转换很奇怪 + 固定人物视角）、`.agent_workspace/yizhang-look/OWNERSHIP.md`、`docs/API_CONTRACT.md` v4.3（ADR-37 simYaw 喂入 / ADR-38 lookMode / ADR-39 过门 snap，新不变量 §14-28…33）。执行规程见 `ACCEPTANCE.md` §13。
判定规则沿用 §0：全部二值可勾选、勾选只由验收流程执行、红线即时否决、上级默认包含下级（复验防回退）。

### 12.0 轮次门槛（视角轮 Gate）

| 轮次 | 必须全绿 | 允许延后 / 最小实现 |
|---|---|---|
| Round 1（可玩线） | LG-01…06 全部；LK-01/02/03/05/06/07/08；LT-01…06 真实断言；红线 LR-01…04 与 FR/R 表零命中 | **LK-04（free 解耦）允许 sim/render 两半先行、input 产出分派延后**（缺省 locked 是产品主路径）；LK-09 HUD 一瞬反馈允许 toast 顶班、`.yz-look-flash` DOM 延后；LT-07/08 可缺席；O3 席（Bot 不受 lookMode 影响的显式锁测）、F3 席（GDD 视角章）可未合 |
| Round 2 | 复验 Round 1 全绿（回退按 FAIL 计）；LK-04 input 产出分派实装（契约 §8 free ⇒ `yawFromDir(move)` / null）；LK-09 `.yz-look-flash` DOM 落地；LT-07/08 真实断言；O3/F3 席收口 | 转向手感（灵敏度/阻尼）评分卡预跑 |
| Round 3（SOTA 签字） | 复验全表；§13.4 方向+视角手动脚本实机/真机走完（含触屏 free/locked 切换）；性能不回归（probe p99StepMs ≤0.5ms） | — |

### 12.1 LG- 回归门（每轮前置；任何一项红 → 直接 REJECT，不再往下记分）

- [x] **LG-01 测试全绿且不减量** — `npm test` 退出码 0，通过数 **≥557**（开工基线 @ `7340300`：557/40 文件）。实测 **631/631（44 文件）**。唯一预期改动：视角单测按 v4.3 契约重写 yaw 空间断言（`f96bd6b`）、夹具不再直塞 `lookYaw`（`4ca6ac9`），属对齐不属弱化；除此之外弱化/删除既有断言按造假计（§4 规则 4）。
- [x] **LG-02 探针不回归 + 视角硬门** — `npm run probe` 3/3 固定 seed `status:"pass"`、`wiredCombat:true`、`ai:"think"`、hubJourney 全链、`arenaKills ≥ 1`；**视角轮新增硬门**：`cameraSnapMaxDist ≤ 20`（实测 7.1m）、`lockedForwardMinDot ≥ 0.999`（实测 1.0，每 seed 3601 帧全检）、且路线必须真实压过远跳（`arenaEntryPreSnapDistance > 20`，实测 ~127m——不压远跳的 snap 断言是空话）。
- [x] **LG-03 构建过** — `npm run build`（vite）退出码 0（主 chunk 680.55kB / gzip 188.19kB，>500kB 警告既知）。
- [x] **LG-04 隔离** — 改动只落 `games/yizhang/**` 与 `.agent_workspace/yizhang-look/**`；不碰其他 `games/*`、`pages/`、workflow、不复制第二份游戏目录（FR-03 同源）。验证：`git diff --name-only origin/main...HEAD` 过滤后零残留。
- [x] **LG-05 依赖与外链纪律 + 朝向常量防回潮** — 运行时依赖仍仅 `three`；`rg -n "googleapis|gstatic" src dist index.html` 零命中；**`RENDER_YAW_OFFSET === 0`**（`core/view.js`，禁止回 `Math.PI`，禁止用「再加一个偏移」修视角——ADR-25 重申）；相机系↔sim 系换算实现仍只有 `core/view.js cameraYawToSimYaw / simYawToCameraYaw` 一处，其余文件只 import（LR-01）。
- [x] **LG-06 大厅轮回归抽验** — ① hub 全链：`resolvePhase` 缺省 `hub`、hubJourney（equippedAtStep=51 / enteredArenaAtStep=227）三 seed 复跑无回退；② 皮肤：skinId 存档/进 view 单测仍绿；③ 战斗 VFX：`COMBAT_VFX_KIND` 八键锁测仍绿；④ hit-stop：`HIT_STOP.max=0.12` 上界锁仍绿。任何一项回退按该项 FAIL 计并引用 §11 原条目定位。

### 12.2 LK- 视角行为（用户验收线六条 + 支撑两条 + HUD 面）

- [x] **LK-01 开局镜头在角色背后** — 开局（hub 走道）第一帧：机位已架在角色身后、水平距离 ≤20m（无「从裂岛飞过来」的首帧漂移）；locked 下相机水平前向与 `p0.yaw` 同向（dot ≥0.999）。验证：probe `snapAndObserveCamera('opening first frame')`（实测 openingCameraDistance=7.1m、dot=1.0）+ `render/look.test.js` 锁「locked 钉背后、绕不到正脸」半平面断言 + HB-01 出生朝向沿用（`spawn.yaw=0` 面向门）。
- [x] **LK-02 过门机位不飞跃** — hub↔arena 传送、开局、结算回程三处机位**立即吸附**：`alignCameraToSelf`（`main.js`）按冻结顺序 `input.setLook(simYawToCameraYaw(self.yaw))` → `feedLook` → `snapLook(renderer)` 收尾于 `startMatch` / `enterArenaFx` / `enterHubFx`（契约 §13.2）；渲染层另有 hub↔arena 切换与 >TELEPORT_DIST 整跳的自动 snap 兜底、观战→跟随切换也 snap。验证：probe hub→arena 首帧 pre-snap ~127m → post-snap ≤7.1m、`snappedFrames:2`（开局+过门）三 seed 全过 + `core/look.test.js` snapLook 组（snapCamera/resetCamera/snap 按序探测、无口 no-op、抛错不带走主循环）。
- [x] **LK-03 locked 面向 = 视线（1:1 逐 tick）** — `Input.yaw` 有限数 ⇒ sim `p.yaw = input.yaw` **直赋**：逐位相等、不平滑、不 wrap、多子步只留最后一次；移动不改写朝向；安全区里照样能转向（空挥闸只拦出招不拦看）。验证：`sim/look-yaw.test.js`「locked 直赋」组 ×4 + `tests/look-round1-invariants.test.js`「locked input / sim yaw / camera-forward 同 tick 相等」+ probe `lockedForwardMaxAngleDeg=0`（3601 帧 ×3 seed）。
- [x] **LK-04 free 可解耦（面向与镜头）** — 契约 §8（ADR-38 冻结，v4.4 升格为 §14-34 sample 分派封闭表）：free 下移动矢量非零 ⇒ `Input.yaw = yawFromDir(moveX,moveZ)`、零移动 ⇒ `Input.yaw = null`（保持朝向），镜头独立看；locked 恒 `cameraYawToSimYaw(θ)` 1:1。**Round 1 实测 FAIL（产出半边未实装）→ Round 2 O4 落地后重判 PASS（F4 @ `c97723d`）**：`src/input/index.js sample()` 现按 `state.lookMode` 分派——free 起手 `out.yaw = null`，位移模 > `MOVE_EPS` 才改送 `yawFromDir(move.x, move.z)`（W+S 对消的合零矢量落回 null 不原地翻身；禁用输入零位移自然 null，绝不送 NaN），locked 恒送 `cameraYawToSimYaw(θ)` 与 Round 1 逐字一致。三层证据全绿：input 分派锁测（`input/index.test.js` lookMode 分派组，全文件 44 测 + `tests/look-round2-lk04.test.js` LT-07 整链 ×3）、sim 集成（`sim/look-yaw.test.js` 25 测含 O1 free 组：走向即面向、松手不回弹、走向即出掌前向）、探针（G2 free 段 ×3 seed：`freeStationaryMaxYawDeltaDeg = 0`（静止转镜头人不动）、`freeMoveMaxYawErrorDeg ≈ 0.0002°`（移动面朝走向））。`yawFromDir` 在 `core/view.js` 的同名备份为同空间矢量换角（契约 §1-11 登记、头注明示与 `sim/math.js` 逐字同式），不构成第四套换算。
- [x] **LK-05 横扇读向（左→右横抽，非上撩）** — 扇击动画是**横抽**：肩关节 YXZ 序先端平再横扫，掌从角色左侧扫到右侧（跟随镜头里 = 屏幕左→右），纵向行程 ~1.5cm vs 横向 ~1.1m；判定同形：**横着的一片扇形**（左右由 `slapAngleDeg` 张角管、上下只由高度闸门管），不是竖锥；VFX 扇面跟掌横扫（`combat-vfx.js` 绕出掌方向左→右）。验证：`characters.js` 出掌曲线注释与常量 + `combat/combat.test.js`「判定是横着的一片扇形」+ `tests/look-round1-invariants.test.js`「render adapter 侧向主导 strike」。
- [x] **LK-06 打人朝向一致（扇击前向 ≡ p.yaw ≡ locked 视线）** — 扇击前向就是 `p.yaw`（sim 空间）：横扫范围内（含 right 一侧）打得到、正后方与锥外一点点打不着、`reach = slapRange + playerRadius` 不偷偷放大、**本 tick 转的身本 tick 就作数**（locked 下「准星指谁打谁」无一帧滞后）。验证：`sim/look-yaw.test.js`「扇击前向 = p.yaw」组 ×6。用户「打不中」专项若另有产出，按其合入后复跑本条防回退。
- [x] **LK-07 机位喂入空间唯一（ADR-37 收口）** — `core/look.js lookPayload`：`yaw === simYaw === cameraYawToSimYaw(θ)`（同值双名，相机系角不出输入层、payload 无第三套朝向字段）；`renderer.setLook` 消费序冻结：`simYaw` 优先 → `simYaw:null` 回落跟角色 → 无 simYaw 才读 `yaw`（此时必须已是 sim 空间）；反证测在场：把未换算的相机系角塞进 sim 口机位翻到正脸（修的就是这个 bug）。验证：`core/look.test.js` ×21 + `render/look.test.js` ×15 + 不变量 §14-28 取 θ 使两值不同的判决性断言。
- [x] **LK-08 lookMode 四通道 + 缺省 locked** — 取值链 URL `?look=` > 存档 `lookMode` > 缺省 `locked`（URL 乱填落到存档不落缺省、不回写）；V 键上升沿 toggle（长按/repeat 不振荡、不抢 WASD/空格/E、禁用输入时不生效、切换不动 yaw/pitch）；`onLookModeChange` 落存档 + 设置面板同步灯；老档缺字段补 `locked` 不清档不升版本。验证：`input/index.test.js` lookMode 组 ×8 + `core/look.test.js` resolveLookMode 组 + `core/storage.test.js` 向后兼容组 + 跨层不变量「URL > 存档 > locked」。
- [x] **LK-09 V 切换一瞬反馈 HUD（`.yz-look-flash`）** — F2 视觉终稿已合（`src/styles/hud.css` §18.1：`.yz-look-flash` / `.is-on` / kbd 键章）；**O4 DOM 已合（`cf1333d`，Round 2 改勾）**：`.yz-look-flash` 为 `#hud` 常驻节点（`ui/hud.js`，`role="status"`，含 kbd 键帽），`main.js` 只经 `shell.setLookMode` 点亮一枚回执（文案「视角锁定 / 自由视角」，亮 0.9s `is-on`，连按重置计时不排队不叠字），`#hud[data-look]` 随模式翻转驱动准星样式；触屏收 kbd 键帽文本照常（`[data-touch="1"] .yz-look-flash kbd` 选得中）。F3 对账后 Round 1 记录的「toast 顶班」登记作废——切换**不开中央 toast**（`shell.test.js`「中央短讯那块大字不跟着开」锁死，GDD §15.1 同词）。验证：`ui/hud.test.js` ×9 + `ui/shell.test.js` look 组（LT-08）。

### 12.3 LT- 测试锁表（MUST EXIST；Round 1 在场性实测）

| ID | 锁什么 | 关联条目 | 载体（实测在场性） | 责任 | 生效轮次 |
|---|---|---|---|---|---|
| **LT-01** | lookPayload / feedLook / snapLook / resolveLookMode 空间与回落 | LK-02/07/08 | `src/core/look.test.js` ×21 ✅ | O4/G1 | Round 1 |
| **LT-02** | 渲染 simYaw 优先序、locked 钉背后半平面、相机系角进 sim 口即翻脸反证、snap | LK-01/02/07 | `src/render/look.test.js` ×15 ✅ | O2/G1 | Round 1 |
| **LT-03** | sim 直赋/保持/非有限值、扇击前向=p.yaw、过门与重生出生朝向（含 −0 归一） | LK-03/04(sim半)/06 | `src/sim/look-yaw.test.js` ×19 ✅ | O1/G1 | Round 1 |
| **LT-04** | lookMode 通道：V 键/缺省/回调/禁用/不动 yaw-pitch + 存档向后兼容 | LK-08 | `src/input/index.test.js` lookMode 组 + `src/core/storage.test.js` ✅ | O4/G1 | Round 1 |
| **LT-05** | 跨层不变量：feedLook 同角双名、locked 三层同 tick 相等、URL 链、横扇侧向主导 | LK-03/05/07/08 | `tests/look-round1-invariants.test.js` ×5 ✅ | G1 | Round 1 |
| **LT-06** | 探针视角硬门：snap ≤20m + 真实远跳前提 + locked dot ≥0.999 逐帧 | LG-02、LK-01/02/03 | `scripts/probe.mjs` lookProbe ✅ | G2 | Round 1 |
| **LT-07** | free 产出分派：free 移动 ⇒ yawFromDir、静止 ⇒ null、locked ⇒ cameraYawToSimYaw | LK-04 | `tests/look-round2-lk04.test.js` ×3（input→sim 整链）+ `input/index.test.js` lookMode 分派组 ✅（Round 2 补齐） | O4/G1 | Round 2 |
| **LT-08** | `.yz-look-flash` DOM 挂载与 is-on 时序 | LK-09 | `src/ui/hud.test.js` ×9 + `src/ui/shell.test.js` look 组 ✅（Round 2 补齐） | O4/G1 | Round 2 |

### 12.4 LR- 红线增补（视角轮即时否决，叠加 §11.7 HR、§10.9 FR、§5 R 表）

| ID | 红线 | 依据 | 检查方法 |
|---|---|---|---|
| **LR-01** | `RENDER_YAW_OFFSET` 回非 0 / 新增第三套朝向字段或第四套换算 | ADR-25/37、FR-02 同源 | `rg -n "RENDER_YAW_OFFSET" src/core/view.js` 恒 0；换算实现只在 `core/view.js` |
| **LR-02** | 相机系角落进任何 sim 侧字段（`renderer.lookYaw`、`Input.yaw`、`p.yaw`） | ADR-37 机位喂入纪律 | LT-01/02 判决性断言（取 θ 使相机系≠sim 系）+ 代码审读 |
| **LR-03** | lookMode 权威副本散布（shell/render/main 另存运行期权威） | ADR-38（状态只住 input） | rg 审读：render 的 lookMode 只随 payload 收、shell 只作面板镜像 |
| **LR-04** | 弱化既有断言骗绿（删测试、改阈值、空 expect） | §4 造假条款、FR-05 同源 | 测试 diff 审读（本轮唯一豁免：视角单测按 v4.3 契约对齐重写，`f96bd6b`/`4ca6ac9`） |

### 12.5 Round 1 实测记分（F4 验收席 @ 父分支 `4ca6ac9`，2026-08-27，全套命令实跑）

**执行口径**：Round 1 已合席位（F1/F2/O1/O2/O4 部分/G1/G2）的验收。工作分支 `cursor/yizhang-look-f4-db8d`（仅动本文件与 `ACCEPTANCE.md`）。自动化全套实跑；本环境无交互桌面——§13.4 手动脚本（实机转视角/V 切换/过门目视）**未做**，以 90 条视角单测 + 三 seed lookProbe 逐帧断言替代并如实标注，归 Round 2/3 实机段。命令原文见 ACCEPTANCE §13.6。

**三件套实测**（勾选依据）：

- `npm test`：**631/631（44 文件）**，退出码 0（基线 557 → 631，零红零减量；视角新测 90 条：core/look 21 + render/look 15 + sim/look-yaw 19 + 跨层不变量 5 + input 30）。
- `npm run probe`：**PASS** 退出码 0，3/3 固定 seed。视角读数逐 seed 一致：`cameraSnapMaxDist:7.1`（开局 7.1 / 过门 pre-snap 127.0–127.2 → post 7.1）、`lockedForwardMinDot:1 / lockedForwardMaxAngleDeg:0`（每 seed 3601 帧）、`snappedFrames:2`；沿用门全绿：`wiredCombat:true`、`ai:"think"`、arenaKills 1/2/2、hubJourney equippedAtStep=51 / enteredArenaAtStep=227、p99StepMs 0.103–0.125。
- `npm run build`：退出码 0；主 chunk 680.55kB / gzip 188.19kB。

**六条用户验收线判定**：

| # | 验收线 | 判定 | 一句话证据 |
|---|---|---|---|
| 1 | 开局镜头在背后 | **PASS** | probe 开局首帧 7.1m + dot=1.0；render 半平面锁测 |
| 2 | 过门不飞跃 | **PASS** | pre-snap ~127m → post-snap 7.1m ×3 seed；align→feed→snap 三处冻结序 |
| 3 | locked 面向=视线 | **PASS** | Input.yaw 直赋逐位相等；跨层同 tick 相等；3601 帧 ×3 seed dot=1.0 |
| 4 | free 可解耦 | **FAIL（产出半边）** | `sample()` 恒送 `cameraYawToSimYaw(θ)`、无 yawFromDir/null 分派——free 行为等同 locked；sim/render 两半有测且绿；指派 O4，Round 2 收口 |
| 5 | 横扇读向 | **PASS** | 判定横扇形（非竖锥）+ 动画左→右横抽 + VFX 跟掌；跨层 strike 侧向主导 |
| 6 | 打人朝向一致 | **PASS** | 扇击前向=p.yaw ×6 测（含本 tick 转身作数、正后方空掌）；「打不中」专项在跑，合入后复跑防回退 |

**未合项（不装绿，逐项登记）**：

- **O4 HUD DOM**（LK-09/LT-08）：`.yz-look-flash` CSS 已合、DOM 零消费，V 反馈 toast 顶班——DEFER。
- **O4 free 产出分派**（LK-04/LT-07）：契约冻结、实现缺席——FAIL 计入上表，Round 2 必收。
- **F3 GDD**：`docs/GDD.md` 自基线零 diff——默认 lookMode/键位文案/机位 tuning 未入数值真源，DEFER（收口前以契约 v4.3 为准）。
- **O3 席**：`src/ai` 自基线零 diff——「Bot 不受 lookMode 影响 / 观战 orbit 仍可用」无显式锁测；旁证：sim 不感知 lookMode（ADR-38）+ Bot 自产 yaw + 观战 orbit 与观战→跟随 snap 在渲染层在场。DEFER。
- **用户「打不中」专项**：可能仍在跑；其合入后按 LK-05/06 复跑防回退。

**红线扫描（全零命中）**：`RENDER_YAW_OFFSET = 0` 在位；`googleapis|gstatic` src/dist/index.html 零；换算实现唯一（其余文件只 import）；`resolvePhase` 缺省 hub 未动；测试 557→631 零减量；隔离 diff 过滤后零残留；lookMode 权威只住 input（render 随 payload 收、shell 面板镜像）。

**WARNING 清单（记录不否决）**：

- **实机段未做**（§13.4 手动脚本：转视角手感、V 切换目视、过门淡场帧、触屏）：本环境无交互桌面，全部如实延后 Round 2/3。
- **free≡locked 的用户可感差**：V 键今天能切模式、有 toast、落存档，但切到 free 后行为无差——建议 O4 收口前设置面板对 free 标注「实验中」或 Round 2 一并交付，防用户困惑。
- **W2 hit-stop 零余量哨兵**结转（§11.9）。

**判定：视角轮 Round 1 = PASS-WITH-WARNINGS**（判定表与证据见 ACCEPTANCE §13.6；FAIL 仅 LK-04 产出半边且属 Round 1 门槛允许延后项，六条用户验收线 5 PASS / 1 FAIL-DEFER，无红线命中）。

**编排层补记（Round 2 合入后）**：本节「未合项」五条中四条已过时——O4 HUD DOM（`cf1333d`）、O4 free 产出分派（`5a09b67`）、O3 席（`06a7cba` 护栏 + `c97723d` Bot yaw 有限闸）、F3 GDD（`e726330` §15 视角章）、用户「打不中」专项（`5f09ccc`，`tests/aim-alignment.test.js` ×7 + `combat/look-invariants.test.js` ×11）均已合入父分支；Round 2 改勾与重判见 §12.6。仅 **O2 机位复核仍在飞**（Round 1 后 `src/render` 零 diff），§12.6 按 DEFER 登记。

### 12.6 Round 2 实测记分（F4 SOTA 验收席 @ 父分支 `c97723d`，2026-08-27，全套命令实跑）

**执行口径**：Round 2 已合席位（O4 sample 分派 / G1 LK-04 锁测 / G2 locked-free 探针 / F1 契约 v4.4 / F2 free 侧视线合同 / F3 GDD §15.1 对账 / O1 free 集成测 / O3 Bot yaw 有限闸 + lookMode 盲区锁测 / 打人朝向专项）的复验与 LK-04 重判。工作分支 `cursor/yizhang-look-r2-f4-db8d`（仅动本文件与 `ACCEPTANCE.md`，不改 src）。自动化全套实跑；本环境仍无交互桌面——§13.4 实机八步**未做**，以 103 条视角相关锁测 + 三 seed lookProbe（locked 3601 帧逐帧 + free 双段）替代并如实标注，归 Round 3 实机段。命令原文见 ACCEPTANCE §13.7。

**三件套实测**（勾选依据）：

- `npm test`：**717/717（51 文件）**，退出码 0（Round 1 基线 631/44 → 717/51，零红零减量；新增含 `tests/look-round2-lk04.test.js` ×3、`tests/aim-alignment.test.js` ×7、`src/combat/look-invariants.test.js` ×11、`src/ai/bot-yaw-finite.test.js` ×8、`src/ai/look-mode-blind.test.js` ×8、`ui/hud.test.js` ×9；`input/index.test.js` 扩至 44、`sim/look-yaw.test.js` 扩至 25）。
- `npm run probe`：**PASS** 退出码 0，3/3 固定 seed。视角读数：`cameraSnapMaxDist:7.1`（开局 7.1 / 过门 pre-snap 127.0–127.2 → post 7.1，`snappedFrames:2`）、`lockedForwardMinDot:1 / lockedForwardMaxAngleDeg:0`（每 seed 3601 帧）；**G2 Round 2 新增读数全过硬门**：`lockedTurnMinAngleDeg:47.67`（locked 段真实转过镜头再验 1:1，非静置空话）、`lockedCameraMaxBehindness:-7.1`（相机恒在面向反方向半平面）、`freeStationaryMaxYawDeltaDeg:0`（free 静止转镜头人不动）、`freeMoveMaxYawErrorDeg:0.00021`（free 移动面朝走向）。沿用门全绿：`wiredCombat:true`、`ai:"think"`、arenaKills 1/2/2、hubJourney `equippedAtStep:51 / enteredArenaAtStep:227`、p99StepMs 0.117–0.134。
- `npm run build`：退出码 0；主 chunk 680.55kB / gzip ≈186.4kB（>500kB 警告既知，含 three）。

**LK-04 重判（Round 1 唯一 FAIL → PASS）**：判据与三层证据见 §12.2 条目正文。要点：分派整只收在 `input.sample()`（sim/renderer 不感知 lookMode，ADR-38 原样）；locked 路径与 Round 1 逐字一致（`lockedForwardMinDot:1` 复跑无回退）；free 两半（静止 null / 移动 yawFromDir）由 input 锁测、sim 集成测、探针读数三层互证。

**R1 过时 DEFER 改勾**：LK-09（HUD DOM）→ PASS（§12.2 改勾，LT-08 补齐）；O3 席 → 收口（`ai/look-mode-blind.test.js` 显式锁「Bot 不感知 lookMode」+ `ai/bot-yaw-finite.test.js` Bot yaw 帧帧有限闸，`bots.js` 收敛修复随行）；F3 GDD → 收口（§15 视角章 46 行：lookMode 缺省 locked / 0.9s 回执无 toast / 切换视角同词 / CAMERA 对照表）；打人朝向专项 → 已合并复跑防回退绿（aim-alignment ×7 + combat/look-invariants ×11 在 717 内全绿，probe locked dot=1.0 复跑无回退）。

**六条用户验收线重表（Round 2）**：

| # | 验收线 | R1 | R2 | 一句话证据 |
|---|---|---|---|---|
| 1 | 开局镜头在背后 | PASS | **PASS** | probe 开局首帧 7.1m + dot=1.0 + `lockedCameraMaxBehindness:-7.1`（新增负值硬门）×3 seed |
| 2 | 过门不飞跃 | PASS | **PASS** | pre-snap 127.0–127.2m → post-snap 7.1m、`snappedFrames:2` ×3 seed 复跑无回退 |
| 3 | locked 面向=视线 | PASS | **PASS** | 3601 帧 ×3 seed dot=1.0；G2 新增 locked 段真实转镜头 47.67° 后仍逐帧 1:1 |
| 4 | free 可解耦 | FAIL | **PASS（重判）** | sample() 分派落地：静止 null（hold Δ0°）、移动 yawFromDir（误差 0.0002°）；LT-07 + O1 集成 + 探针三层互证 |
| 5 | 横扇读向 | PASS | **PASS** | 判定横扇形 / 动画左→右横抽复验绿；F2 二审「横扇轴复核」`b5513e4` 随行 |
| 6 | 打人朝向一致 | PASS | **PASS** | 扇击前向=p.yaw 复跑绿 + 专项 `aim-alignment` ×7 合入（本 tick 转身作数、正后方空掌、reach 冻结无作弊） |

**未合项（不装绿）**：

- **O2 机位复核**：Round 1 后 `src/render` 零 diff（`git diff 4ca6ac9..HEAD --stat -- src/render` 空）、`origin/cursor/yizhang-look-o2-db8d` 尖端仍是 Round 1 的 `00ad7f3`——Round 2 派发的机位复核未交卷。**DEFER**：渲染机位面以 Round 1 已合的 `render/look.test.js` ×15 + probe 机位读数复跑绿为准（无回退即不挡），其复核结论合入后由 F4 补验防回退。

**红线扫描（全零命中）**：`RENDER_YAW_OFFSET = 0` 在位；`googleapis|gstatic` src/dist/index.html 零命中；相机系↔sim 系换算实现仍唯一（`cameraYawToSimYaw/simYawToCameraYaw` 只实现在 `core/view.js`；`core/view.js yawFromDir` 为契约 §1-11 登记的同空间矢量换角备份，非第四套）；lookMode 权威仍只住 input（renderer 持随帧镜像，v4.4 §7.1 措辞修订登记，非第二权威——LR-03 零命中）；测试 631→717 零减量；隔离 diff 过滤后零残留。

**WARNING 清单（记录不否决）**：

- **实机段延后**（§13.4 八步：转视角手感、V 切换目视、过门淡场帧、触屏 free/locked 切换）：本环境无交互桌面，结转 Round 3。
- **O2 机位复核在飞**（上表 DEFER）：合入后 F4 复跑 probe 机位读数 + `render/look.test.js` 防回退。
- **转向手感评分卡预跑未做**（§12.0 Round 2 允许延后项）：随实机段一并归 Round 3。
- **W2 hit-stop 零余量哨兵**结转（§11.9）。

**判定：视角轮 Round 2 = PASS-WITH-WARNINGS**（判定表与证据见 ACCEPTANCE §13.7；Round 1 唯一 FAIL 项 LK-04 重判 PASS，LK 九条全绿、LT 八条全在场真实断言，六条用户验收线 6/6 PASS；WARNING 全部为环境性延后与在飞席位登记，无实现缺口、无红线命中）。

**编排层补记（Round 3 合入后）**：本节唯一未合项 **O2 机位复核已合入**（`4696ee0` locked 背后半平面硬顶 + `91fd888` 迟滞与归位让路，merge `f202877`）——上表 DEFER 过时，Round 3 改勾与复验见 §12.7；`render/look.test.js` 15 → 27，probe 机位读数复跑无回退。

### 12.7 Round 3 实测记分（F4 最终验收席 @ 父分支 `372a8dd`，2026-08-27，全套命令实跑）

**执行口径**：Round 3 已合席位的最终验收。已合：**O2 机位复核补交**（R2 DEFER 销号：`4696ee0`+`91fd888` @ merge `f202877`）/ **F1** 契约 v4.4 实现态登记（`e7eae97` @ `cf644fa`）/ **F2** ART §18.7 SOTA 收口审计（`7f71689` @ `ff61b2f`）/ **F3** GDD §15 locked 硬顶与切模式不传送机位登记（`a8ceb70` @ `9061829`）/ **O1** reach 镜像与 1e-4 边界复核（`4c322d9`）/ **O3** 水平锥与 Bot 路径锁测（`9947c05`+`255ec8f` @ merge `372a8dd`）/ **G2** 切模式机位连续性探针 + 跨层锁测（`a3f9e4d`+`2284321`+`74290f0`）。F4 签字当时登记 **R3 O4 边角**与**另一份 R3 O2 复核**仍在飞（当时 `git diff c97723d..HEAD` 零 `src/input`/`src/ui`/`src/main.js` diff）。**编排层收口：二者已合入父分支**（见下补记），WARNING 销号。工作分支 `cursor/yizhang-look-r3-f4-db8d`（仅动本文件与 `ACCEPTANCE.md`，不改 src）。自动化全套实跑；本环境仍无交互桌面——§13.4 实机八步以 **probe 硬门 + headless Chrome 148（SwiftShader WebGL）CDP 驱动 `smoke.html` 截图**替代并逐步写清口径（见下），不装成手测过。命令原文见 ACCEPTANCE §13.8。

**三件套实测**（勾选依据）：

- `npm test`：**737/737（52 文件）**，退出码 0（Round 2 基线 717/51 → 737/52，零红零减量。新增 20 条：`render/look.test.js` 15→27（O2 硬顶锁测 +12）、`sim/look-yaw.test.js` 25→28（O1 +3）、`tests/look-round3-cross-layer.test.js` 新 ×3（G2）、`combat/look-invariants.test.js` 11→12（O3 +1）、`ai/look-mode-blind.test.js` 8→9（O3 +1）；`ai/bot-yaw-finite.test.js` 行内加固不变 8）。
- `npm run probe`：**PASS** 退出码 0，3/3 固定 seed。R2 读数全部复跑无回退：`cameraSnapMaxDist:7.1`（开局 7.1 / 过门 pre-snap 127.0–127.2 → post 7.1，`snappedFrames:2`）、`lockedForwardMinDot:1 / lockedForwardMaxAngleDeg:0`（每 seed 3601 帧）、`lockedTurnMinAngleDeg:47.67`、`lockedCameraMaxBehindness:-7.1`、`freeStationaryMaxYawDeltaDeg:0`、`freeMoveMaxYawErrorDeg:0.00021`；**G2 Round 3 新增硬门全过**：`modeSwitchCameraMaxDist:7.133 ≤ 20`（V 真实 keydown/keyup 双向切换 ×2，`observeModeSwitchCamera` 断言切模式不武装 `_snapPending` 且 `_followCamera` 返回未 snap）、`lockedReturnYawError ≈ 1.7e-16`（free→locked 首帧即恢复 1:1 直赋）、`lookModeTransitions:2 / modeSwitchCameraFrames:2` 逐 seed 全录。沿用门全绿：`wiredCombat:true`、`ai:"think"`、arenaKills 1/2/2、botSlapAttempts 2191/3425/3636（> 哨兵 1900）、hubJourney `equippedAtStep:51 / enteredArenaAtStep:227`、p99StepMs 0.104–0.116（≤0.5）；横幅 `MODEL_SLUG: yizhang-probe`。
- `npm run build`：退出码 0；主 chunk 681.44kB / gzip 188.54kB（>500kB 警告既知，含 three）。

**编排层收口补记（R3 O2+O4 合入后）**：F4 签字基线是 **737/52 @ `372a8dd`**（上列三件套为 F4 亲跑；本收口不假装 F4 复跑了后续测）。其后父分支合入：
- R3 O2（merge `58052e8`）：急甩背后咬合闸 `BEHIND_LIMIT` + `CAMERA_SNAP_TELEPORT=60`，与 R2 `LOCKED_YAW_SPAN` 迟滞两套并存（`holdBehindLimit` vs `holdBehind`；`_phaseChanged` + `_notePhase`）
- R3 O4（merge `b3f5d03`）：`toggleLookMode` 认 `state.enabled` 闸、回调 try/catch、当帧 `sample()`、跨层 `look-switch.test.js`

合入后父分支测基线是 **775 passed / 54 files**（merge 工人在 `ea1c825` 上跑的）；本收口再复跑确认。

**O2 机位复核收口（R2 DEFER 改勾）**：`src/render/camera.js` 落地 locked 背后半平面**硬顶**——`LOCKED_YAW_SPAN = π/2 − 0.1`（留 0.1rad 余量使 behindness 断言恒取到确定负数）、`lockedHoldSlack`（30rad/s 生效带宽，0.25–1.2 夹，掉帧自适应）、`holdBehind/insideBehind`（yaw 份）+ `holdPosBehind`（机位份，位置阻尼 λ6.2 < yaw λ7.5 故单夹 yaw 不够）；**迟滞双位分记**（`behindHold/behindPosHold`：上一帧在半平面里才拽得动这一帧——转身挤出去的无感拽回，朝向被瞬移/归位途中整只让路）；`renderer._behindYaw` 只在 locked 且 yaw 有限时下发（free 恒不夹）；**切模式不入 snap 名单**（`_notePhase` 只认 hub↔arena 换区）。锁测 +12 覆盖判决面：720°/s 甩镜绕不到正脸、free 同甩法不受硬顶、`setLookMode`/payload 不武装 snap、free→locked 弹簧归位不甩镜、归位途中硬顶让路逐帧与纯弹簧逐位相同、过门仍 snap、常规转速 ≤270°/s 硬顶零介入（手感一行没改）、`holdBehind` 三分支。F4 复验：probe 机位读数（7.1 / −7.1 / dot 1.0）复跑无回退，GDD §15（F3）与 ART §18.7（F2）登记与实现同词。

**实机八步（§13.4）替代口径逐条**（headless Chrome 148 + CDP 驱动 `src/render/smoke.html?manual=1&seed=7&quality=mid`，真实渲染链路 + 真实 sim；smoke 的 V 与壳层同键位。截图 6 张存验收工作台，不入 src）：

| 步 | 原教旨口径 | 本轮替代证据 | 判 |
|---|---|---|---|
| 1 开局背后 | 实机目视首帧 | 截图 01：走道出生、机位在背后正对纵深与门；probe `openingCameraDistance:7.1`、dot=1.0 ×3 seed | 替代 PASS |
| 2 方向回归 | 键鼠 W/S/A/D | 无头无指针锁——FD 矩阵锁测（input 44 测）+ FD-06 半平面 + `RENDER_YAW_OFFSET=0` 静态面；键鼠手感留真机段 | 替代 PASS（手感延后） |
| 3 locked 转镜头 360° | 实机原地转镜 | probe locked 段真实转镜 47.67° 后 3601 帧 dot=1.0；O2 硬顶锁测 720°/s 甩不绕正脸 | 替代 PASS |
| 4 横扇读向 | 实机目视横抽+空挥 | 无头拍不实挥掌动画帧——combat「判定是横着的一片扇形」+ O3 水平锥/水平 reach/Bot 水平瞄准锁测 + 跨层「切模式后扇击前向 = 真实 locked 视线」（`look-round3-cross-layer` #2） | 替代 PASS |
| 5 V 切换 | 实机按 V 目视 | smoke 运行时 V 双向切换截图：01→02 同帧位（locked→free 不跳）、03→04 机位连续（free→locked，cameraYaw 2.25→1.75 弹簧中段）、05 归位背后；probe `lookModeTransitions:2` 零 snap ×3 seed；HUD 一瞬反馈 smoke 无壳层 HUD，以 `ui/hud.test.js` ×9 + `shell.test.js` look 组代 | 替代 PASS |
| 6 过门吸附 | 实机穿门目视 | smoke tour 全链（走道装掌→穿门，step 1085 过门）首帧+2 帧截图 06：机位已架在裂岛出生点身后（无敌罩+门光粒子在框），无 120m 飞越帧；probe pre-snap 127m → post 7.1m、`snappedFrames:2` | 替代 PASS |
| 7 存档链 | 刷新页面复验 | 无刷新交互——`core/storage.test.js` 向后兼容组 + 跨层「URL > 存档 > locked」不变量 | 替代 PASS |
| 8 触屏 | 真机 | 无真机，如实延后 | DEFER（真机段） |

**六条用户验收线（Round 3 终表）**：

| # | 验收线 | R1 | R2 | R3 | 一句话证据 |
|---|---|---|---|---|---|
| 1 | 开局镜头在背后 | PASS | PASS | **PASS** | probe 7.1m + dot=1.0 + behindness −7.1 复跑无回退；截图 01 目视 |
| 2 | 过门不飞跃 | PASS | PASS | **PASS** | pre-snap 127m → post 7.1m ×3 seed；截图 06 过门首帧目视 |
| 3 | locked 面向=视线 | PASS | PASS | **PASS** | 3601 帧 ×3 seed dot=1.0；O2 硬顶把「绕不到正脸」从阻尼巧合升级为几何保证 |
| 4 | free 可解耦 | FAIL | PASS | **PASS** | free 静止 null / 移动 yawFromDir 复跑无回退；截图 03 机位绕到侧面、人物面向不动目视 |
| 5 | 横扇读向 | PASS | PASS | **PASS** | 横扇形判定 + O3 水平锥/水平 reach 锁测加固复验绿 |
| 6 | 打人朝向一致 | PASS | PASS | **PASS** | aim-alignment ×7 + O1 reach 镜像/1e-4 边界 + 跨层「切模式后扇击前向=视线」复验绿 |

**红线扫描（全零命中）**：`RENDER_YAW_OFFSET = 0` 在位；换算实现唯一（`cameraYawToSimYaw/simYawToCameraYaw` 只实现在 `core/view.js:173/178`，其余 10 文件 import）；`rg googleapis|gstatic src dist index.html` 零命中（build 后含 dist 复查）；lookMode 权威仍只住 input（renderer 随帧镜像，LR-03 零命中）；测试 717→737 零减量（LR-04 零命中）；隔离 diff 过滤后零残留（LG-04）。

**WARNING 清单（记录不否决）**：

- **真机段延后**（§13.4 八步的交互原教旨口径：键鼠转向手感、触屏 free/locked、转向手感评分卡）：本环境无交互桌面与真机，以上表替代口径如实标注；有真机后按 §13.4 复跑即销。**保留。**
- **R3 O4 边角与另一份 R3 O2 复核**：**已合入父分支** `ea1c825`（O2 咬合闸 + snap=60；O4 切 V / disabled 闸 / 连按 HUD）。销号。F4 未复跑 775；收口复跑见上补记。
- **W2 hit-stop 零余量哨兵**结转（§11.9）。**保留。**

**判定：视角轮 Round 3 = PASS-WITH-WARNINGS**（判定表与证据见 ACCEPTANCE §13.8；LG 六门全绿、LK 九条全绿（含 O2 DEFER 改勾）、LT 八条全在场真实断言 + R3 新增 20 条锁测、六条用户验收线 6/6 复验无回退；WARNING 仅余真机段延后与 W2 hit-stop 哨兵，R3 O2/O4 在飞已销；无实现缺口、无红线命中）。
