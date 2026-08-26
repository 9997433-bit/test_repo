# R1-OPUS-3 — HUD 逻辑 / 输入（hud.js + main.js）

MODEL_SLUG: claude-opus-5-thinking-high-fast

状态：Round 1 任务完成。`node tests/run.mjs` 45/45；自建浏览器 HUD/输入回归 80/80。

## 文件所有权（只改了这三个）
- `warcraft3-td/js/hud.js`
- `warcraft3-td/js/main.js`
- 本笔记

`index.html` / `css/wc3.css`（FABLE-2）、`render.js` / `audio.js`（FABLE-4）、
`game.js` / `data.js`（OPUS-4）、`tests/`（GPTSOL）全部未动。新面板与新样式都在
运行时由 `hud.js` 注入（`<style id="hud-runtime-style">` + `#hud-panel`），所以
FABLE-2 在我开发期间重做 HUD 皮肤后，本地化与面板依然正常工作（已在录像中验证）。

## 交付内容

### 1. 命令卡提示显示攻击 / 护甲倍率
- `HUD.cmdTipHtml(i)` 按槽位类型生成富文本提示：建造 / 升级 / 出售 / 英雄技能 / 取消。
- 每个塔类提示都带 `_multiplierGrid(attackType)`：无甲·轻甲·中甲·重甲·城甲·英雄甲
  六格倍率，`>1` 绿、`<1` 红。
- `_waveLine()` 再给出「对当前波次 步兵(重甲 2) ×1.00 → 每击 14」，并正确处理
  「无法攻击空中」「魔法免疫」两种归零情况（复用 `SimCore.applyHit`）。
- 升级提示额外给出阶级差值：攻击 9 → 16、攻速 0.70 → 0.65、射程 140 → 155、
  DPS 12.9 → 24.6，以及是否买得起。
- 选中塔时下方属性行也带 DPS 与本波倍率；悬停战场上任意单位会显示反向克制表
  （哪种攻击类型克制它的护甲）+ 当前选中塔的实际每击伤害。
- 提示会随游戏状态每帧刷新（冷却倒数、金币变化都会实时更新），并做视口内夹取。
- **不再使用原生 `disabled`**：Chrome 不会给 disabled 按钮派发鼠标事件，
  「买不起」的按钮反而看不到解释。改成 `cmd-dim` + `data-deny`，
  提示始终可见（买不起的塔仍可进入放置预览，与 WC3 一致）。

### 2. 热键可靠性
- 热键改为**由可见命令卡驱动**：`HUD.resolveHotkey(letter)` 在当前卡面查槽位，
  点击与按键走同一条 `handleAction()`。卡面与键盘不可能再漂移。
- 修好原来的错误映射：旧 `{r:3,a:4,d:5,f:6,...}` 让 D/F 建错塔、
  `o_spirit`（第 6 座）根本按不出来。现在 QWERASDFZXCV 12 键逐一验证正确。
- 用 `e.code`（物理键位）而非 `e.key`，非拉丁 / 非 QWERTY 布局与大小写都可靠。
- 屏蔽 Ctrl/Meta/Alt 组合、`e.repeat` 连发、输入框内按键；菜单 / 设置 / 结算浮层
  打开时吞掉战斗热键。Space 一律 `preventDefault` 并 blur 焦点按钮，
  避免「点过按钮后按空格又触发那个按钮」。
- 新增：`P` 暂停、`F1` 选中并镜头对准指挥官、`+ / -` 调速、
  `F9` 日志、`F11` 盟友、`F10` 菜单。
- `Escape` 有明确优先级：关设置 → 关菜单（继续游戏）→ 关面板 →
  取消建造 → 取消选择 → 打开菜单。
- 卡面上没有的字母会回落到建造卡，所以选中塔 / 英雄时仍能直接按键开新建造。
- 键盘触发时对应按钮会闪光（可用金色 / 不可用红色），给出与鼠标一致的反馈。

### 3. 盟友 / 日志按钮真的打开面板
- `hud.js` 运行时创建 `#hud-panel`（双标签：盟友 / 日志 + 关闭），
  `main.js` 把两个顶栏按钮接上 `togglePanel()`；同一标签再点一次关闭。
- 日志页：`game.log` 全量条目 + `mm:ss` 时间戳，最新一条高亮，随游戏实时刷新
  （只在 HTML 变化时写 DOM）。
- 盟友页：要塞资源、指挥官 HP/法力、四族驻防塔数与各自 DPS、合计 DPS、
  波次进度与场上敌军数。
