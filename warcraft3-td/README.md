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
advances in fixed 1/120 s ticks and never reads wall-clock time or
`Math.random`, so a given seed always produces the same run. Rendering is a
separate read-only pass that interpolates between the last two ticks.

## Tests

```bash
node tests/run.mjs
```

## Design

See [DESIGN.md](./DESIGN.md).
