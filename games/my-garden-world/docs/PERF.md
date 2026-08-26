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
- Sparse legacy saves receive every current top-level state field while retaining persisted progress.
- Replaying delivery for an already-settled order UID cannot grant rewards or consume inventory twice.

## Deferred probes

- Offline catch-up has no reconciliation entry point yet. The current loop advances time only from active animation frames and caps each frame delta at 100 ms, so there is no offline settlement contract to probe.
- Migration coverage currently guards schema-field backfill. Level-aware catalog backfill remains deferred because `migrate` preserves a legacy `unlockedFlowers` list as-is.
- The duplicate-submission probe covers replay safety, not active-queue diversity. `spawnOrders` still samples templates with replacement and has no template-deduplication contract to assert.

## Known scaling pressure

- Order expiry currently replenishes the queue after each individual cancellation. A timeout wave therefore repeatedly filters templates and refills the queue instead of batching the work.
- Saving serializes the complete state synchronously. `arrangements` and `placedDecor` can grow without a configured cap, so long-running saves—not the fixed-size garden tick—are the main size and serialization risk.
- Garden simulation cost is linear in plot count, but plots and active orders are capped; this keeps the normal tick path bounded.
