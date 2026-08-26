import { performance } from "node:perf_hooks";
import { existsSync } from "node:fs";

const TICKS = Math.max(2000, Number.parseInt(process.env.BENCH_TICKS ?? "2000", 10) || 2000);
const DETERMINISM_TICKS = 50;
const DETERMINISM_SEED = "bench-same-seed";
const DETERMINISM_TOLERANCE = 1e-6;
const RESOURCE_KEYS = new Set(["food", "wood", "coal", "iron"]);

const moduleCandidates = {
  state: ["../js/state.js", "../js/game/state.js", "../js/core/state.js"],
  climate: ["../js/systems/climate.js", "../js/climate.js"],
  economy: ["../js/systems/economy.js", "../js/economy.js"],
  city: ["../js/systems/city.js", "../js/city.js"],
  population: ["../js/systems/population.js", "../js/population.js"],
  combat: ["../js/systems/combat.js", "../js/combat.js"],
};

const tickNames = {
  climate: ["tickClimate", "updateClimate", "climateTick", "tick"],
  economy: ["tickEconomy", "updateEconomy", "economyTick", "tick"],
  city: ["tickCity", "updateCity", "cityTick", "tick"],
  population: ["tickPopulation", "updatePopulation", "populationTick", "tick"],
  combat: ["tickCombat", "updateCombat", "combatTick", "tick"],
};

async function loadFirst(role, candidates) {
  const attempts = [];
  for (const specifier of candidates) {
    const url = new URL(specifier, import.meta.url);
    if (!existsSync(url)) {
      attempts.push({ specifier, error: "module not found" });
      continue;
    }
    try {
      const namespace = await import(url);
      return { role, specifier, namespace, status: "loaded", attempts };
    } catch (error) {
      return {
        role,
        specifier,
        namespace: null,
        status: "error",
        attempts,
        error: error?.message ?? String(error),
      };
    }
  }
  return { role, namespace: null, status: "stub", attempts };
}

function defaultState(seed = 1) {
  return {
    tick: 0,
    day: 0,
    meta: { seed, tick: 0, day: 1 },
    resources: { food: 1000, wood: 1000, coal: 600, iron: 300 },
    morale: 70,
    population: 100,
    buildings: { furnace: { level: 1 } },
    climate: {
      temperature: 4,
      coldWaveActive: false,
      coldWaveTicksLeft: 0,
    },
    army: { troops: 1000 },
  };
}

function clone(value) {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}

async function makeInitialState(stateModule, seed = 1) {
  if (!stateModule) return defaultState(seed);
  for (const name of ["createInitialState", "createGameState", "createState", "getInitialState"]) {
    if (typeof stateModule[name] === "function") {
      const result = await stateModule[name](seed);
      if (result && typeof result === "object") return result;
    }
  }
  for (const name of ["initialState", "defaultState", "INITIAL_STATE"]) {
    if (stateModule[name] && typeof stateModule[name] === "object") return clone(stateModule[name]);
  }
  if (stateModule.default && typeof stateModule.default === "object") return clone(stateModule.default);
  if (typeof stateModule.default === "function") {
    const result = await stateModule.default();
    if (result && typeof result === "object") return result;
  }
  return defaultState(seed);
}

function findTick(namespace, names) {
  if (!namespace) return null;
  for (const name of names) {
    if (typeof namespace[name] === "function") return { name, fn: namespace[name] };
  }
  if (typeof namespace.default === "function") return { name: "default", fn: namespace.default };
  return null;
}

function resourcesOf(state) {
  if (!state.resources || typeof state.resources !== "object") state.resources = {};
  for (const key of RESOURCE_KEYS) {
    if (!Number.isFinite(state.resources[key])) state.resources[key] = 0;
  }
  return state.resources;
}

function moraleOf(state) {
  const candidates = [
    state.morale,
    state.publicSupport,
    state.popularSupport,
    state.people?.morale,
    state.population?.morale,
    state.city?.morale,
  ];
  return candidates.find(Number.isFinite);
}

function setMorale(state, value) {
  if (Number.isFinite(state.morale) || !state.people) state.morale = value;
  if (state.people && Number.isFinite(state.people.morale)) state.people.morale = value;
  if (state.population && typeof state.population === "object" && Number.isFinite(state.population.morale)) {
    state.population.morale = value;
  }
  if (Number.isFinite(state.publicSupport)) state.publicSupport = value;
  if (Number.isFinite(state.popularSupport)) state.popularSupport = value;
}

