import Link from "next/link";

import { Badge, Callout, Card, CommandLine, DataRow } from "@/components/ui";
import { CheckboxOption, Field, inputClass } from "@/components/onboarding-ui";
import { ConfidentialityReport } from "@/components/confidentiality-ui";
import {
  AccentChoice,
  LockedRules,
  MemberList,
  ReadOnlyNotice,
  SaveBar,
  SettingsTabs,
  type MemberRow,
} from "@/components/settings-ui";
import { requireWorkspacePermission } from "@/lib/auth/workspace";
import { actorFor } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { firmConfiguration } from "@/lib/data/firms";
import { allFirmMembers, countDeciders, readBranding } from "@/lib/data/settings";
import { separationReadiness } from "@/lib/approvals/separation";
import { matterTypeOptions } from "@/lib/data/onboarding";
import { demonstrationInventory, sampleMattersFor } from "@/lib/data/demo";
import { parseJsonObject, parseStringArray } from "@/lib/json-field";
import {
  AI_FEATURE_OPTIONS,
  CONFIGURABLE_APPROVAL_OPTIONS,
  CURRENCIES,
  JURISDICTIONS,
  LANGUAGES,
  LOCKED_APPROVAL_OPTIONS,
  TIMEZONES,
} from "@/lib/onboarding/catalogue";
import { aiFeatureIdsFrom } from "@/lib/onboarding/config";
import { practiceAreaLabel } from "@/lib/practice-areas";
import {
  SETTINGS_SECTIONS,
  firmDisplayName,
  settingsSection,
} from "@/lib/settings/config";
import { APP_NAME } from "@/lib/app-config";

