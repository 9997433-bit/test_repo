# 异掌 · 文件所有权与协作边界（Round 3）

> 由 Fable-1 按 Round 2 合入后现状更新。写路径互不重叠是十代理并行的前提；本文为合并冲突仲裁依据。Round 3 是 SOTA 收官轮：目标全绿 + 探针接线真值 + 廉价信号清零，握手见 §3。

游戏根：`games/yizhang/`　父分支：`cursor/yizhang-db8d`（**所有子 PR 的 base，不是 `main`**）。
各代理在自己的云端分支提交，父调度器合回父分支。输出首行必须声明实际模型 slug，严禁静默降级。

## 1. 所有权表

| 角色 | 模型 slug | 可写路径（相对 `games/yizhang/`） | 提供（对外冻结面） | 消费 |
| --- | --- | --- | --- | --- |
| Fable-1 架构 | `claude-fable-5-thinking-xhigh` | `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/OWNERSHIP.md` | 模块边界、tick 序、类型与不变量、ADR 裁定 | 全部产出 |
| Fable-2 美术 UX | `claude-fable-5-thinking-xhigh` | `docs/ART_DIRECTION.md`, `src/styles/**` | `.yz-*` HUD/控件样式契约（材质化、安全区、横竖屏） | `docs/VISUAL_HANDBOOK.md`、API_CONTRACT §13 |
| Fable-3 玩法数值 | `claude-fable-5-thinking-xhigh` | `docs/GDD.md`, `src/data/**` | `GLOVES/GLOVE_BY_ID/MATCH/isGloveUnlocked` 及 SKILLS/UNLOCKS/BOT_PERSONAS 表 | API_CONTRACT §3 |
| Fable-4 SOTA 验收 | `claude-fable-5-thinking-xhigh` | `docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` | 验收清单 | API_CONTRACT §14、ARCHITECTURE §8 |
| Opus-1 模拟物理 | `claude-opus-5-thinking-high-fast` | `src/sim/**` | `createMatch/step/getView/isMatchOver` + `damageTileAt/hasFloorUnder/getMatchConfig/getGloves/applyHits/ZERO_INPUT`；**生产桥 `combat-bridge`**（§3.1 别名表 + 朝向/命中/事件翻译，ADR-23/24） | `data`、`combat`（经桥静态 import） |
| Opus-2 WebGL 渲染 | `claude-opus-5-thinking-high-fast` | `src/render/**` | `createRenderer/sync/resize/setQuality/dispose` | view 快照（已插值）、`data` 识别色 |
| Opus-3 技能与 Bot | `claude-opus-5-thinking-high-fast` | `src/ai/**`, `src/combat/**` | `resolveSlap/resolveSkill/tickStatuses/applyAwaken`、`ai.think` | `data`、view 快照、sim 的 `damageTileAt/hasFloorUnder` |
| Opus-4 主循环 UI 输入 | `claude-opus-5-thinking-high-fast` | `src/ui/**`, `src/core/**`, `src/input/**`, `src/audio/**`, `src/main.js`, `index.html` | loop、shell、input（含 `getLook/setLook`）、audio、`core/storage` 存档、事件→音效映射、`core/fallback/**` 降级件 | 上述全部公共 API |
| GPT-sol-1 单测 | `gpt-5.6-sol-xhigh-fast` | `tests/**` | 命中/击退/掉落/碎地/换掌/觉醒/胜负的确定性用例 | API_CONTRACT §14 不变量清单 |
| GPT-sol-2 探针基准 | `gpt-5.6-sol-xhigh-fast` | `scripts/**` | `probe.mjs`（契约/纯度断言）、`bench.mjs`（step 性能） | ARCHITECTURE §8 预算 |

## 2. 共享只读（需改时只追加、先在简报声明）

`package.json`、`vite.config.js`、`README.md`、`.gitignore`。
端口 4181、`base: "./"`、vitest 配置已就位。新增 npm 依赖必须在简报声明理由（原则上除 `three` 外不加运行时依赖）。
`src/sim/README.md` 归 O1，内容与 API_CONTRACT 冲突时以后者为准。

## 3. 交接握手（Round 3 版：终局收敛）

R2 的接线与协议对齐已落地（静态桥、`p0`、-Z、方格、事件词表）。Round 3 的握手是**收官**：全绿、探针真值、词表收敛、廉价信号清零。

1. **接线终态（ADR-19/24）**：`src/sim/deps.js` 静态 import `../data/gloves.js` + `./combat-bridge.js`——**import sim 即已接线，谁都不要再 install**。`usingRealCombat === true ⇔ 未装替身 ⇔ 生产桥在岗`；install 任何非 null 模块（包括真实 combat 命名空间）都会置 false 且绕过桥。R2 探针报 `usingRealCombat: false` 是**误报**：根因是 `main.js wireSimDeps` 与 `scripts/harness.mjs installSimulationDependencies` 先 install 再测。O4/G2 按下表删掉 install 路径后，探针即真值。
2. **技能 id 一张表（ADR-23）**：唯一翻译表 = `src/sim/combat-bridge.js` 的 `SKILL_ALIAS`（全表冻结在 API_CONTRACT §3.1）。数据 id 是公共词表（cotton 哨兵 `"none"`、禁 null），handler id 是 combat 分派键与线上 `skillId`。重复副本删除：F3 删 `data/skills.js SKILL_COMBAT_ALIASES`、O4 删 `core/modules.js SKILL_ALIASES + alignSkillIds`。
3. **fallback-combat 清尾**：`src/sim/fallback-combat.js` 已删，任何引用即坏。现存残留：`src/combat/sim-integration.test.js` 仍 import 它导致**整文件加载失败**（O3 修）；`data/tiles.js` 注释引用旧路径（F3 顺手清）；`docs/GDD.md` §6 过渡段与 `docs/SOTA_CHECKLIST.md` 旧条目（F3/F4 各自轮内按 ADR-23/24 改写）。
4. **事件词表已扩容**：§10 新增 `parry / meteorImpact / ghostSlap`（combat 触发、桥代发）；O2 可按它们做 VFX，O4 加音效前先在 §11 登记。`normalizeEvent` 是 shell 内部适配，线上词表以 §10 为准。
5. **适配点唯一（ADR-17 修订注）**：朝向换算只允许三处——`sim/combat-bridge.js`（combat ±π）、`core/view.js toRenderView`（render +π）、`core/view.js cameraYawToSimYaw`（相机方位角）。任何人不得新增第四处。
6. **G1 / G2 范围不变**：只 import 纯数据层（`sim/combat/data/ai`），不得 import `src/render`、`src/ui`；红测修法可以改测试也可以改实现，但**禁止空 expect / 禁止跳测**。

