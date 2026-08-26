# 取证报告：内存 / 帧率 / 对比度

> Round 3 / F2 交付，对应 `docs/SOTA_RUBRIC.md` 条目 **C5**（内存与节点规模）、**C6**（帧率证据）、**D4**（对比度 AA）。
> 所有数据为 2026-08 在真实浏览器中实测；每节附完整复跑步骤，不依赖任何入库脚本。
> 本报告只留档证据与缺口，不改动量规分数——定分权归下一轮复评席位。

---

## 0. 测量环境

| 项 | 值 |
| --- | --- |
| 机器 | 4 vCPU / 16 GB，Linux 6.12（云容器，无独立 GPU） |
| 浏览器 | Google Chrome 148.0.7778.96，无头模式（软件渲染 SwiftShader） |
| 驱动 | puppeteer-core（临时脚本，未入库；人工复跑步骤见各节） |
| 服务器 | `python3 -m http.server 4173`（与 `npm start` 同款），访问 `http://localhost:4173` |
| 视口 | 390 × 844（DESIGN_SYSTEM §10 移动设计基准），DPR 1 |
| 预置存档 | `localStorage["fashion-mall-save-v1"]` 写入 `{"v":2,"savedAt":<now>,"data":{"introDone":true,"level":3,"gold":5000,"goldEarned":5000,"xp":200,"lastTick":<now>,...}}`——跳过开场三幕并解锁生鲜店（Lv2 门槛），其余字段由 `fromSaveData` 补默认值 |
| Chrome 标志 | `--js-flags=--expose-gc`（采样前强制 GC）、`--enable-precise-memory-info`（heap 读数精确）、`--force-device-scale-factor=1` |

**无头模式的两点固有限制**（各节结论均按此口径解读）：

1. 无头合成器以固定 60 Hz 产帧，没有真机 vsync 抖动，帧率读数偏「整」；
2. 软件渲染没有 GPU 加速，`backdrop-filter` 毛玻璃这类合成开销反而**更贵**——帧率结论因此是保守下界，内存/节点结论不受影响。

---

## 1. 内存与 DOM 节点规模（C5）

### 1.1 方法

主商场页（tick 泵每 250ms 结算 + HUD 刷新的路径）挂机 **30 分钟**，每 15 秒采样一次，共 121 个采样点。每次采样前先调 `window.gc()` 强制垃圾回收，把「还没来得及回收」的分配噪声排除掉，剩下的增长才是真实滞留。三个互补口径：

| 口径 | 取法 | 回答的问题 |
| --- | --- | --- |
| attached | `document.getElementsByTagName("*").length` | 挂在文档树上的节点数是否随 tick 增长 |
| liveNodes | CDP `Memory.getDOMCounters().nodes` | 渲染进程内**全部存活** DOM 节点（含脱离节点）——attached 稳而 liveNodes 涨即为脱离节点堆积 |
| listeners | CDP `Memory.getDOMCounters().jsEventListeners` | 事件监听是否泄漏（dispose 协议是否兑现） |

另采 `performance.memory.usedJSHeapSize`（GC 后 JS 堆）作旁证。

### 1.2 结果

30 分钟 · 121 个采样点。期间游戏真实运转：金币 5,021 → 63,311，被动阅历推动 Lv3 → Lv4，目标多轮续期，**四次突发事件弹窗**（在场采样点位于第 210 / 511 / 1322 / 1772 秒，各 18s 超时自动收场）——测的是含弹窗的完整挂机路径，不是静态页面。

| 指标 | 起点 | 终点 | 峰值 | 判读 |
| --- | --- | --- | --- | --- |
| attached 挂载节点 | 93 | 94 | 110 | **零增长**。+1 是事件模块首次触发时一次性注入的 `<style>`（ensureStyles 模式，只注一次）；110 均为弹窗在场的瞬时值，收场即回落 |
| liveNodes 存活节点 | 266 → GC 后基线 241 | 411 | 455 | 首次事件收场后**一次性**上台阶 241 → 409（滞留一代脱离节点，详见下），此后三次事件收场都精确回到 409；411 = 409 + 升级 toast 文本节点。**无逐事件累积** |
| listeners 监听器 | 22 | 37 | 41 | 与 liveNodes 同构：首次事件后一次性 22 → 37，后续三次事件在场 +4、收场回落 37，**无累积** |
| JS 堆（GC 后） | 1.63 MB | 1.76 MB | 1.76 MB | 平稳，无单调爬升 |

