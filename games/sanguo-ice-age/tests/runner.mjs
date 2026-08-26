/** 零依赖测试入口：node tests/runner.mjs */
import { runAll } from "./harness.mjs";

await import("./cases/config.test.mjs");
await import("./cases/climate.test.mjs");
await import("./cases/economy.test.mjs");
await import("./cases/buildings.test.mjs");
await import("./cases/population.test.mjs");
await import("./cases/army.test.mjs");
await import("./cases/heroes.test.mjs");
await import("./cases/battle.test.mjs");
await import("./cases/quests.test.mjs");
await import("./cases/save.test.mjs");
await import("./cases/integration.test.mjs");
await import("./cases/modules.test.mjs");

const ok = await runAll();
process.exit(ok ? 0 : 1);
