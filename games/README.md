# games

本目录用于在同一工作仓库中并行放置多款独立游戏。每款游戏独占一个同级子目录，**互不引用、互不覆盖、各自拥有独立的 `package.json` 与开发端口**。

| 目录 | 游戏 | 开发端口 |
| --- | --- | --- |
| `linghuashi/` | 《灵画师》绘符施法 · 水墨修仙 | 4173 |
| `zhao-yun-adou/` | 《赵云与阿斗》汉字合成 · 水墨塔防 | 4180 |

线上 Pages（项目站再加一级游戏目录，互不抢根）：

| 游戏 | 地址 |
| --- | --- |
| 目录 | https://9997433-bit.github.io/test_repo/ |
| 赵云与阿斗 | https://9997433-bit.github.io/test_repo/zhao-yun-adou/ |
| 兵器王者 | https://9997433-bit.github.io/test_repo/bingqi-wangzhe/ |
| 灵画师 | 源码在 `games/linghuashi/`，发布后走 `/linghuashi/` |

启动灵画师：

```bash
cd games/linghuashi
npm install
npm run dev
```

启动赵云与阿斗：

```bash
cd games/zhao-yun-adou
npm install
npm run dev
```
