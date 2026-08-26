MODEL_SLUG: claude-fable-5-thinking-xhigh

# Round 1 · fable-1 架构规划与 SOTA 标准

> 范围:只做架构与标准,不改 `games/bingqi-wangzhe` 实现代码。
> 本文是 `.agent_workspace/ARCHITECTURE.md` 冻结契约的**落地细化**,凡与冻结 API 冲突处以冻结 API 为准;
> 本文新增的接口均为**追加式**(additive),已同步写入 `ARCHITECTURE.md` 的 `## Round 1 补丁` 段,Round 1 各实现代理必须遵守。

---

## 1. 模块边界与依赖方向

### 1.1 分层图(依赖只允许向下)

```
┌────────────────────────────────────────────────┐
│ ui/            DOM 渲染、路由、canvas 特效叠层   │  ← 唯一可触 window/document
├────────────────────────────────────────────────┤
│ main.js        组合根(composition root)         │  ← 唯一 new/组装点
├────────────────────────────────────────────────┤
│ forge/  combat/    领域逻辑(纯函数 + 状态变更)  │
├────────────────────────────────────────────────┤
│ core/          state、save、events、rng、clock  │
├────────────────────────────────────────────────┤
│ data/          纯常量:weapons/skills/stages/    │
│                strings/balance(无副作用)        │
└────────────────────────────────────────────────┘
```

依赖规则(违反即为架构缺陷,测试层可用静态扫描断言):

| 层 | 允许 import | 禁止 |
| --- | --- | --- |
| `data/` | 无(只 export 常量) | 一切 import;任何函数执行副作用 |
| `core/` | `data/` | `forge/ combat/ ui/`;`window`/`document`/`Date.now()`/`Math.random()` |
| `forge/`、`combat/` | `core/`、`data/` | `ui/`;彼此互相 import(共享逻辑下沉到 `core/`) |
| `ui/` | 所有层 | 直接改 `state`(必须经 `game.api`) |
| `main.js` | 所有层 | 领域逻辑(只做组装与启动) |

`forge/` 与 `combat/` 互不 import 是硬约束:战力公式 `estimatePower` 属 `combat/`,锻造预览若需展示战力,由 UI 层分别调用两个域再拼装,不得让 `forge/` 反向依赖 `combat/`。

### 1.2 组合根:`createGame` 归属与形状

冻结契约提到 "UI 必须通过 `createGame(api)` 注入" 但未定义归属。**裁定:`createGame` 定义在 `js/main.js`(opus-1 所有权),浏览器与测试共用同一组装逻辑时,可下沉到 `core/game.js` 并由 `main.js` re-export。** `mountApp(root, game)` 接收的 `game` 形状:

```js
game = {
  state,          // 唯一活体状态(hydrate 后的对象)
  bus,            // core/events.js createBus()
  rng,            // core/rng.js createRng(state.seed) — 玩法用
  clock,          // { now(): number } — UI 与逻辑统一取时间的口
  api: {          // UI 唯一允许的写入口,内部封装 spend/emit/save 调度
    forge: { preview, forge, enhance, dismantle, collectIdle },
    combat: { estimatePower, fight, applyResult, arenaOpponents },
    lineup: { assign, remove, swap },
    save: { persist, exportString, importString, reset },
  },
}
```

`game.api.*` 内部职责:调用领域函数 → 领域函数就地变更 `state` → `api` 统一 `bus.emit` + 标记脏存档。UI **禁止**绕过 `api` 直接调用 `forge/combat` 模块函数写状态(只读预览类如 `previewForge` 允许直调)。

### 1.3 状态变更模型:就地变更 + 事件广播(裁定)

在"不可变快照"与"就地变更"之间,**裁定采用就地变更(mutate-in-place)**,理由:

- 零依赖环境无 immer/结构共享工具,手写不可变更新在 `weapons[]`(数百件)上易错且产生 GC 压力;
- 冻结 API(`addResource(state,…)`、`tickIdle(state,…)`)签名已是就地风格;
- 确定性由"变更只发生在领域函数内 + 事件广播"保证,不靠引用不变性。

配套纪律:

1. 领域函数完成变更后必须返回**结果对象**(见 §4),由 `api` 层负责 emit;
2. UI 读 `state` 只读,渲染依赖事件驱动而非深比较;
3. 测试通过 `serialize(state)` 快照对比验证变更边界。

---

## 2. 数据流

### 2.1 单向环路

