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

export const AI_PROVIDERS = ["mock", "anthropic"] as const;
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

  return {
    appName,
    appEnv,
    aiProvider,
    databaseUrl,
    anthropicApiKey: source["ANTHROPIC_API_KEY"]?.trim() || undefined,
  };
}

let cached: ServerEnv | undefined;

/** Validated server-side environment. Do not import from a client component. */
export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv();
  return cached;
}
