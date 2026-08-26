# 时尚百货城（独立致敬版）

女性向超休闲放置经营：从一间快餐店起步，盘活整座百货城，一路换装、家装、招募伙伴，成为商业女王。

零构建、零运行时依赖的单页网页游戏 —— 纯 ES Modules + 原生 CSS，用任意静态服务器打开 `index.html` 即可游玩。`package.json` 只承载脚本，没有 `dependencies`，因此不需要 `npm install`。

## 环境要求

| 用途 | 要求 |
|---|---|
| 跑测试与核验脚本 | Node.js ≥ 20（依赖内置 `node --test`）；本仓库验证于 v22.14.0 |
| 起本地静态服务器 | Python 3（`npm start` 走 `python3 -m http.server`）；也可换用任意静态服务器 |
| 安装依赖 | 无。没有 `node_modules`，`npm install` 不是必需步骤 |

## 启动

```bash
cd games/fashion-mall
npm start
```

`npm start` 等价于 `python3 -m http.server 4173`。启动后浏览器打开 <http://localhost:4173> 即可开始游戏。

不想用 npm 或没有 Python 时，任何静态服务器都可以，例如：

```bash
cd games/fashion-mall
npx --yes serve -l 4173 .
```

注意必须通过 HTTP 访问，不能用 `file://` 直接打开 `index.html` —— 浏览器会以跨源策略拒绝加载 ES Modules。

## 测试

```bash
cd games/fashion-mall
npm test
```

Node 原生 test runner 直跑 `tests/*.test.js`，当前 **94 项断言全部通过**，分布如下：

| 测试文件 | 项数 | 覆盖内容 |
|---|---|---|
| `tests/save.test.js` | 41 | v1→v2 存档迁移、坏档备份与回退、脏档消毒、离线/在线结算一致性、8 小时封顶、时钟回拨、离线回执文案 |
| `tests/minigames.test.js` | 30 | 五店赏金纯函数、盲盒权重与保底、占卜转盘期望、RTP 上限 |
| `tests/economy.test.js` | 18 | 产出与成本曲线、回本增速窗口、金币 + 阅历双门槛、等级帽、目标升降档、被动阅历速率带 |
| `tests/contracts.test.js` | 3 | 家具 / 店铺视图 / 文案键的模块契约 |
| `tests/simulation.test.js` | 2 | 60 分钟推进：五店全解锁、限时目标续期 ≥10 轮 |

## 全量核验

```bash
cd games/fashion-mall
npm run verify
```

`npm run verify` 串行跑完四道关卡并打印汇总，任一条失败即整体以非零码退出，可直接挂 CI：

| 子命令 | 作用 | 通过门槛 |
|---|---|---|
| `npm test` | 94 项单元测试 | 零失败 |
| `npm run bench` | 长时 tick 吞吐与大数精度基准 | 吞吐 ≥ 50,000 ticks/s（本机实测约 75 万，随机器波动） |
| `npm run simulate` | 半活跃 / 纯挂机两条路径推演到满级 | 3 / 15 / 60 分钟节奏与 `docs/ECONOMY.md` 基准对齐 |
| `npm run boundary` | 7 个数值与存档边界探针 | `hazards: 0`（NaN 时间、负时间、空档、店铺等级溢出、目标饱和刷屏等全部 guarded） |

汇总输出形如：

```text
=== 验证汇总 ===
PASS  test     212ms
PASS  bench    1452ms
PASS  simulate 385ms
PASS  boundary 98ms
总计: 4/4 通过
```

四个子命令也可以单独运行，用于定位某一类回归。

## 玩法速览

**开场**：刮刮乐三幕开局 —— 取名、初次换装，收尾直接把玩家推进快餐店的第一份订单，全程约 60 秒内可完成首单。

**五间店铺**，按等级逐级解锁，每间一套独立小游戏：

| 店铺 | 解锁等级 | 小游戏 |
|---|---|---|
| 🍔 星光快餐 | Lv1 | 按订单顺序出餐，连击抬小费，错单有失误音；键盘 1–4 等效点击 |
| 🥬 晨光生鲜 | Lv2 | 接住掉落的当季货品 |
| 👗 缪斯服装 | Lv3 | 按顾客需求标签选成衣与配饰，命中越多评级越高（C→S） |
| 🎁 盲盒潮玩 | Lv4 | 付费开盒抽稀有度，带保底 |
| 🔮 星语占卜 | Lv5 | 转盘占卜，可兑换招募碎片 |

