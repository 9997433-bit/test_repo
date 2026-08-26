# games

本目录用于在同一工作仓库中并行放置多款独立游戏。每款游戏独占一个同级子目录，互不引用、互不覆盖，各自拥有独立的 `package.json` 与开发端口。

| 目录 | 游戏 | 开发端口 |
| --- | --- | --- |
| `zaohua-xianfu/` | 《造化仙府》洞府经营 · 修仙放置 | 4174 |
| `zhao-yun-adou/` | 《赵云与阿斗》汉字合成 · 水墨塔防 | 4180 |
| `linghuashi/` | 《灵画师》 | 4173 |
| `bingqi-wangzhe/` | 《兵器王者》 | — |

本地：

```bash
cd games/zaohua-xianfu && npm install && npm run dev
```

GitHub Pages 按游戏分子路径，互不覆盖：

- 目录页：`https://<user>.github.io/<repo>/`
- 造化仙府：`https://<user>.github.io/<repo>/zaohua-xianfu/`
- 赵云与阿斗：`https://<user>.github.io/<repo>/zhao-yun-adou/`