```
用户输入(点击锻造/出战)
   │
   ▼
ui/*  ── 调 game.api.forge.forge(opts) ──►  api 层
   ▲                                          │ ①取 rng/clock ②调领域函数
   │                                          ▼
   │                                   forge/forge.js  forgeWeapon(state, opts, rng)
   │                                          │ 就地变更 state,返回 {ok, weapon, reason}
   │                                          ▼
   └── bus.on('forge:result' | 'resource:changed' | 'state:changed') ◄─ api 层 emit
                                              │
                                              ▼
                                   core/save 防抖持久化(见 §3.4)
```

### 2.2 标准事件名清单(Round 1 冻结,只增不改)

| 事件 | payload | 发射方 |
| --- | --- | --- |
| `state:changed` | `{ scope: 'forge'\|'combat'\|'lineup'\|'idle'\|'save' }` | api 层(粗粒度兜底) |
| `resource:changed` | `{ id, delta, total }` | `addResource`/`spend` 经 api 转发 |
| `forge:result` | `{ weapon, stage, isNewCodex }` | api.forge.forge |
| `weapon:enhanced` / `weapon:dismantled` | `{ weaponId, level? , refunds? }` | api.forge |
| `battle:start` / `battle:end` | `{ kind:'campaign'\|'arena', result }` | api.combat.fight |
| `idle:collected` | `{ rewards, elapsedMs, capped }` | api.forge.collectIdle |
| `codex:unlocked` | `{ protoId }` | api 层 |
| `toast` | `{ type:'info'\|'warn'\|'error', textKey, params? }` | 任意 api;UI 只渲染 |
| `save:persisted` / `save:failed` | `{ bytes }` / `{ reason }` | core/save |

UI 特效(锤击粒子、品质流光)一律**订阅**上述事件触发,不得在逻辑层塞演出字段。

### 2.3 时间与随机注入(确定性根基)

- 逻辑层一切时间用参数 `nowMs`(来源 `game.clock.now()`),**禁止** `Date.now()`;测试注入假时钟即可验离线收益 8 小时封顶、体力 6 分钟回 1。
- 一切随机走注入的 `rng`(mulberry32);`state.seed` 存档保存,**每次消耗随机后 rng 内部游标前进**,但重载后从 `state.rngCursor`(新增存档字段,见 §3.1)恢复,或简化为:每次 `persist` 时把 `rng.state()` 写回。Round 1 允许简化实现:重载后以 `seed + forgeCount` 重建流,只要**同一存档 + 同一操作序列结果可复现**即达标。
- 战斗回放:`simulateBattle` 的 `rng` 由调用方传入独立子流(`createRng(hash(seed, battleIndex))`),战报可用同参重放。

---

## 3. 存档兼容策略

### 3.1 Schema v1(冻结最低集之上的完整定义)

`localStorage` 键:`bqwz.save.v1`(键名含大版本,大版本升级换键并迁移旧键)。

```js
{
  version: 1,                    // 迁移管线依据
  seed: 20260826,                // 主随机种子
  rngCursor: 0,                  // 可选:随机流游标(见 §2.3)
  createdAt, updatedAt,          // ms 时间戳
  resources: { coin, iron, silverOre, goldOre,
               fireCrystal, iceCrystal, thunderCrystal,
               luckyCharm, stamina, diamond },
  staminaUpdatedAt,              // 体力回复锚点
  weapons: [ WeaponInstance ],   // 见下
  lineup: [uid|null × 5],        // 未解锁槽为 null,解锁数派生自 campaign 进度
  campaign: { highestClear: 0, dailyFreeUsed: 0, dailyResetAt },
  arena: { rating: 1000, dailyAttacksUsed: 0, defenseLineup: [], dailyResetAt },
  codex: { unlocked: ['w_sword_01', ...] },   // protoId 集合
  flags: { masterForgeUsedAt, tutorialStep, achievements: {} },
  idle: { lastCollectAt, pendingSince },      // tickIdle 累积锚点
  settings: { sfx: true, battleSpeed: 1, reducedFx: 'auto' },
}
```

**WeaponInstance 形状(Round 1 冻结)** — 实例与原型分离,原型永远查 `data/weapons.js`:

```js
{ uid: 'u_000001',     // 存档内自增,永不复用
  protoId: 'w_sword_01',
  quality: 'rare',      // 六阶之一
  level: 0,
  element: 'fire',      // 主元素,可与原型缺省不同(晶石偏向)
  affixes: [{ id:'crit', value: 0.12 }],   // 词条实例值
  skillSlots: [null, null, null],           // 每3级开1槽
  locked: false }
```

