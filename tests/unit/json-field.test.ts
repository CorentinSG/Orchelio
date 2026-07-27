import { describe, expect, it } from "vitest";

import { parseJsonObject, parseStringArray, toJsonColumn } from "@/lib/json-field";

/**
 * These columns hold firm configuration and AI results. Malformed content must
 * degrade to a documented default, never throw inside a page render.
 */
describe("JSON columns", () => {
  it("parses an object column", () => {
    expect(parseJsonObject('{"legalAnalysis":true}')).toEqual({ legalAnalysis: true });
  });

  it("falls back when the column is empty, malformed or not an object", () => {
    for (const raw of [null, undefined, "", "not json", "[1,2]", '"text"', "42"]) {
      expect(parseJsonObject(raw)).toEqual({});
    }
    expect(parseJsonObject(null, { legalAnalysis: true })).toEqual({ legalAnalysis: true });
  });

  it("parses a string array column", () => {
    expect(parseStringArray('["immigration","employment_law"]')).toEqual([
      "immigration",
      "employment_law",
    ]);
  });

  it("drops non-string entries rather than returning them", () => {
    expect(parseStringArray('["immigration",42,null,{"a":1},"asylum"]')).toEqual([
      "immigration",
      "asylum",
    ]);
  });

  it("falls back to an empty array for anything unusable", () => {
    for (const raw of [null, undefined, "", "not json", '{"a":1}']) {
      expect(parseStringArray(raw)).toEqual([]);
    }
  });

  it("round-trips through serialisation", () => {
    const value = { matterTypes: ["family_based"], approvals: { legalAnalysis: true } };

    expect(parseJsonObject(toJsonColumn(value))).toEqual(value);
  });
});
