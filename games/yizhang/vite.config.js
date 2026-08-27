import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  base: "./",
  server: {
    host: "0.0.0.0",
    port: 4181,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 4181,
    strictPort: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js", "src/**/*.test.js"],
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