派生值(战力、面板 ATK/HP、羁绊)**一律不入档**,由 `estimatePower` 等即时计算——避免公式调参后存档脏数据。

### 3.2 迁移管线

```js
// core/state.js 追加导出(additive)
export const SAVE_VERSION = 1;
export const migrations = {
  // 2: (raw) => { ...改字段...; raw.version = 2; return raw; },
};
```

`hydrate(raw)` 流程:

1. `raw` 为空/非对象 → 返回 `createInitialState()`;
2. `raw.version > SAVE_VERSION`(未来档,用户降级)→ 抛 `SaveFromFutureError`,UI 提示导出备份,不静默覆盖;
3. `while (raw.version < SAVE_VERSION) raw = migrations[raw.version + 1](raw)`;
4. **补默认**:以 `createInitialState()` 为骨架深合并,缺失字段取默认——保证旧档在新增字段后可加载;
5. **保留未知字段**:合并时不丢弃 schema 外字段(向前兼容,支持 Round 2/3 扩展字段被旧代码路过);
6. **修复性校验**:`weapons[]` 中 `protoId` 已从图鉴移除的 → 按品质折算碎片补偿并移除;`lineup` 引用不存在 uid → 置 null;资源为负 → 归零并记 `flags.repaired`。

### 3.3 损坏与配额

- `JSON.parse` 失败或校验不可修复:原文本先备份到 `bqwz.save.v1.corrupt`(仅保留最近 1 份),再重建新档,emit `toast{type:'error'}` 告知;**绝不静默丢档且不备份**。
- `setItem` 抛 `QuotaExceededError`:emit `save:failed`,UI 弹导出提示;逻辑继续运行(内存态不受影响)。

### 3.4 写入策略

- 单键整档 JSON,一次 `setItem`(localStorage 同步原子,无半写风险);
- 防抖 800ms + 关键节点强制(锻造成功、战斗结算、`visibilitychange→hidden`、`pagehide`);
- 提供 `exportString()/importString()`:`btoa(unescape(encodeURIComponent(json)))`,import 走完整 hydrate 校验。

---

## 4. 错误处理契约

### 4.1 两类失败,两种通道

| 类别 | 例子 | 通道 |
| --- | --- | --- |
| **预期失败**(玩家可触发) | 材料不足、体力不足、次数用尽、槽位未解锁 | 领域函数返回 `{ ok:false, reason:'insufficient_iron' }`,不抛异常 |
| **程序员错误** | 传入不存在的 stage、uid 查无、状态断言失败 | `throw new Error(...)`,由 UI 全局边界兜住 |

`reason` 为稳定小写蛇形字符串键,文案查 `data/strings.js`——逻辑层不产出中文。

冻结 API 中 `spend(state, costMap)` 返回 boolean 不可改;**追加** `canAfford(state, costMap): { ok, lacking: {id: n} }` 供 UI 预检与置灰按钮(避免"点了才知道不够"的 UX 缺陷)。

### 4.2 UI 层边界

- `main.js` 注册 `window.onerror` / `unhandledrejection`:渲染错误卡片(含导出存档按钮),**先强制 persist 再展示**;
- 单帧渲染函数 try/catch 到视图级,一个 tab 崩溃不拖垮资源条与其他 tab;
- canvas 特效层任何异常 → 降级为关闭特效继续运行(演出永远可牺牲,数值不行)。

### 4.3 模拟安全阀

- `simulateBattle` 硬上限 `MAX_ROUNDS = 60`(入 `balance.js`),超限判负并在返回中带 `timeout: true`;
- `tickIdle`/体力回复对 `nowMs < 上次锚点`(用户回拨时钟)做钳制:负 elapsed 按 0 处理,锚点前移,不产生负资源;
- `weighted(pairs)` 权重和为 0 → 抛程序员错误(数据表配置缺陷应在测试期暴露)。

---

## 5. 扩展点(为 Round 2/3 预留)

| 扩展需求 | 修改点(应当只有一处) | 机制 |
| --- | --- | --- |
| 新兵器 | `data/weapons.js` 追加条目 | 图鉴/掉落/锻造池全部按 `forgeStage`+`element` 索引数据表,零代码改动 |
| 新词条 | `data/balance.js` 词条池表 + `combat` 侧一个效果处理器 | 词条效果 registry:`affixHandlers[id](ctx)`,未注册 id 安全忽略并告警 |
| 新技能 | `data/skills.js` + `combat/skills.js` handler | 同上 registry 模式;技能只声明 `cd/target/effectId/params` |
| 新页面 | `ui/` 路由表追加 `{ id, titleKey, mount(el, game) }` | Tab 由路由表渲染,不写死 6 个 |
| 新羁绊 | `balance.js` 羁绊表 `{ predicate 描述, bonus }` | 谓词用声明式(`{type:'sameElement', count:3}`)而非函数,可入档可测试 |
| 成就/统计 | 订阅 bus 事件的旁观者模块 | 不侵入领域函数;事件即埋点 |
| 新存档字段 | `createInitialState` + `migrations[n]` | §3.2 管线 |
| 二周目/新资源 | `resources` 为开放 map,`addResource` 不白名单 | UI 资源条按 `data/strings.js` 有文案的才显示 |

