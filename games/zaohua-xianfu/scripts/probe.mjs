import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const required = [
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

const missing = required.filter((p) => !existsSync(join(root, p)));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const vite = readFileSync(join(root, "vite.config.js"), "utf8");
const portOk = pkg.scripts.dev.includes("4174") && vite.includes("4174");

const mods = await Promise.all([
  import(pathToFileURL(join(root, "src/mansion/production.js")).href),
  import(pathToFileURL(join(root, "src/combat/battle.js")).href),
  import(pathToFileURL(join(root, "src/progression/realm.js")).href),
  import(pathToFileURL(join(root, "src/disciples/assign.js")).href),
]);

const exportsOk = ["produce", "simulate", "breakthroughChance", "yieldMultiplier"].every((name, i) => name in mods[i]);

const report = {
  ok: missing.length === 0 && portOk && exportsOk && pkg.name === "zaohua-xianfu",
  missing,
  portOk,
  exportsOk,
  isolated: !required.some((p) => p.startsWith("../") && !p.startsWith("../src")),
};
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
