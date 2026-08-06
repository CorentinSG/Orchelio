/**
 * Orchelio — environment configuration.
 *
 * Every environment variable the application depends on is read here, once,
 * and validated. Nothing else in the codebase should touch `process.env`
 * directly: that keeps the list of required variables discoverable and stops
 * server-only secrets from leaking into a client component by accident.
 *
 * Rule (see docs/ARCHITECTURE.md): only variables prefixed with
 * `NEXT_PUBLIC_` may ever be referenced from client code. The future Anthropic
 * API key is deliberately server-only.
 */

import { assertLoopback } from "@/lib/ai/loopback";

export const AI_PROVIDERS = ["mock", "anthropic", "local", "mistral"] as const;
export type AiProviderName = (typeof AI_PROVIDERS)[number];

export const APP_ENVIRONMENTS = ["demo", "development", "production"] as const;
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

export class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentError";
  }
}

function readEnum<T extends string>(
  name: string,
  raw: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const value = raw.trim();
  if (!(allowed as readonly string[]).includes(value)) {
    throw new EnvironmentError(
      `Invalid value "${value}" for ${name}. Expected one of: ${allowed.join(", ")}.`,
    );
  }
  return value as T;
}

/** A plain environment record. Kept structural so tests can pass literals. */
export type EnvSource = Readonly<Record<string, string | undefined>>;

export type ServerEnv = {
  /** Public application name. Always "Orchelio" unless a white-label demo needs otherwise. */
  appName: string;
  /** Which environment this instance represents. The demo banner keys off this. */
  appEnv: AppEnvironment;
  /** Which AI provider implementation is active. Phase 1 ships "mock" only. */
  aiProvider: AiProviderName;
  /** SQLite connection string used by Prisma. */
  databaseUrl: string;
  /**
   * Reserved for Phase 6+. Never read from a client component, never sent to
   * the browser. Absent in the demo.
   */
  anthropicApiKey: string | undefined;
  /**
   * The firm's Mistral key, required with AI_PROVIDER="mistral" (ADR-0027).
   * Server-only, never rendered, never logged; the only module that uses it
   * is src/lib/ai/mistral-provider.ts.
   */
  mistralApiKey: string | undefined;
  /**
   * Where a model server on this machine is listening.
   *
   * Only meaningful when `aiProvider` is `"local"`, and checked here rather
   * than at first use: an address that is not on this machine should stop the
   * application from starting, at a moment when no client material exists yet,
   * rather than fail on the first matter somebody analyses.
   */
  localModelUrl: string | undefined;
  /**
   * Which model that server should load, e.g. "qwen2.5:7b".
   *
   * Required with `"local"` and recorded on every analysis, so an output kept
   * for two years can still be explained by what produced it.
   */
  localModelName: string | undefined;
};

/**
 * Parses an environment record into a validated Orchelio configuration.
 * Exported separately from `serverEnv()` so it can be unit-tested without
 * mutating the real process environment.
 */
export function parseServerEnv(source: EnvSource = process.env): ServerEnv {
  const appName = source["NEXT_PUBLIC_APP_NAME"]?.trim() || "Orchelio";
  const appEnv = readEnum("NEXT_PUBLIC_APP_ENV", source["NEXT_PUBLIC_APP_ENV"], APP_ENVIRONMENTS, "demo");
  const aiProvider = readEnum("AI_PROVIDER", source["AI_PROVIDER"], AI_PROVIDERS, "mock");
  const databaseUrl = source["DATABASE_URL"]?.trim() || "file:./prisma/orchelio-demo.db";

  if (aiProvider === "anthropic" && !source["ANTHROPIC_API_KEY"]) {
    throw new EnvironmentError(
      'AI_PROVIDER is set to "anthropic" but ANTHROPIC_API_KEY is missing. ' +
        'Set the key server-side, or switch back to AI_PROVIDER="mock".',
    );
  }

  // Refused at startup rather than on the first matter somebody analyses. A
  // silent fallback to the simulation would let a firm believe it was getting
  // a real analysis — the worst failure this product could have.
  if (aiProvider === "mistral" && !source["MISTRAL_API_KEY"]) {
    throw new EnvironmentError(
      'AI_PROVIDER is set to "mistral" but MISTRAL_API_KEY is missing. ' +
        'Set the key server-side, or switch back to AI_PROVIDER="mock".',
    );
  }

  const localModelUrl = source["LOCAL_MODEL_URL"]?.trim() || undefined;
  const localModelName = source["LOCAL_MODEL_NAME"]?.trim() || undefined;

  if (aiProvider === "local") {
    if (!localModelUrl) {
      throw new EnvironmentError(
        'AI_PROVIDER is set to "local" but LOCAL_MODEL_URL is missing. ' +
          "Set it to the address of a model server running on this machine, " +
          "such as http://127.0.0.1:11434 for Ollama.",
      );
    }

    // Refused here, before anything starts, rather than on the first matter.
    // The address is the whole of the promise a firm is given about where its
    // material goes, so the application should not come up at all if it is
    // pointing anywhere but at this machine.
    try {
      assertLoopback(localModelUrl);
    } catch (error) {
      throw new EnvironmentError(
        `LOCAL_MODEL_URL cannot be used: ${(error as Error).message} ` +
          "Orchelio opens a connection to this machine and to nothing else.",
      );
    }

    if (!localModelName) {
      throw new EnvironmentError(
        'AI_PROVIDER is set to "local" but LOCAL_MODEL_NAME is missing. ' +
          'Name the model the server should use, such as "qwen2.5:7b". ' +
          "It is recorded on every analysis so a past output can be explained later.",
      );
    }
  }

  return {
    appName,
    appEnv,
    aiProvider,
    databaseUrl,
    anthropicApiKey: source["ANTHROPIC_API_KEY"]?.trim() || undefined,
    mistralApiKey: source["MISTRAL_API_KEY"]?.trim() || undefined,
    localModelUrl,
    localModelName,
  };
}

let cached: ServerEnv | undefined;

/** Validated server-side environment. Do not import from a client component. */
export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv();
  return cached;
}
