# Round 2 派发 · 异掌安全区大厅

基座：`cursor/yizhang-hub-db8d`
必读：`GOAL.md`、`OWNERSHIP.md`、`round1/BRIEF.md`、本文件。
子 PR base：**`cursor/yizhang-hub-db8d`**。
输出**首行**：`MODEL_SLUG: <实际 slug>`。严禁静默降级。

## 并发 10 席

| id | 模型 | 主攻 |
| --- | --- | --- |
| F1 | fable `claude-fable-5-thinking-xhigh` | 契约向实现收口（七处名义）+ 空挥/pitch/皮肤透传 ADR |
| F2 | fable | 皮肤剪影 + 裂岛每掌战斗 VFX 视觉规范 |
| F3 | fable | `src/data/skins.js` 真表 + 每掌战斗 VFX 参数 |
| F4 | fable | 复验 §11，重勾 HV / HG-02 |
| O1 | opus-fast `claude-opus-5-thinking-high-fast` | hub 空挥闸；skinId / combat.ghosts 导出；hub 换掌 |
| O2 | opus-fast | 皮肤 mesh、裂岛每掌 VFX、残影、相机 pitch API |
| O3 | opus-fast | 事件 gloveId；残影数据；hub 继续拒战 |
| O4 | opus-fast | pitch 喂入；结算回走道；皮肤真表；ui/hub.css 收缩 |
| G1 | gpt-sol `gpt-5.6-sol-xhigh-fast` | 空挥 / skinId / ghosts 单测，不减量 |
| G2 | gpt-sol | probe 传 `phase:'hub'`，hubJourney 全绿 |

云端同时最多 **3** 个新 VM。

### Wave 1（本轮先派）

| 席位 | 模型 | 状态 |
| --- | --- | --- |
| F3 皮肤真表 | `claude-fable-5-thinking-xhigh` | `bc-19617087-f8db-5dae-9f0b-83e998f63ff2` | 已合入 `cursor/yizhang-hub-r2-f3-skins-db8d`（SKINS 六套 DEFAULT drifter + GLOVE_VFX；369 测） |
| O1 空挥+导出 | `claude-opus-5-thinking-high-fast` | `bc-3b6a15f6-a353-5978-984c-afaa1b882532` | 已合入 `cursor/yizhang-hub-r2-o1-sim-db8d`（空挥空间闸、skinId、ghosts、hub 换掌；352 测） |
| G2 探针 phase | `gpt-5.6-sol-xhigh-fast` | `bc-7f07748d-c290-5db1-ac3c-5b9d64e4618e` | 已合入 `cursor/yizhang-hub-r2-g2-probe-db8d`（probe pass，harness 缺省仍 arena） |

### Wave 2（Wave 1 合入后）

| 席位 | 模型 | Agent ID | 状态 |
| --- | --- | --- | --- |
| F1 契约收口 | `claude-fable-5-thinking-xhigh` | `bc-3703b736-e805-5387-9504-a9ef41455e13` | 已合入 `cursor/yizhang-hub-r2-f1-contract-db8d`（v4.1 + ADR-33…35；空挥闸按 O1 空间闸补记） |
| O2 渲染 | `claude-opus-5-thinking-high-fast` | `bc-164c2bad-45c0-51f0-9bb9-98d50a8065af` | 已派出 |
| O4 壳 | `claude-opus-5-thinking-high-fast` | `bc-3b73fda9-42bc-5fba-ae6e-2ab33ced6c5c` | 已合入 `cursor/yizhang-hub-r2-o4-shell-db8d`（pitch 喂入、再来一局≠回安全区、皮肤真表选择器） |

### Wave 3

| 席位 | 模型 | Agent ID | 状态 |
| --- | --- | --- | --- |
| O3 事件 gloveId | `claude-opus-5-thinking-high-fast` | `bc-dc9f84ad-2799-5b6e-878a-cdb77c163940` | 已合入 `cursor/yizhang-hub-r2-o3-combat-db8d`；父调度补 sim 桥透传 gloveId |
| F2 美术 | `claude-fable-5-thinking-xhigh` | `bc-cb346ed2-5e7a-5891-bad0-882b43b9dac6` | 已派出 |
| G1 单测 | `gpt-5.6-sol-xhigh-fast` | `bc-0d44a383-0d29-5279-97f3-b3d3bf78d03a` | 已合入 `cursor/yizhang-hub-r2-g1-tests-db8d`（tests/round2-hub-contract.test.js 5 条） |

### Wave 4

F4 复验（等前面合入）
