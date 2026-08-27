# 异掌 · 文件所有权与协作边界（手感轮 R1）

> 由 Fable-1 按手感轮编排（`.agent_workspace/yizhang-feel/`）更新，与该工作区的 GOAL/OWNERSHIP 对齐。写路径互不重叠是十代理并行的前提；本文为合并冲突仲裁依据。本轮主攻四件用户可感的事：**键鼠整轴反转（RENDER_YAW_OFFSET 归零）、角色皮肤、每掌独立 VFX、打击感**。

游戏根：`games/yizhang/`　父分支：**`cursor/yizhang-feel-db8d`**（**所有子 PR 的 base，不是 `main`，也不是 `cursor/yizhang-db8d`**）。
各代理在自己的云端分支提交，父调度器合回父分支。输出**首行**必须声明实际模型 slug，严禁静默降级。

## 1. 所有权表

| 角色 | 模型 slug | 可写路径（相对 `games/yizhang/`） | 手感轮 R1 主攻 |
| --- | --- | --- | --- |
| Fable-1 架构 | `claude-fable-5-thinking-xhigh` | `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/OWNERSHIP.md` | 冻结朝向/输入不变量（ADR-25）；皮肤与 VFX 事件契约（ADR-26/27）；更新所有权表 |
| Fable-2 美术 UX | `claude-fable-5-thinking-xhigh` | `docs/ART_DIRECTION.md`, `src/styles/**` | 皮肤选择器（`.yz-skin-*`）与每掌特效的视觉规范（形状语言 × 识别色表） |
| Fable-3 玩法数据 | `claude-fable-5-thinking-xhigh` | `docs/GDD.md`, `src/data/**` | 新建 `skins.js`（§3.2 词表）；`bots.js` 每 persona 加 `skinId`；可选 `GloveDef.vfx` 调参 |
| Fable-4 SOTA | `claude-fable-5-thinking-xhigh` | `docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` | 手感/皮肤/VFX/hit-stop 验收清单（对齐 GOAL 验收线） |
| Opus-1 模拟 | `claude-opus-5-thinking-high-fast` | `src/sim/**` | `createMatch` 吃 `skinId/botSkinIds`；`getView` 导出 `players[].skinId` 与 `combat.ghosts`（桥 `ghostsView`）；`hit` 事件补 `gloveId/skillId`；桥代发事件补 id |
| Opus-2 渲染 | `claude-opus-5-thinking-high-fast` | `src/render/**` | 保持 -Z 原生、零补偿消费 yaw；按 `resolveSkin` 建皮肤外观变体；8 掌扇击 + 7 技能 VFX 按 id 分派；画 `view.combat.ghosts` 残影；相机冲击/扬尘收束 |
| Opus-3 技能 Bot | `claude-opus-5-thinking-high-fast` | `src/ai/**`, `src/combat/**` | ghost 建档补 `ttl0`；延迟命中 HitRecord 填 `gloveId`；残影可见时长调参；combat 事件带够翻译所需字段 |
| Opus-4 壳层 | `claude-opus-5-thinking-high-fast` | `src/ui/**`, `src/core/**`, `src/input/**`, `src/audio/**`, `src/main.js`, `index.html` | **修反转**（`RENDER_YAW_OFFSET → 0` + `core/view.test.js` 改断言）；大厅皮肤选择器；`storage` 加 `skinId`；main 传 `skinId/botSkinIds`；hit-stop 加强（≤120ms） |
| GPT-sol-1 单测 | `gpt-5.6-sol-xhigh-fast` | `tests/**` | 输入映射锁死（§14-15/16）、皮肤字段（§14-17/18）、VFX 事件形状（§14-19）单测 |
| GPT-sol-2 探针 | `gpt-5.6-sol-xhigh-fast` | `scripts/**` | 探针不回归（`usingRealCombat: true`、kills≥1）；可选手感/事件形状探针 |

## 2. 共享只读（需改时只追加、先在简报声明）

`package.json`、`vite.config.js`、`README.md`、`.gitignore`。
端口 **4181**、`base: "./"`、vitest 配置已就位。新增 npm 依赖必须在简报声明理由（原则上除 `three` 外不加运行时依赖）。
`src/sim/README.md` 归 O1，内容与 API_CONTRACT 冲突时以后者为准。

