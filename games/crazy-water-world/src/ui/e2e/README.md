# UI 端到端脚本

真浏览器跑一遍六屏，用来盯住「按需更新」这条线：一旦有人改回每帧 `innerHTML` 重建，
`smoke.mjs` 里的钓鱼指针与面板变更计数会立刻翻脸。

脚本放在 `src/ui/e2e/` 是因为本轮只对 `src/ui/**` 有写权限，它们不会被 vite 打包
（入口 `index.html` 够不到），也不在 vitest 的 `tests/**/*.test.js` 匹配范围里。

## 依赖

`playwright-core` 与 Chrome 都不在 `package.json` 里，需要各自准备：

```bash
npm i --no-save playwright-core   # 只在本地装，不污染 devDependencies
```

## 跑法

先起 dev server（`npm run dev`，默认 4174），另开一个终端：

```bash
OUT=/tmp/cww-e2e/shots node src/ui/e2e/smoke.mjs    # 中期存档：六屏功能走查，37 项断言
OUT=/tmp/cww-e2e/shots node src/ui/e2e/fresh.mjs    # 空存档：新手指引 → 建指挥中心，11 项断言
OUT=/tmp/cww-e2e/shots node src/ui/e2e/wiring.mjs   # Round 2 接线：阵容/伤病/种子/碎片/sticky/潜水，41 项断言
OUT=/tmp/cww-e2e/shots node src/ui/e2e/contract-r3.mjs  # Round 3 契约：钓鱼/图鉴/海区/海啸，41 项断言
OUT=/tmp/cww-e2e/video node src/ui/e2e/demo.mjs     # 录一段六屏走查视频，不做断言
OUT=/tmp/cww-e2e/video node src/ui/e2e/demo-r2.mjs  # 录一段 Round 2 接线走查视频，不做断言
OUT=/tmp/cww-e2e/video node src/ui/e2e/demo-r3.mjs  # 录一段 Round 3 契约走查视频，不做断言
```

`wiring.mjs` 是 Round 2 的接线证据链，每条断言对着一条「已实现但玩家看不见」的系统：

| 断言组 | 盯的接线 |
| --- | --- |
| 阵容与 selectLineup 逐位一致 / 不等于 `heroes.slice(0,5)` | `heroes/lineup.js` 真的被调用 |
| 勾选、超编拦截、前后排分栏 | 5v5 取舍有 UI |
| 种子 == `combat.battleSeed`，败一场后换种子 | 重试盐 |
| 阵亡进「养伤中」分栏、倒计时、不可委任 | `applyBattleInjuries` |
| Boss 首通后 `#bag-shard` +10 | `STAGES[*].firstClear.shard` |
| 名单两栏 / 动效开关刷新后仍在 / 横幅 sticky / 潜水切屏氧气继续掉 | 四条 UX 债 |

`contract-r3.mjs`是 Round 3 的契约证据链，盯的是「UI 自己攒了一套」这类偏航：

| 断言组 | 盯的接线 |
| --- | --- |
| 自动存档里能看见这一竿 / DOM 绿区 == `cast.window` | 钓鱼走 `beginCast`，竿子活在 state 上而非模块变量 |
| 切屏挂提示条、回来竿子还在 | `leave()` 不再偷偷剪线 |
| 指针压金条收杆判完美 / 图鉴 +1 / 首钓金币 | `castCursor` + `gradeCast` + `hookCast` 与画面同源 |
| 18 格图鉴、未收录只给轮廓、在池标记 | `fishCodex` |
| 三片海区 + 上锁理由逐字对上 `canDive` | `diveZones`，UI 不复读解锁表 |
| 氧气上限 = 海区表 + 船坞等级 | `beginDive` 按 `DIVE_ZONES` 生成会话 |
| 海啸准点落地 → 潜水被拽上来 / 收杆记「不算空军」 | `advanceDive` 与 `hookCast` 的强制分支 |

海啸那一段不靠等：`seed.mjs` 的 `tsunamiSave()` 用真实 `stepSim` 现筛种子，
让天气准点落在第 `atTick` 个量子（天气只由 `(seed, tick)` 决定，所以可复现）。

录像需要 playwright 自带的 ffmpeg（`npx playwright install ffmpeg`，或把系统 ffmpeg
软链到 `~/.cache/ms-playwright/ffmpeg-1011/ffmpeg-linux`）。

环境变量：

- `CWW_URL` 目标地址，默认 `http://localhost:4174/`
- `OUT` 截图 / 视频输出目录
- `CHROME` 浏览器可执行文件，默认 `/usr/local/bin/google-chrome`

`seed.mjs` 不单独跑，它导出 `richSave()`：用真实的 `defaultState()` + `placeBuilding()`
拼出一份中期存档，并把漂浮物钉死（`vx: 0`、`ttl` 拉长），好让脚本能精确点中它们。
