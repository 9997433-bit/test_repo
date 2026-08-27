# 异掌 · 验收规程（Round 1–3）

维护者：Fable-4（SOTA 验收）。指标定义与阈值以同目录 `SOTA_CHECKLIST.md` 的 ID 为唯一事实源，本文只定义**执行顺序、证据要求、否决规则、判定模板**，不重复定义数值。

> **当前生效轮次：固定人物视角轮 Round 4（打磨轮 LOOK-R4，父分支 `cursor/yizhang-polish-db8d`）—— 执行规程见 §13，指标见 SOTA_CHECKLIST §12（Round 4 记分 §12.8），判定见 §13.9。**
> §12 是大厅轮（`cursor/yizhang-hub-db8d`，视角轮分支即由其拉出）的规程，其大厅脚本（§12.4）被 §13 回归段引用；§11 是手感轮规程（方向脚本 §11.4 被 §13.4 沿用）；§1–§10 是骨架→精品系列的存档规程，§2 命令与 §8 性能协议仍被引用。均不得删改。

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

---

## 11. 手感轮（Feel Round 1–3）验收规程

指标 ID 与阈值以 SOTA_CHECKLIST **§10** 为唯一事实源（FG 回归门 / FD 方向 / FS 皮肤 / FV 每掌 VFX / FJ 打击感 / FT 测试锁 / FR 红线）。
验收对象：`games/yizhang/**` 合入 **`cursor/yizhang-feel-db8d`** 的状态（或待合子分支）。每轮 7 步顺序执行；任何一步 FAIL 即出 REJECT 报告，后续步骤照跑用于收集修复清单。**FG 回归门任何一项红 → 直接 REJECT，不再往下记分。**

### 11.1 第 1 步 · 拉取安装与隔离（FG-05）

```sh
git fetch origin cursor/yizhang-feel-db8d && git checkout <被验分支>
cd games/yizhang && npm ci
git diff --name-only origin/main...HEAD | grep -v '^games/yizhang/' | grep -v '^\.agent_workspace/'
```

最后一条只允许剩共享只读文件的已声明改动；出现其他 `games/*`、`pages/`、workflow → FR-03 即时否决。

### 11.2 第 2 步 · 静态检查（FG-04/06、FD-01/07、FS-01、FJ-05 静态面）

```sh
rg -n "RENDER_YAW_OFFSET" src/core/view.js       # FD-01：必须为 0（或常量已删、toRenderView 不改 yaw）
rg -n 'base:|4181' vite.config.js                # FG-04：base "./" + dev/preview 双 4181 strictPort
rg -n "googleapis|gstatic" src dist index.html   # FG-06：零命中（上一系列已清零，防回潮）
rg -n "cameraYawToSimYaw" src                    # FD-07/FR-02：唯一换算点，无第四套约定
ls src/data/skins.js                             # FS-01：皮肤表存在性
rg -in "vignette" src/render src/styles          # FJ-05/FR-01：无受击驱动红晕（构图暗角 0.42 可留）
```

### 11.3 第 3–5 步 · 测试 / 探针 / 构建（FG-01/02/03、FT 表）

```sh
npm test        # FG-01：退出码 0，通过数 ≥197
npm run probe   # FG-02：pass + wiredCombat:true + kills≥1 + ai:"think" + movedPlayers:4
npm run build   # FG-03：退出码 0
```

- FT 在场性速查：`rg -ln "FT-0[1-8]" tests src scripts`（或按 FD/FS/FV/FJ 行为逐条核对）；抽读断言内容防空壳（§4 规则 4；FR-05）。
- **防假达标复核（Round 2 起必做）**：FD-01/FD-06 必须是「判决性」断言——把 `RENDER_YAW_OFFSET` 临时改回 `Math.PI` 复跑，两测必须转红；不红说明测试没锁住渲染链路，按 FR-05 计。
- probe 复跑规则：任何改动 hit-stop / 僵直 / Bot 行为的 PR 合入后必须复跑 probe；`botSlapAttempts` < 1900（基线一半）须书面解释。

### 11.4 第 6 步 · 方向手动脚本（FD-08，全程录屏）

`npm run dev`（4181 端口），进局后按序执行：

1. 手不碰鼠标，按 **W** 2 秒——角色背影走向屏幕深处（远离相机、背影变小）；松开按 **S**——走向相机。
2. 按 **A**——向屏幕左平移；按 **D**——屏幕右。
3. 鼠标**向右**平移——镜头与角色向右转（远景地标向左移）；向左反向。
4. 右转约 180° 后重复第 1–2 步——W 仍是屏幕深处、A 仍是屏幕左（证明映射是相机相对，不是世界绝对轴）。
5. Esc 暂停再恢复——朝向与镜头保持，无跳变。
6. devtools 触屏仿真：左摇杆推上 = W 同向；右侧空白**右拖** = 右转；摇杆 + 扇击同按互不干扰（Round 3 换真机复验）。

### 11.5 第 7 步 · 皮肤 / VFX / 打击感评审

**皮肤（FS-02/03/05/06）**：

1. 大厅逐一选 ≥6 套皮肤，各截图一张（预览生效）。
2. 选非默认皮肤进局——本人模型生效；刷新页面——大厅记住上次选择（存档）。
3. devtools 删 `yizhang-save-v1` 或写坏 JSON——回退默认皮肤、不崩溃。
4. 1+3 开局同屏截图——Bot ≥2 种不同外观、同屏 ≥3 种 skinId。
5. 6 套截图灰度化并排——剪影/明度两两可辨（Round 2 起记分）。

**每掌 VFX（FV-02/03/04/05）**：

1. 练习局逐掌放扇击 + 技能各一次，60fps 录屏。
2. 慢放确认：任两掌特效可辨；有形状-衰减-残留；无纯色光球 / 发光描边 / Bloom 糊屏。
3. 分身技能释放后，画面上可见 ≥1 个半透明残影（FV-03 实机面）。
4. Round 3 盲测：隐藏 HUD 掌名（devtools 或临时参数），评审按特效猜掌 id 记录，**≥6/8** 过（FV-05）；同场跑 §7 四维评分卡。

**打击感（FJ-01…05）**：

1. 慢放数 hit-stop：本人命中/被命中画面停顿 **≤120ms**（60fps 录屏 ≤7 帧）；旁观他人互扇无定格；连段无幻灯片化。
2. 命中**接触点**可见扬尘爆，非全屏效果。
3. 命中瞬间相机短促冲击，≤0.5s 回稳；连段不叠加成持续抖动。
4. 被扇的 Bot 有可见僵直姿态（短暂不还手）；自己被扇同样（不阻击退位移）。
5. 全程无满屏红晕/红闪；受击反馈是去饱和帧（FR-01 红线）。

### 11.6 证据包

- 11.1–11.3 全部命令原始输出（含退出码）与 probe JSON 原文。
- 方向脚本完整录屏 ≥60s（11.4 六步齐）。
- 皮肤截图 ≥8 张（6 套预览 + 进局生效 + Bot 同屏）+ 灰度并排图（R2 起）。
- 8 掌 VFX 慢放录屏 + 分身残影可见的截图。
- 打击感慢放录屏（hit-stop 计帧截图）。
- Round 3 另加：真机型号 + 触屏方向录屏 + 性能采样（§8 协议）。

### 11.7 判定模板（手感轮）

```markdown
# 异掌手感轮 Round <N> 验收判定
- 被验分支/commit：
- 验收人/日期：
- 结论：PASS | PASS-WITH-WARNINGS | REJECT

| 组 | 通过/总数 | FAIL 项（ID + 一句话现象） |
|---|---|---|
| FG 回归门 | x/6 | |
| FD 方向 | x/8 | |
| FS 皮肤 | x/6 | |
| FV 每掌 VFX | x/5 | |
| FJ 打击感 | x/5 | |
| FT 测试锁 | x/8 | |
| FR/R 否决 | 命中列表 | |

- WARNING 清单：
- 修复指派（按 .agent_workspace/yizhang-feel/OWNERSHIP.md）：
- 证据包链接：
```

