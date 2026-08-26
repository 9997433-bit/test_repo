MODEL_SLUG: claude-fable-5-thinking-xhigh

# Round 3 审计：双核拆除确认 / 武将 id 归一确认 / 剩余 P0-P1 清单

> **审计基线**：HEAD `e70b4cd` + 当时工作区的未提交改动（main.js 已接领赏/导出导入/重开、
> bridge 已加 `autoClaimQuests` 与 save 适配器注入）。本轮有多名代理并行改代码，
> 工作区是移动目标——本文标注的每条问题都在该基线上**复核过仍然存在**；
> 已被并行改动修掉的问题记入 §5「本轮已顺手修掉」，不再占 P 位。
>
> 审计范围：`js/main.js`、`js/bridge/{actions,view}.js`、`js/config.js`（START_HERO_IDS 等）、
> `js/systems/quests.js`，并复核 `js/state.js`、`js/systems/city.js`、`js/engine/{save,rng}.js`、
> `js/data/{heroes,quests}.js`、`js/ui/{hud,panels}.js`。只记录事实与分派，不改任何代码。

---

## 1. Round 2 简报两项确认（均已解决，各留一条尾巴）

### 1.1 双核叠加已拆除 ✅

Round 2 的 C1（bridge 后再 `core.tick()` 双核同跑）在新 `main.js` 中不存在：

- `main.js` 现为**二选一**结构：`selectEngine()` 里 `bridgeReady` 为真走 `createSystemsEngine()`，
  装配抛错或模块缺失才走 `createFallbackEngine()`，两个引擎全生命周期互斥。
  systems 引擎的 `tick()` 只调 `A.tickAll(ctx)`，**没有第二内核在同一帧再推一次**。
- Round 2 的 C2（形状探测太弱）随之消除：`bridgeReady` 从「猜 state 形状」改为**能力探测**
  （`createInitialState / tickCity / projectView / tickAll` 是否存在），且 systems 路径的 state
  由 `ext.state.createInitialState` 自己生成，形状天然一致。
- Round 2 的 A1 / C4（双存档通道交叉写入）随之消除：`-ui` 扁平存档键的读写代码整体删除，
  进度读写只剩 `engine/save.js` 的 `sanguo-ice-age-save-v1` 单通道（tutorial 的 DONE_KEY 除外，无关进度）。
- 运行验证：无头模拟 30 天（480 tick），资源无双倍增长、寒潮 3 次符合「7 日周期 + 2 日时长」、
  人口 12→16、民心稳定 70，无叠加迹象。

**尾巴**：拆叠加时 Round 2 的「fails>=3 熔断」也没了。`bridge/actions.js` 的 `safely()`
对每个系统只做 try/catch + `console.warn`——某系统持续抛错时**每 tick 刷 warn 且无任何
用户可见降级提示**（违反 Round 2 禁止事项 7 的精神），见 P2-3。

### 1.2 武将 id `huatuo` vs `hua_tuo`：运行时已通，源头未改 ✅⚠

- `bridge/view.js` 的 `canonicalHeroId`（去掉非字母数字后比较）+ `dedupeHeroCatalog`，加上
  `bridge/actions.js` 的 `ensureRoster`（roster 归一 + `deployed` 同步 remap + 撞名合并），
  把 config 的 `liubei/zhangfei/huatuo` 归一到名录的 `liu_bei/zhang_fei/hua_tuo`。
- 运行验证：开局 roster 实测 `['liu_bei','zhang_fei','hua_tuo']`；侧栏投影查得到 def
  （刘备 name/title/技能/战力 1338 正常）；存档→读档后保持归一；重复招募走升星不重复入列。
- 名录去重验证：`data/heroes.js` 20 人 + `FALLBACK_HEROES` 8 人合并后无重复人物
  （8 个保底 id 全部与 data 的 snake_case 同人合并，卡池不会出现两个刘备）。

**尾巴**：`config.START_HERO_IDS` 仍是 `["liubei","zhangfei","huatuo"]`（`engine/README.md` 同文），
整条链路靠 bridge 的隐形归一层撑着，见 P1-2。

---

## 2. 运行验证证据（当前工作区，Node 无头，seed 固定）

| 验证项 | 结果 |
|---|---|
| `node tests/runner.mjs` | 24 passed / 0 failed（含 bridge 投影与 integration 十连 tick） |
| 开局 roster / deployed | `liu_bei / zhang_fei / hua_tuo`，归一生效 |
| 30 日模拟（480 tick） | day 31、寒潮 3 起 3 落、数值正常，无双核叠加迹象 |
| 存档回环 | `saveGame → loadGame → createContext` 通过 assertState，roster 保持归一 |
| RNG 游标持久化 | 招募后 `meta.rngCursors.recruit` 随档写入；读档续抽与不读档续抽结果一致 |
| save-scum 防刷 | 同一存档重复读档抽卡结果相同 |
| 任务领取（`autoClaimQuests:false`，与 main.js 一致） | 开局资源保持 320/420（不再静默发奖）；`q_main_01` 停在 ready 等玩家点「领赏」，手动领取 +80 食 +120 木、下游正常解锁 |
| `rng.setState(0)` | 被 `hashSeed` 映成 1（Round 2 C5 尾巴仍在，见 P2-2） |

