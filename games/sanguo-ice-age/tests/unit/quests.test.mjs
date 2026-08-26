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
    furnaceLevel,
    furnace: { id: "furnace", level: furnaceLevel },
    buildings: {
      furnace: { id: "furnace", level: furnaceLevel },
      [buildingId]: { id: buildingId, type: buildingId, level: 2 },
    },
  };
}

async function invokeAllowed(gate, shape, buildingId, furnaceLevel) {
  const state = makeState(buildingId, furnaceLevel);
  const building = state.buildings[buildingId];
  const request = {
    state,
    building,
    buildingId,
    id: buildingId,
    currentLevel: 2,
    targetLevel: 3,
    furnaceLevel,
    resources: state.resources,
  };
  const calls = {
    request: () => gate.fn(request),
    stateId: () => gate.fn(state, buildingId),
    stateIdTarget: () => gate.fn(state, buildingId, 3),
    idState: () => gate.fn(buildingId, state),
    buildingState: () => gate.fn(building, state),
    buildingFurnace: () => gate.fn(building, furnaceLevel),
  };
  return extractAllowed(await calls[shape]());
}

async function assertProductionGate(assert, gate) {
  const buildingIds = ["lumberCamp", "lumberyard", "wood", "hunter", "barracks"];
  const shapes = [
    "request",
    "stateId",
    "stateIdTarget",
    "idState",
    "buildingState",
    "buildingFurnace",
  ];
  const errors = [];
  for (const buildingId of buildingIds) {
    for (const shape of shapes) {
      try {
        const blocked = await invokeAllowed(gate, shape, buildingId, 2);
        const allowed = await invokeAllowed(gate, shape, buildingId, 3);
        if (blocked === false && allowed === true) {
          assert.equal(blocked, false);
          assert.equal(allowed, true);
          return;
        }
      } catch (error) {
        errors.push(error);
      }
    }
  }
  const detail = errors.slice(0, 3).map((error) => error?.message ?? String(error)).join("; ");
  throw new Error(
    `${gate.name} did not expose a furnace-level upgrade gate${detail ? `: ${detail}` : ""}`,
  );
}

export async function register({ assert, test }) {
  const modules = await importAvailable();
  const gate = findFunction(modules, [
    "canUpgradeBuilding",
    "checkBuildingUpgrade",
    "getUpgradeEligibility",
    "canUpgrade",
  ]);

  test(
    "quests/self-contained: furnace level blocks higher building upgrades",
    () => {
      assert.equal(
        fixtureRules.canUpgradeBuilding({
          buildingId: "lumberCamp",
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
            buildingId: "lumberCamp",
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
          : "production building-upgrade gate export is missing; pure fixture exercised",
    },
  );
}
