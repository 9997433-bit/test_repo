# 异掌 Round 5 · 十席所有权（打击感、故事线与手套里程碑）

父分支：**`cursor/yizhang-feel-db8d`**（从 `main` `7ba11f1` 快进；禁止 force）。  
逻辑名：`agent/yizhang-feel` 内容轮（本目录 = look Round 5 编排真源）。  
子 PR / 合入打向父分支，不是 `main`。  
输出**首行**必须是：`MODEL_SLUG: <实际 slug>`。严禁静默降级。

游戏根：**只改** `games/yizhang/`。  
编排只写 `.agent_workspace/yizhang-look/` 与 `.agent_workspace/yizhang-feel/`（本表之外；编排工人已写本目录）。  
禁止复制第二份游戏目录（禁止 `cp -r games/yizhang …`）。

路径写死、互不重叠。共享只读：`package.json`、`vite.config.js`、`README.md`、`src/data/hub.js`（除非本席表点名）。

## 复盘结论摘要

1. **打不中**：look 没回归。`invulnT` 无人递减，重生 / 过门后永久无敌。命中率 1.9% → 补递减后 46%。
2. **打击感**：通道齐但无「打在人身上」读数。无血条是 GDD 设计；击退累积不可见。受击 stun 从未下发（FJ-04）。前摇无画面；hit + slap 双 `playSlap`。
3. **故事线**：零对白。5 拍挂现有 hub→门→岛→结算。占 2–3 席，不进 sim / combat / render 运镜。
4. **手套**：已有 8 只 + 单局挑战。加 4 只跨局里程碑掌（铁茧 / 渡鸦 / 常胜 / 不倒）。走道 8 座契约：新掌先上 2D 配掌台。

## 故事 5 拍（F1 落表 / O4 分派 / F2 字条；F3 定稿文案）

挂现有流程，**不改运镜、不改 sim 步进、不改 combat 判定**：

| 拍 | 挂点 | 缺省触发 |
| --- | --- | --- |
| 1 | 入走道 | `phase==='hub'` 开局 / `enterHub` |
| 2 | 选掌 | 第一次成功装备主掌 |
| 3 | 过门 | `enterArena` |
| 4 | 岛上实打 | 本局玩家参与的第一记 `hit`（本人打出或挨打） |
| 5 | 结算 | `matchOver` → 结算层 `storyText` |

`skipHub:true`（再来一局）**不挡**：跳过拍 1–3 的大厅挂点，拍 4–5 仍走。G1 锁这条。

## 十席