**修复指派对照（手感轮 OWNERSHIP）**：sim 侧 skinId/ghosts 进 getView → Opus-1；渲染朝向消费 / 皮肤 mesh / 每掌 VFX / 残影绘制 / 相机冲击 → Opus-2；combat 事件带掌 id / 僵直下发 / Bot persona.skinId → Opus-3；输入反转修复 / 大厅皮肤 UI / hit-stop 加强 / 存档 skinId → Opus-4；SKINS 表与每掌 vfx 参数 → Fable-3；选择器与特效视觉规范 → Fable-2；朝向/皮肤/VFX 契约冻结 → Fable-1；tests → GPT-sol-1；scripts/探针 → GPT-sol-2。

### 11.8 Round 1 开工基线（Fable-4 实测 @ `be97cee`，2026-08-27，全套命令实跑）

- `npm test`：**197/197**（17 文件），退出码 0。
- `npm run probe`：`{"status":"pass","steps":3600,"players":4,"kills":2,"movedPlayers":4,"p99StepMs":0.099,"ai":"think","botThinkCalls":10800,"botSlapAttempts":3818,"wiredCombat":true}`。
- `npm run build`：退出码 0（主 chunk >500kB 警告属既知，含 three）。
- 静态面：`RENDER_YAW_OFFSET = Math.PI` 在场（**FD-01 当前红，即用户所报反转**）；`src/data/skins.js` 不存在；`getView` 无 `skinId`/`ghosts` 字段；`rg googleapis src index.html` 零命中；`vite.config.js` `base:"./"` + 4181 双端口在位。
- 打击感底子：`src/core/juice.js` hit-stop 在场（max 90ms、本人限定、冷却 0.14s，`juice.test.js` 有测）；`renderer.js` 事件→`cameraRig.impulse` 已接线；`src/sim/physics.js` 认 `stun` 状态但 combat 从不下发（僵直缺失）；受击反馈为去饱和帧、无红晕。
- 差距标注与 Round 2/3 洞：见 SOTA_CHECKLIST §10.7 / §10.8。

---

## 12. 安全区大厅轮（Hub Round 1–3）验收规程

指标 ID 与阈值以 SOTA_CHECKLIST **§11** 为唯一事实源（HG 回归门 / HB 大厅流程 / HV 渲染视觉 / HT 测试锁 / HR 红线）。
验收对象：`games/yizhang/**` 合入 **`cursor/yizhang-hub-db8d`** 的状态（或待合子分支）。每轮 7 步顺序执行；任何一步 FAIL 即出 REJECT 报告，后续步骤照跑用于收集修复清单。**HG 回归门任何一项红 → 直接 REJECT，不再往下记分。**
**判读口径**：契约-实现漂移收口（SOTA §11.6 洞 4）前，一律按实现名判读（`phase/skipHub`、`portalNear`、`hubLocked`、`enterArena/enterHub`、圆形 `portal.radius`）。

### 12.1 第 1 步 · 拉取安装与隔离（HG-04）

```sh
git fetch origin cursor/yizhang-hub-db8d && git checkout <被验分支>
cd games/yizhang && npm ci
git diff --name-only origin/main...HEAD | grep -v '^games/yizhang/' | grep -v '^\.agent_workspace/'
```

最后一条只允许剩共享只读文件的已声明改动；出现其他 `games/*`、`pages/`、workflow → FR-03/HG-04 即时否决。

### 12.2 第 2 步 · 静态检查（HG-05/06、HB-01、HV 在场性、HR 静态面）

```sh
rg -n "skipHub|phase" src/main.js                    # HB-01/HR-01：产品路径 startMatch 不带 skipHub、phase 交 sim 缺省
rg -i "hub|pedestal|portal" src/render               # HV 组在场性：零命中 = O2 未合入，HV-01…05 全组记 FAIL/延后
ls src/data/hub.js src/data/hub.test.js              # HB-02/HT-02：布局表与硬约束测试在场
rg -n "RENDER_YAW_OFFSET" src/core/view.js           # HG-06①：必须为 0（手感轮 FD-01 防回潮）
rg -n "googleapis|gstatic" src dist index.html       # HG-05：零命中
rg -n "cameraYawToSimYaw" src                        # FR-02 沿用：唯一换算点，无第四套约定
rg -n "\-120|interactRadius" src/render src/ui       # HR-04：渲染/UI 疑似第二份坐标（命中需人工判读是否读 view.hub）
rg -in "loading|progress" src/ui src/render          # HR-03：无加载条过渡（命中人工判读）
```

### 12.3 第 3–5 步 · 测试 / 探针 / 构建（HG-01/02/03、HT 表）

```sh
npm test        # HG-01：退出码 0，通过数 ≥306
npm run probe   # HG-02：退出码 0 + hubJourney 全链 + arenaKills≥1 + wiredCombat:true + ai:"think"
npm run build   # HG-03：退出码 0
```

- HT 在场速查：`ls tests/hub-flow.test.js src/data/hub.test.js src/core/hub-flow.test.js` + `rg -ln "安全区" src/ai src/input tests`；抽读断言内容防空壳（§4 规则 4；FR-05）。
- **probe 判读（开工已知红）**：输出 `probe must start in hub phase; got arena` = harness/probe 对齐漂移（`harness.mjs createFourPlayerMatch` 缺省 `phase:'arena'`，probe 的 hub 剧本未传覆盖，SOTA §11.6 洞 3），**不是 sim 回退**——先以 `src/sim/sim.test.js`「默认 phase=hub」确认 sim 缺省未动，再催修（GPT-sol-2，一行）。修复合入后按字面判读：再红即门红。
- probe 复跑规则：任何动 phase 缺省 / 传送 / Bot 守卫 / 解锁缺省 / harness 的 PR 合入后必须复跑本步。

### 12.4 第 6 步 · 大厅手动脚本（键鼠 + 触控仿真，全程录屏）

`npm run dev`（4181 端口），开始一局后按序执行：

1. **开局位置**：出生在走道一端、相机在角色身后、正对走道纵深与远端门；**不在裂岛中央**、身边无 Bot（HB-01/10、HR-01）。
2. **方向回归**：走道里 W=屏幕深处、S=向相机、A/D=屏幕左右、鼠标右移右转（HG-06①；完整六步沿用 §11.4 手感轮方向脚本）。
3. **未就绪门**：不选掌直走到门口——不传送，出「先挑一只主掌」类提示（HB-07）。
4. **逐座看掌**：沿走道走过 8 座，逐座靠近出说明牌（名称/职能/一句话/解锁态），离开即收；任意站位至多一块说明牌（HB-03；O2 合入后同验 HV-02/03/04：台座/掌指朝上/idle 特效可辨）。
5. **装备主副**：E 装主掌（toast + 配装条更新 + 门提示转「已就绪」）；另一座 E 装副掌；回到副掌座再按 E 提为主掌（HB-05）。
6. **未解锁拒绝**：靠近未解锁座按 E——配装不变、说明牌/toast 报解锁条件（HB-06）。
7. **穿门**：走进门圈——短淡场（无加载条）、落裂岛台上带无敌帧、Bot 开打、HUD 换战斗脸、配装为走道所选（HB-08/10、HV-05）。
8. **存档链**：结束或中退后回大厅/刷新页面——「直接进裂岛」与「再来一局」吃走道所选配装（HB-12）。
9. **回归项**：裂岛内非默认皮肤可辨、扇击/技能 VFX 按掌分派、hit-stop 无回退（HG-06②③④）。
10. **触控仿真**（devtools；Round 3 换真机）：摇杆走到台座前、「选」钮装备（确认键章显示「选」）、槽位可指定主/副、走进门圈传送；触控钮尺寸复测 L1-07 阈值；摇杆+「选」同按不互斥（HB-11）。

### 12.5 第 7 步 · 视觉评审（HV 组 + R 表）

