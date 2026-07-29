import { DEMO_NOTICE_LONG, DEMO_NOTICE_SHORT, IS_DEMO } from "@/lib/app-config";

/**
 * Standing demonstration warning.
 *
 * Required by the specification on every principal page. It renders nothing
 * outside the demo build, so the same component can stay mounted in the layout
 * when Orchelio is later configured for a real environment.
 */
export function DemoBanner({ variant = "short" }: { variant?: "short" | "long" }) {
  if (!IS_DEMO) {
    return null;
  }

  return (
    // A named landmark, not a bare div. The banner sits above every landmark on
    // the page, so its text belonged to none of them — a screen-reader user
    // navigating by landmark skipped the one notice the specification requires
    // on every screen. `role="region"` with a name puts it back on the map;
    // `role="alert"` would be wrong, because a standing notice that interrupts
    // every page is a notice people learn to ignore.
    <div
      role="region"
      aria-label="Demonstration notice"
      className="border-b border-warning/30 bg-warning-soft"
    >
      <p className="mx-auto flex max-w-6xl items-start gap-2.5 px-4 py-2 text-sm text-ink sm:px-6">
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="mt-[0.2rem] size-4 shrink-0 fill-warning"
        >
          <path d="M10 1.7a1.4 1.4 0 0 1 1.22.71l7.4 13.2A1.4 1.4 0 0 1 17.4 17.7H2.6a1.4 1.4 0 0 1-1.22-2.09l7.4-13.2A1.4 1.4 0 0 1 10 1.7Zm0 4.6a.85.85 0 0 0-.85.9l.22 4.1a.63.63 0 0 0 1.26 0l.22-4.1a.85.85 0 0 0-.85-.9Zm0 7.1a.95.95 0 1 0 0 1.9.95.95 0 0 0 0-1.9Z" />
        </svg>
        <span>{variant === "long" ? DEMO_NOTICE_LONG : DEMO_NOTICE_SHORT}</span>
      </p>
    </div>
  );
}
