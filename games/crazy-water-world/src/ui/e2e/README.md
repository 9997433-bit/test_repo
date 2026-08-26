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
OUT=/tmp/cww-e2e/shots node src/ui/e2e/smoke.mjs   # 中期存档：六屏功能走查，36 项断言
OUT=/tmp/cww-e2e/shots node src/ui/e2e/fresh.mjs   # 空存档：新手指引 → 建指挥中心，11 项断言
OUT=/tmp/cww-e2e/video node src/ui/e2e/demo.mjs    # 录一段走查视频，不做断言
```

环境变量：

- `CWW_URL` 目标地址，默认 `http://localhost:4174/`
- `OUT` 截图 / 视频输出目录
- `CHROME` 浏览器可执行文件，默认 `/usr/local/bin/google-chrome`

`seed.mjs` 不单独跑，它导出 `richSave()`：用真实的 `defaultState()` + `placeBuilding()`
拼出一份中期存档，并把漂浮物钉死（`vx: 0`、`ttl` 拉长），好让脚本能精确点中它们。
