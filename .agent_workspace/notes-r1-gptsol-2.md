# R1-GPTSOL-2 — Bench / edge coverage

## Scope

- Added `warcraft3-td/tests/edges.mjs`, a no-dependency Node edge suite.
- Kept production game files unchanged.
- Kept `warcraft3-td/tests/bench.mjs` unchanged; its existing performance and smoke probes remain intact.

## Edge scenarios

1. Pausing an active wave freezes game time, spawning, wave state, and creep movement.
2. Speed `2x` doubles elapsed simulation time and creep travel for the same update duration.
3. Building, upgrading, and selling all towers reconciles gold exactly and clears occupancy.
4. Divine armor receives 5% damage from non-chaos attacks and full damage from chaos.
5. Letting every creep in a wave leak consumes all lives and reaches defeat.
6. A flying-only wave passes a cannon-only defense without cannon fire, and every flyer leaks.

## Validation

Executed from the repository root:

```sh
node warcraft3-td/tests/edges.mjs
node warcraft3-td/tests/run.mjs
node warcraft3-td/tests/bench.mjs
```

Results:

- Edge suite: `6 passed, 0 failed`.
- Main headless suite: `45 passed, 0 failed`.
- Benchmark: `0.1706 ms/tick`, below the `4 ms/tick` failure threshold.
