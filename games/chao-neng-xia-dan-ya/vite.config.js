import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: { host: "0.0.0.0", port: 4174 },
  preview: { host: "0.0.0.0", port: 4174 },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
  },
});
