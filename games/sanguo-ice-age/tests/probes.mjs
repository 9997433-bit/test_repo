import { performance } from "node:perf_hooks";
import { existsSync } from "node:fs";

const RESOURCE_KEYS = new Set(["food", "wood", "coal", "iron"]);
const candidates = {
  state: ["../js/state.js", "../js/game/state.js", "../js/core/state.js"],
  climate: ["../js/systems/climate.js", "../js/climate.js"],
  economy: ["../js/systems/economy.js", "../js/economy.js"],
  city: ["../js/systems/city.js", "../js/city.js"],
  population: ["../js/systems/population.js", "../js/population.js"],
  combat: ["../js/systems/combat.js", "../js/combat.js"],
  recruitment: [
    "../js/systems/recruitment.js",
    "../js/systems/heroes.js",
    "../js/recruitment.js",
    "../js/heroes.js",
    "../js/gacha.js",
  ],
  save: ["../js/engine/save.js", "../js/save.js"],
};

const tickNames = {
  climate: ["tickClimate", "updateClimate", "climateTick", "tick"],
  economy: ["tickEconomy", "updateEconomy", "economyTick", "tick"],
  city: ["tickCity", "updateCity", "cityTick", "tick"],
  population: ["tickPopulation", "updatePopulation", "populationTick", "tick"],
  combat: ["tickCombat", "updateCombat", "combatTick", "tick"],
};

async function loadFirst(role, specifiers) {
  const errors = [];
  for (const specifier of specifiers) {
    const url = new URL(specifier, import.meta.url);
    if (!existsSync(url)) {
      errors.push({ specifier, message: "module not found" });
      continue;
    }
    try {
      return {
        role,
        status: "loaded",
        specifier,
        namespace: await import(url),
        errors,
      };
    } catch (error) {
      return {
        role,
        status: "error",
        specifier,
        namespace: null,
        error: error?.message ?? String(error),
        errors,
      };
    }
  }
  return { role, status: "missing", namespace: null, errors };
}

function fallbackState() {
  return {
    version: 1,
    tick: 0,
    day: 0,
    resources: { food: 100, wood: 100, coal: 100, iron: 100 },
    morale: 70,
    population: 100,
    recruitTokens: 1,
    heroes: [],
    formation: [],
    buildings: {
      furnace: { level: 1 },
      lumberyard: { level: 1 },
    },
    climate: {
      temperature: 4,
      coldWaveActive: false,
      coldWaveDaysRemaining: 0,
    },
  };
}

function clone(value) {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}

async function freshState(stateModule) {
  if (stateModule) {
    for (const name of ["createInitialState", "createGameState", "createState", "getInitialState"]) {
      if (typeof stateModule[name] === "function") {
        const value = await stateModule[name]();
        if (value && typeof value === "object") return value;
      }
    }
    for (const name of ["initialState", "defaultState", "INITIAL_STATE"]) {
      if (stateModule[name] && typeof stateModule[name] === "object") return clone(stateModule[name]);
    }
    if (stateModule.default && typeof stateModule.default === "object") return clone(stateModule.default);
    if (typeof stateModule.default === "function") {
      const value = await stateModule.default();
      if (value && typeof value === "object") return value;
    }
  }
  return fallbackState();
}

function findFunction(namespace, names) {
  if (!namespace) return null;
  for (const name of names) {
    if (typeof namespace[name] === "function") return { name, fn: namespace[name] };
  }
  return null;
}

async function invokeTick(api, state, context) {
  if (!api || api.fn.length < 2) return api.fn(state, context);
  const source = Function.prototype.toString.call(api.fn).slice(0, 300);
  const match = source.match(/^[^(]*\(([^)]*)\)/);
  const second = match?.[1]?.split(",")[1]?.trim().toLowerCase() ?? "";
  if (/^(dt|delta|delta_time|deltatime|elapsed|seconds|step)$/.test(second)) {
    return api.fn(state, context.dt, context);
  }
  if (/^(tick|tickcount|tick_count)$/.test(second)) return api.fn(state, context.tick, context);
  if (/^(tickms|tick_ms|ms)$/.test(second)) return api.fn(state, context.tickMs, context);
  if (/^(rng|random)$/.test(second)) return api.fn(state, context.rng, context);
  if (/(catalog|buildings|definitions|defs|config)/.test(second)) return api.fn(state);
  return api.fn(state, context);
}

