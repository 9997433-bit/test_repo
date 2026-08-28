# Round 1 派发简报 · 蚀核要塞

父调度器冻结。10 子代理并行。本轮目标：独立目录可启动、可放塔、可过一波、WebGPU/WebGL 能亮，测试覆盖纯模拟。

## 玩法冻结

- 环半径逻辑 40；24 个插座均布在环上（`socketIndex 0..23`）。
- 三条轨道 `lane ∈ {0,1,2}` = 下/中/上。高度分别为 `y=0 / 4 / 9`。
- 敌人沿环**向内**走：`radius` 从 52 降到 8（星核半径）。到达 8 则漏敌，扣核。
- 星核 `hp=20`。漏敌：小 1 / 中 3 / 精英 8。`hp<=0` 失败。
- 屑晶开局 180。击破给 `scrap`。塔价与升级见 `src/data`（F3 写死，O3 只读）。
- 过载：`F` 当前塔，伤害 ×2.2 持续 4s，然后停火 3s。不耗屑晶。
- 5 塔：`rail` 轨炮、`prism` 棱镜、`scatter` 霰星、`well` 坠井、`star` 星弩。
- 护甲：`shell` / `shield` / `swarm`。克制表由 data 提供。
- MVP：20 波 + Boss `etch-lord`。Round 1 至少跑通 **5 波 + 能放 3 种塔**；20 波与 Boss 可在数据层先写全、模拟层用简化波表。
- 棱镜折光 Round 1：直线光束；若目标方向上另一座 `prism` 且距离 ≤18，折 1 次（最多 2 段）。无视线挡板也可先做距离判定。

## 模块契约（禁止另起一套）

`src/sim`（无 Babylon、无 DOM）：

```js
createMatch(seed) -> match
step(match, input, dtSec) -> { events[] }
getView(match) -> JSON-pure view
```

`input`：`{ place?: {socket, towerId}, overclockSocket?: number, selectedSocket?: number, pause?: boolean }`

`view` 至少含：

```
backend, wave, scrap, coreHp, coreMax,
sockets: [{ i, towerId|null, overclockT, overheatT, hp }],
enemies: [{ id, lane, radius, y, hp, maxHp, armor, kind }],
shots: [{ id, kind, from, to, t }],
events: [{ type: 'kill'|'leak'|'place'|'deny'|'win'|'lose'|'overclock'|'overheat' }]
```

世界坐标（O2/O3 共用）：极坐标 `θ = i/24 * 2π`，`x=cosθ*r`, `z=sinθ*r`。`yaw=0` 朝 `+X`。

`src/engine`：`createRenderer(canvas) -> { engine, scene, backend: 'webgpu'|'webgl2', setQuality(tier), dispose }`  
质量档 `high|mid|low`：high=Bloom+Glow+阴影；mid=Bloom+Glow；low=关后处理。

`src/world`：`buildWorld(scene, getView)`、`syncWorld(scene, view)`、`pickSocket(scene, pickInfo) -> index|null`  
必须能看见：星核、环、24 插座、三层轨道示意、已放的塔。

`src/combat`：只把 `view.shots` 画成曳光/光束/抛物线；不要再算伤害。

`src/main.js`：启动引擎 → buildWorld → 每帧 `step` + `syncWorld` + HUD。

HUD class 冻结（F2 CSS / O4 HTML 共用）：`.sh-hud .sh-core .sh-scrap .sh-wave .sh-dock .sh-toast .sh-backend .sh-overclock`

## 画面诚实标准

要有：PBR 金属、星核发光、Bloom、弹道可辨、过载变色。  
不要承诺：满屏体积光、电影焦散、概念图 1:5 的几何密度。

## Round 1 完成定义

- `cd games/shihe-yaosai && npm test` 有纯 sim 测试且能跑（允许部分红，但 createMatch/step/getView 必须绿）。
- `npm run build` 能过，或至少 `src/main.js` 可被 Vite 解析。
- 浏览器打开 :4182 能看到环与核（即使波次简化）。
- 不碰其它游戏目录。
