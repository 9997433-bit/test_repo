/* Zero-dependency test runner.  Usage:  node tests/run.mjs [nameFilter]
 * Game sources are plain scripts that attach to globalThis.WC3TD, so we simply
 * require them in dependency order and then run the suites. */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');

const SOURCES = [
  'js/config.js',
  'js/data/damageTable.js',
  'js/data/towers.js',
  'js/data/creeps.js',
  'js/data/waves.js',
  'js/data/heroes.js',
  'js/engine/rng.js',
  'js/engine/path.js',
  'js/engine/spatial.js',
  'js/sim/combat.js',
  'js/entities/fx.js',
  'js/entities/creep.js',
  'js/entities/projectile.js',
  'js/entities/tower.js',
  'js/entities/hero.js',
  'js/sim/game.js'
];

for (const rel of SOURCES) require(path.join(rootDir, rel));

const ANSI = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`
};

const results = { pass: 0, fail: 0, failures: [] };
let currentSuite = '';

function approx(a, b, eps = 1e-6) { return Math.abs(a - b) <= eps; }

const t = {
  eq(actual, expected, msg) {
    if (actual !== expected) throw new Error(`${msg || 'eq'}: expected ${expected}, got ${actual}`);
  },
  near(actual, expected, eps, msg) {
    if (!approx(actual, expected, eps === undefined ? 1e-6 : eps)) {
      throw new Error(`${msg || 'near'}: expected ~${expected}, got ${actual}`);
    }
  },
  ok(cond, msg) { if (!cond) throw new Error(msg || 'expected truthy'); },
  notOk(cond, msg) { if (cond) throw new Error(msg || 'expected falsy'); },
  gt(a, b, msg) { if (!(a > b)) throw new Error(`${msg || 'gt'}: expected ${a} > ${b}`); },
  gte(a, b, msg) { if (!(a >= b)) throw new Error(`${msg || 'gte'}: expected ${a} >= ${b}`); },
  lt(a, b, msg) { if (!(a < b)) throw new Error(`${msg || 'lt'}: expected ${a} < ${b}`); },
  lte(a, b, msg) { if (!(a <= b)) throw new Error(`${msg || 'lte'}: expected ${a} <= ${b}`); },
  throws(fn, msg) {
    let threw = false;
    try { fn(); } catch (e) { threw = true; }
    if (!threw) throw new Error(msg || 'expected throw');
  }
};

function test(name, fn) {
  try {
    fn(t);
    results.pass++;
    console.log(`  ${ANSI.green('✓')} ${name}`);
  } catch (err) {
    results.fail++;
    results.failures.push(`${currentSuite} › ${name}\n      ${err.message}`);
    console.log(`  ${ANSI.red('✗')} ${name}\n      ${ANSI.red(err.message)}`);
  }
}

const filter = process.argv[2] || '';
const testDir = here;
const files = fs.readdirSync(testDir).filter((f) => f.endsWith('.test.js')).sort();

console.log(ANSI.bold('\nAzeroth Keep TD — test suite\n'));
const started = Date.now();

for (const file of files) {
  if (filter && !file.includes(filter)) continue;
  currentSuite = file.replace('.test.js', '');
  console.log(ANSI.cyan(`• ${currentSuite}`));
  const suite = require(path.join(testDir, file));
  suite(test, globalThis.WC3TD, t);
  console.log('');
}

const ms = Date.now() - started;
console.log(ANSI.bold(`${results.pass} passed, ${results.fail} failed  ${ANSI.dim(`(${ms}ms)`)}\n`));
if (results.fail) {
  console.log(ANSI.red('Failures:'));
  results.failures.forEach((f) => console.log('  - ' + f));
  process.exit(1);
}
