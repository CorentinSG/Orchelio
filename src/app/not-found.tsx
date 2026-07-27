import Link from "next/link";

import { OrchelioWordmark } from "@/components/brand";
import { Callout } from "@/components/ui";

export const metadata = { title: "Page not found" };

/** 404. Generic on purpose: it never reveals whether a resource exists elsewhere. */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <OrchelioWordmark size="lg" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">Page not found</h1>
        <p className="mt-2 text-ink-muted">
          The page you asked for does not exist, or you do not have access to it.
        </p>
        <div className="mt-6">
          <Callout tone="neutral">
            <Link href="/" className="font-medium text-brand underline underline-offset-4">
              Return to the Orchelio home page
            </Link>
          </Callout>
        </div>
      </div>
    </div>
  );
}
