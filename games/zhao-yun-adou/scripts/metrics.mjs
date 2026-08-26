const SIDE_IDS = ["player", "ai"];
const DURATION_BUCKET_SECONDS = 60;

function round(value, digits = 4) {
  return Number(value.toFixed(digits));
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * ratio) - 1)];
}

function durationHistogram(values) {
  if (!values.length) return [];
  const lastBucket = Math.floor(Math.max(...values) / DURATION_BUCKET_SECONDS);
  const counts = Array.from({ length: lastBucket + 1 }, () => 0);
  for (const value of values) {
    counts[Math.floor(value / DURATION_BUCKET_SECONDS)] += 1;
  }
  return counts.map((count, index) => ({
    minInclusive: index * DURATION_BUCKET_SECONDS,
    maxExclusive: (index + 1) * DURATION_BUCKET_SECONDS,
    count,
  }));
}

export function createMatchTelemetry(game) {
  const leaksByWave = new Map();
  const awakenedHeroes = { player: 0, ai: 0 };

  const stopLeak = game.bus.on("leak", (payload) => {
    if (!SIDE_IDS.includes(payload?.side)) return;
    const wave = game.state.sides[payload.side]?.wave ?? game.state.wave;
    const row = leaksByWave.get(wave) ?? { player: 0, ai: 0 };
    row[payload.side] += 1;
    leaksByWave.set(wave, row);
  });
  const stopAwaken = game.bus.on("hero-awaken", (payload) => {
    if (!SIDE_IDS.includes(payload?.side)) return;
    awakenedHeroes[payload.side] += Array.isArray(payload.names)
      ? payload.names.length
      : 0;
  });

  return {
    report() {
      return {
        leaksByWave: Object.fromEntries(
          [...leaksByWave.entries()]
            .sort(([a], [b]) => a - b)
            .map(([wave, counts]) => [wave, { ...counts }]),
        ),
        awakenedHeroes: {
          ...awakenedHeroes,
          total: awakenedHeroes.player + awakenedHeroes.ai,
        },
      };
    },
    dispose() {
      stopLeak();
      stopAwaken();
    },
  };
}

export function summarizeMatchMetrics(results) {
  const matchCount = results.length;
  const settled = results.filter((result) => result.settled);
  const playerWins = settled.filter(
    (result) => result.winner === "player",
  ).length;
  const maxWave = results.reduce(
    (highest, result) => Math.max(highest, result.maxWave ?? 0),
    0,
  );
  const leaksByWave = [];
  for (let wave = 1; wave <= maxWave; wave += 1) {
    const row = results.reduce(
      (counts, result) => {
        const observed = result.telemetry.leaksByWave[wave];
        counts.player += observed?.player ?? 0;
        counts.ai += observed?.ai ?? 0;
        return counts;
      },
      { player: 0, ai: 0 },
    );
    leaksByWave.push({
      wave,
      ...row,
      total: row.player + row.ai,
    });
  }

  const awakenedTotals = results.reduce(
    (totals, result) => {
      totals.player += result.telemetry.awakenedHeroes.player;
      totals.ai += result.telemetry.awakenedHeroes.ai;
      return totals;
    },
    { player: 0, ai: 0 },
  );
  const divisor = matchCount || 1;
  const durations = results
    .map((result) => result.durationSeconds)
    .filter(Number.isFinite);
  const durationDistributionSeconds = durations.length
    ? {
        samples: durations.length,
        min: round(Math.min(...durations), 2),
        p25: round(percentile(durations, 0.25), 2),
        p50: round(percentile(durations, 0.5), 2),
        p75: round(percentile(durations, 0.75), 2),
        p90: round(percentile(durations, 0.9), 2),
        p95: round(percentile(durations, 0.95), 2),
        max: round(Math.max(...durations), 2),
        histogram: durationHistogram(durations),
      }
    : {
        samples: 0,
        min: null,
        p25: null,
        p50: null,
        p75: null,
        p90: null,
        p95: null,
        max: null,
        histogram: [],
      };

  return {
    matches: matchCount,
    settled: settled.length,
    settledRate: round(settled.length / divisor),
    playerWins,
    winRate: round(playerWins / (settled.length || 1)),
    leaksByWave,
    avgAwakenedHeroes: round(awakenedTotals.player / divisor),
    avgAwakenedHeroesBySide: {
      player: round(awakenedTotals.player / divisor),
      ai: round(awakenedTotals.ai / divisor),
    },
    avgAwakenedHeroesTotal: round(
      (awakenedTotals.player + awakenedTotals.ai) / divisor,
    ),
    durationDistributionSeconds,
  };
}
