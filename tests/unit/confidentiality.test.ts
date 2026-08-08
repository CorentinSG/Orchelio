import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CLASS_DEFINITIONS,
  CONFIDENTIALITY_CLASSES,
  ENFORCEMENT,
  classify,
  clientMaterialModels,
  isClientMaterial,
  modelsInClass,
  sensitivity,
  MODEL_CLASSIFICATION,
} from "@/lib/confidentiality/classification";
import { FIRM_SCOPED_MODELS, PLATFORM_MODELS } from "@/lib/data/firm-scope";

/**
 * Orchelio — the confidentiality classification.
 *
 * Two things are worth testing here and one is not obvious. The obvious one is
 * completeness: every model in the schema must have a class, and the source of
 * truth for "every model" is the schema file rather than a list somebody
 * maintains.
 *
 * The other is that this classification and the firm-scoping classification
 * must agree. They answer different questions — "who may read it" and "must a
 * query name a firm" — but a model that holds client material and is not
 * firm-scoped would be a contradiction between two files that each look right
 * on their own.
 */

const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");
const modelsInSchema = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((match) => match[1]!);

describe("completeness", () => {
  it("finds the models in the schema, or the rest of this file proves nothing", () => {
    expect(modelsInSchema.length).toBeGreaterThan(15);
    expect(modelsInSchema).toContain("Matter");
    expect(modelsInSchema).toContain("Document");
  });

  it("classifies every model in the schema", () => {
    for (const model of modelsInSchema) {
      expect(classify(model), `${model} has no confidentiality class`).not.toBeNull();
    }
  });

  it("classifies nothing that is not in the schema", () => {
    for (const model of Object.keys(MODEL_CLASSIFICATION)) {
      expect(modelsInSchema, `${model} is classified but does not exist`).toContain(model);
    }
  });

  it("uses only the declared classes", () => {
    for (const [model, key] of Object.entries(MODEL_CLASSIFICATION)) {
      expect(CONFIDENTIALITY_CLASSES, `${model}`).toContain(key);
    }
  });

  it("defines every declared class exactly once", () => {
    expect(CLASS_DEFINITIONS.map((definition) => definition.key)).toEqual([
      ...CONFIDENTIALITY_CLASSES,
    ]);
  });
});

describe("the two classifications agree", () => {
  it("makes every client-confidential and privileged model firm-scoped", () => {
    // A record that holds client material and can be read without naming a
    // firm would be a hole that neither file, read alone, would show.
    for (const model of clientMaterialModels()) {
      expect(FIRM_SCOPED_MODELS.has(model), `${model} holds client material but is not firm-scoped`).toBe(
        true,
      );
    }
  });

  it("classifies every platform-wide model as platform or identity", () => {
    for (const model of PLATFORM_MODELS) {
      const key = classify(model);
      // `Firm` is the exception and a deliberate one: the record naming a
      // tenant is not scoped to itself, but it is the firm's own data.
      const expected = model === "Firm" ? ["firm_internal"] : ["platform", "identity"];
      expect(expected, `${model} is ${key}`).toContain(key);
    }
  });

  it("never treats a firm-scoped model as a shared catalogue", () => {
    for (const model of FIRM_SCOPED_MODELS) {
      expect(classify(model), `${model}`).not.toBe("platform");
    }
  });
});

describe("the ordering carries meaning", () => {
  it("ranks the classes from least to most sensitive", () => {
    expect(sensitivity("platform")).toBeLessThan(sensitivity("identity"));
    expect(sensitivity("firm_internal")).toBeLessThan(sensitivity("client_confidential"));
    expect(sensitivity("client_confidential")).toBeLessThan(sensitivity("privileged"));
  });

  it("treats exactly the top two classes as client material", () => {
    expect(isClientMaterial("client_confidential")).toBe(true);
    expect(isClientMaterial("privileged")).toBe(true);
    expect(isClientMaterial("firm_internal")).toBe(false);
    expect(isClientMaterial("identity")).toBe(false);
    expect(isClientMaterial("platform")).toBe(false);
  });

  it("says a platform operator may read exactly what is not client material", () => {
    for (const definition of CLASS_DEFINITIONS) {
      expect(definition.operatorMayRead, definition.key).toBe(!isClientMaterial(definition.key));
    }
  });

  it("lets nothing leave the machine, in any class", () => {
    // The day this stops being true, it should be a deliberate edit to one
    // field and a failing test — not a quiet change of practice.
    for (const definition of CLASS_DEFINITIONS) {
      expect(definition.mayLeaveTheMachine, definition.key).toBe(false);
    }
  });
});

describe("the classification is usable", () => {
  it("puts the substance of the legal work in privileged", () => {
    for (const model of ["Document", "IntakeResponse", "AIAnalysis", "DraftCommunication"]) {
      expect(classify(model), model).toBe("privileged");
    }
  });

  it("puts the activity log in client-confidential, not firm-internal", () => {
    // Who opened which matter, and when, describes the firm's clients even
    // though it holds none of their words.
    expect(classify("AuditEvent")).toBe("client_confidential");
  });

  it("leaves no class empty", () => {
    for (const key of CONFIDENTIALITY_CLASSES) {
      expect(modelsInClass(key).length, `${key} has no models`).toBeGreaterThan(0);
    }
  });
});

describe("the enforcement register", () => {
  it("says, for every promise, what makes it true or that nothing does", () => {
    expect(ENFORCEMENT.length).toBeGreaterThan(4);
    for (const entry of ENFORCEMENT) {
      expect(entry.rule.length).toBeGreaterThan(20);
      expect(entry.limitation.length, entry.rule).toBeGreaterThan(20);
    }
  });

  it("admits at least one promise that nothing enforces", () => {
    // A register in which everything is already enforced is a register that
    // has stopped being read. Encryption at rest is the honest example.
    const unenforced = ENFORCEMENT.filter((entry) => entry.enforcedBy === null);
    expect(unenforced.length).toBeGreaterThan(0);
    expect(unenforced.some((entry) => /chiffr/i.test(entry.rule))).toBe(true);
  });

  it("points every enforced promise at something a reader can open", () => {
    for (const entry of ENFORCEMENT) {
      if (entry.enforcedBy === null) continue;
      expect(entry.enforcedBy, entry.rule).toMatch(/src\/|tests\/|scripts\//);
    }
  });
});
