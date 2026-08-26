# 异掌 · 架构总纲（Round 1 · Fable-1）

> 状态：**冻结**。本文与 `docs/API_CONTRACT.md` 共同构成实现基准；与 `.agent_workspace/yizhang/CONTRACT.md` 保持一致，仅做澄清与补全，不推翻种子契约。冲突处以本文 §10「决策记录」为准。需要变更时：先改这两份文档、在提交信息中声明，再改代码。

## 0. 一句话架构

**纯数据模拟核**（`sim` / `combat` / `data` / `ai`，零 DOM、零 three、可 `structuredClone`）＋ **单向视图流**（`getView` 纯 JSON 快照）＋ **可整体替换的外壳**（`render` / `input` / `audio` / `ui`），由 `core/loop` 以固定 60Hz 步进驱动、渲染插值；HUD 走 DOM，与 WebGL 画布完全分层，互不感知。

设计动机：

1. **可测试** — 命中 / 击退 / 掉落的单测（GPT-sol-1）在 Node 里直接跑模拟核，不启浏览器。
2. **可联网** — 规则按「输入 + 固定步 + 种子」写。第一版单机，但 `step(state, inputs, dt)` 的形状就是未来 lockstep 的形状。
3. **十代理并行** — 模块边界即所有权边界（见 `docs/OWNERSHIP.md`），公共面在 `docs/API_CONTRACT.md` 冻结，各写各的目录互不阻塞。

## 1. 模块图

```
┌─ 外壳层（DOM / WebGL / WebAudio；可整体替换，禁止反向 import 编排层）────────────┐
│                                                                                │
│  src/ui/shell.js     src/input/       src/audio/        src/render/            │
│  主菜单·HUD·结算·     键鼠+触屏归一     WebAudio 合成      three.js 仅此目录       │
│  触控钮 DOM·存档      摇杆·视角·脉冲键   事件名→音色        场景·相机·插值·画质档   │
│        ▲                  ▲                ▲                  ▲                 │
│   view │ 快照         Input│            事件│→音名        view │+alpha+events    │
└────────┼──────────────────┼────────────────┼──────────────────┼────────────────┘
┌─ 编排层 ┴──────────────────┴────────────────┴──────────────────┴────────────────┐
│  src/main.js（组装、事件→音效映射）    src/core/loop.js（固定步·插值·暂停·画质探测） │
└────────▲────────────────────────────────────────────────────────────────────────┘
         │ createMatch / step / getView / isMatchOver          think(view,botId,rng)
┌─ 纯数据层（禁 import three、禁 DOM/window；state 可 structuredClone）─────────────┐
│                                                                                 │
│  src/sim/ ──每 tick 调用──► src/combat/（扇击·技能·状态·觉醒数值覆盖）              │
│     │                          │                                                │
│     └──────读──► src/data/ ◄──读──────┘        src/ai/bots.js（读 view + data）    │
│                （GLOVES · MATCH · ARENA，只读表，运行期禁止改写）                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### import 规则矩阵（违反即架构缺陷）

| 模块 | 允许 import | 明确禁止 |
| --- | --- | --- |
| `src/data` | 无（纯常量表） | 一切 |
| `src/combat` | `data` | three、DOM、`sim`（防环） |
| `src/sim` | `data`、`combat` | three、DOM、`ai`、`render` |
| `src/ai` | `data` | three、DOM、`sim` 内部（只吃 `getView` 快照） |
| `src/render` | `three`、`data`（识别色等只读表） | `sim` 内部、DOM 之外的业务层 |
| `src/input` | 无业务依赖（DOM API 本体） | three、`sim` |
| `src/audio` | 无业务依赖（WebAudio 本体） | three、`sim` |
| `src/ui` | `data`（名字/识别色）、存档读写 | three、`sim` 内部 |
| `src/core/loop` | `sim`、`ai`；`render/input/ui/audio` 由 `main.js` 注入句柄 | — |
| `src/main.js` | 一切公共 API | — |

「读 view」= 只接受 `getView` 返回的 JSON 快照，绝不持有 `state` 引用。渲染、UI、AI 改不动模拟，这是本项目最重要的一条不变量。

## 2. 帧管线与 tick 顺序

固定模拟步 `MATCH.dt = 1/60`，累加器驱动，渲染插值。每个 `requestAnimationFrame`：

```
1. input.sample(cameraYaw)            # 人类 Input，一次/帧；脉冲键只发给本帧首个子步
2. acc += min(frameDt, 0.25)          # 上限 0.25s，防后台回来螺旋死亡
3. while (acc >= MATCH.dt):
     a. 每 6 tick：ai.think(lastView, botId, rngBot)   # 用 t-1 快照，10Hz 决策，期间保持上次 Input
     b. sim.step(state, inputs, MATCH.dt)              # 内部顺序：输入→移动/物理→combat.resolve*→
     c. lastView = sim.getView(state)                  #   combat.tickStatuses→台面/掉落→计分
     d. frameEvents.push(...lastView.events)           # 跨子步事件合流
     acc -= MATCH.dt