function furnaceLevel(state) {
  return (
    state.buildings?.furnace?.level ??
    state.buildings?.furnace ??
    state.city?.buildings?.furnace?.level ??
    state.city?.furnaceLevel ??
    state.furnaceLevel ??
    0
  );
}

function populationSize(state) {
  if (Number.isFinite(state.population)) return state.population;
  return state.population?.total ?? state.people?.total ?? state.city?.population ?? 0;
}

const stubs = {
  climate(state, context) {
    state.climate ??= {};
    const phase = context.tick % (7 * 16);
    if (phase === 0) {
      state.climate.coldWaveActive = true;
      state.climate.coldWaveTicksLeft = 2 * 16;
      context.metrics.coldWaveTriggers += 1;
    }
    if (state.climate.coldWaveTicksLeft > 0) {
      state.climate.coldWaveTicksLeft -= 1;
      state.climate.coldWaveActive = true;
    } else {
      state.climate.coldWaveActive = false;
    }
    state.climate.temperature =
      4 + furnaceLevel(state) * 3.2 + (state.climate.coldWaveActive ? -14 : 0);
  },
  economy(state) {
    const resources = resourcesOf(state);
    resources.food = Math.max(0, resources.food + 2.4);
    resources.wood = Math.max(0, resources.wood + 1.3 - 0.08);
    resources.coal = Math.max(0, resources.coal + 0.65 - 0.035);
    resources.iron = Math.max(0, resources.iron + 0.3);
  },
  city() {},
  population(state) {
    const resources = resourcesOf(state);
    const people = populationSize(state);
    resources.food = Math.max(0, resources.food - people * 0.012);
    const current = moraleOf(state) ?? 70;
    const temperature = state.climate?.temperature ?? 4;
    const delta = resources.food <= 0 ? -3.5 : temperature < -6 ? -2.4 : temperature < 0 ? -0.8 : 0.1;
    setMorale(state, Math.max(0, Math.min(100, current + delta)));
  },
  combat(state, context) {
    if (context.tick % 100 !== 0) return;
    if (state.army && Number.isFinite(state.army.troops)) {
      state.army.troops = Math.max(0, state.army.troops - 1);
    }
  },
};

function looksLikeState(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      ("resources" in value ||
        "buildings" in value ||
        "climate" in value ||
        "population" in value ||
        "morale" in value ||
        "tick" in value),
  );
}

function absorbResult(state, result) {
  if (looksLikeState(result?.state)) return result.state;
  if (looksLikeState(result)) return result;
  return state;
}

function coldActive(state) {
  return Boolean(
    state.climate?.coldWaveActive ||
      state.climate?.blizzardActive ||
      state.climate?.blizzard?.active ||
      Number(state.climate?.blizzardDaysLeft) > 0 ||
      state.weather?.coldWaveActive ||
      state.weather?.blizzard ||
      state.coldWave?.active,
  );
}

function explicitColdCount(state) {
  const values = [
    state.climate?.coldWaveCount,
    state.climate?.blizzardCount,
    state.weather?.coldWaveCount,
    state.stats?.coldWaveCount,
  ].filter(Number.isFinite);
  return values.length ? Math.max(...values) : 0;
}

function inspectNumbers(root) {
  const nanPaths = new Set();
  const resourceNanPaths = new Set();
  const negativeResourcePaths = new Set();
  const seen = new WeakSet();

  function visit(value, path, resourceContext = false) {
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        nanPaths.add(path);
        if (resourceContext) resourceNanPaths.add(path);
      }
      if (resourceContext && value < 0) negativeResourcePaths.add(path);
      return;
    }
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    for (const [key, child] of Object.entries(value)) {
      visit(child, `${path}.${key}`, resourceContext || RESOURCE_KEYS.has(key));
    }
  }

  visit(root, "state");
  return {
    nanPaths: [...nanPaths],
    resourceNanPaths: [...resourceNanPaths],
    negativeResourcePaths: [...negativeResourcePaths],
  };
}

