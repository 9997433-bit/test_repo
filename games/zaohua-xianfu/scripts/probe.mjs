import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const expectedPort = 4174;
const requiredFiles = [
  "package.json",
  "vite.config.js",
  "index.html",
  "src/main.js",
  "src/core/store.js",
  "src/core/engine.js",
  "src/mansion/production.js",
  "src/combat/battle.js",
  "src/progression/realm.js",
  "src/disciples/assign.js",
  "src/ui/app.js",
  "tests/economy.test.js",
  "tests/combat.test.js",
  "tests/progression.test.js",
];

const requiredExports = {
  "src/core/store.js": ["defaultState", "reduce", "createStore", "ALL_ARTIFACTS", "GRID"],
  "src/core/engine.js": ["startEngine"],
  "src/mansion/production.js": ["produce", "applyYield", "combatBuildingBonus"],
  "src/combat/battle.js": ["simulate"],
  "src/combat/tower.js": ["challengeTower", "towerReward"],
  "src/progression/realm.js": ["breakthroughChance", "canCultivate", "applyCultivate", "applyBreakthrough"],
  "src/disciples/assign.js": ["yieldMultiplier"],
};

const requiredActions = [
  "BOOT",
  "CHOOSE_FACTION",
  "TICK",
  "BUILD",
  "UPGRADE",
  "ASSIGN",
  "RECRUIT",
  "TRAIN",
  "CULTIVATE",
  "BREAKTHROUGH",
  "SET_PARTY",
  "EQUIP_ARTIFACT",
  "START_TOWER",
  "START_WAVE",
  "RESOLVE_COMBAT",
  "COLLECT_OFFLINE",
  "RESET",
];

const ignoredDirectories = new Set(["node_modules", "dist", "coverage", ".git"]);
const scannedExtensions = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".html", ".css"]);

function errorText(error) {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function projectFiles(directory = root) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...projectFiles(absolute));
    else if (entry.isFile() && scannedExtensions.has(extname(entry.name))) files.push(absolute);
  }
  return files;
}

function isInsideProject(target) {
  const fromRoot = relative(root, target);
  return fromRoot === "" || (!fromRoot.startsWith(`..${sep}`) && fromRoot !== ".." && !isAbsolute(fromRoot));
}

