# games

本目录用于在同一工作仓库中并行放置多款独立游戏。每款游戏独占一个同级子目录，**互不引用、互不覆盖、各自拥有独立的 `package.json` 与开发端口**。

| 目录 | 游戏 | 开发端口 |
| --- | --- | --- |
| `my-garden-world/` | 《我的花园世界》国风花坊 · 模拟经营 | 5173 |
| `linghuashi/` | 《灵画师》绘符施法 · 水墨修仙 | 4173 |
| `chao-neng-xia-dan-ya/` | 《超能下蛋鸭》重力弹球 · 卡牌肉鸽 | 4174 |
| `zhao-yun-adou/` | 《赵云与阿斗》汉字合成 · 水墨塔防 | 4180 |

线上 Pages（项目站再加一级游戏目录，互不抢根）：

| 游戏 | 地址 |
| --- | --- |
| 目录 | https://9997433-bit.github.io/test_repo/ |
| 赵云与阿斗 | https://9997433-bit.github.io/test_repo/zhao-yun-adou/ |
| 兵器王者 | https://9997433-bit.github.io/test_repo/bingqi-wangzhe/ |
| 灵画师 | 源码在 `games/linghuashi/`，发布后走 `/linghuashi/` |
| 超能下蛋鸭 | 源码在 `games/chao-neng-xia-dan-ya/`，发布后走 `/chao-neng-xia-dan-ya/` |
| 我的花园世界 | 源码在 `games/my-garden-world/`，本地 `npm run dev` 走 :5173 |

```bash
cd games/my-garden-world && npm install && npm run dev        # :5173
cd games/chao-neng-xia-dan-ya && npm install && npm run dev   # :4174
cd games/linghuashi && npm install && npm run dev             # :4173
cd games/zhao-yun-adou && npm install && npm run dev          # :4180
```