4. alpha = acc / MATCH.dt
5. render.sync({ ...lastView, alpha, events: frameEvents })   # WebGL；renderer 内部按实体缓存上帧位姿做 lerp
6. ui.syncHud(lastView)               # DOM；内部脏检查节流（条/数字 ≤15Hz，受击闪白即时）
7. main: frameEvents → audio.play(映射表见 API_CONTRACT §11)
```

要点：

- **tick 顺序冻结为：input → ai.think → sim.step（内调 combat）→ getView → render.sync / ui**。任何人不得在 render 或 ui 里改 state。
- `getView` 每个子步调一次（bot 需要新快照），分配一次快照对象可接受；`sim.step` 热路径内部零分配为目标。
- 插值：`alpha ∈ [0,1)` 由 loop 附加在传给 `sync` 的对象上（`getView` 本身保持纯净不含 alpha）。renderer 自持「实体 id → 上帧位姿」缓存，`lerp(prev, cur, alpha)`；瞬移类事件（respawn、magnet 拉拽、afterimage 换位）在 view 里带 `teleported: true` 标记，renderer 跳过插值直接贴。
- 脉冲键语义：`slap/skill/switchGlove/dash/jump` 是「本 tick 断言一次」的脉冲。input 层把 press 事件闩锁成单帧 true；同一 rAF 有多个子步时只有第一个子步收到脉冲。sim 侧照样用冷却/锁闸门，bot 长按 true 也不会连发。

## 3. HUD DOM 与 WebGL 分层

`index.html` 已有两个根节点，职责冻结：

| 节点 | 层 | 所有者 | 内容 |
| --- | --- | --- | --- |
| `<canvas id="gl">` | 底层，全屏 | `render`（Opus-2） | 三维场景。`touch-action: none`。 |
| `<div id="app">` | 上层 overlay | `ui`（Opus-4） | 主菜单、HUD、结算、暂停、触控钮、虚拟摇杆区。 |

规则：

- HUD 不进 WebGL：血条/计分/掌意条/冷却全是 DOM，材质化样式由 Fable-2 在 `src/styles` 出（参照 `docs/VISUAL_HANDBOOK.md` §9：材质化控件、无系统字体、70% 屏面积不贴 UI）。
- `#app` 默认 `pointer-events: none`，只有具体控件（按钮、摇杆区）开 `pointer-events: auto`——保证画布拖视角不被 overlay 吞掉。
- 安全区：触控控件容器用 `env(safe-area-inset-*)` 内缩；横屏优先、竖屏可玩由 CSS 布局切换，不改逻辑。
- DOM 写入节流：`syncHud` 每帧被调，但内部对比上次值，文本/宽度类变更合并到 ≤15Hz；受击反馈、击杀播报即时。

## 4. 状态模型（MatchState）

完整字段类型见 `docs/API_CONTRACT.md` §4.1。这里讲三件贴身机制怎么活在 state 里。

### 4.1 台面碎裂（floor-break tiles）

裂岛 = 半径 20 圆盘，**14 块刚性拼板**：

```
tiles[14]:
  core_n / core_s          — 中缝（seam）把内核（半径 ARENA.coreRadius）劈成两个半圆，不可破坏
  plate_{s}_{r}            — 环带（coreRadius..20）按 4 个 90° 扇区 s∈0..3 × 3 个环 r∈0..2 切 12 块，可破坏
```