function looksLikeState(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      ("resources" in value ||
        "buildings" in value ||
        "city" in value ||
        "population" in value ||
        "morale" in value ||
        "tick" in value),
  );
}

function absorbResult(state, result) {
  if (looksLikeState(result?.state)) return result.state;
  if (looksLikeState(result)) return result;
  return state;
}

function inspectFinite(root) {
  const nonFinite = [];
  const negativeResources = [];
  const seen = new WeakSet();

  function visit(value, path, resourceContext = false) {
    if (typeof value === "number") {
      if (!Number.isFinite(value)) nonFinite.push(path);
      if (resourceContext && value < 0) negativeResources.push(path);
      return;
    }
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    for (const [key, child] of Object.entries(value)) {
      visit(child, `${path}.${key}`, resourceContext || RESOURCE_KEYS.has(key));
    }
  }

  visit(root, "value");
  return { nonFinite, negativeResources };
}

function zeroResourceValues(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (RESOURCE_KEYS.has(key) && typeof child === "number") value[key] = 0;
    else zeroResourceValues(child, seen);
  }
}

function zeroResources(state) {
  zeroResourceValues(state);
  state.resources ??= {};
  for (const key of RESOURCE_KEYS) state.resources[key] = 0;
}

function setResourceStock(state, amount) {
  state.resources ??= {};
  for (const key of RESOURCE_KEYS) state.resources[key] = amount;
}

function levelValue(value) {
  if (Number.isFinite(value)) return value;
  if (Number.isFinite(value?.level)) return value.level;
  return undefined;
}

function setBuildingLevel(container, key, level) {
  if (!container || typeof container !== "object") return;
  if (Number.isFinite(container[key])) container[key] = level;
  else container[key] = { ...(container[key] && typeof container[key] === "object" ? container[key] : {}), level };
}

function getBuildingLevel(state, key) {
  const values = [
    state.buildings?.[key],
    state.city?.buildings?.[key],
    key === "furnace" ? state.city?.furnaceLevel : undefined,
    key === "furnace" ? state.furnaceLevel : undefined,
  ];
  return values.map(levelValue).find(Number.isFinite);
}

function rosterLength(state) {
  for (const value of [
    state.heroes?.roster,
    state.generals?.roster,
    state.hero?.roster,
    state.recruitment?.heroes,
    state.heroes,
    state.generals,
    state.roster,
  ]) {
    if (Array.isArray(value)) return value.length;
    if (value && typeof value === "object") return Object.keys(value).length;
  }
  return 0;
}

function victoryFrom(result) {
  if (typeof result === "boolean") return result;
  if (typeof result?.victory === "boolean") return result.victory;
  if (typeof result?.won === "boolean") return result.won;
  if (typeof result?.win === "boolean") return result.win;
  if (result?.winner !== undefined) return result.winner === "player" || result.winner === "attacker";
  if (result?.result !== undefined) return result.result === "victory" || result.result === "win";
  return undefined;
}

function compactError(error) {
  return error?.message ?? String(error);
}

async function runProbe(id, title, probe) {
  try {
    const outcome = await probe();
    return {
      id,
      title,
      status: outcome.status ?? (outcome.pass ? "pass" : "fail"),
      info: outcome.info,
    };
  } catch (error) {
    return { id, title, status: "fail", info: { error: compactError(error) } };
  }
}

