# R1-FABLE-4 · 视觉 / 音频 SOTA 笔记

MODEL_SLUG: claude-fable-5-thinking-xhigh

## 改动文件（仅限本席位所有权范围）
- `warcraft3-td/js/render.js` — 全量重写（约 2100 行）
- `warcraft3-td/js/audio.js` — 全量重写（约 300 行）
- `.agent_workspace/notes-r1-fable-4.md`（本文件）

对外契约保持不变：`Renderer(canvas)` / `.resize()` / `.draw(game, alpha)` /
`.drawMinimap(canvas, game)` / `.drawPortrait(canvas, sel)`；
`AudioBus` 的 `.master` / `.enabled` / `.ensure()` / `.beep()` /
`click/build/sell/shoot(race)/leak/wave/win/lose`。main.js / hud.js / game.js 零改动。

## render.js 要点

### 地形（DESIGN 验收第 10 条：painted tiles, not flat rectangles）
- 地形一次性绘入 2x 超采样离屏画布（seed+尺寸为 key），每帧仅一次 `drawImage`。
  旧实现每帧 384 次 fillRect；新实现更漂亮且更快。
- 基底以半格（24px）为采样单元的 fbm 值噪声调色，叠加逐格椭圆笔触、
  宏观日光斑/阴影池、带高光+投影的土丘（伪高度）、草簇/野花/碎石/蘑菇散布，
  彻底消除网格感（首版按 48px 整格取色仍有方块残留，已修正）。
- 道路：AO 光晕 + 4 层色带 + 沿线噪点 + 双辙车痕 + 卵石 + 草皮压边；地图四周悬崖暗框。
- 所有散布均用确定性 hash（无逐帧 Math.random），缓存稳定。

### 实体
- 画家算法：doodad/塔/地面怪/英雄/城堡/传送门统一按 y 排序，飞行单位独立上层。
- 12 种塔各有专属剪影（人族石塔垛口/炮塔斜炮管/奥术悬浮球，兽族木塔/地洞刺矛/
  灵魂闪电球，暗夜活树/奇美拉巢/月井水池弯月，亡灵方尖碑/通灵金字塔/绞肉车），
  T2/T3 体型递增 + 金色品阶菱形 + T3 光晕 + 开火闪光（由 `cd` 与 `rate` 推断，无需 game.js 钩子）。
- 12 种怪按 `c.name.en` 映射专属造型（步兵盾、食尸鬼弓背、投石车转轮、
  飞龙扇翅、骑士马匹步态、地狱火焰体等），行走步态/朝向镜像/减速冰晶/中毒滴液/
  缠绕根须/Boss 红金光环。
- 英雄四职业专属披风+武器+挥击动画；圣盾泡、献祭火环、变身暗翼。
- 传送门：石拱+符文+旋涡螺旋臂（lighter 合成）+余烬粒子；城堡：双塔+城门暖光+飘旗。
- 弹道分攻击类型：穿刺=旋转箭矢、攻城=炮弹+烟迹、魔法=辉光球+闪电抖动、普通=飞石。

### 粒子与死亡反馈
- 渲染器本地粒子系统（上限 260，swap-remove）：死亡尘雾+彩色闪光、骸骨尸体渐隐
  （跟踪 creep id 消失来触发，无需改 game.js）、传送门余烬、夜间萤火虫、英雄脚下尘土。
- Boss 死亡触发屏幕震动。伤害数字描边+弹出缩放；spark 改为多点爆散+辉光。

### 其他
- 昼夜按 4 波循环平滑过渡（`waveIndex>>2`，指数缓动）；夜幕色罩在文字层之下。
- 辉光用预烘焙径向渐变 sprite（按颜色缓存），避免 shadowBlur。
- 小地图：地形缩略图预烘焙 + 传送门脉冲点/城堡金块/Boss 白框点/英雄菱形/镜头框。
- 肖像：无选中=要塞纹章；塔/英雄/怪复用同一 body painter 放大绘制（怪镜像朝左），
  帧内动画 + 金铆钉描边画框。

## audio.js 要点
- 主增益 → DynamicsCompressor 总线；`master` 滑条实时生效。
- 每音色 = 振荡器（可选 biquad 滤波、LFO 颤音、滑频）+ 循环白噪声 burst 分层。
- 四族射击音色区分（人族弓弦+哨音、兽族战鼓、暗夜风铃、亡灵暗嘶），每发随机 ±6% 失谐；
  30ms 射击节流 + 26 voice 上限防 40 塔齐射削波。
- build=双锤+凿环、sell=金币叮当+高频闪、leak=失谐双锯齿低鸣号角、
  wave=两音战号（带颤音）、win=琶音+持续和弦+微光噪声、lose=小调下行+55Hz 低吟。
  多音符全部用 AudioContext 时钟调度（移除 setTimeout）。

## 验证
- `node tests/run.mjs` 45 通过；`node tests/bench.mjs` 正常（0.22ms/tick）。
- 自建 headless 冒烟（/tmp/td_smoke.mjs，未入库）：伪 canvas 上下文跑真实 Game，
  覆盖 4 英雄 × 12 塔 × 12 怪 × 状态特效 × 昼夜 × 四类 portrait × minimap；
  压力档 40 塔+100 怪 JS 侧 0.70ms/帧（<16.6ms 预算），粒子/尸体上限受控。
- puppeteer + headless Chrome 实测：rAF 均值 60.1 FPS（战斗中 2.5s 采样）、
  0 页面错误（仅 favicon 404，与本目录无关）、0 漏怪；
  AudioContext state=running，全部音效接口在真实浏览器无异常。
- 工件：`r1_fable4_gameplay_day_combat_hero_cast_then_night_fade.mp4`（19s）、
  `r1_fable4_day_wide_painted_terrain_v2.png`、`r1_fable4_portal_closeup.png`、
  `r1_fable4_night_phase_fireflies.png`。

## 遗留 / 建议下一轮
- 真等距（菱形网格）需改 main.js 的 `toWorld` 逆变换，超出本席位文件所有权；
  当前为俯视 2.5D：y 排序 + 高体积 sprite + 顶光地形。若 R2 允许跨文件可升级。
- 闪电链只有首段弹道可视化；若 game.js 暴露 chain 命中序列（fx 事件），可画完整链。
- 塔被 Boss 战争践踏（队友新机制）时可加眩晕星环；需 game.js 在 tower 上暴露 stun 字段。
- 队友在共享树上并行改 game.js/data.js（Boss 践踏、施法播报等），本渲染器已实测兼容。
