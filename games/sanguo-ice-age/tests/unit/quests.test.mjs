const PRODUCTION_URLS = [
  "../../js/systems/city.js",
  "../../js/systems/quests.js",
  "../../js/city.js",
  "../../js/quests.js",
];

async function importAvailable() {
  const loaded = [];
  for (const path of PRODUCTION_URLS) {
    try {
      loaded.push({ module: await import(new URL(path, import.meta.url)), path });
    } catch {
      // Integration probes remain pending while parallel modules are absent.
    }
  }
  return loaded;
}

const fixtureRules = {
  canUpgradeBuilding({ buildingId, currentLevel, furnaceLevel }) {
    return buildingId === "furnace" || currentLevel + 1 <= furnaceLevel;
  },
  questComplete({ progress, target }) {
    return progress >= target;
  },
};

function findFunction(modules, names) {
  for (const entry of modules) {
    for (const name of names) {
      if (typeof entry.module?.[name] === "function") {
        return { fn: entry.module[name], name, path: entry.path };
      }
    }
  }
  return null;
}

function extractAllowed(value) {
  if (typeof value === "boolean") return value;
  for (const key of ["allowed", "canUpgrade", "ok", "success", "eligible"]) {
    if (typeof value?.[key] === "boolean") return value[key];
  }
  return null;
}

function makeState(buildingId, furnaceLevel) {
  const resources = { food: 1e9, wood: 1e9, coal: 1e9, iron: 1e9 };
  return {
    resources,
    city: {
      furnaceLevel,
      buildings: {
        furnace: { level: furnaceLevel, workers: 0, constructing: false, progress: 0 },
        [buildingId]: { level: 2, workers: 0, constructing: false, progress: 0 },
      },
    },
  };
}

async function assertProductionGate(assert, gate) {
  const catalog = {
    lumber: {
      id: "lumber",
      name: "伐木场",
      baseCost: { wood: 10 },
      costScale: 1,
      unlockFurnace: 1,
      maxLevel: 20,
    },
  };
  const blocked = extractAllowed(await gate.fn(makeState("lumber", 2), "lumber", catalog));
  const allowed = extractAllowed(await gate.fn(makeState("lumber", 3), "lumber", catalog));
  assert.equal(blocked, false, "lumber level 3 must be blocked by a level 2 furnace");
  assert.equal(allowed, true, "lumber level 3 must be allowed by a level 3 furnace");
}

export async function register({ assert, test }) {
  const modules = await importAvailable();
  const gate = findFunction(modules, ["canUpgrade"]);

  test(
    "quests/self-contained: furnace level blocks higher building upgrades",
    () => {
      assert.equal(
        fixtureRules.canUpgradeBuilding({
          buildingId: "lumber",
          currentLevel: 2,
          furnaceLevel: 2,
        }),
        false,
      );
    },
    { selfContained: true },
  );

  test(
    "quests/self-contained: furnace itself may advance the building cap",
    () => {
      assert.equal(
        fixtureRules.canUpgradeBuilding({
          buildingId: "furnace",
          currentLevel: 2,
          furnaceLevel: 2,
        }),
        true,
      );
    },
    { selfContained: true },
  );

  test(
    "quests/self-contained: quest completion includes the exact target",
    () => {
      assert.equal(fixtureRules.questComplete({ progress: 9, target: 10 }), false);
      assert.equal(fixtureRules.questComplete({ progress: 10, target: 10 }), true);
    },
    { selfContained: true },
  );

  test(
    "quests/production: furnace level gates non-furnace building upgrades",
    async () => {
      if (!gate) {
        assert.equal(
          fixtureRules.canUpgradeBuilding({
            buildingId: "lumber",
            currentLevel: 2,
            furnaceLevel: 2,
          }),
          false,
        );
        return;
      }
      await assertProductionGate(assert, gate);
    },
    {
      pending: !gate,
      reason:
        modules.length === 0
          ? "production city/quest modules are not available; pure fixture exercised"
          : "production canUpgrade export is missing; pure fixture exercised",
    },
  );
}