- **O2 未合入时**：HV-01…05 记 FAIL/延后并在判定表明示，不做「无画面当过」处理；证据以「HUD 全链 + 盲走」录屏替代并注明。
- **O2 合入后**：截图 ≥8——走道全景、台座特写 ×2、展掌指朝上特写、门未就绪/已就绪对比、门内过渡帧、说明牌、配装条。R 表重点：R-05 纯色光球（idle VFX）、R-02 描边（聚焦高亮）、R-09 饱和纪律（识别色只给聚焦掌）、R-08 磨损（台座）、R-07 主光方向。
- **Round 3 盲辨（HV-04）**：遮 HUD 掌名逐座看 idle 特效认掌，**≥6/8** 过；同场复跑手感轮 §7 评分卡防打击感回退。

### 12.6 证据包

- 12.1–12.3 全部命令原始输出（含退出码）与 probe JSON 原文（`hubJourney` 段完整）。
- 大厅手动脚本完整录屏 ≥90s（12.4 十步齐；穿门帧慢放）。
- 截图按 12.5 清单；O2 未合入轮次按替代口径并注明。
- 回归段：方向/皮肤/VFX 各一段短录屏，或引用手感轮证据包增量。

### 12.7 判定模板（大厅轮）

```markdown
# 异掌大厅轮 Round <N> 验收判定
- 被验分支/commit：
- 验收人/日期：
- 结论：PASS | PASS-WITH-WARNINGS | REJECT

| 组 | 通过/总数 | FAIL 项（ID + 一句话现象） |
|---|---|---|
| HG 回归门 | x/6 | |
| HB 大厅流程 | x/12 | |
| HV 渲染视觉 | x/6 | |
| HT 测试锁 | x/8 | |
| HR/FR/R 否决 | 命中列表 | |

- WARNING 清单：
- 修复指派（按 .agent_workspace/yizhang-hub/OWNERSHIP.md）：
- 证据包链接：
```

**修复指派对照（大厅轮 OWNERSHIP）**：双区状态机/靠近/装备/传送/免战 → Opus-1；安全区场景/走道/台座/展掌 idle VFX/传送门渲染 → Opus-2；Bot 静默/combat 安全区拒绝 → Opus-3；开局进 hub/说明牌与门提示 HUD/触控「选」/存档写回/过渡 → Opus-4；HUB 布局表 → Fable-3；台座/门/说明牌视觉规范与 `src/styles` → Fable-2；契约与 ADR-29…32 → Fable-1；tests → GPT-sol-1；scripts/探针 → GPT-sol-2。

### 12.8 Round 1 开工基线（Fable-4 实测 @ `1b4371f`，2026-08-27，全套命令实跑）

- `npm test`：**306/306**（23 文件），退出码 0（手感轮基线 197 → 大厅十席合入后 306，零红）。
- `npm run probe`：**FAIL，退出码 1** —— `probe must start in hub phase; got arena`。根因：`scripts/harness.mjs createFourPlayerMatch` 缺省 `phase:'arena'`（护旧探针/feel-probe），`scripts/probe.mjs` 的 hub 剧本调用只传了 `gloveId:null / offhandId:null / unlocked:['cotton']` 未传 `phase:'hub'`，而探针自身 `createHubJourney` 硬断言 hub 起步。一行修复归 GPT-sol-2（SOTA §11.6 洞 3）。剧本本身完备：hub 起步校验 → 聚焦 → 装掌 → 穿门计步（1200 步超时）→ `arenaKills ≥ 1` 硬门 + `wiredCombat` 硬断言。
- `npm run build`：退出码 0（主 chunk >500kB 警告既知，含 three）。
- 渲染/视觉侧：`rg -i "hub|pedestal|portal" src/render` **零命中**（O2 未合入——hub 阶段画面无走道/台座/展掌/门，HV 组全红起步）；`src/styles/**` 无大厅样式、`docs/ART_DIRECTION.md` 无大厅章节（F2 未合入）；`.yz-inspect` 等类名由 O4 `src/ui/hub.css` 顶班。
- 流程侧全链在且有测：sim（缺省 `phase='hub'`、免战、传送、`enterHub` 回程）、data（布局表 + 10 测）、ai/combat（双守卫）、input（interact/「选」）、core+ui（视图模型/说明牌/门三段语气/`.yz-warp` 淡场）、main（开局进 hub、存档写回、2D 板降级为暂停备选）。
- 契约-实现漂移七处已登记（SOTA §11.6 洞 4），收口前按实现名判读。
- 静态面：`RENDER_YAW_OFFSET = 0` 在位（手感轮修复未回潮）；`rg googleapis src index.html` 零命中；`vite.config.js` `base:"./"` + 4181 双端口在位。
- 差距标注与 Round 2/3 洞：见 SOTA_CHECKLIST §11.5 / §11.6。
- **编排层补记**：O2 已于 `86e619f` 合入父分支（走道/八座展掌/idle VFX/传送门两态）；本基线里「渲染零命中 / HV 全红起步」仅描述 `@ 1b4371f` 当时状态，复验按合入后代码。F2 仍未合入；probe 对齐漂移（洞 3）仍待 GPT-sol-2。

### 12.9 异掌大厅轮 Round 2 验收判定（F4 复验席 · 收口前复验）

- 被验分支/commit：`cursor/yizhang-hub-db8d` @ `06b92b8`（九席合入后）；验收工作分支 `cursor/yizhang-hub-r2-f4-sota-db8d`（只动 `docs/SOTA_CHECKLIST.md` 与本文件）。
- 验收人/日期：Fable-4 复验席 / 2026-08-27（全套命令实跑：`npm ci` → 静态检查 → `npm test` → `npm run probe` → `npm run build` → headless 冒烟截图）。
- 结论：**PASS-WITH-WARNINGS**

| 组 | 通过/总数 | FAIL 项（ID + 一句话现象） |
|---|---|---|
| HG 回归门 | 6/6 | 无 |
| HB 大厅流程 | 12/12 | 无（自动化断言全绿 + 冒烟旁证；§12.4 交互十步未做，见「验证方式限定」） |
| HV 渲染视觉 | 6/6 | 无（headless 冒烟截图 + `hub.test.js`/`hub-css.test.js`；HV-04 盲辨预跑仅确认 2/8 座，Round 3 记分） |
| HT 测试锁 | 8/8 | 无（HT-06 probe 全链已由开工红转绿；HT-08 渲染冒烟由 `src/render/hub.test.js` 落地） |
| HR/FR/R 否决 | 零命中 | 无 |

**验证方式限定（诚实口径）**：本轮无交互桌面环境——§12.4 键鼠十步、devtools 触控仿真、`.yz-warp` 淡场实机帧**未做**；以 500 条单测 + probe hubJourney 全链 + headless Chrome（SwiftShader）冒烟截图（走道全景/台座与展掌特写/门封与门通两态/pitch 俯视/皮肤参数生效/arena 三皮肤同框与碎地岩屑帧）替代并如实标注。交互面走查并入 Round 3 真机段。

**命令实测原文摘要**：

- `npm test`：**Test Files 37 passed (37) / Tests 500 passed (500)**，退出码 0。
- `npm run probe`：退出码 0，JSON 原文——`{"status":"pass","steps":3600,"players":4,"dt":0.016666666666666666,"simulatedSeconds":60,"phase":"arena","kills":1,"arenaKills":1,"movedPlayers":4,"maxMovement":124.84,"entityUpdateSteps":3600,"p99StepMs":0.1087,"maxStepMs":1.437,"ai":"think","botThinkCalls":10800,"botSlapAttempts":3779,"usingRealCombat":true,"wiredCombat":true,"hubJourney":{"targetGloveId":"cotton","focusObserved":true,"equippedMainGloveId":"cotton","equippedAtStep":51,"enteredArenaAtStep":227,"killsAtArenaEntry":0},"purityFilesScanned":35}`。
- `npm run build`：退出码 0；主 chunk 663.28kB / gzip 183.10kB（>500kB 警告既知，含 three）。
- 静态面：`rg googleapis|gstatic src dist index.html` 零命中；`git diff --name-only origin/main...HEAD` 过滤后零残留（改动只落 `games/yizhang/**` 与 `.agent_workspace/{PROGRESS.md,yizhang-feel,yizhang-hub}`）；`RENDER_YAW_OFFSET = 0`；`vite.config.js` `base:"./"` + 4181 双端口在位。
- 冒烟 HUD 实读（draw calls/tris）：high 档 hub draw 301–307 / tris ≈238k；**mid 档 hub draw 305 / tris 138k、arena draw 352 / tris 95k**（洞 7 读数，超 L3-10 预算记 WARNING）。