| 席 | slug | 分支 | 可写（相对 `games/yizhang/`） | 主攻 | 禁区 |
| --- | --- | --- | --- | --- | --- |
| F1 数据 | `claude-fable-5-thinking-xhigh` | `cursor/yizhang-p2-f1-db8d` | `src/data/gloves.js`、`src/data/unlocks.js`、`src/data/story.js`（新建）、`src/data/index.js`（只再导出）、`src/core/storage.js` + `src/core/storage.test.js`（stats 形态）、`docs/API_CONTRACT.md`（**只追加** SaveV1 stats / story 表形状 / 4 掌 id） | 表尾 +4 掌（铁茧 / 渡鸦 / 常胜 / 不倒）；`skillId` **只用**现词表 `""` / `quake_slam` / `wind_rush` / `frost_arc` / `coil_counter` / `phantom_swap` / `iron_pull` / `sky_fall`；`unlocks.js` 新行 `scope:"career"`；stats 扩 `totalSlapHits` / `portalCrossings`（老档缺字段补 0）；`story.js` 5 拍纯数据表 | **不动 `main.js`**；不改 `hub.js` / `skills.js`（禁新 skillId）；不改 sim / combat / render / ui；不改 GDD（F3） |
| F2 HUD | `claude-fable-5-thinking-xhigh` | `cursor/yizhang-p2-f2-db8d` | `src/ui/**`（含 `hud.js` / `shell.js` / `menu.js` 与同目录 hud/shell css） | 击退累积可视（无血条——GDD 设计，读 `kb` / impact 而非 HP）；准星命中脉冲 ≤120ms；掌语字条**排队**（消费 O4 送来的拍，不自己编故事）；里程碑进度「237/300」读 career stats | 只 `src/ui/**`；不改 sim / render / combat / input / `main.js` / `storage.js` |
| F3 GDD | `claude-fable-5-thinking-xhigh` | `cursor/yizhang-p2-f3-db8d` | `docs/GDD.md`（及相关玩法段落；掌语视觉若需则 `docs/ART_DIRECTION.md` 一小节） | 故事 5 拍定稿、4 掌里程碑文案与门槛、stun `0.32`（已在 `tuning.js` `hitstun`，本文对齐不另造数） | 不改 `src/**`；不改 `SOTA_CHECKLIST.md` / `ACCEPTANCE.md`（F4）；不另造 skillId / 不把走道扩成 12 座 |
| F4 终验 | `claude-fable-5-thinking-xhigh` | `cursor/yizhang-p2-f4-db8d` | `docs/SOTA_CHECKLIST.md`、`docs/ACCEPTANCE.md` | 等其它合入后签字：invuln 衰减、stun 下发、打击读数、5 拍、4 掌 2D 台、career 解锁、probe 重生/过门可挨打 | 不改实现；不抢先合入 |
| O1 sim | `claude-opus-5-thinking-high-fast` | `cursor/yizhang-p2-o1-db8d` | `src/sim/**` | **P0**：`tickTimers` 恢复 `invulnT` 递减（或书面指定唯一递减点）。锁测：重生 / `enterArena` 过门后 `invulnTime + ε` 必须可被打中。死亡分支（`subStep` 已对 `!alive` 递减）不要再叠一次 | **不要两边都减**（`tickTimers` 与 `combat/statuses.js` `tickPlayerStatuses` 的 sim 驱动分支二选一，默认改 `tickTimers`、combat 侧保持「只 max status」）；不改 combat 文件；不改打击数值 |
| O2 render | `claude-opus-5-thinking-high-fast` | `cursor/yizhang-p2-o2-db8d` | `src/render/**`；`src/data/vfx.js` **仅追加** 4 新掌键（不改既有 8 掌） | `slapStart`（view `swing`）起手动画；`hit` 与 `slap` **不要二次** `playSlap`（前摇已挥就不要在命中再挥一次）；相机冲击在现有 clamp 内上调；4 掌 VFX 真表（禁 8+4 共用光球） | 不改 `hub.js` 8 座几何；不改 `HIT_STOP.max`；不改 sim / combat |
| O3 combat | `claude-opus-5-thinking-high-fast` | `cursor/yizhang-p2-o3-db8d` | `src/combat/**`、`src/ai/**`；`src/core/juice.js` **仅** `HIT_STOP.heavyPower`（16→12） | `landHit` 下发 stun（时长 = GDD / `tuning.hitstun` **0.32**，`kind==="stun"`，physics 已认）；`heavyPower` 对齐 12（与 `KNOCKBACK.heavyPowerThreshold` 同数）；`HIT_STOP.max` 不动 | 不改 `HIT_STOP.max` / `dealt` / `taken` / `cooldown`；不在 `tickPlayerStatuses` 再减 `invulnT`（O1 的）；不改机位 / 输入 |
| O4 壳 | `claude-opus-5-thinking-high-fast` | `cursor/yizhang-p2-o4-db8d` | `src/main.js`、`src/core/**`（**除** `storage.js` / `storage.test.js`）、`src/input/**`、`src/audio/**`、`index.html` | 事件分派 story（读 F1 `story.js`，按 5 拍挂点推队列给 HUD）；`recordMatch` 计入 `totalSlapHits` / 本局相关计数；**先 `recordMatch` 再 career 判定**（`core/unlocks.js`）；结算 `storyText`；`enterArena` 累加 `portalCrossings` | 不改 `src/ui/**`（F2）；不改 `storage.js` 字段名（F1 的，只调用）；不改 sim 步进 / combat `landHit`；不把再来一局改回走道 |
| G1 测试 | `gpt-5.6-sol-xhigh-fast` | `cursor/yizhang-p2-g1-db8d` | `tests/**`、`games/yizhang` 内本轮新 `*.test.js` | invuln 衰减（重生 / 过门 `invulnTime+ε` 可命中）；stun 挂载 / `canAct===false` / 到期清除；story 在 `skipHub` 下不挡拍 4–5；career 解锁（先写入 stats 再判定） | 不改产品实现去「消红」；实现归 O1/O3/O4/F1。不改 `pages.yml` |
| G2 probe | `gpt-5.6-sol-xhigh-fast` | `cursor/yizhang-p2-g2-db8d` | `scripts/**` | probe：重生后可命中；过门无敌会结束（`invulnTime+ε` 后 `wiredCombat` 仍真且能记 hit）。三固定 seed 不回归 | 不改产品数值；不改 `pages.yml` |

