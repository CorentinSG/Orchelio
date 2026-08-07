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
          ← Tous les dossiers
        </Link>
        <p className="mt-2 font-mono text-sm text-ink-subtle">{matter.reference}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-ink">{matter.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={matter.status} />
          <Badge tone="neutral">{matter.matterType.label}</Badge>
          {matter.representationSide ? (
            <Badge tone="brand">{matter.representationSide === "employer" ? "Représente l’employeur" : "Représente le salarié"}</Badge>
          ) : null}
          <Badge tone="warning">Non vérifié</Badge>
        </div>
      </header>

      {justOpened ? (
        <Callout tone="success" title="Le dossier est ouvert">
          <p>
            {`${matter.reference} existe, ${
              filesRecorded === 1 ? "1 fichier y est répertorié" : `${filesRecorded} fichiers y sont répertoriés`
            }${
              Number.isFinite(filesRefused) && filesRefused > 0
                ? `, et ${filesRefused} ${filesRefused === 1 ? "n’était pas" : "n’étaient pas"} d’un type qu’Orchelio accepte`
                : ""
            }.`}
          </p>
          <p className="mt-2">
            {
              "Rien n’a été décidé. Si une analyse a été lancée, c’est un brouillon derrière lequel personne ne s’est rangé tant que vous ne l’avez pas lu."
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
              title="Dossier"
              description={`Enregistré par le cabinet. Rien ici n’est vérifié. ${timezoneNotice(timezone)}`}
            >
              <dl>
                <DataRow label="Client" value={matter.clientProfile?.displayName ?? "Inconnu"} />
                <DataRow label="Type" value={matter.matterType.label} />
                <DataRow
                  label="Avocat responsable"
                  value={matter.responsibleAttorney?.name ?? "Non attribué"}
                />
                <DataRow label="Ouvert le" value={formatDate(matter.openedAt, timezone)} />
                <DataRow
                  label="Prochaine date"
                  value={<UnconfirmedDate value={matter.nextDeadlineAt} now={now} timezone={timezone} />}
                />
                <DataRow label="Dernière activité" value={relativeDays(matter.lastActivityAt, now, timezone)} />
                <DataRow label="Documents" value={matter.documents.length} />
                <DataRow label="Tâches ouvertes" value={openTasks.length} />
              </dl>
            </Card>

            <Card
              title="Documents attendus non reçus"
              description="Une liste de contrôle, pas un jugement."
            >
              {missing.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Chaque document attendu pour ce type de dossier est au dossier.
                </p>
              ) : (
                <ul className="space-y-2">
                  {missing.map((category) => (
                    <li key={category.key} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-ink">{category.label}</span>
                      <Badge tone="warning">Non reçu</Badge>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-sm text-ink-subtle">
                Ceci compare ce qui est au dossier avec ce que ce type de dossier requiert d’habitude.{" "}
                <Link
                  href={`/matters/${matter.id}?tab=analysis`}
                  className="font-medium text-brand underline underline-offset-4"
                >
                  L’analyse
                </Link>{" "}
                dit pourquoi chacun compte — et, comme tout ce qu’elle produit, elle est lue par une
                personne avant d’être utilisée.
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
              ? `Transmis le ${formatDate(matter.intakeResponses[0].submittedAt, timezone)}.`
              : "Aucun questionnaire n’a été enregistré pour ce dossier."
          }
        >
          {Object.keys(intake).length === 0 ? (
            <p className="text-sm text-ink-muted">Rien d’enregistré pour l’instant.</p>
          ) : (
            <>
              <Callout tone="warning" title="Ce que le client a déclaré">
                Ce sont les mots du client, tels qu’enregistrés au questionnaire. Ils ne sont pas
                vérifiés, et là où ils contredisent un document, le désaccord est justement le
                point — il n’est pas tranché ici.
              </Callout>
              <dl className="mt-4">
                {Object.entries(intake).map(([key, value]) => (
                  <DataRow
                    key={key}
                    label={key.split("_").join(" ")}
                    value={String(value ?? "Inconnu")}
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
            <Callout tone="danger" title="Ce document n’a pas été ajouté" assertive>
              {uploadError}
            </Callout>
          ) : null}
          {justAdded && !uploadError ? (
            <Callout tone="success" title="Document enregistré">
              Son nom, son type et sa taille ont été enregistrés. Le fichier lui-même est resté sur votre ordinateur.
            </Callout>
          ) : null}

          {canUpload ? (
            <UploadPanel
              matterId={matter.id}
              categories={categoriesFor(matter.practiceAreaKey)}
            />
          ) : (
            <Callout tone="neutral" title="Lecture seule">
              Votre rôle ne permet pas d’ajouter des documents à un dossier.
            </Callout>
          )}

          <Card title={`Documents (${matter.documents.length})`}>
            {matter.documents.length === 0 ? (
              <p className="text-sm text-ink-muted">Aucun document n’a encore été ajouté.</p>
            ) : (
              <ul className="divide-y divide-line">
                {matter.documents.map((document) => (
                  <li key={document.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{document.filename}</p>
                      <p className="text-sm text-ink-muted">
                        {categoryLabel(matter.practiceAreaKey, document.category)} ·{" "}
                        {fileSize(document.sizeBytes)} · ajouté le {formatDate(document.receivedAt, timezone)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {document.verified ? (
                        <Badge tone="success">Vérifié par une personne</Badge>
                      ) : (
                        <Badge tone="warning">Non vérifié</Badge>
                      )}
                      {canClassify && !document.verified ? (
                        <form method="post" action="/api/documents/verify">
                          <input type="hidden" name="documentId" value={document.id} />
                          <input type="hidden" name="matterId" value={matter.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-line px-3 py-1 text-sm font-medium text-ink hover:bg-surface-muted"
                          >
                            Marquer comme vérifié
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-sm text-ink-subtle">
              Les dépôts sont simulés : seuls le nom, le type et la taille du fichier sont
              enregistrés. Aucun contenu n’est stocké ni lu — il n’y a pas d’OCR dans cette version.
            </p>
          </Card>
        </div>
      ) : null}

      {tab === "tasks" ? (
        <Card title={`Tâches (${openTasks.length} ouvertes)`}>
          {matter.tasks.length === 0 ? (
            <p className="text-sm text-ink-muted">Aucune tâche sur ce dossier.</p>
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
          description="Chaque date de ce dossier, dans l’ordre, avec la provenance de chacune."
        >
          {!canSeeResults ? (
            <Callout tone="neutral" title="Indisponible pour votre rôle">
              Votre rôle n’inclut pas la consultation des résultats d’analyse.
            </Callout>
          ) : !result ? (
            <Callout tone="neutral" title="Pas encore de chronologie">
              <p>
                La chronologie se construit quand une analyse est lancée. Aucune ne l’a encore été
                sur ce dossier.
              </p>
              <p className="mt-2">
                <Link
                  href={`/matters/${matter.id}?tab=analysis`}
                  className="font-medium text-brand underline underline-offset-4"
                >
                  Aller à l’analyse
                </Link>
              </p>
            </Callout>
          ) : result.timeline.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Aucune date de ce dossier n’a pu être lue depuis la fiche ou depuis le nom d’un document.
            </p>
          ) : (
            <>
              <Callout tone="warning" title="Aucune date ici n’est confirmée">
                Une date dont quelqu’un se souvient et une date imprimée sur un avis sont des
                preuves différentes. Chaque entrée dit laquelle elle est, et Orchelio ne confirme
                ni l’une ni l’autre.
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
            <Callout tone="warning" title="Aucune fonction d’IA n’est activée" assertive>
              <p>
                Ce cabinet n’a activé aucune fonction de Claude, donc une analyse n’aurait rien à
                produire. En lancer une remplirait la page de sections vides.
              </p>
              <p className="mt-2">
                <Link
                  href="/onboarding/5"
                  className="font-medium text-brand underline underline-offset-4"
                >
                  Choisir les fonctions que ce cabinet souhaite
                </Link>
              </p>
            </Callout>
          ) : null}

          {!canSeeResults ? (
            <Callout tone="neutral" title="Indisponible pour votre rôle">
              Votre rôle n’inclut pas la consultation des résultats d’analyse.
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
                      Aucune analyse n’a été lancée sur ce dossier.
                    </p>
                  )}

                  {canRunAnalysis ? (
                    <form method="post" action="/api/ai/analyse">
                      <input type="hidden" name="matterId" value={matter.id} />
                      <button
                        type="submit"
                        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
                      >
                        {analysis ? "Relancer l’analyse" : "Lancer l’analyse"}
                      </button>
                    </form>
                  ) : null}
                </div>

                {enabledAiFeatures.length > 0 ? (
                  <p className="mt-4 text-sm text-ink-subtle">
                    Ce cabinet a demandé à Claude : {enabledAiFeatures.map(aiFeatureLabel).join(", ")}.
                    Une analyse ne produit que cela.
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
                    Non demandé, donc non produit : {unusedAiFeatures.map(aiFeatureLabel).join(", ")}.{" "}
                    <Link
                      href="/onboarding/5"
                      className="font-medium text-brand underline underline-offset-4"
                    >
                      Changer ce que ce cabinet demande
                    </Link>
                  </p>
                ) : null}
              </Card>

              {result ? (
                <>
                  {/* Whether anybody has taken responsibility for this, said
                      before the analysis rather than after it. */}
                  {pendingForAnalysis ? (
                    <Callout tone="warning" title="Personne n’a encore validé ceci">
                      <p>
                        Une décision attend. Tant que personne ne prend la responsabilité de cette
                        analyse, c’est un brouillon derrière lequel personne ne s’est rangé.
                      </p>
                      <p className="mt-2">
                        <Link
                          href={`/matters/${matter.id}?tab=approvals`}
                          className="font-medium text-brand underline underline-offset-4"
                        >
                          Aller à la décision
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
                      title={`${decisionLabel(decidedForAnalysis.status)} par ${decidedForAnalysis.decidedBy?.name ?? "une personne"}`}
                    >
                      {decidedForAnalysis.decisionNote ??
                        "Validé sans note — une validation simple n’en demande pas."}
                    </Callout>
                  ) : null}

                  <AnalysisWarnings warnings={result.warnings} />

                  <Card title="Résumé" description="Factuel. Il ne conclut rien.">
                    <p className="text-ink">{result.summary}</p>
                    {result.sufficiency === "more_information_required" ? (
                      <Callout tone="warning" title="Informations supplémentaires requises">
                        Il y a trop peu au dossier pour décrire l’affaire plutôt que ses manques.
                        C’est un constat sur le dossier, pas sur le client.
                      </Callout>
                    ) : null}
                  </Card>

                  {result.contradictions.length > 0 ? (
                    <Card
                      title={`Désaccords au dossier (${result.contradictions.length})`}
                      description="Les deux versions sont montrées. Orchelio ne choisit pas entre elles."
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
                      title={`Faits clés (${result.keyFacts.length})`}
                      description="Chacun avec sa provenance et son niveau d’appui."
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
                      title={`Documents absents du dossier (${result.missingDocuments.length})`}
                      description="Ce que ce type de dossier contient d’habitude, et pourquoi."
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
                        title="Pour l’avocat"
                        description="Les jugements qu’Orchelio ne doit pas porter."
                      >
                        <QuestionList questions={result.attorneyQuestions} />
                      </Card>
                    ) : null}
                    {result.clientQuestions.length > 0 ? (
                      <Card title="À demander au client" description="Des questions rédigées, pas un script.">
                        <QuestionList questions={result.clientQuestions} />
                      </Card>
                    ) : null}
                  </div>

                  {review ? <ReviewPanel review={review} /> : null}

                  {result.featuresQuiet.length > 0 ? (
                    <Card
                      title="Fonctions restées silencieuses"
                      description="Activées par ce cabinet, sans rien trouver sur ce dossier."
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
                        Listées plutôt que cachées : « rien ne se contredit » et « elle n’a jamais
                        tourné » sont deux réponses différentes.
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
          <Callout tone="warning" title="Orchelio n’envoie rien">
            Un brouillon est un texte que quelqu’un copie et envoie lui-même, depuis son propre
            système, sous son propre nom. Il n’y a ni champ destinataire, ni statut « envoyé »,
            ni transport nulle part dans ce produit — et valider un brouillon n’en ajoute pas.
          </Callout>

          {communicationProblem ? (
            <Callout tone="danger" title="Ce brouillon n’a pas été préparé" assertive>
              {communicationProblem}
            </Callout>
          ) : null}
          {query["prepared"] === "1" ? (
            <Callout tone="success" title="Brouillon préparé, en attente d’une décision">
              Personne ne peut utiliser ces mots tant qu’un avocat ne les a pas lus et validés.
              Cette règle ne peut pas être désactivée.
            </Callout>
          ) : null}

          {canDraft ? (
            <Card
              title="Préparer un brouillon"
              description="Destinataires fictifs uniquement. Ceci est un environnement de démonstration."
            >
              <form method="post" action="/api/communications" className="space-y-4">
                <input type="hidden" name="matterId" value={matter.id} />

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="channel" className="block text-sm font-medium text-ink">
                      Nature
                    </label>
                    <select
                      id="channel"
                      name="channel"
                      className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                    >
                      <option value="email">Courriel</option>
                      <option value="letter">Courrier</option>
                      <option value="note">Note interne</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="subject" className="block text-sm font-medium text-ink">
                      Objet
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
                    Texte
                  </label>
                  {result && result.clientQuestions.length > 0 ? (
                    <p className="text-xs text-ink-subtle">
                      L’analyse a préparé {result.clientQuestions.length} question
                      {result.clientQuestions.length === 1 ? "" : "s"} pour le client. Elles sont
                      ci-dessous pour vous en inspirer — réécrivez-les dans vos propres mots plutôt
                      que de les envoyer telles quelles.
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
                  Préparer le brouillon
                </button>
              </form>
            </Card>
          ) : (
            <Callout tone="neutral" title="Lecture seule">
              Votre rôle ne permet pas de préparer un brouillon.
            </Callout>
          )}

          <Card title={`Brouillons (${drafts.length})`}>
            {drafts.length === 0 ? (
              <p className="text-sm text-ink-muted">Aucun brouillon n’a été préparé sur ce dossier.</p>
            ) : (
              <ul className="divide-y divide-line">
                {drafts.map((draft) => (
                  <li key={draft.id} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{draft.subject}</p>
                        <p className="text-sm text-ink-muted">
                          {draft.channel} · préparé par {draft.createdBy?.name ?? "Orchelio"} le{" "}
                          {formatDate(draft.createdAt, timezone)}
                        </p>
                      </div>
                      <Badge tone={draft.status === "approved_for_use" ? "success" : "warning"}>
                        {draft.status === "approved_for_use"
                          ? "Validé pour usage"
                          : "Non validé — ne pas utiliser"}
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
            <Callout tone="success" title="Demandé, en attente d’une personne">
              Rien ne s’est encore produit. Rien ne se produira tant que personne n’a décidé.
            </Callout>
          ) : null}

          <Card
            title="Ce qui peut être demandé sur ce dossier"
            description="Chaque demande va à une personne. Deux d’entre elles ne peuvent être désactivées par aucun cabinet."
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
                    Demander la clôture de ce dossier
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
                    Demander à une personne de confirmer le {formatDate(matter.nextDeadlineAt, timezone)}
                  </button>
                </form>
              ) : null}
            </div>

            {matter.closedAt ? (
              <p className="mt-3 text-sm text-ink-muted">
                Ce dossier a été clos le {formatDate(matter.closedAt, timezone)}.
              </p>
            ) : null}
            {!matter.nextDeadlineAt ? (
              <p className="mt-3 text-sm text-ink-subtle">
                Aucune date n’est enregistrée sur ce dossier, il n’y a donc rien à confirmer.
                Orchelio n’en calcule jamais.
              </p>
            ) : null}
          </Card>

          <Card
            title={`Validations sur ce dossier (${approvals.total})`}
            description={
              approvals.total > approvals.shown.length
                ? `Les ${approvals.shown.length} plus récentes. La file complète est sur l’écran des validations.`
                : undefined
            }
          >
            {approvals.shown.length === 0 ? (
              <Callout tone="neutral" title="Rien n’a été demandé">
                Aucune décision n’a été sollicitée sur ce dossier.
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
          description="Tout ce qui a été enregistré sur ce dossier, du plus récent au plus ancien."
        >
          {!can(actor, "firm.audit.view") ? (
            <Callout tone="neutral" title="Indisponible pour votre rôle">
              Le journal d’activité est réservé aux administrateurs du cabinet.
            </Callout>
          ) : matterActivity.length === 0 ? (
            <p className="text-sm text-ink-muted">Rien d’enregistré sur ce dossier pour l’instant.</p>
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