- WARNING 清单：W1 渲染预算超标（mid 档 draw/tris 超 L3-10，归 O2，Round 3 收敛）；W2 `HIT_STOP.max=0.12` 顶界零余量（FJ-01 哨兵）；W3 `scripts/probe.mjs`/`feel-probe.mjs` 硬编码 `MODEL_SLUG` 横幅（G2 残留噪音，顺手清）；W4 probe 单 seed 结转；W5 bloom low 档不可关结转。明细见 SOTA_CHECKLIST §11.8。
- 洞 1–10 销号：1/2/3/4/5/6/10 关，7 已测记警告（W1），8 延后真机，9 记现状（皮肤=主菜单选皮肤板 + 暂停 2D 配掌板备选；走道=选掌主路径）。
- 修复指派（均不否决本轮）：W1 → Opus-2（O2）；W3 → GPT-sol-2（G2）；W4 → GPT-sol-2；W5 → Opus-2/Fable-2。
- 证据包：命令原文（上列）+ 冒烟截图 8 张（走道 tour ×3、门封/门通对比、pitch 0.59 俯视、皮肤 wildhorn 生效、arena 三皮肤同框、VFX+碎地帧）随本轮验收 PR 描述提交；截图存验收工作台，不入 `games/yizhang/src`。

### 12.10 异掌大厅轮 Round 3 验收判定（F4 签字席）

- 被验分支/commit：`cursor/yizhang-hub-db8d` @ `3f179a9`（Round 3 Wave 1–3 九席合入后）；验收工作分支 `cursor/yizhang-hub-r3-f4-sota-db8d`（只动 `docs/SOTA_CHECKLIST.md` 与本文件）。
- 验收人/日期：Fable-4 签字席 / 2026-08-27（全套命令实跑：静态检查 → `npm test` → `npm run probe` → `npm run build` → `npm run bench` → headless CDP 预算逐帧实测 → HV-04 盲辨预跑截图 40 张）。
- 结论：**PASS-WITH-WARNINGS**（WARNING 全部为环境性延后——真机/交互桌面——与既有哨兵，无实现缺口；指标明细与 W1–W5 销号见 SOTA_CHECKLIST §11.9）。

| 组 | 通过/总数 | FAIL 项（ID + 一句话现象） |
|---|---|---|
| HG 回归门 | 6/6 | 无（HG-01 557≥306 零减量；HG-02 三 seed 全链；HG-06 四点抽验绿） |
| HB 大厅流程 | 12/12 | 无（自动化断言全绿；§12.4 交互十步无桌面环境未做，headless 冒烟旁证，归真机段） |
| HV 渲染视觉 | 6/6 | 无（HV-04 盲辨为**预跑口径**：静帧 6/8 即辨 + 2 座跟随相机存在性复核，正式交互盲辨延后真机——不按 FAIL 记，因底线形无一归零、预算与可辨在同一 mid 构建互锁验讫） |
| HT 测试锁 | 8/8 | 无（另有 G1 `round3-hub-sota` 8 条 Round 3 锁表在场） |
| HR/FR/R 否决 | 零命中 | 无（含 Round 3 红线：横幅、`createMatch` 缺省、`RENDER_YAW_OFFSET`、加载条、减测——逐条扫描零命中） |

**命令实测原文摘要**：

- `npm test`：**Test Files 40 passed (40) / Tests 557 passed (557)**，退出码 0。
- `npm run probe`：退出码 0，`{"status":"pass","seedCount":3,…,"wiredCombat":true}`；三 seed 逐条——`0x1a2b3c4d`：kills 1、p99 0.117、botSlapAttempts 2191；`0x5eed1234`：kills 2、p99 0.102、botSlapAttempts 3425；`0xc0ffee42`：kills 2、p99 0.111、botSlapAttempts 3636；三条 hubJourney 均 `focusObserved:true / equippedAtStep:51 / enteredArenaAtStep:227 / killsAtArenaEntry:0`；横幅 `MODEL_SLUG: yizhang-probe`。
- `npm run build`：退出码 0；主 chunk 677.60kB / gzip 187.18kB（>500kB 警告既知），JS gzip 合计 ≈255kB。
- `npm run bench`：`{"stepsPerSec":96096,…,"wiredCombat":true}`。
- 静态面：`rg googleapis|gstatic src dist index.html` 零命中；`rg -in "loading|progress" src/ui src/render` 零命中；`RENDER_YAW_OFFSET = 0`；`resolvePhase` 缺省 `hub`；隔离 diff 过滤后零残留。

**L3-10 预算实测（W1 复核，自测非抄数）**：headless Chrome 148（SwiftShader）+ CDP 驱动 `smoke.html?quality=mid&manual=1`（1280×720 / dpr 1 / seed 7），逐帧 `step(1/60)` 读 `getStats()`：**走查 1500 帧——hub 峰值 94 draw / 47,761 tris，arena 峰值 111 draw / 68,597 tris**；**纯 arena 900 帧（`crumble=1.2` 碎地压力）——峰值 113 draw / 69,905 tris**。全部 ≤120 / ≤80k（L3-10 mid 档），与 O2 报数一致。互斥前提代码审：`renderer.js` `island.setActive(!inHub)` ×2（ADR-36）+ `hub.test.js` hub 子树 draw ≤52 锁测。

**验证方式限定（诚实口径）**：本轮仍无交互桌面与真机——§12.4 键鼠十步、devtools 触控仿真、HV-04 完整交互盲辨（动帧乱序报名）、M-01…07 真机矩阵**未做**；以 557 单测 + 三 seed probe 全链 + headless 逐帧预算实测 + 40 张盲辨预跑截图（静帧 6/8 即辨、cotton/meteor 粒子在场且动向合 ART §17.1）替代并如实标注。真机段是本轮唯一遗留。

- WARNING 清单：真机段延后（洞 8 / §12.4 十步 / HV-04 正式记分 / M 表）；W2 hit-stop 零余量哨兵结转；L3-10 GC 子句以 sim 侧读数代证（probe maxStepMs≈1.4ms、p99 0.117ms）。W1/W3/W4/W5 均已销（明细 SOTA §11.9）。
- 洞 1–10 销号：1/2/3/4/5/6/7/9/10 **关**（洞 7 由「已测记警告」转关，实测入预算）；洞 8 **延后真机**。
- 修复指派：无实现缺口待派；真机段到位后由 F4 复跑 §12.4/§12.5 补验即可销全部 WARNING。
- 证据包：命令原文（上列）+ 预算逐帧 JSON 两份（走查 1500 帧 / 纯 arena 900 帧）+ 盲辨预跑截图 40 张（8 座 ×3 连拍 + cotton/meteor 近距与跟随相机复核 ×16）随本轮验收 PR 描述提交；截图存验收工作台，不入 `games/yizhang/src`。

---

## 13. 固定人物视角轮（Look Round 1–4）验收规程

指标 ID 与阈值以 SOTA_CHECKLIST **§12** 为唯一事实源（LG 回归门 / LK 视角行为 / LT 测试锁 / LR 红线）。
验收对象：Round 1–3 为 `games/yizhang/**` 合入 **`cursor/yizhang-look-db8d`** 的状态（或待合子分支）；**Round 4（打磨轮）为合入 `cursor/yizhang-polish-db8d` 的状态**（自 main `18ed78e` 拉出，打向 main）。每轮 6 步顺序执行；任何一步 FAIL 即出 REJECT 报告，后续步骤照跑用于收集修复清单。**LG 回归门任何一项红 → 直接 REJECT，不再往下记分。**
**判读口径**：全项目只有两套角空间（契约 §1-11）——相机系 θ（input 内部）与 sim 系（yaw=0 → -Z，sim/render/camera 共用）；凡写进 `renderer.lookYaw` / `Input.yaw` / `p.yaw` 的水平角必须已是 sim 空间。

