/**
 * Orchelio — firm settings.
 *
 * Settings and the onboarding questionnaire write the *same* record. They must
 * therefore agree about what a valid configuration is, and the way they agree
 * is by sharing the pure builders in `src/lib/onboarding/config.ts` rather than
 * each having their own copy of the rules.
 *
 * What differs is only the shape of the conversation: the questionnaire asks
 * seven questions in order and remembers how far a firm reached; settings lets
 * an administrator change one thing without answering the other six again.
 */

import { CONFIGURABLE_APPROVAL_OPTIONS, LOCKED_APPROVAL_OPTIONS } from "@/lib/onboarding/catalogue";
import type { Permission } from "@/lib/auth/permissions";

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export type SettingsSection = {
  slug: string;
  title: string;
  description: string;
  /** What an administrator changes here. Shown so a tab is not a mystery. */
  changes: string;
};

/**
 * The settings tabs, declared once.
 *
 * The page renders these, the tests count them, and a section that exists in
 * one place and not the other is a failure rather than a discrepancy nobody
 * notices.
 */
export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  {
    slug: "profile",
    title: "Profil",
    description: "Le nom du cabinet, son administrateur, et les conventions que ses écrans emploient.",
    changes: "Nom du cabinet, contact, ressort, langue, fuseau horaire, devise.",
  },
  {
    slug: "matter-types",
    title: "Types de dossier",
    description: "Les types de dossier que ce cabinet traite.",
    changes: "Les types de dossier proposés à l’ouverture d’un dossier.",
  },
  {
    slug: "ai",
    title: "Fonctions d’IA",
    description: "Ce que l’assistant est autorisé à faire pour ce cabinet.",
    changes: "Les fonctions d’IA proposées par l’assistant, et les cartes du tableau de bord qui en dépendent.",
  },
  {
    slug: "approvals",
    title: "Règles de validation",
    description: "Les actions qui requièrent la décision d’une personne avant de prendre effet.",
    changes: "Les règles configurables. Les neuf règles verrouillées ne peuvent être changées par personne.",
  },
  {
    slug: "people",
    title: "Personnes et rôles",
    description: "Qui peut utiliser l’espace de ce cabinet, et ce que chacun peut y faire.",
    changes: "Le rôle d’un membre, ou la suspension de son accès.",
  },
  {
    slug: "branding",
    title: "Identité visuelle",
    description: "Comment ce cabinet s’identifie à l’intérieur d’Orchelio.",
    changes: "Le nom affiché du cabinet et sa couleur d’accent. Pas ceux du produit.",
  },
  {
    slug: "confidentiality",
    title: "Confidentialité",
    description: "Où sont les données de ce cabinet, qui peut les lire, et ce qui quitte la machine.",
    changes: "Rien. Elle rend compte ; c’est la seule section sans formulaire.",
  },
  {
    slug: "demonstration",
    title: "Démonstration",
    description: "Les données fictives dans l’espace de ce cabinet.",
    changes: "Ajoute des dossiers d’exemple. Rien ici ne supprime quoi que ce soit.",
  },
] as const;

/** Every settings section requires this to be read. */
export const SETTINGS_VIEW_PERMISSION: Permission = "firm.settings.view";

/** Every settings *change* requires this. Reading is not editing. */
export const SETTINGS_EDIT_PERMISSION: Permission = "firm.settings.edit";

export function isSettingsSection(slug: string): boolean {
  return SETTINGS_SECTIONS.some((section) => section.slug === slug);
}

export function settingsSection(slug: string | undefined): SettingsSection {
  return SETTINGS_SECTIONS.find((section) => section.slug === slug) ?? SETTINGS_SECTIONS[0]!;
}

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------

/**
 * The accent colours a firm may choose.
 *
 * A fixed palette rather than a colour picker, for two reasons that are not
 * aesthetic: a free-form value would be written into a `style` attribute, and
 * an arbitrary colour can fail contrast against the text placed on it. Each
 * entry below carries a light and a dark value chosen to keep white text
 * legible on both.
 */
