# 异掌 · 文件所有权与协作边界（Round 1）

> 源自 `.agent_workspace/yizhang/OWNERSHIP.md`，由 Fable-1 细化。写路径互不重叠是十代理并行的前提；本文为合并冲突仲裁依据。

游戏根：`games/yizhang/`　父分支：`cursor/yizhang-db8d`（逻辑名 `agent/yizhang`）
各代理在自己的云端分支提交，父调度器合回父分支。输出首行必须声明实际模型 slug，严禁静默降级。

## 1. 所有权表

| 角色 | 模型 slug | 可写路径（相对 `games/yizhang/`） | 提供（对外冻结面） | 消费 |
| --- | --- | --- | --- | --- |
| Fable-1 架构 | `claude-fable-5-thinking-xhigh` | `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/OWNERSHIP.md` | 模块边界、tick 顺序、类型与不变量 | 全部种子文档 |
| Fable-2 美术 UX | `claude-fable-5-thinking-xhigh` | `docs/ART_DIRECTION.md`, `src/styles/**` | 视觉规范、HUD/控件样式（材质化、安全区、横竖屏） | `docs/VISUAL_HANDBOOK.md`、本契约 §HUD |
| Fable-3 玩法数值 | `claude-fable-5-thinking-xhigh` | `docs/GDD.md`, `src/data/**` | `GLOVES` / `GLOVE_BY_ID` / `MATCH` / `ARENA`（含〔追加〕字段数值） | API_CONTRACT §3 |
| Fable-4 SOTA 验收 | `claude-fable-5-thinking-xhigh` | `docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` | 验收清单 | API_CONTRACT §14、ARCHITECTURE §8 |
| Opus-1 模拟物理 | `claude-opus-5-thinking-high-fast` | `src/sim/**` | `createMatch` / `step` / `getView` / `isMatchOver`；向 combat 提供 `damageTile` / `groundAt` 内部助手 | `data`、`combat` |
| Opus-2 WebGL 渲染 | `claude-opus-5-thinking-high-fast` | `src/render/**` | `createRenderer` / `sync` / `resize` / `setQuality` / `dispose` | view 快照 + `alpha` + events、`data` 识别色 |
| Opus-3 技能与 Bot | `claude-opus-5-thinking-high-fast` | `src/ai/**`, `src/combat/**` | `resolveSlap` / `resolveSkill` / `tickStatuses` / `applyAwaken`、`ai.think` | `data`、view 快照、sim 内部助手 |
| Opus-4 主循环 UI 输入 | `claude-opus-5-thinking-high-fast` | `src/ui/**`, `src/core/**`, `src/input/**`, `src/audio/**`, `src/main.js`, `index.html` | loop、shell、input（含 `getLook`）、audio、存档读写、事件→音效映射 | 上述全部公共 API |
| GPT-sol-1 单测 | `gpt-5.6-sol-xhigh-fast` | `tests/**` | 命中/击退/掉落/碎地/换掌/觉醒的确定性用例 | API_CONTRACT §14 不变量清单 |
| GPT-sol-2 探针基准 | `gpt-5.6-sol-xhigh-fast` | `scripts/**` | `probe.mjs`（契约/纯度静态断言）、`bench.mjs`（step 性能） | ARCHITECTURE §8 预算 |

## 2. 共享只读（需改时只追加、先在简报声明）

`package.json`、`vite.config.js`、`README.md`、`.gitignore`。
端口 4181、`base: "./"`、vitest 配置已就位——正常情况下 Round 1 无人需要动它们。新增 npm 依赖必须在简报声明理由（原则上除 `three` 外不加运行时依赖）。

## 3. 交接握手（谁等谁、桩怎么打）

1. **Fable-3 → Opus-1/3**：`data` 表是最上游。数据未合并前，Opus-1/3 可自带临时表内联开发，但字段名以 API_CONTRACT §3 为准，合并时删桩。
2. **Opus-1 ⇄ Opus-3**：sim 调 combat；combat 需要的 `damageTile(state, tileId, dmg)` / `groundAt(state, x, z)` 由 Opus-1 从 `src/sim` 导出（内部助手，不进公共契约，但签名照此冻结）。任一方未就绪时，另一方以「空实现 + 契约形状」打桩推进。
3. **Opus-2 / Opus-4 → Opus-1**：render 与 ui 只吃 `getView` 快照。sim 未就绪时可用手写假 view（照 API_CONTRACT §4.2 形状）开发。
4. **Opus-4 汇流**：`main.js` 是唯一组装点。loop 对 render/input/ui/audio 走依赖注入（`createLoop(deps)`），保证 GPT-sol 系在 Node 里无头跑 loop+sim。
5. **GPT-sol-1/2**：只 import 纯数据层（`sim`/`combat`/`data`/`ai`）。测试不得 import `src/render`、`src/ui`。

## 4. 红线（沿袭种子，违者提交作废）

- 不改 `games/` 下其他游戏、不改仓库根业务、不碰 `.github/workflows` 与 `pages/`。
- 不引入账号/后端/付费、不下载版权素材；音频全 WebAudio 合成、模型全低面数几何体。
- 不模仿同仓库其他游戏（chao-neng-xia-dan-ya、linghuashi 等）的玩法/文案/架构文档；「异掌」是原创项目。
- 禁止官方手套名、Roblox/Slap Battles 商标要素、方块人审美。
- 公共 API（API_CONTRACT 列名者）改名/改签名 = 契约变更，必须先改文档并在简报声明，不许只改代码。

## 5. 文档索引

| 文档 | 作用 |
| --- | --- |
| `docs/ARCHITECTURE.md` | 模块图、tick 顺序、状态模型、移动端策略、ADR |
| `docs/API_CONTRACT.md` | 冻结导出面、类型、事件、存档 `yizhang-save-v1`、不变量清单 |
| `docs/OWNERSHIP.md`（本文） | 写路径、交接握手、红线 |
| `docs/VISUAL_HANDBOOK.md` | 视觉质量基线（用户手册，强制） |
| `docs/ART_DIRECTION.md`（Fable-2） / `docs/GDD.md`（Fable-3） / `docs/SOTA_CHECKLIST.md`+`docs/ACCEPTANCE.md`（Fable-4） | 各自轮内产出 |
