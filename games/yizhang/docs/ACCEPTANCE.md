# 异掌 · 验收规程（Round 1–3）

维护者：Fable-4（SOTA 验收）。指标定义与阈值以同目录 `SOTA_CHECKLIST.md` 的 ID 为唯一事实源，本文只定义**执行顺序、证据要求、否决规则、判定模板**，不重复定义数值。

## 1. 范围与环境

- 验收对象：`games/yizhang/**` 在各轮结束时合入 `cursor/yizhang-db8d` 的状态（或待合分支）。
- 验收环境：Node ≥20 + npm；桌面 Chrome 最新版；移动端 Round 1–2 允许 devtools 设备仿真，**Round 3 必须真机**（中端 Android 定义见 §8）。
- 所有命令默认在 `games/yizhang/` 下执行。

## 2. 统一验收流程（每轮 8 步，顺序执行）

任何一步 FAIL 即中断并出具 REJECT 报告；后续步骤仍可继续跑完用于收集修复清单。

### 第 1 步 · 拉取与安装

```sh
git fetch origin && git checkout <被验分支> && git log --oneline -3
cd games/yizhang && npm ci
```

核对 L0-07（隔离）：`git diff --name-only origin/main...HEAD | grep -v '^games/yizhang/' | grep -v '^\.agent_workspace/'` 应只剩共享只读文件的追加改动（若有，须已在简报声明）。

### 第 2 步 · 契约静态检查（T-09、L0-03/04/05）

```sh
# 模拟侧禁 three / DOM —— 必须零输出
rg -n "from ['\"]three|require\(['\"]three" src/sim src/data src/combat src/ai
rg -n "\b(window|document|navigator|localStorage)\b" src/sim src/data src/combat src/ai
# 运行时外链 —— 只允许注释/文档字符串
rg -n "https?://" src index.html
# 红线关键词
rg -in "roblox|slap battle" .
rg -in "outline" src/render src/styles   # R-02 排查（命中需人工判读）
```

**Round 2 起增补（退出门 G-04/G-05/G-07 与 §5.1 风险图的静态面）**：

```sh
rg -n "SELF_ID" src/main.js                                      # G-04：必须指向 "p0"，出现 "p1" 即门红
rg -n "installData|installCombat" src/main.js src/sim/index.js   # G-05：注入/静态引入证据（再以裸 step 技能测试为准）
rg -n "googleapis|gstatic" src dist index.html                   # G-07 / RG-04 / R-13：必须零命中（index.html 不在 src 下，必须单列；含构建产物）
rg -c "\.yz-" src/ui/shell.css src/styles/*.css                  # K-1：双 CSS 同名类面积对照（人工判读漂移）
```

### 第 3 步 · 自动化测试

```sh
npm test
```

- 必须退出码 0。
- 按轮次核对 T- 表生效项（SOTA_CHECKLIST §6）：Round 1 至少 T-01/02/05/09 真实断言、T-03/04/06/08 占位存在；Round 2 起 T-01～T-09 全部真实断言。
- 存在性速查：`rg -l "T-0[1-9]" tests scripts`，再抽读断言内容防"空壳测试"（只 import 不断言者按缺失计）。

### 第 4 步 · 探针

```sh
npm run probe    # T-07 / T-08 / L2-08 统计
npm run bench    # L3-11（Round 3）
```

核对输出 JSON：3 个固定 seed 的 60s 1+3 Bot 运行零异常、无 NaN、活性达标、`avgStepMs` 达标（Round 3 ≤0.5ms）；Round 2 起确定性 hash 两跑一致；Round 2 起 Bot 三性格统计可分。

**Round 2 起**：探针输出 `status:"soft-pass"`（零杀）按 FAIL 计 —— 退出门 G-02 要求 `kills ≥ 1` 硬门（Round 1 基线 2 kills，不得回退）；probe 当前单 seed（`0x1a2b3c4d`），本轮应硬化到 T-07 规格的 3 固定 seed，验收按实际 seed 数如实记录。

