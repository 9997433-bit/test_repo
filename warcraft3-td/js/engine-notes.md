# Engine Notes — 引擎内部备忘（R1-FABLE-1 审计随笔）

For Round 2 engineers. 面向 Round 2 工程代理。Snapshot: commit `35a732c`.

## 模块图 Module graph (classic scripts, load order = dependency order)

```
sim-core.js   pure math, dual browser/Node export (module.exports || root.SimCore)
   ↓
data.js       strings/MSG templates, towers, heroes, waves, lumber tech, boss kits
   ↓
audio.js      WebAudio synth bus (no game dep)
render.js     Renderer: cached terrain, painted sprites, corpses/particles (local state only)
game.js       Game: the whole sim; DOM-free except localStorage (try/catch)
hud.js        HUD: DOM panels, command card, tooltips w/ multiplier grids
main.js       boot, settings persistence, input; hotkeys resolve via hud.resolveHotkey
```

Tests (`tests/run.mjs`, `edges.mjs`, `bench.mjs`) require `sim-core.js` via
createRequire, then assign `globalThis.SimCore` before requiring `data.js`
and `game.js`. Any new global a script reads must exist on `globalThis` in
that harness too.

## Update order per tick — 顺序即语义，勿重排

`Game.update(dt)`: economy → wave spawn → creeps (move/DoT/leak, resets
`armorBonus`) → rebuild spatial hash → boss abilities (frost/shroud auras,
stomp) → towers (reads hash + auras) → hero → projectiles → fx → wave-clear.
Invariants:
- Spatial hash only contains living creeps and is rebuilt once per tick;
  towers/projectiles must query it, never scan `creeps` (hero `_closestCreep`
  is the lone allowed linear scan).
- `armorBonus`/`shred` are recomputed each tick; never persist them.
- Creeps are compacted (`filter`) after `_tickCreeps`; do not hold indexes
  across ticks, hold `id`s (projectiles already do).

## 已知失效旋钮 Known dead/overridden knobs (Round 2 targets)

- `data.js` tower `slow: 0.25/0.35`, `poison: 3/4` are ignored;
  `game.js _hitCreep` hard-codes slow 1.6s @ 0.65× and poison 2.4s @ 6 dps.
- `game.js spendLumber` / `lumberUpgradeState` and `wavePreview()` have no UI
  callers (lumber shop unreachable; no top-bar preview chip).
- Chain lightning (`_tickProjectiles`) can revisit the original target on the
  2nd bounce (only excludes `from`) and picks bucket order, not nearest.
- Hero panel armor "4 hero" is display-only fiction; hero damage intake
  (`_heroTakeDamage`) ignores armor entirely (flat dps, capped 60).
- `Game.eco` fields are copied out at construction; `eco` itself is dead after
  that. `interestRate` lives on `Game`, not `eco`.

## 性能 Performance

- Headless sim: 0.175 ms/tick @ 40 towers / 80 creeps (bench.mjs gate: 4 ms).
- Renderer caches terrain+road to an offscreen canvas (`_ensureTerrain`,
  invalidated by size/night phase). In-browser FPS is still unmeasured —
  measure before optimizing further.
- HUD updates are diffed (`setText` guards, command-card `dataset.sig`);
  keep that pattern for any new panel.

## 确定性 Determinism

Seed → `mulberry32`; the sim must stay bit-reproducible for `snapshot()`
equality tests. Renderer-only randomness (particles, flair) may use
`Math.random()` but must never write into `Game` state.
