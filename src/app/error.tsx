"use client";

import { useEffect } from "react";

import { OrchelioWordmark } from "@/components/brand";
import { Callout } from "@/components/ui";
import { APP_NAME } from "@/lib/app-config";

/**
 * Application error screen.
 *
 * The message shown to the user is deliberately generic — internal details
 * could leak information about another firm's data. The full error is logged
 * server-side, and the digest lets an operator find it in the logs.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[orchelio] unhandled error:", error);
  }, [error]);

  return (
    <main id="main" tabIndex={-1} className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <OrchelioWordmark size="lg" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">Something went wrong</h1>
        <p className="mt-2 text-ink-muted">
          {APP_NAME} could not complete this request. No data was changed.
        </p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
          >
            Try again
          </button>

          {error.digest ? (
            <Callout tone="neutral" title="Reference">
              <code className="font-mono text-xs">{error.digest}</code>
            </Callout>
          ) : null}
        </div>
      </div>
    </main>
  );
}
