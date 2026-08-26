# 验收标准

1. `cd games/zaohua-xianfu && npm test` 退出码 0。
2. `npm run probe` 报告模块导出齐全、端口契约 4174。
3. `npm run bench` 给出产量与 200 场战斗耗时，战斗 simulate 200 场 < 800ms（单核参考）。
4. 浏览器打开 `/`：能选阵营、建一座灵田、打过塔第 1 层、看到资源上涨。
5. 文档与实现字段名一致（qi/herb/wood/ore/stone/pills/jade）。
