# 超能下蛋鸭 · 架构与所有权契约

## 技术栈

- 运行时：Vite 6 + 原生 ESM JavaScript（禁止 React/Vue，保持与同仓库其他游戏一致的轻量风格）
- 渲染：Canvas 2D 主战场 + DOM HUD
- 物理：自研 2D 圆刚体（蛋）+ 线段/AABB 静态体（墙、砖、钉、斜面），固定时间步 1/120s，渲染插值
- 测试：Vitest + 纯函数单测
- 探针：`scripts/probe.mjs` / `scripts/bench.mjs`
- 存档：`localStorage` key `cnyd-save-v1`
- 端口：开发 `4174`（避免与灵画师 4173 冲突）

## 目录

```
games/chao-neng-xia-dan-ya/
  index.html
  package.json
  vite.config.js
  docs/                 # GDD / 架构 / 美术 / SOTA / 契约
  src/core/             # 引擎循环、事件、存档
  src/physics/          # 世界、碰撞、弹道预测
  src/combat/           # 伤害、连击、元素、技能结算
  src/heroes/           # 英雄运行时、技能释放
  src/data/             # 静态表：英雄、关卡、敌人、羁绊、道具
  src/progression/      # 升级、碎片、金币、图鉴
  src/modes/            # 冒险、肉鸽、爬塔、讨伐、钓鱼
  src/ui/               # 屏幕、HUD、瞄准 UI
  src/audio/            # 合成音效（无外部音频资产）
  src/styles/           # tokens / layout / fx
  tests/
  scripts/
```

## 文件所有权（每轮 10 代理）

| 角色 | 模型 slug | 可写路径 |
| --- | --- | --- |
| Fable-1 架构 | `claude-fable-5-thinking-xhigh` | `games/chao-neng-xia-dan-ya/docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/OWNERSHIP.md` |
| Fable-2 美术 UX | `claude-fable-5-thinking-xhigh` | `games/chao-neng-xia-dan-ya/docs/ART_DIRECTION.md`, `src/styles/**` |
| Fable-3 玩法数值 | `claude-fable-5-thinking-xhigh` | `games/chao-neng-xia-dan-ya/docs/GDD.md`, `src/data/**` |
| Fable-4 SOTA 验收 | `claude-fable-5-thinking-xhigh` | `games/chao-neng-xia-dan-ya/docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` |
| Opus-1 物理弹道 | `claude-opus-5-thinking-high-fast` | `games/chao-neng-xia-dan-ya/src/physics/**` |
| Opus-2 战斗技能 | `claude-opus-5-thinking-high-fast` | `games/chao-neng-xia-dan-ya/src/combat/**` |
| Opus-3 英雄养成 | `claude-opus-5-thinking-high-fast` | `games/chao-neng-xia-dan-ya/src/heroes/**`, `src/progression/**` |
| Opus-4 UI 主循环 | `claude-opus-5-thinking-high-fast` | `games/chao-neng-xia-dan-ya/src/ui/**`, `src/core/**`, `src/modes/**`, `src/audio/**`, `src/main.js`, `index.html` |
| GPT-sol-1 单测探针 | `gpt-5.6-sol-xhigh-fast` | `games/chao-neng-xia-dan-ya/tests/**` |
| GPT-sol-2 基准脚本 | `gpt-5.6-sol-xhigh-fast` | `games/chao-neng-xia-dan-ya/scripts/**` |

共享只读（需改时只追加）：`package.json`, `vite.config.js`, `README.md`。

## 模块接口（稳定）

- 物理世界不依赖 DOM；导出 `World`, `predictTrajectory(origin, velocity, world, steps)`。
- 战斗纯函数：`resolveHit(egg, target, ctx) → { damage, effects, comboDelta }`。
- 数据表只导出常量对象，禁止在 `src/data` 写玩法逻辑。
- UI 通过 `core/events` 总线订阅，不直接改物理积分器内部数组。
- 模式层只编排「开战 / 结算 / 选卡」，不重写物理。

## 禁止事项

- 不得在仓库根目录新增游戏业务文件。
- 不得创建或修改 `games/` 下除 `chao-neng-xia-dan-ya/` 以外的游戏目录。
- 不得引入付费墙、账号、后端。
- 不得下载版权素材；角色用 Canvas 矢量绘制。
- 不得静默更换模型。