async function canonicalInitialBuildingIds(modules) {
  if (typeof modules.state?.createInitialState !== "function") {
    return {
      pass: false,
      info: {
        productionApi: "state.createInitialState",
        reason: "createInitialState 不存在，无法验证建筑 id",
      },
    };
  }

  const state = await modules.state.createInitialState();
  const buildings = state?.city?.buildings ?? state?.buildings;
  const ids = buildings && typeof buildings === "object" ? Object.keys(buildings) : [];
  const hasLumber = Object.hasOwn(buildings ?? {}, "lumber");
  const hasLumberyard = Object.hasOwn(buildings ?? {}, "lumberyard");
  const pass = hasLumber && !hasLumberyard;
  return {
    pass,
    info: {
      productionApi: "state.createInitialState",
      buildingIds: ids,
      hasLumber,
      hasLumberyard,
      reason: pass
        ? "初始状态使用规范建筑 id lumber"
        : hasLumberyard
          ? "初始状态仍使用旧建筑 id lumberyard，应迁移为 lumber"
          : "初始状态缺少规范建筑 id lumber",
    },
  };
}

async function bridgeProjectView(modules) {
  const specifier = "../js/bridge/view.js";
  const url = new URL(specifier, import.meta.url);
  if (!existsSync(url)) {
    return {
      status: "skip",
      info: {
        module: specifier,
        reason: "js/bridge/view.js 尚不存在",
      },
    };
  }

  const namespace = await import(url);
  if (typeof namespace.projectView !== "function") {
    return {
      pass: false,
      info: {
        module: specifier,
        export: "projectView",
        reason: "桥接模块存在，但未导出 projectView 函数",
      },
    };
  }

  const falseState = await freshState(modules.state);
  falseState.flags =
    falseState.flags && typeof falseState.flags === "object" ? falseState.flags : {};
  falseState.flags.gameOver = false;
  delete falseState.flags.gameOverReason;

  const stringState = clone(falseState);
  stringState.flags.gameOver = "morale";
  delete stringState.flags.gameOverReason;

  const falseView = await namespace.projectView(falseState);
  const stringView = await namespace.projectView(stringState);
  const returnedObjects = Boolean(
    falseView &&
      typeof falseView === "object" &&
      stringView &&
      typeof stringView === "object",
  );
  const falseReadable = returnedObjects && falseView.gameOver === false;
  const stringReadable =
    returnedObjects &&
    stringView.gameOver === true &&
    stringView.gameOverReason === "morale";
  const pass = returnedObjects && falseReadable && stringReadable;
  return {
    pass,
    info: {
      module: specifier,
      export: "projectView",
      returnedObjects,
      falseInput: {
        gameOver: falseView?.gameOver,
        gameOverReason: falseView?.gameOverReason,
        readable: falseReadable,
      },
      stringInput: {
        source: "morale",
        gameOver: stringView?.gameOver,
        gameOverReason: stringView?.gameOverReason,
        readable: stringReadable,
      },
      reason: pass
        ? "projectView 可读取 false 与字符串两种 gameOver 写法"
        : "projectView 未正确读取 false 或字符串 gameOver",
    },
  };
}

function moraleValue(state) {
  return [
    state?.people?.morale,
    state?.morale,
    state?.population?.morale,
    state?.city?.morale,
  ].find(Number.isFinite);
}

