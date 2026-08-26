# 验收步骤（ACCEPTANCE）

> 与 `docs/SOTA_CHECKLIST.md` 配套：清单定义「验什么、阈值多少」，本文定义「怎么验、按什么顺序」。
> 全部命令在 `games/linghuashi/` 目录内执行；验收 harness 一律写到 `/tmp/acceptance/`，**不得**向仓库新增脚本文件。
>
> 基线记录：2026-08-26 07:17 UTC，HEAD `0265040` + 未提交工作树（Round 1 并发开发中，状态摘要 `d1df6630ecc6`）。

## 0. 环境准备

```bash
cd games/linghuashi
npm install          # node ≥ 20（基线 v22.14.0）
```

产出判定：install 无 error；`node_modules/` 只出现在本目录。

## 1. 自动化门禁（每次复评必跑，顺序执行）

```bash
npm test             # vitest：必须 4 文件 20+ 用例全绿，exit 0
npm run probe        # 六式识别 + 50 回合战斗冒烟，必须打印 "probe ok" 且 exit 0
npm run bench        # 3000 笔识别基准：mismatches=0 且 p95Ms<4，exit 0
npm run build        # vite build 成功，dist/assets/*.js gzip < 100KB
```

| 门禁 | 阈值 | 基线结果 |
| --- | --- | --- |
| vitest | 全绿 | ✅ 20/20 |
| probe | exit 0 | ❌ exit 1（curve 被判 zigzag） |
| bench | exit 0、mismatches=0、p95<4ms | ❌ exit 2（500 curve 误判；性能本身 p95≈0.06ms 达标） |
| build | 成功 | ✅ 29 模块 / gzip 13.5KB |

> 注意：bench/probe 的轨迹来自 `scripts/trajectories.mjs`，识别器重写后已漂移（SOTA_CHECKLIST A7）。
> 修复验收：与 `src/drawing/synth.js` 统一为单一金标准来源后，两脚本恢复 exit 0。

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

判定：
- 六类 `accuracy` 全部 ≥ 0.98；`meanPrecision` 全部 ≥ 0.85。基线：✅ 0.98–1.00 / 0.92–1.00。
- `falseBigSpellRate` < 0.05。基线：❌ **0.265**（乱涂 26.5% 被判为治疗/护盾/AoE 大招）。

## 3. 战斗公平（清单 B 组）

### 3.1 确定性重放（B1）

同 seed 跑两次 50 回合（`node -e` 或复用 probe），断言两次 `enemy.hp`、日志序列完全一致；
换 seed 后敌方伤害序列应变化。基线：✅。

### 3.2 结算幂等 / 奖励只发一次（B9，P0）

把下面存为 `/tmp/acceptance/reward-loop.mjs`（jsdom 挂载真实 UI）执行：

```js
import { createRequire } from "node:module";
const require = createRequire("/workspace/games/linghuashi/package.json");
const { JSDOM } = require("jsdom");
const dom = new JSDOM('<div id="app"></div>', { url: "http://localhost/", pretendToBeVisual: true });
Object.assign(globalThis, { window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, HTMLElement: dom.window.HTMLElement });
const ctx = new Proxy({}, { get: (_, p) =>
  p === "createLinearGradient" || p === "createRadialGradient"
    ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
dom.window.HTMLCanvasElement.prototype.getContext = () => ctx;
dom.window.AudioContext = class { createOscillator() { return { frequency: {}, connect() {}, start() {}, stop() {} }; }
  createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
  get currentTime() { return 0; } };
const { createStore } = await import("/workspace/games/linghuashi/src/core/store.js");
const { boot } = await import("/workspace/games/linghuashi/src/core/engine.js");
const store = createStore();
store.set({ classId: "jian", screen: "hub", stageId: "tutorial" });
const { navigate } = boot(document.getElementById("app"), store);
navigate("battle");
const canvas = document.querySelector("canvas");
const fire = (type, x, y) => canvas.dispatchEvent(
  new dom.window.MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));
const draw = () => { fire("pointerdown", 10, 50);
  for (let i = 1; i <= 30; i += 1) fire("pointermove", 10 + i * 10, 50);
  fire("pointerup", 310, 50); };
for (let g = 0; g < 40 && !store.get().lastResult; g += 1) draw();
const xp0 = store.get().xp, pills0 = store.get().qiPills;
await new Promise((r) => setTimeout(r, 2000));
console.log(JSON.stringify({ result: store.get().lastResult,
  xp0, xp1: store.get().xp, pills0, pills1: store.get().qiPills,
  rewardIdempotent: store.get().xp === xp0 && store.get().qiPills === pills0 }));
process.exit(0);
```

