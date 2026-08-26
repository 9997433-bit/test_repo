# R1-OPUS-1 — core engine notes

Branch: `cursor/warcraft3-td-engine-3beb`. Everything lives in `warcraft3-td/`.

## What the engine guarantees

**Determinism.** The simulation is a pure function of `(seed, difficulty, player
input)`. All randomness goes through one mulberry32 PRNG owned by `Game`; the
suite asserts `Math.random` is never called during a tick and that two runs from
the same seed produce byte-identical checksum traces over 2400 ticks. Render-only
state (`px/py/pz` interpolation, `anim`, `hurtFlash`) is written during `update`
but never read by any decision, so drawing cannot perturb the sim.

**No soft-lock.** Four independent guards:
- the loop clamps raw frame deltas to `MAX_FRAME_MS` before they enter the
  accumulator, so an alt-tabbed tab cannot queue minutes of catch-up;
- a frame can never run more than `MAX_STEPS_PER_FRAME` ticks, and any leftover
  accumulator is dropped rather than carried (`droppedTicks` counts it);
- waves auto-start on a countdown, so an idle player still advances;
- lives reaching zero ends the run. `waves.test.js` runs an unattended game to
  completion to prove it terminates either way.

**Entity lifecycle.** Creeps, projectiles and fx come from pools and are swept in
place. Anything holding a cross-entity reference (tower target, projectile
target, hero target) also stores the entity `id` and revalidates it, because a
pooled object can be recycled into a different creep between ticks. `path.test.js`
asserts pool reuse actually happens and that the spatial hash contains no
leaked creeps after a sweep.

## Things worth knowing if you touch this

- **`shade()` and `mix()` must accept both `#rrggbb` and `rgb()`.** `mix()`
  returns `rgb()`, and creep drawing feeds its result back into `shade()`. The
  original `shade()` only parsed hex, so every slowed or poisoned creep drew its
  head and limbs pure black. Fixed via a shared `parseColor()`.
- **Status effects are ground rings, not body tints.** Mixing a warm body colour
  35% towards cyan desaturates it to grey; slowed units looked like blobs. The
  tint is now 20% and each debuff has its own marker.
- **The camera has HUD insets.** `setInsets(top, bottom)` shifts the world
  centre to the middle of the *uncovered* area, and `fitZoom()` is computed
  against that area. `minZoom` is lowered to the fit zoom so the whole
  battlefield can always be brought on screen. `Renderer.drawWorldFrame` paints
  the leftover space as a deliberate stone frame.
- **`_entries` is a pool, `_sorted` is the per-frame view.** Do not `slice()` the
  pool to sort it; that allocates an array every frame.
- **Classic scripts only.** Every source is an IIFE that assigns to `global.WC3`
  and also sets `module.exports`, which is what lets `tests/run.mjs` `require()`
  them with no build step while `index.html` still works over `file://`.
  `assets.test.js` fails if a `type="module"` script, a remote URL or an `<img>`
  sneaks in, and if `tests/run.mjs` falls out of sync with `index.html`.

## IP

All Blizzard proper nouns were removed: four original factions (Kingdom /
Warband / Grove / Blight), 36 renamed tower tiers, an original hero and boss
roster, and original UI copy. `assets.test.js` scans every shipped file for a
trademark list and fails the suite if one comes back. The only remaining
occurrence is the `warcraft3-td` directory name, which the brief fixes, and the
`WC3` internal namespace.

## Numbers

- 95 assertions across 10 suites, `node tests/run.mjs`, ~2s.
- 40 towers / 121 concurrent creeps: 0.021 ms per tick, ~48k ticks/s headless.
- Browser: 60 fps, 120 tps (2x speed), 0 dropped ticks, 17 ms peak frame,
  0 console errors over a full scripted playthrough to the wave-5 boss.
