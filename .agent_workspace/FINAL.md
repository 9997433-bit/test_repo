# 异掌 · 三轮编排全局总结

- 目录：`games/yizhang/`（与其他游戏隔离，端口 **4181**）
- 逻辑分支：`agent/yizhang` · 工作分支：`cursor/yizhang-db8d`
- 父 PR：https://github.com/9997433-bit/test_repo/pull/20
- 模型：fable=`claude-fable-5-thinking-xhigh` · opus-fast=`claude-opus-5-thinking-high-fast` · gpt-sol=`gpt-5.6-sol-xhigh-fast`（未降级）
- 运行：`cd games/yizhang && npm install && npm run dev` → http://localhost:4181
- 验收：`npm test` **197/197**；`npm run probe` PASS（kills≥1，`wiredCombat:true`）；`vite build` 通过
- SOTA：可玩闭环 + 触控壳 + 风格化底座 B；低档关 bloom；零 Google Fonts CDN（src）

## 玩法

第三人称 WebGL 浮空擂台。选主掌+副掌，扇击积掌意，E 技能 / Q 换掌，把对手打出裂岛。8 原创手套，3 人格 Bot，台面可碎。键鼠与手机/平板触控一等公民。

## 三轮递进

1. Round 1：10 云端并行，文档+sim+Three+combat+壳+测，91/97，probe 2 kills。人类 id 分裂。
2. Round 2：统一 p0、yaw=-Z、静态接线、方格碎地、F2 HUD。145/152。
3. Round 3：Bot 朝向、技能别名、低档无 bloom、去 CDN、探针真 combat。父调度收口 wiring 测 → **197/197**。Pages 路径 `/yizhang/` 已写入 workflow。

## 操作

WASD 移动，鼠标转向，左键扇，E 技能，Q 换掌，Shift 冲刺，空格跳。触屏：左摇杆、右拖视角、右下扇击。
