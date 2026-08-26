import { spawnSync } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const checks = ["test", "bench", "simulate", "boundary"];
const results = [];

for (const name of checks) {
  console.log(`\n=== ${name} ===`);
  const startedAt = performance.now();
  const result = spawnSync(npm, ["run", name], {
    cwd: new URL("..", import.meta.url),
    stdio: "inherit",
  });
  const elapsedMs = Math.round(performance.now() - startedAt);
  const passed = !result.error && result.status === 0;

  if (result.error) {
    console.error(`${name} 无法启动: ${result.error.message}`);
  } else if (result.signal) {
    console.error(`${name} 被信号 ${result.signal} 终止`);
  }

  results.push({ name, elapsedMs, passed });
}

console.log("\n=== 验证汇总 ===");
for (const { name, elapsedMs, passed } of results) {
  console.log(`${passed ? "PASS" : "FAIL"}  ${name.padEnd(8)} ${elapsedMs}ms`);
}

const failures = results.filter(({ passed }) => !passed);
console.log(`总计: ${results.length - failures.length}/${results.length} 通过`);
if (failures.length > 0) process.exitCode = 1;
