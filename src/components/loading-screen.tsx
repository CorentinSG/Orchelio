import { OrchelioWordmark } from "@/components/brand";

/**
 * Loading screen. Carries the Orchelio identity, as required by the
 * specification.
 *
 * ## Why this is a component rather than a root `loading.tsx`
 *
 * A `loading.tsx` is a Suspense boundary, and a Suspense boundary above a page
 * makes Next send the response headers before the page has run. That is fine
 * until a page needs to answer `notFound()`: the status has already been
 * committed as 200, so "Page not found" is served with a success code.
 *
 * Measured, not assumed — with a root `loading.tsx`, `/matters/<another
 * firm's id>` answered 200; without it, 404. Both cases (a matter that does not
 * exist, and one that exists in another firm) answered identically either way,
 * so nothing about isolation depended on it — but a refusal should say so in
 * its status code as well as its words.
 *
 * So the boundary is placed per segment, and deliberately not above
 * `/matters/[id]`. See docs/decisions/ADR-0011.
 */
export function LoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <OrchelioWordmark size="lg" />
        <p className="text-sm text-ink-muted" role="status">
          Loading…
        </p>
      </div>
    </div>
  );
}
