# games

本目录用于在同一工作仓库中并行放置多款独立游戏。每款游戏独占一个同级子目录，互不引用、互不覆盖，各自拥有独立的 `package.json` 与开发端口。

| 目录 | 游戏 | 开发端口 |
| --- | --- | --- |
| `zaohua-xianfu/` | 《造化仙府》洞府经营 · 修仙放置 | 4174 |
| `zhao-yun-adou/` | 《赵云与阿斗》汉字合成 · 水墨塔防 | 4180 |
| `linghuashi/` | 《灵画师》 | 4173 |
| `bingqi-wangzhe/` | 《兵器王者》 | — |

```bash
cd games/zaohua-xianfu && npm install && npm run dev
```
