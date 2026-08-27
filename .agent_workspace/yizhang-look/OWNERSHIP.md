# 异掌视角轮 · 文件所有权（Round 1–3）

父分支：**`cursor/yizhang-look-db8d`**（逻辑名 `agent/yizhang-look`）。所有子 PR / 合入打向它，不是 `main`。  
输出**首行**必须是：`MODEL_SLUG: <实际 slug>`。严禁静默降级。

游戏根：`games/yizhang/`。写路径互不重叠。编排只写 `.agent_workspace/yizhang-look/`（本表之外）。

| 角色 | 模型 slug | 可写路径（相对 `games/yizhang/`） | Round 1 主攻 |
| --- | --- | --- | --- |
| Fable-1 架构 | `claude-fable-5-thinking-xhigh` | `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/OWNERSHIP.md` | lookMode 契约、yaw 空间、过门 snap、ADR-37+ |
| Fable-2 美术 UX | `claude-fable-5-thinking-xhigh` | `docs/ART_DIRECTION.md`, `src/styles/**` | 锁视角 HUD/切换控件视觉；过门淡场不挡视线 |
| Fable-3 数据 | `claude-fable-5-thinking-xhigh` | `docs/GDD.md`, `src/data/**` | 默认 lookMode、键位文案、tuning 机位距离/阻尼（若需表） |
| Fable-4 SOTA | `claude-fable-5-thinking-xhigh` | `docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` | 视角验收：背后/过门吸附/锁面向 |
| Opus-1 模拟 | `claude-opus-5-thinking-high-fast` | `src/sim/**` | locked 时 p0.yaw 与输入 yaw 一致；过门 yaw 与出生朝向；不改战斗数值 |
| Opus-2 渲染 | `claude-opus-5-thinking-high-fast` | `src/render/**` | setLook 吃 simYaw；phase 切换 snap；locked 钉身后 |
| Opus-3 技能/Bot | `claude-opus-5-thinking-high-fast` | `src/ai/**`, `src/combat/**` | Bot 不受 lookMode 影响；观战 orbit 仍可用 |
| Opus-4 壳层 | `claude-opus-5-thinking-high-fast` | `src/ui/**`, `src/core/**`, `src/input/**`, `src/audio/**`, `src/main.js`, `index.html` | feedLook 空间、V 键/菜单/URL/存档、过门 align+snap |
| GPT-sol-1 单测 | `gpt-5.6-sol-xhigh-fast` | `tests/**` | lookMode、simYaw 喂入、过门 snap 不变量 |
| GPT-sol-2 探针 | `gpt-5.6-sol-xhigh-fast` | `scripts/**` | 无头探针：locked 朝向一致、过门无飞跃；smoke 参数 |

## 红线

- 不改其他 `games/*`。不复制第二份 `games/yizhang*`。
- 禁止第四套朝向。hub/arena 共用 yaw=0 → -Z。`RENDER_YAW_OFFSET = 0`。
- 公共 API 变更先改 `API_CONTRACT.md`（F1）。
- 共享只读：`package.json`、`vite.config.js`、`README.md`（追加说明可在简报声明后由 O4 改 README 一句）。
- 子代理 **不要** 用 `gh pr merge` / 不要打向 `main`。推自己的 `cursor/*-db8d` 分支即可；父调度器合回。