**反扩展声明**(Round 1–3 明确不做的抽象):不做插件系统、不做多存档槽、不做 i18n 框架(strings.js 单语言键值即可)、不做 Web Worker 战斗(40 关 ×3 波规模在主线程 <5ms 可完成,见基准验收)。

---

## 6. SOTA 网页放置游戏验收清单

> 交 gpt-sol 探针与 Round 3 终验共用。P0 = 不达不收,P1 = 记录缺陷限期修。

### 6.1 性能(P0 除标注外)

- [ ] 首屏可交互 < 1s(本地静态服务、冷缓存、CPU 4× 节流);总资源(HTML+CSS+JS)< 300KB 未压缩,零外部请求。
- [ ] 锻造锤击/揭示动效、战报播放稳 60fps;canvas 粒子池化且封顶(≤ 200 活跃粒子),超限丢弃最旧。
- [ ] 任意用户操作到首次视觉反馈 < 100ms;`simulateBattle` 单场(5v3 波 BOSS)< 5ms,竞技场生成 20 对手 < 50ms(Node 基准断言)。
- [ ] 主循环:tab `hidden` 时暂停 rAF,只留低频(≥ 30s)存档心跳;挂机进度靠时间戳差结算而非后台 tick——后台 CPU ≈ 0。
- [ ] (P1) 30 分钟连续挂机 + 每分钟一场战斗,堆内存无单调增长(DevTools 三次快照对比);事件监听在视图卸载时解除。
- [ ] 长列表(图鉴 24+、背包数百件)滚动不掉帧:必要时按需渲染;禁止每帧重建整个 DOM 子树(渲染必须事件驱动 + 局部更新)。

### 6.2 可访问性(P0 除标注外)

