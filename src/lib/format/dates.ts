import { TIMEZONES } from "@/lib/onboarding/catalogue";

/**
 * Orchelio — dates and times, in the firm's own zone.
 *
 * The onboarding questionnaire asks a firm which time zone it works in and
 * offers four real answers. Until this module existed, nothing read the reply:
 * every date on every screen was the UTC calendar date, so a decision recorded
 * at half past six on a Tuesday evening in Los Angeles appeared as Wednesday,
 * and nothing on the page said why. A configurable product whose configuration
 * changes nothing is the one failure this codebase cannot afford twice.
 *
 * Two rules hold everything here together.
 *
 * **The zone is passed in, never read here.** Same argument as `now`: a
 * function that reaches for ambient state renders differently on two calls with
 * identical arguments, and there is no way to test what it will say. The firm's
 * zone comes from the page, which has the configuration in hand.
 *
 * **The format stays ISO-ordered.** Year-month-day, because the reader may be
 * in a different country from the person who typed it and 03/04 is two
 * different days depending on who is looking. What changes is *which* day is
 * named, not how it is written.
 *
 * ## What this does not fix
 *
 * A legal deadline is a calendar date in a jurisdiction — "the 15th", whoever
 * is reading. Orchelio stores an instant, because every date in this build
 * comes from a clock rather than from somebody typing one. Rendering that
 * instant in the firm's zone is the closest available answer and it is right
 * for every value this build actually holds, but a product that let a person
 * type a deadline would need the schema to say "this is a day, not a moment".
 * Named in `docs/PRODUCTION_READINESS.md` rather than left for somebody to
 * discover.
 */

/** Used when a firm has no configuration yet, or stored something unusable. */
export const FALLBACK_TIMEZONE = "UTC";

const KNOWN_ZONES = new Set<string>(TIMEZONES.map((zone) => zone.value));

/**
 * The zone to render in.
 *
 * Falls back to UTC rather than to the server's zone. A server's zone is an
 * accident of where the process happens to run, and a date that changes meaning
 * when the deployment moves is worse than one that is merely unfamiliar.
 */
export function firmTimezone(timezone: string | null | undefined): string {
  if (!timezone) return FALLBACK_TIMEZONE;
  if (KNOWN_ZONES.has(timezone)) return timezone;

  // Not one Orchelio offers, but a firm's stored value may predate the list.
  // Trusted only if the platform can actually resolve it.
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
    return timezone;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

/** How the firm's zone is named on screen, e.g. "Pacific (Los Angeles)". */
export function timezoneLabel(timezone: string): string {
  return TIMEZONES.find((zone) => zone.value === timezone)?.label ?? timezone;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Which calendar day an instant falls on, in a given zone, as `YYYY-MM-DD`.
 *
 * `en-CA` because its short date format *is* ISO order, so no reassembly from
 * parts is needed and no locale surprise can reorder it.
 */
export function calendarDayIn(value: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

/**
 * A date in the firm's zone, written out — « 30 juillet 2026 » — or « Inconnue ».
 *
 * Written rather than numeric because the glossary commits to it: a numeric
 * date is ambiguous between conventions, and a screen read by a lawyer should
 * not require knowing which one the product chose. The activity log is the one
 * deliberate exception (see `formatMoment`).
 */
export function formatDate(
  value: Date | string | null | undefined,
  timezone: string,
): string {
  const date = toDate(value);
  if (!date) return "Inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: timezone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * A date and the time of day, in the firm's zone.
 *
 * Used only where the time of day is part of what happened — the activity log,
 * where two entries a minute apart are the point. Everywhere else the day is
 * the whole answer, and a timestamp is noise that makes a screen harder to
 * read.
 *
 * Deliberately the technical `YYYY-MM-DD HH:MM:SS` form rather than the
 * written date every other screen uses: a ledger is scanned and compared, not
 * read aloud, and a fixed-width timestamp is what makes two entries a minute
 * apart visibly a minute apart. The glossary records this exception.
 */
export function formatMoment(
  value: Date | string | null | undefined,
  timezone: string,
): string {
  const date = toDate(value);
  if (!date) return "Inconnue";

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);

  return `${calendarDayIn(date, timezone)} ${time}`;
}

/**
 * Whole days between two instants, counted as calendar days in the firm's zone.
 *
 * Not `(a - b) / 86_400_000`. Elapsed milliseconds answer a different question:
 * something twenty-three hours away is "in 0 days" by that measure even when it
 * falls tomorrow, and the reader of a deadline wants to know which day it lands
 * on, not how many multiples of twenty-four hours are left.
 */
export function daysBetween(from: Date, to: Date, timezone: string): number {
  const day = (value: Date) => Date.parse(`${calendarDayIn(value, timezone)}T00:00:00Z`);
  return Math.round((day(to) - day(from)) / 86_400_000);
}

/**
 * The sentence a screen shows so nobody has to guess which zone a date is in.
 *
 * Written for a reader who did not choose the setting and may not know it
 * exists.
 */
export function timezoneNotice(timezone: string): string {
  return `Les dates et heures sont affichées en ${timezoneLabel(timezone)}.`;
}
