#!/usr/bin/env node
/*
 * Dependency-free test runner.
 *
 *   node tests/run.mjs            run everything
 *   node tests/run.mjs path       run suites whose name contains "path"
 *
 * The game sources are plain classic scripts (so index.html works over
 * file://) that also expose a CommonJS export, which is what lets the runner
 * require them straight from disk with zero build step.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');

// Load order mirrors the <script> order in index.html.
const SOURCES = [
  'js/config.js',
  'js/engine/rng.js',
  'js/engine/path.js',
  'js/engine/spatial.js',
  'js/engine/loop.js',
  'js/engine/camera.js',
  'js/data/damageTable.js',
  'js/data/towers.js',
  'js/data/waves.js',
  'js/entities/entity.js',
  'js/entities/creep.js',
  'js/entities/tower.js',
  'js/entities/projectile.js',
  'js/entities/fx.js',
  'js/entities/hero.js',
  'js/sim/game.js'
];

globalThis.WC3 = globalThis.WC3 || {};
for (const src of SOURCES) require(path.join(root, src));
const WC3 = globalThis.WC3;

const SUITES = [
  'damageTable.test.js',
  'path.test.js',
  'determinism.test.js',
  'engine.test.js',
  'economy.test.js',
  'combat.test.js',
  'waves.test.js',
  'balance.test.js'
];

const filter = process.argv[2] || '';

const C = process.stdout.isTTY
  ? { red: '\x1b[31m', green: '\x1b[32m', dim: '\x1b[2m', bold: '\x1b[1m', yellow: '\x1b[33m', off: '\x1b[0m' }
  : { red: '', green: '', dim: '', bold: '', yellow: '', off: '' };

class Harness {
  constructor(suite) {
    this.suite = suite;
    this.passed = 0;
    this.failures = [];
    this.current = '(anonymous)';
    this.notes = [];
  }

  test(name, fn) {
    this.current = name;
    try {
      fn();
      this.passed++;
      console.log(`  ${C.green}ok${C.off}   ${name}`);
    } catch (err) {
      this.failures.push({ name, err });
      console.log(`  ${C.red}FAIL${C.off} ${name}`);
      console.log(`       ${C.red}${err && err.message}${C.off}`);
      if (err && err.stack && process.env.WC3_TRACE) console.log(err.stack);
    }
  }

  note(msg) {
    this.notes.push(msg);
    console.log(`       ${C.dim}${msg}${C.off}`);
  }

  ok(cond, msg) {
    if (!cond) throw new Error(msg || 'expected truthy value');
  }

  eq(actual, expected, msg) {
    if (actual !== expected) {
      throw new Error(`${msg || 'values differ'}: expected ${format(expected)}, got ${format(actual)}`);
    }
  }

  ne(actual, expected, msg) {
    if (actual === expected) {
      throw new Error(`${msg || 'values should differ'}: both are ${format(actual)}`);
    }
  }

  close(actual, expected, eps, msg) {
    if (!(Math.abs(actual - expected) <= eps)) {
      throw new Error(`${msg || 'not close'}: expected ${expected} +/- ${eps}, got ${actual}`);
    }
  }

  gt(actual, bound, msg) {
    if (!(actual > bound)) throw new Error(`${msg || 'not greater'}: ${format(actual)} <= ${format(bound)}`);
  }

  lt(actual, bound, msg) {
    if (!(actual < bound)) throw new Error(`${msg || 'not less'}: ${format(actual)} >= ${format(bound)}`);
  }
}

function format(v) {
  if (typeof v === 'number' && !Number.isInteger(v)) return v.toFixed(4);
  return String(v);
}

let totalPassed = 0;
const allFailures = [];
const started = Date.now();

for (const suite of SUITES) {
  if (filter && !suite.includes(filter)) continue;
  const mod = require(path.join(here, suite));
  const h = new Harness(suite);
  console.log(`${C.bold}${suite}${C.off}`);
  mod(h, WC3);
  totalPassed += h.passed;
  for (const f of h.failures) allFailures.push({ suite, ...f });
  console.log('');
}

const ms = Date.now() - started;
if (allFailures.length === 0) {
  console.log(`${C.green}${C.bold}All ${totalPassed} assertions/tests passed${C.off} ${C.dim}(${ms}ms)${C.off}`);
  process.exit(0);
} else {
  console.log(`${C.red}${C.bold}${allFailures.length} failing${C.off} of ${totalPassed + allFailures.length} (${ms}ms)`);
  for (const f of allFailures) console.log(`  ${C.red}x${C.off} ${f.suite} > ${f.name}: ${f.err.message}`);
  process.exit(1);
}
