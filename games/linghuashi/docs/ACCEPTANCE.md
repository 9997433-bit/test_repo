# 验收步骤（ACCEPTANCE）

> 与 `docs/SOTA_CHECKLIST.md` 配套：清单定义「验什么、阈值多少」，本文定义「怎么验、按什么顺序」。
> 全部命令在 `games/linghuashi/` 目录内执行；验收 harness 一律写到 `/tmp/acceptance/`，**不得**向仓库新增脚本文件。
>
> **Round 2 复评**：2026-08-26 08:24 UTC，工作树实测（并发开发仍在进行，结果为该时刻快照）。
> Round 1 基线：2026-08-26 07:17 UTC（HEAD `0265040`）。

## 0. 环境准备

```bash
cd games/linghuashi
npm install          # node ≥ 20（本轮 v22.14.0）
```

产出判定：install 无 error；`node_modules/` 只出现在本目录。

**jsdom harness 前置**：`ui/screens.js` 起 import 了 CSS，node 直跑会报 `ERR_UNKNOWN_FILE_EXTENSION`。
先写一个 loader 存为 `/tmp/acceptance/css-loader.mjs`：

```js
export async function load(url, context, next) {
  if (url.endsWith(".css")) return { format: "module", source: "export default {};", shortCircuit: true };
  return next(url, context);
}
```

之后所有挂载 UI 的 harness 用 `node --experimental-loader /tmp/acceptance/css-loader.mjs <script>` 运行。

## 1. 自动化门禁（每次复评必跑，顺序执行）

```bash
npm test             # vitest：全绿，exit 0
npm run probe        # 六式识别 + 400 乱涂硬误报红线 + 50 回合战斗冒烟，"probe ok" 且 exit 0
npm run bench        # 3000 笔识别基准：mismatches=0 且 p95Ms<4，exit 0
npm run build        # vite build 成功，dist/assets/*.js gzip < 100KB
```

| 门禁 | 阈值 | R1 基线 | R2 实测 |
| --- | --- | --- | --- |
| vitest | 全绿 | ✅ 20/20 | ✅ **62/62（9 文件）** |
| probe | exit 0 | ❌ exit 1 | ✅ exit 0（乱涂硬误报率 0） |
| bench | exit 0、mismatches=0、p95<4ms | ❌ exit 2 | ✅ exit 0（0 误配、p95 0.212ms） |
| build | 成功、gzip<100KB | ✅ 13.5KB | ✅ 46 模块 / JS gzip 31.0KB |
| preview | HTTP 200 | ✅ | ✅ |

> R2 保留意见：probe 的乱涂红线（`scripts/scribble-probe.mjs`）只把 line/circle/spiral 计为硬误报，
> **cloud（治疗）不在红线内**；轨迹金标准仍有 synth.js / templates.js / trajectories.mjs 三份。
> 两项均列入 Round 3 收口（清单 A6/A7 保留意见）。

## 2. 识别精度矩阵（清单 A1/A2/A6）

把下面脚本存为 `/tmp/acceptance/recog-matrix.mjs` 并在游戏目录内执行
`node /tmp/acceptance/recog-matrix.mjs`：

