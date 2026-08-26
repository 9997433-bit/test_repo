# 架构

独立 Vite + 原生 ES Module，零框架，便于水墨视觉全控与单测直接测纯函数。

```
src/main.js          启动、路由、存档水合
src/core/            状态、事件、时钟、存档
src/drawing/         画布、墨迹、识别、伪压感
src/combat/          回合/实时混合战斗、AI、元素
src/classes/         职业修正、天赋
src/progression/     境界、背包、灵兽、挂机
src/ui/              屏：入卷、选职、枢纽、战斗、结算、画阁
src/data/            静态表
src/styles/          设计令牌与水墨皮肤
src/audio/           WebAudio 笔锋/锣鼓（可静音）
```

状态为单一 `createStore` 不可变补丁。战斗与识别必须是可单测纯函数，DOM 只在 `ui/` 与 `drawing/canvas.js`。