### 13.1 第 1 步 · 拉取安装与隔离（LG-04）

```sh
git fetch origin cursor/yizhang-look-db8d && git checkout <被验分支>
cd games/yizhang && npm ci
git diff --name-only origin/main...HEAD | grep -v '^games/yizhang/' | grep -v '^\.agent_workspace/'
```

最后一条只允许剩共享只读文件的已声明改动；出现其他 `games/*`、`pages/`、workflow → FR-03/LG-04 即时否决。

### 13.2 第 2 步 · 静态检查（LG-05、LR-01…03 静态面）

```sh
rg -n "RENDER_YAW_OFFSET" src/core/view.js        # LR-01：恒 0，禁止回 Math.PI
rg -ln "cameraYawToSimYaw|simYawToCameraYaw" src  # 换算实现只在 core/view.js，其余只 import
rg -n "yawFromDir" src/input src/main.js src/core # LK-04 产出分派在场性（Round 1 零命中=缺口；Round 2 起 src/input 必须命中）
rg -n "yz-look" src/ui src/main.js src/core       # LK-09 DOM 在场性（Round 1 零命中=缺口；Round 2 起 ui/hud.js 与 main.js 必须命中，CSS 在 styles/hud.css）
rg -n "googleapis|gstatic" src dist index.html    # LG-05：零命中
git diff <基线>..HEAD --stat -- src/ai docs/GDD.md # O3/F3 席合入判读（零 diff = 未合，相关条目按 DEFER 记）
```

### 13.3 第 3–5 步 · 测试 / 探针 / 构建（LG-01/02/03、LT 表）

```sh
npm test        # LG-01：退出码 0，通过数 ≥557
npm run probe   # LG-02：3/3 seed pass + lookProbe 三读数（snap ≤20m、pre-snap >20m、locked dot ≥0.999）
npm run build   # LG-03：退出码 0
```

- LT 在场速查：`ls src/core/look.test.js src/render/look.test.js src/sim/look-yaw.test.js tests/look-round1-invariants.test.js`；抽读断言内容防空壳（§4 规则 4；LR-04）。
- **防假达标复核（判决性断言核对）**：LT-01/02 必须包含「取 θ 使相机系角 ≠ sim 角」的反证（如 θ=0 ⇒ simYaw=−π/2、θ=π/4 ⇒ 机位翻正脸）；probe 的 snap 断言必须以 `arenaEntryPreSnapDistance > 20` 为前提——路线没压过远跳，「snap 后 ≤20m」是空话。
- probe 复跑规则：任何动 look 链（feedLook/setLook/camera/snap）、phase 传送、出生朝向的 PR 合入后必须复跑本步。

### 13.4 第 6 步 · 视角手动脚本（实机，全程录屏；Round 1 无桌面环境可延后但必须如实标注）

`npm run dev`（4181 端口），开始一局后按序执行：

1. **开局背后**：出生在走道，镜头已在角色背后正对纵深——无首帧从裂岛方向飞来的镜头漂移（LK-01）。
2. **方向回归**：W=屏幕深处、S=向相机、A/D=屏幕左右、鼠标右移右转（沿用 §11.4 手感轮方向脚本六步；LG-05 朝向常量防回潮的实机面）。
3. **locked 面向锁**：缺省 locked 下原地转镜头 360°——人物面向随镜头 1:1 同转、镜头始终在背后、绕不到正脸（LK-03）。
4. **横扇读向**：对着镜头前方目标出掌——掌从屏幕左横抽到右、命中就在准星指向（LK-05/06）；故意把目标留在正后方出掌——空挥。
5. **V 切换**：按 V——出现模式提示（Round 1 为 toast 顶班；`.yz-look-flash` DOM 落地后按 CSS 类复验），free 下鼠标可独立看、人物面向跟走向（LK-04 收口后）；再按 V 切回，机位无跳切（切换不动 yaw/pitch）。
6. **过门吸附**：选掌穿门——短淡场后机位已架在裂岛出生点身后，无 ~120m 弹簧飞跃帧；结算回安全区同验（LK-02）。
7. **存档链**：切到 free 后刷新页面——大厅记住 free；URL `?look=locked` 强制覆盖但不回写存档（LK-08）。
8. **触控仿真**（Round 3 换真机）：右侧拖动转视角在 locked 下同样转人物；触控切换入口（若有）同验。

### 13.5 判定模板（视角轮）

```markdown
# 异掌视角轮 Round <N> 验收判定
- 被验分支/commit：
- 验收人/日期：
- 结论：PASS | PASS-WITH-WARNINGS | REJECT

| 组 | 通过/总数 | FAIL 项（ID + 一句话现象） |
|---|---|---|
| LG 回归门 | x/6 | |
| LK 视角行为 | x/9 | |
| LT 测试锁 | x/8 | |
| LR/HR/FR/R 否决 | 命中列表 | |

- 六条用户验收线：开局背后 / 过门不飞跃 / locked 面向=视线 / free 可解耦 / 横扇读向 / 打人朝向一致 —— 逐条 PASS/FAIL/DEFER
- WARNING 清单：
- 修复指派（按 .agent_workspace/yizhang-look/OWNERSHIP.md）：
- 证据包链接：
```

**修复指派对照（视角轮 OWNERSHIP）**：sim 朝向直赋/出生朝向 → Opus-1；setLook/snap/机位 → Opus-2；Bot 与观战 → Opus-3；feedLook/V 键/URL/存档/HUD DOM/free 产出分派 → Opus-4；lookMode 契约与 ADR → Fable-1；锁视角 HUD 视觉 → Fable-2；GDD 视角章 → Fable-3；tests → GPT-sol-1；scripts/探针 → GPT-sol-2。

### 13.6 异掌视角轮 Round 1 验收判定（F4 验收席）

- 被验分支/commit：`cursor/yizhang-look-db8d` @ `4ca6ac9`（W1–W3 已合席位：F1 契约 v4.3 / F2 锁视角样式 / O1 sim 直赋与出生朝向 / O2 setLook+snap / O4 feedLook+V 键通道 / G1 单测 / G2 探针；未合：O4 HUD DOM 与 free 产出、F3 GDD、O3 席）；基线 `7340300`（大厅轮收口态，557 测）。
- 验收人/日期：Fable-4 验收席 / 2026-08-27（全套命令实跑：`npm ci` → 静态检查 → `npm test` → `npm run probe` → `npm run build`）。工作分支 `cursor/yizhang-look-f4-db8d`（只动 `docs/SOTA_CHECKLIST.md` 与本文件）。
- 结论：**PASS-WITH-WARNINGS**（唯一 FAIL 为 LK-04 free 产出半边，属 §12.0 Round 1 门槛明示的允许延后项；未合席位全部按 DEFER 如实登记，无一装绿；红线零命中）。

| 组 | 通过/总数 | FAIL 项（ID + 一句话现象） |
|---|---|---|
| LG 回归门 | 6/6 | 无 |
| LK 视角行为 | 7/9 | **LK-04 FAIL**：`sample()` 不分模式恒送 `cameraYawToSimYaw(θ)`，free 无 `yawFromDir`/null 分派，行为等同 locked（sim/render 两半有测且绿）；**LK-09 DEFER**：`.yz-look-flash` CSS 已合、DOM 零消费，toast 顶班 |
| LT 测试锁 | 6/8 | LT-07（free 产出分派）、LT-08（look-flash DOM）缺席——连锁 LK-04/09，Round 2 生效项 |
| LR/HR/FR/R 否决 | 零命中 | 无 |

**六条用户验收线**：开局背后 **PASS** / 过门不飞跃 **PASS** / locked 面向=视线 **PASS** / free 可解耦 **FAIL（DEFER→O4，Round 2 收口）** / 横扇读向 **PASS** / 打人朝向一致 **PASS**。

