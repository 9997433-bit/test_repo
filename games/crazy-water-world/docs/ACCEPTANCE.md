# 验收记录

由 Fable-4 在各轮回写。未验收项保持空复选框。

## Round 1（SOTA 差距审计 · claude-fable-5-thinking-xhigh）

审计基线：分支 `cursor/crazy-water-world-c895`，提交 `019b230`。
方法：全量读码 + `npm test` / `probe` / `bench` / `stress` / `build` + Node/jsdom 复现脚本。未改动任何源码与测试。

### 1. 工程门槛实测（全部退出码 0）

| 命令 | 结果 | 备注 |
| --- | --- | --- |
| `npm test` | 绿：3 文件 9 用例全过 | combat 确定性、放置规则、探索三线纯函数 |
| `npm run probe` | 绿：5/5 PASS | 但 `isolation path` 检查是 `|| true` 恒真，属虚测 |
| `npm run bench` | 绿：tickMs 0.019 / spawnMs 0.002 / battleMs 0.049 | 但 `buildings: 0`，负载虚测（见红4） |
| `npm run stress` | 绿：placed 12 / raft 16×15 / 2000 tick 后 hp>0 | placed 仅每类 1 座，非 40+ |
| `npm run build` | 绿：JS 30.6kB（gzip 12.6kB） | 生产构建可用 |

### 2. 已绿项（可信）

- 隔离性：独立 npm 工程、独占 4174 端口、`rg "from ['\"](\.\./)*\.\./\.\./" src` 零跨界 import、不碰仓库根。
- 战斗确定性：同 seed + 阵容 `toEqual` 字节稳定；嘲讽/治疗/AOE/爆发/铁钩/连珠六种技能在战报日志中真实触发。
- 放置规则纯函数：越界/重叠/唯一 HQ 拒绝且给 reason；`footprint` 支持旋转；升级/扩建扣资源。
- 存档基线：4 秒自动存档 + 标题屏「继续漂流」，刷新不丢（正常档）。
- 昼夜 + 五档天气：产率/拾荒率/伤害/天空色随天气变化，夜晚画面加暗。
- 全中文 UI、M 静音、1/2/4 变速、Esc 返回；数据密度基线达标（12 建筑 / 7 英雄 / 6 鱼 / 30 关 / 16 资源）。

### 3. 红项与复现步骤

**红1（P0）钓鱼计时输入失效，半数鱼种不可获取。**
`render()` 每 rAF 帧对 `#left` 做 `innerHTML` 全量重建，`#timing` 滑杆每帧被重置为 50。
复现（jsdom）：`render(root, store)` → `#timing.value = '30'` → 再 `render` → 值回到 50、元素已是新实例（实测输出：`同一元素? false | 重渲染后滑杆值: 50`）。
后果实测：时机恒 0.5 时 6 鱼种只有 sardine/mackerel/clown 的窗口含 0.5；tuna、angler（唯一钓鱼蓝图来源）、boot 永不可命中。且 UI 直接把窗口数字亮给玩家，无节奏条无技巧。

**红2（P0）潜水是「盲玩文字游戏」。**
`paintSea` 无 dive 分支，潜水时 canvas 仍画木筏海面；鲨鱼（2 条）与资源点（3 个，含蓝图）位置对玩家不可见，只有一行「氧 X · 深度 X · 战利品 X」。`diveStep` 在渲染循环里以硬编码 `dt=0.032` 步进、`diveInput` 每帧清零，移动依赖键盘自动重复，触屏完全无法操作。
复现：造潜水船坞（需 4 级 + wood16/scrap10/plastic8）→ 潜水屏点「下潜」→ 按 WASD 观察：画面无任何潜水表现，移动一顿一顿。

**红3（P0）升星永久死路。**
`starUp` 消耗 `shard`（星级×10），但全代码库 `shard` 只有消耗无产出（关卡奖励是 hourglass+badge，钓鱼/潜水/拾荒/订单均不掉 shard）。
复现：`rg shard src/` 仅命中 resources 定义与 roster 消耗两处；新档无论怎么玩，英雄屏「升星」永远无效。

**红4（P0）bench/probe 双虚测。**
`bench.mjs`：初始 wood=24，`expandRaft` 第一次花 21 wood 后连续 7 次静默失败，随后 hq/fish_chair/still 全因资源不足放置失败 → 实测 `buildings: 0`，报告的 tick 耗时是空木筏；清单声称的「建筑 40+」门槛从未被测过，且 Node 纯函数耗时与 60fps 渲染无关。
`probe.mjs`：`ok("isolation path", !cwd.endsWith("workspace") || true)` 恒真。
复现：`npm run bench` 看 `"buildings": 0`；Node 单跑 expand×8 实测仅成功 1 次、hq 放置 false。

