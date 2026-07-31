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

/**
 * The local model is configured here and nowhere else, and every one of these
 * refusals happens at startup — before a firm's material is anywhere near it.
 * An address that is wrong should stop the application coming up, not fail on
 * the first matter somebody analyses.
 */
describe("a model on this machine", () => {
  it("refuses the local provider without an address", () => {
    expect(() => parseServerEnv({ AI_PROVIDER: "local" })).toThrow(/LOCAL_MODEL_URL/);
  });

  it("refuses an address that is not on this machine, at startup", () => {
    for (const url of ["https://api.example.com", "http://192.168.1.10:11434"]) {
      expect(
        () => parseServerEnv({ AI_PROVIDER: "local", LOCAL_MODEL_URL: url, LOCAL_MODEL_NAME: "m" }),
        url,
      ).toThrow(EnvironmentError);
    }
  });

  it("refuses localhost, because a name is resolved by the machine", () => {
    expect(() =>
      parseServerEnv({
        AI_PROVIDER: "local",
        LOCAL_MODEL_URL: "http://localhost:11434",
        LOCAL_MODEL_NAME: "m",
      }),
    ).toThrow(/127\.0\.0\.1/);
  });

  it("refuses it without a model name, which is what explains a past analysis", () => {
    expect(() =>
      parseServerEnv({ AI_PROVIDER: "local", LOCAL_MODEL_URL: "http://127.0.0.1:11434" }),
    ).toThrow(/LOCAL_MODEL_NAME/);
  });

  it("accepts a loopback address and a named model", () => {
    const env = parseServerEnv({
      AI_PROVIDER: "local",
      LOCAL_MODEL_URL: "http://127.0.0.1:11434",
      LOCAL_MODEL_NAME: "qwen2.5:7b",
    });

    expect(env.aiProvider).toBe("local");
    expect(env.localModelUrl).toBe("http://127.0.0.1:11434");
    expect(env.localModelName).toBe("qwen2.5:7b");
  });

  it("ignores a local address when the local provider is not selected", () => {
    // Leaving the variable set after switching back to the simulation must not
    // make anything reach for a model.
    const env = parseServerEnv({ LOCAL_MODEL_URL: "http://127.0.0.1:11434" });

    expect(env.aiProvider).toBe("mock");
  });
});
