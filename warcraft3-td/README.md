# Ironoath Keep TD · 铁誓要塞 · 塔防

A vanilla HTML/CSS/JS tower defense in the spirit of classic RTS custom maps
(Element TD, Wintermaul and friends). Every sprite is drawn from canvas
primitives and every sound is synthesised with WebAudio — there are no
third-party or copyrighted assets anywhere in this directory.

原生 HTML/CSS/JS 塔防，致敬经典即时战略自定义地图。全部美术使用 Canvas 图元绘制，
音效由 WebAudio 合成，**不包含任何第三方版权素材**。

## Run

Open `index.html` directly — the game is fully playable from `file://`, with no
build step and no server. If you prefer a server:

```bash
cd warcraft3-td
python3 -m http.server 8080
```

## Controls

| Input | Action |
| --- | --- |
| Left click | Select a tower, pick a command card entry, place a building |
| Right click | Cancel build mode / order the hero to move |
| Arrow keys, edge scroll, middle-drag | Pan the camera |
| Mouse wheel | Zoom (anchored at the cursor) |
| `Q` `W` `E` `R` / `A` `S` `D` `F` / `Z` `X` `C` `V` | Command card grid hotkeys |
| `Esc` | Cancel build mode, then open the menu |
| `Space` | Pause |
| `1` `2` `3` | Game speed 1x / 1.5x / 2x |
| `N` | Call the next wave early for a gold bonus |

## Architecture

```
js/
  config.js            balance + tuning constants, one place for every number
  engine/
    rng.js             mulberry32 seeded PRNG — the only source of randomness
    path.js            polyline path: sampling, arc length, distance queries
    spatial.js         uniform-grid spatial hash for range/splash queries
    loop.js            fixed-timestep accumulator loop with render interpolation
    camera.js          faux-isometric camera: pan, zoom, tilt, clamping
    input.js           keyboard / mouse / touch, hotkeys, drag and edge pan
    audio.js           procedural WebAudio SFX
  data/                damage table, 36 towers, 30 waves, zh/en strings
  entities/            creep, tower, projectile, hero, fx (all pooled)
  sim/game.js          deterministic simulation: economy, waves, combat
  render/              baked terrain, canvas-primitive sprites, depth sorting
  ui/                  HUD, command card, minimap, tooltip, menus
  main.js              wiring: input -> sim -> render
tests/run.mjs          node test runner (no dependencies)
```

The simulation is a pure function of `(seed, difficulty, player input)`. It
advances in fixed 1/60 s ticks and never reads wall-clock time or
`Math.random`, so a given seed always produces the same run. Rendering is a
separate read-only pass that interpolates between the last two ticks.

## 中文说明

### 运行

直接用浏览器打开 `index.html` 即可，无需构建、无需服务器（完全兼容 `file://`）。
界面默认中文，可在「菜单 → 设置」里切换中英文。

### 玩法对应关系

这些系统都照搬自经典即时战略自定义塔防地图的规则：

| 系统 | 说明 |
| --- | --- |
| 攻击类型 × 护甲类型 | 7×7 伤害系数表（普通/穿刺/攻城/魔法/混乱/英雄/法术 对 无甲/轻甲/中甲/重甲/城甲/英雄/神圣），选中面板会直接列出每一档的 ×倍率 |
| 护甲减伤 | `减伤 = 0.06·护甲 / (1 + 0.06·护甲)`，与原作公式一致 |
| 经济 | 击杀赏金 + 每 15 秒按当前金币结算利息（2% 起，8% 封顶）；每 5 波产 1 木材；出售返还累计投入的 75% |
| 波次 | 30 波，第 5/10/15/20/25/30 波为首领；漏怪不会重生；清场 12 秒后自动开下一波，提前召唤有金币奖励 |
| 塔 | 4 个种族 × 3 条路线 × 3 个等级，共 36 座；只能建在草地，且永远无法封死道路 |
| 空中单位 | 走独立的空中捷径，只有穿刺／魔法／混乱能打到 |
| 英雄 | 一名指挥官，右键移动，Q/W/E/R 释放技能并消耗魔法值 |
| 难度 | 简单 / 普通 / 困难 / 疯狂，影响血量、赏金、初始金币与生命数 |

## Tests

```bash
node tests/run.mjs
```

## Design

See [DESIGN.md](./DESIGN.md).