判定：`rewardIdempotent: true`（胜利 2s 后 xp/丹不变）。
基线：❌ **实测 xp 40→280、丹 8→56**——胜利后 200ms interval 不清理，每 tick 重复发奖并重渲染 result 屏。

### 3.3 克制与养成接线（B5/B7/B8）

- 同 seed、同 stroke，剑修打妖修（克制）与打体修（无克制）伤害比 ≈1.18。基线：✅。
- 点 1 层「符咒威能」后，UI 发起的战斗同笔伤害应 ×1.06。基线：❌ `screens.js` 的
  `createBattle` 不传 `modifiers`，天赋/灵兽/`reaction().crit` 全部不生效。
  修复验收：`node -e` 直接比对两份存档（有/无天赋）经 UI 战斗入口造成的首笔伤害。

### 3.4 telegraph（B10）

手测：战斗中敌人出手前 ≥400ms，界面出现可见预警（`enemy.intent === "strike"`）。基线：❌ UI 未展示 intent。

## 4. 存档（清单 C 组）

1. 自动化：`npm test` 中 `store.test.js`（损坏/版本容错）与 `progression.test.js`（8h 上限）。基线：✅。
2. 手测浏览器往返：开 dev → 选职 → 打赢教程 → 突破 → 刷新页面。
   判定：境界/丹/画阁记录不丢（localStorage key `linghuashi.save.v1`）。基线：✅（jsdom harness `SAVE_ROUNDTRIP ok:true`）。
3. 破坏性：DevTools 中把存档改成非法 JSON / `version: 99` 再刷新，应回默认档不白屏。基线：✅。
4. 幂等：连续进出枢纽屏 3 次，挂机奖励只入账一次（`idleClaim.claimed` 标记）。基线：✅。
5. 已知保留项：瞬态字段入档（C6）、无迁移（C7）、无导出（C8）——见清单。

## 5. 无障碍（清单 E 组，P0）

键盘走查脚本（全程不碰鼠标）：

1. `npm run dev` → Chrome 打开 `http://localhost:4173`。
2. Tab 聚焦「开卷入世」→ Enter；Tab 选职业卡 → Enter；Tab「以此入世」→ Enter。
3. 枢纽屏 Tab 到「入卷试笔」→ Enter 进战斗。
4. 战斗中按数字键 `1`（直线）… `6`（云纹）施法，打赢纸蛾精。
5. 结算屏 Tab「回画阁」→ Enter。

判定：每一步焦点可见、可达、可操作；数字键施法生效且读屏播报识别结果与战斗日志。
基线：❌ 第 4 步失败——**keydown "1" 无任何效果**（`keycast.js`/`dom.js` 已实现未接线）；
且无 aria-live、无 progressbar 语义、屏切换焦点丢失、无 :focus-visible 样式。
步骤 1–3、5 因原生 `<button>` 可通过。

## 6. 移动端（清单 D 组）

1. DevTools Device Mode（iPhone 14 / Pixel 7）：进战斗，单指画六式各一笔。
   判定：canvas 不滚动不缩放（touch-action:none），每笔只触发一次识别（**警惕 pointer+touch 双触发**，D5）。
2. 双指同时按下画线。判定：笔迹不互串（基线代码未跟踪 pointerId，预期 ❌）。
3. 系统手势/来电打断（pointercancel）。判定：当前笔迹丢弃不残留（基线未监听，预期 ❌）。
4. 真机各完成一场教程战（D7，基线未执行）。
5. 布局：≤860px 战斗单列、≤800px 枢纽单列。基线：✅（CSS 审查）。

## 7. 性能（清单 F 组）

