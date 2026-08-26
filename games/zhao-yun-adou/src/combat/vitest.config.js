import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * 战斗层自带的测试配置。
 * 根 vite.config.js 的 test.include 只收 tests/**，而本轮只允许改
 * src/combat/**，故把战斗单测放在模块内，用这份配置单独跑：
 *
 *   npx vitest run --config src/combat/vitest.config.js
 *
 * 后续谁拥有根配置，把 "src/**\/*.test.js" 加进 include 即可并入 npm test。
 */
export default defineConfig({
  root: path.resolve(here, "../.."),
  test: {
    environment: "node",
    include: ["src/combat/**/*.test.js"],
  },
});
