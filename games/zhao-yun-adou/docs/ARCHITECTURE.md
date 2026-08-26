# 架构

独立 Vite + 原生 ES Module 网页游戏，无框架，无后端。

```
index.html
src/main.js          启动、绑定、rAF
src/core/            时钟、事件总线、存档、随机
src/data/            纯数据表（兵种/武将/波次/权重）
src/board/           格子、手牌、拖拽合并、拼字、铲子
src/combat/          路线、敌军、投射物、技能、胜负
src/ai/              镜像对手启发式
src/ui/              开局/HUD/结算/教程
src/styles/          水墨视觉 token
src/audio/           WebAudio 合成音效
```

## 运行时状态

单一 `createGame()` 返回可变状态机。关键字段：`phase`, `sides.player|ai`（馒头、心、棋盘、手牌、征兵次数）、`waves`, `projectiles`, `fx`, `seed`。

## 通信

模块经 `src/core/events.js` 发布：`recruit`, `merge`, `hero-awaken`, `leak`, `kill`, `skill`, `game-over`。UI 只订阅，不改规则。

## 隔离

开发端口 **4180**，不得占用 4173。所有资源相对路径 `base: './'`。
