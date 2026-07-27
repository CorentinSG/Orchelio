/**
 * Orchelio — sign-in attempt throttling.
 *
 * A deliberately simple in-memory fixed-window counter, keyed by the submitted
 * email address.
 *
 * Limitations, stated plainly rather than discovered later: the counters live
 * in the process, so they reset when the server restarts and are not shared
 * across instances. It raises the cost of guessing a demonstration password on
 * one machine; it is not production abuse protection. A real deployment needs a
 * shared store and per-IP limits as well. See docs/PRODUCTION_READINESS.md.
 */

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

export type RateLimitResult = {
  allowed: boolean;
  /** Attempts left in the current window. */
  remaining: number;
  /** When the window resets. */
  resetAt: Date;
};

function windowFor(key: string, now: number): Window {
  const existing = windows.get(key);
  if (existing && existing.resetAt > now) {
    return existing;
  }
  const fresh: Window = { count: 0, resetAt: now + WINDOW_MS };
  windows.set(key, fresh);
  return fresh;
}

/** Records an attempt and reports whether it is allowed. */
export function consumeAttempt(key: string, now: number = Date.now()): RateLimitResult {
  const normalised = key.trim().toLowerCase();
  const window = windowFor(normalised, now);

  // Prune opportunistically: the map would otherwise grow without bound on a
  // long-running process.
  if (windows.size > 1000) {
    for (const [candidate, value] of windows) {
      if (value.resetAt <= now) windows.delete(candidate);
    }
  }

  window.count += 1;

  return {
    allowed: window.count <= MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - window.count),
    resetAt: new Date(window.resetAt),
  };
}

/** Clears the counter for a key. Called after a successful sign-in. */
export function resetAttempts(key: string): void {
  windows.delete(key.trim().toLowerCase());
}

/** Test helper: empties every counter. */
export function resetAllAttempts(): void {
  windows.clear();
}
