import { describe, expect, it } from "vitest";

import {
  EMPLOYMENT_FIELDS,
  IMMIGRATION_FIELDS,
  displayValue,
  editableFieldsFor,
  editableSectionsFor,
  fieldsFor,
  sanitiseFieldValues,
  sectionsFor,
} from "@/lib/matters/fields";
import {
  EMPLOYMENT_CATEGORIES,
  IMMIGRATION_CATEGORIES,
  categoriesFor,
  expectedButMissing,
  isKnownCategory,
} from "@/lib/matters/documents";

/**
 * `Matter.fields` is a JSON column, which is what makes one product serve two
 * practice areas — and also what would let a hand-crafted form post store
 * anything at all. These tests cover both sides of that trade.
 */

describe("fields belong to their practice area", () => {
  it("never offers immigration fields to an employment firm, or the reverse", () => {
    const immigration = fieldsFor("immigration").map((field) => field.key);
    const employment = fieldsFor("employment_law").map((field) => field.key);

    expect(immigration).toContain("status_expiration_date");
    expect(immigration).not.toContain("termination_date");
    expect(employment).toContain("termination_date");
    expect(employment).not.toContain("status_expiration_date");
    expect(immigration.filter((key) => employment.includes(key))).toEqual([]);
  });

  it("returns nothing for a practice area with no template", () => {
    expect(fieldsFor("family_law")).toEqual([]);
  });

  it("covers the fields the specification names", () => {
    const immigration = IMMIGRATION_FIELDS.map((field) => field.key);
    for (const key of [
      "current_status",
      "status_expiration_date",
      "nationality",
      "country_of_birth",
      "date_of_birth",
      "residence_permit_available",
      "last_entry_date",
      "last_entry_classification",
      "petitioner",
      "beneficiary",
      "employer",
      "prior_removals",
      "criminal_history_disclosed",
      "dependants",
    ]) {
      expect(immigration).toContain(key);
    }

    const employment = EMPLOYMENT_FIELDS.map((field) => field.key);
    for (const key of [
      "representation_side",
      "employer_name",
      "employee_name",
      "position",
      "employment_start_date",
      "employment_end_date",
      "salary_or_rate",
      "alleged_unpaid_hours",
      "exempt_status",
      "protected_characteristic_alleged",
      "complaint_date",
      "adverse_action",
      "termination_date",
      "witnesses",
      "damages_alleged",
      "agency_charge_filed",
      "right_to_sue_notice",
    ]) {
      expect(employment).toContain(key);
    }
  });

  it("hides fields that belong to another matter type", () => {
    // A petitioner makes sense on a family-based petition, not on an asylum claim.
    expect(fieldsFor("immigration", "family_based").map((f) => f.key)).toContain("petitioner");
    expect(fieldsFor("immigration", "asylum").map((f) => f.key)).not.toContain("petitioner");
  });

  it("groups fields into sections without losing any", () => {
    const sections = sectionsFor("employment_law");
    const flattened = sections.flatMap((section) => section.fields);

    expect(flattened).toHaveLength(fieldsFor("employment_law").length);
    expect(new Set(sections.map((section) => section.section)).size).toBe(sections.length);
  });
});

describe("fields a column already holds", () => {
  /**
   * The side an employment firm represents is a column on the matter, because
   * the matter list filters on it. It stays in the catalogue so every screen
   * knows to display it — but a form that also asked for it would let the
   * column and the JSON copy disagree, and then neither could be trusted.
   */
  it("is still part of the practice area's vocabulary", () => {
    expect(fieldsFor("employment_law").map((field) => field.key)).toContain("representation_side");
  });

  it("is not asked for a second time by a form", () => {
    expect(editableFieldsFor("employment_law").map((field) => field.key)).not.toContain(
      "representation_side",
    );
    // Nothing else was lost on the way.
    expect(editableFieldsFor("employment_law")).toHaveLength(
      fieldsFor("employment_law").length - 1,
    );
  });

  it("leaves its section out of a form once it is the section's only field", () => {
    const sections = editableSectionsFor("employment_law").map((section) => section.section);

    expect(sections).not.toContain("Représentation");
    expect(sectionsFor("employment_law").map((section) => section.section)).toContain(
      "Représentation",
    );
  });

  it("is never copied into the JSON blob, even when posted", () => {
    const cleaned = sanitiseFieldValues("employment_law", "unpaid_wages", {
      representation_side: "employer",
      position: "Warehouse operative",
    });

    expect(cleaned).toEqual({ position: "Warehouse operative" });
  });

  it("does not affect a practice area that has no such field", () => {
    expect(editableFieldsFor("immigration")).toHaveLength(fieldsFor("immigration").length);
  });
});

