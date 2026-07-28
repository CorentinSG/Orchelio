import type { NextConfig } from "next";

/**
 * Orchelio — Next.js configuration.
 *
 * Deliberately small. Two notes on caching, because they are easy to get wrong
 * in a multi-tenant product:
 *
 *  * Every signed-in route is `dynamic = "force-dynamic"` and always will be.
 *    A firm's dashboard must never be served from a cache that another request
 *    could reach. The caching Orchelio *does* apply is in `src/lib/cache.ts`
 *    and is either request-scoped or limited to platform-wide catalogues.
 *
 *  * `.next/cache` is what makes a rebuild fast, so it is preserved in CI
 *    (see .github/workflows/verify.yml) rather than thrown away.
 */
const nextConfig: NextConfig = {
  // Prisma's engine files are required at runtime and must not be traced away
  // or bundled; naming the packages keeps the server build correct.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-better-sqlite3", "better-sqlite3"],

  // The demonstration must never be indexed, whatever it is deployed behind.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