**红5（P0）无障碍三连缺。**
(a) `settings.reduceMotion` 无任何 UI/按键入口（canvas 已支持该开关，纯粹没门）；(b) 载入存档后 `muted` 不同步——`setMuted` 只在按 M 时调用，静音玩家刷新后音效恢复出声；(c) 三条状态条无文字标签，仅绿/蓝/红色相区分，色盲不可辨；canvas 拾荒无键盘替代。
复现：全局 `rg reduceMotion src/` 无 setter；静音→刷新→点启航听到 blip；看 `#meters` 的 HTML。

**红6（P1）旧档缺字段导致天气永久锁死。**
`loadState` 直接 JSON.parse 顶层覆盖，无深合并/迁移。缺 `world.weatherTimer` 的档 `weatherTimer -= dt` 得 NaN，`NaN <= 0` 恒 false，天气永远 clear。
复现（Node 实测）：删掉默认档的 `weatherTimer` 跑 `tickWorld(s, 5)` → 输出 `weatherTimer: NaN`。

**红7（P1）建造手感缺半。**
无拖拽（`moveBuilding` 导出但 UI 零调用）、无旋转入口（UI 恒 rot=0）、无幽灵预览、放置失败静默（`canPlace().reason` 被丢弃）、菜单不显示成本、无拆除、邻接加成完全未实现（GDD 第 5 节明确要求）。升级/委任藏在 Shift/Alt+点击，README 未写。
复现：建造屏点已占用格 → 无任何反馈；`rg moveBuilding src/ui/` 零结果。

**红8（P1）战斗表现层缺失。**
出战即瞬间结算，`BattleResult.log` 只取最后一行进日志；无 5v5 阵容选择（heroes 全量上阵）、无战斗播放/跳过（GDD 要求 10 秒后可跳过）、微醺之龙 `buff` 技能无实现分支、`multishot` 的 `value: 2` 未使用（写死 ×1.15）。
复现：招 7 英雄打关卡，无任何取舍与观战画面。

**红9（P1）经营纵深断层。**
居民恒 1 人（radio 不招居民、house 的 `pop` 字段无消费方）；订单第二单起永远 `meal×1`（`fulfillOrder` 硬编码）；workshop 在 `tickWorld` 无产出规则；coins/diamonds/salt 无任何用途；`world.event` 恒 null（无海盗/鲨鱼事件）；无离线补算（`idleSince` 只加不用）；软目标（HQ8 级/30 关/浮动城邦）无追踪 UI；解锁用 `player.level` 而非 GDD 说的 HQ 等级；`seaSeed` 定义后未使用。

**红10（P2）杂项。**
拾荒点击只按 x 距离判定（点同一竖列任意高度都能捡，任何屏都能点）；Google Fonts CDN 外链断网退化；每帧 innerHTML 重建 4 容器造成 DOM churn 与 hover 闪烁（与红1同根因）；无 beforeunload 落盘（最多丢 4 秒）；无 favicon/manifest。

### 4. 给后续轮次的优先修复序

1. **UI 渲染架构**：面板/滑杆/dock 改为按需更新（state diff 或屏幕切换时重建），一举修复红1输入失效、红10 DOM churn，为一切手感打底。
2. **钓鱼重做成真节奏条** + **潜水 canvas 场景化**（可见鲨鱼/资源点/氧气条、真实 dt、按住连续移动、触控），关掉「三线探索不是空按钮」的最大两个洞（红1/红2）。
3. **shard 获取链路**（建议：Boss 关首通掉落 + 潜水稀有点），打通升星成长闭环（红3）。
4. **bench/probe 去虚测**：bench 给足资源真实放 40+ 建筑再测 tick、probe 隔离断言写真、补 jsdom UI 冒烟测试（红4），否则后续轮次的「全绿」没有公信力。
5. **存档健壮性 + 无障碍入口**：load 深合并默认值/版本迁移（红6）、reduceMotion 可见开关、启动时同步 muted、状态条加文字标签（红5）。
6. 建造手感包（拖拽/旋转/预览/失败提示/成本显示/邻接加成，红7）。
7. 战斗表现层（阵容选择、战报回放/跳过、补 buff 技能，红8）。
8. 经营纵深（多居民与订单轮换、事件系统、workshop 产出、离线补算、目标追踪，红9）。

### 5. Round 1 结论

工程骨架合格（纯函数分层、确定性战斗、隔离性、全套脚本绿），但当前更接近「可测的系统 demo」而非「可玩的 SOTA 网页游戏」：三线探索有两线（钓鱼计时、潜水可视）在真实 UI 里是坏的，成长链（升星）是死路，两个质量门槛（bench 负载、probe 隔离）是虚测。P0 共 6 项红，未达可对外宣称可玩的标准。

## Round 2

- 待回写。
