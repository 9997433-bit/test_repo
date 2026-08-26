import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  // Relative assets so the build can sit at /test_repo/<game>/ on GitHub Pages.
  base: "./",
  server: { host: "0.0.0.0", port: 4174 },
  preview: { host: "0.0.0.0", port: 4174 },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
  },
});
