# 异掌 · SOTA 分级验收清单（Round 1–3）

维护者：Fable-4（SOTA 验收）。上游依据：`.agent_workspace/yizhang/DESIGN_SEED.md`、`.agent_workspace/yizhang/CONTRACT.md`、`games/yizhang/docs/VISUAL_HANDBOOK.md`。
执行规程见同目录 `ACCEPTANCE.md`。数值调参（击退量、掌意增速等）以 Fable-3 的 `GDD.md` 为单一事实源；本清单只锁**契约常量、行为、可验证阈值**。

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

- [ ] **RG-01 测试全绿** — `npm test` 退出码 0、零红、**零文件加载失败**。分母注意：当前收集口径 152（145 绿 / 7 红），另有 `src/combat/sim-integration.test.js` **整文件加载失败**（import 已删除的 `sim/fallback-combat.js`），其 8 条用例根本不进分母——修复加载后全绿目标 ≈ **160/160**。「152/152」只是当前口径的速记，验收以退出码 0 为准。
- [ ] **RG-02 探针击杀 + 真实战斗** — `npm run probe` `status:"pass"` 且 `kills ≥ 1`；`usingRealCombat` 读数按 §9.2 语义判读：**生产路径为真即算达标**；harness 修复自装后按字面 `true` 判读。
- [ ] **RG-03 构建过** — `npm run build`（vite）退出码 0。
- [ ] **RG-04 零 googleapis/gstatic** — `rg -n "googleapis|gstatic" src dist index.html` 零命中（R-13 静态面；注意 `index.html` 不在 `src` 下，必须单列）。
- [ ] **RG-05 人类 id 唯一 `p0`** — `rg -n '"p1"' src/main.js` 零命中；probe roster 校验 human=`p0`。
- [ ] **RG-06 八掌经裸 `step` 可达** — 不做任何 `install*`，裸 `createMatch/step` 下 8 个 glove 各有 ≥1 条可观测行为断言（7 个主动技行为互异生效 + cotton `"none"` 安全 no-op），且全程 `getDeps().usingRealData && usingRealCombat`。

### 9.2 `usingRealCombat` 标志语义（勘定 · Round 2 简报风险 #1 落档）

**代码事实**（`src/sim/deps.js`）：sim **静态 import** 真实 `../data/gloves.js` 与 `./combat-bridge.js`（桥内接真实 `src/combat`）；`installData/installCombat` 仅供测试装替身；`usingRealCombat = !combatMod` —— **true = 没装替身 = 正在用静态引入的真实战斗桥**。生产（浏览器 main、裸 `createMatch/step`）无人调 `install*`，恒为 true（实测：裸路径 `usingRealData=true usingRealCombat=true`）。语义没有写反，**是探针的读法反了**。

**探针为何读到 false**：`scripts/harness.mjs` 的 `installSimulationDependencies` 只要看到 `installCombat` 钩子存在，就把原生 `src/combat/index.js` 装进去——标志按定义翻成 false，probe 再打印「real combat not wired」。这是**自伤误报**：装进去的模块本身就是真实 combat，但它讲 combat 原生方言（yaw 朝 +Z、自带 `cd/busyUntil`、返回形状不同），**绕过了 combat-bridge 的适配**——探针实际压的是一条「混合方言」路径：技能在这条路径上会哑（`tests/skills.test.js` 两条金丝雀红的根因即此），扇击恰好方言兼容所以仍能出 kills。

**修法（GPT-sol-2）**：harness 删除 `installSimulationDependencies` 自装（ADR-19 后静态接线是默认）；探针即自然回报 `usingRealCombat: true` 并真正压测生产路径。
**判读规则（验收侧）**：harness 修复前，probe 的 `usingRealCombat:false` **不按未接线记**，以裸路径 `getDeps()` 读数与 RG-06 矩阵为准；修复后按字面判读，false 即门红。

### 9.3 Round 3 首验实测记分（@ `160122a`，Round 2 合入态）

复核对象：`cursor/yizhang-db8d` @ `160122a`。复核日期 2026-08-26。Round 3 各执行代理工作**尚未落地**——本记分即 R3 起点基线，也是当前树的诚实判定。