**Round 3 起（战斗接线标志判读，语义勘定见 SOTA_CHECKLIST §9.2）**：sim 侧标志定义为「没装测试替身」（`usingRealCombat = !combatMod` + 真身识别，`src/sim/deps.js`），生产静态桥恒为 true。历史坑：旧 harness 自装原生 combat 曾致探针误报 false（「real combat not wired」）且压的是绕过 combat-bridge 的混合方言路径；`8dff71e` 起 harness 删自装、probe 输出字段更名 **`wiredCombat`** 并内建 `!== true` 即抛错的硬断言——自此按字面判读，false/抛错即门红。若复现 false，先查是否有测试替身泄漏进探针进程，再疑接线。

### 第 5 步 · 构建

```sh
npm run build && du -sh dist && find dist -name '*.js' -exec gzip -k9 {} + && du -ch dist/**/*.js.gz | tail -1
```

构建成功；Round 3 核对 L3-10 体积预算；产物内零外链（`rg -n "https?://" dist` 判读，**Round 2 起额外 `rg -n "googleapis|gstatic" dist` 必须零命中** —— Round 1 复核在 `dist/assets/index-*.js` 内联 CSS 串中实测命中两条 Google Fonts `@import`，即 R-13）。

### 第 6 步 · 手动可玩性脚本

`npm run dev`（4181 端口），按下列脚本走一遍，全程录屏：

1. 主菜单：选主/副掌（Round 1 允许仅木棉可选）→ 进局。
2. 走位 20s：感受惯性起步/停步；转相机一周（L1-01/02）。
3. 对 Bot 扇击：观察前摇-命中-后摇；**故意打空一次**确认后摇存在（L1-03）。
4. 把 Bot 扇下岛：确认击杀记账与 Bot 重生（L1-04/05/06）。
5. 自己走下岛：确认 1.2s 重生 + 1.0s 无敌 + 连胜断（L1-05）。
6. devtools 触控仿真（Round 3 换真机）：摇杆+扇钮同时操作，量测钮尺寸（L1-07/M-02/M-07）。
7. *Round 2 起*：Q 切副掌并在 0.4s 锁内尝试扇击（应被拒）；E 放全部 8 掌技能各一次；攒满掌意觉醒一次看 8s 起止；用磐石/陨掌砸碎一块地并从洞掉下去（L2-01…06）。
8. *Round 2 起*：完成 1 个解锁挑战 → 刷新页面确认存档；打完整局到 7 杀或 4 分钟看结算（L2-09/10）。
9. 切后台 30s 回来：无 dt 爆炸、无音频撕裂（L1-11）。

### 第 7 步 · 视觉评审（R- 表 + 手册自检）

对照 SOTA_CHECKLIST §5 逐条打勾，重点五项：**R-01 塑料高光、R-02 发光描边、R-03 Bloom 糊屏、R-04 系统字体 HUD、R-05 纯色光球 VFX**。再跑 VISUAL_HANDBOOK §14 检查清单中的 8 条关键项：灰度剪影(1)、光源指认(2)、材质三问(3)、饱和峰值(4)、崭新检查(5)、描边检查(7)、字体检查(10)、VFX 残留(13)。每条留截图证据。

### 第 8 步 · 移动审计

M-01～M-07 逐条执行（Round 1–2 仿真即可并标注"仿真"；Round 3 真机）。帧率按 §8 协议采样并附原始数据。

## 3. 轮次门槛

以 SOTA_CHECKLIST §0 Gate 表为准。补充裁量规则：

- **Round 2 退出门前置**：SOTA_CHECKLIST §0 的 G-01～G-07 全绿是 L2 记分的前置条件；门内任何一项红 → 直接 REJECT，不再往下记分（修复清单照常出）。
- **Round 3 终局门重定标**：以 SOTA_CHECKLIST §9 的 RG-01～RG-06 为本轮唯一记分门；L2/L3/M 转 stretch（命中记分不否决，本轮不发 L3 签字）；红线 R-10～R-13 照常即时否决。
- **桩的标准**：接口存在、可调用、不抛错、有 `// 桩` 注释或 TODO 标记；假装实现（返回硬编码"正确值"骗过测试）按造假计，直接 REJECT。
- **测试占位标准**：`it.todo(...)` 或带说明的 `skip`；空文件不算。
- **复验**：每轮必须重跑上轮全部绿项，回退（regression）按该项 FAIL 计。

## 4. 否决规则（汇总）

