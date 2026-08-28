# 蚀核要塞 · 文件所有权（每轮 10 代理，写路径不重叠）

游戏根：`games/shihe-yaosai/`  
父分支：`cursor/shihe-yaosai-f69e`（逻辑名 `agent/shihe-yaosai`）  
基座分支：本父分支。子代理只提交 / 只改自己的可写路径。

共享只读（需改时只追加依赖、先在简报声明）：`package.json`, `vite.config.js`, `README.md`, `.gitignore`

禁止：改 `games/` 下其他游戏、改仓库根业务、引入账号/后端/付费、下载版权素材、静默更换模型。

| 角色 | 模型 slug | 可写路径 |
| --- | --- | --- |
| Fable-1 架构 | `claude-fable-5-thinking-xhigh` | `games/shihe-yaosai/docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md` |
| Fable-2 美术 UX | `claude-fable-5-thinking-xhigh` | `games/shihe-yaosai/docs/ART_DIRECTION.md`, `src/styles/**` |
| Fable-3 玩法数值 | `claude-fable-5-thinking-xhigh` | `games/shihe-yaosai/docs/GDD.md`, `src/data/**` |
| Fable-4 SOTA 验收 | `claude-fable-5-thinking-xhigh` | `games/shihe-yaosai/docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` |
| Opus-1 引擎启动 | `claude-opus-5-thinking-high-fast` | `games/shihe-yaosai/src/engine/**`, `src/main.js` |
| Opus-2 世界场景 | `claude-opus-5-thinking-high-fast` | `games/shihe-yaosai/src/world/**` |
| Opus-3 模拟战斗 | `claude-opus-5-thinking-high-fast` | `games/shihe-yaosai/src/sim/**`, `src/combat/**` |
| Opus-4 循环 UI | `claude-opus-5-thinking-high-fast` | `games/shihe-yaosai/src/ui/**`, `src/input/**`, `index.html` |
| GPT-sol-1 单测 | `gpt-5.6-sol-xhigh-fast` | `games/shihe-yaosai/tests/**` |
| GPT-sol-2 探针基准 | `gpt-5.6-sol-xhigh-fast` | `games/shihe-yaosai/scripts/**` |

输出首行必须声明实际使用的模型 slug。严禁静默降级。

本地子代理：**不要 git commit / push**（父调度器统一提交）。  
云端子代理：只 commit 自己的可写路径，push 到自己的云端分支，不要改 pages workflow。
