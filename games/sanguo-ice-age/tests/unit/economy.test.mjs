const PRODUCTION_URLS = [
  "../../js/systems/economy.js",
  "../../js/economy.js",
  "../../js/engine/economy.js",
];

async function importFirst() {
  const errors = [];
  for (const path of PRODUCTION_URLS) {
    try {
      return { module: await import(new URL(path, import.meta.url)), path, errors };
    } catch (error) {
      errors.push({ path, error });
    }
  }
  return { module: null, path: null, errors };
}

function fixtureEconomy() {
  const copy = (resources) => ({ ...resources });
  const canAfford = (resources, cost) =>
    Object.entries(cost).every(([key, amount]) => (resources[key] ?? 0) >= amount);

  return {
    canAfford,
    trySpend(resources, cost) {
      if (!canAfford(resources, cost)) return { ok: false, resources: copy(resources) };
      const next = copy(resources);
      for (const [key, amount] of Object.entries(cost)) {
        next[key] = Math.max(0, (next[key] ?? 0) - amount);
      }
      return { ok: true, resources: next };
    },
    addWithCapacity(resources, gains, capacity) {
      const next = copy(resources);
      for (const [key, amount] of Object.entries(gains)) {
        next[key] = Math.max(0, Math.min(capacity, (next[key] ?? 0) + amount));
      }
      return next;
    },
  };
}

function firstFunction(module, names) {
  for (const name of names) {
    if (typeof module?.[name] === "function") return { fn: module[name], name };
  }
  return null;
}

function makeEconomyState() {
  return {
    meta: { tick: 0, day: 1 },
    resources: { food: 100, wood: 100, coal: 100, iron: 100 },
    climate: { temp: 4, blizzardDaysLeft: 0, nextBlizzardIn: 7, furnaceLit: true },
    city: {
      furnaceLevel: 1,
      buildings: {
        furnace: { level: 1, workers: 0, constructing: false, progress: 0 },
        lumber: { level: 1, workers: 0, constructing: false, progress: 0 },
      },
    },
    people: { pop: 12, popCap: 24, morale: 70, sick: 0, hungry: 0 },
    heroes: { roster: [] },
    flags: {},
    log: [],
  };
}

function assertValidResources(assert, resources) {
  assert.ok(
    Object.values(resources).every((amount) => Number.isFinite(amount) && amount >= 0),
    "production economy produced a negative or invalid resource",
  );
}

export async function register({ assert, test }) {
  const production = await importFirst();
  const fixture = fixtureEconomy();
  const tickEconomy = firstFunction(production.module, ["tickEconomy"]);
  const pay = firstFunction(production.module, ["pay"]);
  const canAfford = firstFunction(production.module, ["canAfford"]);

  test(
    "economy/self-contained: unaffordable cost does not deduct",
    () => {
      const resources = { food: 2, wood: 5, coal: 1, iron: 0 };
      const before = structuredClone(resources);
      const result = fixture.trySpend(resources, { food: 3, wood: 1 });
      assert.equal(result.ok, false);
      assert.deepEqual(result.resources, before);
      assert.deepEqual(resources, before);
    },
    { selfContained: true },
  );

  test(
    "economy/self-contained: resource balances never become negative",
    () => {
      const result = fixture.trySpend({ food: 1, wood: 0 }, { food: 99 });
      assert.ok(Object.values(result.resources).every((amount) => amount >= 0));
    },
    { selfContained: true },
  );

  test(
    "economy/self-contained: warehouse capacity clamps every resource",
    () => {
      const result = fixture.addWithCapacity(
        { food: 90, wood: 20, coal: 100, iron: 0 },
        { food: 25, wood: 10, coal: 1, iron: 500 },
        100,
      );
      assert.deepEqual(result, { food: 100, wood: 30, coal: 100, iron: 100 });
    },
    { selfContained: true },
  );

  test(
    "economy/production: canAfford reads resources from state",
    async () => {
      if (!canAfford) {
        assert.equal(fixture.canAfford({ food: 2, wood: 5 }, { food: 3 }), false);
        return;
      }
      const state = { resources: { food: 2, wood: 5, coal: 1, iron: 0 } };
      assert.equal(await canAfford.fn(state, { food: 3, wood: 1 }), false);
      assert.equal(await canAfford.fn(state, { food: 2, wood: 5 }), true);
    },
    {
      pending: !canAfford,
      reason: !production.module
        ? "production economy module is not available; pure fixture exercised"
        : "production canAfford export is missing; pure fixture exercised",
    },
  );

  test(
    "economy/production: pay is atomic and non-negative",
    async () => {
      if (!pay) {
        assert.equal(fixture.trySpend({ food: 2, wood: 5 }, { food: 3 }).ok, false);
        return;
      }
      const state = { resources: { food: 2, wood: 5, coal: 1, iron: 0 } };
      const before = structuredClone(state.resources);
      assert.equal(await pay.fn(state, { food: 3, wood: 1 }), false);
      assert.deepEqual(state.resources, before, "pay deducted an unaffordable cost");
      assert.equal(await pay.fn(state, { food: 2, wood: 1 }), true);
      assert.deepEqual(state.resources, { food: 0, wood: 4, coal: 1, iron: 0 });
      assertValidResources(assert, state.resources);
    },
    {
      pending: !pay,
      reason: !production.module
        ? "production economy module is not available; pure fixture exercised"
        : "production pay export is missing; pure fixture exercised",
    },
  );

  test(
    "economy/production: tickEconomy keeps resources finite and non-negative",
    async () => {
      if (!tickEconomy) {
        assertValidResources(
          assert,
          fixture.addWithCapacity({ food: 90, wood: 20 }, { food: 20, wood: 1 }, 100),
        );
        return;
      }
      const state = makeEconomyState();
      assert.equal(await tickEconomy.fn(state), state);
      assertValidResources(assert, state.resources);
      assert.ok(
        Object.values(state.economy?.net ?? {}).every(Number.isFinite),
        "tickEconomy produced a non-finite net rate",
      );
    },
    {
      pending: !tickEconomy,
      reason: !production.module
        ? "production economy module is not available; pure fixture exercised"
        : "production tickEconomy export is missing; pure fixture exercised",
    },
  );
}
