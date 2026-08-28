# 蚀核要塞 · SOTA 分级清单（L0–L3）

维护：Fable-4（SOTA 验收）。本文是全部验收条目 ID 与阈值的**唯一事实源**；玩家视角的验收体验单见同目录 `ACCEPTANCE.md`（只引用本文 ID，不另立数值）。所有冻结数值以 `.agent_workspace/shihe-yaosai/GOAL.md` 与 `round1/BRIEF.md` 为准，本文与其冲突时以简报为准并回改本文。

## 0. 等级定义

| 等级 | 名称 | 含义 | 判定作用 |
| --- | --- | --- | --- |
| **L0** | 红线 | 任何时刻不许违反的硬约束 | 违反任一条 → 本轮整体 REJECT，其余条目不再计分 |
| **L1** | 骨架线 | Round 1 出厂门槛：能启动、能放塔、能过波、能亮 | Round 1 结束时全绿才过门 |
| **L2** | 成品线 | 20 波 + Boss 的完整可玩成品 | Round 2 主目标 |
| **L3** | SOTA 线 | 性能、确定性、稳定性与反馈打磨 | Round 3 收口目标 |

低级别条目在后续轮次**持续生效**：Round 2/3 验收时 L0/L1 项全部复测，回归即 FAIL。

ID 前缀：`GL` 隔离红线 · `YQ` 引擎 · `HM` 画面 · `WF` 玩法 · `CS` 测试与命令 · `XN` 性能与稳定。

## 1. GL · 隔离与流程红线（全部 L0）

| ID | 条目 | 验证方式 |
| --- | --- | --- |
| GL-1 | **独立目录**：本游戏全部代码、文档、测试、脚本只落在 `games/shihe-yaosai/**`；不改 `games/` 下其它游戏，不改仓库根业务（catalog / pages workflow 归父调度器 Round 3） | 审查改动文件路径清单，出现越界路径即 FAIL |
| GL-2 | **端口 4182**：`dev` 与 `preview` 脚本均固定 `--port 4182`，不与其它游戏抢端口 | 读 `package.json` scripts；`npm run dev` 后访问 `http://localhost:4182` |
| GL-3 | **零跨游戏引用**：不 import、不 fetch、不读取 `games/` 下任何其它游戏的代码、样式或资源 | `rg -n "games/" src index.html` 命中里不得含非 `shihe-yaosai` 路径；`rg -n '\.\./\.\.' src` 应零命中 |
| GL-4 | **无运行时 CDN**：不从任何外部 URL 加载脚本 / 字体 / 贴图 / 模型；引擎与依赖只走本地 `node_modules` | `rg -n "https?://" src index.html` 命中仅允许出现在注释或许可证文本；`npm run build` 后对 `dist/` 复查同样零外链；断网后游戏仍可玩 |
| GL-5 | **无账号 / 后端 / 付费 / 版权素材下载** | 全树抽查；不存在登录、支付、遥测上报、外部素材拉取代码 |
| GL-6 | **模拟纯净**：`src/sim/**` 与 `src/data/**` 不 import Babylon、不触碰 DOM / BOM / 存储 | `rg -n "@babylonjs\|\bwindow\b\|\bdocument\b\|\bnavigator\b\|\blocalStorage\b\|requestAnimationFrame" src/sim src/data` 零命中 |
| GL-7 | **共享只读文件**（`package.json` / `vite.config.js` / `README.md` / `.gitignore`）只做已在简报声明过的追加式改动 | diff 审查 |
| GL-8 | **代理流程**：每个子代理输出首行声明真实模型 slug，禁止静默降级或换模 | 核对各子代理回执首行与 `OWNERSHIP.md` 表格 |

## 2. YQ · 引擎

| ID | 等级 | 条目 | 验证方式 |
| --- | --- | --- | --- |
| YQ-1 | L1 | 引擎为本地依赖 **Babylon.js 8**（`@babylonjs/core` ^8.x），无任何 CDN 引擎脚本 | 读 `package.json`；配合 GL-4 复查 `index.html` 与 `dist/` |
| YQ-2 | L1 | `createRenderer(canvas)` 返回 `{ engine, scene, backend, setQuality, dispose }`，`backend ∈ {'webgpu','webgl2'}` | 读 `src/engine/**` + 浏览器实测 |
| YQ-3 | L1 | **WebGPU 优先**：在支持 WebGPU 的桌面 Chrome 中 `backend === 'webgpu'` | 浏览器实测 + HUD 徽标 |
| YQ-4 | L1 | **WebGL2 回退**：WebGPU 不可用（如以 `chrome://flags` 关闭或旧环境）时自动落到 `webgl2`，游戏照常可玩，不白屏、无未捕获异常 | 禁用 WebGPU 后重开 `:4182` 实测 |
| YQ-5 | L1 | HUD `.sh-backend` 徽标显示**真实**后端字样，不许写死 | 对照 YQ-3 / YQ-4 两种环境下的徽标 |
| YQ-6 | L1 接口 / L2 全档 | 质量档 `high / mid / low`：high = Bloom + Glow + 阴影；mid = Bloom + Glow；low = 关全部后处理。L1 只要求 `setQuality` 存在且 low 档确实关后处理；L2 要求三档全部生效、运行中切换即时呈现、不需刷新 | 读代码 + 浏览器逐档切换截图对比 |
| YQ-7 | L2 | 窗口 resize / 浏览器缩放后画面不拉伸、不模糊、不裂 | 手动缩放窗口实测 |

