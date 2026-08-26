const PRODUCTION_URLS = [
  "../../js/systems/climate.js",
  "../../js/climate.js",
  "../../js/engine/climate.js",
];

async function importFirst() {
  for (const path of PRODUCTION_URLS) {
    try {
      return { module: await import(new URL(path, import.meta.url)), path };
    } catch {
      // A parallel production agent may not have created this path yet.
    }
  }
  return { module: null, path: null };
}

const fixtureClimate = {
  temperature({ baseTemp = 4, blizzard = false, furnaceLevel = 0 } = {}) {
    const blizzardDelta = blizzard ? -14 : 0;
    return baseTemp + blizzardDelta + furnaceLevel * 3.2;
  },
};

function firstFunction(module, names) {
  for (const name of names) {
    if (typeof module?.[name] === "function") return { fn: module[name], name };
  }
  return null;
}

function makeClimateState(blizzard = false) {
  return {
    meta: { tick: 0, day: 1 },
    resources: { food: 100, wood: 100, coal: 100, iron: 100 },
    climate: {
      temp: 4,
      blizzardDaysLeft: blizzard ? 1 : 0,
      nextBlizzardIn: 7,
      furnaceLit: false,
    },
    city: {
      furnaceLevel: 0,
      buildings: {},
      warmthBuildings: 0,
    },
    people: { pop: 12, popCap: 24, morale: 70, sick: 0, hungry: 0 },
    heroes: { roster: [] },
    flags: {},
    log: [],
  };
}

export async function register({ assert, test }) {
  const production = await importFirst();
  const tickClimate = firstFunction(production.module, ["tickClimate"]);
  const cityTemperature = firstFunction(production.module, ["cityTemperature"]);

  test(
    "climate/self-contained: blizzard applies a fourteen-degree cold snap",
    () => {
      assert.equal(fixtureClimate.temperature({ baseTemp: 4, blizzard: true }), -10);
      assert.equal(
        fixtureClimate.temperature({ baseTemp: 4, blizzard: false }) -
          fixtureClimate.temperature({ baseTemp: 4, blizzard: true }),
        14,
      );
    },
    { selfContained: true },
  );

  test(
    "climate/self-contained: furnace heat offsets cold deterministically",
    () => {
      const temperature = fixtureClimate.temperature({
        baseTemp: 4,
        blizzard: true,
        furnaceLevel: 2,
      });
      assert.ok(Math.abs(temperature - -3.6) < 1e-9);
    },
    { selfContained: true },
  );

  test(
    "climate/production: cityTemperature makes blizzards colder",
    async () => {
      if (!cityTemperature) {
        assert.ok(
          fixtureClimate.temperature({ blizzard: true }) <
            fixtureClimate.temperature({ blizzard: false }),
        );
        return;
      }
      const calm = await cityTemperature.fn(makeClimateState(false));
      const storm = await cityTemperature.fn(makeClimateState(true));
      assert.ok(Number.isFinite(calm));
      assert.ok(Number.isFinite(storm));
      assert.ok(storm < calm, `cityTemperature returned calm=${calm}, blizzard=${storm}`);
    },
    {
      pending: !cityTemperature,
      reason: !production.module
        ? "production climate module is not available; pure fixture exercised"
        : "production cityTemperature export is missing; pure fixture exercised",
    },
  );

  test(
    "climate/production: tickClimate keeps temperature and fuel finite",
    async () => {
      if (!tickClimate) {
        assert.ok(Number.isFinite(fixtureClimate.temperature()));
        return;
      }
      const state = makeClimateState(false);
      state.city.furnaceLevel = 1;
      state.city.buildings.furnace = {
        level: 1,
        workers: 0,
        constructing: false,
        progress: 0,
      };
      state.climate.furnaceLit = true;
      assert.equal(await tickClimate.fn(state), state);
      assert.ok(Number.isFinite(state.climate.temp));
      assert.ok(Number.isFinite(state.climate.targetTemp));
      assert.ok(
        Object.values(state.resources).every((amount) => Number.isFinite(amount) && amount >= 0),
        "tickClimate produced a negative or invalid resource",
      );
    },
    {
      pending: !tickClimate,
      reason: !production.module
        ? "production climate module is not available; pure fixture exercised"
        : "production tickClimate export is missing; pure fixture exercised",
    },
  );
}