### Round 3 各角色必改清单（收官验收线）

| 角色 | 必改 |
| --- | --- |
| O1 sim | 修出盘掉落红测涉及的 placement/护栏边界；保持导出面、方格拓扑与桥的翻译职责（§5.1）不变 |
| O2 render | **low 档关 bloom**（R3 验收点）；hit-stop / 击中扬尘收束（juice）；draw calls 预算复核 |
| O3 combat/ai | 修 `src/combat/sim-integration.test.js`（删 fallback-combat import，按 ADR-24 重写 wiring 断言）；弹簧反击 / 磁掌拉拽红测修绿（§14-12 锚点） |
| O4 shell | 删 `wireSimDeps` 注入路径与 `alignSkillIds/SKILL_ALIASES`、按 ADR-24 重写 `core/wiring.test.js`；`index.html` 删 fonts preconnect；低档表现与触控/横屏复核 |
| F2 styles | `src/styles/index.css` 删 googleapis `@import`（系统精品栈或自托管，SOTA R-13）；shell.css 残留收敛 |
| F3 data | 删 `SKILL_COMBAT_ALIASES`；清 `tiles.js` 旧注释；GDD §6 过渡段按 ADR-23 收敛 |
| F4 验收 | 清单对齐 ADR-23/24；以 `probe usingRealCombat === true` 为前提复测 L1 整包 |
| G1 tests | `tests/**` 红测全绿（禁空 expect）；`cotton.skillId === "none"` 断言；掉落用有限步 ko |
| G2 probe | 删 `harness.mjs` 的 install 调用（ADR-24）；断言 `usingRealCombat === true` 且 kills ≥ 1；纯度扫描保持绿 |

验收基线（R2 合入时实测）：vitest **145/152，7 红** = `core/wiring.test.js` ×3（install 后期望 `usingReal*` 为 true、`alignSkillIds` 期望 cotton falsy——均按 ADR-23/24 重写）、`tests/glove-data.test.js` ×1（期望 cotton `skillId: null`，应改 `"none"`）、`tests/match-lifecycle.test.js` 出盘掉落 ×1、`tests/skills.test.js` 弹簧反击/磁掌拉拽 ×2；另 `src/combat/sim-integration.test.js` **整文件加载失败**（import 已删除的 fallback-combat，不计入 152）。probe PASS 3 kills 但 wiring 误报 false。R3 出口：**全部测试文件加载成功且全绿、probe `usingRealCombat: true` 且 kills ≥ 1、build 产物无 CDN 域名**。

## 4. 红线（沿袭种子，违者提交作废）

- 不改 `games/` 下其他游戏、不改仓库根业务、不碰 `.github/workflows` 与 `pages/`。
- 不引入账号/后端/付费、不下载版权素材；音频全 WebAudio 合成、模型全低面数几何体。
- 不模仿同仓库其他游戏的玩法/文案/架构文档；「异掌」是原创项目。
- 禁止官方手套名、Roblox/Slap Battles 商标要素、方块人审美。
- 公共 API（API_CONTRACT 列名者）改名/改签名 = 契约变更，必须先改文档并在简报声明，不许只改代码。
- **禁止发明第四套台面拓扑、第二个人类 id、第二套朝向约定**——ADR-16/17/18 之外的方案一律拒收。
- **禁止绕过 `combat-bridge` 直连 `src/combat`**（O3 自测除外）、**禁止第二张技能 id 别名表 / 第二个翻译点**（ADR-23）。
- **禁止向已接线的 sim install 真实模块来「接线」**（ADR-24）——`install*` 只属于测试替身，产线与探针直接断言 `usingReal*` 为 true。
- 禁止引用已删除的 `src/sim/fallback-combat.js`。

## 5. 文档索引

| 文档 | 作用 |
| --- | --- |
| `docs/ARCHITECTURE.md` | 模块图、tick 顺序、状态模型、移动端策略、ADR（16–22 沿用/修订 + R3 新增 23–24） |
| `docs/API_CONTRACT.md` | 冻结导出面 v3、类型、技能 id 别名表 §3.1、生产桥契约 §5、事件词表、存档 `yizhang-save-v1`、不变量清单 |
| `docs/OWNERSHIP.md`（本文） | 写路径、R3 收官握手与必改清单、红线 |
| `docs/VISUAL_HANDBOOK.md` | 视觉质量基线（用户手册，强制） |
| `docs/ART_DIRECTION.md`（F2） / `docs/GDD.md`（F3） / `docs/SOTA_CHECKLIST.md`+`docs/ACCEPTANCE.md`（F4） | 各自轮内产出 |
