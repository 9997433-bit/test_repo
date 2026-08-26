import { defineConfig } from "vitest/config";

export default defineConfig({
  root: ".",
  base: "./",
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { pretendToBeVisual: true } },
    include: ["tests/**/*.test.ts"],
  },
});