## 3. HM · 画面（诚实标准）

评判基准是**桌面 Chrome WebGPU 实时运行画面**，不是概念海报静帧。

| ID | 等级 | 条目 | 验证方式 |
| --- | --- | --- | --- |
| HM-1 | L1 | 星核自发光可见；环体、24 插座、三层轨道示意（y=0/4/9）在画面中肉眼可辨 | 打开 `:4182` 截图核对 |
| HM-2 | L1 | **Bloom 生效**：high / mid 档下发光体有可辨溢光 | high 档与 low 档截图对比 |
| HM-3 | L1 | **弹道可辨**：实战中至少能看到轨炮曳光与棱镜直线光束两类弹道之一（两类齐备为佳） | 放塔实战观察 |
| HM-4 | L2 | 5 种塔形体一眼可辨（不靠文字提示也能区分），环体与塔具备 PBR 金属质感 | 五塔并排截图 |
| HM-5 | L2 | **Glow 辉光层**在 high / mid 档对发光材质生效 | 截图对比 |
| HM-6 | L1 过载变色 / L2 过热渐变 | **过载中的塔明显变色**；L2 起停火冷却期有可辨的过热色→恢复色渐变 | 按 `F` 实测录屏 |
| HM-7 | L2 | 三类弹道视觉分化：曳光（rail / star）、光束（prism 及其折射段）、抛物线（scatter / well 按 GDD 定义） | 实战观察 |
| HM-8 | L3 | 击杀、漏敌扣核、Boss 出场有清晰画面反馈（受击闪、核体受损脉冲等），反馈量级以不掉帧为限 | 实战录屏 |

### 3.1 负面清单（明确**不是**验收项，任何轮不得写进目标或以缺失为由扣分）

- 满屏体积神光（volumetric god rays）
- 电影级焦散（caustics）
- 概念图 1:1 / 1:5 的几何密度
- 实时全局光照、路径追踪

## 4. WF · 玩法（冻结数值以简报为准）

| ID | 等级 | 条目 | 验证方式 |
| --- | --- | --- | --- |
| WF-1 | L1 | 拓扑冻结：24 插座均布逻辑半径 40 的环上；三轨 `lane 0/1/2` 高度 `y=0/4/9`；敌人 `radius` 由 52 向内降到 8（星核半径），到 8 即漏敌 | sim 单测 + 画面核对 |
| WF-2 | L1 | 星核 `hp=20`；漏敌扣核 小 1 / 中 3 / 精英 8；`hp<=0` 产生 `lose` 事件 | sim 单测 |
| WF-3 | L1 | 屑晶开局 180；击破得 `scrap`；屑晶不足时放塔被拒并产生 `deny` 事件 | sim 单测 + 浏览器提示 |
| WF-4 | L1 数据与模拟 / L2 全可视 | **5 种塔**（`rail` 轨炮、`prism` 棱镜、`scatter` 霰星、`well` 坠井、`star` 星弩）数据齐全，sim 层 5 种均可放置、扣费、开火；浏览器内 Round 1 至少 3 种有形体，L2 起 5 种全部可视可放 | sim 单测遍历 5 塔 + 浏览器实测 |
| WF-5 | L1 | **过载**：`F` 对当前选中塔生效，伤害 ×2.2 持续 4s，随后停火 3s，不耗屑晶；过载/停火期内重复触发被拒 | sim 单测（数值与时序断言）+ 浏览器实测 |
| WF-6 | L1 | 护甲三类 `shell / shield / swarm`，克制倍率由 `src/data` 提供并在伤害计算中生效 | sim 单测：同塔打三类护甲伤害不同且符合克制表 |
| WF-7 | L1 | 棱镜折光按 Round 1 冻结规则：直线光束；目标方向上距离 ≤18 存在另一座 `prism` 则折 1 次，至多 2 段；允许纯距离判定、不要求视线遮挡 | sim 单测 + 画面观察 |
| WF-8 | L1 | **至少 5 波**可完整跑通（刷出、可清完或漏完，波次推进），HUD 波次计数正确；20 波波表允许先在数据层写全、模拟层用简化波表 | `npm run probe` 到第 5 波 + 浏览器实测 |
| WF-9 | L2 | **20 波全量波表 + Boss「蚀主」（`etch-lord`）**：可战、可胜、可败；`win` / `lose` 事件与结算呈现齐全 | 完整对局实测 + 无头跑通 |
| WF-10 | L2 | 塔升级线（塔价与升级按 `src/data`）在 UI 可用，升级后强度变化可感 | 实测 + 数值抽查 |
| WF-11 | L3 | 数值成立：标准打法下 20 波 + Boss 可通关；完全放任不管必输（可赢可输，曲线不塌） | 无头基准跑批 + 人工对局 |