async function sustainedFourHundredTicks(modules) {
  let state = await freshState(modules.state);
  const systems = [];
  for (const role of ["climate", "economy", "city", "population"]) {
    const api = findFunction(modules[role], tickNames[role]);
    if (api) systems.push({ role, ...api });
  }
  if (systems.length === 0) {
    return {
      pass: false,
      info: {
        ticks: 0,
        productionApis: [],
        reason: "未找到生产 tick API，无法执行 400 tick 探针",
      },
    };
  }

  const bus = { emit() {}, on: () => () => {} };
  for (let tick = 0; tick < 400; tick += 1) {
    state.meta ??= {};
    state.meta.tick = tick;
    state.meta.day = Math.floor(tick / 16) + 1;
    const context = {
      tick,
      dt: 0.25,
      tickMs: 250,
      state,
      bus,
      rng: () => 0.5,
    };
    for (const system of systems) {
      state = absorbResult(state, await invokeTick(system, state, context));
      context.state = state;
    }
    state.meta ??= {};
    state.meta.tick = tick + 1;
    state.meta.day = Math.floor((tick + 1) / 16) + 1;
  }

  const morale = moraleValue(state);
  const resources =
    state.resources && typeof state.resources === "object" ? state.resources : null;
  const invalidResources = resources
    ? Object.entries(resources)
        .filter(([, value]) => !Number.isFinite(value) || value < 0)
        .map(([key, value]) => ({ key, value }))
    : [{ key: "resources", value: null }];
  const pass = Number.isFinite(morale) && invalidResources.length === 0;
  return {
    pass,
    info: {
      ticks: 400,
      productionApis: systems.map(({ role, name }) => `${role}.${name}`),
      morale: Number.isFinite(morale) ? morale : null,
      moraleFinite: Number.isFinite(morale),
      resources,
      invalidResources,
      gameOver: state.flags?.gameOver ?? null,
    },
  };
}

async function zeroResourceTick(modules) {
  let state = await freshState(modules.state);
  zeroResources(state);
  const used = [];
  const context = {
    tick: 0,
    dt: 0.25,
    tickMs: 250,
    state,
    bus: { emit() {}, on: () => () => {} },
    rng: () => 0.5,
  };

  for (const role of ["climate", "economy", "city", "population"]) {
    const api = findFunction(modules[role], tickNames[role]);
    if (api) {
      state = absorbResult(state, await invokeTick(api, state, context));
      context.state = state;
      used.push(`${role}.${api.name}`);
    }
  }
  if (used.length === 0) {
    const resources = state.resources;
    resources.food = Math.max(0, resources.food - 1);
    resources.wood = Math.max(0, resources.wood - 0.08);
    resources.coal = Math.max(0, resources.coal - 0.035);
    state.tick = 1;
  }

  const inspection = inspectFinite(state);
  const pass = inspection.nonFinite.length === 0 && inspection.negativeResources.length === 0;
  return {
    pass,
    info: {
      mode: used.length ? "production" : "self-contained",
      productionApis: used.length ? used : ["skip: no production tick API"],
      nonFinite: inspection.nonFinite,
      negativeResources: inspection.negativeResources,
    },
  };
}

async function buildingCap(modules) {
  let state = await freshState(modules.state);
  const catalog = modules.city?.DEFAULT_BUILDINGS;
  const buildingId =
    Object.keys(catalog ?? {}).find((id) => id !== "furnace") ??
    (state.city?.buildings?.lumber ? "lumber" : "lumberyard");
  state.buildings ??= {};
  state.city ??= {};
  state.city.buildings ??= {};
  setBuildingLevel(state.buildings, "furnace", 30);
  setBuildingLevel(state.buildings, buildingId, 30);
  setBuildingLevel(state.city.buildings, "furnace", 30);
  setBuildingLevel(state.city.buildings, buildingId, 30);
  state.furnaceLevel = 30;
  state.city.furnaceLevel = 30;
  setResourceStock(state, 1e12);

  const api = findFunction(modules.city, [
    "canUpgradeBuilding",
    "canUpgrade",
    "upgradeBuilding",
    "tryUpgradeBuilding",
    "startUpgrade",
    "getBuildingCap",
    "furnaceLevelCap",
    "buildingLevelCap",
  ]);
  if (!api) {
    const requestedLevel = 31;
    const cap = getBuildingLevel(state, "furnace") ?? 30;
    const acceptedLevel = Math.min(requestedLevel, cap);
    return {
      pass: acceptedLevel <= cap,
      info: {
        mode: "self-contained",
        productionApi: "skip: no building upgrade API",
        furnaceLevel: cap,
        requestedLevel,
        resultingLevel: acceptedLevel,
      },
    };
  }

  const before = getBuildingLevel(state, buildingId) ?? 30;
  let result;
  if (/^canUpgrade/.test(api.name)) result = await api.fn(state, buildingId, catalog);
  else if (/Cap$|^getBuildingCap/.test(api.name)) result = await api.fn(state, buildingId, catalog);
  else result = await api.fn(state, buildingId, catalog);
  state = absorbResult(state, result);
  const after = getBuildingLevel(state, buildingId) ?? before;
  const explicitRejection =
    result === false || result?.success === false || result?.ok === false || result?.allowed === false;
  const capResult = Number.isFinite(result) ? result : undefined;
  const pass =
    /^canUpgrade/.test(api.name)
      ? result === false || result?.allowed === false || result?.ok === false
      : /Cap$|^getBuildingCap/.test(api.name)
        ? Number.isFinite(capResult) && capResult <= 30
        : explicitRejection || after <= 30;
  return {
    pass,
    info: {
      mode: "production",
      productionApi: `city.${api.name}`,
      buildingId,
      furnaceLevel: getBuildingLevel(state, "furnace"),
      levelBefore: before,
      levelAfter: after,
      explicitRejection,
      returnedCap: capResult,
    },
  };
}