**命令实测原文摘要**：

- `npm test`：**Test Files 44 passed (44) / Tests 631 passed (631)**，退出码 0（基线 557/40 → 631/44，零减量；视角新测 90 条：`core/look.test.js` 21、`render/look.test.js` 15、`sim/look-yaw.test.js` 19、`tests/look-round1-invariants.test.js` 5、`input/index.test.js` 30 含 lookMode 组）。
- `npm run probe`：退出码 0，`{"status":"pass","seedCount":3,…,"cameraSnapMaxDist":7.1,"lockedForwardMinDot":1,"lockedForwardMaxAngleDeg":0,"wiredCombat":true}`；三 seed 逐条——`0x1a2b3c4d`：kills 1、p99 0.125；`0x5eed1234`：kills 2、p99 0.110；`0xc0ffee42`：kills 2、p99 0.103；三条均 `openingCameraDistance:7.1`、`arenaEntryPreSnapDistance:127.0–127.2`（真实压过远跳）、`arenaEntryCameraDistance:7.1`、`snappedFrames:2`、`lockedTargets:3601`、hubJourney `equippedAtStep:51 / enteredArenaAtStep:227`。
- `npm run build`：退出码 0；主 chunk 680.55kB / gzip 188.19kB（>500kB 警告既知，含 three）。
- 静态面：`RENDER_YAW_OFFSET = 0`（`core/view.js`）；换算实现唯一（`cameraYawToSimYaw/simYawToCameraYaw` 只实现在 `core/view.js`，其余 10 文件均 import）；`rg googleapis|gstatic src dist index.html` 零命中；`rg yawFromDir src/input src/main.js src/core` 零命中（LK-04 缺口实锤）；`rg "yz-look" src/ui src/main.js src/core` 零命中（LK-09 缺口实锤）；`git diff --stat 基线..HEAD -- src/ai docs/GDD.md` 零 diff（O3/F3 未合实锤）；隔离 diff 过滤后零残留。

**验证方式限定（诚实口径）**：本轮无交互桌面环境——§13.4 实机八步（转视角手感、V 切换目视、过门淡场帧、触屏）**未做**；以 90 条视角单测 + 三 seed lookProbe 逐帧断言（3601 帧 locked dot=1.0、开局/过门双 snap 点、127m 远跳前提）替代并如实标注。实机段归 Round 2/3。

- WARNING 清单：实机段延后（§13.4 八步）；free≡locked 用户可感差（V 能切、有提示、落存档，但 free 行为无差——建议设置面板标注或随 O4 收口一并交付）；W2 hit-stop 零余量哨兵结转（§11.9）。
- 修复指派：LK-04 free 产出分派 + LK-09 `.yz-look-flash` DOM → Opus-4（连带 LT-07/08 → GPT-sol-1）；GDD 视角章（默认 lookMode/键位文案/机位 tuning）→ Fable-3；Bot lookMode 不变性显式锁测 + 观战 orbit 复验 → Opus-3；用户「打不中」专项合入后复跑 LK-05/06 防回退 → F4 复验。
- 证据包：命令原文（上列）+ probe JSON 三 seed 全文随本轮验收 PR 描述提交；无截图（无桌面环境，如实标注）。

### 13.7 异掌视角轮 Round 2 验收判定（F4 SOTA 验收席）

- 被验分支/commit：`cursor/yizhang-look-db8d` @ `c97723d`（Round 2 已合席位：O4 `sample()` 分派 `5a09b67` + HUD DOM `cf1333d` / G1 LK-04 锁测 `ea8cdc3` / G2 locked-free 探针 `a088c7e` / F1 契约 v4.4 `f95b1cc` / F2 free 侧视线合同 `bd235f8` / F3 GDD §15.1 对账 `e726330` / O1 free 集成测 `ac4e11e` / O3 护栏 `06a7cba` + Bot yaw 有限闸 `c97723d` / 打人朝向专项 `5f09ccc`；未合：O2 机位复核）；Round 1 判定点 `4ca6ac9`。
- 验收人/日期：Fable-4 SOTA 验收席 / 2026-08-27（全套命令实跑：静态检查 → `npm test` → `npm run probe` → `npm run build`）。工作分支 `cursor/yizhang-look-r2-f4-db8d`（只动 `docs/SOTA_CHECKLIST.md` 与本文件，不改 src）。
- 结论：**PASS-WITH-WARNINGS**（Round 1 唯一 FAIL 项 LK-04 经 O4 落地重判 **PASS**；R1 过时 DEFER——HUD DOM / O3 / F3 / 打人专项——全部改勾收口；WARNING 仅余环境性延后（实机段）与在飞席位登记（O2 机位复核 DEFER），无实现缺口、无红线命中）。

| 组 | 通过/总数 | FAIL 项（ID + 一句话现象） |
|---|---|---|
| LG 回归门 | 6/6 | 无（LG-01 717≥631 零减量；LG-02 三 seed 视角硬门 + G2 新增 free/转镜头读数全过；LG-06 大厅四点抽验在 717 内绿） |
| LK 视角行为 | 9/9 | 无（LK-04 重判 PASS 见 SOTA §12.2/§12.6；LK-09 DOM 已合改勾） |
| LT 测试锁 | 8/8 | 无（LT-07 `tests/look-round2-lk04.test.js` ×3 + input lookMode 分派组；LT-08 `ui/hud.test.js` ×9 + `ui/shell.test.js` look 组——两条 Round 2 生效项均真实断言补齐） |
| LR/HR/FR/R 否决 | 零命中 | 无 |

**六条用户验收线（Round 2 重表）**：开局背后 **PASS** / 过门不飞跃 **PASS** / locked 面向=视线 **PASS** / free 可解耦 **PASS（R1 FAIL → R2 重判）** / 横扇读向 **PASS** / 打人朝向一致 **PASS** —— 6/6，逐条证据见 SOTA §12.6 重表。

**命令实测原文摘要**：

- `npm test`：**Test Files 51 passed (51) / Tests 717 passed (717)**，退出码 0（Round 1 631/44 → 717/51，零减量；Round 2 新增/扩充：`tests/look-round2-lk04.test.js` ×3、`tests/aim-alignment.test.js` ×7、`src/combat/look-invariants.test.js` ×11、`src/ai/bot-yaw-finite.test.js` ×8、`src/ai/look-mode-blind.test.js` ×8、`src/ui/hud.test.js` ×9、`input/index.test.js` 扩至 44、`sim/look-yaw.test.js` 扩至 25）。
- `npm run probe`：退出码 0，`{"status":"pass","seedCount":3,"kills":1,"arenaKills":1,"cameraSnapMaxDist":7.1,"lockedForwardMinDot":1,"lockedForwardMaxAngleDeg":0,"lockedTurnMinAngleDeg":47.67,"lockedCameraMaxBehindness":-7.1,"freeStationaryMaxYawDeltaDeg":0,"freeMoveMaxYawErrorDeg":0.00021,"p99StepMs":0.134,"ai":"think","wiredCombat":true,…}`；三 seed 逐条——`0x1a2b3c4d`：kills 1、p99 0.134、botSlapAttempts 2191；`0x5eed1234`：kills 2、p99 0.128、botSlapAttempts 3425；`0xc0ffee42`：kills 2、p99 0.117、botSlapAttempts 3636；三条均 `openingCameraDistance:7.1`、`arenaEntryPreSnapDistance:127.0–127.2`（真实压过远跳）、`arenaEntryCameraDistance:7.1`、`snappedFrames:2`、`lockedTargets:3601`、free 段 `freeStationaryViewTurns:1 / freeMovementDirections:1`、hubJourney `equippedAtStep:51 / enteredArenaAtStep:227`；横幅 `MODEL_SLUG: yizhang-probe`。
- `npm run build`：退出码 0；主 chunk 680.55kB / gzip ≈186.4kB（>500kB 警告既知，含 three）。
- 静态面：`RENDER_YAW_OFFSET = 0`（`core/view.js:21`）；`rg googleapis|gstatic src dist index.html` 零命中；`rg yawFromDir src/input` **命中**（`sample()` 分派 + 头注封闭表，R1 缺口实销）；`rg "yz-look" src/ui src/main.js` **命中**（`ui/hud.js` 常驻节点 + `main.js` 消费，R1 缺口实销）；换算实现唯一（`cameraYawToSimYaw/simYawToCameraYaw` 只实现在 `core/view.js`；`core/view.js yawFromDir` 系契约 §1-11 登记的同空间备份）；`git diff 4ca6ac9..HEAD --stat -- src/ai docs/GDD.md` 有 diff（O3/F3 已合实锤：`bot-yaw-finite.test.js` + `look-mode-blind.test.js` + `bots.js` 收敛 + GDD §15 视角章 46 行）；`git diff 4ca6ac9..HEAD --stat -- src/render` **零 diff**（O2 机位复核未合实锤，DEFER）；隔离 diff 过滤后零残留。