1. 红线 R-10～R-13：任何轮次命中 → 即时 REJECT。
2. 美术组 R-01～R-09：Round 2 命中记 WARNING 入报告；Round 3 命中 → REJECT。
3. `npm test` 红、契约静态检查（第 2 步）任一命中 → REJECT。
4. 造假（空壳测试、骗测试的硬编码、勾选未验证项）→ REJECT 并在报告标注。
5. Round 3 性能不达 M-06 且自动降档亦不达 → REJECT。

## 5. 证据包要求

每轮验收产出一份证据包（贴 PR 描述 / 附件，不入 `games/yizhang/src`）：

- 第 2–5 步全部命令原始输出（含退出码）。
- `npm run probe` 的 JSON 输出原文。
- 截图 ≥6 张：主菜单、战斗中、觉醒中（R2+）、碎地后（R2+）、结算（R2+）、触控壳。
- 手动脚本（第 6 步）完整录屏 ≥60s。
- Round 3：真机型号 + 帧率原始采样 + 降档验证录屏。

## 6. 判定模板

```markdown
# 异掌 Round <N> 验收判定
- 被验分支/commit：
- 验收人/日期：
- 结论：PASS | PASS-WITH-WARNINGS | REJECT

| 组 | 通过/总数 | FAIL 项（ID + 一句话现象） |
|---|---|---|
| L0 | x/7 | |
| L1 | x/12 | |
| L2 | x/12 |（R2 起）|
| L3+M | x/19 |（R3 起）|
| T | x/9 | |
| R 否决 | 命中列表 | |

- WARNING 清单（R-01～R-09，R2）：
- 修复指派（按 OWNERSHIP）：
- 证据包链接：
```

**修复指派对照**（按 `.agent_workspace/yizhang/OWNERSHIP.md`）：sim/掉落/碎地 → Opus-1；渲染/材质/光/VFX → Opus-2；技能/觉醒/Bot → Opus-3；UI/HUD/输入/音频/主循环 → Opus-4；数值/数据表 → Fable-3；样式/艺术方向 → Fable-2；tests → GPT-sol-1；scripts/探针 → GPT-sol-2。

## 7. 手感差异化评分卡（L2-07 体验层）

**盲玩协议**：评审进入练习局，系统随机给掌且隐藏名字/图标（可用 devtools 强制或临时 query 参数），每掌操作 30s 后写下猜测 id，8 掌各一次。**≥6/8 命中为通过**。

补充四维打分（每掌每维 1–5 分，任一掌任一维 <3 记 WARNING）：

| 维度 | 问题 |
|---|---|
| 启动感 | 前摇/冷却节奏是否与该掌职能匹配（教学快、重击慢） |
| 命中反馈 | 命中瞬间的 hit-stop/音/震/粒子是否区别于其他掌 |
| 独有动词 | 该掌是否有一个别掌做不到的动作（拉、冻、弹、换位…） |
| 觉醒辨识 | 觉醒 8s 内不看 HUD 能否察觉形态变化 |

## 8. 性能测量协议（M-06、L3-09）

- **中端 Android 定义**：2021–2023 中端芯片（Snapdragon 695/778G 或同档天玑），RAM ≥6GB，Android ≥12，Chrome 最新。
- **采样场景**：1 人 + 3 Bot 战斗，采样窗口内至少发生一次觉醒和一次碎地，连续 30s。
- **采样方法**：rAF 帧间隔采样（探针可挂 `?fps=1` 开销显示，或 devtools Performance 录制），报 avg fps 与 p95 帧时长。
- **判定**：avg ≥50fps 且 p95 帧时长 ≤25ms → 过；不达 → 验证 2s 自动探测降到 low 档后复测，复测 avg ≥50fps → 过（记录"依赖降档"），仍不达 → M-06 FAIL。
- **降档验证**（无真机低端机时）：devtools CPU 4× throttle 冷启动，确认 ≤2s 内落到 low 档且帧率回升。
- 桌面 L3-09 同方法，high 档 avg ≥58fps 视作稳 60。

## 9. 命令速查

```sh
cd games/yizhang
npm ci                 # 安装
npm test               # T-01..T-06、T-09 单测
npm run probe          # T-07/T-08、Bot 性格统计
npm run bench          # L3-11 headless 预算
npm run dev            # 4181 手动验收
npm run build          # 构建 + 体积预算
```

## 10. 判定记录

### 异掌 Round 1 验收判定

