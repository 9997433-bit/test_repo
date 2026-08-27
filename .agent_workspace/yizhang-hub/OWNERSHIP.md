# 异掌安全区大厅 · 文件所有权（Round 1–3）

父分支：**`cursor/yizhang-hub-db8d`**（逻辑名 `agent/yizhang-hub`）。所有子 PR 打向它，不是 `main`。
输出**首行**必须是：`MODEL_SLUG: <实际 slug>`。严禁静默降级。

游戏根：`games/yizhang/`。写路径互不重叠。

| 角色 | 模型 slug | 可写路径（相对 `games/yizhang/`） | Round 1 主攻 |
| --- | --- | --- | --- |
| Fable-1 架构 | `claude-fable-5-thinking-xhigh` | `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/OWNERSHIP.md` | 双区（hub/arena）状态机、传送契约、靠近选掌 API |
| Fable-2 美术 UX | `claude-fable-5-thinking-xhigh` | `docs/ART_DIRECTION.md`, `src/styles/**` | 台座/走道/传送门/靠近说明牌的视觉与 `.yz-inspect` HUD |
| Fable-3 数据 | `claude-fable-5-thinking-xhigh` | `docs/GDD.md`, `src/data/**` | `HUB` 布局表：8 座坐标、朝向、交互半径、门的 AABB |
| Fable-4 SOTA | `claude-fable-5-thinking-xhigh` | `docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` | 大厅流程验收 |
| Opus-1 模拟 | `claude-opus-5-thinking-high-fast` | `src/sim/**` | `phase: hub\|arena`；安全区无击退无掉落；靠近检测；传送切岛 |
| Opus-2 渲染 | `claude-opus-5-thinking-high-fast` | `src/render/**` | 安全区场景、走道、台座、手指朝上的展示掌+idle VFX、传送门 |
| Opus-3 技能/Bot | `claude-opus-5-thinking-high-fast` | `src/ai/**`, `src/combat/**` | hub 阶段 Bot 不进攻；传送后才 think；选掌不走战斗判定 |
| Opus-4 壳层 | `claude-opus-5-thinking-high-fast` | `src/ui/**`, `src/core/**`, `src/input/**`, `src/audio/**`, `src/main.js`, `index.html` | 开局进 hub；E/触控确认选掌；门提示；过渡；2D 菜单降为备选 |
| GPT-sol-1 单测 | `gpt-5.6-sol-xhigh-fast` | `tests/**` | 靠近、装备主副掌、未解锁拒绝、传送后 phase=arena |
| GPT-sol-2 探针 | `gpt-5.6-sol-xhigh-fast` | `scripts/**` | 走完 hub→门→岛 的无头探针，再打至少 1 kill |

## 红线

- 不改其他 `games/*`。不下载版权素材。禁止官方手套名 / 方块人 / 纯色光球。
- 禁止第四套朝向约定。hub 与 arena 共用 yaw=0 → -Z。
- 公共 API 变更先改 `API_CONTRACT.md`。
- 共享只读：`package.json`、`vite.config.js`、`README.md`。

## 握手

1. `view.phase` ∈ `{hub,arena}`。hub 时 `bots` 可以存在于数据但不 step 攻击。
2. `view.hub.pedestals[]`: `{ gloveId, x, y, z, yaw, selected }`；`view.hub.focusGloveId`；`view.hub.portalReady`。
3. 输入增加 `interact`（E / 触控「选」），由 O4 采样，O1 在靠近半径内装备。
4. 传送：`phase` 切换 + 玩家坐标写到裂岛出生点，不清空 loadout。
