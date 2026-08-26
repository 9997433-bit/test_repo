# 异掌 · 文件所有权（每轮 10 代理，写路径不重叠）

游戏根：`games/yizhang/`  
父分支：`cursor/yizhang-db8d`（逻辑名 `agent/yizhang`）  
基座分支：本父分支。子代理只提交自己的可写路径。

共享只读（需改时只追加、先在简报声明）：`package.json`, `vite.config.js`, `README.md`, `.gitignore`

禁止：改 `games/` 下其他游戏、改仓库根业务、引入账号/后端/付费、下载版权素材、静默更换模型。

| 角色 | 模型 slug | 可写路径 |
| --- | --- | --- |
| Fable-1 架构 | `claude-fable-5-thinking-xhigh` | `games/yizhang/docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/OWNERSHIP.md` |
| Fable-2 美术 UX | `claude-fable-5-thinking-xhigh` | `games/yizhang/docs/ART_DIRECTION.md`, `src/styles/**` |
| Fable-3 玩法数值 | `claude-fable-5-thinking-xhigh` | `games/yizhang/docs/GDD.md`, `src/data/**` |
| Fable-4 SOTA 验收 | `claude-fable-5-thinking-xhigh` | `games/yizhang/docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` |
| Opus-1 模拟物理 | `claude-opus-5-thinking-high-fast` | `games/yizhang/src/sim/**` |
| Opus-2 WebGL 渲染 | `claude-opus-5-thinking-high-fast` | `games/yizhang/src/render/**` |
| Opus-3 技能与 Bot | `claude-opus-5-thinking-high-fast` | `games/yizhang/src/ai/**`, `src/combat/**` |
| Opus-4 主循环 UI 输入 | `claude-opus-5-thinking-high-fast` | `games/yizhang/src/ui/**`, `src/core/**`, `src/input/**`, `src/audio/**`, `src/main.js`, `index.html` |
| GPT-sol-1 单测 | `gpt-5.6-sol-xhigh-fast` | `games/yizhang/tests/**` |
| GPT-sol-2 探针基准 | `gpt-5.6-sol-xhigh-fast` | `games/yizhang/scripts/**` |

输出首行必须声明实际使用的模型 slug。严禁静默降级。