async function invokeTick(system, state, context) {
  if (system.source === "stub" || system.fn.length < 2) return system.fn(state, context);
  const source = Function.prototype.toString.call(system.fn).slice(0, 300);
  const match = source.match(/^[^(]*\(([^)]*)\)/);
  const second = match?.[1]?.split(",")[1]?.trim().toLowerCase() ?? "";
  if (/^(dt|delta|delta_time|deltatime|elapsed|seconds|step)$/.test(second)) {
    return system.fn(state, context.dt, context);
  }
  if (/^(tick|tickcount|tick_count)$/.test(second)) return system.fn(state, context.tick, context);
  if (/^(tickms|tick_ms|ms)$/.test(second)) return system.fn(state, context.tickMs, context);
  if (/^(rng|random)$/.test(second)) return system.fn(state, context.rng, context);
  if (/(catalog|buildings|definitions|defs|config)/.test(second)) return system.fn(state);
  return system.fn(state, context);
}

async function runSeededTicks(stateModule, systems, seed, tickCount) {
  let state = await makeInitialState(stateModule, seed);
  state.meta = state.meta && typeof state.meta === "object" ? state.meta : {};
  state.meta.seed = seed;
  const metrics = { coldWaveTriggers: 0 };
  const bus = { emit() {}, on: () => () => {} };

  for (let tick = 0; tick < tickCount; tick += 1) {
    if (state.meta && typeof state.meta === "object") {
      state.meta.tick = tick;
      state.meta.day = Math.floor(tick / 16) + 1;
    }
    const context = {
      tick,
      dt: 0.25,
      tickMs: 250,
      state,
      metrics,
      bus,
      rng: () => 0.5,
    };
    for (const role of ["climate", "economy", "city", "population", "combat"]) {
      state = absorbResult(state, await invokeTick(systems[role], state, context));
      context.state = state;
    }
    state.tick = tick + 1;
    if (Number.isFinite(state.day)) state.day = state.tick / 16;
    if (state.meta && typeof state.meta === "object") {
      state.meta.tick = tick + 1;
      state.meta.day = Math.floor((tick + 1) / 16) + 1;
    }
  }

  return state;
}

async function sameSeedResourceDeterminism(stateModule, systems) {
  const first = await runSeededTicks(stateModule, systems, DETERMINISM_SEED, DETERMINISM_TICKS);
  const second = await runSeededTicks(stateModule, systems, DETERMINISM_SEED, DETERMINISM_TICKS);
  const firstResources = resourcesOf(first);
  const secondResources = resourcesOf(second);
  const differences = {};
  let absoluteDifferenceSum = 0;

  for (const key of RESOURCE_KEYS) {
    const difference = Math.abs(firstResources[key] - secondResources[key]);
    differences[key] = difference;
    absoluteDifferenceSum += difference;
  }

  const pass =
    Number.isFinite(absoluteDifferenceSum) &&
    absoluteDifferenceSum <= DETERMINISM_TOLERANCE;
  return {
    pass,
    seed: DETERMINISM_SEED,
    ticks: DETERMINISM_TICKS,
    tolerance: DETERMINISM_TOLERANCE,
    absoluteDifferenceSum,
    differences,
    first: Object.fromEntries([...RESOURCE_KEYS].map((key) => [key, firstResources[key]])),
    second: Object.fromEntries([...RESOURCE_KEYS].map((key) => [key, secondResources[key]])),
  };
}