describe("sanitising submitted values", () => {
  it("drops a key that is not a field of this area", () => {
    const cleaned = sanitiseFieldValues("immigration", "family_based", {
      nationality: "Mexican",
      // From the employment form, or invented outright.
      termination_date: "2026-01-01",
      isAdmin: "true",
    });

    expect(cleaned).toEqual({ nationality: "Mexican" });
  });

  it("refuses a select value that was never offered", () => {
    const cleaned = sanitiseFieldValues("immigration", "family_based", {
      current_status: "definitely_a_citizen",
    });

    expect(cleaned["current_status"]).toBeUndefined();
  });

  it("keeps a select value that was offered", () => {
    expect(
      sanitiseFieldValues("immigration", "family_based", { current_status: "passeport_talent" }),
    ).toEqual({
      current_status: "passeport_talent",
    });
  });

  it("normalises booleans and numbers", () => {
    const cleaned = sanitiseFieldValues("immigration", "family_based", {
      residence_permit_available: "true",
      prior_removals: "false",
      dependants: "2",
    });

    expect(cleaned).toEqual({ residence_permit_available: true, prior_removals: false, dependants: 2 });
  });

  it("drops an empty value rather than storing a blank", () => {
    // "Unknown" is the absence of a value, not an empty string pretending to be one.
    expect(sanitiseFieldValues("immigration", "family_based", { nationality: "  " })).toEqual({});
  });

  it("caps free text so one field cannot become a document store", () => {
    const cleaned = sanitiseFieldValues("immigration", "family_based", {
      immigration_objective: "x".repeat(5000),
    });

    expect(String(cleaned["immigration_objective"]).length).toBe(2000);
  });
});

describe("displaying values", () => {
  const status = IMMIGRATION_FIELDS.find((field) => field.key === "current_status")!;
  const permit = IMMIGRATION_FIELDS.find((field) => field.key === "residence_permit_available")!;

  it("says Unknown rather than leaving a blank", () => {
    for (const missing of [undefined, null, ""]) {
      expect(displayValue(status, missing)).toBe("Inconnu");
    }
  });

  it("shows the option label, not the stored key", () => {
    expect(displayValue(status, "passeport_talent")).toBe("Passeport talent");
  });

  it("shows booleans as words", () => {
    expect(displayValue(permit, true)).toBe("Oui");
    expect(displayValue(permit, false)).toBe("Non");
  });
});

describe("document categories", () => {
  it("gives each practice area its own filing cabinet", () => {
    const immigration = IMMIGRATION_CATEGORIES.map((c) => c.key);
    const employment = EMPLOYMENT_CATEGORIES.map((c) => c.key);

    expect(immigration).toContain("residence_permit");
    expect(employment).toContain("pay_stub");
    expect(immigration).not.toContain("pay_stub");
    expect(employment).not.toContain("residence_permit");
  });

  it("recognises only its own categories", () => {
    expect(isKnownCategory("immigration", "passport")).toBe(true);
    expect(isKnownCategory("immigration", "pay_stub")).toBe(false);
    expect(isKnownCategory("employment_law", "pay_stub")).toBe(true);
  });

  it("falls back to a single generic category for an area with no template", () => {
    expect(categoriesFor("family_law").map((c) => c.key)).toEqual(["other"]);
  });
});

describe("expected documents", () => {
  it("lists what a matter of this type usually needs and does not have", () => {
    const missing = expectedButMissing("immigration", "family_based", ["passport"]).map(
      (category) => category.key,
    );

    expect(missing).toContain("residence_permit");
    expect(missing).toContain("marriage_certificate");
    expect(missing).not.toContain("passport");
  });

  it("does not expect a document that belongs to a different matter type", () => {
    const missing = expectedButMissing("immigration", "asylum", []).map((c) => c.key);

    // A marriage certificate is expected on a family-based petition, not here.
    expect(missing).not.toContain("marriage_certificate");
    expect(missing).toContain("passport");
  });

  it("returns nothing when everything expected is on file", () => {
    const everything = ["employment_agreement", "pay_stub", "time_record"];

    expect(expectedButMissing("employment_law", "unpaid_wages", everything)).toEqual([]);
  });

  it("never treats an optional category as missing", () => {
    const missing = expectedButMissing("employment_law", "unpaid_wages", [
      "employment_agreement",
      "pay_stub",
      "time_record",
    ]);

    expect(missing.every((category) => category.expectedFor)).toBe(true);
  });
});
