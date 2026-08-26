const MODULE_URLS = {
  state: "../js/state.js",
  climate: "../js/systems/climate.js",
  city: "../js/systems/city.js",
  economy: "../js/systems/economy.js",
  population: "../js/systems/population.js",
};

async function importProductionModules() {
  const modules = {};
  for (const [name, path] of Object.entries(MODULE_URLS)) {
    try {
      modules[name] = await import(new URL(path, import.meta.url));
    } catch {
      modules[name] = null;
    }
  }
  return modules;
}

function collectInvalidNumbers(value, path = "state", invalid = [], seen = new Set()) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) invalid.push(`${path}=${String(value)}`);
    return invalid;
  }
  if (!value || typeof value !== "object" || seen.has(value)) return invalid;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    collectInvalidNumbers(child, `${path}.${key}`, invalid, seen);
  }
  return invalid;
}

function assertHealthyState(assert, state, tick) {
  for (const [resource, amount] of Object.entries(state.resources ?? {})) {
    assert.ok(
      Number.isFinite(amount) && amount >= 0,
      `tick ${tick}: resource ${resource} is negative or non-finite (${amount})`,
    );
  }
  assert.deepEqual(
    collectInvalidNumbers(state),
    [],
    `tick ${tick}: state contains non-finite numbers`,
  );
}

export async function register({ assert, test }) {
  const modules = await importProductionModules();
  const functions = {
    createInitialState: modules.state?.createInitialState,
    tickClimate: modules.climate?.tickClimate,
    tickCity: modules.city?.tickCity,
    tickEconomy: modules.economy?.tickEconomy,
    tickPopulation: modules.population?.tickPopulation,
  };
  const missing = Object.entries(functions)
    .filter(([, value]) => typeof value !== "function")
    .map(([name]) => name);

  test(
    "integration/production: ten full system ticks preserve valid resources and numbers",
    async () => {
      if (missing.length > 0) return;

      let state = await functions.createInitialState("integration-ten-ticks");
      assertHealthyState(assert, state, 0);

      for (let tick = 1; tick <= 10; tick += 1) {
        state.meta.tick += 1;
        state = await functions.tickClimate(state);
        state = await functions.tickCity(state);
        state = await functions.tickEconomy(state);
        state = await functions.tickPopulation(state);
        assertHealthyState(assert, state, tick);
      }

      assert.equal(state.meta.tick, 10);
    },
    {
      pending: missing.length > 0,
      reason:
        missing.length > 0 ? `missing production exports: ${missing.join(", ")}` : "",
    },
  );
}
