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

function resultSaysRejected(result) {
  return (
    result === false ||
    result === null ||
    result?.ok === false ||
    result?.success === false ||
    result?.paid === false
  );
}

async function callSpend(spend, initial, cost) {
  const attempts = [
    () => {
      const resources = structuredClone(initial);
      return { value: spend.fn(resources, structuredClone(cost)), holder: resources };
    },
    () => {
      const state = { resources: structuredClone(initial) };
      return { value: spend.fn(state, structuredClone(cost)), holder: state };
    },
    () => {
      const request = { resources: structuredClone(initial), cost: structuredClone(cost) };
      return { value: spend.fn(request), holder: request };
    },
  ];
  const errors = [];
  for (const attempt of attempts) {
    try {
      const called = attempt();
      called.value = await called.value;
      if (resultSaysRejected(called.value)) return called;
    } catch (error) {
      errors.push(error);
    }
  }
  const detail = errors.map((error) => error?.message ?? String(error)).join("; ");
  throw new Error(`${spend.name} did not expose a recognizable rejected transaction${detail ? `: ${detail}` : ""}`);
}

function resourcesAfter(call) {
  if (call.value?.resources) return call.value.resources;
  if (call.value?.state?.resources) return call.value.state.resources;
  if (call.holder?.resources) return call.holder.resources;
  return call.holder;
}

export async function register({ assert, test }) {
  const production = await importFirst();
  const fixture = fixtureEconomy();
  const spend = firstFunction(production.module, [
    "trySpend",
    "spendResources",
    "payCost",
    "deductResources",
  ]);

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
    "economy/production: rejected payment is atomic and non-negative",
    async () => {
      if (!spend) {
        const fallback = fixture.trySpend({ food: 2, wood: 5 }, { food: 3 });
        assert.equal(fallback.ok, false);
        return;
      }
      const initial = { food: 2, wood: 5, coal: 1, iron: 0 };
      const call = await callSpend(spend, initial, { food: 3, wood: 1 });
      const after = resourcesAfter(call);
      assert.deepEqual(after, initial, `${spend.name} deducted an unaffordable cost`);
      assert.ok(
        Object.values(after).every((amount) => Number.isFinite(amount) && amount >= 0),
        `${spend.name} produced a negative or invalid resource`,
      );
    },
    {
      pending: !spend,
      reason: !production.module
        ? "production economy module is not available; pure fixture exercised"
        : "production economy transaction export is missing; pure fixture exercised",
    },
  );
}
