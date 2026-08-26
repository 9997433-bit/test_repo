# 《Round 2 结论简报》· 超能下蛋鸭

10/10 已回收并合入 `cursor/chao-neng-xia-dan-ya-799d`。

## 演进对比（相对 Round 1）

| 缺口 | Round 1 | Round 2 |
| --- | --- | --- |
| 双物理 | 战斗走 `core/sim.js` | O4 切到 `src/physics`，预测/实弹误差 0 |
| BONDS | combat 读不到 | F3 别名 + O2 主读 SYNERGIES |
| 18/20 英雄 | 口径分裂 | 统一 18 + 2 预留 |
| 红测 | combat 3 红 | G1 按真实契约改断言 |
| 基准 | 空脚手架无效 | G2 真物理 p99 ≪ 4ms |
| 手感 | 清单未接 | F2 juice + O4 停顿/震屏/连击音高/准星 |

F4 当时重评未达 L1（O4 尚未合入）。Round 3 已复评为 L1。

---

# 附录 · 赵云与阿斗 Round 2

父分支：`cursor/zhao-yun-adou-673d`  
游戏根：`games/zhao-yun-adou/` 端口 4180  
冲刺：juice 单轨、`rollRecruit` 序列化、强制教程、系统字体回退、测试保持绿。