- 每块 `TileState = { id, destructible, hp, maxHp, brokenT }`。`brokenT = -1` 未碎；碎裂时记 `state.time`，渲染端用它回放坠落/尘烟动画。不可破坏块 `hp = -1`。
- 几何是 **id 的纯函数**：`sim` 内部 `tileGeom(id)` 由 `ARENA.coreRadius / ringRadii / seamAngle` 推出扇环边界，不在 state 里存顶点。渲染端用同一套参数自行建网格。
- 伤害入口唯一：`combat` 里的重击效果（磐石砸地、陨掌落地、觉醒态强击）调 `sim` 暴露给 combat 的内部助手 `damageTile(state, tileId, dmg)`；HP 过阈值发 `tile_crack` 事件，≤0 置 `brokenT` 并发 `tile_break`。数值（每块 HP、各技能的对地伤害）在 `data.ARENA` / 手套表里，归 Fable-3。
- 支撑判定：`groundAt(state, x, z)` 返回所在 tile 且未碎则有地；无地则进入下落，`y < MATCH.fallY(-8)` 或「水平出界且脚下无台」判定出局。**边线会变**：外环块碎掉后，出界半径在该扇区实际内缩，这由 groundAt 自然给出，不需要额外几何。
- 护栏：外环 3 号块（`r = 2`）各自带一段低护栏，块碎栏亡。轻击退撞栏被拦（速度衰减并贴回），重击退无视：击退冲量带 `heavy` 标记，落到玩家身上转成 `knockHeavyT > 0` 的短窗口，窗口内护栏不生效。

### 4.2 双掌切换锁（switch lock）

- 玩家携 `gloveId`（槽 0）+ `offhandId`（槽 1），`activeSlot ∈ 0|1` 指当前掌。
- `switchGlove` 脉冲且 `alive && phase !== 'skill' && 未被冻结` 时：`activeSlot ^= 1`，`switchLockT = MATCH.switchLock (0.4)`，若正处扇击前摇则前摇作废（惩罚换掌取消）。发 `switch` 事件。
- `switchLockT > 0` 期间：禁扇击、禁技能；移动/冲刺/跳不受限。每 tick 递减。
- 冷却**按槽位记账**：`slapCdT: [槽0, 槽1]`、`skillCdT: [槽0, 槽1]`。换掌不洗冷却——副掌技能转好了换回来就能放，这是双掌配装的组合深度所在。

### 4.3 掌意与觉醒（awaken meter）

- `meter ∈ 0..1`。加条来源三种：扇中人（攻方）、被扇（受方）、技能命中（攻方），增量在 `data.MATCH`（`meterOnSlapHit / meterOnSlapped / meterOnSkillHit`，数值归 Fable-3）。空挥不加。
- `meter >= 1` 在该玩家当 tick 结算末自动触发：`awakenedT = MATCH.awakenDuration (8)`，`meter = 0`，发 `awaken_start`。**无手动引爆**（决策 ADR-7）。
- 觉醒是**人的状态不是掌的状态**：`awakenedT > 0` 期间对「当前激活掌」生效，换掌后 buff 跟着新激活掌走（每掌的觉醒强化定义在手套表 `awaken` 字段）。combat 通过 `applyAwaken(attacker, glove)` 取「觉醒覆盖后的有效数值」，**绝不改写 GLOVES 表本身**。
- 觉醒期间掌意增量丢弃（不预存下一管）；死亡立即清零 `awakenedT` 与 `meter` 不清（保留一半？不——`meter` 保留，`awakenedT` 清零，见 ADR-7）。

### 4.4 事件流

`state.events` 在每次 `step` 开头清空、步内追加，`getView` 原样拷入快照。事件是模拟核对外壳的唯一「发生了什么」通道：renderer 拿它触发 VFX、main 拿它映射音效、HUD 拿它播报击杀。事件分类学与字段冻结在 `API_CONTRACT.md` §10。

## 5. 移动端与自适应

### 5.1 输入所有权（DOM 按钮 vs 画布拖视角）

分工冻结：**ui 建 DOM，input 绑事件**。ui/shell 渲染带 `data-yz-*` 标记的控件，`createInput(dom, canvas)` 按标记查询并接管 pointer 事件；视觉态（按下高亮、冷却蒙层）归 ui/styles。

| 控件 / 区域 | 载体 | 建 DOM | 绑事件 | 产出 |
| --- | --- | --- | --- | --- |
| 虚拟摇杆区（左侧 ~40% 屏） | DOM 透明层 `[data-yz-zone="stick"]` | ui | input | `moveX/moveZ` |
| 视角拖动（其余空白） | `<canvas id="gl">` 本体 | — | input | 相机 yaw/pitch 增量 |
| 扇击钮 ≥72dp `[data-yz-btn="slap"]` | DOM | ui | input | `slap` 脉冲 |
| 技能 / 换掌 / 冲刺 / 跳 各 ≥48dp `[data-yz-btn="skill|switch|dash|jump"]` | DOM | ui | input | 对应脉冲 |
| 暂停钮 | DOM | ui | **ui**（不进 Input，直接调 loop.pause） | — |

