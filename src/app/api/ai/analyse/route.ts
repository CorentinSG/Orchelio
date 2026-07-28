import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { can } from "@/lib/auth/permissions";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { actorFor, currentSession } from "@/lib/auth/session";
import { firmConfiguration } from "@/lib/data/firms";
import { parseStringArray } from "@/lib/json-field";
import { runAnalysis } from "@/lib/ai/run";
import { isSameOrigin, seeOther } from "@/lib/http/form-post";

/**
 * Orchelio — run an analysis on a matter.
 *
 * A plain form POST answered with a 303, like every other consequential action
 * in this product (ADR-0006). The work happens inside the request rather than
 * in a queue: the simulation takes milliseconds, and a queue would add a moving
 * part whose failure mode is a matter stuck at "running" forever.
 *
 * The features come from the firm's own configuration, never from the form. A
 * firm that switched off inconsistency detection does not get it back by
 * posting a different field.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return seeOther("/403");

  const session = await currentSession();
  if (!session) return seeOther("/login?next=%2Fmatters");

  const firm = await activeFirmFor(session);
  if (!firm) return seeOther("/403");

  if (!can(actorFor(session.user, firm.id), "ai.analysis.run")) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "permission",
      resourceId: "ai.analysis.run",
      status: "denied",
      newValue: { reason: "missing_permission", role: firm.role },
    });
    return seeOther("/403");
  }

  const form = await request.formData();
  const matterId = String(form.get("matterId") ?? "");
  if (!matterId) return seeOther("/matters");

  const scope = scopeFor(firm);
  const configuration = await firmConfiguration(scope);

  const outcome = await runAnalysis(scope, {
    matterId,
    userId: session.user.id,
    enabledFeatures: parseStringArray(configuration?.aiFeatures),
  });

  const back = (query: string) =>
    seeOther(`/matters/${encodeURIComponent(matterId)}?tab=analysis&${query}`);

  if (!outcome.ok) {
    switch (outcome.reason) {
      case "matter_not_found":
        // Real identifier, wrong firm, or no such matter. Same answer to all.
        return seeOther("/403");
      case "no_features":
        return back("problem=no_features");
      case "failed":
        return back("problem=failed");
    }
  }

  return back("ran=1");
}
