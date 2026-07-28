import Link from "next/link";

import { Badge, type Tone } from "@/components/ui";
import { MATTER_STATUSES } from "@/lib/constants";

/**
 * Orchelio — shared matter presentation.
 *
 * Two rules live here so that every screen obeys them without remembering to:
 * a value that is not known reads "Unknown" rather than being left blank, and a
 * date is never dressed up as a deadline the product has confirmed.
 */

/** Turns a stored status key into the words a lawyer would use. */
export function statusLabel(status: string): string {
  return status
    .split("_")
    .map((word, index) => (index === 0 ? word[0]?.toUpperCase() + word.slice(1) : word))
    .join(" ");
}

const STATUS_TONE: Record<string, Tone> = {
  lead: "neutral",
  conflict_review: "warning",
  consultation_scheduled: "brand",
  documents_requested: "warning",
  active: "success",
  attorney_review: "warning",
  waiting_for_client: "neutral",
  negotiation: "brand",
  ready_for_filing: "brand",
  closed: "neutral",
  internal_investigation: "warning",
  demand_preparation: "brand",
  eeoc_review: "warning",
  agency_charge: "warning",
  settlement_discussions: "brand",
  litigation_assessment: "warning",
  employer_response_pending: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{statusLabel(status)}</Badge>;
}

export const ALL_STATUSES = MATTER_STATUSES;

/**
 * A date, or "Unknown".
 *
 * ISO, deliberately: an unambiguous date matters more than a familiar one when
 * the reader may be in a different country from the person who typed it.
 */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "Unknown";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toISOString().slice(0, 10);
}

/**
 * How long ago, in words. Used for "last activity", never for a deadline.
 *
 * `now` is passed in rather than read here: every date on a page must be
 * measured from the same instant, and a component that reads the clock renders
 * differently each time it is called with the same props.
 */
export function relativeDays(value: Date | null | undefined, now: Date): string {
  if (!value) return "Unknown";
  const days = Math.round((now.getTime() - value.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.round(days / 30)} months ago`;
}

/**
 * A date the firm has recorded but nobody has confirmed.
 *
 * Rendered with the caveat attached, because Orchelio never calculates or
 * confirms a deadline — a locked rule, not a preference.
 */
export function UnconfirmedDate({ value, now }: { value: Date | null | undefined; now: Date }) {
  if (!value) return <span className="text-ink-subtle">None recorded</span>;

  const days = Math.round((value.getTime() - now.getTime()) / 86_400_000);
  const soon = days <= 14;

  return (
    <span className={soon ? "font-medium text-warning" : "text-ink"}>
      {formatDate(value)}
      <span className="ml-1 text-xs font-normal text-ink-subtle">
        ({days < 0 ? "passed" : `in ${days} days`} · not confirmed)
      </span>
    </span>
  );
}

export function MatterLink({
  id,
  reference,
  title,
}: {
  id: string;
  reference: string;
  title: string;
}) {
  return (
    <Link href={`/matters/${id}`} className="group block">
      <span className="font-mono text-xs text-ink-subtle">{reference}</span>
      <span className="block font-medium text-ink group-hover:text-brand">{title}</span>
    </Link>
  );
}

/** Human file size. Simulated in this environment, but formatted honestly. */
export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