- [ ] `prefers-reduced-motion: reduce` 时:粒子/流光/震动全关,揭示改为淡入,战报改静态逐条;设置页可手动覆盖。
- [ ] 文本对比度 ≥ 4.5:1(鎏金 #e4b84a 在墨底达标,但需实测朱砂 #c23a2b 上的文字——见风险 §7);品质不能只靠颜色区分,需同时有中文品阶文字。
- [ ] 触控目标 ≥ 44×44px;底部 Tab 兼容 `safe-area-inset-bottom`。
- [ ] 完整键盘可达:Tab 焦点序合理、`:focus-visible` 可见、弹层焦点陷阱 + Esc 关闭。
- [ ] 奖励/掉落 toast 挂 `aria-live="polite"`;资源条数值变化不轰炸读屏(合并播报)。
- [ ] (P1) 页面缩放 200% 布局不破;`lang="zh-CN"` 与语义标签(`nav/main/button` 而非 div 汤)。

### 6.3 数值可测试性(P0)

- [ ] 同一 `seed` + 同一操作脚本 → `serialize(state)` 逐字节一致(确定性回归测试)。
- [ ] 锻造分布检验:固定 seed 锻 10000 次,各品质频率与 `balance.js` 声明权重偏差 < 2 个百分点;幸运符/大师熔炉的权重位移方向性断言。
- [ ] 战斗单调性:同阵容,ATK 全体 +10% 后对同关卡胜率(100 seeds)不下降;克制 1.35/0.75 倍率在 timeline 伤害条目中可直接断言。
- [ ] 经济守恒:任意操作序列后所有资源 ≥ 0;分解返还 = `floor(投入×0.6)` 逐材料断言;离线收益封顶 8h、体力封顶 120 的边界测试(含时钟回拨)。
- [ ] 进度曲线仿真:脚本化"最优贪心玩家"用 balance 参数模拟,断言 3 分钟新手闭环、40–60 分钟(按体力/等价挂机时间折算)到第 20 关、第 40 关战力需求可达成。
- [ ] 战报 golden master:3 个固定 seed 战斗的 timeline JSON 入库,重构后 diff 为空。

### 6.4 内容密度(P0)

- [ ] 兵器原型 ≥ 24,覆盖 GDD 全部 12 类 + 4 神话;每把 `lore` ≥ 20 字且不重复。
- [ ] 主线 40 关 + 8 精英 BOSS(每 5 关),BOSS 元素按火冰雷轮转且技能各异。
- [ ] 词条 ≥ 7 种全部在战斗中生效(非摆设,timeline 可见)、技能 ≥ 12(主动)+ 羁绊 ≥ 3 类。
- [ ] 成就 ≥ 10、七日目标 7 条;所有文案走 `strings.js`,无逻辑层硬编码中文。
- [ ] 图鉴收集加成、竞技 ELO-lite、每日重置(熔炉/试炼/竞技次数)全部闭环可玩。

---

## 7. 当前脚手架架构风险(按严重度排序)

1. **`createGame` 无归属、`game` 形状未定(高)**:`main.js` 现在传 `{ boot:true }` 临时对象;opus-1(main.js)与 opus-4(ui/app.js)若各自想象 `game` 形状必然合不拢。→ 本文 §1.2 已裁定,补丁段冻结。
2. **`tickIdle`(core/state)与 `collectIdle`(forge/forge)语义重叠(高)**:两个所有权不同的代理(opus-1 / opus-2)各持一半挂机逻辑。→ 裁定:`tickIdle(state, nowMs)` 只做**结算性推进**(体力回复 + 更新 `idle.pendingSince`,幂等、无奖励发放);`collectIdle(state, nowMs)` 负责**计算并发放**挂机奖励、重置锚点。UI 心跳只调 `tickIdle`,玩家点"领取"才调 `collectIdle`。
3. **`simulateBattle` 纯函数但奖励落账无接口(高)**:冻结签名返回 `rewards` 却无人负责写入 state(campaign 进度、竞技 rating 同理)。→ 追加 `applyBattleResult(state, result, ctx)`(combat/engine.js,opus-3),否则奖励逻辑会散落 UI 层。
4. **`weighted(pairs)` 的 `pairs` 形状未定义(中)**:`[[item, w], ...]` 还是 `[{item,w}]` 两家实现会打架。→ 补丁段冻结为 `[[value, weight], ...]`。
5. **README 引用 `tests/run.mjs`、`bench/run.mjs` 但文件不存在(中)**:gpt-sol 两个代理需要统一入口约定与退出码语义(非 0 即失败),否则各自发明 runner。→ 补丁段约定。
6. **`balance.js` 双所有权竞态(中)**:fable-3 "若尚未被 opus 占用"的措辞会导致同轮并发冲突。→ 裁定:Round 1 内 `data/balance.js` 归 fable-3 独占,opus-2 只 import 不创建;若 fable-3 未产出,opus-2 于 Round 2 起接管。
7. **存档字段 `weapons[]` 元素形状未冻结(中)**:实例/原型不分离会让改数值表毁存档。→ §3.1 已冻结 WeaponInstance。
8. **CSS 字体栈以 "Songti SC" 开头(低)**:Linux/Android 无此字体,实际落到 serif 缺省,视觉不可控;且正文用宋体在小字号可读性差。→ 建议 opus-4 标题衬线、正文改 system-ui 栈(GDD "标题用衬线" 本就如此)。
9. **朱砂 #c23a2b 作按钮底色时白字对比度约 4.4:1,踩线(低)**:验收含对比度项,opus-4 需实测微调(加深至 ≈#b03225 或用描边)。
10. **仓库根 `package-lock.json` 未跟踪漂移物(低)**:非本游戏所有物,任何代理不得顺手提交,避免污染仓库根。

---

## 8. 建议 Round 2 接口冻结项(供编排器汇总)

1. `game` 对象形状与 `game.api.*` 全签名(§1.2)。
2. 事件名清单 §2.2(冻结后只增不改)。
3. 存档 schema v1 全字段 + `WeaponInstance` 形状 + `migrations` 表签名(§3.1–3.2)。
4. `applyBattleResult(state, result, ctx)` 与 `canAfford(state, costMap)`。
5. `simulateBattle` 返回的 `timeline[]` 条目形状(UI 战报、golden master、词条断言三方共用):`{ t, actorUid, side, action, targetUid, value, element, mod:1.35|1.0|0.75, crit, hpAfter }`。
6. `data/balance.js` 导出形状(品质权重表、词条池、克制倍率、经济常量、`MAX_ROUNDS`、挂机费率)。
7. `tests/run.mjs`、`bench/run.mjs` 入口与退出码约定。
8. 词条/技能 handler registry 的注册函数签名(§5)。
