# 编排进度索引

- 《灵画师》：本文
- 《赵云与阿斗》：见 `PROGRESS.zhao-yun-adou.md`

# 灵画师 SOTA 复刻 · 编排进度

- 目标：在独立目录 `games/linghuashi/` 实现《灵画师》SOTA 级网页复刻。
- 工作分支：`cursor/linghuashi-sota-a345`
- 模型映射：fable → `claude-fable-5-thinking-xhigh` ；opus-fast → `claude-opus-5-thinking-high-fast` ；gpt-sol → `gpt-5.6-sol-xhigh-fast`
- 云端主攻（并行）：`bc-8f66b071-b7bd-58b0-9ed4-e7ae828ed9be`（不阻塞本分支循环）

## Round 状态

- Round 1：完成（10/10 本地 + 1 云端在途）
- Round 2：完成
- Round 3：完成

---

## 《Round 1 结论简报》

### 已实现功能

- 独立目录 Vite 游戏：绘符施法、六职业 + 隐线墨客、五行、秘境、挂机、画阁、天赋、灵兽。
- 识别器重写（features/synth）：人手化扰动集约 99.58%；轴对齐直线 900/900。
- 战斗：累计冷却 tick、modifiers、连击、控制冻结冷却；UI 已传入 talent/beast。
- 养成：idle 幂等、`unlockMo` 六式种数、`battleModifiers`、灵兽合成/洗练。
- UI：六屏拆分、教程、键盘 1–6、静音开关、painter 复用、胜负只结算一次。
- 视觉：宣纸立轴/手卷、朱砂印、reduced-motion、焦点环。
- 数据：原 5 关保留 + 新增 8 敌 8 关；克制环闭环。
- 门禁：vitest 20、probe/bench 绿（识别 p95≈0.16ms，3000 合成轨迹 0 误识别）。

### 遗留缺陷

- 乱涂软误报（zigzag/cloud）仍偏高；硬误报线/圆/螺旋已低。
- `battleModifiers` 扁平字段与 UI 嵌套 `talent/beast` 两套，缺契约单测。
- 画阁只存 type/precision，不能回放真实笔迹。
- 音频仅振荡器短音；mute 只挡 `playStroke`。
- `ui.css` 硬编码旧纸色，与 tokens 有一帧 flash 色差。
- 无 History 路由；战斗刷新回枢纽。
- 字体走 Google Fonts，离线回退损手书气质。
- `buns` 几乎无消耗出口；破甲对精度不敏感。
- 契约测试 `contract.test.js` 未落地；乱涂误爆未进 bench 红线。
- 根目录残留未跟踪 `package-lock.json`，勿提交。

### 性能瓶颈

- 识别/战斗 CPU 余量充足；60fps 墨迹无实机 rAF 实证。
- 非战斗屏整页 innerHTML 重建；节点少时尚可。
- 大 dt 补刀已有 64 次上限，需防挂机页签回来被秒的手感文案。

### 下轮攻坚重点（Round 2）

1. 结算抽纯函数 + `tests/contract.test.js`（胜利停留 3s xp 不变）。
2. 乱涂误爆 <5% 写入 bench；synth 金标准单一来源。
3. 画阁回放 raw 点列；墨客解锁只走 `unlockMo`。
4. 音频总线真正吃 mute；ui.css 令牌化对齐美术。
5. 破甲/控制随精度；包子作收兽成本。
6. 无障碍与键盘通关教程的自动化探针。
7. README/GDD/清单与实现对齐。
8. 边界：坏档、连点施法、pointercancel、多指。

---

## 《Round 2 结论简报》

### 演进对比（相对 Round 1）

- 乱涂硬误报降至 **0%**（400 样本），合成轨迹仍 3000/3000。
- 画阁写入 raw 点列并可回放；旧档回退标准字形。
- 音频总线全局 mute；`ui.css` 令牌化，cast-flash 无跳色。
- 破甲改为 `0.04+0.12×精度`；收兽消耗包子。
- `settleBattle`/`beginBattle` 已接入战斗屏；`reaction.crit`（金雷引）计入暴击。
- 契约 / 画阁 / 音频测试补齐，vitest **62** 绿。
- 灵兽 `PASSIVE_BASE`/`PASSIVES` 补齐，避免洗练崩溃。

### 潜在边界风险

- synth / templates / trajectories 三套轨迹未合一。
- `combat/mods.js` 与 `battleModifiers` 旁路仍在。
- 存档无 version migrate；靠 sanitize 容错。
- pointer+touch 双栈、真机 60fps、减动效开关仍弱。
- 控制时长对精度偏钝；三栏异种无放生 UI。

### SOTA 验收差距

- 契约文档大体对齐，仍有死代码。
- 无 History 路由、无离线字体。
- 乱涂门禁未把 cloud 治疗算进硬误报。
- Round 3 必收：单一轨迹源、migrate、删死代码、放生/合成 UI、全盘交叉核验、README 对齐。

---

## 《Round 3 最终结论》

SOTA 网页复刻有条件通过（自动化 P0 清零）。

- 轨迹金标准合一到 `synth.js`；乱涂硬误报含 cloud，实测 2%。
- 存档 v2 migrate + `.bak`；`releaseBeast` + 枢纽灵兽栏。
- `mods.js` 已删；控制 `500+1100×精度`；pointercancel 丢弃；减动效开关。
- 文档 README/GDD/契约/清单对齐实现。
- 门禁：vitest **105/105**，probe/bench 绿，识别 p95≈0.14ms。

剩余 P1：真机 60fps 未录；根目录勿提交 `package-lock.json`。
