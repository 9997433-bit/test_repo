# 兵器王者·炉火

独立目录中的国风放置锻造网页游戏（致敬「兵器王者」类玩法，原创实现）。

## 启动

```bash
# 任意静态服务器，例如：
python3 -m http.server 4173 --directory games/bingqi-wangzhe
```

浏览器打开 `http://127.0.0.1:4173/`。

## 逻辑测试（无浏览器）

```bash
node games/bingqi-wangzhe/tests/run.mjs
node games/bingqi-wangzhe/bench/run.mjs
```

## 目录

见仓库 `.agent_workspace/ARCHITECTURE.md`。