**唯一的非水平段**是首次事件弹窗收场后的一次性台阶：+168 个存活节点（含文本节点）与 +15 个监听器跨约 100 次强制 GC 不回收。但第二、三、四次事件收场后水位分毫不涨（409/37 → 409/37 → 409/37）——即滞留的是**单代引用**（新一代替换上一代），不是逐事件叠加的泄漏。量级约数 KB，30 分钟曲线整体仍是水平线。

### 1.3 结论与缺口

- 主商场 tick **不逐秒新增节点**：`paintHud` 每 tick 只对四个 pill 做文本 diff（`app.js#paintPill`），30 分钟 attached 曲线是一条带弹窗毛刺的水平线。
- **无累积性脱离节点堆积**：四次事件弹窗循环水位不变，`createDisposer`/`disposeStage` 协议兑现。
- 发现一处**有界单代滞留**（非累积）：首次事件收场路径（`randomEvents.js#finish` → `dlg.remove()` → `onClose` → `app.js#paint` 整段重建 stage）之后，约一代旧 stage 子树规模的脱离节点被某个存活引用拽住，之后每次事件只替换不叠加。弹窗自身的清理（`clearInterval`、摘监听、`dlg.remove()`）经代码走查是完备的，嫌疑在原生 `<dialog>` 焦点还原链或重建时的上一代闭包引用。**建议后续轮次**：DevTools Memory 面板拍堆快照、按 `Detached` 过滤看 retainer 链定位；因其有界且量级仅数 KB，不构成 C5 意义上的泄漏。
- 缺口：本测使用 CDP `Memory.getDOMCounters` 连续采样而非 DevTools Memory 面板的堆快照三连拍（rubric C5 验收方法原文）；两者口径等价（都数存活 DOM 节点），如需快照文件留档可按 §1.4 手工补拍。

### 1.4 复跑步骤

1. `cd games/fashion-mall && npm start`，浏览器开 `http://localhost:4173`，过完开场（或按 §0 预置存档）。
2. 停在商场页，DevTools Console 粘贴：

   ```js
   const t0 = Date.now();
   setInterval(() => console.log(
     Math.round((Date.now() - t0) / 1000) + "s",
     "attached=" + document.getElementsByTagName("*").length,
     "heapMB=" + (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
   ), 15000);
   ```

3. 挂机 30 分钟（快速版 2–5 分钟即可看出斜率），attached 应恒为 93–94（首次事件注入样式后 +1；弹窗在场时约 +17，收场回落）。
4. 脱离节点核对：DevTools → Memory → Heap snapshot，挂机前后各拍一张，Summary 里搜 `Detached`，对比两张的 Detached 节点数应无净增；或 Performance Monitor 面板直接看 DOM Nodes / JS event listeners 两条曲线是否水平。

---

## 2. 帧率（C6）

### 2.1 方法

`requestAnimationFrame` 连续抽样：记录相邻回调的时间差（帧间隔），统计均值与分位数。两个场景：

- **主界面（商场页）**：挂机状态抽样 30 秒（1,801 帧）。负载 = 250ms tick 泵 + HUD diff + CSS 常驻氛围动画。
- **生鲜小游戏（局内）**：抽样 28 秒（1,681 帧）。为保证整个窗口都处于真实玩法负载，注入了一个 rAF 自动接货器——沿 `pointermove`（与真人拖动同一条输入路径）追最低的好货。抽样窗口内 0 漏接、连击拉到 ×1.60、飘字/掉落物持续生成，即**满负载局内**而非静止画面。

### 2.2 结果

| 场景 | 时长 | 帧数 | 平均 FPS | 帧间隔 p50 / p95 / p99 / 最大 | >20.5ms 帧 | >33.9ms 帧 |
| --- | --- | --- | --- | --- | --- | --- |
| 主界面（商场页挂机） | 30s | 1,801 | **60.0** | 16.7 / 16.7 / 16.8 / 16.8 ms | 0 | 0 |
| 生鲜小游戏（局内满负载） | 28s | 1,681 | **60.0** | 16.7 / 16.8 / 16.8 / 16.8 ms | 0 | 0 |