**核心循环**：小游戏赚金币 → 升级店铺、雇店员、签约伙伴 → 挂机收益变高 → 完成限时目标升档 → 解锁下一间店。店员招满即转自动经营，不必再手动出餐；未招满的店铺按 35% 出力继续挂机。

**养成三线**：换装（魅力影响客流）、家装豪宅（家具加成影响离线收益）、伙伴（按特长派驻对应店铺，可培训，加成随人数递减）。研发实验室按顺序解锁长期增益。

**付费随机玩法全部为负期望**：盲盒与占卜的 RTP 有硬上限并由单测锁死，随机奖励只承载碎片与惊喜，不构成印钞路径。

**离线结算**：回归时按离线倍率 0.65 补发收益与被动阅历，最多结算 8 小时。切后台、`pagehide`、时钟回拨都走同一条结算管线，不会重复计账或产生 NaN。

**存档**：自动写入 `localStorage`（键名 `fashion-mall-save-v1`）。「更多」页可导出 / 导入存档文本、切换静音、清空重来；读到坏档会先备份再回退，不静默清档。

无障碍方面：开场叙事与快餐出餐台可全键盘完成（快餐支持 1–4 数字键），事件弹窗用原生 `<dialog>` 带焦点陷阱与 Esc 关闭，toast 为 `role=status`，底栏带 `aria-current`，全局遵循 `prefers-reduced-motion`。

## 目录结构

```text
games/fashion-mall/
├── index.html          游戏唯一入口
├── package.json        仅 scripts，无 dependencies
├── src/
│   ├── app.js          单一 tick 泵、路由、HUD、存档面板
│   ├── core/           状态、结算、存档、动作层、数值钳制
│   ├── data/           balance / copy / a11y 三张数据表
│   ├── minigames/      五店小游戏与赏金纯函数
│   ├── fashion/ home/  换装纸娃娃与豪宅家装
│   ├── partners/ research/ events/   伙伴、研发产线、突发事件
│   ├── mall/           商场视图
│   ├── ui/             开场叙事与渲染工具
│   └── styles/         tokens / motion / main 三层 CSS
├── tests/              Node 原生 test runner 用例
├── scripts/            bench / simulate / boundary / verify
└── docs/               架构、设计系统、经济、模块契约、叙事、SOTA 量规
```

## 与仓库其他游戏的隔离

本目录是自包含的，可以整个复制走独立运行：

- **无向上引用**：`src/`、`tests/`、`scripts/`、`index.html` 中没有任何 `../../` 越界导入，也不 `require` 仓库根目录的任何文件。
- **自带 `package.json`**：所有脚本以 `games/fashion-mall/` 为工作目录，所有命令都必须先 `cd games/fashion-mall` 再执行；仓库根目录不需要、也不应该为本游戏添加脚本或依赖。
- **零依赖**：没有 `dependencies` / `devDependencies`，不产生 `node_modules`，不写 lockfile，不会和其他游戏的依赖树冲突。
- **存档命名空间独立**：`localStorage` 只使用 `fashion-mall-save-v1` 与 `fashion-mall-save-v1.corrupt` 两个前缀化键名，不会覆盖同源下其他游戏的存档。
- **改动边界**：本游戏相关的改动只落在 `games/fashion-mall/`，不修改仓库根目录及其他游戏目录。

## 文档

| 文档 | 内容 |
|---|---|
| `docs/ARCHITECTURE.md` | 模块分层、tick 泵与结算管线、零构建约束 |
| `docs/ECONOMY.md` | 产出 / 成本 / 赏金曲线、回本窗口、节奏基准（`npm run simulate` 的对照源） |
| `docs/DESIGN_SYSTEM.md` | 设计 token、配色、动效规范 |
| `docs/UX_NARRATIVE.md` | 叙事结构、文案口吻、无障碍要求 |
| `docs/MODULE_CONTRACT.md` | 各模块对外接口契约 |
| `docs/SOTA_RUBRIC.md` | 可打分的 SOTA 验收量规与逐轮记分 |
