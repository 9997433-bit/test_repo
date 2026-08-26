# 架构（基线）

独立 Vite + 原生 ES Module，零框架。状态可单测，DOM 只在 `src/ui/`。

```
src/main.js                 启动、水合存档、绑定时钟
src/core/                   store / events / engine / save
src/data/                   静态表（作物、动物、配方、建筑、嘉宾、菜谱）
src/systems/farm/           开垦、播种、生长、收获、季节修正
src/systems/production/     工厂队列、畜牧投喂、配方校验
src/systems/village/        心愿、嘉宾、烹饪、人口、摊位、宠物
src/ui/                     场景：村景、蘑菇屋、面板、教程
src/styles/                 设计令牌、四季皮肤、布局
src/audio/                  WebAudio 田园环境音（可静音）
```

## 状态

单一 `createStore(initial)`，`dispatch(type, payload)` 产生不可变补丁。  
所有系统函数签名：`(state, action, nowMs) => patch | nextState`。  
禁止系统模块直接写 DOM。

## 时钟

`engine.tick(dtMs)`：累加游戏分钟；跨日/跨季派发 `day/pass` `season/change`。  
离线：读取 `savedAt`，按上限 8 小时折算挂机产出（饲料消耗、成熟作物）。

## 存档

`localStorage` key：`xwsh.save.v1`。版本迁移写在 `src/core/save.js`。
