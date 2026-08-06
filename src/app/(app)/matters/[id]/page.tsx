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
import {
  AnalysisStatus,
  AnalysisWarnings,
  ContradictionCard,
  KeyFactRow,
  QuestionList,
  ReviewPanel,
  TimelineList,
} from "@/components/analysis-ui";
import { recordViewEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { can } from "@/lib/auth/permissions";
import { actorFor } from "@/lib/auth/session";
import { requireMatterAccess } from "@/lib/auth/workspace";
import { requestNow } from "@/lib/clock";
import { matterDetail } from "@/lib/data/matters";
import { latestAnalysisForMatter } from "@/lib/data/analyses";
import { approvalsForResource, matterApprovals } from "@/lib/data/approvals";
import { listDrafts } from "@/lib/data/communications";
import { listMatterActivity } from "@/lib/data/activity";
import { ApprovalCard } from "@/components/approval-ui";
import { ActivityDetail, ActivityStatusBadge, activityLabel } from "@/components/activity-ui";
import { decisionLabel } from "@/lib/approvals/actions";
import { isDecisionStatus, isPendingStatus } from "@/lib/approvals/status";
import { firmConfiguration } from "@/lib/data/firms";
import { firmTimezone, formatMoment, timezoneNotice } from "@/lib/format/dates";
import { AI_FEATURE_OPTIONS } from "@/lib/onboarding/catalogue";
import { categoriesFor, categoryLabel, expectedButMissing } from "@/lib/matters/documents";
import { displayValue, sectionsFor } from "@/lib/matters/fields";
import { parseJsonObject, parseStringArray } from "@/lib/json-field";
import type { AnalysisReviewResult, MatterAnalysisResult } from "@/lib/ai/types";
import { providerNotice } from "@/lib/ai/notice";
import { serverEnv } from "@/lib/env";

export const metadata = { title: "Matter" };
export const dynamic = "force-dynamic";

const TABS = [
  { key: "overview", label: "Vue d’ensemble" },
  { key: "intake", label: "Questionnaire client" },
  { key: "documents", label: "Documents" },
  { key: "tasks", label: "Tâches" },
  { key: "timeline", label: "Chronologie" },
  { key: "analysis", label: "Analyse" },
  { key: "communications", label: "Courriers" },
  { key: "approvals", label: "Validations" },
  { key: "activity", label: "Activité" },
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

  // Arrived from the one-screen route. It says how many files were recorded
  // rather than only that something happened: three steps ran on one button
  // press, and a person who cannot see what each one did has to go and check.
  const justOpened = query["opened"] === "1";
  const filesRecorded = Number(query["recorded"] ?? 0);
  const filesRefused = Number(query["refused"] ?? 0);

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

  const [analysis, configuration] = await Promise.all([
    latestAnalysisForMatter({ firmId: firm.id }, matter.id),
    firmConfiguration({ firmId: firm.id }),
  ]);
  const timezone = firmTimezone(configuration?.timezone);
  const enabledAiFeatures = parseStringArray(configuration?.aiFeatures);
  // The catalogue's own list, minus what this firm chose. Practice-area
  // variants count as the same feature: an employment firm enabling
  // `employment_timeline` has asked for "Create a factual timeline".
  const unusedAiFeatures = AI_FEATURE_OPTIONS.filter(
    (option) =>
      !enabledAiFeatures.some(
        (key) =>
          key === option.key.default ||
          Object.values(option.key.byPracticeArea ?? {}).includes(key),
      ),
  ).map((option) => option.key.default);
  const canRunAnalysis = can(actor, "ai.analysis.run") && enabledAiFeatures.length > 0;
  const canSeeResults = can(actor, "ai.result.view");

  // Parsed once here rather than in each tab: both the Timeline and the AI
  // Analysis tab read the same stored result.
  const result =
    analysis?.status === "completed" && analysis.result
      ? (JSON.parse(analysis.result) as MatterAnalysisResult)
      : null;
  const review = analysis?.reviews[0]?.result
    ? (JSON.parse(analysis.reviews[0].result) as AnalysisReviewResult)
    : null;

  const analysisProblem = typeof query["problem"] === "string" ? query["problem"] : null;

  // --- Phase 7: approvals, drafts and this matter's own log ----------------
  const [approvals, drafts] = await Promise.all([
    // Bounded, and counted separately. This list used to be a single window of
    // a hundred rows whose length was printed as the total — so a matter with
    // more than that reported the window size, and a request raised a moment
    // ago could be pushed out of sight by older ones. Found by a browser test
    // that raised a date confirmation and could not find it.
    matterApprovals({ firmId: firm.id }, matter.id),
    listDrafts({ firmId: firm.id }, { matterId: matter.id }),
  ]);

  // An approval or a draft names *itself* as its resource, with the matter in
  // the payload, so the matter's own log has to ask for those identifiers too.
  const relatedIds = [
    // The window, not the total: the activity log filter is a convenience and
    // a bounded one is correct here — an older approval's own events are
    // reachable from the approvals screen.
    ...approvals.shown.map((approval) => approval.id),
    ...drafts.map((draft) => draft.id),
    ...matter.documents.map((document) => document.id),
    ...(analysis ? [analysis.id] : []),
  ];
  const matterActivity = can(actor, "firm.audit.view")
    ? await listMatterActivity({ firmId: firm.id }, matter.id, relatedIds)
    : [];

  const canDecide = can(actor, "approval.decide");
  const canDraft = can(actor, "communication.draft");
  // Asked for directly rather than searched for in the list above. The list is
  // bounded, so an analysis whose approval had fallen outside the window would
  // have been reported as having none — which is the opposite of the truth.
  const analysisApprovals = analysis
    ? await approvalsForResource({ firmId: firm.id }, "ai_analysis", analysis.id)
    : [];
  const pendingForAnalysis = analysisApprovals.find(
    (approval) => approval.action === "legal_analysis" && isPendingStatus(approval.status),
  );
  // `isDecisionStatus`, not "anything that is not pending": a superseded
  // request is neither, and this value is rendered as "a person decided this".
  const decidedForAnalysis = analysisApprovals.find((approval) =>
    isDecisionStatus(approval.status),
  );

  const raisedId = typeof query["raised"] === "string" ? query["raised"] : null;
  const communicationProblem =
    tab === "communications" && typeof query["problem"] === "string" ? query["problem"] : null;

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

      {justOpened ? (
        <Callout tone="success" title="The matter is open">
          <p>
            {`${matter.reference} exists, ${
              filesRecorded === 1 ? "1 file is listed on it" : `${filesRecorded} files are listed on it`
            }${
              Number.isFinite(filesRefused) && filesRefused > 0
                ? `, and ${filesRefused} ${filesRefused === 1 ? "was" : "were"} not a kind Orchelio accepts`
                : ""
            }.`}
          </p>
          <p className="mt-2">
            {
              "Nothing has been decided. If an analysis ran, it is a draft nobody has stood behind until you read it."
            }
          </p>
        </Callout>
      ) : null}

      <nav aria-label="Sections du dossier" className="border-b border-line">
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
        </ul>
      </nav>

      {tab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card
              title="Matter"
              description={`Recorded by the firm. Nothing here is verified. ${timezoneNotice(timezone)}`}
            >
              <dl>
                <DataRow label="Client" value={matter.clientProfile?.displayName ?? "Unknown"} />
                <DataRow label="Type" value={matter.matterType.label} />
                <DataRow
                  label="Responsible attorney"
                  value={matter.responsibleAttorney?.name ?? "Unassigned"}
                />
                <DataRow label="Opened" value={formatDate(matter.openedAt, timezone)} />
                <DataRow
                  label="Next date"
                  value={<UnconfirmedDate value={matter.nextDeadlineAt} now={now} timezone={timezone} />}
                />
                <DataRow label="Last activity" value={relativeDays(matter.lastActivityAt, now, timezone)} />
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
                This compares what is on file against what this type of matter usually needs.{" "}
                <Link
                  href={`/matters/${matter.id}?tab=analysis`}
                  className="font-medium text-brand underline underline-offset-4"
                >
                  The analysis
                </Link>{" "}
                says why each one matters — and, like everything else it produces, is read by a
                person before it is used.
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
          title="Questionnaire client"
          description={
            matter.intakeResponses[0]
              ? `Submitted ${formatDate(matter.intakeResponses[0].submittedAt, timezone)}.`
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
                        {fileSize(document.sizeBytes)} · added {formatDate(document.receivedAt, timezone)}
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
        <Card title={`Tâches (${openTasks.length} ouvertes)`}>
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
                    <span className="text-sm text-ink-muted">{formatDate(task.dueAt, timezone)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {tab === "timeline" ? (
        <Card
          title="Chronologie"
          description="Every date on this matter, in order, with where each one came from."
        >
          {!canSeeResults ? (
            <Callout tone="neutral" title="Not available to your role">
              Your role does not include viewing analysis results.
            </Callout>
          ) : !result ? (
            <Callout tone="neutral" title="No timeline yet">
              <p>
                The timeline is built when an analysis runs. Nothing has been run on this matter
                yet.
              </p>
              <p className="mt-2">
                <Link
                  href={`/matters/${matter.id}?tab=analysis`}
                  className="font-medium text-brand underline underline-offset-4"
                >
                  Go to AI Analysis
                </Link>
              </p>
            </Callout>
          ) : result.timeline.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No date on this matter could be read from the record or from a document&apos;s name.
            </p>
          ) : (
            <>
              <Callout tone="warning" title="No date here is confirmed">
                A date somebody remembered and a date printed on a notice are different evidence.
                Each entry says which it is, and Orchelio confirms neither.
              </Callout>
              <div className="mt-5">
                <TimelineList events={result.timeline} />
              </div>
            </>
          )}
        </Card>
      ) : null}

      {tab === "analysis" ? (
        <div className="space-y-6">
          {analysisProblem === "no_features" ? (
            <Callout tone="warning" title="No AI features are switched on" assertive>
              <p>
                This firm has not enabled any Claude features, so there is nothing for an analysis
                to produce. Running one anyway would fill the page with empty sections.
              </p>
              <p className="mt-2">
                <Link
                  href="/onboarding/5"
                  className="font-medium text-brand underline underline-offset-4"
                >
                  Choose the features this firm wants
                </Link>
              </p>
            </Callout>
          ) : null}

          {!canSeeResults ? (
            <Callout tone="neutral" title="Not available to your role">
              Your role does not include viewing analysis results.
            </Callout>
          ) : (
            <>
              <Card
                title="Claude Analyst"
                description={providerNotice(serverEnv()).analystNote}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {analysis ? (
                    <AnalysisStatus
                      status={analysis.status}
                      startedAt={analysis.startedAt}
                      completedAt={analysis.completedAt}
                      errorMessage={analysis.errorMessage}
                  timezone={timezone}
                    />
                  ) : (
                    <p className="text-sm text-ink-muted">
                      No analysis has been run on this matter.
                    </p>
                  )}

                  {canRunAnalysis ? (
                    <form method="post" action="/api/ai/analyse">
                      <input type="hidden" name="matterId" value={matter.id} />
                      <button
                        type="submit"
                        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
                      >
                        {analysis ? "Run again" : "Run analysis"}
                      </button>
                    </form>
                  ) : null}
                </div>

                {enabledAiFeatures.length > 0 ? (
                  <p className="mt-4 text-sm text-ink-subtle">
                    This firm asked Claude for:{" "}
                    {enabledAiFeatures.map(aiFeatureLabel).join(", ")}. An analysis produces only
                    those.
                  </p>
                ) : null}

                {/* What the firm did *not* ask for.
                    A dashboard tile for a disabled feature is omitted, because
                    "0 missing documents" reads as reassurance. This is the
                    opposite case: somebody looking at an analysis and wondering
                    why a section is absent is asking a configuration question,
                    and the honest answer is that nobody asked for it. */}
                {unusedAiFeatures.length > 0 ? (
                  <p className="mt-2 text-sm text-ink-subtle">
                    Not asked for, and so not produced:{" "}
                    {unusedAiFeatures.map(aiFeatureLabel).join(", ")}.{" "}
                    <Link
                      href="/onboarding/5"
                      className="font-medium text-brand underline underline-offset-4"
                    >
                      Change what this firm asks for
                    </Link>
                  </p>
                ) : null}
              </Card>

              {result ? (
                <>
                  {/* Whether anybody has taken responsibility for this, said
                      before the analysis rather than after it. */}
                  {pendingForAnalysis ? (
                    <Callout tone="warning" title="Nobody has approved this yet">
                      <p>
                        A decision is waiting. Until somebody takes responsibility for this
                        analysis, it is a draft nobody has stood behind.
                      </p>
                      <p className="mt-2">
                        <Link
                          href={`/matters/${matter.id}?tab=approvals`}
                          className="font-medium text-brand underline underline-offset-4"
                        >
                          Go to the decision
                        </Link>
                      </p>
                    </Callout>
                  ) : decidedForAnalysis ? (
                    <Callout
                      tone={
                        decidedForAnalysis.status === "rejected" ||
                        decidedForAnalysis.status === "new_analysis_requested"
                          ? "danger"
                          : "success"
                      }
                      title={`${decisionLabel(decidedForAnalysis.status)} by ${decidedForAnalysis.decidedBy?.name ?? "a person"}`}
                    >
                      {decidedForAnalysis.decisionNote ??
                        "Approved without a note — a plain approval needs none."}
                    </Callout>
                  ) : null}

                  <AnalysisWarnings warnings={result.warnings} />

                  <Card title="Summary" description="Factual. It reaches no conclusion.">
                    <p className="text-ink">{result.summary}</p>
                    {result.sufficiency === "more_information_required" ? (
                      <Callout tone="warning" title="More information required">
                        Too little is on file for this to describe the matter rather than the gaps
                        in it. That is a statement about the file, not about the client.
                      </Callout>
                    ) : null}
                  </Card>

                  {result.contradictions.length > 0 ? (
                    <Card
                      title={`Disagreements on the record (${result.contradictions.length})`}
                      description="Both accounts are shown. Orchelio does not choose between them."
                    >
                      <div className="space-y-4">
                        {result.contradictions.map((contradiction) => (
                          <ContradictionCard key={contradiction.key} contradiction={contradiction} />
                        ))}
                      </div>
                    </Card>
                  ) : null}

                  {result.keyFacts.length > 0 ? (
                    <Card
                      title={`Key facts (${result.keyFacts.length})`}
                      description="Each with where it came from and how well it is supported."
                    >
                      <ul className="divide-y divide-line">
                        {result.keyFacts.map((fact) => (
                          <KeyFactRow key={fact.key} fact={fact} />
                        ))}
                      </ul>
                    </Card>
                  ) : null}

                  {result.missingDocuments.length > 0 ? (
                    <Card
                      title={`Documents not on file (${result.missingDocuments.length})`}
                      description="What this kind of matter usually holds, and why."
                    >
                      <ul className="divide-y divide-line">
                        {result.missingDocuments.map((document) => (
                          <li key={document.key} className="py-2.5">
                            <p className="font-medium text-ink">{document.label}</p>
                            <p className="text-sm text-ink-muted">{document.whyItMatters}</p>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ) : null}

                  <div className="grid gap-6 lg:grid-cols-2">
                    {result.attorneyQuestions.length > 0 ? (
                      <Card
                        title="For the attorney"
                        description="Judgements Orchelio must not make."
                      >
                        <QuestionList questions={result.attorneyQuestions} />
                      </Card>
                    ) : null}
                    {result.clientQuestions.length > 0 ? (
                      <Card title="To ask the client" description="Draft questions, not a script.">
                        <QuestionList questions={result.clientQuestions} />
                      </Card>
                    ) : null}
                  </div>

                  {review ? <ReviewPanel review={review} /> : null}

                  {result.featuresQuiet.length > 0 ? (
                    <Card
                      title="Features that found nothing"
                      description="Enabled by this firm, and silent on this matter."
                    >
                      <ul className="divide-y divide-line">
                        {result.featuresQuiet.map((quiet) => (
                          <li key={quiet.feature} className="py-2">
                            <p className="text-sm font-medium text-ink">
                              {aiFeatureLabel(quiet.feature)}
                            </p>
                            <p className="text-sm text-ink-muted">{quiet.because}</p>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 text-sm text-ink-subtle">
                        Listed rather than hidden: &quot;nothing disagreed&quot; and &quot;it never
                        ran&quot; are different answers.
                      </p>
                    </Card>
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {tab === "communications" ? (
        <div className="space-y-6">
          <Callout tone="warning" title="Orchelio sends nothing">
            A draft is text somebody copies out and sends themselves, from their own system, under
            their own name. There is no recipient field, no &quot;sent&quot; status and no
            transport anywhere in this product — and approving a draft does not add one.
          </Callout>

          {communicationProblem ? (
            <Callout tone="danger" title="That draft was not prepared" assertive>
              {communicationProblem}
            </Callout>
          ) : null}
          {query["prepared"] === "1" ? (
            <Callout tone="success" title="Draft prepared, and waiting for a decision">
              Nobody may use these words until an attorney has read them and approved them. That
              rule cannot be switched off.
            </Callout>
          ) : null}

          {canDraft ? (
            <Card
              title="Prepare a draft"
              description="Fictional recipients only. This is a demonstration environment."
            >
              <form method="post" action="/api/communications" className="space-y-4">
                <input type="hidden" name="matterId" value={matter.id} />

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="channel" className="block text-sm font-medium text-ink">
                      Kind
                    </label>
                    <select
                      id="channel"
                      name="channel"
                      className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                    >
                      <option value="email">Email</option>
                      <option value="letter">Letter</option>
                      <option value="note">Internal note</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="subject" className="block text-sm font-medium text-ink">
                      Subject
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      required
                      className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="body" className="block text-sm font-medium text-ink">
                    Text
                  </label>
                  {result && result.clientQuestions.length > 0 ? (
                    <p className="text-xs text-ink-subtle">
                      The analysis prepared {result.clientQuestions.length} question
                      {result.clientQuestions.length === 1 ? "" : "s"} for the client. They are
                      below to copy from — edit them into your own words rather than sending them
                      as they are.
                    </p>
                  ) : null}
                  <textarea
                    id="body"
                    name="body"
                    rows={8}
                    required
                    defaultValue={
                      result && result.clientQuestions.length > 0
                        ? result.clientQuestions
                            .map((question) => `- ${question.question}`)
                            .join("\n")
                        : ""
                    }
                    className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
                >
                  Prepare draft
                </button>
              </form>
            </Card>
          ) : (
            <Callout tone="neutral" title="Read only">
              Your role does not allow preparing a draft.
            </Callout>
          )}

          <Card title={`Drafts (${drafts.length})`}>
            {drafts.length === 0 ? (
              <p className="text-sm text-ink-muted">No draft has been prepared on this matter.</p>
            ) : (
              <ul className="divide-y divide-line">
                {drafts.map((draft) => (
                  <li key={draft.id} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{draft.subject}</p>
                        <p className="text-sm text-ink-muted">
                          {draft.channel} · prepared by {draft.createdBy?.name ?? "Orchelio"} on{" "}
                          {formatDate(draft.createdAt, timezone)}
                        </p>
                      </div>
                      <Badge tone={draft.status === "approved_for_use" ? "success" : "warning"}>
                        {draft.status === "approved_for_use"
                          ? "Approved for use"
                          : "Not approved — do not use"}
                      </Badge>
                    </div>
                    <pre className="mt-2 whitespace-pre-wrap rounded-md border border-line bg-surface-muted px-3 py-2 font-sans text-sm text-ink">
                      {draft.body}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "approvals" ? (
        <div className="space-y-6">
          {raisedId ? (
            <Callout tone="success" title="Raised, and waiting for a person">
              Nothing has happened yet. It will not, until somebody decides.
            </Callout>
          ) : null}

          <Card
            title="What can be asked for on this matter"
            description="Each goes to a person. Two of them cannot be switched off by any firm."
          >
            <div className="flex flex-wrap gap-3">
              {can(actor, "matter.close") && !matter.closedAt ? (
                <form method="post" action="/api/matters/action">
                  <input type="hidden" name="matterId" value={matter.id} />
                  <input type="hidden" name="action" value="close_matter" />
                  <button
                    type="submit"
                    className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
                  >
                    Ask to close this matter
                  </button>
                </form>
              ) : null}

              {can(actor, "deadline.confirm") && matter.nextDeadlineAt ? (
                <form method="post" action="/api/matters/action">
                  <input type="hidden" name="matterId" value={matter.id} />
                  <input type="hidden" name="action" value="deadline_confirmation" />
                  <button
                    type="submit"
                    className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
                  >
                    Ask a person to confirm {formatDate(matter.nextDeadlineAt, timezone)}
                  </button>
                </form>
              ) : null}
            </div>

            {matter.closedAt ? (
              <p className="mt-3 text-sm text-ink-muted">
                This matter was closed on {formatDate(matter.closedAt, timezone)}.
              </p>
            ) : null}
            {!matter.nextDeadlineAt ? (
              <p className="mt-3 text-sm text-ink-subtle">
                No date is recorded on this matter, so there is nothing to confirm. Orchelio never
                calculates one.
              </p>
            ) : null}
          </Card>

          <Card
            title={`Approvals on this matter (${approvals.total})`}
            description={
              approvals.total > approvals.shown.length
                ? `Showing the ${approvals.shown.length} most recent. The full queue is on the approvals screen.`
                : undefined
            }
          >
            {approvals.shown.length === 0 ? (
              <Callout tone="neutral" title="Nothing has been asked for">
                No decision has been requested on this matter.
              </Callout>
            ) : (
              <ul className="space-y-4">
                {approvals.shown.map((approval) => (
                  <ApprovalCard
                    viewerId={session.user.id}
                    requireSeparateApprover={configuration?.requireSeparateApprover ?? false}
                    timezone={timezone}
                    key={approval.id}
                    approval={approval}
                    canDecide={canDecide && isPendingStatus(approval.status)}
                    returnTo={`/matters/${matter.id}?tab=approvals`}
                    focused={raisedId === approval.id}
                  />
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "activity" ? (
        <Card
          title="Activité"
          description="Everything recorded about this matter, most recent first."
        >
          {!can(actor, "firm.audit.view") ? (
            <Callout tone="neutral" title="Not available to your role">
              The activity log is held by firm administrators.
            </Callout>
          ) : matterActivity.length === 0 ? (
            <p className="text-sm text-ink-muted">Nothing recorded about this matter yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {matterActivity.map((event) => (
                <li key={event.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{activityLabel(event.action)}</p>
                      <ActivityStatusBadge status={event.status} />
                    </div>
                    <p className="text-sm text-ink-muted">{event.user?.name ?? "Orchelio"}</p>
                    <ActivityDetail oldValue={event.oldValue} newValue={event.newValue} />
                  </div>
                  <time
                    dateTime={event.createdAt.toISOString()}
                    className="whitespace-nowrap text-xs text-ink-subtle"
                  >
                    {formatMoment(event.createdAt, timezone)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  );
}

/** The firm's own words for a feature, from the onboarding catalogue. */
function aiFeatureLabel(key: string): string {
  const option = AI_FEATURE_OPTIONS.find(
    (candidate) => candidate.key.default === key || candidate.id === key,
  );
  if (option) return option.label;
  // A practice-area variant, e.g. `employment_timeline`.
  const variant = AI_FEATURE_OPTIONS.find((candidate) =>
    Object.values(candidate.key.byPracticeArea ?? {}).includes(key),
  );
  return variant?.label ?? key.split("_").join(" ");
}
