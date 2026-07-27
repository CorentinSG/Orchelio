import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Orchelio — unit, component and integration tests.
 *
 * Integration tests (tests/integration) build a throwaway SQLite database and
 * exercise the real data-access layer. They need a Node environment and they
 * need the `server-only` guard stubbed out; both are handled below.
 *
 * End-to-end tests live in tests/e2e and run under Playwright instead
 * (`npm run test:e2e`), so they are excluded here.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolves the "@/..." alias from tsconfig.json, so tests import modules by
    // the same path the application uses.
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    // Building and migrating a database is slower than a unit test.
    testTimeout: 30_000,
    hookTimeout: 180_000,
  },
});
