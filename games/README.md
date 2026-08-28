# games

本目录用于在同一工作仓库中并行放置多款独立游戏。每款游戏独占一个同级子目录，**互不引用、互不覆盖、各自拥有独立的 `package.json` 与开发端口**。

| 目录 | 游戏 | 开发端口 |
| --- | --- | --- |
| `my-garden-world/` | 《我的花园世界》国风花坊 · 模拟经营 | 5173 |
| `linghuashi/` | 《灵画师》绘符施法 · 水墨修仙 | 4173 |
| `chao-neng-xia-dan-ya/` | 《超能下蛋鸭》重力弹球 · 卡牌肉鸽 | 4174 |
| `xiangwang-shenghuo/` | 《蘑菇屋·慢生活》向往的生活同构田园经营 | 4175 |
| `zhao-yun-adou/` | 《赵云与阿斗》汉字合成 · 水墨塔防 | 4180 |
| `sanguo-ice-age/` | 《三国：冰河时代》极寒城建 · 武将 SLG | 4176 |
| `yizhang/` | 《异掌》WebGL 浮空擂台 · 双掌扇击 | 4181 |
| `shihe-yaosai/` | 《蚀核要塞》立体环轨塔防 · Babylon.js WebGPU | 4182 |

线上 Pages（项目站再加一级游戏目录，互不抢根）：

| 游戏 | 地址 |
| --- | --- |
| 目录 | https://9997433-bit.github.io/test_repo/ |
| 我的花园世界 | https://9997433-bit.github.io/test_repo/my-garden-world/ |
| 超能下蛋鸭 | https://9997433-bit.github.io/test_repo/chao-neng-xia-dan-ya/ |
| 灵画师 | https://9997433-bit.github.io/test_repo/linghuashi/ |
| 赵云与阿斗 | https://9997433-bit.github.io/test_repo/zhao-yun-adou/ |
| 造化仙府 | https://9997433-bit.github.io/test_repo/zaohua-xianfu/ |
| 兵器王者 | https://9997433-bit.github.io/test_repo/bingqi-wangzhe/ |
| 边境要塞塔防 | https://9997433-bit.github.io/test_repo/warcraft3-td/ |
| 三国：冰河时代 | https://9997433-bit.github.io/test_repo/sanguo-ice-age/ |
| 异掌 | https://9997433-bit.github.io/test_repo/yizhang/ |
| 蚀核要塞 | 源码在 `games/shihe-yaosai/`，本地 `npm run dev` 走 :4182 |
| 蘑菇屋·慢生活 | 源码在 `games/xiangwang-shenghuo/`，本地 `npm run dev` 走 :4175 |

```bash
cd games/my-garden-world && npm install && npm run dev        # :5173
cd games/chao-neng-xia-dan-ya && npm install && npm run dev   # :4174
cd games/linghuashi && npm install && npm run dev             # :4173
cd games/xiangwang-shenghuo && npm install && npm run dev     # :4175
cd games/zhao-yun-adou && npm install && npm run dev          # :4180
cd games/sanguo-ice-age && npm start                          # :4176
cd games/yizhang && npm install && npm run dev                # :4181
cd games/shihe-yaosai && npm install && npm run dev           # :4182
```
