# 异掌 · SOTA 分级验收清单（Round 1–3）

维护者：Fable-4（SOTA 验收）。上游依据：`.agent_workspace/yizhang/DESIGN_SEED.md`、`.agent_workspace/yizhang/CONTRACT.md`、`games/yizhang/docs/VISUAL_HANDBOOK.md`。
执行规程见同目录 `ACCEPTANCE.md`。数值调参（击退量、掌意增速等）以 Fable-3 的 `GDD.md` 为单一事实源；本清单只锁**契约常量、行为、可验证阈值**。

> **当前生效轮次：安全区大厅轮（Hub Round 1–3，父分支 `cursor/yizhang-hub-db8d`）—— 验收以 §11 为唯一记分表。**
> §10 是手感轮（`cursor/yizhang-feel-db8d`，大厅轮分支即由其拉出）的记分表，其 FG/FD/FS/FV/FJ 条目被 §11 回归门（HG-06）引用作防回退基准；§0–§9 是骨架→精品系列（`cursor/yizhang-db8d`，2026-08-26 以 197 测全绿收口）的存档。两段均不得删改。

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

- [ ] **HG-01 测试全绿且不减量** — `npm test` 退出码 0，通过数 **≥306**（开工基线 @ `1b4371f`：306/306、23 文件）。弱化/删除既有断言按造假计（§4 规则 4；FR-05 同源）。
- [ ] **HG-02 探针走通大厅全链** — `npm run probe` 退出码 0、`status:"pass"`，输出 `hubJourney` 段：hub 起步（`mainGloveId=null`、`portalReady=false`）→ 聚焦目标掌（`focusObserved`）→ 装主掌（`equippedAtStep`）→ 穿门（`enteredArenaAtStep` 有值，≤1200 步）→ `arenaKills ≥ 1`；`wiredCombat:true`、`ai:"think"` 沿用。**开工实测即红**（`probe must start in hub phase; got arena`，详见 §11.5 基线与 §11.6 洞 3）：harness 缺省 `phase:'arena'` 与 probe 的 hub 剧本对齐失败，一行修复归 GPT-sol-2；修复合入前本门按「已知红、待修」记，不发 PASS。
- [ ] **HG-03 构建过** — `npm run build`（vite）退出码 0（基线通过，主 chunk 含 three >500kB 警告既知）。
- [ ] **HG-04 隔离** — 改动只落 `games/yizhang/**` 与 `.agent_workspace/yizhang-hub/**`；不碰其他 `games/*`、`pages/`、workflow、不复制第二份游戏目录（FR-03 同源）。验证：`git diff --name-only origin/main...HEAD` 审读。
- [ ] **HG-05 依赖与外链纪律** — 运行时依赖仍仅 `three`；`rg -n "googleapis|gstatic" src dist index.html` 零命中；大厅场景（走道/台座/展掌/门）全部低面数几何 + 程序纹理，零下载素材（R-13/FR-04 同源）。
- [ ] **HG-06 手感轮回归抽验（用户回归线：键鼠方向 / 皮肤 / 战斗 VFX）** — ① 方向：`RENDER_YAW_OFFSET === 0` 静态在位 + FD-06 相机半平面单测仍绿 + 大厅走道里 W=屏幕深处实机复验（§12.4 步 2）；② 皮肤：FS-03/04 存档 roundtrip 与 `view.players[].skinId` 单测仍绿 + 选非默认皮肤后走道与裂岛模型均生效；③ 战斗 VFX：FV-01/02/03 事件带掌 id、渲染分派表 8 键、ghosts 单测仍绿 + 传送后放技能特效无回退；④ hit-stop：FJ-01 上界锁仍绿。任何一项回退按该项 FAIL 计并引用 §10 原条目定位。

### 11.2 HB- 大厅流程行为（sim/壳层，全部自动化可锁）