- 多点触控按 `pointerId` 分轨：摇杆指针与视角指针互不干扰；按钮是独立 DOM 元素天然不与画布抢事件。
- 画布 `touch-action: none`，禁双击缩放/回弹。桌面端：点画布进 Pointer Lock 转视角，Esc 由 ui 拦为暂停；不支持锁定时退化为按住拖动。
- **禁止锁敌自动瞄**（种子红线）：input 只产出方向与脉冲，不做任何目标吸附。
- 相机朝向状态（yaw/pitch）**归 input 所有**（它累积增量），追加导出 `getLook()`；loop 把 `getLook().yaw` 传入 `sample(cameraYaw)` 完成摇杆→世界系换算，render 每帧读 `getLook()` 摆相机。见 ADR-4。

### 5.2 画质自动分档 + DPR 封顶

DPR 全局封顶 2：loop 计算 `dpr = min(devicePixelRatio, 2)` 传给 `render.resize`；档位可再往下压。

| 档 | 渲染 DPR | 阴影 | 粒子预算 | 其他 |
| --- | --- | --- | --- | --- |
| high | min(dpr, 2) | 1 盏定向光 2048 PCF | 100% | 全材质、碎块坠落网格、热扭曲 |
| mid | min(dpr, 1.5) | 贴地模糊假影 | 60% | 删热扭曲、雾简化 |
| low | 1.0 | 圆盘假影 | 30% | 合批简化材质、碎裂用静态贴花 |

自动测档（种子要求「2s 自动测」）：开局以 mid 跑 120 帧，滚动平均帧时 `<8ms → high`、`8–14ms → mid`、`>14ms → low`，然后 `render.setQuality(tier)`。局中**只降不升**：连续 3s p50 帧时 >20ms 自动降一档并发 UI 提示。玩家在设置里手动选档（写入存档 `settings.quality`）后关闭自动逻辑。探测归 loop，执行归 render。

### 5.3 后台暂停

`document.visibilitychange → hidden`：loop 停止步进并清空累加器、`audio` 挂起 AudioContext、ui 出暂停幕。恢复必须显式点按（同一手势顺带 `audio.unlock()`，满足自动播放策略）。桌面 blur 不强制暂停（R1 决策）。

## 6. 确定性与联网预留

- `sim / combat / ai` 内**禁用 `Math.random`**。模拟随机数用 sfc32，其状态是 `state.rng = { a, b, c, d }` 四个普通整数——没有闭包、没有类，`structuredClone(state)` 后从任意帧继续步进结果一致。
- Bot 决策随机流由 loop 从 `seed ⊕ hash(botId)` 各自派生（同为 sfc32，loop 持有），不碰 `state.rng`；因此「seed + 人类输入序列」完整决定整局，回放/对时校验只需录人类 Input。
- `step` 确定性契约：同 seed、同输入序列、同 `dt = MATCH.dt` ⇒ 逐位相同的 state（同一 JS 引擎内）。`dt` 参数保留是给测试用的，产线永远传 `MATCH.dt`。
- 测试基线（GPT-sol-1）：`structuredClone` 后并行步进比对；命中/击退/掉落/碎地/换掌锁/觉醒各有确定性用例。

## 7. 存档

- 唯一 key：**`yizhang-save-v1`**（localStorage，JSON）。schema 冻结在 `API_CONTRACT.md` §12。
- 只有 `src/ui`（shell 的存档助手）读写 localStorage；sim/render/input/audio 一概不碰。解锁进度由 ui 在收到 `match_over` 及挑战事件后落盘。
- 读取失败 / 版本不符 ⇒ 回默认值并覆写；写入去抖（≤1 次/s），另在结算与 `visibilitychange:hidden` 时强制刷盘。未知字段透传保留，向前兼容。破坏性改 schema ⇒ 换 key `yizhang-save-v2` 并写迁移。

## 8. 性能预算（Round 1 验收线，GPT-sol-2 的 bench/probe 按此断言）