---

## 3. Round 2 风险对账

| 编号 | Round 2 描述 | 现状 |
|---|---|---|
| A1 | 双存档通道交叉写入 | **已消**：`-ui` 键删除，单通道 `engine/save.js` |
| A2 | ID_ALIASES 只在 defOf 生效，派生量绕过 | **已消**：`config.BUILDING_IDS` 改为正典 snake_case；读档走 `state.js migrateBuildingIds` 一次性迁移 |
| A3 | ensureState 新旧双份条目双产出 | **已消**：迁移在 `normalizeState` 落地（并存时 `mergeBuildingSlots` 合并后删旧键） |
| A4 | assertState 一票否决 + 弃档无备份 | **残留**：`loadGame` 校验失败仍直接返回 null，无备份。见 P1-1 |
| A5 | heroSeq 回退撞 id | **已消**：旧 UI 内核 hydrate 整体删除 |
| A6 | 三种日志条目形状 | **基本已消**：`projectLog` 兜底补 day 并映射 kind |
| B1 | 装配段裸奔无防护 | **收敛**：`selectEngine` 有 try/catch 退回内置内核、首帧 HUD 刷新有兜底并保证撤启动遮罩；DOM 装配段（252 行起）仍裸奔，见 P2-4 |
| B2 | tick 第二参签名各收各的 | **已消**：bridge 按各系统真实签名分别调用 |
| B3 | probeBridge 装配前跑构造探测 | **已消**：probeBridge 删除 |
| B4 | setCatalog 挂不可枚举对象 | **残留但受控**：模式仍在，catalog 为纯数据且不可枚举属性不进存档；维持「禁止推广」 |
| C1 | runTick 叠加双核 | **已消**（见 §1.1） |
| C2 | 形状探测误交权 | **已消**（能力探测） |
| C3 | 单系统熔断后的半桥接 | **形态变化**：熔断没了，变成「永远重试 + 静默刷 warn」。见 P2-3 |
| C4 | 降级不回切存档通道 | **已消** |
| C5 | RNG 全线非确定 | **玩法路径已消**：招募/战斗/遭遇走 `meta.seed` 派生流且游标随档持久化；`Math.random` 残留仅 render/*（纯视觉）与 systems 默认参数（bridge 恒注入）。边界见 P2-2 |
| C6 | 燃料常量双份量纲不同 | **已消**：内置内核 1.28/日 == config 0.08/tick × 16 |

---

## 4. 剩余问题清单

**结论：未发现 P0**（主路径无崩溃、无炸档、无静默清档；测试与无头全链路均通过）。
P1 共 3 条，P2 共 6 条。

### P1（应在下一轮合并前处理）

- **P1-1｜读档校验失败直接弃档、无备份（Round 2 A4 残留）**
  `engine/save.js loadGame` 在 JSON 解析失败 / `assertState` 未通过时返回 null 按新游戏处理，
  原始 payload 直接丢弃。合并期结构还会演进，任何一次校验规则失误都等于全额没收玩家进度。
  导出/导入按钮虽已接线（玩家可手动防），但不能指望玩家天天备份。
  **建议由谁改**：`engine/save.js` 所有者——弃档前把原始 payload 原样写入
  `${SAVE_KEY}-corrupt-backup`（约 8 行），并在 console.warn 里说明备份键名。

- **P1-2｜`config.START_HERO_IDS` 仍是旧写法 `huatuo`，源头未随名录统一**
  运行时靠 `canonicalHeroId` 撑着（见 §1.2），等于让「第 4 套 id」以配置形式常驻：
  绕过 bridge 直连 systems 的消费方（单测、成就统计、未来剧情系统）会复现
  「查不到 def / 重复入列」。`docs/INTEGRATION.md` §4 已给出方案：改为
  `["liu_bei","zhang_fei","hua_tuo"]`。归一是幂等的，旧存档不受影响。
  **建议由谁改**：`config.js` 所有者（同批更新 `engine/README.md` 的同文描述）。
  **注意**：只改这三个 id，不要顺手删 `canonicalHeroId`——老玩家存档里还是旧 id。

- **P1-3｜`FALLBACK_QUESTS` 的 `q_sawmill_3` 用了不存在的建筑 id `sawmill`**
  `systems/quests.js` 第 50 行 `require:{type:"buildingLevel", id:"sawmill", value:3}`——全仓库
  没有 `sawmill`（正典是 `lumber`，且 `readBuildingLevel` 不查别名表），恰好违反
  `data/quests.js` 头注自立的禁令（「禁止使用 sawmill、lumberyard 等」）。触发条件是
  `data/quests.js` 加载失败走保底链：届时该任务进度永远 0/3，其 `unlockAfter` 下游
  `q_wood_800 → q_coal_500` 连锁永久锁死（保底链 8 条瘫 3 条）。
  **建议由谁改**：`systems/quests.js` 所有者，`"sawmill"` → `"lumber"` 一处替换。

### P2（择机处理，不阻塞合并）

- **P2-1｜主线前两环开局即达成，教学价值为零**
  `config.START.buildings` 预建 `lumber:1 / hunter:1`，`q_main_01/02` 的要求恰是这两个 1 级。
  `autoClaimQuests:false` 接入后已不再静默发奖（实测开局资源保持 320/420），但两个任务
  首帧就亮「领赏」，成了白送的点击——与 `data/quests.js` 头注「用开局资源建出来」的设计
  意图相悖。二选一：a) `START.buildings` 去掉预建（需重验前 7 天节奏）；b) q01/q02 目标改 2 级。
  **建议由谁改**：数值/任务设计所有者（`config.START` 与 `data/quests.js` 必须同批改）。
- **P2-2｜`rng.setState(v)` 内部走 `hashSeed(v)`，游标 0 被映成 1**（实测确认）。概率仅 2⁻³²，
  但属「断点续随机」正确性缺陷。改 `engine/rng.js`：`setState(v){ s = Number(v) >>> 0 }`。
- **P2-3｜bridge `safely()` 无熔断、无用户可见降级**：系统持续抛错时每 tick 刷 `console.warn`，
  玩家只觉得「游戏怪怪的」。建议 bridge 所有者补计数熔断 + 首次熔断时
  `pushLog(state, …, "warn")`（邸报可见），与 Round 2 禁止事项 7 对齐。
- **P2-4｜`main.js` DOM 装配段（252 行起）仍无防护**（Round 2 B1 残留收窄版）：
  `selectEngine` 与首帧 HUD 已有兜底，但 `getElementById` / `createCityRenderer` 若因
  index.html 改动缺元素仍白屏。本轮已核对元素齐备，合并期动 `index.html` 或
  `render/canvas.js` 导出名的人需自知会白屏。
- **P2-5｜`systems/quests.js claimQuest` 的 `claimedAt = Number(state.day) || 0`**：嵌套状态里
  day 在 `state.meta.day`，顶层不存在，领取时间永远记 0。改 `systems/quests.js`。
- **P2-6｜旧 `-ui` 扁平存档无迁移器**：现无任何代码读它，Round 1 试玩进度一次性丢失。
  当时尚无正式玩家，建议记录在案、明确「不迁移」，不要再补迁移器增加面积。

### 本轮审计期间已由并行改动修掉（复核通过，不占 P 位）

- 败亡界面「重新来过」按钮已接 `onRestart`（此前只能按 N，触屏死档）。
- 存档导出/导入已接 `onExport / onImport`（`engine.canExport / canImport` 控制按钮显隐），
  bridge 侧 `importSave` 还加了 `looksLikeSave` 形状检查，防止 `{"foo":1}` 被 normalizeState
  「补」成新档清掉当前局面。
- 任务「领赏」双通路（HUD 托盘 `onClaimQuest` + 面板 `game.claimQuest`）已接通，
  并以 `autoClaimQuests:false` 关闭自动领取——顺带消掉了开局静默发奖。

---

## 5. 分派汇总（按改动文件聚合，一人一批、互不踩线）

| 改动文件 | 条目 | 量级 |
|---|---|---|
| `js/engine/save.js` | P1-1（弃档前备份到 `${SAVE_KEY}-corrupt-backup`） | 约 8 行 |
| `js/config.js` + `js/engine/README.md` | P1-2（START_HERO_IDS 三个 id） | 2 行 |
| `js/systems/quests.js` | P1-3（sawmill→lumber）、P2-5（claimedAt 读 meta.day） | 2 行 |
| `js/config.js` `START` + `js/data/quests.js` | P2-1（开局预建 vs q01/q02，须同批） | 数值决策 + 少量行 |
| `js/engine/rng.js` | P2-2（setState 直写游标） | 1 行 |
| `js/bridge/actions.js` | P2-3（safely 熔断 + 邸报降级提示） | 约 15 行 |

**顺序建议**：P1-1 / P1-3 无依赖可并行先行；P1-2 落地后只收缩 `canonicalHeroId` 的注释
（不删逻辑）；P2-1 涉及数值验证，单独一批并重跑 `tests/runner.mjs` + 无头 30 日模拟。

**本轮延续的禁止事项**（Round 2 §3 全部继续有效，另加一条）：
8. 禁止以「反正 bridge 会归一」为由在 config / data / systems 中新增任何非正典 id
   （建筑正典 = `data/buildings.js` snake_case；武将正典 = `data/heroes.js` snake_case）；
   归一层（`canonicalBuildingId` / `canonicalHeroId`）只允许为**存量旧档**服务，只减不增。
