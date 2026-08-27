# 《Round 3 结论简报》· 异掌安全区大厅

主调度器整理。10/10 云端子代理已回收，产出合入 `cursor/yizhang-hub-db8d`。
父 PR：https://github.com/9997433-bit/test_repo/pull/22

F4 判定 **PASS-WITH-WARNINGS**。实现缺口已收口；仍红项均为真机/桌面交互延后，外加 `HIT_STOP.max=0.12` 上界哨兵。

## 实测基线（Round 3 收口后本机）

- `npm test`：**557 passed / 40 files**
- `npm run probe`：**3/3** 固定 seed PASS（`0x1a2b3c4d` / `0x5eed1234` / `0xc0ffee42`），hub→arena，`arenaKills` 1/2/2，`wiredCombat:true`，横幅 `yizhang-probe`，`p99StepMs≈0.11`
- mid 档 L3-10：hub 峰值 **94 draw / 47.8k tris**，arena **≤117 / 70.0k**（上限 120 / 80k）
- 冒烟：`http://localhost:4181/src/render/smoke.html?phase=hub&unlock=all&tour=1&quality=mid`

## 用户目标对照

| 用户目标 | Round 3 |
| --- | --- |
| 开局安全区走道选掌、传送进裂岛 | 保持；结算「再来一局」回裂岛、「回安全区」走道重挑，文案分清 |
| 8 掌台座 + 指朝上 + idle | HV-04 盲辨预跑 6/8 静帧可辨；cotton/meteor 需跟焦 |
| 皮肤 | 六套剪影 + 真表握手保持 |
| 每掌战斗 VFX | 8 键 8 形保持；回程后岛上招不再在走道结算 |
| SOTA | L3-10 绿；契约 v4.2；GDD 与实现同词 |
| 抬头低头 / 空挥 | pitch 接线保持；空间闸保持；enterHub 清 dash 余速 |

## 十席合入

| 席 | 分支 | 落地 |
| --- | --- | --- |
| O2 | `cursor/yizhang-hub-r3-o2-budget-db8d` | hub 关裂岛、合批、实例化；mid 进预算 |
| F2 | `cursor/yizhang-hub-r3-f2-art-db8d` | ART_DIRECTION §17 盲辨/预算合同 |
| G2 | `cursor/yizhang-hub-r3-g2-probe-db8d` | 三固定 seed；横幅 `yizhang-probe` |
| F1 | `cursor/yizhang-hub-r3-f1-contract-db8d` | 契约 v4.2、ADR-36 |
| O4 | `cursor/yizhang-hub-r3-o4-shell-db8d` | 结算双入口文案 + 回程淡场 |
| G1 | `cursor/yizhang-hub-r3-g1-tests-db8d` | `tests/round3-hub-sota.test.js` ×8 |
| O1 | `cursor/yizhang-hub-r3-o1-sim-db8d` | enterHub 清 dashT/switchLockT/activeSlot |
| O3 | `cursor/yizhang-hub-r3-o3-combat-db8d` | pending 顶闸：回程不结算冲刺/陨掌/残影假掌 |
| F3 | `cursor/yizhang-hub-r3-f3-gdd-db8d` | GDD §14.3 分派词；data 未动 |
| F4 | `cursor/yizhang-hub-r3-f4-sota-db8d` | §11.9 / §12.10 签字 |

## 洞 1–10

1–7、9–10 **关**（洞 7 因 L3-10 实测转关）。8 **真机延后**。

## 未做（有意）

- 合 `main` / Pages `/yizhang/`：留给人工审 PR #22 后快进。本调度器不擅自 `gh pr merge`。
- 真机触控全链与 HV-04 正式盲辨记分。