两场景最大帧间隔 16.8ms，**没有任何一帧越过 60fps 预算（16.7ms）的容差带**，更没有掉到 50/30fps 档的帧。目标线「主界面约 60、小游戏不低于 30」全部满足且余量巨大。

### 2.3 解读与缺口

- 结果与代码结构互证：主界面每 tick 只写四个文本节点（C2 已核）、无 rAF 循环；生鲜是唯一 rAF 驱动的视图，掉落物走 `translate3d` 合成层变换、逐帧只改 transform、出屏即自删（`fresh.js#step`）。软渲无 GPU 的容器里仍满帧，真机（有 GPU 合成 `backdrop-filter`）只会更宽裕。
- 缺口一：无头合成器恒定 60Hz 出帧，分位数「过于整齐」有合成器整拍成分；真机 DevTools 录制会呈现更自然的 16.4–17.1ms 抖动带。
- 缺口二：未在真实移动设备（中低端 Android）上实测；390 视口 + 4 vCPU 软渲是近似而非等价。按 §2.4 可在任意真机复跑。

### 2.4 复跑步骤

1. 起服务器进游戏（同 §1.4），停在待测视图。
2. **rAF 抽样版**——Console 粘贴：

   ```js
   (async (secs = 30) => {
     const d = [];
     await new Promise((done) => {
       let last = null, end = null;
       requestAnimationFrame(function f(t) {
         if (last !== null) d.push(t - last); else end = t + secs * 1000;
         last = t;
         t >= end ? done() : requestAnimationFrame(f);
       });
     });
     d.sort((a, b) => a - b);
     const q = (p) => d[Math.floor(d.length * p)].toFixed(1);
     console.log(`avgFps=${(1000 / (d.reduce((s, x) => s + x) / d.length)).toFixed(1)}`,
       `p50=${q(0.5)}ms p95=${q(0.95)}ms p99=${q(0.99)}ms max=${d[d.length - 1].toFixed(1)}ms`,
       `帧数=${d.length} 掉帧(>33.9ms)=${d.filter((x) => x > 33.9).length}`);
   })();
   ```

3. **DevTools 版**：Performance 面板录制 ≥10s，看 Frames 轨道有无红帧（dropped）与 FPS 曲线；生鲜局内录制时保持拖动竹筐。
4. 判定线：主界面 avgFps ≈ 60 且掉帧 0；生鲜 avgFps ≥ 30 且无连续红帧。

---

## 3. 对比度 WCAG AA（D4）

### 3.1 方法

双轨交叉：

1. **token 级核算**：按 WCAG 2.x 相对亮度公式对 `src/styles/tokens.css` 的关键色对逐一计算（含 rgba 玻璃表面 × 页面渐变三段停靠色的合成底），复核 DESIGN_SYSTEM §2.3 的全部承诺值。
2. **axe-core 4.x 整页审计**（`wcag2a + wcag2aa + wcag21aa` 规则集）：商场 / 换装 / 豪宅 / 伙伴 / 更多 / 生鲜局内共 6 个视图。axe 无法核算渐变底上的文字（报 incomplete），正好由第 1 轨的逐停靠色核算补位。

### 3.2 token 级核算全表

判定门槛：正文 4.5:1；大字（≥24px，或 ≥18.66px 加粗）3:1。

**§2.3 承诺复核**（✅ 实测兑现 / ❌ 实测未达）：

| 组合 | §2.3 承诺 | 实测 | 判定 |
| --- | --- | --- | --- |
| `--text-strong` ink-900 `#3a2433` / cream-50 | 13.4:1 | **13.40:1** | ✅ AAA |
| `--text-soft` ink-500 `#6b4b5c` / cream-50 | 7.1:1 | **7.12:1** | ✅ AAA |
| `--text-brand` rose-700 `#b02a5e` / 白底 | 6.3:1 | **6.29:1**（cream-50 上 5.94:1） | ✅ AA |
| `--text-success` mint-600 `#1e8f76` / cream-50 | ≥ 5.0:1 | **3.78:1** | ❌ **承诺值有误**，见 §3.4-1 |
| 白字 / `--grad-brand`（亮端→中段→深端） | 3.2–4.4:1 | **2.13 / 3.22 / 4.45:1** | ❌ 中深段与承诺一致，但 0% 亮端 `#ff8fb4` 只有 2.13，且严格口径本就不达标，见 §3.4-2 |
| ink-900 / `--grad-gold` 亮端 gold-200 | 9.4:1 | **11.21:1**（深端 gold-500 上 5.92:1） | ✅ AAA（实测优于承诺） |