## 3. 交接握手（手感轮 R1）

1. **朝向（ADR-25，根因修复）**：sim / render / camera 统一 `yaw=0 → -Z`。`core/view.js` 的 `RENDER_YAW_OFFSET` 归 **0**、`toRenderView` 对 yaw 恒等透传（O4 落地，导出名保留）；`camera.js` / `characters.js` 本就是 -Z 原生，**O2 不加任何补偿**。合法换算点只剩两处：`sim/combat-bridge.js`（combat ±π，含 `ghostsView` 还原）与 `core/view.js cameraYawToSimYaw / simYawToCameraYaw`。验收语义：**W = 镜头水平前方、A = 屏幕左、鼠标右移 = 右转**；锚点公式见 ARCHITECTURE §5.1.1，G1 按 §14-15/16 锁死。谁都不许用「再加一个偏移」救火。
2. **皮肤（ADR-26）**：`src/data/skins.js` 导出 `SKINS / SKIN_BY_ID / DEFAULT_SKIN_ID / resolveSkin`（F3，词表 §3.2：`drifter/mason/crane/reed/nuo/wildhorn`）。存档 `yizhang-save-v1` 加 `skinId`（O4，旧档缺失补默认、不换 key）。数据流：save → `createMatch({ skinId, botSkinIds })`（O1，sim 视为不透明字符串）→ `view.players[].skinId` → render `resolveSkin` 建外观（O2）。Bot 皮肤 = `persona.skinId`（F3 配、main 传），三人互异。皮肤只换外观，禁止挂数值。
3. **每掌 VFX（ADR-27）**：分派键 = 事件上的 `gloveId / skillId`。`hit` 事件补齐两 id（O1）；桥代发 `parry/meteorImpact/ghostSlap` 补齐（O1）；`HitRecord.gloveId` 可选（O3 在延迟命中填）。O2 按 gloveId 做 8 套可辨扇击 VFX、按 skillId 做技能 VFX——**禁止 8 掌共用光球/描边**。`GloveDef.vfx` 是可选纯数据调参（F3），不参与分派。
4. **残影（ADR-27）**：`state.combat.ghosts` 经桥 `ghostsView(state)`（yaw ±π 还原回 -Z）进 `getView().combat.ghosts`（O1）；O3 建 ghost 时补 `ttl0`；O2 画半透明分身、按 `ttl/ttl0` 淡出——**残影必须在画面上可见**。
5. **打击感（ADR-28）**：hit-stop 只住编排层累加器（`core/juice.js` + `loop.hold`，O4 调参强化），单次 ≤ 0.12s、同帧取最长、仅 `p0` 参与命中触发；禁止缩放 dt、禁止 sim 感知。O2 配套接触扬尘 + 短相机冲击（camera `impulse` 已有）；受击僵直走既有 `kbT` + render 形变，不加新机制。不要满屏红晕。

### 手感轮 R1 各角色必改清单

