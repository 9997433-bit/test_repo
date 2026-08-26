# 超能下蛋鸭 · 文件所有权（Round 1 定稿）

上位契约：`.agent_workspace/ARCHITECTURE.md`（角色 → 目录）。本文件细化到文件粒度并补充边界裁决，冲突时以本文件为准（由 Fable-1 维护）。

## 1. 所有权总表

| 所有者 | 独占可写路径 |
| --- | --- |
| Fable-1 架构 | `docs/ARCHITECTURE.md`、`docs/API_CONTRACT.md`、`docs/OWNERSHIP.md` |
| Fable-2 美术 UX | `docs/ART_DIRECTION.md`、`src/styles/**` |
| Fable-3 玩法数值 | `docs/GDD.md`、`src/data/**` |
| Fable-4 SOTA 验收 | `docs/SOTA_CHECKLIST.md`、`docs/ACCEPTANCE.md` |
| Opus-1 物理弹道 | `src/physics/**` |
| Opus-2 战斗技能 | `src/combat/**` |
| Opus-3 英雄养成 | `src/heroes/**`、`src/progression/**` |
| Opus-4 UI 主循环 | `src/ui/**`、`src/core/**`、`src/modes/**`、`src/audio/**`、`src/main.js`、`index.html` |
| GPT-sol-1 单测探针 | `tests/**`、`scripts/probe.mjs` |
| GPT-sol-2 基准脚本 | `scripts/bench.mjs`、`scripts/` 其余 |

新建文件归属 = 其目录前缀的所有者；不在表内的新目录须先在本文件登记再创建。

## 2. 共享文件（只追加，不删改他人内容）

| 文件 | 规则 |
| --- | --- |
| `package.json` | 只允许追加 scripts / devDependencies；不改既有键 |
| `vite.config.js` | 只追加配置项；端口 4174 冻结 |
| `README.md` | 各自追加小节，不重排他人段落 |
| `.gitignore` | 只追加 |

## 3. 边界裁决（Round 1 已出现的灰区，就此定案）

1. **`src/core/rng.js`**：属 Opus-4 目录，但定位为全层共享底座；API 已在 API_CONTRACT §3 冻结（`createRng`/`hashSeed`）。首个需要者可创建（Round 1 由 O3 先建，视为合规），此后任何人只可追加方法、不得改既有语义。
2. **肉鸽 / 钓鱼逻辑拆分**：`progression/rogue.js`、`progression/fishing.js`（O3）只放**纯公式**（奖池生成、BUFF роll、扫荡收益）；战局编排与状态机在 `modes/**`（O4）。签名边界 = API_CONTRACT §10 / §11。
3. **敌人实体**：物理侧 `kind:'enemy'` 静态体由 O1 提供工厂；敌人 HP/元素状态等战斗实体归 battle 控制器（O4 持有、调用 O2 纯函数结算）；数值定义归 F3（`data/enemies.js`）。
4. **`defaultSave()` 扩展**：O3 落 API_CONTRACT §5.2 新字段时会破坏 `tests/store.test.js` 的 `settings` `toEqual` 断言 —— G1 须在同轮更新该断言（本条即协调通知）。
5. **`heroes/skills/` 实现 vs `combat` 结算**：技能 hook 实现归 O3（heroes 目录），hook 触发时机与 HeroApi 由 O4 的 battle 提供，元素/伤害计算一律回调 O2 的纯函数——三方都不得内联复制对方公式。

## 4. 合并顺序（父编排器执行）

```
data(F3) → physics(O1) → combat(O2) → heroes+progression(O3)
  → core/modes/ui/audio(O4) → styles(F2) → tests(G1) → scripts(G2) → docs(F1/F4)
```

依赖低者先合；每步合并后跑 `npm test` + `npm run probe`，红了先回滚后到者。

## 5. 冲突协议

1. 越权写入 = 合并时整段丢弃，以所有者版本为准；需要别人改文件时，把诉求写进自己分支的 `docs/`（或 PR 描述）由所有者执行。
2. 接口不合 = 以 `docs/API_CONTRACT.md` 为准；契约本身有误则先提契约变更（API_CONTRACT §0），Fable-1 仲裁。
3. 共享文件撞行 = 后合并者负责手工归并，保留双方追加内容。