**组件层实况**：

| 组合 | 实测 | 判定（正文 4.5:1） |
| --- | --- | --- |
| `--text-gold` gold-700 / cream-50 | 5.09:1 | ✅ |
| `--text-danger` `#c03652` / cream-50 | 5.10:1 | ✅ |
| toast：cream-50 字 / ink-900 底 | 13.40:1 | ✅ |
| 导航选中 ink-900 / `--grad-nav-active` 两端 | 11.64 / 10.10:1 | ✅ |
| 订单 chip 完成态 mint-600 / `--chip-done-bg` `#d9fff3` | 3.73:1 | ❌ 同 §3.4-1 |
| 禁用字 ink-300 / `--btn-disabled-bg` | 2.47:1 | §2.3 明示不承诺，维持 |
| `--text-faint` ink-300 / cream-50 | 2.93:1 | 同上，占位/禁用专用 |

**玻璃表面合成底**（rgba 白 × `--grad-page` 三段停靠色 `#fff3ec / #f9d8e5 / #e9d8ff`）：

| 组合 | 页面顶 / 中 / 底 | 判定 |
| --- | --- | --- |
| 正文 ink-900 / `--surface-card`(α=.86) 合成底 | 13.99 / 13.70 / 13.69:1 | ✅ AAA，毛玻璃不吃对比度 |
| 辅助 ink-500 / 同上 | 7.43 / 7.28 / 7.27:1 | ✅ AAA |
| 导航未选中 ink-500 / `--surface-glass-strong`(α=.93) 合成底 | 7.37:1（最不利的页面底段） | ✅ AAA |

### 3.3 axe-core 审计结果

6 视图 × 全 WCAG A/AA 规则：**违例合计 1 条**（其余视图 0 违例）。

| 视图 | 违例 | 内容 |
| --- | --- | --- |
| 豪宅页 | `color-contrast` ×3 节点 | `.fm-room-badge`（房间进度徽标）：rose-600 `#d43d75` 字 / `#fff0f5` 底，10.5px 常规字重，实测 **4.02:1** < 4.5（`home/styles.js` 内联样式，走的还是 legacy 别名 `--rose-deep`） |
| 其余 5 视图 | 0 | — |

incomplete（axe 判不了、非违例）两类，均已由人工核算或既有规范补位：

- `color-contrast` incomplete：渐变/玻璃底上的文字 axe 无法确定背景色——已在 §3.2 按逐停靠色 + 合成底口径全量补算；
- `aria-prohibited-attr` incomplete：`#app` 容器 div 与 HUD pill span 挂了 `aria-label` 但无对应 role（HUD pill 实为 `role=group` 内的动态读数）。属 D3 语义细节而非对比度问题，留给后续轮次顺手收。

### 3.4 缺口清单与修正建议（供后续轮次，本轮不动 `src/`）

1. **`--text-success` 不达 AA**（实测 3.78:1，§2.3 承诺 ≥5.0 与事实不符）。使用位皆为 13px 小字：订单 chip 完成态、小游戏飘字 `.mg-float.good`、服装命中标签、结算列表 `.ok`。**建议**：mint-600 由 `#1e8f76` 加深至 ≈`#17785f`（cream-50 上 5.10:1、chip 完成底上 5.03:1，兑现 ≥5.0 承诺且色相不变）；或完成态文字改 ink-900、薄荷只做底色。
2. **玫瑰渐变按钮白字严格口径不达 AA**。按钮文字 15px/600 不构成 WCAG「大字」（需 ≥18.66px 加粗或 ≥24px），4.5:1 门槛下三段全不过；现行缓解（`--btn-primary-text-shadow`）WCAG 不计入。**建议**：`--grad-brand` 端点整体压深一档（如 rose-700→rose-800，白字对比 6.29–8.84:1）；或维持现状但在 §2.3 把该行改标「装饰性大按钮，依赖字重+投影缓解，严格 AA 不承诺」，不要挂 AA 字样。
3. **豪宅房间徽标 4.02:1**（axe 唯一违例）。`home/styles.js` 的 `.fm-room-badge` 把 `--rose-deep`（rose-600）当文字色，正犯了 §2.3 规则「rose-500/600 只做底不做字」。**建议**：改 `--text-brand`（rose-700，`#fff0f5` 底上 5.70:1），一行闭合，也是 legacy 别名退役（§11 项 7）该收的 88 处之一。
4. 禁用态 ink-300（2.47–2.93:1）维持 §2.3 的「不承诺」现状——有禁用光标与降饱和整体传达，不计缺陷。