- 面板 z-index 低于模态浮层，Esc 可关，语言切换时整块重绘。

### 4. 设置实时生效
- `app.settings` 统一保存 语言 / 显示射程 / 伤害数字 / 音量 (+ 难度 / 英雄)，
  写入 `localStorage("azeroth-keep-td-settings")`，开局自动回填控件与新对局。
- 改动立即写进正在进行的 `game.settings` 与 `audio`，不再需要重开。
- **修掉一个真 bug**：音量拖到 0 会让 `audio.js` 的
  `exponentialRampToValueAtTime(0)` 抛异常；现在 `volume <= 0` 时置
  `audio.enabled = false`（静音而不是报错）。

### 5. 语言切换刷新菜单标签
- `HUD.applyLanguage()` 先处理任何 `[data-i18n]` 元素（给 FABLE-2 的前向接口），
  再结构化兜底：菜单标题 / 副标题 / 玩法说明 / 难度与英雄按钮 / 行标签 /
  设置标题 / 关闭按钮 / 复选框文字 / 底部属性行（攻击·护甲·射程·攻速）/
  顶栏（含热键提示）/ 文档标题。
- 复选框标签只替换尾部文本节点、属性行只替换首部文本节点，
  不会把 `<input>` / `<b>` 洗掉（已写测试）。
- `data.js` 里没有的键放在 `hud.js` 的 `EXTRA` 兜底表；攻击 / 护甲类型名单独用
  `ATK_NAME` / `ARM_NAME`，避免与 `STR.hero`（指挥官）之类的键冲突。
- 对局中切换语言会同步 `game.lang`，命令卡、提示、面板、属性行一起刷新。

### 6. 顺手修掉的输入缺陷（都在我的两个文件里）
- **放置后不清建造模式**：原来放完一座塔 `buildId` 仍然保留，之后每次点地图都在
  尝试继续建造，导致**再也选不中任何单位**。现在放置成功即退出建造模式
  （按住 Shift 可连续建造），并自动选中新塔。
- **小地图完全没有交互**：新增点击 / 拖拽移动镜头。
- **镜头会飘到地图外**：新增 `clampCam()`，平移 / 缩放 / 窗口变化 / F1 对准
  都把视野夹在地图内（地图比视口小时居中）。
- **菜单键会静默重开一局**：对局进行中「开始战役」变成「继续」并直接恢复；
  只有改了难度 / 英雄才回到「开始战役」（视为要开新局）。
- **结算浮层每帧重开**：`btn-restart` 之前会被下一帧的 `showEnd()` 立刻覆盖，
  现在每局只弹一次。
- 每帧 DOM 写入做了去重（文本、命令卡按钮 innerHTML、面板 HTML 都比对后再写）。

## 如何验证
1. `node warcraft3-td/tests/run.mjs` → 45 passed（无回归）。
2. 浏览器回归：`python3 -m http.server 8765`（在 `warcraft3-td/` 下）+
   puppeteer-core 驱动本机 Chrome，脚本见
   `/opt/cursor/artifacts/r1_opus_3_browser_hud_test_suite.mjs.txt`，
   80 项断言覆盖：启动无报错、12 个建造热键逐一对应、卡面驱动的 U/S/Q/W/E、
   买不起也能看提示、升级 / 出售 / 技能提示含倍率表、面板开关与 F9/F11/Esc、
   设置实时生效与持久化、菜单/对局内语言切换、放置后退出建造模式、
   Shift 连续建造、小地图导航与镜头夹取、菜单不会误重开。
   完整输出：`/opt/cursor/artifacts/r1_opus_3_hud_test_suites.log`。
3. 录像 `/opt/cursor/artifacts/r1_opus_3_hud_tooltips_hotkeys_panels_demo.mp4`
   端到端演示上述全部改动。

## 遗留问题（交给对应 owner）
1. `render.js:257` — `if (game.selected === t || (game.settings.showRange && game.selected === t))`
   是恒等式，`showRange` 关掉也照画。我这边设置已实时传到 `game.settings.showRange`，
   请 FABLE-4 改成 `if (game.settings.showRange && (game.selected === t || hover))`。
2. 浏览器可能保留 F11 全屏；顶栏「盟友」按钮与 F9/Esc 不受影响。
3. `index.html` 若加 `data-i18n="<STR key>"`，`applyLanguage()` 会自动接管，
   建议 FABLE-2 在改版时顺手加上，可以去掉我这边的结构化兜底。
4. 出售热键 S 是即时生效（与卡面显示一致，WC3 行为）；如果想要二次确认，
   需要产品侧拍板。
