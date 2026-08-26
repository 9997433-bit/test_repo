# 多游戏编排索引

同仓库并行多款游戏，进度分节记录。模型映射统一：

- fable → `claude-fable-5-thinking-xhigh`
- opus-fast → `claude-opus-5-thinking-high-fast`
- gpt-sol → `gpt-5.6-sol-xhigh-fast`

---

# 造化仙府 SOTA 复刻 · 编排进度

- 目标：在独立目录 `games/zaohua-xianfu/` 实现《造化仙府》SOTA 级网页复刻（洞府经营 + 弟子养成 + 人/神/魔阵营战斗 + 登天塔/兽潮 + 法器 + 放置挂机）。
- 工作分支：`cursor/zaohua-xianfu-e1bf` / 逻辑名 `agent/zaohua-xianfu`
- 开发端口：`4174`

## 文件所有权

| 角色 | 可写路径 |
| --- | --- |
| Fable-1 | `games/zaohua-xianfu/docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md` |
| Fable-2 | `games/zaohua-xianfu/docs/ART_DIRECTION.md`, `src/styles/**` |
| Fable-3 | `games/zaohua-xianfu/docs/GDD.md`, `src/data/**` |
| Fable-4 | `games/zaohua-xianfu/docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` |
| Opus-1 | `games/zaohua-xianfu/src/core/**`, `src/main.js` |
| Opus-2 | `games/zaohua-xianfu/src/mansion/**` |
| Opus-3 | `games/zaohua-xianfu/src/combat/**`, `src/progression/**` |
| Opus-4 | `games/zaohua-xianfu/src/ui/**`, `src/disciples/**`, `index.html` |
| GPT-sol-1 | `games/zaohua-xianfu/tests/**` |
| GPT-sol-2 | `games/zaohua-xianfu/scripts/**` |

## Round 状态

- Round 1–3：已完成。见 `ROUND1_BRIEF.md` / `ROUND2_BRIEF.md` / `ROUND3_BRIEF.md`。

---

# 赵云与阿斗 SOTA 复刻 · 编排进度

- 目标：独立目录 `games/zhao-yun-adou/`（《赵云与阿斗》汉字合成 + 水墨塔防）。
- 工作分支：`cursor/zhao-yun-adou-673d` / 逻辑名 `agent/zhao-yun-adou`
- 开发端口：`4180`

三轮已回收合入父分支。详见该游戏目录文档；本文件只作索引，避免覆盖造化仙府进度。
