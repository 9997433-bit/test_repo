# 多游戏编排进度索引

同仓库并行多款游戏。本文件同时保留各任务简报入口，互不覆盖业务代码。

| 游戏 | 目录 | 端口 | 本轮状态 |
| --- | --- | --- | --- |
| 我的花园世界 | `games/my-garden-world/` | 5173 | Round 1–3 完成，217 测全绿，见 `PROGRESS.my-garden-world.md` |
| 超能下蛋鸭 | `games/chao-neng-xia-dan-ya/` | 4174 | Round 1–3 完成，L1，待合入 main |
| 灵画师 | `games/linghuashi/` | 4173 | Round 1–3 完成（见下文归档） |
| 赵云与阿斗 | `games/zhao-yun-adou/` | 4180 | 见 `round1/BRIEF.md` / `round2/BRIEF.md` 附录 |
| 蘑菇屋·慢生活 | `games/xiangwang-shenghuo/` | 4175 | Round 1–3 完成，58 测 / 1 skip，见 `PROGRESS.xiangwang-shenghuo.md` |
| 时尚百货城 | `games/fashion-mall/` | 4173 | Round 1–3 完成，94 测，见 `PROGRESS.fashion-mall.md` |

---

# 超能下蛋鸭 SOTA 复刻 · 编排进度

- 目标：在独立目录 `games/chao-neng-xia-dan-ya/` 实现《超能下蛋鸭》SOTA 级网页复刻。
- 工作分支：`cursor/chao-neng-xia-dan-ya-799d` / 逻辑名 `agent/chao-neng-xia-dan-ya`
- 模型：fable → `claude-fable-5-thinking-xhigh`；opus-fast → `claude-opus-5-thinking-high-fast`；gpt-sol → `gpt-5.6-sol-xhigh-fast`

| 轮次 | 状态 | 简报 |
| --- | --- | --- |
| Round 1 | 完成 | `round1/BRIEF.md` |
| Round 2 | 完成 | `round2/BRIEF.md` |
| Round 3 | 完成 | `round3/BRIEF.md` · L1 |
| 归档合并 | 进行中 | 与 main 无业务冲突后合入 |

---

# 灵画师 SOTA 复刻（main 已归档）

- 目录：`games/linghuashi/`
- 分支：`cursor/linghuashi-sota-a345`
- Round 1–3 完成。vitest 105/105。详见该游戏目录 `docs/`。