## 握手

1. **invuln 单点递减（O1）**：权威默认 = `sim/step.js` `tickTimers` 对**活着的**玩家减 `invulnT`。`combat/statuses.js` 对 sim 驱动玩家维持「有 `invuln` status 则 `max`，自己不减」。禁止 `tickTimers` + `tickPlayerStatuses` 双减。
2. **存档（F1 → O4）**：`stats.totalSlapHits`、`stats.portalCrossings` 由 F1 扩默认值与 `recordMatch` 签名（可加可选参数，老调用仍合法）。O4 在 main 里喂数：先 `recordMatch(...)`，再用返回后的 save 跑 career 解锁。
3. **career 掌（F1 → O4 → F2）**：4 行 `UNLOCKS` `scope:"career"`，门槛吃累计 stats（HUD「237/300」即当前/门槛）。O4 判定成功则 `unlockGlove`。F2 只展示，不写档。
4. **story（F1 → O4 → F2）**：`story.js` 导出拍表（id / 挂点 / 文案）。O4 按事件推进并在结算塞 `storyText`。F2 字条排队播放。禁止 O1/O2/O3 为剧情改相机或 step。
5. **4 掌 2D（F1 → F2 / O2）**：`GLOVES` 表尾追加；走道 `PEDESTALS.length === 8` 冻结。2D `.yz-home` 配掌台列齐 12。O2 给 4 新 id 各一可辨 VFX。
6. **stun（O3 → G1）**：`landHit` 给目标 `stun` 0.32s；不拦击退位移。G1 锁时序。F3 只把已有 `hitstun: 0.32` 写进 GDD 故事/手感节，不改 `tuning.js`（本轮 F3 无 `src/data`）。

## 红线（全席）

- `RENDER_YAW_OFFSET = 0`。禁止回 `Math.PI`。禁止第四套朝向。hub/arena 共用 yaw=0 → -Z。
- `HIT_STOP.max` 不动。
- 再来一局 ≠ 回安全区。
- 走道 8 座本轮不扩。新掌 2D。
- `lookMode` 缺省 `locked`。
- 无血条（GDD）。打击感用击退累积 / 准星脉冲 / stun 姿态，不上 HP 条。
- 禁止官方手套名 / Roblox / Slap Battles 商标 / 方块人。
- 公共 API 变更先改 `API_CONTRACT.md`（F1 追加登记）。
- 子代理 **不要** `gh pr merge` / 不要打向 `main`。推自己的 `cursor/yizhang-p2-*-db8d` 即可。
- 云端同时最多 **3** 个新 VM：W1(3) → W2(3) → W3(3) → W4(1)。
