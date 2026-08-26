# 异掌 · 文件所有权与协作边界（Round 2）

> 由 Fable-1 在 Round 1 版本上按合入后现状更新。写路径互不重叠是十代理并行的前提；本文为合并冲突仲裁依据。

游戏根：`games/yizhang/`　父分支：`cursor/yizhang-db8d`（**所有子 PR 的 base，不是 `main`**）。
各代理在自己的云端分支提交，父调度器合回父分支。输出首行必须声明实际模型 slug，严禁静默降级。

## 1. 所有权表

| 角色 | 模型 slug | 可写路径（相对 `games/yizhang/`） | 提供（对外冻结面） | 消费 |
| --- | --- | --- | --- | --- |
| Fable-1 架构 | `claude-fable-5-thinking-xhigh` | `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/OWNERSHIP.md` | 模块边界、tick 序、类型与不变量、ADR 裁定 | 全部产出 |
| Fable-2 美术 UX | `claude-fable-5-thinking-xhigh` | `docs/ART_DIRECTION.md`, `src/styles/**` | `.yz-*` HUD/控件样式契约（材质化、安全区、横竖屏） | `docs/VISUAL_HANDBOOK.md`、API_CONTRACT §13 |
| Fable-3 玩法数值 | `claude-fable-5-thinking-xhigh` | `docs/GDD.md`, `src/data/**` | `GLOVES/GLOVE_BY_ID/MATCH/isGloveUnlocked` 及 SKILLS/UNLOCKS/BOT_PERSONAS 表 | API_CONTRACT §3 |
| Fable-4 SOTA 验收 | `claude-fable-5-thinking-xhigh` | `docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` | 验收清单 | API_CONTRACT §14、ARCHITECTURE §8 |
| Opus-1 模拟物理 | `claude-opus-5-thinking-high-fast` | `src/sim/**` | `createMatch/step/getView/isMatchOver` + `damageTileAt/hasFloorUnder/getMatchConfig/getGloves/applyHits/ZERO_INPUT` | `data`、`combat`（静态 import） |
| Opus-2 WebGL 渲染 | `claude-opus-5-thinking-high-fast` | `src/render/**` | `createRenderer/sync/resize/setQuality/dispose` | view 快照（已插值）、`data` 识别色 |
| Opus-3 技能与 Bot | `claude-opus-5-thinking-high-fast` | `src/ai/**`, `src/combat/**` | `resolveSlap/resolveSkill/tickStatuses/applyAwaken`、`ai.think` | `data`、view 快照、sim 的 `damageTileAt/hasFloorUnder` |
| Opus-4 主循环 UI 输入 | `claude-opus-5-thinking-high-fast` | `src/ui/**`, `src/core/**`, `src/input/**`, `src/audio/**`, `src/main.js`, `index.html` | loop、shell、input（含 `getLook/setLook`）、audio、`core/storage` 存档、事件→音效映射、`core/fallback/**` 降级件 | 上述全部公共 API |
| GPT-sol-1 单测 | `gpt-5.6-sol-xhigh-fast` | `tests/**` | 命中/击退/掉落/碎地/换掌/觉醒/胜负的确定性用例 | API_CONTRACT §14 不变量清单 |
| GPT-sol-2 探针基准 | `gpt-5.6-sol-xhigh-fast` | `scripts/**` | `probe.mjs`（契约/纯度断言）、`bench.mjs`（step 性能） | ARCHITECTURE §8 预算 |

## 2. 共享只读（需改时只追加、先在简报声明）

`package.json`、`vite.config.js`、`README.md`、`.gitignore`。
端口 4181、`base: "./"`、vitest 配置已就位。新增 npm 依赖必须在简报声明理由（原则上除 `three` 外不加运行时依赖）。
`src/sim/README.md` 归 O1，内容与 API_CONTRACT 冲突时以后者为准。

## 3. 交接握手（Round 2 版：桩已退场，接线冻结）

Round 1 的「未就绪就打桩」条款全部作废——data / combat / sim / render / shell 均已落地，Round 2 的握手是**接线与协议对齐**：

