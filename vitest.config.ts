import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Orchelio — unit and component tests.
 *
 * End-to-end tests live in tests/e2e and run under Playwright instead
 * (`npm run test:e2e`), so they are excluded here.
 */
export default defineConfig({
  plugins: [react()],
  // Resolves the "@/..." alias from tsconfig.json, so tests import modules by
  // the same path the application uses.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
