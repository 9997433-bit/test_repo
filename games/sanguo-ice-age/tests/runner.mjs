import assert from "node:assert/strict";

const cases = [];

function test(name, run, options = {}) {
  if (typeof name !== "string" || typeof run !== "function") {
    throw new TypeError("test(name, run) requires a name and function");
  }
  cases.push({
    name,
    run,
    pending: Boolean(options.pending),
    reason: options.reason ?? "",
    selfContained: Boolean(options.selfContained),
  });
}

const api = { assert, test };
const suites = [
  "./unit/economy.test.mjs",
  "./unit/climate.test.mjs",
  "./unit/combat.test.mjs",
  "./unit/save.test.mjs",
  "./unit/quests.test.mjs",
  "./integration.test.mjs",
];

for (const suitePath of suites) {
  try {
    const suite = await import(new URL(suitePath, import.meta.url));
    assert.equal(typeof suite.register, "function", `${suitePath} must export register()`);
    await suite.register(api);
  } catch (error) {
    test(`runner imports ${suitePath}`, () => {
      throw error;
    });
  }
}

const selfContainedCount = cases.filter((entry) => entry.selfContained && !entry.pending).length;
if (selfContainedCount < 8) {
  test("runner has at least eight self-contained probes", () => {
    assert.fail(`expected at least 8 self-contained probes, found ${selfContainedCount}`);
  });
}

let passed = 0;
let failed = 0;
let pending = 0;

for (const entry of cases) {
  try {
    await entry.run();
    if (entry.pending) {
      pending += 1;
      console.log(`PENDING ${entry.name}${entry.reason ? ` — ${entry.reason}` : ""}`);
    } else {
      passed += 1;
      console.log(`PASS    ${entry.name}`);
    }
  } catch (error) {
    failed += 1;
    console.log(`FAIL    ${entry.name}`);
    console.log(`        ${error?.stack ?? error}`);
  }
}

console.log("");
console.log(
  `Result: ${passed} passed, ${failed} failed, ${pending} pending (${cases.length} total; ${selfContainedCount} self-contained)`,
);

process.exitCode = failed === 0 ? 0 : 1;
