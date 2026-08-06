/**
 * Orchelio — application identity.
 *
 * Product naming lives in exactly one place so that the sidebar, the login
 * page, the page titles, the metadata, the loading screens and the error
 * screens can never drift apart.
 *
 * Safe to import from both server and client components: it reads only
 * `NEXT_PUBLIC_*` variables.
 */

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Orchelio";

export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV?.trim() || "demo";

/** True when this instance is the public demonstration build. */
export const IS_DEMO = APP_ENV === "demo";

/** Shown next to the product name, e.g. "Orchelio Demo". */
export const APP_EDITION = IS_DEMO ? "Démo" : "";

/** Full product label used in titles and headers. */
export const APP_FULL_NAME = APP_EDITION ? `${APP_NAME} ${APP_EDITION}` : APP_NAME;

export const APP_TAGLINE = "Le cockpit adaptatif des cabinets d'avocats";

export const APP_DESCRIPTION = `${APP_NAME} est le cockpit configurable des cabinets d’avocats.`;

/** Footer signature required on every firm-facing screen. */
export const POWERED_BY = `Propulsé par ${APP_NAME}`;

/**
 * Demo warning. Two wordings are mandated by the specification: a short one for
 * the product chrome and a longer one for pages that accept input.
 */
export const DEMO_NOTICE_SHORT =
  `Démonstration ${APP_NAME} — n'y saisissez jamais d'informations réelles sur un client ni de documents confidentiels.`;

export const DEMO_NOTICE_LONG =
  "Environnement de démonstration — n'y saisissez jamais d'informations réelles sur un client.";

/** Every record in this build is fictional. Stated plainly wherever data is shown. */
export const FICTIONAL_DATA_NOTICE =
  "Tous les cabinets, personnes, dossiers et documents de cet environnement sont fictifs.";
