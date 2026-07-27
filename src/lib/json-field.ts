/**
 * Orchelio — JSON columns.
 *
 * Prisma does not support the Json type on SQLite, so structured payloads —
 * firm configuration, matter fields, AI results — are stored as JSON text.
 * These helpers are the only place that parsing happens, so malformed content
 * degrades to a documented default instead of throwing inside a page render.
 *
 * On PostgreSQL these columns become jsonb and the helpers become pass-throughs.
 */

/** Parses a JSON object column. Returns the fallback if absent or malformed. */
export function parseJsonObject(
  raw: string | null | undefined,
  fallback: Record<string, unknown> = {},
): Record<string, unknown> {
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Fall through to the default below.
  }
  return fallback;
}

/** Parses a JSON array-of-strings column, dropping anything that is not a string. */
export function parseStringArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    // Fall through to the empty array below.
  }
  return [];
}

/** Serialises a value for a JSON column. */
export function toJsonColumn(value: unknown): string {
  return JSON.stringify(value ?? null);
}
