# 架构

独立 Vite + 原生 ES Module，零 UI 框架。便于卡通海面全控与单测直接打纯函数。

开发端口 **4174**（避免与同仓库其他游戏 4173 冲突）。

```
src/main.js          启动、路由、存档水合
src/core/            状态仓库、时钟、事件、存档、RNG
src/world/           木筏网格、建筑、天气、居民需求
src/explore/         拾荒、钓鱼、潜水
src/heroes/          招募、星级、委任
src/combat/          自动战棋、技能、AI
src/ui/              屏：启航、木筏、建造、探索、英雄、关卡、结算
src/data/            静态表（建筑、英雄、关卡、鱼、天气）
src/styles/          设计令牌与夏日废海皮肤
src/audio/           WebAudio 海浪/木槌/气泡（可静音）
```

## 状态

单一 `createStore` ，更新用不可变补丁。所有规则（建造合法性、战斗、钓鱼判定、潜水氧气）必须是可单测纯函数。DOM 只允许出现在 `ui/` 与 `world/canvas.js`。

## 时钟

`engine.tick(dt, store)` 推进：生产、饥饿、天气、自动拾荒船、离线补算。`dt` 单位秒。加速档 1x / 2x / 4x。

## 隔离

本包是 `games/crazy-water-world` 的独立 npm 工程。禁止 import 仓库根或其他 `games/*`。
