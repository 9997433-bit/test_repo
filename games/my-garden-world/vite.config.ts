import { defineConfig } from "vitest/config";

export default defineConfig({
  root: ".",
  base: "./",
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
