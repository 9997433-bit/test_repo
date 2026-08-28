# Round 5 派发（内容轮：打击感、故事线与手套里程碑）

逻辑名：`agent/yizhang-feel` 内容轮（look 目录 Round 5）。  
父分支：**`cursor/yizhang-feel-db8d`**（从 `origin/main` @ `7ba11f1` 拉出，打向 `main`）。  
编排真源：本目录。所有权：同目录 `OWNERSHIP.md`（feel 侧镜像：`.agent_workspace/yizhang-feel/OWNERSHIP.md`）。  
输出**首行**必须是：`MODEL_SLUG: <实际 slug>`。严禁静默降级。

子 PR **打向本父分支**，不要打 `main`。子代理不要 `gh pr merge`。禁止 force。  
游戏只改 `games/yizhang/`。禁止复制第二份游戏目录。  
**编排工人不改 `games/yizhang/src/**`。**

前置：四席复盘（下节）+ 既有 hub→门→岛→结算。契约面改动先过 F1（存档字段 / story 表形状）。

## 复盘结论摘要

1. **打不中（P0）**：look 没回归。`invulnT` 无人递减——`tickTimers` 把递减让给 `combat.tickStatuses`，而 sim 驱动玩家在 `tickPlayerStatuses` 里只 `max` 无敌 status、不减 `invulnT`。重生 / 过门后永久无敌。命中率 1.9% → 补递减后 46%。
2. **打击感**：通道齐但无「打在人身上」读数。无血条是 GDD 设计；击退累积不可见。受击 stun 从未下发（FJ-04）。前摇无画面；`hit` + `slap` 双 `playSlap`。
3. **故事线**：零对白。5 拍挂现有 hub→门→岛→结算。占 2–3 席（F1 表 / O4 分派 / F2 字条），**不进** sim / combat / render 运镜。
4. **手套**：已有 8 只 + 单局挑战。加 4 只跨局里程碑掌（铁茧 / 渡鸦 / 常胜 / 不倒）。走道 8 座契约：**本轮不扩**；新掌先上 2D 配掌台。

## 冻结（全席，不得回退）

- `RENDER_YAW_OFFSET = 0`；yaw=0 → -Z；禁止第四套朝向。
- `HIT_STOP.max` 不动（现 0.12，FJ-01 上界零余量哨兵）。
- 再来一局 ≠ 回安全区（`ENTRY.RESTART → skipHub:true` / `ENTRY.HUB → skipHub:false`）。
- 走道 **8 座**本轮不扩（`src/data/hub.js` 只读）。新掌只走 2D 配掌台。
- `lookMode` 缺省 `locked`。
- 缺省 `phase:'hub'`；`QUALITY.low.bloom === false`。

## Wave 1（本批 3 · P0 / 数据闸）

| 席 | slug | 分支 | 主攻 |
| --- | --- | --- | --- |
| O1 | `claude-opus-5-thinking-high-fast` | `cursor/yizhang-p2-o1-db8d` | `tickTimers` 恢复 `invulnT` 递减（或明确只一处减）。锁测：重生 / 过门后 `invulnTime+ε` 必须可被打中。不要两边都减。 |
| F1 | `claude-fable-5-thinking-xhigh` | `cursor/yizhang-p2-f1-db8d` | `gloves.js` 表尾 +4（skillId 只用现有词表）；`unlocks.js` `scope:"career"`；`storage.js` stats 扩 `totalSlapHits` / `portalCrossings`；新建 `story.js`。**不动 `main.js`。** |
| O3 | `claude-opus-5-thinking-high-fast` | `cursor/yizhang-p2-o3-db8d` | `landHit` 下发 stun（`hitstun` 0.32）；`heavyPower` 对齐 12；`HIT_STOP.max` 不动。 |

## 后续波

| 波 | 席 | 分支 | 主攻 |
| --- | --- | --- | --- |
| W2 | F2 | `cursor/yizhang-p2-f2-db8d` | HUD：击退累积可视、准星 ≤120ms 命中脉冲、掌语字条排队、里程碑「237/300」。只 `src/ui/**`。 |
| W2 | O2 | `cursor/yizhang-p2-o2-db8d` | `slapStart` 起动画；hit 与 slap 不要二次 `playSlap`；相机冲击在 clamp 内上调；4 掌 VFX 真表。 |
| W2 | O4 | `cursor/yizhang-p2-o4-db8d` | main 事件分派 story + `recordMatch` 计数 + career 解锁（**先 `recordMatch` 再判定**）；结算 `storyText`；`portalCrossings`。 |
| W3 | F3 | `cursor/yizhang-p2-f3-db8d` | GDD：故事 5 拍定稿、手套里程碑、stun 0.32。只 docs。 |
| W3 | G1 | `cursor/yizhang-p2-g1-db8d` | 锁测：invuln 衰减、stun、story `skipHub` 不挡、career 解锁。 |
| W3 | G2 | `cursor/yizhang-p2-g2-db8d` | probe：重生后可命中；过门无敌会结束。 |
| W4 | F4 | `cursor/yizhang-p2-f4-db8d` | 终验：等其它合入后签字。 |

写路径、禁区、互踩表见同目录 `OWNERSHIP.md`。
