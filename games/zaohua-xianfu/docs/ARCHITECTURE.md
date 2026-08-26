# 造化仙府 · 架构

## 隔离

- 根：`games/zaohua-xianfu/`
- 禁止改仓库根业务文件；禁止引用其他 `games/*` 源码
- 端口 4174

## 分层

```
ui/          渲染与输入（无数值公式）
core/        时钟、存档、事件、不可变式状态补丁
mansion/     地块、邻接、产量
disciples/   招募、派遣、训练
combat/      自动战、塔、兽潮、法器触发
progression/ 境界与突破
data/        纯数据表（无副作用）
```

## 状态

单一 `store`：`get()` / `dispatch(action)` / `subscribe`。  
所有写操作走 action → reducer 风格补丁，便于单测时间旅行。

## 时钟

`engine` 以 `requestAnimationFrame` 驱动渲染，逻辑 tick 固定 `100ms`。  
离线：`min(elapsed, 8h)` 按建筑产量结算，不模拟逐帧战斗。

## 存档

`localStorage["zaohua-xianfu-v1"]`，schemaVersion=1。损坏则回退默认档并记 `saveCorrupt` 事件。

## 战斗

纯函数 `simulate(seed, sideA, sideB, artifacts, maxTicks)`。  
UI 只回放 `frames[]`。测试可对同一 seed 断言确定性。