- 被验分支/commit：`cursor/yizhang-db8d` @ `863bd0d`（十路合入后）
- 验收人/日期：Fable-4 / 2026-08-26（Round 2 开工复核，实测重跑）
- 结论：**REJECT**（修复清单已收敛为 SOTA_CHECKLIST §0 退出门 G-01～G-07）

| 组 | 通过/总数 | FAIL 项（ID + 一句话现象） |
|---|---|---|
| L0 | 6/7 | L0-03：`dist` 内联 CSS 携带两条 googleapis `@import`（构建产物运行时外链） |
| L1 | 3/12（另 1 项部分） | L1-01/02/07：人类 id `p0`(sim) / `p1`(main) 分裂，实机输入、相机跟随、触控驱动全部落空；L1-03/04：默认 `step` 走兜底棉掌（无人注入）+ yaw 约定分裂致正前方扇空；L1-05：出台缘被护栏夹住不判死；L1-08：schema 红 + `isGloveUnlocked` 未导出；L1-10：`npm test` 91/97 |
| L2 | 0/12 | 未开验；已知硬阻塞：`installData/installCombat` 无人调，8 技能进不了局（G-05） |
| L3+M | 0/19 | 未开验（R3 事项） |
| T | 全真绿 3/9 | 全真：T-09、T-03(spring)、T-08(vitest 侧 1 条)；部分：T-01/02/05（契约测各有红）、T-07（单 seed + 允许零杀 soft-pass）；红：T-04(magnet)、T-06(`isGloveUnlocked`) |
| R 否决 | 1 命中 | **R-13**：Google Fonts CDN 外链进构建产物（`src/styles/index.css` → `dist`） |

- WARNING 清单（R-01～R-09 预扫，R2 起正式记）：R-04 风险（shell.css 自持系统字体 token `--yz-display` 系与 F2 `--yz-font-*` 分叉）；R-01/R-07 风险（fallback Canvas2D 顶班路径存活，渲染器创建抛错即整场平光）；R-03 观察（bloom 三档常开 0.7–0.9，选择性层设计合规但 low 档应可关）。全表见 SOTA_CHECKLIST §5.1 风险图 K-1～K-6。
- 修复指派（按 OWNERSHIP）：`p0` 统一 + 启动注入 → Opus-4（main）协同 Opus-1（sim 静态引入路线）；yaw 冻结（yaw=0 朝 -Z）与契约测 helpers → GPT-sol-1 + Opus-1；出台缘判死 → Opus-1；glove schema + `isGloveUnlocked` → Fable-3；magnet/技能接线进 `step` → Opus-3；字体自托管 + token 统一 + shell.css 收缩为 fallback → Fable-2 与 Opus-4；probe 3-seed + 禁零杀 soft-pass → GPT-sol-2。
- 证据包：实测命令输出（`npm test` 91/97、probe JSON `{"kills":2,"p99StepMs":0.042,…,"ai":"think"}`、`npm run build` 退出码 0、`rg googleapis dist` 命中行）随本轮复核 PR 描述提交；数据同录 `.agent_workspace/yizhang/round1/BRIEF.md` 与 SOTA_CHECKLIST §8。

### 异掌 Round 3 验收判定（终局门 · 首验基线 `160122a` + 复验 `8dff71e`）

- 被验分支/commit：`cursor/yizhang-db8d`。**首验** @ `160122a`（Round 2 合入态，R3 执行代理工作未落地时的诚实基线）；**复验** @ `8dff71e`（合入 R3 修复：probe 静态接线与硬断言、CSS 字体外链拔除、出盘判死口径、技能 id 定稿、测试对齐）。
- 验收人/日期：Fable-4 / 2026-08-26（两轮均实测重跑：`npm ci` → 静态检查 → `npm test` → `npm run probe` → `npm run build` → 裸 `step` 八掌矩阵）
- 结论：**REJECT（@ `8dff71e`，收窄至两项）** —— RG-01 余 2 红 + 1 文件加载失败（全为测试/数据侧）；RG-04 余 `index.html` 两行死 preconnect（R-13 红线字面命中，按 §4 规则 1 即时否决）。其余 4/6 门绿。
- **三验补记 @ `af10784`**（全套命令重跑）：木棉 `skillId` 定稿空串（`2807a9f`）连带 `glove-data` schema 转绿——测试 **157/158（1 红）** + 同一文件加载失败；probe PASS（kills=1、`wiredCombat:true`）、build 过、`rg googleapis` 仅余 index.html/dist/index.html 各 2 行 preconnect、裸矩阵 8/8 均无回退。**R3 签发 PASS 仅剩三处**：`sim-integration.test.js` 死 import（GPT-sol-1）、`wiring` data 装表期望（GPT-sol-1）、`index.html` 17–18 两行 preconnect（Opus-4）。判定维持 REJECT。

