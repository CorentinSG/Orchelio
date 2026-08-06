import Link from "next/link";

import { Badge, type Tone } from "@/components/ui";
import { daysBetween, formatDate } from "@/lib/format/dates";
import { MATTER_STATUSES } from "@/lib/constants";

/**
 * Orchelio — shared matter presentation.
 *
 * Two rules live here so that every screen obeys them without remembering to:
 * a value that is not known reads "Unknown" rather than being left blank, and a
 * date is never dressed up as a deadline the product has confirmed.
 */

/** Turns a stored status key into the words a French lawyer would use. */
const STATUS_LABELS: Record<string, string> = {
  lead: "Premier contact",
  conflict_review: "Vérification des conflits",
  consultation_scheduled: "Consultation programmée",
  documents_requested: "Documents demandés",
  active: "Actif",
  attorney_review: "Relecture par l’avocat",
  waiting_for_client: "En attente du client",
  negotiation: "Négociation",
  ready_for_filing: "Prêt au dépôt",
  closed: "Clos",
  internal_investigation: "Enquête interne",
  demand_preparation: "Préparation de la demande",
  eeoc_review: "Examen EEOC",
  agency_charge: "Plainte à l’agence",
  settlement_discussions: "Discussions de transaction",
  litigation_assessment: "Évaluation du contentieux",
  employer_response_pending: "Réponse de l’employeur attendue",
};

export function statusLabel(status: string): string {
  // A key with no entry keeps its raw form: visibly wrong beats silently
  // invented, and the unit test walks every known status.
  return STATUS_LABELS[status] ?? status;
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
 * ISO order, deliberately: an unambiguous date matters more than a familiar one
 * when the reader may be in a different country from the person who typed it.
 * *Which* day it names comes from the firm's chosen zone — see
 * `src/lib/format/dates.ts` for why that had to stop being UTC.
 */
export { formatDate } from "@/lib/format/dates";

/**
 * How long ago, in words. Used for "last activity", never for a deadline.
 *
 * `now` and `timezone` are both passed in rather than read here: every date on
 * a page must be measured from the same instant and named in the same zone, and
 * a component that reaches for either renders differently each time it is
 * called with the same props.
 */
export function relativeDays(value: Date | null | undefined, now: Date, timezone: string): string {
  if (!value) return "Inconnu";
  const days = daysBetween(value, now, timezone);
  if (days <= 0) return "aujourd’hui";
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} jours`;
  return `il y a ${Math.round(days / 30)} mois`;
}

/**
 * A date the firm has recorded but nobody has confirmed.
 *
 * Rendered with the caveat attached, because Orchelio never calculates or
 * confirms a deadline — a locked rule, not a preference.
 */
export function UnconfirmedDate({
  value,
  now,
  timezone,
}: {
  value: Date | null | undefined;
  now: Date;
  timezone: string;
}) {
  if (!value) return <span className="text-ink-subtle">Aucune enregistrée</span>;

  // Counted in the firm's calendar days. An instant twenty-three hours away
  // falls tomorrow, and "in 0 days" is the wrong answer for somebody reading a
  // date nobody has confirmed.
  const days = daysBetween(now, value, timezone);
  const soon = days <= 14;

  return (
    <span className={soon ? "font-medium text-warning" : "text-ink"}>
      {formatDate(value, timezone)}
      <span className="ml-1 text-xs font-normal text-ink-subtle">
        ({days < 0 ? "passée" : `dans ${days} jours`} · non confirmée)
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
