const VIEW_URL = "../../js/bridge/view.js";

function makeState() {
  return {
    meta: { tick: 0, day: 1 },
    resources: { food: 100, wood: 100, coal: 100, iron: 100 },
    climate: {
      temp: 4,
      blizzardDaysLeft: 0,
      nextBlizzardIn: 7,
      furnaceLit: true,
    },
    city: {
      furnaceLevel: 1,
      buildings: {
        furnace: { level: 1, workers: 0, constructing: false, progress: 0 },
        lumber: { level: 1, workers: 0, constructing: false, progress: 0 },
      },
      warmthBuildings: 0,
    },
    people: { pop: 12, popCap: 24, morale: 70, sick: 0, hungry: 0 },
    army: { infantry: 0, cavalry: 0, archer: 0, wounded: 0 },
    heroes: { roster: [], deployed: [], tickets: 0 },
    flags: {},
    log: [],
  };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function buildingKeys(buildings) {
  if (Array.isArray(buildings)) {
    return buildings.map((entry) => entry?.key).filter((key) => typeof key === "string");
  }
  if (isObject(buildings)) return Object.keys(buildings);
  return null;
}

export async function register({ assert, test }) {
  let projectView = null;
  let importReason = "";
  try {
    const production = await import(new URL(VIEW_URL, import.meta.url));
    if (typeof production.projectView === "function") {
      projectView = production.projectView;
    } else {
      importReason = "production bridge module does not export projectView";
    }
  } catch (error) {
    importReason = `production bridge module is not available: ${error?.message ?? error}`;
  }

  let projected;
  let projectionError = null;
  if (projectView) {
    try {
      projected = await projectView(makeState());
    } catch (error) {
      projectionError = error;
    }
  }

  const projectedIsObject = isObject(projected);
  const hasBuildings = projectedIsObject && Object.hasOwn(projected, "buildings");
  const hasQuests = projectedIsObject && Object.hasOwn(projected, "quests");

  test(
    "bridge/production: projectView exposes canonical lumber building key",
    () => {
      if (!projectView) return;
      if (projectionError) throw projectionError;

      assert.ok(projectedIsObject, "projectView must return an object");
      if (!hasBuildings) return;

      const keys = buildingKeys(projected.buildings);
      assert.ok(keys, "projectView.buildings must expose building keys");
      assert.ok(keys.includes("lumber"), "projectView.buildings must include the lumber key");
      assert.equal(
        keys.includes("lumberyard"),
        false,
        "projectView.buildings must not expose the legacy lumberyard key",
      );
    },
    {
      pending: !projectView || (projectedIsObject && !hasBuildings),
      reason: !projectView ? importReason : "projectView.buildings is not available yet",
    },
  );

  test(
    "bridge/production: projectView quests field is an array when present",
    () => {
      if (!projectView) return;
      if (projectionError) throw projectionError;
      if (!projectedIsObject || !hasQuests) return;

      assert.ok(Array.isArray(projected.quests), "projectView.quests must be an array");
    },
    {
      pending: !projectView || !projectedIsObject || !hasQuests,
      reason: !projectView ? importReason : "projectView.quests is not available yet",
    },
  );
}