export const metadata = { title: "Firm settings" };
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(query: Record<string, string | string[] | undefined>, key: string): string | null {
  const value = query[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === "string" ? value : null;
}

/**
 * Orchelio — firm settings.
 *
 * The questionnaire asks seven questions in order, once. This screen lets an
 * administrator change one answer without revisiting the other six, and writes
 * to the same record through the same builders — so a firm configured here and
 * a firm configured there are the same kind of firm.
 *
 * One answer is deliberately not changeable: the main practice area. Changing
 * it re-derives the matter types, the workflow vocabulary, the AI feature keys
 * and the dashboard widgets, and a settings tab that silently rewrote four
 * other tabs would be the wrong shape for that. The questionnaire does it, and
 * this screen links to the questionnaire.
 */
export default async function SettingsPage({ searchParams }: PageProps) {
  const { session, firm, scope } = await requireWorkspacePermission(
    "/settings",
    "firm.settings.view",
  );

  const query = await searchParams;
  const section = settingsSection(one(query, "section") ?? undefined);
  const error = one(query, "error");
  const saved = one(query, "saved") === "1";
  const added = one(query, "added");
  const skipped = one(query, "skipped");

  const actor = actorFor(session.user, firm.id);
  const canEdit = can(actor, "firm.settings.edit");
  const canManagePeople = can(actor, "firm.users.manage");

  const [configuration, members, branding, deciders] = await Promise.all([
    firmConfiguration(scope),
    allFirmMembers(scope),
    readBranding(scope),
    countDeciders(scope),
  ]);
  const readiness = separationReadiness(deciders);

  const practiceAreas = parseStringArray(configuration?.practiceAreas);
  const chosenMatterTypes = new Set(parseStringArray(configuration?.matterTypes));
  const aiFeatureIds = new Set(
    aiFeatureIdsFrom(
      parseStringArray(configuration?.aiFeatures),
      configuration?.primaryPracticeArea ?? firm.primaryPracticeArea,
    ),
  );
  const approvals = new Set(
    Object.entries(parseJsonObject(configuration?.approvals))
      .filter(([, required]) => required === true)
      .map(([key]) => key),
  );

  const matterTypes = await matterTypeOptions(
    practiceAreas.length > 0 ? practiceAreas : [firm.primaryPracticeArea],
  );

  const memberRows: MemberRow[] = members.map((membership) => ({
    membershipId: membership.id,
    name: membership.user.name,
    email: membership.user.email,
    role: membership.role,
    status: membership.status,
    lastLoginAt: membership.user.lastLoginAt,
    isSelf: membership.user.id === session.user.id,
  }));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">{firm.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Firm settings</h1>
        <p className="mt-1 text-ink-muted">
          What this firm handles, what it lets the assistant do, and who may use it.
        </p>
      </header>

      {error ? (
        <Callout tone="danger" title="That change was not saved" assertive>
          {error}
        </Callout>
      ) : null}
      {saved ? (
        <Callout tone="success" title="Saved">
          The change applies immediately and is recorded in the activity log.
        </Callout>
      ) : null}

      {!canEdit ? <ReadOnlyNotice what={`You hold a role in ${firm.name} that can read the settings.`} /> : null}

      <SettingsTabs active={section.slug} />

      <Card title={section.title} description={section.description}>
        {/* --- Profile ------------------------------------------------- */}
        {section.slug === "profile" ? (
          <form method="post" action="/api/settings" className="space-y-4">
            <input type="hidden" name="section" value="profile" />

            <Field label="Firm name" htmlFor="firmName">
              <input
                id="firmName"
                name="firmName"
                defaultValue={firm.name}
                required
                disabled={!canEdit}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Administrator" htmlFor="contactName">
                <input
                  id="contactName"
                  name="contactName"
                  defaultValue={configuration?.contactName ?? ""}
                  required
                  disabled={!canEdit}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Administrator email"
                htmlFor="contactEmail"
                hint="Fictional. Orchelio sends nothing to it, or to anywhere else."
              >
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  defaultValue={configuration?.contactEmail ?? ""}
                  required
                  disabled={!canEdit}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="People using Orchelio" htmlFor="userCount">
                <input
                  id="userCount"
                  name="userCount"
                  type="number"
                  min={1}
                  defaultValue={configuration?.userCount ?? 5}
                  disabled={!canEdit}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Primary jurisdiction"
                htmlFor="jurisdiction"
                hint="Recorded, never used to reach a legal conclusion."
              >
                <select
                  id="jurisdiction"
                  name="jurisdiction"
                  defaultValue={configuration?.jurisdiction ?? "NY"}
                  disabled={!canEdit}
                  className={inputClass}
                >
                  {JURISDICTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Language" htmlFor="language">
                <select
                  id="language"
                  name="language"
                  defaultValue={configuration?.language ?? "en"}
                  disabled={!canEdit}
                  className={inputClass}
                >
                  {LANGUAGES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Timezone" htmlFor="timezone">
                <select
                  id="timezone"
                  name="timezone"
                  defaultValue={configuration?.timezone ?? "America/New_York"}
                  disabled={!canEdit}
                  className={inputClass}
                >
                  {TIMEZONES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Currency" htmlFor="currency">
                <select
                  id="currency"
                  name="currency"
                  defaultValue={configuration?.currency ?? "USD"}
                  disabled={!canEdit}
                  className={inputClass}
                >
                  {CURRENCIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Callout tone="neutral" title="The main practice area is not changed here">
              <p>
                {firm.name} is set up as a {practiceAreaLabel(firm.primaryPracticeArea).toLowerCase()}{" "}
                firm. Changing that re-derives the matter types, the workflow vocabulary, the AI
                features and the dashboard — so it is the questionnaire&apos;s job, not a field on
                this page.
              </p>
              <p className="mt-2">
                <Link href="/onboarding" className="font-medium text-brand underline underline-offset-4">
                  Re-run the setup questionnaire
                </Link>{" "}
                — it keeps every answer already given.
              </p>
            </Callout>

            {canEdit ? <SaveBar /> : null}
          </form>
        ) : null}

        {/* --- Matter types -------------------------------------------- */}
        {section.slug === "matter-types" ? (
          <form method="post" action="/api/settings">
            <input type="hidden" name="section" value="matter-types" />
            <p className="mb-4 text-sm text-ink-muted">
              These are the kinds of matter this firm can open. Unticking one does not touch matters
              already open under it — nothing in Orchelio deletes a matter.
            </p>
            {matterTypes.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No matter types are available for this firm&apos;s practice areas yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {matterTypes.map((type) => (
                  <CheckboxOption
                    key={type.key}
                    name="matterTypes"
                    value={type.key}
                    label={type.label}
                    description={practiceAreaLabel(type.practiceAreaKey)}
                    defaultChecked={chosenMatterTypes.has(type.key)}
                  />
                ))}
              </ul>
            )}
            {canEdit ? <SaveBar /> : null}
          </form>
        ) : null}

        {/* --- AI features --------------------------------------------- */}
        {section.slug === "ai" ? (
          <form method="post" action="/api/settings">
            <input type="hidden" name="section" value="ai" />
            <p className="mb-4 text-sm text-ink-muted">
              Every feature below is simulated in this build and costs nothing to run. Switching one
              off removes it from the workspace — and removes the dashboard card that depended on
              it, rather than leaving the card showing zero.
            </p>
            <ul className="space-y-2">
              {AI_FEATURE_OPTIONS.map((option) => (
                <CheckboxOption
                  key={option.id}
                  name="aiFeatureIds"
                  value={option.id}
                  label={option.label}
                  description={option.description}
                  defaultChecked={aiFeatureIds.has(option.id)}
                />
              ))}
            </ul>
            {canEdit ? <SaveBar /> : null}
          </form>
        ) : null}

        {/* --- Approvals ------------------------------------------------ */}
        {section.slug === "approvals" ? (
          <div className="space-y-6">
            <form method="post" action="/api/settings">
              <input type="hidden" name="section" value="approvals" />
              <h3 className="text-sm font-semibold text-ink">Rules this firm chooses</h3>
              <p className="mb-3 mt-0.5 text-sm text-ink-muted">
                When one of these is on, the action creates a request instead of taking effect, and
                a person decides.
              </p>
              <ul className="space-y-2">
                {CONFIGURABLE_APPROVAL_OPTIONS.map((option) => (
                  <CheckboxOption
                    key={option.key}
                    name="approvalKeys"
                    value={option.key}
                    label={option.label}
                    description={option.description}
                    defaultChecked={approvals.has(option.key)}
                  />
                ))}
              </ul>
              <div className="mt-5 border-t border-line pt-4">
                <h3 className="text-sm font-semibold text-ink">Who may decide</h3>
                <p className="mb-3 mt-0.5 text-sm text-ink-muted">
                  An approval you grant yourself records that a person looked, and that person is
                  you. {readiness.note}
                </p>
                <ul className="space-y-2">
                  <CheckboxOption
                    name="requireSeparateApprover"
                    value="on"
                    label="A request must be decided by somebody other than the person who raised it"
                    description={
                      readiness.workable
                        ? "Refused on the server, not merely hidden. The requester is named on every card whether this is on or off."
                        : "Not workable for this firm yet — turning it on would make every request undecidable."
                    }
                    defaultChecked={configuration?.requireSeparateApprover ?? false}
                  />
                </ul>
              </div>

              {canEdit ? <SaveBar /> : null}
            </form>

            <div>
              <h3 className="text-sm font-semibold text-ink">
                The {LOCKED_APPROVAL_OPTIONS.length} rules nobody can switch off
              </h3>
              <p className="mb-3 mt-0.5 text-sm text-ink-muted">
                These are safety properties of {APP_NAME}, not preferences. There is no control
                here to turn one off, no form field that submits one, and no value in this
                firm&apos;s configuration that changes the answer — the server writes them in
                whatever arrives.
              </p>
              <LockedRules rules={LOCKED_APPROVAL_OPTIONS} />
            </div>
          </div>
        ) : null}

        {/* --- People --------------------------------------------------- */}
        {section.slug === "people" ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">
              A role decides what somebody may do, not what they may see: every screen asks for a
              permission, so a paralegal and an attorney see the same matters and can do different
              things with them.
            </p>
            <MemberList members={memberRows} canManage={canManagePeople} />
            {!canManagePeople ? (
              <p className="text-sm text-ink-subtle">
                Changing a role belongs to a firm administrator.
              </p>
            ) : null}
            <Callout tone="neutral" title="Inviting somebody new is not offered">
              An invitation is an email, and Orchelio has no way to send one — there is no transport
              anywhere in the product. In this demonstration, accounts come from the seed or from
              the platform administration screen.
            </Callout>
          </div>
        ) : null}

        {/* --- Branding ------------------------------------------------- */}
        {section.slug === "branding" ? (
          <form method="post" action="/api/settings" className="space-y-4">
            <input type="hidden" name="section" value="branding" />

            <Field
              label="Display name"
              htmlFor="displayName"
              hint={`How this firm names itself in its own sidebar. Leave empty to use "${firm.name}".`}
            >
              <input
                id="displayName"
                name="displayName"
                maxLength={80}
                defaultValue={branding.displayName}
                disabled={!canEdit}
                className={inputClass}
              />
            </Field>

            <div>
              <p className="text-sm font-medium text-ink">Accent colour</p>
              <p className="mb-2 mt-0.5 text-sm text-ink-muted">
                A fixed palette rather than a colour picker: an arbitrary colour can fail contrast
                against the text placed on it, and this one has to stay legible in both themes.
              </p>
              <AccentChoice selected={branding.accent} />
            </div>

            <Callout tone="neutral" title={`${APP_NAME} is not white-labelled`}>
              A firm brands itself here, not the product. The product name, the demonstration
              banner and the interface stay {APP_NAME}&apos;s — a screen that presented itself as
              the firm&apos;s own software would be claiming something untrue about who wrote it.
            </Callout>

            {/* A definition row belongs inside a definition list. Loose
                <dt>/<dd> elements are read as ordinary text. */}
            <dl>
              <DataRow
                label="Shown in the sidebar as"
                value={firmDisplayName(branding, firm.name)}
              />
            </dl>

            {canEdit ? <SaveBar /> : null}
          </form>
        ) : null}

        {/* --- Confidentiality ------------------------------------------- */}
        {section.slug === "confidentiality" ? (
          <ConfidentialityReport firmName={firm.name} />
        ) : null}

        {/* --- Demonstration -------------------------------------------- */}
        {section.slug === "demonstration" ? (
          <DemonstrationSection
            firmName={firm.name}
            primaryPracticeArea={configuration?.primaryPracticeArea ?? firm.primaryPracticeArea}
            matterTypes={[...chosenMatterTypes]}
            inventory={await demonstrationInventory(scope)}
            canEdit={canEdit}
            added={added}
            skipped={skipped}
          />
        ) : null}
      </Card>

      <Card title="What each section changes" description="So a tab is not a mystery before it is opened.">
        <dl>
          {SETTINGS_SECTIONS.map((entry) => (
            <DataRow key={entry.slug} label={entry.title} value={entry.changes} />
          ))}
        </dl>
      </Card>
    </div>
  );
}

/**
 * The demonstration tab.
 *
 * Additive controls only. Adding fictional matters is offered; erasing them is
 * not, and the screen says where that lives instead of pretending it does not
 * exist — see ADR-0016.
 */
function DemonstrationSection({
  firmName,
  primaryPracticeArea,
  matterTypes,
  inventory,
  canEdit,
  added,
  skipped,
}: {
  firmName: string;
  primaryPracticeArea: string;
  matterTypes: readonly string[];
  inventory: Awaited<ReturnType<typeof demonstrationInventory>>;
  canEdit: boolean;
  added: string | null;
  skipped: string | null;
}) {
  const { available, notOffered } = sampleMattersFor(primaryPracticeArea, matterTypes);

  return (
    <div className="space-y-5">
      {added !== null ? (
        <Callout tone="success" title="Sample data added">
          {added} matter(s) created
          {skipped && Number(skipped) > 0 ? `, ${skipped} already present and left untouched` : ""}.
        </Callout>
      ) : null}

      <dl>
        <DataRow label="Matters" value={inventory.matters} />
        <DataRow label="Clients" value={inventory.clients} />
        <DataRow label="Documents" value={inventory.documents} />
        <DataRow label="Analyses" value={inventory.analyses} />
        <DataRow label="Approval requests" value={inventory.approvals} />
        <DataRow label="Tasks" value={inventory.tasks} />
      </dl>

      <div>
        <h3 className="text-sm font-semibold text-ink">Add sample matters</h3>
        <p className="mt-0.5 text-sm text-ink-muted">
          The same fictional matters the demonstration ships with, added to {firmName}. Every
          person, employer, date and document in them is invented. A matter whose reference already
          exists is skipped, so this is safe to press twice.
        </p>

        {available.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            {notOffered.length > 0
              ? "There are sample matters for this practice area, but none of their matter types are switched on for this firm. Turn one on under Matter types."
              : "No sample matters exist for this practice area."}
          </p>
        ) : (
          <>
            <ul className="mt-3 space-y-1 text-sm text-ink-muted">
              {available.map((matter) => (
                <li key={matter.reference}>
                  <span className="font-mono text-xs text-ink-subtle">{matter.reference}</span>{" "}
                  {matter.title} — <span className="italic">{matter.demonstrates}</span>
                </li>
              ))}
            </ul>
            {notOffered.length > 0 ? (
              <p className="mt-2 text-sm text-ink-subtle">
                {notOffered.length} further sample matter(s) are not offered, because this firm does
                not have their matter type switched on.
              </p>
            ) : null}
            {canEdit ? (
              <form method="post" action="/api/demo/sample-data" className="mt-4">
                <button
                  type="submit"
                  className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-strong"
                >
                  Add {available.length} sample matter(s)
                </button>
              </form>
            ) : null}
          </>
        )}
      </div>

      <div className="border-t border-line pt-4">
        <h3 className="text-sm font-semibold text-ink">
          Erasing demonstration data has no button <Badge tone="warning">deliberate</Badge>
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          Deleting everything is a real, irreversible action, and one of the nine locked rules says
          nothing is ever permanently deleted without a person. A button in a web page is a weaker
          form of consent than a command somebody types on purpose, so this is where the
          demonstration reset lives:
        </p>
        <div className="mt-2">
          <CommandLine>npm run reset-demo</CommandLine>
        </div>
        <p className="mt-2 text-sm text-ink-subtle">
          It erases every firm on this instance and re-seeds the demonstration. It is not scoped to
          one firm, and it cannot be undone.
        </p>
      </div>
    </div>
  );
}