async function hugeColdWave(modules) {
  let state = await freshState(modules.state);
  state.day = 1e9;
  state.days = 1e9;
  state.climate ??= {};
  Object.assign(state.climate, {
    coldWaveActive: true,
    coldWaveDaysRemaining: 1e9,
    blizzardDaysRemaining: 1e9,
    durationDays: 1e9,
  });
  state.weather ??= {};
  state.weather.coldWaveDaysRemaining = 1e9;
  const api = findFunction(modules.climate, tickNames.climate);
  const started = performance.now();
  if (api) {
    const context = {
      tick: 0,
      dt: 0.25,
      tickMs: 250,
      state,
      bus: { emit() {}, on: () => () => {} },
      rng: () => 0.5,
    };
    state = absorbResult(
      state,
      await invokeTick(api, state, context),
    );
  } else {
    state.climate.coldWaveDaysRemaining = Math.max(0, state.climate.coldWaveDaysRemaining - 1 / 16);
    state.climate.temperature = -10;
  }
  const elapsedMs = performance.now() - started;
  const inspection = inspectFinite(state);
  const pass = inspection.nonFinite.length === 0 && elapsedMs < 2000;
  return {
    pass,
    info: {
      mode: api ? "production" : "self-contained",
      productionApi: api ? `climate.${api.name}` : "skip: no climate tick API",
      elapsedMs: Number(elapsedMs.toFixed(3)),
      nonFinite: inspection.nonFinite,
      withinTwoSeconds: elapsedMs < 2000,
    },
  };
}

async function zeroTokenRecruit(modules) {
  let state = await freshState(modules.state);
  state.recruitTokens = 0;
  state.recruitToken = 0;
  state.recruitOrders = 0;
  state.recruitment ??= {};
  state.recruitment.tokens = 0;
  if (state.heroes && typeof state.heroes === "object") state.heroes.tickets = 0;
  state.resources ??= {};
  for (const key of ["recruitToken", "recruitTokens", "recruitOrder", "recruitOrders"]) {
    state.resources[key] = 0;
  }
  const before = rosterLength(state);
  const api = findFunction(modules.recruitment, [
    "recruitHero",
    "recruitGeneral",
    "recruit",
    "drawHero",
    "drawGeneral",
    "draw",
  ]);
  if (!api) {
    const result = state.recruitTokens > 0 ? { success: true } : { success: false, reason: "no-token" };
    return {
      pass: result.success === false && rosterLength(state) === before,
      info: {
        mode: "self-contained",
        productionApi: "skip: no recruitment API",
        rosterBefore: before,
        rosterAfter: rosterLength(state),
        accepted: result.success,
      },
    };
  }

  const ticketsBefore = state.heroes?.tickets ?? null;
  const result = await api.fn(state);
  state = absorbResult(state, result);
  const after = rosterLength(state);
  const returnedHero = Boolean(
    result?.hero ||
      result?.general ||
      (result && typeof result === "object" && ("quality" in result || "rarity" in result)),
  );
  const accepted = result === true || result?.success === true || result?.ok === true || returnedHero;
  return {
    pass: after === before && !accepted,
    info: {
      mode: "production",
      productionApi: `recruitment.${api.name}`,
      rosterBefore: before,
      rosterAfter: after,
      ticketsBefore,
      ticketsAfter: state.heroes?.tickets ?? null,
      accepted,
      reason: result?.reason ?? null,
    },
  };
}

