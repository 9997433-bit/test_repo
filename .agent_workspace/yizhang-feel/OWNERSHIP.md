# 异掌内容轮 · 文件所有权（打击感 / 故事线 / 手套里程碑）

父分支：**`cursor/yizhang-feel-db8d`**（逻辑名 `agent/yizhang-feel`，从 `origin/main` @ `7ba11f1` 快进）。所有子 PR 打向它，不是 `main`。  
编排真源副本：`.agent_workspace/yizhang-look/round5/OWNERSHIP.md`（与本文同步；冲突以 look/round5 为准）。  
输出**首行**必须是：`MODEL_SLUG: <实际 slug>`。严禁静默降级。

R1–3（键鼠回正 / 皮肤 / 每掌 VFX / hit-stop）已合入 main（PR #21）。本文件改为**内容轮**十席。

游戏根：`games/yizhang/`。写路径互不重叠。禁止复制第二份游戏目录。

| 席 | slug | 分支 | 可写（相对 `games/yizhang/`） | 主攻 | 禁区 |
| --- | --- | --- | --- | --- | --- |
| F1 数据 | `claude-fable-5-thinking-xhigh` | `cursor/yizhang-p2-f1-db8d` | `src/data/gloves.js`、`src/data/unlocks.js`、`src/data/story.js`（新建）、`src/data/index.js`（只再导出）、`src/core/storage.js` + `storage.test.js`、`docs/API_CONTRACT.md`（只追加 SaveV1 stats / story 表 / 4 掌 id） | 表尾 +4（铁茧/渡鸦/常胜/不倒）；skillId 只用现词表；`scope:"career"`；stats 扩 `totalSlapHits`/`portalCrossings`；`story.js` 5 拍表 | 不动 `main.js`；不改 `hub.js`/`skills.js`；不改 sim/combat/render/ui |
| F2 HUD | `claude-fable-5-thinking-xhigh` | `cursor/yizhang-p2-f2-db8d` | `src/ui/**` | 击退累积可视、准星≤120ms 命中脉冲、掌语字条排队、里程碑「237/300」 | 只 `src/ui/**` |
| F3 GDD | `claude-fable-5-thinking-xhigh` | `cursor/yizhang-p2-f3-db8d` | `docs/GDD.md`（掌语视觉若需 + `docs/ART_DIRECTION.md` 一节） | 故事 5 拍定稿、手套里程碑、stun 0.32 | 不改 `src/**`；不改 SOTA/ACCEPTANCE |
| F4 终验 | `claude-fable-5-thinking-xhigh` | `cursor/yizhang-p2-f4-db8d` | `docs/SOTA_CHECKLIST.md`、`docs/ACCEPTANCE.md` | 等其它合入后签字 | 不改实现；不抢先合入 |
| O1 sim | `claude-opus-5-thinking-high-fast` | `cursor/yizhang-p2-o1-db8d` | `src/sim/**` | `tickTimers` 恢复 `invulnT` 递减（或明确只一处减）。重生/过门后 `invulnTime+ε` 可被打中 | 不要两边都减；不改 combat 文件 |
| O2 render | `claude-opus-5-thinking-high-fast` | `cursor/yizhang-p2-o2-db8d` | `src/render/**`；`src/data/vfx.js` 仅追加 4 新掌键 | `slapStart` 起动画；hit 与 slap 不要二次 `playSlap`；相机冲击在 clamp 内上调；4 掌 VFX 真表 | 不扩 8 座走道；不改 `HIT_STOP.max` |
| O3 combat | `claude-opus-5-thinking-high-fast` | `cursor/yizhang-p2-o3-db8d` | `src/combat/**`、`src/ai/**`；`src/core/juice.js` 仅 `HIT_STOP.heavyPower`（16→12） | `landHit` 下发 stun（0.32）；heavyPower 对齐 12；`HIT_STOP.max` 不动 | 不改 `HIT_STOP.max`；不在 statuses 再减 `invulnT` |
| O4 壳 | `claude-opus-5-thinking-high-fast` | `cursor/yizhang-p2-o4-db8d` | `src/main.js`、`src/core/**`（除 `storage.js`）、`src/input/**`、`src/audio/**`、`index.html` | story 分派 + `recordMatch` 计数 + career 解锁（先 record 再判定）；结算 `storyText`；`portalCrossings` | 不改 `src/ui/**`；不改 `storage.js` 字段名 |
| G1 测试 | `gpt-5.6-sol-xhigh-fast` | `cursor/yizhang-p2-g1-db8d` | `tests/**`、本轮新 `*.test.js` | invuln 衰减、stun、story skipHub 不挡、career 解锁 | 不改产品实现去消红 |
| G2 probe | `gpt-5.6-sol-xhigh-fast` | `cursor/yizhang-p2-g2-db8d` | `scripts/**` | 重生后可命中；过门无敌会结束 | 不改产品数值 |

## 红线

- `RENDER_YAW_OFFSET = 0`。`HIT_STOP.max` 不动。再来一局 ≠ 回安全区。8 座走道本轮不扩（新掌 2D）。`lookMode` 缺省 locked。
- 无血条。禁止官方手套名 / 方块人。禁止第四套朝向。
- 子代理不要 `gh pr merge` / 不要打向 `main`。
- 云端同时最多 3 个新 VM。

派发与 5 拍挂点见 `.agent_workspace/yizhang-look/round5/DISPATCH.md`。
