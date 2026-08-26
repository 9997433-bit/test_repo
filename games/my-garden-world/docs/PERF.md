# Performance budgets

Run the probes with:

```bash
npm run probe
```

The timing probes measure the simulation hot path in Vitest/Node. They intentionally exclude DOM rendering, animation-frame scheduling, and `localStorage` latency so regressions in game-state work are visible without browser noise.

| Probe | Workload | Budget |
| --- | --- | ---: |
| Garden simulation | 500 ticks at 100 ms/tick, 12 active plots, level 12 orders, and an active spirit | ≤ 100 ms wall time |
| Order timeout storm | 250 waves of five simultaneous expirations (1,250 cancellations and replacements) | ≤ 250 ms wall time |
| Save roundtrip | 12 plots, every flower in inventory, 100 arrangements, 100 decorations, and a full order queue | ≤ 64 KiB serialized |

Correctness probes also guard two state invariants:

- Failed inventory withdrawals leave stock unchanged and no inventory count becomes negative.
- Flower unlocks form a monotonic set across level-ups, without duplicates or missed level-gated flowers.

## Known scaling pressure

- Order expiry currently replenishes the queue after each individual cancellation. A timeout wave therefore repeatedly filters templates and refills the queue instead of batching the work.
- Saving serializes the complete state synchronously. `arrangements` and `placedDecor` can grow without a configured cap, so long-running saves—not the fixed-size garden tick—are the main size and serialization risk.
- Garden simulation cost is linear in plot count, but plots and active orders are capped; this keeps the normal tick path bounded.
