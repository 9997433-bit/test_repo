# 灵画师 SOTA 复刻 · 编排进度

- 目标：在独立目录 `games/linghuashi/` 实现《灵画师》SOTA 级网页复刻。
- 工作分支：`cursor/linghuashi-sota-a345`
- 模型映射：fable → `claude-fable-5-thinking-xhigh` ；opus-fast → `claude-opus-5-thinking-high-fast` ；gpt-sol → `gpt-5.6-sol-xhigh-fast`
- 云端主攻（并行）：`bc-8f66b071-b7bd-58b0-9ed4-e7ae828ed9be`（不阻塞本分支循环）

## Round 状态

- Round 1：完成（10/10 本地 + 1 云端在途）
- Round 2：进行中
- Round 3：未开始

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