| 项 | 预算 |
| --- | --- |
| `sim.step`（1 人 + 3 bot + 14 tile） | ≤ 1ms/tick（Node 基准，中端笔记本） |
| 渲染帧时 | high 档桌面 ≤ 8ms；mid 档中端手机 ≤ 14ms |
| Draw calls / 三角形 | < 150 / < 120k（high 档全场景） |
| GC 压力 | `step` 热路径零分配目标；`getView` 每 tick 一次快照分配可接受 |
| 启动 | 首屏可交互 < 3s（4G 模拟），three 按需只进 `render` chunk |

## 9. 部署与端口

- 开发/预览端口 **4181**（`vite.config.js` strictPort，已就位，不与仓库其他游戏抢口）。
- `base: "./"` 相对路径构建 ⇒ 未来挂 Pages 子路径 `/test_repo/yizhang/` 无需改配置。workflow 由父调度器接，子代理不碰 `.github/`。

## 10. 决策记录（ADR — 契约歧义的裁定，实现按此执行）

1. **render/input/audio 的模块级单例**：种子契约把 `sync/resize/setQuality/dispose`（及 `sample/setEnabled`、`unlock/play`）列为模块级导出，同时又有 `createRenderer/createInput/createAudio`。裁定：三个模块均为**模块级单例**——`createX` 初始化内部单例并返回句柄（句柄上有同名方法便于测试注入），模块级函数操作该单例。全游戏只有一块画布，单例成本最低且两种调用姿势都满足契约字面。
2. **Input 坐标系**：`moveX/moveZ` 由 **input 层完成相机系→世界系换算**（`sample(cameraYaw)` 的参数即为此），sim 收到的就是世界系期望移动方向（模长 ≤1）；`Input.yaw` 是期望面朝角（世界系弧度）。sim 不懂相机。
3. **脉冲语义**：五个布尔键是单 tick 脉冲（input 闩锁，同帧多子步只给第一个子步）；sim 一律再用冷却/锁闸门，长按 true 无副作用。
4. **相机朝向归 input**：契约 `sample(cameraYaw)` 暗示 yaw 在外部；裁定 look 状态（yaw/pitch 累积）就住在 input，追加导出 `getLook()`，loop 回传给 `sample`，render 读它摆相机。避免 render↔input 互相依赖。
5. **combat 解析器副作用**：`resolveSlap/resolveSkill` **就地改 state**（写冲量、掌意、状态、tile 伤害）并**返回命中列表**，sim 据此发事件。`now` 参数 = `state.time`（模拟秒，非墙钟）。
6. **事件生命周期**：`state.events` 每 `step` 开头清空；`getView` 拷贝；loop 跨子步合流后交给 render/audio。`getView` 保持纯读。
7. **觉醒触发**：满条**自动**触发（无手动引爆键，操作表没有空位）；觉醒是玩家态、跟随当前激活掌、换掌不断；死亡清 `awakenedT`、保留 `meter`；觉醒中掌意增量丢弃。
8. **冷却按槽位持久化**：换掌不重置双掌各自的扇击/技能冷却。
9. **台面拓扑**：2 个不可破坏半核 + 12 个可破坏扇环块（4 扇区 × 3 环）；护栏绑外环块、块碎栏亡；重击退用 `knockHeavyT` 窗口无视护栏。几何为 id 纯函数，state 只存 HP/碎裂时刻。
10. **击杀归属与平局**：`lastHitBy` 3s 窗口内坠落记击杀，否则算自坠（断连胜、不给分）。4 分钟到点比杀数，再比死数，仍平 ⇒ `{ over: true, winnerId: null, reason: 'draw' }`。加时赛留给后续轮次。
11. **RNG 无闭包**：随机数状态是 state 里的普通数字字段，保 `structuredClone` 契约。
12. **插值 alpha**：由 loop 附加在传给 `sync` 的对象上，`getView` 不含 alpha；renderer 自缓存上帧位姿做 lerp，`teleported` 标记跳插值。
13. **DPR 责任分割**：loop 负责全局封顶 2，renderer 负责档位内进一步降采样。
14. **HUD 节流**：`syncHud` 每帧调用、内部脏检查合并到 ≤15Hz；打击反馈即时。
15. **AI 视图延迟**：bot 用 t-1 tick 的快照、10Hz 决策频率（每 6 tick），既省算力又天然有「人类反应延迟」，避免帧完美风筝。