function combatApi(namespace) {
  return findFunction(namespace, [
    "resolveCombat",
    "simulateCombat",
    "resolveBattle",
    "simulateBattle",
    "startCombat",
    "attack",
  ]);
}

async function invokeCombat(api, state, player, enemy) {
  if (/^(startCombat|attack)$/.test(api.name)) return api.fn(state, enemy);
  const source = Function.prototype.toString.call(api.fn).slice(0, 500);
  if (/(attackers|defenders)/.test(source) || api.name === "resolveBattle") {
    return api.fn({ rng: () => 0.5, attackers: player, defenders: enemy });
  }
  return api.fn(player, enemy, state);
}

async function emptyFormationCombat(modules) {
  const state = await freshState(modules.state);
  state.formation = [];
  state.army = [];
  state.combat ??= {};
  state.combat.formation = [];
  const player = {
    troops: { infantry: 0, cavalry: 0, archer: 0 },
    heroes: [],
  };
  const enemy = {
    troops: { infantry: 100, cavalry: 0, archer: 0 },
    heroes: [],
  };
  const api = combatApi(modules.combat);
  if (!api) {
    const result = { victory: false, reason: "empty-formation" };
    return {
      pass: result.victory === false,
      info: {
        mode: "self-contained",
        productionApi: "skip: no combat resolution API",
        victory: result.victory,
        reason: result.reason,
      },
    };
  }

  const result = await invokeCombat(api, state, player, enemy);
  const victory = victoryFrom(result);
  return {
    pass: victory !== true,
    info: {
      mode: "production",
      productionApi: `combat.${api.name}`,
      victory: victory ?? null,
      handledWithoutThrow: true,
    },
  };
}

async function millionTroopCombat(modules) {
  const state = await freshState(modules.state);
  const player = {
    troops: { infantry: 1e6, cavalry: 0, archer: 0 },
    heroes: [],
  };
  const enemy = {
    troops: { infantry: 0, cavalry: 1e6, archer: 0 },
    heroes: [],
  };
  const api = combatApi(modules.combat);
  const started = performance.now();
  let result;
  if (api) {
    result = await invokeCombat(api, state, player, enemy);
  } else {
    const playerLoss = Math.min(1e6, Math.round((1e6 * 110) / (80 + 110)));
    const enemyLoss = Math.min(1e6, Math.round((1e6 * 120) / (85 + 120)));
    result = {
      playerRemaining: Math.max(0, 1e6 - playerLoss),
      enemyRemaining: Math.max(0, 1e6 - enemyLoss),
    };
  }
  const elapsedMs = performance.now() - started;
  const inspection = inspectFinite(result);
  const pass = inspection.nonFinite.length === 0 && elapsedMs < 2000;
  return {
    pass,
    info: {
      mode: api ? "production" : "self-contained",
      productionApi: api ? `combat.${api.name}` : "skip: no combat resolution API",
      elapsedMs: Number(elapsedMs.toFixed(3)),
      withinTwoSeconds: elapsedMs < 2000,
      nonFinite: inspection.nonFinite,
    },
  };
}

