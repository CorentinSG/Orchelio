import { APP_EDITION, APP_NAME, APP_TAGLINE } from "@/lib/app-config";

/**
 * Orchelio wordmark.
 *
 * Drawn in SVG rather than loaded as an image so it stays crisp, themable and
 * dependency-free. The mark is three stacked bars — the orchestration idea —
 * inside a rounded square.
 */
export function OrchelioMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label={`${APP_NAME} logo`}
      className="shrink-0"
    >
      <rect width="32" height="32" rx="8" className="fill-brand" />
      <g className="fill-brand-ink">
        <rect x="8" y="9" width="16" height="3" rx="1.5" />
        <rect x="8" y="14.5" width="11" height="3" rx="1.5" opacity="0.75" />
        <rect x="8" y="20" width="6" height="3" rx="1.5" opacity="0.5" />
      </g>
    </svg>
  );
}

type WordmarkProps = {
  /** Second line, e.g. the current firm name. Absent on the public pages. */
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  /** Shows the "Demo" edition chip next to the product name. */
  showEdition?: boolean;
  /**
   * A small mark rendered beside the subtitle — the open firm's accent colour.
   * It sits next to the *firm's* name, never next to the product's: a firm
   * brands itself inside Orchelio, not the software it is using.
   */
  mark?: React.ReactNode;
};

/**
 * Product lock-up: mark + "Orchelio" + optional edition chip + optional
 * subtitle. In the firm workspace the subtitle carries the firm name, which is
 * how a user always knows which tenant is open.
 */
export function OrchelioWordmark({
  subtitle,
  size = "md",
  showEdition = true,
  mark,
}: WordmarkProps) {
  const markSize = size === "lg" ? 40 : size === "sm" ? 26 : 32;
  const nameClass =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";

  return (
    <div className="flex items-center gap-3">
      <OrchelioMark size={markSize} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`${nameClass} font-semibold tracking-tight text-ink`}>{APP_NAME}</span>
          {showEdition && APP_EDITION ? (
            <span className="rounded border border-line px-1.5 py-px text-[0.6875rem] font-medium uppercase tracking-wide text-ink-muted">
              {APP_EDITION}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="flex items-center gap-1.5 text-sm text-ink-muted">
            {mark}
            <span className="truncate">{subtitle}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function OrchelioTagline() {
  return (
    <p className="text-ink-muted">
      {APP_NAME} — {APP_TAGLINE}
    </p>
  );
}