```js
const { classifyStroke } = await import("/workspace/games/linghuashi/src/drawing/recognizer.js");
const { synthesizeStroke } = await import("/workspace/games/linghuashi/src/drawing/synth.js");
const TYPES = ["line", "curve", "circle", "zigzag", "spiral", "cloud"];
const N = 200, matrix = {}, prec = {};
const opts = (s) => ({ seed: s, cx: 120 + (s % 7) * 15, cy: 120 + (s % 5) * 12,
  size: 90 + (s % 9) * 22, rotation: ((s % 12) / 12) * Math.PI,
  noise: 0.004 + (s % 4) * 0.004, wobble: (s % 3) * 0.006, dt: 10 + (s % 6) });
for (const t of [...TYPES, "scribble"]) { matrix[t] = {}; prec[t] = []; }
for (const t of TYPES) for (let i = 1; i <= N; i += 1) {
  const r = classifyStroke(synthesizeStroke(t, opts(i)));
  matrix[t][r.type] = (matrix[t][r.type] || 0) + 1;
  if (r.type === t) prec[t].push(r.precision);
}
for (let i = 1; i <= N; i += 1) {
  const r = classifyStroke(synthesizeStroke("scribble", { seed: i, size: 120 + (i % 5) * 30, dt: 8 }));
  matrix.scribble[r.type] = (matrix.scribble[r.type] || 0) + 1;
}
const big = ["spiral", "circle", "cloud"].reduce((a, k) => a + (matrix.scribble[k] || 0), 0);
console.log(JSON.stringify({ matrix,
  falseBigSpellRate: +(big / N).toFixed(3),
  accuracy: Object.fromEntries(TYPES.map((t) => [t, +((matrix[t][t] || 0) / N).toFixed(3)])),
  meanPrecision: Object.fromEntries(TYPES.map((t) => [t,
    +(prec[t].reduce((a, b) => a + b, 0) / (prec[t].length || 1)).toFixed(3)])) }, null, 2));
```

判定与结果：
- 六类 `accuracy` 全部 ≥ 0.98。R1：0.98–1.00 → **R2：全部 1.000** ✅。
- `meanPrecision` 全部 ≥ 0.85。R2：0.923–1.000 ✅。
- `falseBigSpellRate` < 0.05。R1：❌ 0.265 → **R2：0.035（cloud 7/200，circle/spiral 0）** ✅。

## 3. 战斗公平（清单 B 组）

### 3.1 确定性重放（B1）

同 seed 跑两次 50 回合，断言两次玩家 HP 序列逐位一致；换 seed 应变化。
R2 实测：`{sameSeed:true, diffSeed:true}` ✅。

### 3.2 结算幂等 / 奖励只发一次（B9，R1 的 P0）

jsdom 挂真实 UI（boot → navigate("battle") → 派发 pointer 事件画直线直至胜利），
胜利后等 ≥2s 比对 xp/qiPills。存为 `/tmp/acceptance/reward-loop.mjs`，要点：

- store 预置 `{ classId:"jian", screen:"hub", stageId:"tutorial", tutorialDone:true }`
  （**必须 tutorialDone:true**，否则教程弹层挡住施法）；
- canvas `getContext` 用 Proxy stub、`AudioContext` 用假类（含 `createGain/createOscillator/resume/destination`）；
- 用 `--experimental-loader` 挂 §0 的 CSS loader。

判定：`rewardIdempotent: true`。
R1：❌ 实测 xp 40→280、丹 8→56。**R2：✅ xp 40→40、丹 8→8**；
辅证：`tests/contract.test.js` 断言战斗结束后 `tick(60000)` 不推进 t、end 日志恰一条。

### 3.3 克制与养成接线（B5/B7/B8）

- 克制比 ≈1.18：R2 ✅。
- 天赋接入：同 seed 同笔，`talents:{might:1}` 与空天赋各建一场
  （modifiers 按 UI 同款 `{ talent:{atk:talentMult(save,"atk"),…}, beast:beastBonus(save) }` 组装），
  比对首笔伤害。R1：❌ 不传 modifiers。**R2：✅ 实测伤害比 1.0600**。
- 灵兽暴击：beast `crit:0.2` 时 50 笔实测 7 次暴击、无灵兽 0 次 ✅。
- 金雷引（B7）：`reaction("thunder","metal").crit` **仍未被 `battle.cast` 消费**，❌（Round 3 收口）。

### 3.4 telegraph（B10）

R2：战斗侧栏「意图」显示 被缚/蓄势/观势，蓄势窗口 400ms 按真实冷却计算 ✅（代码 + jsdom）；
真机目测（strike 前预警可辨识）归入 §6 真机冒烟。

### 3.5 键盘施法（E1，R1 的 P0）

同 §3.2 harness，把画线换成 `document.dispatchEvent(new KeyboardEvent("keydown", { key: "1" }))` 循环。
判定：能打赢并正确结算。R1：❌ 按键无效。**R2：✅ 仅按 "1" 全程胜利、结算幂等、画阁留痕**。

