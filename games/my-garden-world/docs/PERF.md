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

Correctness probes also guard these state invariants:

- Failed inventory withdrawals leave stock unchanged and no inventory count becomes negative.
- Flower unlocks form a monotonic set across level-ups, without duplicates or missed level-gated flowers.
- Sparse legacy saves receive every current top-level state field, retain persisted progress, and backfill all level-eligible flowers without duplicates.
- A four-cap absence settles only the configured two-hour maximum: water refills, all 12 auto-watered plots bloom without wilting, and order deadlines move by the applied interval.
- Active order templates stay unique through 250 adversarial refills, and the template that just left is not immediately reposted.
- Replaying delivery for an already-settled order UID cannot grant rewards or consume inventory twice.

## Known scaling pressure

- Order expiry currently replenishes the queue after each individual cancellation. A timeout wave therefore repeatedly filters templates and refills the queue instead of batching the work.
- Scheduled save flushes still serialize the complete state synchronously. `arrangements` and `placedDecor` can grow without a configured cap, so long-running saves—not the fixed-size garden tick—are the main size and serialization risk.
- Offline catch-up advances in two-second steps and is capped at 3,600 iterations. Its work is linear in the bounded plot count and applied absence.
- Garden simulation cost is linear in plot count, but plots and active orders are capped; this keeps the normal tick path bounded.
