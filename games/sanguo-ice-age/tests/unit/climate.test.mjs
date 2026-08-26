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

function extractTemperature(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  for (const key of ["temperature", "temp", "currentTemp", "effectiveTemperature"]) {
    if (typeof value?.[key] === "number" && Number.isFinite(value[key])) return value[key];
  }
  return null;
}

async function callTemperature(calculator, blizzard) {
  const weather = {
    baseTemp: 4,
    baseTemperature: 4,
    blizzard,
    isBlizzard: blizzard,
    coldSnap: blizzard,
    furnaceLevel: 0,
    furnace: { level: 0, active: true },
  };
  const attempts = [
    () => calculator.fn(structuredClone(weather)),
    () => calculator.fn(4, { blizzard, isBlizzard: blizzard, furnaceLevel: 0 }),
    () => calculator.fn(4, 0, blizzard),
  ];
  const errors = [];
  for (const attempt of attempts) {
    try {
      const temperature = extractTemperature(await attempt());
      if (temperature !== null) return temperature;
    } catch (error) {
      errors.push(error);
    }
  }
  const detail = errors.map((error) => error?.message ?? String(error)).join("; ");
  throw new Error(
    `${calculator.name} did not return a recognizable temperature${detail ? `: ${detail}` : ""}`,
  );
}

export async function register({ assert, test }) {
  const production = await importFirst();
  const calculator = firstFunction(production.module, [
    "calculateTemperature",
    "computeTemperature",
    "deriveTemperature",
    "getEffectiveTemperature",
  ]);

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
    "climate/production: blizzard is colder than calm weather",
    async () => {
      if (!calculator) {
        assert.ok(
          fixtureClimate.temperature({ blizzard: true }) <
            fixtureClimate.temperature({ blizzard: false }),
        );
        return;
      }
      const calm = await callTemperature(calculator, false);
      const storm = await callTemperature(calculator, true);
      assert.ok(storm < calm, `${calculator.name} returned calm=${calm}, blizzard=${storm}`);
    },
    {
      pending: !calculator,
      reason: !production.module
        ? "production climate module is not available; pure fixture exercised"
        : "production temperature export is missing; pure fixture exercised",
    },
  );
}