1. **接线（ADR-19）**：`src/sim/deps.js` 静态 `import "../data/index.js"` 与 `"../combat/index.js"`；`installData/installCombat/resetDeps` 仅供测试隔离，`autoWireOptionalDeps` 删除。main 启动断言 `getDeps().usingRealData && usingRealCombat`，为假必须亮降级横幅。main 传给 shell/render 的掌表与 MATCH 取自 `sim.getGloves()/getMatchConfig()`，全链一张表。
2. **O1 ⇄ O3**：sim 提供给 combat 的助手名冻结为 `damageTileAt(state, x, z, amount)` 与 `hasFloorUnder(state, x, z)`（R1 的 `damageTile(tileId)/groundAt` 命名作废）。combat 返回形状冻结为 `{ hits: HitRecord[] }` / `{ ok, ... }`（API_CONTRACT §5）：`targetId` + `applied` 是必填字段；combat 不 `pushEvent`、不进自己的 `beginSlap`/pending 前摇路径——**sim 闸门，combat 解算**。
3. **O2 / O4 → O1**：view 形状以 API_CONTRACT §4.3 为唯一真相（真实 `getView` 的形状），「容忍任意残缺 view」的防御姿势可以保留但不再是接口；O2 按 `view.arena` 方格建台面（ADR-18），本地玩家缺省 `p0`。
4. **O4 汇流**：`main.js` 是唯一装配点。`SELF_ID = 'p0'`（ADR-16）；事件消费用 §10 词表（`ko/tileCrack/tileBreak/...`）；HUD 用 F2 `.yz-*` 类名，`src/ui` 自带样式收缩为 critical fallback；解锁判定改用 `data` 的 `UNLOCKS/isGloveUnlocked`（`glove.unlock` 是字符串，不再有 `.req`）。
5. **降级件（ADR-21）**：`core/fallback/**` 与 sim 内置兜底只在 import 失败时启动期挂载、必须亮横幅、局中不换件；所有 fallback 件遵守冻结协议（p0、-Z、方格 view 形状），O4 负责保持一致。
6. **G1 / G2**：只 import 纯数据层（`sim/combat/data/ai`），不得 import `src/render`、`src/ui`。`tests/helpers.js` 改用 -Z 朝向约定（面向 +X ⇔ `yaw = -PI/2`）；probe 的击杀断言保持绿。

### Round 2 各角色必改清单（本轮验收线）

| 角色 | 必改 |
| --- | --- |
| O1 sim | `deps.js` 转静态 import、删 `autoWireOptionalDeps`；`isMatchOver` 改活谓词（ADR-20）；保持方格拓扑与现有导出面 |
| O2 render | 消费 `view.arena` 方格（`origin/tileSize/cols` + `tiles[].x,z,alive,crack,seam,zone`）；`localId/followId` 缺省 `p0`；`setQuality` 被 main 探针真实调用 |
| O3 combat/ai | `resolveSlap` 返回 `{ hits }`、hit 记录 `targetId/applied` 对齐；删 combat 内直发事件与 pending 前摇；台面伤害走 `damageTileAt`；magnet 等技能经 `step` 产生可测位移（§14-12） |
| O4 shell | `SELF_ID → 'p0'`（含 `core/fallback/sim.js`）；input 换算改 ADR-17 公式；事件名对齐 §10；HUD 换 `.yz-*`；解锁走 `isGloveUnlocked`；砍局中 fallback 换件 |
| F3 data | 导出 `isGloveUnlocked`（§3 签名）；`tiles.js` 拓扑字段标注非规范（只留伤害调参） |
| G1 tests | helpers 换 -Z 约定；6 条红测按新契约修（对象比较用 `objectContaining`、掉落用有限步 ko、isMatchOver 直改 kills 即真） |
| G2 probe | 纯度扫描覆盖 data；保持 probe/bench 绿 |
| F2 / F4 | `.yz-*` 类名清单与 shell 实际 DOM 对齐；验收清单引用本轮 ADR-16…22 |

## 4. 红线（沿袭种子，违者提交作废）

- 不改 `games/` 下其他游戏、不改仓库根业务、不碰 `.github/workflows` 与 `pages/`。
- 不引入账号/后端/付费、不下载版权素材；音频全 WebAudio 合成、模型全低面数几何体。
- 不模仿同仓库其他游戏的玩法/文案/架构文档；「异掌」是原创项目。
- 禁止官方手套名、Roblox/Slap Battles 商标要素、方块人审美。
- 公共 API（API_CONTRACT 列名者）改名/改签名 = 契约变更，必须先改文档并在简报声明，不许只改代码。
- **禁止发明第四套台面拓扑、第二个人类 id、第二套朝向约定**——ADR-16/17/18 之外的方案一律拒收。

## 5. 文档索引

| 文档 | 作用 |
| --- | --- |
| `docs/ARCHITECTURE.md` | 模块图、tick 顺序、状态模型、移动端策略、ADR（R2 裁定 16–22） |
| `docs/API_CONTRACT.md` | 冻结导出面 v2、类型、事件词表、存档 `yizhang-save-v1`、不变量清单 |
| `docs/OWNERSHIP.md`（本文） | 写路径、R2 交接握手与必改清单、红线 |
| `docs/VISUAL_HANDBOOK.md` | 视觉质量基线（用户手册，强制） |
| `docs/ART_DIRECTION.md`（F2） / `docs/GDD.md`（F3） / `docs/SOTA_CHECKLIST.md`+`docs/ACCEPTANCE.md`（F4） | 各自轮内产出 |
