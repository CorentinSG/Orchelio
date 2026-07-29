import Link from "next/link";

import { OrchelioWordmark } from "@/components/brand";
import { Callout } from "@/components/ui";

/**
 * "Page not found", without deciding where it sits.
 *
 * There are two places this message renders and they need different wrappers.
 * Outside the workspace it is the whole page, so it carries the wordmark and
 * its own `<main>` landmark. Inside the workspace the shell already provides
 * both — and rendering a second `<main>` there is not a cosmetic problem: a
 * screen reader navigating by landmark finds two "main" regions and has no way
 * to know which is the page.
 *
 * Measured rather than reasoned about: `/matters/<an id that does not exist>`
 * rendered the root boundary *inside* the shell's `<main>`, which axe reported
 * as both a duplicate main and a main nested in another landmark.
 *
 * The wording is generic on purpose and identical to the refusal's: it never
 * reveals whether the resource exists somewhere the caller cannot see.
 */
export function NotFoundNotice({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <div className="w-full max-w-md">
      {withWordmark ? <OrchelioWordmark size="lg" /> : null}
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
  );
}
