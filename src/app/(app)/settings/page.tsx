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
import { providerNotice } from "@/lib/ai/notice";
import { serverEnv } from "@/lib/env";

export const metadata = { title: "Réglages du cabinet" };
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
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Réglages du cabinet</h1>
        <p className="mt-1 text-ink-muted">
          Ce que ce cabinet traite, ce qu’il autorise l’assistant à faire, et qui peut s’en servir.
        </p>
      </header>

      {error ? (
        <Callout tone="danger" title="Cette modification n’a pas été enregistrée" assertive>
          {error}
        </Callout>
      ) : null}
      {saved ? (
        <Callout tone="success" title="Enregistré">
          La modification s’applique immédiatement et figure au journal d’activité.
        </Callout>
      ) : null}

      {!canEdit ? <ReadOnlyNotice what={`Votre rôle dans ${firm.name} permet de consulter les réglages.`} /> : null}

      <SettingsTabs active={section.slug} />

      <Card title={section.title} description={section.description}>
        {/* --- Profile ------------------------------------------------- */}
        {section.slug === "profile" ? (
          <form method="post" action="/api/settings" className="space-y-4">
            <input type="hidden" name="section" value="profile" />

            <Field label="Nom du cabinet" htmlFor="firmName">
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
              <Field label="Administrateur" htmlFor="contactName">
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
                label="E-mail de l’administrateur"
                htmlFor="contactEmail"
                hint="Fictif. Orchelio n’y envoie rien, ni nulle part ailleurs."
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
              <Field label="Personnes utilisant Orchelio" htmlFor="userCount">
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
                label="Ressort principal"
                htmlFor="jurisdiction"
                hint="Enregistré, jamais utilisé pour tirer une conclusion juridique."
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
              <Field label="Langue" htmlFor="language" hint="L’interface est en français. Ce choix est enregistré, et rien ne le lit encore — l’anglais n’est pas disponible.">
                <select
                  id="language"
                  name="language"
                  defaultValue={configuration?.language ?? "fr"}
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
              <Field label="Fuseau horaire" htmlFor="timezone" hint="Chaque date et heure affichée par Orchelio est donnée dans ce fuseau.">
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
              <Field label="Devise" htmlFor="currency" hint="Utilisée sur l’écran Consommation et coûts. Orchelio ne facture rien.">
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

            <Callout tone="neutral" title="Le domaine principal ne se change pas ici">
              <p>
                {firm.name} est installé comme cabinet de{" "}
                {practiceAreaLabel(firm.primaryPracticeArea).toLowerCase()}. En changer redérive les
                types de dossier, le vocabulaire des déroulés, les fonctions d’IA et le tableau de
                bord — c’est donc le travail du questionnaire, pas d’un champ sur cette page.
              </p>
              <p className="mt-2">
                <Link href="/onboarding" className="font-medium text-brand underline underline-offset-4">
                  Reprendre le questionnaire d’installation
                </Link>{" "}
                — il conserve chaque réponse déjà donnée.
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
              Ce sont les types de dossier que ce cabinet peut ouvrir. En décocher un ne touche pas
              aux dossiers déjà ouverts sous ce type — rien dans Orchelio ne supprime un dossier.
            </p>
            {matterTypes.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Aucun type de dossier n’est encore disponible pour les domaines de ce cabinet.
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
            <p className="mb-4 text-sm text-ink-muted">{providerNotice(serverEnv()).featuresNote}</p>
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
              <h3 className="text-sm font-semibold text-ink">Les règles que ce cabinet choisit</h3>
              <p className="mb-3 mt-0.5 text-sm text-ink-muted">
                Quand l’une d’elles est active, l’action crée une demande au lieu de prendre effet,
                et une personne décide.
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
                <h3 className="text-sm font-semibold text-ink">Qui peut décider</h3>
                <p className="mb-3 mt-0.5 text-sm text-ink-muted">
                  Une validation que vous vous accordez à vous-même enregistre qu’une personne a
                  regardé, et cette personne, c’est vous. {readiness.note}
                </p>
                <ul className="space-y-2">
                  <CheckboxOption
                    name="requireSeparateApprover"
                    value="on"
                    label="Une demande doit être décidée par quelqu’un d’autre que la personne qui l’a formée"
                    description={
                      readiness.workable
                        ? "Refusé par le serveur, pas seulement masqué. Le demandeur est nommé sur chaque carte, que ce réglage soit actif ou non."
                        : "Pas encore praticable dans ce cabinet — l’activer rendrait toute demande indécidable."
                    }
                    defaultChecked={configuration?.requireSeparateApprover ?? false}
                  />
                </ul>
              </div>

              {canEdit ? <SaveBar /> : null}
            </form>

            <div>
              <h3 className="text-sm font-semibold text-ink">
                Les {LOCKED_APPROVAL_OPTIONS.length} règles que personne ne peut désactiver
              </h3>
              <p className="mb-3 mt-0.5 text-sm text-ink-muted">
                Ce sont des propriétés de sûreté d’{APP_NAME}, pas des préférences. Il n’y a ici
                aucun contrôle pour en désactiver une, aucun champ de formulaire qui en soumette
                une, et aucune valeur dans la configuration de ce cabinet qui change la réponse —
                le serveur les inscrit quoi qu’il reçoive.
              </p>
              <LockedRules rules={LOCKED_APPROVAL_OPTIONS} />
            </div>
          </div>
        ) : null}

        {/* --- People --------------------------------------------------- */}
        {section.slug === "people" ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">
              Un rôle décide de ce qu’une personne peut faire, pas de ce qu’elle peut voir : chaque
              écran demande une permission, donc un assistant juridique et un avocat voient les
              mêmes dossiers et peuvent en faire des choses différentes.
            </p>
            <MemberList members={memberRows} canManage={canManagePeople} />
            {!canManagePeople ? (
              <p className="text-sm text-ink-subtle">
                Changer un rôle relève de l’administrateur du cabinet.
              </p>
            ) : null}
            <Callout tone="neutral" title="Inviter quelqu’un n’est pas proposé">
              Une invitation est un courriel, et Orchelio n’a aucun moyen d’en envoyer un — il n’y a
              aucun transport nulle part dans le produit. Dans cette démonstration, les comptes
              viennent des données d’exemple ou de l’écran d’administration de la plateforme.
            </Callout>
          </div>
        ) : null}

        {/* --- Branding ------------------------------------------------- */}
        {section.slug === "branding" ? (
          <form method="post" action="/api/settings" className="space-y-4">
            <input type="hidden" name="section" value="branding" />

            <Field
              label="Nom affiché"
              htmlFor="displayName"
              hint={`Comment ce cabinet se nomme dans sa propre barre latérale. Laissez vide pour utiliser « ${firm.name} ».`}
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
              <p className="text-sm font-medium text-ink">Couleur d’accent</p>
              <p className="mb-2 mt-0.5 text-sm text-ink-muted">
                Une palette fixe plutôt qu’un sélecteur de couleur : une couleur arbitraire peut
                échouer au contraste avec le texte posé dessus, et celle-ci doit rester lisible dans
                les deux thèmes.
              </p>
              <AccentChoice selected={branding.accent} />
            </div>

            <Callout tone="neutral" title={`${APP_NAME} n’est pas en marque blanche`}>
              Un cabinet appose ici sa marque, pas celle du produit. Le nom du produit, la bannière
              de démonstration et l’interface restent ceux d’{APP_NAME} — un écran qui se
              présenterait comme le logiciel propre au cabinet affirmerait quelque chose de faux sur
              qui l’a écrit.
            </Callout>

            {/* A definition row belongs inside a definition list. Loose
                <dt>/<dd> elements are read as ordinary text. */}
            <dl>
              <DataRow
                label="Affiché dans la barre latérale comme"
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

      <Card title="Ce que chaque section change" description="Pour qu’un onglet ne soit pas une énigme avant d’être ouvert.">
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
        <Callout tone="success" title="Données d’exemple ajoutées">
          {added} dossier(s) créé(s)
          {skipped && Number(skipped) > 0 ? `, ${skipped} déjà présent(s) et laissé(s) intact(s)` : ""}.
        </Callout>
      ) : null}

      <dl>
        <DataRow label="Dossiers" value={inventory.matters} />
        <DataRow label="Clients" value={inventory.clients} />
        <DataRow label="Documents" value={inventory.documents} />
        <DataRow label="Analyses" value={inventory.analyses} />
        <DataRow label="Demandes de validation" value={inventory.approvals} />
        <DataRow label="Tâches" value={inventory.tasks} />
      </dl>

      <div>
        <h3 className="text-sm font-semibold text-ink">Ajouter des dossiers d’exemple</h3>
        <p className="mt-0.5 text-sm text-ink-muted">
          Les mêmes dossiers fictifs que ceux livrés avec la démonstration, ajoutés à {firmName}.
          Chaque personne, employeur, date et document y est inventé. Un dossier dont la référence
          existe déjà est ignoré : vous pouvez appuyer deux fois sans risque.
        </p>

        {available.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            {notOffered.length > 0
              ? "Des dossiers d’exemple existent pour ce domaine, mais aucun de leurs types de dossier n’est activé pour ce cabinet. Activez-en un dans Types de dossier."
              : "Aucun dossier d’exemple n’existe pour ce domaine."}
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
                {notOffered.length} autre(s) dossier(s) d’exemple ne sont pas proposés, parce que ce
                cabinet n’a pas activé leur type de dossier.
              </p>
            ) : null}
            {canEdit ? (
              <form method="post" action="/api/demo/sample-data" className="mt-4">
                <button
                  type="submit"
                  className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-strong"
                >
                  Ajouter {available.length} dossier(s) d’exemple
                </button>
              </form>
            ) : null}
          </>
        )}
      </div>

      <div className="border-t border-line pt-4">
        <h3 className="text-sm font-semibold text-ink">
          Effacer les données de démonstration n’a pas de bouton{" "}
          <Badge tone="warning">délibéré</Badge>
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          Tout supprimer est une action réelle et irréversible, et l’une des neuf règles verrouillées
          dit que rien n’est jamais supprimé définitivement sans une personne. Un bouton dans une
          page web est une forme de consentement plus faible qu’une commande que quelqu’un tape
          exprès : voilà donc où vit la réinitialisation de la démonstration.
        </p>
        <div className="mt-2">
          <CommandLine>npm run reset-demo</CommandLine>
        </div>
        <p className="mt-2 text-sm text-ink-subtle">
          Elle efface tous les cabinets de cette instance et réinstalle les données de
          démonstration. Elle n’est pas limitée à un seul cabinet, et elle est irréversible.
        </p>
      </div>
    </div>
  );
}
