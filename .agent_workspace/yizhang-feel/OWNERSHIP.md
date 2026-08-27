# 异掌手感轮 · 文件所有权（Round 1–3）

父分支：**`cursor/yizhang-feel-db8d`**（逻辑名 `agent/yizhang-feel`）。所有子 PR 打向它，不是 `main`。
输出**首行**必须是：`MODEL_SLUG: <实际 slug>`。严禁静默降级。

游戏根：`games/yizhang/`。写路径互不重叠。

| 角色 | 模型 slug | 可写路径（相对 `games/yizhang/`） | Round 1 主攻 |
| --- | --- | --- | --- |
| Fable-1 架构 | `claude-fable-5-thinking-xhigh` | `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/OWNERSHIP.md` | 冻结朝向/输入不变量；皮肤与 VFX 事件契约；更新所有权表 |
| Fable-2 美术 UX | `claude-fable-5-thinking-xhigh` | `docs/ART_DIRECTION.md`, `src/styles/**` | 皮肤选择器与每掌特效的视觉规范（.yz-* 合同） |
| Fable-3 玩法数据 | `claude-fable-5-thinking-xhigh` | `docs/GDD.md`, `src/data/**` | `SKINS` 表、每掌 `vfx` 参数、Bot 默认皮肤、手套表扩展 |
| Fable-4 SOTA | `claude-fable-5-thinking-xhigh` | `docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` | 手感/皮肤/VFX 验收清单 |
| Opus-1 模拟 | `claude-opus-5-thinking-high-fast` | `src/sim/**` | `getView` 导出 `skinId` 与 `ghosts`；createMatch 吃 skinId |
| Opus-2 渲染 | `claude-opus-5-thinking-high-fast` | `src/render/**` | 去掉错误的朝向偏移消费；皮肤 mesh；每掌 VFX；残影；相机冲击 |
| Opus-3 技能 Bot | `claude-opus-5-thinking-high-fast` | `src/ai/**`, `src/combat/**` | 事件带 gloveId/skillId；残影可被看见；Bot 用 persona.skinId |
| Opus-4 壳层 | `claude-opus-5-thinking-high-fast` | `src/ui/**`, `src/core/**`, `src/input/**`, `src/audio/**`, `src/main.js`, `index.html` | **修反转**；大厅选皮肤；hit-stop 加强；存档 skinId |
| GPT-sol-1 单测 | `gpt-5.6-sol-xhigh-fast` | `tests/**` | 输入映射、皮肤字段、VFX 事件形状单测 |
| GPT-sol-2 探针 | `gpt-5.6-sol-xhigh-fast` | `scripts/**` | 探针不回归；可选手感/事件探针 |

## 红线

- 不改其他 `games/*`、不改 `.github/workflows`、不改 `pages/`（除非父调度器明确要求）。
- 不引入账号/后端；不下载版权素材；模型全低面数几何体。
- 禁止官方手套名 / Roblox / Slap Battles 商标 / 方块人。
- 公共 API 改名必须先改 `docs/API_CONTRACT.md` 并在简报声明。
- 禁止第四套朝向约定。禁止绕过 `combat-bridge` 直连 combat（O3 自测除外）。
- 共享只读：`package.json`、`vite.config.js`、`README.md`。新增 npm 依赖必须在简报声明（原则上除 three 外不加运行时依赖）。

## 握手（本轮新增）

1. **朝向**：sim / render / camera 统一 `yaw=0 → -Z`。`toRenderView` 不再加 π。`cameraYawToSimYaw` 仍是输入→sim 的唯一换算。
2. **皮肤**：`src/data/skins.js` 导出 `SKINS` / `SKIN_BY_ID` / `DEFAULT_SKIN_ID`。存档 `yizhang-save-v1` 增加 `skinId`（缺省兼容旧档）。`player.skinId` 进 getView。
3. **VFX**：手套表可有 `vfx: { slap, skill, hit }` 描述字段（纯数据）。渲染按 `gloveId`+`skillId` 分派，不得 8 掌共用一个光球。
4. **残影**：`state.combat.ghosts` 必须出现在 `getView()`，渲染画半透明分身，Bot 可选是否躲避。