export const ACCENT_COLOURS = [
  { key: "default", label: "Bleu Orchelio", light: "#1f4e79", dark: "#7ba7d4" },
  { key: "slate", label: "Ardoise", light: "#334155", dark: "#94a3b8" },
  { key: "teal", label: "Sarcelle", light: "#0f5f5c", dark: "#5eb3ae" },
  { key: "plum", label: "Prune", light: "#5b2f5e", dark: "#c093c4" },
  { key: "bronze", label: "Bronze", light: "#7a4a1e", dark: "#d9a271" },
] as const;

export type AccentColourKey = (typeof ACCENT_COLOURS)[number]["key"];

export type Branding = {
  /** How the firm names itself in its own sidebar. Never the product's name. */
  displayName: string;
  accent: AccentColourKey;
};

export const DEFAULT_BRANDING: Branding = { displayName: "", accent: "default" };

export function isAccentColour(value: string): value is AccentColourKey {
  return ACCENT_COLOURS.some((colour) => colour.key === value);
}

export function accentColour(key: string) {
  return ACCENT_COLOURS.find((colour) => colour.key === key) ?? ACCENT_COLOURS[0]!;
}

/**
 * Reads the stored branding object, discarding anything unrecognised.
 *
 * The column is free-form JSON, so this is the boundary where it stops being
 * arbitrary: an accent that is not in the palette becomes the default rather
 * than reaching a `style` attribute.
 */
export function parseBranding(value: unknown): Branding {
  if (typeof value !== "object" || value === null) return { ...DEFAULT_BRANDING };

  const record = value as Record<string, unknown>;
  const displayName = typeof record["displayName"] === "string" ? record["displayName"].trim() : "";
  const accent = typeof record["accent"] === "string" && isAccentColour(record["accent"])
    ? record["accent"]
    : DEFAULT_BRANDING.accent;

  return { displayName: displayName.slice(0, 80), accent };
}

/**
 * The name to show for a firm.
 *
 * A firm may present itself under a shorter name than its legal one. It may not
 * present itself as something other than a firm inside Orchelio, and it may not
 * rename the product — see ADR-0015.
 */
export function firmDisplayName(branding: Branding, firmName: string): string {
  return branding.displayName.trim() || firmName;
}

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

/**
 * The approval keys a settings form may switch on.
 *
 * A locked rule submitted by a hostile form is not rejected — it is *ignored*,
 * and then written in as required anyway by `buildApprovals`. Rejecting would
 * mean there exists a request that could turn one off, which is precisely the
 * property this list denies.
 */
export function configurableApprovalKeys(submitted: readonly string[]): string[] {
  const allowed = new Set(CONFIGURABLE_APPROVAL_OPTIONS.map((option) => option.key));
  const locked = new Set(LOCKED_APPROVAL_OPTIONS.map((option) => option.key));

  return submitted.filter((key) => allowed.has(key) && !locked.has(key));
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export type ProfileUpdate = {
  firmName: string;
  contactName: string;
  contactEmail: string;
  userCount: number;
  jurisdiction: string;
  language: string;
  currency: string;
  timezone: string;
};

export type ProfileValidation = { ok: true } | { ok: false; message: string };

/**
 * Validates a profile change.
 *
 * Deliberately the same rules as onboarding step 1, because it is the same
 * record: a firm that could not have been created with an empty name should not
 * be able to acquire one afterwards.
 */
export function validateProfile(update: Partial<ProfileUpdate>): ProfileValidation {
  if (!update.firmName?.trim()) {
    return { ok: false, message: "Saisissez le nom du cabinet." };
  }
  if (!update.contactName?.trim()) {
    return { ok: false, message: "Saisissez le nom de l’administrateur du cabinet." };
  }
  if (!update.contactEmail?.trim() || !update.contactEmail.includes("@")) {
    return { ok: false, message: "Saisissez une adresse e-mail fictive." };
  }
  if (update.userCount !== undefined && (!Number.isFinite(update.userCount) || update.userCount < 1)) {
    return { ok: false, message: "Le nombre d’utilisateurs doit être d’au moins un." };
  }
  return { ok: true };
}
