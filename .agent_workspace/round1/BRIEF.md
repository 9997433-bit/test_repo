# Round 1 结论简报

**编排时间**：2026-08-26  
**基线分支**：`cursor/bingqi-wangzhe-c054`  
**参与**：4× fable (`claude-fable-5-thinking-xhigh`) + 4× opus-fast (`claude-opus-5-thinking-high-fast`) + 2× gpt-sol (`gpt-5.6-sol-xhigh-fast`)

## 已实现功能

1. **核心引擎**（opus-1）：`createGame`、mulberry32 RNG、存档 hydrate/serialize、8h 挂机封顶、体力回复、事件总线、memory/localStorage adapter。
2. **锻造与图鉴数据**（opus-2）：41 把原创兵器、40 关、品质权重/保底、`previewForge`/`forgeWeapon`/`enhanceWeapon`/`dismantleWeapon`/`collectIdle`。
3. **自动战斗**（opus-3）：元素克制、8+ 技能、羁绊、种子可复现、竞技场 20 AI、`estimatePower`。
4. **国风六 Tab 客户端**（opus-4）：工坊三锤、揭示卡、试炼/战阵/图鉴/竞技/背包、reduce-motion、mock 可玩闭环。
5. **规格文档**（fable 1–4）：架构补丁、战斗 12 技公式、经济蒙特卡洛、UX 12 高潮点。
6. **探针骨架**（gpt-sol）：`tests/run.mjs`、`bench/run.mjs`、`economy-sim.mjs`（R1 时模块未合流，多数 skip）。

## 遗留缺陷（Round 2 必须修）

1. **UI 仍走 mock**：`gameAdapter` 要求 core+data+forge+combat 全量动词才切换；编排动词（`challengeStage`/`arenaFight`/`setLineup`）未接入，真实存档未驱动界面。
2. **双实现漂移**：
   - 技能 id：`flameSlash`（规格）vs `blaze_slash`（战斗）vs data/skills 第三套。
   - 战斗模型：ATB（fable-2）vs 回合速度重排（opus-3）。
   - 事件名：`start/kill/end` vs `battleStart/ko/battleEnd`。
   - 字符串种子哈希：core xfnv1a vs combat xmur3。
   - 两套 RNG（core/combat/forge 各一份）。
   - 经济表：fable-3 文档 vs opus-2 `balance.js` 未对齐。
3. **测试未真正跑通生产路径**：R1 探针在合流前 skip；合流后必须变绿。
4. **视觉债**：无元素弹道/KO 慢动作、无 WebAudio、炉膛偏鼎、兵器无单件立绘、战阵无拖拽、绕边流光未做成。
5. **存档缺口**：`state.forge`（pity/masterForge）、碎片资源、每日重置字段需写入 core hydrate。

## 性能瓶颈

- 战斗引擎自报 ~0.12ms/场，R2 需用 gpt-sol 基准确认 500 场 ≤500ms。
- UI canvas 火花需保证后台 Tab 停 rAF；品质揭示长动画（神话 3.6s）不得阻塞输入线程。
- mockGame.js ~1000 行与真实逻辑重复，切换后应删除热路径双计。

## 下轮攻坚重点（注入 Round 2 全员）

1. **冻结并统一**：skill id 用 snake_case 与 data 对齐；事件名采用 `start|action|skill|damage|kill|end`（已实现）并提供别名；RNG 一律走 core；品质字段名 `quality`。
2. **打通 UI↔逻辑**：opus-4 + opus-1 补齐 `game.api`：锻造、上阵、出征、竞技、领取挂机；去掉成功路径对 mock 的依赖。
3. **对齐经济**：opus-2 按 fable-3 表重写 `balance.js`（8 锤史诗保底、首锻精钢保底、掉落/挂机）。
4. **测试变绿**：gpt-sol 重跑并补 golden；禁止 skip 核心 6 项。
5. **SOTA 视觉补强**：锻造接触帧、三套弹道、KO、资源飞币、胜负印章——能做多少做多少，底线不可砍。
6. **文件所有权保持不变**；跨模块接口变更写入 `.agent_workspace/round2/REQUESTS.md`。
