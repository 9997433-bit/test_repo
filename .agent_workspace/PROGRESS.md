# 灵画师 SOTA 复刻 · 编排进度

- 目标：在独立目录 `games/linghuashi/` 实现《灵画师》SOTA 级网页复刻（以笔绘符、水墨国风、职业克制、养成与挂机）。
- 隔离原因：同仓库后续还会跑其他游戏，禁止污染仓库根目录业务代码。
- 工作分支：`cursor/linghuashi-sota-a345`（系统前缀） / 逻辑名 `agent/linghuashi`
- 模型映射（严禁静默降级）：
  - fable → `claude-fable-5-thinking-xhigh`
  - opus-fast → `claude-opus-5-thinking-high-fast`
  - gpt-sol → `gpt-5.6-sol-xhigh-fast`

## 文件所有权（并发防冲突）

| 角色 | 模型 | 可写路径 |
| --- | --- | --- |
| Fable-1 架构 | fable | `games/linghuashi/docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md` |
| Fable-2 美术 UX | fable | `games/linghuashi/docs/ART_DIRECTION.md`, `src/styles/**` |
| Fable-3 玩法数值 | fable | `games/linghuashi/docs/GDD.md`, `src/data/**` |
| Fable-4 SOTA 验收 | fable | `games/linghuashi/docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` |
| Opus-1 绘符引擎 | opus-fast | `games/linghuashi/src/drawing/**` |
| Opus-2 战斗系统 | opus-fast | `games/linghuashi/src/combat/**` |
| Opus-3 养成职业 | opus-fast | `games/linghuashi/src/progression/**`, `src/classes/**` |
| Opus-4 UI 与主循环 | opus-fast | `games/linghuashi/src/ui/**`, `src/core/**`, `src/main.js`, `index.html` |
| GPT-sol-1 单测探针 | gpt-sol | `games/linghuashi/tests/**` |
| GPT-sol-2 基准脚本 | gpt-sol | `games/linghuashi/scripts/**` |

共享只读：`package.json`, `vite.config.js`, `docs/OWNERSHIP.md`。需要改共享文件时只追加、不删他人段落，并在本文件记录。

## Round 状态

- Round 1：完成（垂直切片脚手架）
- Round 2：完成（SOTA 打磨，本轮由 fable 单代理完成，覆盖原全部所有权路径）
- Round 3：未开始

## 结论简报

### Round 2（claude-fable-5-thinking-xhigh）

补齐硬缺口并全部测试跑绿（70 tests / probe / bench / build）：

- 教程：`ui/tutorial.js` 状态机 + 画布引导虚线（`setGuide`），键盘可走完（UI 冒烟测试覆盖）
- 键盘施法：`drawing/templates.js` 六式模板 → 同一识别管线；legend 按钮 + 1–6 热键 + Esc
- 天赋/灵兽接战斗：`combat/mods.js`（伤害/护盾/治疗/控制/暴击/闪避/回灵/开盾）
- tick 可靠：`core/loop.js` 固定步长累加器；battle.tick 用 while-gauge，出手次数对任意 dt 守恒
- 画阁回放：`drawing/replay.js` 归一化 32 点存档 + 画布回放动画
- 墨客解锁：`progression/unlock.js` 六式精度 ≥60%（strokeStats 历史最佳），择业第七席 + 洞府感召
- 无障碍：progressbar/log(aria-live)/radiogroup、焦点管理、focus-visible、减少动效双通道
- 关卡：10 关顺序解锁 + 敌特性（swift/armored/enrage/regen/spiky）+ 意图电报 + Boss
- 视觉：远山墨影、enso、印章敌影、飘字/连击、教程条、胜败印章、分色日志
- 存档 v2 迁移（v1 画阁反推六式精度），焚卷重修

剩余缺口（Round 3 候选）：真实移动端触感调优、音频层扩展（锣鼓/环境）、
灵兽合成洗练、更多五行反应组合、战斗回放（整场）、云存档。
