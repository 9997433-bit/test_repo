# Round 1 结论简报（yizhang-look）

父分支：`cursor/yizhang-look-db8d` @ F4 合入后。F4 签字 **PASS-WITH-WARNINGS**（开工快照早于 HUD/O3/F3 合入）。

## 已实现

- 视角空间：`lookPayload.yaw === simYaw`；`setLook` 优先 `simYaw`；`RENDER_YAW_OFFSET = 0`
- `lookMode` 缺省 `locked`：镜头钉身后；V / 设置 / `?look=` / 存档
- 过门 `snapCamera`：开局/过门水平距离 ~7.1m，不再 ~120m 飞跃
- 巴掌左→右横抽；判定本就是水平锥
- HUD：`.yz-look-flash` + `#hud[data-look]`（F4 清单里仍写 DEFER，**已合入，Round 2 改勾**）
- Bot 不感知 lookMode（F4 写 DEFER，**已合入**）
- GDD + CAMERA 对照表（F4 写 DEFER，**已合入**）
- 单测对齐 ADR-37；probe 三 seed + 过门硬门

## 遗留缺陷（Round 2 P0）

1. **free 模式未落地（F4 LK-04 FAIL）**：`input.sample()` 不分模式，恒送 `cameraYawToSimYaw(θ)`，free 行为等同 locked。sim 已支持 `yaw: null` 不覆盖。O4 必须按走向送 `yawFromDir`、静止送 `null`。
2. **「打别人打不到」专项席仍未交卷**（可能卡住）。主因（相机系 yaw 当 sim）Round 1 已修；Round 2 用朝向一致性复验，禁止靠加大 reach 作弊。
3. F4 实机八步未做（无桌面）；Round 2/3 补冒烟。

## 性能

hub/arena 画调用基线本就贴预算；O2 称机位改动逐字持平。Round 2 勿为锁视角抬预算。

## 下轮攻坚

1. O4：free 产出分派（移动 `yawFromDir`，静止 `null`）；locked 保持 1:1
2. F1：契约写清 sample() 分派，避免再把相机角当 sim
3. F4：改勾 HUD/O3/F3；free 落地后重判 LK-04
4. G1/G2：free ≠ locked 的单测与探针
5. 横扇/锁视角 SOTA 打磨，不回退大厅
