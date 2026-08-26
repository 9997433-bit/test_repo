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

## Round 3 acceptance probes

`tests/probe/round3-acceptance.test.ts` is a deterministic release gate, not an additional timing benchmark. It keeps the performance budgets above unchanged while exhaustively checking the final order and workshop balance contracts.

| Contract | Probe scope | Accepted result |
| --- | --- | --- |
| Weighted live orders | Fill a level-one board with a fixed `0.8` template roll that distinguishes weighted selection from array-index selection | `r-inn`, `r-yingchun`, then `r-morning` |
| Global score ceiling | Every 2–4 stem multiset, including repeated flowers, across four seasons and four vases (327,200 arrangements) | Maximum 92; exactly the three canonical autumn/bronze recipes reach it |
| Tier rarity curve | Every unique 2–4 stem combination across four seasons in the bronze vase (51,704 arrangements) | 27,391 common; 22,962 elegant; 1,349 fine; 2 divine |
| Progression milestones | Every repeatable 2–4 stem arrangement available at each level, across all seasons and vases | Scores 60 / 70 / 85 / 92 first become reachable at levels 1 / 2 / 4 / 8 |
| Custom-order feasibility | Unique unlocked flowers, any season, bronze vase, at each order's `minLevel + 1` | Best scores by order are 73 / 75 / 86 / 86 / 92, meeting all five requirements |

The exhaustive probes enumerate combinations rather than random samples, so a passing result is reproducible and covers hue-based palette scoring, composition roles, duplicate penalties, and the custom-order progression curve together.

## Known scaling pressure

- Order expiry currently replenishes the queue after each individual cancellation. A timeout wave therefore repeatedly filters templates and refills the queue instead of batching the work.
- Scheduled save flushes still serialize the complete state synchronously. `arrangements` and `placedDecor` can grow without a configured cap, so long-running saves—not the fixed-size garden tick—are the main size and serialization risk.
- Offline catch-up advances in two-second steps and is capped at 3,600 iterations. Its work is linear in the bounded plot count and applied absence.
- Garden simulation cost is linear in plot count, but plots and active orders are capped; this keeps the normal tick path bounded.
