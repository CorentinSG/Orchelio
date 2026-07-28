import "server-only";

import { platformCatalogue } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

/**
 * Orchelio — platform-wide reference data.
 *
 * Practice areas, matter types and workflow templates are identical for every
 * firm on the instance. They belong to nobody, so — unlike everything in
 * `src/lib/data/*` that takes a `FirmScope` — they may be held across requests.
 *
 * `platformCatalogue` checks the model name against the list of models that
 * belong to no firm, so moving a firm-scoped read into this file fails at the
 * first call rather than leaking quietly. See src/lib/cache.ts.
 */

export const allPracticeAreas = platformCatalogue("PracticeArea", "all", () =>
  prisma.practiceArea.findMany({ orderBy: { sortOrder: "asc" } }),
);

export const allMatterTypes = platformCatalogue("MatterType", "all", () =>
  prisma.matterType.findMany({
    orderBy: [{ practiceAreaKey: "asc" }, { sortOrder: "asc" }],
  }),
);

export const allWorkflowTemplates = platformCatalogue("WorkflowTemplate", "all", () =>
  prisma.workflowTemplate.findMany({ orderBy: { sortOrder: "asc" } }),
);

/** Matter types for the practice areas a firm selected. Filtered in memory. */
export async function matterTypesForPracticeAreas(practiceAreas: readonly string[]) {
  if (practiceAreas.length === 0) return [];

  const selected = new Set(practiceAreas);
  return (await allMatterTypes()).filter((type) => selected.has(type.practiceAreaKey));
}

/** Workflow templates that apply to a practice area, plus the generic ones. */
export async function workflowTemplatesFor(practiceArea: string) {
  return (await allWorkflowTemplates()).filter(
    (template) => template.practiceAreaKey === null || template.practiceAreaKey === practiceArea,
  );
}
