import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Callout, Card, DataRow } from "@/components/ui";
import {
  StatusBadge,
  UnconfirmedDate,
  fileSize,
  formatDate,
  relativeDays,
} from "@/components/matter-ui";
import { UploadPanel } from "@/components/upload-panel";
import { recordViewEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { can } from "@/lib/auth/permissions";
import { actorFor } from "@/lib/auth/session";
import { requireMatterAccess } from "@/lib/auth/workspace";
import { requestNow } from "@/lib/clock";
import { matterDetail } from "@/lib/data/matters";
import { categoriesFor, categoryLabel, expectedButMissing } from "@/lib/matters/documents";
import { displayValue, sectionsFor } from "@/lib/matters/fields";
import { parseJsonObject } from "@/lib/json-field";

export const metadata = { title: "Matter" };
export const dynamic = "force-dynamic";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "intake", label: "Intake" },
  { key: "documents", label: "Documents" },
  { key: "tasks", label: "Tasks" },
] as const;

/** Tabs the specification requires that later phases fill. */
const PLANNED_TABS = [
  { label: "Timeline", phase: 6 },
  { label: "AI Analysis", phase: 6 },
  { label: "Communications", phase: 7 },
  { label: "Approvals", phase: 7 },
  { label: "Activity", phase: 7 },
] as const;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MatterPage({ params, searchParams }: PageProps) {
  const { session, firm } = await requireMatterAccess();
  const now = requestNow();
  const { id } = await params;
  const query = await searchParams;

  const matter = await matterDetail({ matterId: id, firmId: firm.id });

  // Not found and not yours are the same answer, deliberately: a distinct
  // message would confirm that another firm's matter exists.
  if (!matter) {
    notFound();
  }

  await recordViewEvent({
    action: AUDIT_ACTIONS.matterViewed,
    firmId: firm.id,
    userId: session.user.id,
    resourceType: "matter",
    resourceId: matter.id,
  });

  const rawTab = Array.isArray(query["tab"]) ? query["tab"][0] : query["tab"];
  const tab = TABS.find((candidate) => candidate.key === rawTab)?.key ?? "overview";

  // The upload handler answers a refusal with a redirect carrying its reason.
  // Rendering it here is what makes the refusal visible: without this the
  // server would decline and the page would look as though nothing happened,
  // which is the failure mode that costs a user the most time.
  const uploadError = typeof query["error"] === "string" ? query["error"] : null;
  const justAdded = query["added"] === "1";

  const actor = actorFor(session.user, firm.id);
  const canUpload = can(actor, "document.upload");
  const canClassify = can(actor, "document.classify");

  // Column-backed fields are shown alongside the rest, read from the column
  // rather than the JSON — the catalogue says what to show, the matter row says
  // what the value is.
  const fields: Record<string, unknown> = {
    ...parseJsonObject(matter.fields),
    ...(matter.representationSide ? { representation_side: matter.representationSide } : {}),
  };
  const sections = sectionsFor(matter.practiceAreaKey, matter.matterTypeKey);
  const presentCategories = [...new Set(matter.documents.map((document) => document.category))];
  const missing = expectedButMissing(
    matter.practiceAreaKey,
    matter.matterTypeKey,
    presentCategories,
  );
  const intake = parseJsonObject(matter.intakeResponses[0]?.payload);
  const openTasks = matter.tasks.filter((task) => task.status !== "done");

  return (
    <div className="space-y-6">
      <header>
        <Link href="/matters" className="text-sm text-brand hover:underline">
          ← All matters
        </Link>
        <p className="mt-2 font-mono text-sm text-ink-subtle">{matter.reference}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-ink">{matter.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={matter.status} />
          <Badge tone="neutral">{matter.matterType.label}</Badge>
          {matter.representationSide ? (
            <Badge tone="brand">Representing the {matter.representationSide}</Badge>
          ) : null}
          <Badge tone="warning">Not verified</Badge>
        </div>
      </header>

      <nav aria-label="Matter sections" className="border-b border-line">
        <ul className="-mb-px flex flex-wrap gap-1">
          {TABS.map((candidate) => (
            <li key={candidate.key}>
              <Link
                href={`/matters/${matter.id}?tab=${candidate.key}`}
                aria-current={tab === candidate.key ? "page" : undefined}
                className={`inline-block border-b-2 px-4 py-2 text-sm font-medium ${
                  tab === candidate.key
                    ? "border-brand text-brand"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {candidate.label}
              </Link>
            </li>
          ))}
          {PLANNED_TABS.map((planned) => (
            <li
              key={planned.label}
              className="inline-flex items-center gap-1.5 border-b-2 border-transparent px-4 py-2 text-sm text-ink-subtle"
            >
              {planned.label}
              <span className="text-xs">Phase {planned.phase}</span>
            </li>
          ))}
        </ul>
      </nav>

      {tab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Matter" description="Recorded by the firm. Nothing here is verified.">
              <dl>
                <DataRow label="Client" value={matter.clientProfile?.displayName ?? "Unknown"} />
                <DataRow label="Type" value={matter.matterType.label} />
                <DataRow
                  label="Responsible attorney"
                  value={matter.responsibleAttorney?.name ?? "Unassigned"}
                />
                <DataRow label="Opened" value={formatDate(matter.openedAt)} />
                <DataRow
                  label="Next date"
                  value={<UnconfirmedDate value={matter.nextDeadlineAt} now={now} />}
                />
                <DataRow label="Last activity" value={relativeDays(matter.lastActivityAt, now)} />
                <DataRow label="Documents" value={matter.documents.length} />
                <DataRow label="Open tasks" value={openTasks.length} />
              </dl>
            </Card>

            <Card
              title="Expected documents not yet received"
              description="A checklist, not a judgement."
            >
              {missing.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Every document expected for this type of matter is on file.
                </p>
              ) : (
                <ul className="space-y-2">
                  {missing.map((category) => (
                    <li key={category.key} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-ink">{category.label}</span>
                      <Badge tone="warning">Not received</Badge>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-sm text-ink-subtle">
                This compares what is on file against what this type of matter usually needs. The
                AI&apos;s own view — with reasons and priorities — arrives in Phase 6 and is
                reviewed by a person.
              </p>
            </Card>
          </div>

          {sections.map(({ section, fields: sectionFields }) => (
            <Card key={section} title={section}>
              <dl className="grid gap-x-8 sm:grid-cols-2">
                {sectionFields.map((field) => (
                  <DataRow
                    key={field.key}
                    label={field.label}
                    value={displayValue(field, fields[field.key])}
                  />
                ))}
              </dl>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "intake" ? (
        <Card
          title="Intake"
          description={
            matter.intakeResponses[0]
              ? `Submitted ${formatDate(matter.intakeResponses[0].submittedAt)}.`
              : "No intake has been recorded for this matter."
          }
        >
          {Object.keys(intake).length === 0 ? (
            <p className="text-sm text-ink-muted">Nothing recorded yet.</p>
          ) : (
            <>
              <Callout tone="warning" title="What the client said">
                These are the client&apos;s own words as recorded at intake. They are not
                verified, and where they disagree with a document the disagreement is the point —
                it is not resolved here.
              </Callout>
              <dl className="mt-4">
                {Object.entries(intake).map(([key, value]) => (
                  <DataRow
                    key={key}
                    label={key.split("_").join(" ")}
                    value={String(value ?? "Unknown")}
                  />
                ))}
              </dl>
            </>
          )}
        </Card>
      ) : null}

      {tab === "documents" ? (
        <div className="space-y-6">
          {uploadError ? (
            <Callout tone="danger" title="That document was not added" assertive>
              {uploadError}
            </Callout>
          ) : null}
          {justAdded && !uploadError ? (
            <Callout tone="success" title="Document recorded">
              Its name, type and size were recorded. The file itself stayed on your computer.
            </Callout>
          ) : null}

          {canUpload ? (
            <UploadPanel
              matterId={matter.id}
              categories={categoriesFor(matter.practiceAreaKey)}
            />
          ) : (
            <Callout tone="neutral" title="Read only">
              Your role does not allow adding documents to a matter.
            </Callout>
          )}

          <Card title={`Documents (${matter.documents.length})`}>
            {matter.documents.length === 0 ? (
              <p className="text-sm text-ink-muted">No document has been added yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {matter.documents.map((document) => (
                  <li key={document.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{document.filename}</p>
                      <p className="text-sm text-ink-muted">
                        {categoryLabel(matter.practiceAreaKey, document.category)} ·{" "}
                        {fileSize(document.sizeBytes)} · added {formatDate(document.receivedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {document.verified ? (
                        <Badge tone="success">Checked by a person</Badge>
                      ) : (
                        <Badge tone="warning">Not verified</Badge>
                      )}
                      {canClassify && !document.verified ? (
                        <form method="post" action="/api/documents/verify">
                          <input type="hidden" name="documentId" value={document.id} />
                          <input type="hidden" name="matterId" value={matter.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-line px-3 py-1 text-sm font-medium text-ink hover:bg-surface-muted"
                          >
                            Mark as checked
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-sm text-ink-subtle">
              Uploads are simulated: only the file&apos;s name, type and size are recorded. No
              content is stored and nothing is read — there is no OCR in this build.
            </p>
          </Card>
        </div>
      ) : null}

      {tab === "tasks" ? (
        <Card title={`Tasks (${openTasks.length} open)`}>
          {matter.tasks.length === 0 ? (
            <p className="text-sm text-ink-muted">No task on this matter.</p>
          ) : (
            <ul className="divide-y divide-line">
              {matter.tasks.map((task) => (
                <li key={task.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{task.title}</p>
                    {task.description ? (
                      <p className="text-sm text-ink-muted">{task.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={task.priority === "high" ? "warning" : "neutral"}>
                      {task.priority}
                    </Badge>
                    <span className="text-sm text-ink-muted">{formatDate(task.dueAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  );
}