function isolationReport() {
  const files = projectFiles();
  const gamesDirectory = dirname(root);
  const projectName = basename(root).toLowerCase();
  const siblingNames = readdirSync(gamesDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.toLowerCase() !== projectName)
    .map((entry) => entry.name);
  const violations = [];
  const seen = new Set();

  const addViolation = (file, reference, reason) => {
    const item = { file: relative(root, file).split(sep).join("/"), reference, reason };
    const key = JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      violations.push(item);
    }
  };

  for (const file of files) {
    const source = readFileSync(file, "utf8");

    for (const match of source.matchAll(/\bgames[\\/]+([a-z0-9][a-z0-9-]*)/gi)) {
      if (match[1].toLowerCase() !== projectName) {
        addViolation(file, match[0], "cross-game reference");
      }
    }

    for (const sibling of siblingNames) {
      const escaped = sibling.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(^|[^a-z0-9-])${escaped}([^a-z0-9-]|$)`, "i").test(source)) {
        addViolation(file, sibling, "sibling game reference");
      }
    }

    const localReferences = new Set();
    const referencePatterns = [
      /\bfrom\s*["']([^"']+)["']/g,
      /\bimport\s*["']([^"']+)["']/g,
      /\b(?:import|require)\s*\(\s*["']([^"']+)["']/g,
      /["'`]((?:\.\.[\\/])+[^"'`\s]+)["'`]/g,
    ];
    for (const pattern of referencePatterns) {
      for (const match of source.matchAll(pattern)) localReferences.add(match[1]);
    }
    for (const reference of localReferences) {
      if (!reference.startsWith(".")) continue;
      const cleanReference = reference.split(/[?#]/, 1)[0];
      const target = resolve(dirname(file), cleanReference);
      if (!isInsideProject(target)) addViolation(file, reference, "local path escapes project");
    }
  }

  return { ok: violations.length === 0, scannedFiles: files.length, siblingGames: siblingNames, violations };
}

async function exportsReport() {
  const modules = {};
  for (const [file, expected] of Object.entries(requiredExports)) {
    try {
      const mod = await import(pathToFileURL(join(root, file)).href);
      const missing = expected.filter((name) => !(name in mod));
      modules[file] = { ok: missing.length === 0, expected, missing };
    } catch (error) {
      modules[file] = { ok: false, expected, missing: expected, error: errorText(error) };
    }
  }
  return { ok: Object.values(modules).every((entry) => entry.ok), modules };
}

function actionsReport() {
  const storeFile = join(root, "src/core/store.js");
  if (!existsSync(storeFile)) {
    return { ok: false, names: [], required: requiredActions, missing: requiredActions, duplicates: [] };
  }
  const source = readFileSync(storeFile, "utf8");
  const names = [...source.matchAll(/\bcase\s+["']([A-Z][A-Z0-9_]*)["']\s*:/g)].map((match) => match[1]);
  const missing = requiredActions.filter((name) => !names.includes(name));
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  return {
    ok: names.length > 0 && missing.length === 0 && duplicates.length === 0,
    names,
    required: requiredActions,
    missing,
    duplicates: [...new Set(duplicates)],
  };
}

async function portReport(pkg) {
  const commandHasPort = (command) =>
    typeof command === "string" && new RegExp(`(?:^|\\s)--port(?:=|\\s+)${expectedPort}(?:\\s|$)`).test(command);
  const scripts = {
    dev: commandHasPort(pkg?.scripts?.dev),
    preview: commandHasPort(pkg?.scripts?.preview),
  };
  const config = { server: false, preview: false, strict: false, error: null };
  try {
    const vite = (await import(pathToFileURL(join(root, "vite.config.js")).href)).default;
    config.server = vite?.server?.port === expectedPort;
    config.preview = vite?.preview?.port === expectedPort;
    config.strict = vite?.server?.strictPort === true && vite?.preview?.strictPort === true;
  } catch (error) {
    config.error = errorText(error);
  }
  return {
    ok: Object.values(scripts).every(Boolean) && config.server && config.preview && config.strict,
    expected: expectedPort,
    scripts,
    config,
  };
}

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));
let packageData = null;
let packageError = null;
try {
  packageData = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
} catch (error) {
  packageError = errorText(error);
}

let isolation = { ok: false, scannedFiles: 0, siblingGames: [], violations: [] };
let exportsDetail = { ok: false, modules: {} };
let actions = { ok: false, names: [], required: requiredActions, missing: requiredActions, duplicates: [] };
let port = { ok: false, expected: expectedPort, scripts: {}, config: {} };
const errors = [];

try {
  isolation = isolationReport();
} catch (error) {
  errors.push(`isolation: ${errorText(error)}`);
}
try {
  exportsDetail = await exportsReport();
} catch (error) {
  errors.push(`exports: ${errorText(error)}`);
}
try {
  actions = actionsReport();
} catch (error) {
  errors.push(`actions: ${errorText(error)}`);
}
try {
  port = await portReport(packageData);
} catch (error) {
  errors.push(`port: ${errorText(error)}`);
}

const packageOk = packageData?.name === "zaohua-xianfu" && packageError === null;
const ok =
  missing.length === 0 &&
  packageOk &&
  isolation.ok &&
  port.ok &&
  exportsDetail.ok &&
  actions.ok &&
  errors.length === 0;
const report = {
  ok,
  project: packageData?.name ?? null,
  missing,
  packageOk,
  packageError,
  isolated: isolation.ok,
  isolation,
  portOk: port.ok,
  port,
  exportsOk: exportsDetail.ok,
  exports: exportsDetail,
  actionNames: actions.names,
  actions,
  errors,
};
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