**验证方式限定（诚实口径）**：本轮仍无交互桌面环境——§13.4 实机八步（转视角手感、V 切换目视、过门淡场帧、触屏 free/locked）**未做**；以 103 条视角相关锁测（LT-01…08 全在场）+ 三 seed lookProbe 逐帧断言（locked 3601 帧 dot=1.0 且真实转镜头 47.67° 后仍 1:1、free 静止/移动双段、127m 远跳前提、开局+过门双 snap 点）替代并如实标注。实机段归 Round 3。

- WARNING 清单：实机段延后（§13.4 八步 + 转向手感评分卡预跑，结转 Round 3）；O2 机位复核在飞（合入后 F4 复跑 `render/look.test.js` ×15 + probe 机位读数防回退）；W2 hit-stop 零余量哨兵结转（§11.9）。
- 修复指派：无实现缺口待派；O2 机位复核合入后由 F4 补验；Round 3 实机段（§13.4 八步 + 触屏）到位后复跑即可销首条 WARNING。
- 证据包：命令原文（上列）+ probe JSON 三 seed 全文随本轮验收 PR 描述提交；无截图（无桌面环境，如实标注）。

### 13.8 异掌视角轮 Round 3 验收判定（F4 最终验收席 · 签字轮）

- 被验分支/commit：`cursor/yizhang-look-db8d` @ `372a8dd`（F4 签字基线。Round 3 当时已合：O2 机位复核补交 `4696ee0`+`91fd888` @ merge `f202877`——R2 唯一 DEFER 销号 / F1 契约 v4.4 实现态登记 `e7eae97` / F2 ART §18.7 收口审计 `7f71689` / F3 GDD §15 硬顶登记 `a8ceb70` / O1 reach 镜像与 1e-4 边界复核 `4c322d9` / O3 水平锥与 Bot 路径锁测 `9947c05`+`255ec8f` / G2 切模式探针与跨层锁测 `a3f9e4d`+`2284321`+`74290f0`）。F4 当时登记 R3 O4 边角、另一份 R3 O2 复核在飞；**编排层收口：二者已合入父分支 `ea1c825`**（merge `58052e8` / `b3f5d03`）。Round 2 判定点 `c97723d`。
- 验收人/日期：Fable-4 最终验收席 / 2026-08-27（全套命令实跑：静态检查 → `npm test` → `npm run probe` → `npm run build` → headless Chrome CDP 冒烟截图 ×6）。工作分支 `cursor/yizhang-look-r3-f4-db8d`（只动 `docs/SOTA_CHECKLIST.md` 与本文件，不改 src）。收口工人补记：F4 未复跑合入 O2+O4 后的 775 测；merge 工人基线 775/54 @ `ea1c825`，收口再复跑确认。
- 结论：**PASS-WITH-WARNINGS**（R2 唯一 DEFER——O2 机位复核——合入并复验改勾；六条用户验收线 6/6 复验无回退；WARNING 仅余真机段延后与 W2 hit-stop 哨兵；R3 O2/O4 在飞已销号为「已合入父分支」，无实现缺口、无红线命中）。

| 组 | 通过/总数 | FAIL 项（ID + 一句话现象） |
|---|---|---|
| LG 回归门 | 6/6 | 无（LG-01 737≥717 零减量；LG-02 三 seed 视角硬门 + G2 新增切模式硬门全过；LG-05 静态面全绿含 dist 复查；LG-06 大厅四点抽验在 737 内绿） |
| LK 视角行为 | 9/9 | 无（R2 表 9/9 复验无回退；LK-01/02/03 由 O2 硬顶从阻尼行为升级为几何保证并有锁测） |
| LT 测试锁 | 8/8 | 无（LT-01…08 全在场；R3 加固 20 条：LT-02 系 15→27、LT-03 系 25→28、跨层新 ×3、O3 系 +2） |
| LR/HR/FR/R 否决 | 零命中 | 无 |

**六条用户验收线（Round 3 终表）**：开局背后 **PASS** / 过门不飞跃 **PASS** / locked 面向=视线 **PASS** / free 可解耦 **PASS** / 横扇读向 **PASS** / 打人朝向一致 **PASS** —— 6/6，逐条证据见 SOTA §12.7 终表。

**命令实测原文摘要**：

- `npm test`：**Test Files 52 passed (52) / Tests 737 passed (737)**，退出码 0（F4 签字基线 @ `372a8dd`；Round 2 717/51 → 737/52，零减量；新增分解见 SOTA §12.7）。合入 R3 O2+O4 后父分支测基线 **775/54**（merge 工人 @ `ea1c825`）；收口复跑确认 **775 passed / 54 files**，不假装 F4 亲跑 775。
- `npm run probe`：退出码 0，`{"status":"pass","seedCount":3,"kills":1,"arenaKills":1,"cameraSnapMaxDist":7.1,"modeSwitchCameraMaxDist":7.133,"lockedForwardMinDot":1,"lockedForwardMaxAngleDeg":0,"lockedTurnMinAngleDeg":47.67,"lockedCameraMaxBehindness":-7.1,"freeStationaryMaxYawDeltaDeg":0,"freeMoveMaxYawErrorDeg":0.00021,"p99StepMs":0.116,"ai":"think","wiredCombat":true,…}`；三 seed 逐条——`0x1a2b3c4d`：kills 1、p99 0.116、botSlapAttempts 2191、modeSwitch 7.107；`0x5eed1234`：kills 2、p99 0.104、botSlapAttempts 3425、modeSwitch 7.133；`0xc0ffee42`：kills 2、p99 0.113、botSlapAttempts 3636、modeSwitch 7.106；三条均 `openingCameraDistance:7.1`、`arenaEntryPreSnapDistance:127.0–127.2`、`arenaEntryCameraDistance:7.1`、`snappedFrames:2`、`lockedTargets:3601`、`lockedReturnYawError≈1.7e-16`、`lookModeTransitions:2 / modeSwitchCameraFrames:2`、hubJourney `equippedAtStep:51 / enteredArenaAtStep:227`；横幅 `MODEL_SLUG: yizhang-probe`。
- `npm run build`：退出码 0；主 chunk 681.44kB / gzip 188.54kB（>500kB 警告既知，含 three）；build 后 `rg googleapis|gstatic src dist index.html` 零命中。
- 静态面：`RENDER_YAW_OFFSET = 0`；换算实现唯一（`core/view.js:173/178`，其余 10 文件只 import）；`rg yawFromDir src/input` 命中（分派在位）；`rg "yz-look" src/ui src/main.js` 命中（HUD DOM 在位）；`git diff c97723d..HEAD --stat -- src/render` **有 diff**（O2 硬顶合入实锤：camera.js +120 / renderer.js +55 / look.test.js +331）；F4 签字当时同区间 `src/input`/`src/ui`/`src/main.js` **零 diff**（R3 O4 未合实锤）。收口时二者已合入：`src/input`（`toggleLookMode` 认 `state.enabled`、回调 try/catch、当帧 `sample()`）+ `src/ui/look-switch.test.js`。隔离 diff 过滤后零残留。

