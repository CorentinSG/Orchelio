import type { ReactNode } from "react";

/**
 * Orchelio — shared presentation primitives.
 *
 * Deliberately small: cards, badges and callouts, built directly on the design
 * tokens in globals.css. Every later screen (dashboard widgets, matter list,
 * approval cards) composes these, so the product looks like one system rather
 * than a set of pages.
 */

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "ai";

const badgeTone: Record<Tone, string> = {
  neutral: "bg-surface-muted text-ink-muted border-line",
  brand: "bg-brand-soft text-brand border-brand/25",
  success: "bg-success-soft text-success border-success/25",
  warning: "bg-warning-soft text-warning border-warning/25",
  danger: "bg-danger-soft text-danger border-danger/25",
  ai: "bg-ai-soft text-ai border-ai/25",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeTone[tone]}`}
    >
      {children}
    </span>
  );
}

/** Small coloured dot used inside status rows and badges. */
export function StatusDot({ tone = "neutral" }: { tone?: Tone }) {
  const dot: Record<Tone, string> = {
    neutral: "bg-ink-subtle",
    brand: "bg-brand",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    ai: "bg-ai",
  };
  return <span aria-hidden className={`inline-block size-2 rounded-full ${dot[tone]}`} />;
}

/** Turns a card title into a stable element id, e.g. "Your permissions" -> "card-your-permissions". */
function titleId(title: ReactNode): string | undefined {
  if (typeof title !== "string") return undefined;
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug.length > 0 ? `card-${slug}` : undefined;
}

/**
 * A card is an accessible landmark: when its title is plain text, the section
 * is labelled by that title, so screen-reader users can navigate between cards
 * by name instead of hearing an undifferentiated run of content.
 */
export function Card({
  title,
  description,
  action,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const headingId = titleId(title);

  return (
    <section
      className="rounded-card border border-line bg-surface"
      {...(headingId ? { "aria-labelledby": headingId } : {})}
    >
      {title ? (
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id={headingId} className="font-semibold text-ink">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      {children ? <div className="px-5 py-4">{children}</div> : null}
    </section>
  );
}

const calloutTone: Record<Tone, string> = {
  neutral: "border-line bg-surface-muted text-ink",
  brand: "border-brand/30 bg-brand-soft text-ink",
  success: "border-success/30 bg-success-soft text-ink",
  warning: "border-warning/35 bg-warning-soft text-ink",
  danger: "border-danger/35 bg-danger-soft text-ink",
  ai: "border-ai/30 bg-ai-soft text-ink",
};

/**
 * Callout used for the demonstration warning and for error states.
 * `role="alert"` is reserved for genuine errors so screen readers are not
 * interrupted by the standing demo notice.
 */
export function Callout({
  tone = "neutral",
  title,
  children,
  assertive = false,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  assertive?: boolean;
}) {
  return (
    <div
      role={assertive ? "alert" : undefined}
      className={`rounded-card border px-4 py-3 text-sm ${calloutTone[tone]}`}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={title ? "mt-1 text-ink-muted" : "text-ink-muted"}>{children}</div> : null}
    </div>
  );
}

/** Key/value row used by the status panels. */
export function DataRow({
  label,
  value,
  hint,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-2.5 last:border-b-0">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">
        {value}
        {hint ? <span className="ml-2 font-normal text-ink-subtle">{hint}</span> : null}
      </dd>
    </div>
  );
}

/** Monospaced command the user can copy into a terminal. */
export function CommandLine({ children }: { children: ReactNode }) {
  return (
    <code className="rounded border border-line bg-surface-muted px-1.5 py-0.5 font-mono text-[0.8125rem] text-ink">
      {children}
    </code>
  );
}
