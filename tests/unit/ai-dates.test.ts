import { describe, expect, it } from "vitest";

import {
  formatWritten,
  isoDateWithin,
  parseIsoDate,
  parseWrittenDate,
  readDate,
} from "@/lib/ai/dates";

/**
 * Orchelio — reading dates.
 *
 * A date parser that guesses turns a clean file into a false contradiction,
 * which wastes more of a lawyer's time than finding nothing would have. These
 * tests are mostly about what the parser refuses.
 */

describe("ISO dates", () => {
  it("accepts a real date", () => {
    expect(parseIsoDate("2024-03-04")).toBe("2024-03-04");
    expect(parseIsoDate("  2024-03-04  ")).toBe("2024-03-04");
  });

  it("refuses a day that does not exist", () => {
    // `new Date("2024-02-31")` silently becomes 2 March. A date that quietly
    // becomes a different date is the bug this module exists to avoid.
    expect(parseIsoDate("2024-02-31")).toBeNull();
    expect(parseIsoDate("2023-02-29")).toBeNull();
    expect(parseIsoDate("2024-13-01")).toBeNull();
    expect(parseIsoDate("2024-00-10")).toBeNull();
  });

  it("accepts a leap day in a leap year", () => {
    expect(parseIsoDate("2024-02-29")).toBe("2024-02-29");
  });

  it("refuses anything that is not exactly a date", () => {
    for (const value of ["04/03/2024", "2024-3-4", "March 2024", "", "  ", null, undefined, 20240304]) {
      expect(parseIsoDate(value)).toBeNull();
    }
  });
});

describe("dates as a person writes them", () => {
  it("reads day-first and month-first", () => {
    expect(parseWrittenDate("11 February 2024")).toBe("2024-02-11");
    expect(parseWrittenDate("February 11, 2024")).toBe("2024-02-11");
    expect(parseWrittenDate("Client entered on 4 March 2024 at JFK")).toBe("2024-03-04");
  });

  it("is not confused by case or punctuation", () => {
    expect(parseWrittenDate("11 FEBRUARY 2024")).toBe("2024-02-11");
    expect(parseWrittenDate("february 11, 2024")).toBe("2024-02-11");
  });

  it("refuses an all-numeric date, on purpose", () => {
    // 11/02/2024 is 11 February in London and 2 November in New York, and this
    // product is used by immigration lawyers who will see both. Guessing wrong
    // invents a contradiction that is not there.
    expect(parseWrittenDate("11/02/2024")).toBeNull();
    expect(parseWrittenDate("11-02-2024")).toBeNull();
  });

  it("refuses a month that is not a month", () => {
    expect(parseWrittenDate("11 Smarch 2024")).toBeNull();
    expect(parseWrittenDate("32 January 2024")).toBeNull();
  });
});

describe("dates inside a filename", () => {
  it("finds one", () => {
    expect(isoDateWithin("i94-moreau-entry-2024-03-04.pdf")).toBe("2024-03-04");
    expect(isoDateWithin("internal-complaint-2026-04-28.pdf")).toBe("2026-04-28");
  });

  it("finds none when there is none", () => {
    expect(isoDateWithin("passport-moreau.pdf")).toBeNull();
    expect(isoDateWithin("pay-stubs-2025-q4.pdf")).toBeNull();
  });

  it("ignores a number that only looks like a date", () => {
    expect(isoDateWithin("scan-9999-99-99.pdf")).toBeNull();
  });
});

describe("reading either form", () => {
  it("takes ISO or written", () => {
    expect(readDate("2024-02-11")).toBe("2024-02-11");
    expect(readDate("11 February 2024")).toBe("2024-02-11");
    expect(readDate("no date here")).toBeNull();
  });

  it("agrees with itself across forms — which is what makes a match a match", () => {
    expect(readDate("11 February 2024")).toBe(readDate("2024-02-11"));
    expect(readDate("4 March 2024")).not.toBe(readDate("2024-02-11"));
  });
});

describe("writing a date back out", () => {
  it("is unambiguous in any country", () => {
    expect(formatWritten("2024-03-04")).toBe("4 mars 2024");
    expect(formatWritten("2026-06-19")).toBe("19 juin 2026");
  });

  it("leaves something it cannot read alone", () => {
    expect(formatWritten("not a date")).toBe("not a date");
  });
});
