import { describe, expect, it } from "vitest";

import { EnvironmentError, parseServerEnv } from "@/lib/env";

/**
 * The environment layer is the single gate for configuration. These tests lock
 * down two things that matter beyond Phase 1: the demo must default to the
 * simulated AI provider, and switching to Anthropic must fail loudly rather
 * than silently fall back.
 */
describe("parseServerEnv", () => {
  it("defaults to the Orchelio demonstration configuration", () => {
    const env = parseServerEnv({});

    expect(env.appName).toBe("Orchelio");
    expect(env.appEnv).toBe("demo");
    expect(env.aiProvider).toBe("mock");
    expect(env.anthropicApiKey).toBeUndefined();
  });

  it("reads the configured values", () => {
    const env = parseServerEnv({
      NEXT_PUBLIC_APP_NAME: "Orchelio",
      NEXT_PUBLIC_APP_ENV: "demo",
      AI_PROVIDER: "mock",
      DATABASE_URL: "file:./prisma/orchelio-demo.db",
    });

    expect(env.databaseUrl).toBe("file:./prisma/orchelio-demo.db");
    expect(env.aiProvider).toBe("mock");
  });

  it("rejects an unknown AI provider instead of guessing", () => {
    expect(() => parseServerEnv({ AI_PROVIDER: "openai" })).toThrow(EnvironmentError);
  });

  it("rejects an unknown application environment", () => {
    expect(() => parseServerEnv({ NEXT_PUBLIC_APP_ENV: "staging" })).toThrow(EnvironmentError);
  });

  it("refuses to select the Anthropic provider without a server-side key", () => {
    expect(() => parseServerEnv({ AI_PROVIDER: "anthropic" })).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("accepts the Anthropic provider once a key is present", () => {
    const env = parseServerEnv({ AI_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "sk-test" });

    expect(env.aiProvider).toBe("anthropic");
    expect(env.anthropicApiKey).toBe("sk-test");
  });
});