| 角色 | 必改 |
| --- | --- |
| F2 styles | `.yz-skin-grid / .yz-skin-tile` 选择器样式契约；ART_DIRECTION 补每掌 VFX 形状语言表（8 掌 × 扇击/技能/命中）与六套皮肤配色规范 |
| F3 data | 新建 `src/data/skins.js`（§3.2）；`bots.js` 三 persona 各加 `skinId`；可选 `GloveDef.vfx`；`data/index.js` 汇出 skins |
| F4 验收 | ACCEPTANCE/SOTA 加朝向（W/A/鼠标语义）、皮肤（≥6 可辨 + 存档记忆 + Bot 不同装）、每掌 VFX（8 掌可辨、残影可见）、hit-stop（≤120ms、无红晕）验收行 |
| O1 sim | `createMatch` 收 `skinId/botSkinIds` 存 `player.skinId`（不校验）；`getView` 导出 `skinId` 与 `combat.ghosts`（新增桥 `ghostsView`，±π 还原）；`applyHits` 的 `hit` 事件补 `gloveId/skillId`；桥 `digestEvents` 三事件补 id |
| O2 render | 确认零补偿路径（吃透传 yaw）；`characters.js` 按 `resolveSkin` 出 build/headgear/back/palette 变体（识别色背件语义不变）；每掌 VFX 按 id 分派；ghosts 半透明渲染；扬尘/相机冲击收束；draw calls 预算复核（§8） |
| O3 combat/ai | ghost 建档加 `ttl0`；延迟命中 `HitRecord.gloveId`；combat 事件字段补齐桥翻译所需（parry 的弹反者掌等）；残影 ttl/假挥时机调参保证可见可骗 |
| O4 shell | `core/view.js`：`RENDER_YAW_OFFSET = 0`、`toRenderView` 透传；`core/view.test.js`「补 π」断言改「透传」；大厅皮肤选择器（menu，`onStart({ main, off, skinId })`）；`storage.js` DEFAULTS 加 `skinId` + 旧档兼容；main 传 `skinId/botSkinIds`、绑 render；hit-stop 调参 ≤120ms；新增音效先登记 §11 |
| G1 tests | §14-14…19 全部落测：toRenderView 透传、W/D 映射公式、+dx 单调右转、SKINS 表形状、skinId 透传与存档往返、`hit` 事件 id、ghosts 形状与生命周期；**禁空 expect / 禁跳测** |
| G2 probe | `probe.mjs` 保持 `usingRealCombat === true`、kills ≥ 1；可选：`hit` 事件带 `gloveId` 断言、`view.combat.ghosts` 存在断言；纯度扫描保持绿 |

出口验收线（GOAL）：`npm test` 全绿；`npm run probe` PASS 且 `wiredCombat: true`、kills≥1；`vite build` 通过；键鼠语义、≥6 皮肤、8 掌 VFX、hit-stop 按 GOAL 验收。

## 4. 红线（沿袭种子与 R3，违者提交作废）

- 不改 `games/` 下其他游戏、不改仓库根业务、不碰 `.github/workflows` 与 `pages/`。**禁止再复制一份游戏目录。**
- 不引入账号/后端/付费、不下载版权素材；音频全 WebAudio 合成、模型全低面数几何体。皮肤禁止贴图包。
- 不模仿同仓库其他游戏的玩法/文案/架构文档；「异掌」是原创项目。
- 禁止官方手套名、Roblox/Slap Battles 商标要素、方块人审美。
- 公共 API（API_CONTRACT 列名者）改名/改签名 = 契约变更，必须先改文档并在简报声明，不许只改代码。
- **禁止第三/第四套朝向换算点**（ADR-17/25 之外一律拒收）、禁止发明第二套台面拓扑与第二个人类 id（ADR-16/18）。
- **禁止绕过 `combat-bridge` 直连 `src/combat`**（O3 自测除外）、禁止第二张技能 id 别名表（ADR-23）、禁止向已接线的 sim install 真实模块（ADR-24）。
- 皮肤禁止挂数值（ADR-26）；VFX 禁止 8 掌共用光球、禁止发光描边与 Bloom 糊屏（视觉手册）；hit-stop 禁止进 sim（ADR-28）。
- 视觉强制 `docs/VISUAL_HANDBOOK.md` 底座 B：暮蓝天空 + 暖黄裂纹，饱和只留给当前手套识别色；禁止塑料高光、系统字体 HUD。

## 5. 文档索引

| 文档 | 作用 |
| --- | --- |
| `docs/ARCHITECTURE.md` | 模块图、tick 顺序、状态模型、移动端策略、ADR（16–24 沿用/修订 + 手感轮新增 25–28） |
| `docs/API_CONTRACT.md` | 冻结导出面 v4、类型、技能 id 别名表 §3.1、皮肤契约 §3.2、生产桥契约 §5、事件词表 §10、存档 §12、不变量清单 §14 |
| `docs/OWNERSHIP.md`（本文） | 写路径、手感轮握手与必改清单、红线 |
| `docs/VISUAL_HANDBOOK.md` | 视觉质量基线（用户手册，强制底座 B） |
| `docs/ART_DIRECTION.md`（F2） / `docs/GDD.md`（F3） / `docs/SOTA_CHECKLIST.md`+`docs/ACCEPTANCE.md`（F4） | 各自轮内产出 |
| `.agent_workspace/yizhang-feel/GOAL.md` | 本轮用户原话与验收线（编排工作区，只读） |
