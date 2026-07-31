import { recordAuditEvent } from "@/lib/audit";
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_MIME_TYPES,
  AUDIT_ACTIONS,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/constants";
import { can } from "@/lib/auth/permissions";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { actorFor, currentSession } from "@/lib/auth/session";
import { createMatter } from "@/lib/data/matters";
import { addDocument } from "@/lib/data/documents";
import { firmConfiguration } from "@/lib/data/firms";
import { runAnalysis } from "@/lib/ai/run";
import { MAX_FILES_AT_ONCE, UNSORTED_CATEGORY } from "@/lib/start/guided";
import { parseStringArray } from "@/lib/json-field";
import { isSameOrigin, seeOther } from "@/lib/http/form-post";

/**
 * Orchelio — open a matter, record its files and read it, in one submission.
 *
 * This handler composes three things that already exist and adds no new power:
 * `createMatter`, `addDocument` and `runAnalysis`, in that order, each with the
 * same permission check it has on its own screen. There is deliberately no
 * shortcut through any of them — in particular the analysis still goes through
 * `raiseApproval`, so a matter opened this way waits for a person exactly as
 * one opened the long way does.
 *
 * Two rules the composition has to keep:
 *
 * **A later step failing must not undo an earlier one.** If the analysis cannot
 * run, the matter and its documents are still real and the person is taken to
 * them. Rolling back a matter somebody has just described would lose their work
 * to protect a step they did not ask about.
 *
 * **Every refusal is still a refusal.** Holding `matter.create` does not grant
 * `document.upload`; a person with one and not the other opens the matter and
 * is told the files were not recorded, rather than having the rule quietly
 * relaxed because three steps share a button.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return seeOther("/403");

  const session = await currentSession();
  if (!session) return seeOther("/login?next=%2Fstart");

  const firm = await activeFirmFor(session);
  if (!firm) return seeOther("/403");

  const actor = actorFor(session.user, firm.id);
  if (!can(actor, "matter.create")) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "permission",
      resourceId: "matter.create",
      status: "denied",
      newValue: { reason: "missing_permission", role: firm.role, via: "start" },
    });
    return seeOther("/403");
  }

  const scope = scopeFor(firm);
  const form = await request.formData();

  const clientName = String(form.get("clientName") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const matterTypeKey = String(form.get("matterTypeKey") ?? "");

  const back = (problem: string) => seeOther(`/start?problem=${encodeURIComponent(problem)}`);

  if (!clientName || !title) {
    return back("A client and a line about what it is are both needed.");
  }

  // The matter type is checked against what this firm enabled, exactly as on
  // the full form: the configuration is a constraint, not a menu.
  const configuration = await firmConfiguration(scope);
  const enabled = parseStringArray(configuration?.matterTypes);
  if (!enabled.includes(matterTypeKey)) {
    return back("That is not a kind of matter this firm handles.");
  }

  const matter = await createMatter(scope, {
    title,
    clientName,
    matterTypeKey,
    practiceAreaKey: firm.primaryPracticeArea,
    status: "lead",
    createdById: session.user.id,
    fields: {},
  });

  await recordAuditEvent({
    action: AUDIT_ACTIONS.matterCreated,
    firmId: firm.id,
    userId: session.user.id,
    resourceType: "matter",
    resourceId: matter.id,
    newValue: { reference: matter.reference, matterTypeKey, via: "start" },
  });

  // --- the files, if this person may add them ------------------------------

  let recorded = 0;
  let refusedFiles = 0;

  if (can(actor, "document.upload")) {
    const filenames = form.getAll("filename").map(String);
    const sizes = form.getAll("sizeBytes").map(String);
    const mimeTypes = form.getAll("mimeType").map(String);

    for (const [index, filename] of filenames.slice(0, MAX_FILES_AT_ONCE).entries()) {
      const name = filename.trim();
      const sizeBytes = Number(sizes[index] ?? 0);
      const mimeType = String(mimeTypes[index] ?? "");
      const extension = name.split(".").pop()?.toLowerCase() ?? "";

      // Everything the browser checked, checked again. The browser's copy runs
      // on a machine the user controls.
      const acceptable =
        name !== "" &&
        (ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(extension) &&
        (mimeType === "" || (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(mimeType)) &&
        Number.isFinite(sizeBytes) &&
        sizeBytes > 0 &&
        sizeBytes <= MAX_DOCUMENT_SIZE_BYTES;

      if (!acceptable) {
        refusedFiles += 1;
        continue;
      }

      const document = await addDocument(scope, {
        matterId: matter.id,
        filename: name,
        // Unsorted on purpose — see `UNSORTED_CATEGORY`.
        category: UNSORTED_CATEGORY,
        mimeType,
        sizeBytes,
        uploadedById: session.user.id,
      });
      if (!document) {
        refusedFiles += 1;
        continue;
      }

      recorded += 1;
      await recordAuditEvent({
        action: AUDIT_ACTIONS.documentAdded,
        firmId: firm.id,
        userId: session.user.id,
        resourceType: "document",
        resourceId: document.id,
        newValue: { filename: name, matterId: matter.id, via: "start" },
      });
    }
  }

  // --- the reading, if this person and this firm allow one -----------------

  const aiFeatures = parseStringArray(configuration?.aiFeatures);
  let analysed = false;

  if (can(actor, "ai.analysis.run") && aiFeatures.length > 0) {
    const outcome = await runAnalysis(scope, {
      matterId: matter.id,
      userId: session.user.id,
      enabledFeatures: aiFeatures,
    });
    analysed = outcome.ok;
  }

  // Landed on the analysis when there is one to read, and on the matter itself
  // when there is not — never on a tab that would show an empty panel.
  const tab = analysed ? "analysis" : "documents";
  const opened = new URLSearchParams({
    opened: "1",
    recorded: String(recorded),
    ...(refusedFiles > 0 ? { refused: String(refusedFiles) } : {}),
    tab,
  });
  return seeOther(`/matters/${matter.id}?${opened.toString()}`);
}
