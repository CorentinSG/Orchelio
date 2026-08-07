/**
 * Orchelio — reading dates out of a file.
 *
 * A contradiction in a legal file is very often two dates that should be the
 * same and are not. Finding those means reading dates from three places that
 * format them differently:
 *
 *  * a matter field, always ISO because a date input produced it;
 *  * a document filename, where a date is a naming convention
 *    (`i94-moreau-entry-2024-03-04.pdf`);
 *  * a client's own words at intake ("11 February 2024").
 *
 * Everything here is deliberately strict. A parser that guesses turns a clean
 * file into a false contradiction, which costs a lawyer more time than finding
 * nothing would have.
 */

// Read in both languages: the fictional intake answers predate the French
// switch, and a client may write either. Written dates come out in French —
// the product's language — via WRITTEN_MONTHS below.
const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  janvier: 1,
  février: 2,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  août: 8,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  décembre: 12,
  decembre: 12,
};

/** How a month is written out, in the product's language. */
const WRITTEN_MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

/** An ISO date, or null. Rejects anything that is not exactly YYYY-MM-DD. */
export function parseIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return isRealDate(match[1]!, match[2]!, match[3]!) ? value.trim() : null;
}

/**
 * A date written the way a person writes one: "11 February 2024",
 * "February 11, 2024", "11/02/2024" is **not** accepted.
 *
 * The numeric form is refused on purpose. `11/02/2024` is 11 February in
 * London and 2 November in New York, and a product used by immigration lawyers
 * will see both. Guessing wrong invents a contradiction that is not there.
 */
export function parseWrittenDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim().toLowerCase().replace(/,/g, " ");

  // "11 february 2024"
  const dayFirst = /(?:^|\s)(\d{1,2})\s+([a-zà-ÿ]+)\s+(\d{4})(?:\s|$)/.exec(text);
  if (dayFirst) {
    const month = MONTHS[dayFirst[2]!];
    if (month) return build(dayFirst[3]!, month, Number(dayFirst[1]!));
  }

  // "february 11 2024"
  const monthFirst = /(?:^|\s)([a-zà-ÿ]+)\s+(\d{1,2})\s+(\d{4})(?:\s|$)/.exec(text);
  if (monthFirst) {
    const month = MONTHS[monthFirst[1]!];
    if (month) return build(monthFirst[3]!, month, Number(monthFirst[2]!));
  }

  return null;
}

/** An ISO date embedded anywhere in a string, e.g. a filename. */
export function isoDateWithin(value: string): string | null {
  const match = /(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return isRealDate(match[1]!, match[2]!, match[3]!)
    ? `${match[1]}-${match[2]}-${match[3]}`
    : null;
}

/** Any of the accepted forms. */
export function readDate(value: unknown): string | null {
  return parseIsoDate(value) ?? parseWrittenDate(value);
}

/** "2024-03-04" → "4 March 2024". Unambiguous in any country. */
export function formatWritten(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return iso;
  const [year, month, day] = parsed.split("-") as [string, string, string];
  const name = WRITTEN_MONTHS[Number(month) - 1] ?? month;
  // French date convention: the month is not capitalised.
  return `${Number(day)} ${name} ${year}`;
}

function build(year: string, month: number, day: number): string | null {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return isRealDate(year, mm, dd) ? `${year}-${mm}-${dd}` : null;
}

/**
 * Whether these parts name a day that exists.
 *
 * `new Date("2024-02-31")` does not throw — it rolls forward to 2 March. A
 * date that quietly becomes a different date is exactly the bug this module
 * exists to avoid, so the parts are compared back after construction.
 */
function isRealDate(year: string, month: string, day: string): boolean {
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day)
  );
}
