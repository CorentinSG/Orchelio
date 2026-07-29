/**
 * Orchelio — creating a firm.
 *
 * Pure rules, no database. What makes a firm's name acceptable, what its
 * identifier becomes, and who its first administrator is — all decidable
 * without a connection, and therefore testable without one.
 *
 * The acceptance criterion for this phase is that a third firm can be created
 * entirely through the interface with no code change. Everything a firm needs
 * to exist is asked for here; everything it needs to be *useful* is asked for
 * by the onboarding questionnaire afterwards, which is why this form is short.
 */

import { PRACTICE_AREAS, isPracticeAreaAvailable } from "@/lib/practice-areas";

export type NewFirmInput = {
  name: string;
  primaryPracticeArea: string;
  administratorName: string;
  administratorEmail: string;
};

export type NewFirmValidation = { ok: true } | { ok: false; message: string };

/**
 * Turns a firm's name into a URL-safe identifier.
 *
 * Accents are folded rather than dropped, so "Lefèvre & Associés" becomes
 * `lefevre-associes` and not `lefvre-associs` — a slug a French firm would not
 * recognise as its own.
 */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Makes a slug unique against the ones already taken.
 *
 * Suffixes rather than fails: two firms may legitimately share a name, and
 * refusing the second would be a rule about the world rather than about the
 * database.
 */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  if (base && !taken.has(base)) return base;

  const stem = base || "firm";
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${stem}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
  // Unreachable in practice; a thousand firms of the same name is not a case
  // worth a cleverer algorithm, but silently returning a duplicate would be.
  throw new Error(`Could not find a free identifier for "${stem}".`);
}

/** The practice areas a firm may be created in: those with a full template. */
export function creatablePracticeAreas() {
  return PRACTICE_AREAS.filter((area) => isPracticeAreaAvailable(area.key));
}

export function validateNewFirm(input: Partial<NewFirmInput>): NewFirmValidation {
  const name = input.name?.trim() ?? "";
  if (name.length < 2) {
    return { ok: false, message: "Enter a name for the firm." };
  }
  if (!slugify(name)) {
    return {
      ok: false,
      message: "The firm's name needs at least one letter or number in it.",
    };
  }

  if (!input.primaryPracticeArea) {
    return { ok: false, message: "Choose the firm's main practice area." };
  }
  if (!isPracticeAreaAvailable(input.primaryPracticeArea)) {
    // Creating a firm in an area with no template would produce a workspace the
    // questionnaire then refuses to complete — a dead end two screens later.
    const label = PRACTICE_AREAS.find((area) => area.key === input.primaryPracticeArea)?.label;
    return {
      ok: false,
      message: `${label ?? "That practice area"} has no template yet. Choose Immigration Law or Employment & Labor Law.`,
    };
  }

  if (!input.administratorName?.trim()) {
    return { ok: false, message: "Enter the name of the firm's first administrator." };
  }

  const email = input.administratorEmail?.trim() ?? "";
  if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    return { ok: false, message: "Enter a fictional email address for the administrator." };
  }

  return { ok: true };
}

/**
 * Is this address safe to invent an account for in a demonstration?
 *
 * The demonstration's own accounts use `.local`, which cannot exist on the real
 * internet. A new administrator's address does not have to — a visitor will
 * type something — but it must not be an address that could reach a real
 * person, because the account is created with a password printed on the screen.
 */
export function looksLikeRealAddress(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return domain.length > 0 && !domain.endsWith(".local") && !domain.endsWith(".example");
}