## 5. CS · 测试与命令

所有命令在 `games/shihe-yaosai/` 下执行。

| ID | 等级 | 条目 | 验证方式 |
| --- | --- | --- | --- |
| CS-1 | L1 | `npm test` 退出码 0；至少含真实断言覆盖：`createMatch / step / getView` 契约与 view 字段形状、放塔扣费与 deny、漏敌扣核、过载数值（×2.2 / 4s / 3s） | 实跑并抽读断言，只 import 不断言的空壳测试按缺失计 |
| CS-2 | L1 | `npm run probe` 退出码 0：无头以 1/60s 步进打到第 5 波，输出 JSON 含 `wave / kills / leaks / coreHp / p99StepMs` | 实跑核对输出 |
| CS-3 | L1 | `npm run build` 退出码 0；产物 `dist/` 无外链脚本（配合 GL-4） | 实跑 + `rg` 复查 dist |
| CS-4 | L1 | 测试与探针全程不依赖浏览器 / GPU / DOM，纯 Node 可跑 | 在无显示环境实跑 |
| CS-5 | L2 | 确定性：同 seed 同输入序列 → `getView` 关键字段快照一致 | 确定性单测 |
| CS-6 | L2 | 探针或基准覆盖 20 波 + Boss 全程路径 | 实跑 |
| CS-7 | L3 | `npm run bench` 固定 seed 批量对局全部收敛，零不变量违例（不变量至少含：`scrap ≥ 0`、`coreHp ∈ [0, coreMax]`、同一插座不重复占用、事件类型合法） | 实跑 bench 输出 |

## 6. XN · 性能与稳定

| ID | 等级 | 条目 | 验证方式 |
| --- | --- | --- | --- |
| XN-1 | L2 | `npm run probe` 报告的 `p99StepMs ≤ 8`（骨架期只记录不设限） | probe 输出 |
| XN-2 | L2 | 桌面 Chrome WebGPU high 档，常规波次（约 50 敌 + 满配塔）体感流畅无长卡顿；WebGL2 回退 mid 档可玩 | 实测录屏 |
| XN-3 | L3 | 20 波满场 + Boss 场景 `p99StepMs ≤ 8`，常规波次 `≤ 4`；渲染在 high 档维持流畅（目标 60fps，短暂波峰不低于 45） | probe / bench + 实测 |
| XN-4 | L3 | 连续 3 局不刷新页面：不崩溃、不越玩越卡；`dispose` 正确、反复切质量档不累积后处理 | 长测实测 |
| XN-5 | L3 | 全程控制台零未捕获异常、零红色报错（浏览器 / 驱动自身的警告可记录白名单） | DevTools 核查 |

## 7. 各轮过门映射

- **Round 1 过门（L1 门）** = GL-1…GL-8 全绿 **且** 下列 L1 项全绿：
  YQ-1 / YQ-2 / YQ-3 / YQ-4 / YQ-5 / YQ-6(接口档)、HM-1 / HM-2 / HM-3 / HM-6(过载变色)、WF-1 / WF-2 / WF-3 / WF-4(数据与模拟档) / WF-5 / WF-6 / WF-7 / WF-8、CS-1 / CS-2 / CS-3 / CS-4。
  其中若 YQ-4（WebGL2 回退环境）当轮无法搭建，可凭代码路径审查 + 强制 `webgl2` 启动参数实测代替，并在判定记录注明。
- **Round 2 过门（L2 门）** = L0 / L1 复测全绿 + 全部 L2 项全绿。
- **Round 3 过门（L3 门）** = L0–L3 全部全绿。

## 8. 判定记录区（Fable-4 每轮回写）

每轮结束追加一节，格式：轮次 / 判定（PASS 或 REJECT）/ 被验提交 / 三条命令实跑输出摘要 / 未过条目 ID 与现象一句话。证据（截图、录屏、JSON 输出）随判定一并归档。

_（暂无记录：Round 1 尚未验收。）_