## 4. 存档（清单 C 组）

1. 自动化：`store.test.js`（容错）、`progression.test.js`（8h 上限）、`gallery.test.js`（点列清洗/上限/体积预算）、`contract.test.js`（挂机幂等）。R2 全 ✅。
2. 往返 harness：写入 classId/realmId/xp/gallery（含 points）→ persist → 新 store hydrate。
   R2 实测 `roundtrip:true`；瞬态键（notice/idleClaim/idleClaimed/inkJustUnlocked）盘上不存在 ✅；
   `screen/lastResult` 仍落盘（boot 时 battle 会被消毒为 hub，无害，见清单 C6 保留）。
3. 破坏性：非法 JSON / `version:99` 回默认不白屏。R2 ✅（单测覆盖）。
   注意：`version:99` 是**弃档**而非迁移——C7 仍未实现。
4. 幂等：同 nowMs 连续 `tickIdle` 只发一次。R2 ✅。

## 5. 无障碍（清单 E 组）

键盘走查脚本（全程不碰鼠标）：

1. `npm run dev` → Chrome 打开 `http://localhost:4173`。
2. Tab「开卷入世」→ Enter；选职卡为 radiogroup（方向键移动）→ Enter；「以此入世」→ Enter。
3. 枢纽 Tab 到秘境 → Enter 进战斗（首场出教程弹层：焦点被 trap，Esc 或「开卷落笔」关闭）。
4. 数字键 1–6 施法（或 Tab 到符键条）；Esc 撤退。
5. 结算屏 Tab「回枢纽」→ Enter。

R2 状态：第 4 步已由 §3.5 harness 自动化实证 ✅；aria-live 日志、progressbar、focusScreen、
:focus-visible、静音总线均已接线（audio.test 覆盖静音）。
真浏览器目测走查与读屏播报体验留 Round 3 复核；`settings.reducedMotion` 无 UI 开关（清单 E5 保留）。
对比度：`--ink-mute` 6.77:1 ✅；`ui.css` 两处 `opacity:0.6` 小字实效 4.44:1，微低于 4.5（清单 E7）。

## 6. 移动端（清单 D 组）

1. DevTools Device Mode：进战斗单指画六式。判定：不滚动不缩放、每笔一次识别。
   R2 代码状态：起笔/收笔有 `drawing` 闸门不再双触发；**但 pointer+touch 双栈都在监听，
   move 会双采样**（清单 D5 保留）——目测笔迹是否加粗/识别是否受扰。
2. 双指同时按下画线。R2：pointerId 闸门 + 第二指 start 被拒，预期不互串 ✅（代码级）。
3. pointercancel（系统手势/来电）。R2：已监听并收笔 ✅（代码级）。
4. 真机各完成一场教程战（D7）。**R2 未执行**；执行时顺带录 F5 帧率、目测 B10 telegraph。
5. 布局断点：≤860px 战斗单列、≤800px 枢纽单列。R2 ✅（CSS 审查）。

## 7. 性能（清单 F 组）

1. `npm run bench`：R2 ✅ p95 0.212ms、0 误配、exit 0。
2. 60fps 墨迹（F5）：Chrome Performance 录 10s 连续画螺旋，FPS ≥58、无 >50ms 长任务。**R2 未执行**（无实机）。
3. 泄漏（F6）：jsdom harness 包裹 `setInterval/clearInterval` 与 window `addEventListener` 计数，
   battle↔hub 往返 5 次。
   R1：❌ interval 与 resize 双泄漏。**R2：✅ 活跃 interval 恒 0、resize 恒 1（painter 单例）、keydown 归零**。
   真浏览器复核命令：连打 5 场后 Console `getEventListeners(window).resize?.length` 恒定。

## 8. 目录隔离（清单 G 组）

> 本轮验收会话禁用 git，以下命令供提交前自查：

```bash
git -C /workspace status --short | grep -v "games/linghuashi/" ; echo "---"
git -C /workspace diff --stat HEAD -- . ':!games/linghuashi'
```

