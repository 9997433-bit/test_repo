/** 极简零依赖测试框架。 */

const suites = [];
let current = null;

export function suite(name, fn) {
  current = { name, tests: [] };
  suites.push(current);
  fn();
  current = null;
}

export function test(name, fn) {
  if (!current) throw new Error("test() 必须在 suite() 内调用");
  current.tests.push({ name, fn });
}

export function assert(cond, msg = "断言失败") {
  if (!cond) throw new Error(msg);
}

export function assertEq(actual, expected, msg = "") {
  if (actual !== expected) {
    throw new Error(`${msg} 期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
  }
}

export function assertClose(actual, expected, eps = 1e-6, msg = "") {
  if (Math.abs(actual - expected) > eps) {
    throw new Error(`${msg} 期望 ≈${expected}（±${eps}），实际 ${actual}`);
  }
}

export function assertThrows(fn, msg = "期望抛出异常") {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(msg);
}

export function assertDeepEq(actual, expected, msg = "") {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg} 期望 ${b}，实际 ${a}`);
}

export async function runAll() {
  let passed = 0;
  let failed = 0;
  const failures = [];
  for (const s of suites) {
    let suiteFailed = 0;
    for (const t of s.tests) {
      try {
        await t.fn();
        passed++;
      } catch (err) {
        failed++;
        suiteFailed++;
        failures.push({ suite: s.name, test: t.name, err });
      }
    }
    const mark = suiteFailed === 0 ? "✓" : "✗";
    console.log(`${mark} ${s.name}（${s.tests.length - suiteFailed}/${s.tests.length}）`);
  }
  console.log("—".repeat(48));
  if (failures.length) {
    for (const f of failures) {
      console.error(`✗ ${f.suite} › ${f.test}\n  ${f.err.message}`);
    }
  }
  console.log(`共 ${passed + failed} 项：${passed} 通过，${failed} 失败`);
  return failed === 0;
}