- [ ] **HB-01 开局在安全区、不在裂岛中央** — 产品路径（`main.startMatch` 不带 `skipHub`）⇒ `createMatch` 缺省 `phase='hub'`（`sim/state.js resolvePhase`；`skipHub`/`phase:'arena'`/`config.skipHub` 三条旧路保留）；p0 落 `HUB.spawn` (0, −106)、yaw=0 面向门；断言 `Math.hypot(p0.x, p0.z) > 22`（裂岛盘 20+2m 缓冲之外）；相机跟在角色身后、开局即面向走道纵深。验证：`src/sim/sim.test.js`「默认 phase=hub」+ 手动开局录屏。
- [ ] **HB-02 八座台座布局硬约束** — `view.hub.pedestals.length === 8`、`gloveId` 唯一覆盖 8 掌、顺序 = GLOVES 图鉴顺序；`interactRadius` 2.0 ∈ [1.6, 2.2]；任两座间距 > 2×interactRadius；大厅全部几何距裂岛盘（20+2m）不重叠；spawn/座/门都在 bounds 内、门区不碰任何交互圈；数据表深冻结、JSON 纯净。验证：`src/data/hub.test.js` ×10（契约 §3.3 硬约束 1–4 逐条）。
- [ ] **HB-03 靠近聚焦 / 离开取消** — p0 入 interactRadius ⇒ `focusGloveId` = 该掌 + `hubFocus` 事件；离圈 ⇒ null；并列取台座表序靠前（同 seed 稳定）。验证：`tests/hub-flow.test.js`「靠近时聚焦」「离开交互半径后取消聚焦」。
- [ ] **HB-04 interact 边沿装备、长按不连发** — E / 触控「选」输出 `interact` 持续位，sim 在 `p.prev.interact` 做上升沿；按住按键走到另一座不得重复消费同一次按下。验证：tests/hub-flow 第 1 条（按住换座不装）+ `src/input/index.test.js`「安全区的 interact 采样」组。
- [ ] **HB-05 双掌先主后副** — 主空装主 → 已是主掌 no-op（`changed:false`）→ 副掌再按提为主掌（原主退副）→ 副空装副 → 双满换副；副掌未选时写回玩家 `offhandId = mainGloveId`（不让人白捡没选过的掌）；`hubEquip` 事件带 `slot/changed`；HUD 配装条主/副实时更新。验证：`src/core/hub-flow.test.js`「equipIntent · 先主后副」×6 + tests/hub-flow 主副装备序列。
- [ ] **HB-06 未解锁可见但拒绝** — `unlocked` 缺省 fail-closed（`unlock==='default'` 集合 + 调用方明确携带的两掌；cotton 恒可用；空集回落表首掌防八座全灰）；聚焦未解锁掌 + interact ⇒ 配装逐字段不变、发 `hubLocked {unlock}`、说明牌写解锁条件而非「按 E」、toast 报解锁条件。验证：tests/hub-flow 第 2 条 + hub-flow.test.js「未解锁的台座显示解锁条件」。
- [ ] **HB-07 门未就绪提示** — `portalReady === false`（主掌未选）时进门圈：不传送、发 `hubPortalNear {ready:false}`、toast「传送门认掌不认人 · 先挑一只主掌」、HUD 门提示三段语气（先选掌 → 已就绪 → 门前）状态驱动。验证：hub-flow.test.js「传送门三段语气」「没选主掌时走进传送门不放行」。
- [ ] **HB-08 传送同 tick、loadout 保留、计时域切换** — `portalReady ∧ 进门半径`（现实现为圆形 `portal.radius=2.4`，穿门即传送、无需再按 interact，键鼠触控同路径）⇒ 同 tick `phase='arena'`、p0 走既有出生链路落岛上（`hypot < arenaRadius`、`hasFloorUnder` true、`invulnT ≥ invulnTime`）、`gloveId/offhandId` 原样保留、对局计时从进岛起算（`match.startTime = state.time`）、`isMatchOver` 在 hub 恒 `over:false`（逛大厅不吃对局时间）。验证：tests/hub-flow 第 3 条 + `src/ai/view-contract.test.js` hub 集成。
- [ ] **HB-09 安全区免战** — hub 体积内：`applyKnockback` 返回 0、无 KO/掉落判定、combat `inSafeZone` 拒绝出招（`resolveSlap/resolveSkill` 返回 `reason:'hub'`）；被连扇 180 帧位置/deaths/hitsTaken 零变化。规则按「实体所处空间」生效——摆在裂岛坐标的旧测不受影响。验证：tests/hub-flow 第 4 条 + `src/combat/util.js inSafeZone`（sim 单份实现，combat 不抄第二份）。
- [ ] **HB-10 Bot 仅 arena 出现** — hub 开局 Bot 全部落裂岛盘（原点 20m 内）不进走道（`state.js`「安全区不放 Bot」，距安全区最近缘 ≥78m，大厅视野不可见）；`think` 在 hub 视图下恒零输入（`isHubView` fail-safe：缺 phase 但带 hub 数据也休眠）；main 在 hub 期不喂 Bot 输入；传送后 Bot 才开打（probe `arenaKills ≥ 1` 佐证活性）。验证：`src/ai/bots.test.js`「安全区守卫」组 + view-contract「phase=hub 时 think 一律零输入」。
- [ ] **HB-11 触控与键鼠同一套靠近+确认** — `input.setPhase('hub')` 下 E 只发 interact、扇击/技能不出（安全区不对展掌开技）；触控「选」按钮走 `setTouchButton('interact', down, {slot})` 同通路、可指定主/副槽；确认键章触屏显示「选」键鼠显示「E」（`.yz-inspect-key`，独立于被触屏隐藏的 `.yz-kbd`）；切回 arena 后 E 复位技能。触控钮尺寸沿用 L1-07/G-06 阈值。验证：`src/input/index.test.js` interact 组 + hub-flow.test.js「触控写『选』」+ devtools 触控仿真实测。
- [ ] **HB-12 存档写回与回程 API** — 传送帧 `rememberHubLoadout → updateSave({loadout})` 把走道所选落盘（「直接进裂岛」与「再来一局」吃它）；`enterHub(state)` 回程 API 在场且有测（sim.test.js「enterHub 能把人送回安全区再选」）、`main.returnToHub` 不刷新页面回大厅；2D `.yz-home` 配掌板降为暂停面板备选入口、不删（HR-05 红线）。验证：单测 + 手动存档链（§12.4 步 8）。