1. `npm run bench`：p95 < 4ms、mismatches = 0、exit 0。基线：性能✅（p95 0.062ms）/ 门禁❌（识别漂移）。
2. 60fps 墨迹（F5）：Chrome Performance 录制 10s 连续画螺旋。
   判定：FPS ≥58、无 >50ms 长任务、无强制回流警告。基线：未执行。
3. 泄漏（F6）：连打 5 场（胜利+撤退混合）后 Console 执行
   `getEventListeners(window).resize?.length`，且用 Performance Monitor 观察 JS heap 稳定。
   判定：resize 监听数恒定、无活跃残留 interval。基线：❌（interval 与 resize 双泄漏）。

## 8. 目录隔离（清单 G 组）

```bash
git -C /workspace status --short | grep -v "games/linghuashi/" ; echo "---"
git -C /workspace diff --stat HEAD -- . ':!games/linghuashi'
```

判定：两条输出除空行/`---` 外为空。
基线：⚠️ 根目录存在**未跟踪 `package-lock.json`**（安装副产物）。严禁提交；Round 2 删除或在根 .gitignore 覆盖。

## 9. 基线结论（2026-08-26 07:17 UTC 快照）

### 已过

vitest 20/20；六式合成识别 98–100% 且 precision ≥0.92；识别 p95 0.06ms、战斗 0.017ms/回合；
存档往返/容错/8h 上限/幂等结算；战斗 RNG 确定性、灵气护栏、护盾次序、克制与五行系数、日志上限；
构建与 preview 服务器；目录隔离主体、独立依赖树、响应式与触摸事件基础。

### 未过（按严重度）

| # | 问题 | 清单项 | 级别 |
| --- | --- | --- | --- |
| 1 | 胜利后奖励每 200ms 重复发放 + interval/resize 泄漏（实测 xp 40→280） | B9/F6 | **P0** |
| 2 | 键盘无法施法，教程战键盘不可通关（keycast/dom 未接线） | E1–E4 | **P0** |
| 3 | 乱涂 26.5% 误爆大招（治疗/护盾/AoE 可白嫖） | A6 | **P0** |
| 4 | probe/bench 门禁红灯（轨迹金标准与识别器漂移，curve→zigzag） | A7/H2/H3 | **P0** |
| 5 | 天赋/灵兽/金雷引 crit 未接入实战，养成闭环断裂 | B8/B7 | **P0** |
| 6 | 墨客解锁双实现冲突（6 笔 vs 6 式），unlock.js 未被 UI 调用 | B13 | P1 |
| 7 | 敌人 telegraph 不可见 | B10 | P1 |
| 8 | 移动端双事件触发 / 多指互串 / 无 pointercancel | D5/D6 | P1 |
| 9 | mute/reducedMotion 无开关、无 prefers-reduced-motion | E5 | P1 |
| 10 | 60fps 无实证；瞬态字段入档；无版本迁移；契约文档过期 | F5/C6/C7/H5 | P2 |

### Round 2 必修 P0（退出条件）

1. **战斗结算幂等**：胜/负只结算一次；清理 interval 与 painter（含 resize 监听）；
   验收 = §3.2 脚本 `rewardIdempotent: true` + §7.3 零泄漏。
2. **键盘施法接线**：keycast + dom.js a11y 基建接入战斗屏；验收 = §5 键盘走查全通 + 数字键 1-6 施法生效。
3. **乱涂误爆 < 5%**：识别器对 cloud/circle/spiral 设置信度下限或 scribble 优先门槛；
   验收 = §2 矩阵 `falseBigSpellRate < 0.05` 且六式 accuracy 不跌破 0.98，并把该断言写进 bench。
4. **恢复 probe/bench 门禁**：轨迹金标准统一到 `synth.js` 单一来源；验收 = §1 四条命令全部 exit 0。
5. **养成接入实战**：UI `createBattle` 传入 `battleModifiers(save)`（含 `reaction().crit` 消费）；
   验收 = §3.3 天赋伤害偏移可测 + 新增单测覆盖 normalizeModifiers/battleModifiers。
6. **墨客解锁单一实现**：以 `unlock.js`「6 种不同笔法」为准并接入 UI；验收 = 同型 6 笔不解锁、六式集齐解锁一次且幂等。
