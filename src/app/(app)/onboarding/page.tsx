import { redirect } from "next/navigation";

import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { requirePermission } from "@/lib/auth/guards";
import { currentSession } from "@/lib/auth/session";
import { loadDraft } from "@/lib/data/onboarding";

export const dynamic = "force-dynamic";

/**
 * `/onboarding` resumes wherever the firm left off, so a half-finished
 * questionnaire is picked up rather than restarted.
 */
export default async function OnboardingPage() {
  const session = await currentSession();
  if (!session) {
    redirect("/login?next=%2Fonboarding");
  }

  const firm = await activeFirmFor(session);
  if (!firm) {
    redirect("/403");
  }

  const context = await requirePermission(firm.id, "firm.settings.edit");
  const draft = await loadDraft(scopeFor(context.firm));

  redirect(`/onboarding/${draft.onboardingStep}`);
}
