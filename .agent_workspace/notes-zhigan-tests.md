# Zhigan headless test notes

## Coverage added

- Direct `_hitCreep` regression check for `creep._hitFlash === 0.16`.
- Non-lethal hits append a `spark` effect.
- Lethal hits still add the creep bounty to `gold` and `goldEarned`.
- Lethal hits append both `spark` and `ring` effects.
- A fixed-step 30-second benchmark starts with exactly 40 towers and 80 creeps, checks numeric simulation state after every tick, and enforces `< 4 ms/tick`.

## Results

Run on branch `cursor/warcraft3-td-737d` after commit `2b00ced`.

```text
$ node tests/run.mjs
45 passed, 0 failed

$ node tests/zhigan.mjs
8 passed, 0 failed
towers: 40
creeps: 80
ticks: 1800
wallMs: 456.77
msPerTick: 0.2538
nonFinite: null
```

`warcraft3-td/js/game.js` and `warcraft3-td/js/render.js` had no uncommitted worktree changes during the test run. No production JavaScript was edited for these checks.
