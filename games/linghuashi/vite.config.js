import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  base: "./",
  server: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.js"],
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