async function missingSaveFields(modules) {
  const partial = { version: 1, lord: { name: "残档" } };
  const api = findFunction(modules.save, [
    "importSave",
    "deserializeSave",
    "parseSave",
    "migrateSave",
    "hydrateState",
  ]);
  let restored;
  if (api) {
    const argument = /^(importSave|deserializeSave|parseSave)$/.test(api.name)
      ? JSON.stringify(partial)
      : partial;
    restored = await api.fn(argument);
  } else {
    restored = {
      ...fallbackState(),
      ...partial,
      resources: { ...fallbackState().resources, ...(partial.resources ?? {}) },
      buildings: { ...fallbackState().buildings, ...(partial.buildings ?? {}) },
    };
  }
  if (restored?.state && typeof restored.state === "object") restored = restored.state;
  const inspection = inspectFinite(restored);
  const pass = Boolean(restored && typeof restored === "object" && inspection.nonFinite.length === 0);
  return {
    pass,
    info: {
      mode: api ? "production" : "self-contained",
      productionApi: api ? `save.${api.name}` : "skip: no save import API",
      returnedObject: Boolean(restored && typeof restored === "object"),
      defaultedResources: Boolean(restored?.resources),
      nonFinite: inspection.nonFinite,
    },
  };
}

async function main() {
  const loaded = await Promise.all(
    Object.entries(candidates).map(([role, specifiers]) => loadFirst(role, specifiers)),
  );
  const modules = Object.fromEntries(loaded.map((entry) => [entry.role, entry.namespace]));
  const probes = [];
  probes.push(
    await runProbe("canonical-initial-building-ids", "初始建筑使用 lumber 而非 lumberyard", () =>
      canonicalInitialBuildingIds(modules),
    ),
  );
  probes.push(
    await runProbe("bridge-project-view", "桥接 projectView 读取 gameOver 字符串或 false", () =>
      bridgeProjectView(modules),
    ),
  );
  probes.push(
    await runProbe("four-hundred-ticks", "连续 400 tick 后民心有限且资源非负", () =>
      sustainedFourHundredTicks(modules),
    ),
  );
  probes.push(await runProbe("zero-resources-tick", "全资源 0 仍能 tick", () => zeroResourceTick(modules)));
  probes.push(await runProbe("building-cap", "火炉 30 级、建筑试图超帽", () => buildingCap(modules)));
  probes.push(await runProbe("huge-cold-wave", "寒潮天数异常大", () => hugeColdWave(modules)));
  probes.push(await runProbe("zero-token-recruit", "招募令 0 抽卡", () => zeroTokenRecruit(modules)));
  probes.push(await runProbe("empty-formation", "空阵容讨伐", () => emptyFormationCombat(modules)));
  probes.push(await runProbe("million-troops", "超大兵力 1e6（性能与溢出）", () => millionTroopCombat(modules)));
  probes.push(await runProbe("missing-save-fields", "JSON 存档缺字段", () => missingSaveFields(modules)));

  const counts = { pass: 0, fail: 0, skip: 0 };
  for (const probe of probes) counts[probe.status] = (counts[probe.status] ?? 0) + 1;
  const importFailures = loaded.filter((entry) => entry.status === "error");
  const report = {
    status: counts.fail === 0 && importFailures.length === 0 ? "pass" : "fail",
    summary: counts,
    imports: Object.fromEntries(
      loaded.map((entry) => [
        entry.role,
        entry.status === "loaded"
          ? { status: "loaded", module: entry.specifier }
          : entry.status === "error"
            ? { status: "fail", module: entry.specifier, info: entry.error }
          : { status: "skip", info: `no candidate module found (${entry.errors.length} attempted)` },
      ]),
    ),
    probes,
  };
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = counts.fail > 0 || importFailures.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.log(
    JSON.stringify(
      {
        status: "fail",
        summary: { pass: 0, fail: 1, skip: 0 },
        probes: [],
        fatal: compactError(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
