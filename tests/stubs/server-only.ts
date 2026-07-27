/**
 * Stand-in for the `server-only` package during tests.
 *
 * The real package throws on import unless the bundler resolves it under the
 * React Server Components condition. That guard is exactly what we want in the
 * application — it makes the build fail if database access is ever pulled into
 * a client component — but under Vitest it would block every test that touches
 * a server module.
 *
 * Aliased in vitest.config.ts. It changes nothing about how the application is
 * built: `npm run build` still uses the real package, so the protection this
 * file bypasses is still enforced where it matters.
 */
export {};
