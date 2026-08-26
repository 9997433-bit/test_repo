const moduleChecks = [
  {
    name: "engine",
    path: "../src/core/engine.js",
    exports: ["createInitialState", "advanceTime"],
  },
  {
    name: "farm",
    path: "../src/systems/farm/index.js",
    exports: ["till", "plant", "harvest", "tickPlots", "seasonFactor"],
    optionalExports: ["catchUpPlots", "harvestAll"],
  },
  {
    name: "production",
    path: "../src/systems/production/index.js",
    exports: ["canCraft", "enqueueJob", "collectJob", "feedAnimal", "tickProduction"],
  },
  {
    name: "village",
    path: "../src/systems/village/index.js",
    exports: ["build", "cook", "deliverWish", "refreshWishes", "tickVillage"],
  },
  {
    name: "data",
    path: "../src/data/index.js",
    exports: ["CROPS", "RECIPES", "BUILDINGS", "ANIMALS"],
  },
];

let loaded;
try {
  loaded = await Promise.all(moduleChecks.map(({ path }) => import(path)));
} catch (error) {
  console.error(`probe: module import failed: ${error.message}`);
  process.exit(1);
}

const missingExports = moduleChecks.flatMap((check, index) =>
  check.exports
    .filter((name) => !(name in loaded[index]))
    .map((name) => `${check.name}.${name}`),
);
const optionalExports = moduleChecks.flatMap((check, index) =>
  (check.optionalExports || []).map((name) => ({
    name: `${check.name}.${name}`,
    present: name in loaded[index],
  })),
);

if (missingExports.length > 0) {
  console.error(`probe: missing exports: ${missingExports.join(", ")}`);
  process.exit(1);
}

const [engine, , , , data] = loaded;
const s0 = engine.createInitialState();
const { state, crossedDay } = engine.advanceTime(s0, s0.meta.hourMs * 24);

const recipes = new Map(data.RECIPES.map((recipe) => [recipe.id, recipe]));
const crops = new Map(data.CROPS.map((crop) => [crop.id, crop]));
const chainChecks = {
  riceChicken:
    crops.get("rice")?.yieldId === "paddy" &&
    recipes.get("mill_rice")?.outputId === "rice" &&
    recipes.get("feed_chicken_simple")?.outputId === "chicken_feed" &&
    data.ANIMALS.some(
      (animal) =>
        animal.id === "chicken" &&
        animal.feedId === "chicken_feed" &&
        animal.productId === "egg",
    ),
  soyTofu:
    crops.get("soy")?.yieldId === "soybean" &&
    recipes.get("mill_tofu")?.outputId === "tofu",
  wheatBread:
    crops.get("wheat")?.yieldId === "wheat" &&
    recipes.get("mill_flour")?.outputId === "flour" &&
    recipes.get("bread")?.outputId === "bread",
};

const checks = {
  dataTables:
    data.CROPS.length >= 8 &&
    data.RECIPES.length >= 8 &&
    data.BUILDINGS.length >= 8,
  startPlots: s0.plots.length >= 2,
  dayRollover: state.meta.day === s0.meta.day + 1 && crossedDay,
  ...chainChecks,
};
const failedChecks = Object.entries(checks)
  .filter(([, ok]) => !ok)
  .map(([name]) => name);

const requiredExports = moduleChecks.reduce(
  (total, check) => total + check.exports.length,
  0,
);
const presentOptionalExports = optionalExports.filter(({ present }) => present);
const report = {
  ok: failedChecks.length === 0,
  exports: {
    required: requiredExports,
    present: requiredExports + presentOptionalExports.length,
    optionalPresent: presentOptionalExports.map(({ name }) => name),
    optionalSkipped: optionalExports.filter(({ present }) => !present).map(({ name }) => name),
  },
  data: {
    crops: data.CROPS.length,
    recipes: data.RECIPES.length,
    buildings: data.BUILDINGS.length,
    animals: data.ANIMALS.length,
  },
  state: {
    startPlots: s0.plots.length,
    dayRollover: checks.dayRollover,
    season: state.meta.season,
  },
  chains: chainChecks,
};

console.log(JSON.stringify(report, null, 2));
if (!report.ok) {
  console.error(`probe: failed checks: ${failedChecks.join(", ")}`);
  process.exit(1);
}
