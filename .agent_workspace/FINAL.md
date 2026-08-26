# 超能下蛋鸭 · 三轮编排全局总结

- 目录：`games/chao-neng-xia-dan-ya/`（与其他游戏隔离）
- 分支：`cursor/chao-neng-xia-dan-ya-799d` / 逻辑名 `agent/chao-neng-xia-dan-ya`
- 运行：`cd games/chao-neng-xia-dan-ya && npm install && npm run dev` → http://localhost:4174
- 验收：`npm test` 21/21；`npm run probe` ok；`vite build` 通过
- SOTA：F4 判定 **L1 可玩基线**；L2 未达

## 玩法

重力弹球 + 禽类卡牌肉鸽：滑动瞄准下蛋，反弹连击，18 英雄 / 4 流派 / 24 关，肉鸽、爬塔、讨伐、钓鱼，本地存档 `cnyd-save-v1`。

## 三轮递进

1. Round 1：可玩闭环 + 分模块落地（物理/战斗/养成/数据/视觉/契约/测试）。
2. Round 2：切到上游物理、羁绊/18 英雄口径、真基准、juice 起步。
3. Round 3：effects 单源、确定性、能量对表、L1 复评、测试全绿。

## 操作

拖拽瞄准松开发射；1–9 换英雄；Q 大招；Esc 暂停（不叠层）。
