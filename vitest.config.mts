import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Database tests start an in-memory Postgres and run all migrations per test;
    // that can exceed the 5 s default on a busy machine (e.g. during a build)
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