| 门 | 判定 | 实测证据 |
|---|---|---|
| RG-01 测试全绿 | **FAIL** | 145/152（7 红，退出码 1）+ `sim-integration.test.js` 加载失败（8 条未计入分母）。红项分解见 §9.4 |
| RG-02 探针 | **PASS（按 §9.2 判读）** | `status:"pass"`、kills=3、p99StepMs=0.094、`ai:"think"`、botSlapAttempts=5439；`usingRealCombat:false` 系 harness 自装所致，裸路径实测 true |
| RG-03 构建 | PASS | vite 退出码 0；主 chunk 590.46kB / gzip 159.73kB（含 three），总 gzip 远低于 1.2MB 预算 |
| RG-04 零 googleapis | **FAIL（= R-13 红线命中）** | `src/styles/index.css` 11–12 行两条 `@import`（第 9 行注释再引 gstatic）；`index.html` 17–18 行两条 preconnect；两者均原样进 `dist/assets/index-*.css` 与 `dist/index.html` |
| RG-05 p0 | PASS | `SELF_ID="p0"`（`src/core/view.js`）；`rg '"p1"' src/main.js` 零命中；probe roster 校验 human=p0 通过 |
| RG-06 八掌经裸 step | PASS | 裸矩阵 8/8：granite 目标位移、gale 冲刺 8.16m、frost 挂 `slow`、spring 反弹 vz=10.81、afterimage 换位 3.00m、magnet 拉近 4.00→1.40m、meteor 腾空 4.65 + 目标冲量 2.47、cotton no-op 成立；全程 `usingRealData/usingRealCombat=true` |

**判定：REJECT（2/6 门红；RG-04 同时是 R-13 红线，按规则即时否决）。** 绿项（RG-02/03/05/06）终验时只需复跑防回退。

### 9.4 RG-01 七红一载分解（根因 + 指派）

7 红中 **6 条是测试陈旧**（ADR-19 静态接线 / schema 冻结 / `"none"` 哨兵之后没跟上），**1 条疑似实现 bug**；另有 1 个文件加载失败。修测试或修实现均可，**禁止空 expect**（§4 造假条款照常适用）。

| # | 红项 | 根因 | 性质 | 指派 |
|---|---|---|---|---|
| 0 | `src/combat/sim-integration.test.js`（整文件加载失败） | import 已删除的 `sim/fallback-combat.js` | 测试陈旧 | GPT-sol-1（改写对照组；修复后 8 条用例入分母） |
| 1 | `tests/glove-data` schema | 测试期望 `awakenModifiers:{slapRangeMul,…,special}` 形状，F3 实表已是 `{params:{…}}` 形状 | 测试与数据 schema 分叉 | Fable-3 + GPT-sol-1 定稿一种形状 |
| 2 | `tests/match-lifecycle` 出台缘 | 摆位后第 1 步 `alive` 即 false——摆位已落在 `arenaRadius+0.2` 外无支撑，或判死早一帧 | **唯一疑似实现 bug**，需裁定 | Opus-1 |
| 3–4 | `tests/skills` spring/magnet | `beforeEach` `installCombat(原生 combat)` 压掉静态桥 → 混合方言技能哑（§9.2）；裸路径 8/8 绿 | 测试接线陈旧 | GPT-sol-1（删 `install*`，改走裸路径） |
| 5 | `wiring` data 装表 | 期望 install 后掌表数值变化；ADR-19 后静态默认就是真表（1.15 = 1.15，无从「变」） | 期望陈旧 | GPT-sol-1 |
| 6 | `wiring` usingRealCombat | 期望 install 后为 true；语义上 install ⇒ false（§9.2） | 期望与语义相反 | GPT-sol-1 |
| 7 | `wiring` alignSkillIds | 期望 `cotton.skillId` 为假值；F3 已冻结 `"none"` 哨兵 | 期望陈旧 | GPT-sol-1 |

### 9.5 Stretch 与遗留（不否决，入报告）

- **L2/L3/M 全表 stretch**：本轮无 L3 签字；L2 代码在（双掌/觉醒/碎地/技能矩阵）但以 RG-01 全绿 + 手感盲测（ACCEPTANCE §7）为签字前提。
- **技能 id「一张表」未收敛**（R3 冲刺第 4 条）：四处别名表并存——`data/skills.js` `SKILL_COMBAT_ALIASES`、`sim/combat-bridge.js` `SKILL_ALIAS`、`core/modules.js` `SKILL_ALIASES`、`combat/skills.js` `SKILL_ALIASES`；运行时靠桥收敛结果正确，但四表随时漂移，记 WARNING。
- **bloom 三档常开**（strength 0.9/0.8/0.7，`src/render/config.js`）：low 档可关未做（R-03 检查点原文），记 WARNING。
- **probe 单 seed**（`0x1a2b3c4d`）：距 T-07 规格「3 固定 seed」有差，记 WARNING（GPT-sol-2）。
- **注释级 fallback-combat 残留**：`data/tiles.js`、`sim/deps.js` 注释仍引旧文件名（不否决，顺手清）。