### 3.5 复跑步骤

1. token 核算：任何 WCAG 对比度计算器（如 WebAIM Contrast Checker）输入 §3.2 表中的前景/背景十六进制即可逐行复核；合成底按 `α·fg + (1−α)·bg` 先算实际底色再测。
2. axe：起服务器进游戏，逐视图在 Console 粘贴：

   ```js
   const s = document.createElement("script");
   s.src = "https://cdn.jsdelivr.net/npm/axe-core@4/axe.min.js";
   s.onload = async () => {
     const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } });
     console.log("违例", r.violations, "待人工", r.incomplete);
   };
   document.head.append(s);
   ```

3. Lighthouse（可选）：DevTools → Lighthouse → Accessibility 单项跑一遍，contrast 相关审计应只剩豪宅徽标一条（修复后归零）。

---

## 4. 量规映射摘要

| 条目 | 验收标准 | 本报告证据 | 残余缺口 |
| --- | --- | --- | --- |
| C5 内存与节点规模 | 长挂机 DOM 节点稳定、无脱离节点堆积 | §1：30 分钟 121 采样点，attached 93→94 零增长、四次事件弹窗循环无累积、堆 1.63→1.76MB | 首次事件后一处有界单代滞留待堆快照定位 retainer；快照文件未留档（口径等价的计数器曲线已留）；见 §1.3 |
| C6 帧率证据 | 主界面 60fps、小游戏 ≥30fps，附证据 | §2：主界面 60.0fps / 生鲜局内满负载 60.0fps，零掉帧，p99=16.8ms | 无头 60Hz 整拍 + 无真机实测；见 §2.3 |
| D4 对比度 AA | 全部文本 ≥4.5:1（大字 3:1），审计留档 | §3：token 全表核算 + axe 六视图审计留档 | 三处实测未达（§3.4-1/2/3），修正方案已给、待后续轮次落地 |

---

## 附录 A：30 分钟挂机采样 CSV（代表行摘录，全量 121 行）

摘录原则：起点、GC 后基线、四次弹窗在场行（`modalOpen=1`）及其前后行、升级行、终点；未摘的行与相邻摘录行完全一致（水平段）。

```csv
sec,attached,liveNodes,listeners,documents,heapMB,level,gold,modalOpen
0,93,266,22,2,1.63,3,5021,0
15,93,241,22,1,1.53,3,5408,0
120,93,241,22,1,1.58,3,8114,0
210,110,287,26,1,1.65,3,10434,1
225,94,409,37,1,1.65,3,10827,0
360,94,409,37,1,1.65,3,16602,0
496,94,409,37,1,1.66,3,20088,0
511,110,453,41,1,1.73,3,20475,1
526,94,409,37,1,1.75,3,20862,0
721,94,409,37,1,1.75,3,25894,0
946,94,409,37,1,1.74,3,31699,0
1322,110,453,41,1,1.75,3,43674,1
1562,94,409,37,1,1.75,3,49866,0
1577,94,411,37,1,1.74,4,50425,0
1757,94,411,37,1,1.75,4,61356,0
1772,110,455,41,1,1.75,4,62008,1
1787,94,411,37,1,1.76,4,62660,0
1802,94,411,37,1,1.76,4,63311,0
```

列说明：`attached` 挂载节点数；`liveNodes` 渲染进程存活 DOM 节点（CDP `Memory.getDOMCounters`，含脱离节点）；`listeners` JS 事件监听器数；`heapMB` 强制 GC 后 JS 堆；`modalOpen=1` 表示采样瞬间突发事件弹窗在场。
