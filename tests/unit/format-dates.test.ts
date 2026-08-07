import { describe, expect, it } from "vitest";

import {
  FALLBACK_TIMEZONE,
  calendarDayIn,
  daysBetween,
  firmTimezone,
  formatDate,
  formatMoment,
  timezoneLabel,
  timezoneNotice,
} from "@/lib/format/dates";

/**
 * Orchelio — dates in the firm's own zone.
 *
 * Every case here is one where UTC and the firm's zone disagree, because that
 * is the only situation in which any of this matters. A test that formatted
 * midday would pass whatever the code did.
 */

const PACIFIC = "America/Los_Angeles";
const EASTERN = "America/New_York";

/** 2026-07-30 at 18:30 Pacific — which is already the 31st in UTC. */
const EVENING_IN_PACIFIC = new Date("2026-07-31T01:30:00Z");

describe("choosing a zone", () => {
  it("takes one Orchelio offers", () => {
    expect(firmTimezone(PACIFIC)).toBe(PACIFIC);
    expect(firmTimezone(EASTERN)).toBe(EASTERN);
  });

  it("falls back to UTC rather than to the server's zone", () => {
    // A date that changes meaning when the deployment moves is worse than one
    // that is merely unfamiliar.
    expect(firmTimezone(null)).toBe("UTC");
    expect(firmTimezone(undefined)).toBe("UTC");
    expect(firmTimezone("")).toBe("UTC");
    expect(FALLBACK_TIMEZONE).toBe("UTC");
  });

  it("refuses a value the platform cannot resolve", () => {
    expect(firmTimezone("Mars/Olympus_Mons")).toBe("UTC");
    expect(firmTimezone("not a zone")).toBe("UTC");
  });

  it("accepts a real zone Orchelio does not offer", () => {
    // A firm's stored value may predate the list, and refusing it would lose a
    // correct answer for the sake of a menu.
    expect(firmTimezone("Europe/Paris")).toBe("Europe/Paris");
  });
});

describe("naming the day", () => {
  it("names the firm's day, not the UTC one", () => {
    // The defect this module exists for: an evening in Los Angeles is already
    // tomorrow in UTC, and every screen said tomorrow.
    expect(calendarDayIn(EVENING_IN_PACIFIC, "UTC")).toBe("2026-07-31");
    expect(calendarDayIn(EVENING_IN_PACIFIC, PACIFIC)).toBe("2026-07-30");
  });

  it("stays ISO-ordered whichever zone is chosen", () => {
    for (const zone of ["UTC", PACIFIC, EASTERN, "Europe/Paris"]) {
      expect(calendarDayIn(EVENING_IN_PACIFIC, zone), zone).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("formats a date, a string or nothing", () => {
    expect(formatDate(EVENING_IN_PACIFIC, PACIFIC)).toBe("2026-07-30");
    expect(formatDate("2026-07-31T01:30:00Z", PACIFIC)).toBe("2026-07-30");
    expect(formatDate(null, PACIFIC)).toBe("Inconnue");
    expect(formatDate(undefined, PACIFIC)).toBe("Inconnue");
    expect(formatDate("not a date", PACIFIC)).toBe("Inconnue");
  });

  it("has no default zone, so no call site can forget one", () => {
    // Deliberately a type-level guarantee rather than a runtime one. A default
    // of UTC would have let every existing call site keep compiling unchanged,
    // which is exactly how the setting came to be ignored in the first place.
    // Making the argument required turned the compiler into the audit: it named
    // all twenty-four places a date is rendered.
    expect(formatDate.length).toBe(2);
  });
});

describe("naming the moment", () => {
  it("gives the time of day in the firm's zone, on a 24-hour clock", () => {
    expect(formatMoment(EVENING_IN_PACIFIC, PACIFIC)).toBe("2026-07-30 18:30:00");
    expect(formatMoment(EVENING_IN_PACIFIC, "UTC")).toBe("2026-07-31 01:30:00");
  });

  it("says Unknown rather than inventing a time", () => {
    expect(formatMoment(null, PACIFIC)).toBe("Inconnue");
  });
});

describe("counting days", () => {
  const from = new Date("2026-07-30T23:00:00Z");

  it("counts calendar days, not multiples of twenty-four hours", () => {
    // Two hours later in UTC terms, but the next day on the calendar. The old
    // arithmetic called this zero days away, which is the wrong answer for
    // somebody reading a deadline.
    const to = new Date("2026-07-31T01:00:00Z");
    expect(daysBetween(from, to, "UTC")).toBe(1);
  });

  it("counts in the firm's zone", () => {
    // 2026-07-30 16:00 and 18:00 Pacific — the same day there, different days
    // in UTC.
    const to = new Date("2026-07-31T01:00:00Z");
    expect(daysBetween(from, to, PACIFIC)).toBe(0);
  });

  it("is negative for something already past", () => {
    expect(daysBetween(from, new Date("2026-07-28T12:00:00Z"), "UTC")).toBe(-2);
  });

  it("is not thrown off by a daylight-saving change", () => {
    // The clocks go back in the United States on 2026-11-01, so one of these
    // days is twenty-five hours long. Counted as calendar days it is still
    // three days.
    const before = new Date("2026-10-30T12:00:00Z");
    const after = new Date("2026-11-02T12:00:00Z");
    expect(daysBetween(before, after, PACIFIC)).toBe(3);
  });
});

describe("telling the reader which zone they are looking at", () => {
  it("labels the zones Orchelio offers in the firm's words", () => {
    expect(timezoneLabel(PACIFIC)).toBe("Pacific (Los Angeles)");
    expect(timezoneLabel(EASTERN)).toBe("Eastern (New York)");
  });

  it("falls back to the identifier rather than to nothing", () => {
    expect(timezoneLabel("Europe/Paris")).toBe("Europe/Paris");
  });

  it("writes a sentence for somebody who did not choose the setting", () => {
    expect(timezoneNotice(PACIFIC)).toBe("Dates and times are shown in Pacific (Los Angeles).");
  });
});
