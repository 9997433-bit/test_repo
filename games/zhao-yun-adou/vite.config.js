import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  // Relative assets so the build can sit at /test_repo/<game>/ on GitHub Pages.
  base: "./",
  server: {
    host: "0.0.0.0",
    port: 4180,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 4180,
    strictPort: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js", "src/**/*.test.js"],
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