async function main() {
  const loaded = await Promise.all(
    Object.entries(moduleCandidates).map(([role, candidates]) => loadFirst(role, candidates)),
  );
  const brokenImport = loaded.find((entry) => entry.status === "error");
  if (brokenImport) {
    throw new Error(
      `${brokenImport.role} import failed (${brokenImport.specifier}): ${brokenImport.error}`,
    );
  }
  const modules = Object.fromEntries(loaded.map((entry) => [entry.role, entry.namespace]));
  let state = await makeInitialState(modules.state);
  if (!state || typeof state !== "object") throw new Error("state factory did not return an object");

  const systems = {};
  for (const role of ["climate", "economy", "city", "population", "combat"]) {
    const production = findTick(modules[role], tickNames[role]);
    systems[role] = production
      ? { source: `production:${production.name}`, fn: production.fn }
      : { source: "stub", fn: stubs[role] };
  }

  const metrics = { coldWaveTriggers: 0 };
  let transitionColdCount = 0;
  let previousCold = coldActive(state);
  const initialExplicitColdCount = explicitColdCount(state);
  let minMorale = Number.POSITIVE_INFINITY;
  let maxMorale = Number.NEGATIVE_INFINITY;
  const nanPaths = new Set();
  const resourceNanPaths = new Set();
  const negativeResourcePaths = new Set();
  const eventBus = {
    emit(type) {
      if (/cold.?wave|blizzard|寒潮/i.test(String(type))) metrics.coldWaveTriggers += 1;
    },
    on() {
      return () => {};
    },
  };

  const started = performance.now();
  for (let tick = 0; tick < TICKS; tick += 1) {
    if (state.meta && typeof state.meta === "object") {
      state.meta.tick = tick;
      state.meta.day = Math.floor(tick / 16) + 1;
    }
    const context = {
      tick,
      dt: 0.25,
      tickMs: 250,
      state,
      metrics,
      bus: eventBus,
      rng: () => 0.5,
    };
    for (const role of ["climate", "economy", "city", "population", "combat"]) {
      const result = await invokeTick(systems[role], state, context);
      state = absorbResult(state, result);
      context.state = state;
      const inspection = inspectNumbers(state);
      inspection.nanPaths.forEach((path) => nanPaths.add(path));
      inspection.resourceNanPaths.forEach((path) => resourceNanPaths.add(path));
      inspection.negativeResourcePaths.forEach((path) => negativeResourcePaths.add(path));
    }
    state.tick = tick + 1;
    if (Number.isFinite(state.day)) state.day = state.tick / 16;
    if (state.meta && typeof state.meta === "object") {
      state.meta.tick = tick + 1;
      state.meta.day = Math.floor((tick + 1) / 16) + 1;
    }

    const currentCold = coldActive(state);
    if (currentCold && !previousCold) transitionColdCount += 1;
    previousCold = currentCold;

    const morale = moraleOf(state);
    if (Number.isFinite(morale)) {
      minMorale = Math.min(minMorale, morale);
      maxMorale = Math.max(maxMorale, morale);
    }
  }
  const elapsedMs = performance.now() - started;
  const determinism = await sameSeedResourceDeterminism(modules.state, systems);

  const finalExplicitColdCount = explicitColdCount(state);
  const coldWaveTriggers = Math.max(
    metrics.coldWaveTriggers,
    transitionColdCount,
    finalExplicitColdCount - initialExplicitColdCount,
  );
  const report = {
    ticks: TICKS,
    elapsedMs: Number(elapsedMs.toFixed(3)),
    ticksPerSecond: Number(((TICKS * 1000) / Math.max(elapsedMs, 0.001)).toFixed(2)),
    resources: {
      hasNaN: resourceNanPaths.size > 0,
      hasNegative: negativeResourcePaths.size > 0,
      nanPaths: [...resourceNanPaths],
      negativePaths: [...negativeResourcePaths],
    },
    stateHasNonFinite: nanPaths.size > 0,
    nonFinitePaths: [...nanPaths],
    moraleRange:
      Number.isFinite(minMorale) && Number.isFinite(maxMorale)
        ? [Number(minMorale.toFixed(3)), Number(maxMorale.toFixed(3))]
        : null,
    coldWaveTriggers,
    determinism,
    systems: Object.fromEntries(Object.entries(systems).map(([role, value]) => [role, value.source])),
    imports: Object.fromEntries(
      loaded.map((entry) => [
        entry.role,
        entry.status === "loaded" ? entry.specifier : `stub (${entry.attempts.length} imports missed)`,
      ]),
    ),
  };

  console.log(`ticks/sec: ${report.ticksPerSecond}`);
  console.log(`资源 NaN: ${report.resources.hasNaN}; 资源负数: ${report.resources.hasNegative}`);
  console.log(`民心区间: ${report.moraleRange ? report.moraleRange.join("..") : "N/A"}`);
  console.log(`寒潮触发次数: ${report.coldWaveTriggers}`);
  console.log(
    `同 seed ${determinism.ticks} tick 资源差绝对值和: ${determinism.absoluteDifferenceSum} (容差 ${determinism.tolerance})`,
  );
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = nanPaths.size > 0 || !determinism.pass ? 1 : 0;
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: "crash",
        error: error?.stack ?? error?.message ?? String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