**验证方式限定（诚实口径）**：本轮仍无交互桌面与真机——§13.4 实机八步的交互原教旨口径**未做**；以 probe 硬门（3601 帧 locked 逐帧 + V 双向切换零 snap + 127m 远跳前提）+ headless Chrome 148（SwiftShader WebGL）CDP 驱动 `smoke.html` 截图 ×6（locked 开局背后 / V→free 同帧位 / free 独立转镜露侧面 / free→locked 机位连续 / 弹簧归位背后 / tour 穿门首帧机位在身后）逐步替代并如实标注（八步 × 替代证据对照表见 SOTA §12.7）；触屏一步无替代，DEFER 真机段。

- WARNING 清单：真机段延后（§13.4 交互原教旨口径 + 触屏 + 转向手感评分卡）**保留**；R3 O4 边角与另一份 R3 O2 复核 **已合入父分支**（`ea1c825`，销号）；W2 hit-stop 零余量哨兵结转（§11.9）**保留**。
- 修复指派：无实现缺口待派；真机到位后按 §13.4 八步复跑销首条 WARNING。
- 证据包：命令原文（上列）+ probe JSON 三 seed 全文 + 冒烟截图 6 张（存验收工作台，不入 `games/yizhang/src`）随本轮验收 PR 描述提交。

### 13.9 异掌视角打磨轮 Round 4 验收判定（F4 终验席）

- 被验分支/commit：**`cursor/yizhang-polish-db8d` @ `bbe51de`**（Round 4 九席中八席合入后：O4 吞指针锁 `7a84d52` / F1 登记 `bdddcf4` / O2 放手带 `9fc5058` / G1 CI `9289f34` / G2 sourcemap+probe 转角 `7c556cc` / F2 触屏视钮+invertY 开关 `98aad66` / O1 TELEPORT 导出 `c421974` / O4 invertY 落盘 `bc35806` / O3 combat 锁测 `bbe51de`；**F3 GDD 在飞**，`origin/cursor/yizhang-p1-f3-db8d` 读分支核对）。工作分支 `cursor/yizhang-p1-f4-db8d`（只动 `docs/SOTA_CHECKLIST.md` 与本文件，零 src）。
- 验收人/日期：Fable-4 终验席 / 2026-08-27（全套命令实跑：`npm ci` → `npm test` → `npm run probe` → `npm run build` → 静态检查与 F3 分支合并演算）。
- 结论：**PASS-WITH-WARNINGS**（复盘六项 6/6 销号；WARNING 为 F3 在飞（`git merge-tree --write-tree` 实测零冲突可干净合入）、真机触屏 DEFER、§13.4 桌面八步未做（无交互桌面，不假装）、W2 哨兵结转；无实现缺口、无红线命中）。

| 组 | 通过/总数 | FAIL 项（ID + 一句话现象） |
|---|---|---|
| 复盘销号（本轮主表） | 6/6 | 无（P0 放手带 / P0 CI / P0 16 登记 / P1 触屏视钮 / P1 吞指针锁 / P2 invertY——逐项证据见 SOTA §12.8 销号表） |
| LG 回归门（沿用） | 6/6 | 无（LG-01 842≥775 零减量；LG-02 三 seed 视角硬门 + 本轮新增 `noSnapFrameMaxDisplacement`/`lookTurnMinAngleDeg` 全过；LG-03/04/05/06 绿——隔离仅 +`pages.yml` 系 G1 点名例外） |
| 冻结面（DISPATCH 红线） | 8/8 | 无（yaw 偏移 0 / 缺省 hub / locked 缺省 / free null 两条 / low bloom / `HIT_STOP.max` 0.12 原数 / `BEHIND_LIMIT`+`TELEPORT_DISTANCE` 原数 / 两套 behind 闸并存未合成） |
| LR/HR/FR/R 否决 | 零命中 | 无 |

**命令实测原文摘要**：

- `npm test`：**Test Files 57 passed (57) / Tests 842 passed (842)**，退出码 0（Round 3 收口 775/54 → 842/57，零减量；新增 `combat/hit-feel-budget.test.js`、`core/settings-invert-y.test.js`、`ui/touch.test.js` 三文件 + 六处行内扩充，分解见 SOTA §12.8）。
- `npm run probe`：退出码 0，`{"status":"pass","seedCount":3,"kills":1,"arenaKills":1,"cameraSnapMaxDist":7.1,"modeSwitchCameraMaxDist":7.1,"lookTurnMinAngleDeg":89.38,"noSnapFrameMaxDisplacement":0.4504,"lockedForwardMinDot":1,"lockedForwardMaxAngleDeg":0,"lockedTurnMinAngleDeg":89.38,"lockedCameraMaxBehindness":-7.1,"freeStationaryMaxYawDeltaDeg":0,"freeMoveYawErrorDeg":0.00063,"p99StepMs":0.107,"ai":"think","wiredCombat":true,…}`；三 seed 逐条——`0x1a2b3c4d`：kills 1、p99 0.107、botSlapAttempts 2191、noSnap 0.4504；`0x5eed1234`：kills 2、p99 0.100、botSlapAttempts 3425、noSnap 0.4498；`0xc0ffee42`：kills 2、p99 0.094、botSlapAttempts 3636、noSnap 0.4499；三条均 `openingCameraDistance:7.1`、`arenaEntryPreSnapDistance:127.0–127.2`、`snappedFrames:2`、`lockedTargets:3601`、`freeGateTurnAngle:3.12`、`lookModeTransitions:2`、hubJourney `equippedAtStep:51 / enteredArenaAtStep:227`；横幅 `MODEL_SLUG: yizhang-probe`。
- `npm run build`：退出码 0；主 chunk 682.23kB / gzip 188.71kB（>500kB 警告既知，含 three）；**`find dist -name '*.map'` 零命中**（`vite.config.js` `sourcemap: false` + `pages.yml` `find site -name '*.map' -delete` 双保险）；build 后 `rg googleapis|gstatic src dist index.html` 零命中。
- 静态面：`RENDER_YAW_OFFSET = 0`；换算实现唯一（`core/view.js`）；`HIT_STOP` 全表原数（max 0.12）；`BEHIND_LIMIT = π/2.4`、`TELEPORT_DISTANCE = 16`、`CAMERA.snapTeleport = 60` 三数原样且 `tuning.test.js` 锁 16≠60 与 `lockedYawSpan > behindLimit`；两套 behind 闸并存（`camera.js` 头注明示；放手带 `behindReleaseSlack` 只进 R3 闸、与 R2 `lockedHoldSlack` 同源）；吞锁判据与申请锁条件逐字一致（`input/index.js`）；隔离 `git diff --name-only origin/main...HEAD` 过滤后仅 `.github/workflows/pages.yml`（G1 点名例外）。

**验证方式限定（诚实口径）**：本轮仍无交互桌面与真机——§13.4 实机八步与真机触屏（「视」钮点按 / invertY 拖动 / `preventDefault` 实机手势）**未做**；本轮零视觉与玩法数值改动（输入 / 机位闸 / CI / 登记面），以 842 条单测（含放手带回归组把修前 11.2m 写进回归线）+ 三 seed probe 硬门（`noSnapFrameMaxDisplacement 0.45m ≤ 1m`、转角 89.38° 真实压过 75° 闸宽）替代并如实标注。

- WARNING 清单：**F3 GDD 在飞**（零冲突可干净合入；合入后 §15.2 与 §15.6 内容重叠、§2 模块表 `CHARACTERS` 一格两版并存，建议合并时顺一遍去重，不挡签字）；**真机触屏 DEFER** 结转；**§13.4 桌面八步未做**（环境性，如实标注）；**W2 hit-stop 零余量哨兵**结转（本轮 O3 已锁测化）。
- 修复指派：无实现缺口待派；F3 合入由合并工人执行（顺带去重 GDD §15.2/§15.6）；真机到位后按 §13.4 复跑销触屏 WARNING。
- 证据包：命令原文（上列）+ probe JSON 三 seed 全文随本轮验收 PR 描述提交；无截图（零视觉改动 + 无桌面环境，如实标注）。
