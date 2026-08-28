# 蚀核要塞 · 任务目标

独立 3D 环轨塔防，SOTA 级可玩网页成品。  
目录：`games/shihe-yaosai/`（与仓库内其它游戏零引用）。  
端口：**4182**。  
引擎：**Babylon.js 8**（WebGPU 优先，WebGL2 回退）。  
Git 分支：`cursor/shihe-yaosai-f69e`（逻辑名 `agent/shihe-yaosai`）。

## 一句话

中央星核 + 外环 24 插座。敌人沿下/中/上三条轨道内冲；玩家铸塔、过载、折射光束，撑过 20 波 + Boss「蚀主」。

## 硬约束

- 禁止改 `games/` 下其它游戏、禁止改仓库根业务（catalog / pages workflow 由父调度器在 Round 3 接）。
- 禁止引入账号、后端、付费、CDN 运行时、版权素材下载。
- 禁止静默更换模型。输出**首行**必须声明实际使用的模型 slug。
- 画面验收按「桌面 WebGPU 实时」而不是概念海报 1:1。Bloom、曳光、粗光束、过热变色必须有；满屏体积神光 / 电影焦散不做。
- `src/sim/**` 与 `src/data/**` 禁止 import Babylon / DOM。

## 冻结 API（Round 1 全员遵守）

见同目录 `OWNERSHIP.md` 与 `round1/BRIEF.md`。
