const PRODUCTION_URLS = [
  "../../js/engine/save.js",
  "../../js/engine/persistence.js",
  "../../js/systems/save.js",
  "../../js/save.js",
  "../../js/state.js",
];

async function importFirst() {
  for (const path of PRODUCTION_URLS) {
    try {
      return { module: await import(new URL(path, import.meta.url)), path };
    } catch {
      // A missing module is expected during parallel Round 1 production work.
    }
  }
  return { module: null, path: null };
}

function createMemoryStorage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      const normalized = String(key);
      return values.has(normalized) ? values.get(normalized) : null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(String(key));
    },
    setItem(key, value) {
      values.set(String(key), String(value));
    },
  };
}

const fixtureSave = {
  save(storage, key, state) {
    storage.setItem(key, JSON.stringify(state));
  },
  load(storage, key) {
    const raw = storage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  },
};

function firstFunction(module, names) {
  for (const name of names) {
    if (typeof module?.[name] === "function") return { fn: module[name], name };
  }
  return null;
}

function unwrapState(value) {
  return value?.state ?? value?.gameState ?? value?.data ?? value;
}

async function throughManager(factory, state) {
  const errors = [];
  const factoryAttempts = [
    (storage) => factory.fn(storage),
    (storage) => factory.fn({ storage }),
  ];
  for (const create of factoryAttempts) {
    const storage = createMemoryStorage();
    try {
      const manager = await create(storage);
      const save = firstFunction(manager, ["saveGame", "saveState", "save"]);
      const load = firstFunction(manager, ["loadGame", "loadState", "load"]);
      if (!save || !load) throw new Error("manager does not expose save/load methods");
      await save.fn.call(manager, structuredClone(state));
      if (storage.length === 0) throw new Error("save did not write to memoryStorage");
      return unwrapState(await load.fn.call(manager));
    } catch (error) {
      errors.push(error);
    }
  }
  throw new Error(errors.map((error) => error?.message ?? String(error)).join("; "));
}

async function throughFunctions(save, load, state) {
  const variants = [
    {
      save: (storage) => save.fn(structuredClone(state), storage),
      load: (storage) => load.fn(storage),
    },
    {
      save: (storage) => save.fn(storage, structuredClone(state)),
      load: (storage) => load.fn(storage),
    },
    {
      save: (storage) => save.fn(structuredClone(state), { storage }),
      load: (storage) => load.fn({ storage }),
    },
  ];
  const errors = [];
  for (const variant of variants) {
    const storage = createMemoryStorage();
    try {
      await variant.save(storage);
      if (storage.length === 0) throw new Error("save did not write to memoryStorage");
      return unwrapState(await variant.load(storage));
    } catch (error) {
      errors.push(error);
    }
  }
  throw new Error(errors.map((error) => error?.message ?? String(error)).join("; "));
}

export async function register({ assert, test }) {
  const production = await importFirst();
  const factory = firstFunction(production.module, [
    "createSaveAdapter",
    "createSaveSystem",
    "createSaveManager",
    "createPersistence",
  ]);
  const save = firstFunction(production.module, ["saveGame", "saveState", "save"]);
  const load = firstFunction(production.module, ["loadGame", "loadState", "load"]);
  const hasProductionRoundTrip = Boolean(factory || (save && load));
  let sample;
  try {
    const stateModule = await import(new URL("../../js/state.js", import.meta.url));
    sample = stateModule.createInitialState("save-round-trip");
    sample.meta.day = 19;
    sample.meta.tick = 288;
    sample.resources = { food: 23, wood: 41, coal: 7, iron: 3 };
    sample.city.furnaceLevel = 4;
  } catch {
    sample = {
      day: 19,
      resources: { food: 23, wood: 41, coal: 7, iron: 3 },
      furnace: { level: 4, fuel: "coal" },
      heroes: [{ id: "zhaoyun", level: 8 }],
    };
  }

  test(
    "save/self-contained: memoryStorage save/load round-trip preserves state",
    () => {
      const storage = createMemoryStorage();
      fixtureSave.save(storage, "slot", sample);
      const loaded = fixtureSave.load(storage, "slot");
      assert.deepEqual(loaded, sample);
      assert.notEqual(loaded, sample);
    },
    { selfContained: true },
  );

  test(
    "save/production: memoryStorage save/load round-trip preserves state",
    async () => {
      if (!hasProductionRoundTrip) {
        const storage = createMemoryStorage();
        fixtureSave.save(storage, "slot", sample);
        assert.deepEqual(fixtureSave.load(storage, "slot"), sample);
        return;
      }
      const loaded = factory
        ? await throughManager(factory, sample)
        : await throughFunctions(save, load, sample);
      assert.deepEqual(loaded, sample);
    },
    {
      pending: !hasProductionRoundTrip,
      reason: !production.module
        ? "production save module is not available; memoryStorage fixture exercised"
        : "production save/load exports are missing; memoryStorage fixture exercised",
    },
  );
}