| 门（SOTA_CHECKLIST §9.1） | 首验 `160122a` | 复验 `8dff71e` | 复验一句话证据 |
|---|---|---|---|
| RG-01 测试全绿 | FAIL（145/152，7 红 + 1 载失败） | **FAIL（156/158，2 红 + 1 载失败）** | 余红：`sim-integration.test.js` 第 11 行仍 import 已删除的 `fallback-combat.js`（8 条不进分母，全绿目标 ≈166）；`glove-data` awakenModifiers schema 分叉；`wiring` data 装表期望「装后变化」而静态默认已是真表。分解与指派 SOTA §9.4 |
| RG-02 探针 | PASS*（kills=3，标志误报 false） | **PASS（字面）** | `status:"pass"`、kills=1（≥1 达标；3→1 系改压真实桥路径的合法波动）、`wiredCombat:true` + probe 内建硬断言、p99 0.111ms、`ai:"think"`、botSlapAttempts 4884 |
| RG-03 构建 | PASS | PASS | vite 退出码 0；主 chunk 590kB / gzip ≈160kB（含 three） |
| RG-04 零 googleapis | FAIL（`@import` ×2 + preconnect ×2 全进 dist） | **FAIL（收窄）** | CSS `@import` 已拔除（src/dist 的 CSS 零命中）；余 `index.html` 17–18 行 preconnect ×2 → `dist/index.html` 同两行。已无实际字体请求，但 R-13 字面命中；删两行即绿（Opus-4） |
| RG-05 p0 | PASS | PASS | `rg '"p1"' src/main.js` 零命中；`SELF_ID="p0"`（`src/core/view.js`）；probe roster 校验 human=p0 |
| RG-06 八掌经裸 step | PASS | PASS | 不做任何 `install*`，裸矩阵 8/8：granite 目标位移 / gale 冲刺 8.16m / frost 挂 `slow` / spring 反弹 vz=10.81 / afterimage 换位 3.00m / magnet 拉近 4.00→1.40m / meteor 腾空 4.65+目标冲量 / cotton（`skillId:null`）安全 no-op；全程 `usingRealData/usingRealCombat=true` |

- L2/L3/M：本轮 stretch，不记分不否决（重定标声明 SOTA §9.0）；**L3 不签字**。
- WARNING 清单（复验后）：技能 id 四处别名表仍并存（data 侧 id 已定稿，运行时靠桥正确；`data/skills.js`、`sim/combat-bridge.js`、`core/modules.js`、`combat/skills.js`）；bloom 三档常开（0.9/0.8/0.7）low 不可关（R-03 检查点）；probe 单 seed（T-07 规格 3 seed）；`sim/deps.js` 头注仍引已删除的 fallback-combat（注释级）。
- 剩余修复（复验 `8dff71e` 时点，约 4 个文件；三验后 ③ 已结，见补记）：① `index.html` 删 17–18 两行 preconnect（Opus-4）；② `sim-integration.test.js` 改写对照组去掉死 import（GPT-sol-1）；③ awakenModifiers schema 定稿对齐 `tests/glove-data`（Fable-3 + GPT-sol-1）；④ `wiring` data 装表期望更新（GPT-sol-1）。修完复跑 §2 全流程即可签发。
- 证据包：两轮 `npm test` 输出（145/152 → 156/158 + FAIL 清单）、两轮 probe JSON 原文（首验 `{…,"kills":3,…,"usingRealCombat":false}`；复验 `{"status":"pass","steps":3600,…,"kills":1,"p99StepMs":0.1114,"ai":"think","botThinkCalls":10800,"botSlapAttempts":4884,"wiredCombat":true}`）、build 输出与体积、`rg googleapis src dist index.html` 命中行（复验仅余 index.html/dist/index.html 各 2 行）、裸 step 八掌矩阵输出（两轮均 8/8 PASS）——随本轮验收 commit 提交于 PR 描述。