判定：两条输出除空行/`---` 外为空。
R2 文件系统快照：`games/linghuashi/` 外仅有根 `package-lock.json`（88B 未跟踪副产物）与原有 `test.js`。
**严禁提交根 package-lock.json**；Round 3 直接删除（根目录无 .gitignore，新增它本身也算根改动）。

## 9. Round 2 复评结论（2026-08-26 08:24 UTC 快照）

### 本轮已修（R1 未过 → R2 已过）

| R1 问题 | 清单项 | R2 证据 |
| --- | --- | --- |
| 胜利后奖励每 200ms 重复发放 + interval/resize 泄漏 | B9/F6 | rewardIdempotent:true；5 场后 interval=0、resize 恒 1 |
| 键盘无法施法 | E1–E4 | 仅按 "1" 打赢教程战；aria-live/meter/focusScreen 全接线 |
| 乱涂 26.5% 误爆大招 | A6 | falseBigSpellRate 0.035 |
| probe/bench 门禁红灯 | A7/H2/H3 | 双双 exit 0，bench 3000 笔 0 误配 |
| 天赋/灵兽不进战斗 | B8 | 1 层威能伤害 ×1.0600；灵兽 crit 7/50 |
| 墨客解锁双实现 | B13 | unlockMo 唯一实现 + contract 断言 |
| telegraph 不可见 | B10 | 侧栏意图 + 400ms 真冷却口径 |
| 画阁不能回放 | （R1 遗留） | gallery 存归一化点列并逐笔回放，18 用例 |
| mute 只挡落笔声 | E5 | 音频总线 + audio-bridge，6 用例 |
| 包子无出口 / 破甲不吃精度 | （R1 遗留） | 收兽包子优先；shred 0.04+0.12·precision |

### 仍未过（与 SOTA 的剩余差距）

| # | 问题 | 清单项 | 级别 |
| --- | --- | --- | --- |
| 1 | reaction().crit 死字段（金雷引暴击不生效） | B7 | **P0** |
| 2 | 乱涂自动红线不含 cloud，达标无门禁保护 | A6 保留 | **P0** |
| 3 | 金标准轨迹三份平行实现（synth/templates/trajectories） | A7 保留 | **P0** |
| 4 | API_CONTRACT.md 整体过期 + modifiers 三轨死代码 | H5 | **P0** |
| 5 | 存档无迁移链（version≠1 即弃档） | C7 | **P0** |
| 6 | pointer+touch 双栈 move 双采样；真机冒烟未做 | D5/D7 | P1 |
| 7 | 60fps 无实证；战斗时钟未上 rAF | F5/F7 | P1 |
| 8 | reducedMotion 无开关；opacity 小字 4.44:1 | E5/E7 | P1 |
| 9 | 根目录未跟踪 package-lock.json | G3 | P1 |
| 10 | 手绘 fixtures、导出/导入、盲测、字体离线退化 | A8/C8/H6 | P2 |

### Round 3 必收口（退出条件）

1. **B7 定案**：消费 `reaction().crit` 或删字段，同步契约/GDD，加暴击率偏移单测。
2. **A6 红线补 cloud**：scribble 误爆红线覆盖 cloud/circle/spiral 全口径 <5%，写进 probe 或 bench；六式 accuracy 不跌破 98%。
3. **A7 金标准合一**：probe/bench 轨迹改产自 `src/drawing/`（synth 或 templates 二选一），删 `scripts/trajectories.mjs` 独立几何。
4. **C7 迁移链**：migrate + 旧档备份 + 升级单测。
5. **H5 契约重写 + 清死代码**：API_CONTRACT 更新为现状；删 `combat/mods.js`、`talents.battleModifiers` 双轨。
6. **D5/D7**：PointerEvent 可用时不挂 touch 栈；iOS/Android 真机各过一场教程战（捎带 F5 录帧、B10/E1 目测）。
7. **G3 清根**：删根 `package-lock.json`，提交前 §8 两条命令输出为空。
8. 有余力：E7 实色化、E5 减动效开关、H4 补 normalizeModifiers/keyboardStroke 单测、C8 导出/导入。