### 11.3 HV- 走道与传送门渲染（SOTA 面；**开工实测 O2/F2 未合入**——`rg -i "hub|pedestal|portal" src/render` 零命中，本组全红起步，见 §11.6 洞 1/2）

- [ ] **HV-01 3D 安全区场景在场** — hub 阶段画面有可见走道地面与边界（对应 bounds/walkway 15×39m），与裂岛同世界摆放（z≈−120）不穿帮不遮挡；隐形墙位置与 sim 钳制一致（贴墙走无穿模、无「撞空气」错位）。验证：实机录屏 + 走道边界绕一圈。
- [ ] **HV-02 台座 ×8 有形有源** — 座体高 0.95、位置/朝向全部读 `view.hub.pedestals`（禁第二份硬编码坐标，HR-04）；SOTA 面：台座有磨损与该掌识别色漆线（`color` 字段）。验证：代码审读（数据源唯一）+ 截图。
- [ ] **HV-03 展掌手指朝上 + 悬浮呼吸** — 掌模型掌心/手指朝 +Y、几何中心 y=1.35（数据表 `GLOVE_HOVER_Y`）、轻微悬浮或呼吸；yaw 面向走道中线（左排面 +X、右排面 −X，ADR-17 直用零补偿）。验证：截图 + 慢放。
- [ ] **HV-04 idle VFX 可辨掌** — 8 座各有可辨识 idle 特效（霜雾/岩屑/风带/磁弧等，特效语言归 F2/O2 规范）；禁纯色光球（R-05）、禁发光描边（R-02）、禁 Bloom 糊屏（R-03）。Round 3 盲辨：遮掌名按 idle 特效认掌 **≥6/8**（协议 §12.5）。
- [ ] **HV-05 传送门可见 + 门内过渡** — 走道尽头有门体（位置读 `view.hub.portal`）；`portalReady` 前后有可辨状态差（未就绪暗 / 就绪亮，识别色克制）；穿门过渡为短淡场/门光（现 `.yz-warp` ≤400ms），**禁加载条糊屏**（HR-03）。验证：录屏对比。
- [ ] **HV-06 大厅 HUD 视觉真源归一** — F2 在 `src/styles/**` 落 `.yz-inspect`/说明牌/门提示/配装条视觉终稿（饱和识别色只给当前聚焦掌，R-09 纪律）；O4 的 `src/ui/hub.css` 收缩为结构性 fallback，双源同名类不打架（上一系列 K-1 风险的大厅版，§11.6 洞 2）。验证：devtools 生效样式来源核对 + 截图。

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
