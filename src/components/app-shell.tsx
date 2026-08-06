import Link from "next/link";

import { OrchelioWordmark } from "@/components/brand";
import { DemoBanner } from "@/components/demo-banner";
import { FirmSwitcher } from "@/components/firm-switcher";
import { Badge } from "@/components/ui";
import { signOutAction } from "@/app/login/actions";
import { POWERED_BY } from "@/lib/app-config";
import type { Permission } from "@/lib/auth/permissions";
import type { Session, SessionFirm } from "@/lib/auth/session";
import { type Branding, accentColour, firmDisplayName } from "@/lib/settings/config";

/**
 * Orchelio — the signed-in shell.
 *
 * The sidebar always names the product and, underneath, the firm currently
 * open. A user must never have to guess which tenant they are looking at.
 *
 * Navigation is built from what the signed-in user may actually reach. Sections
 * that later phases deliver are listed separately, as plain text with their
 * phase number, rather than as links that do nothing — a dead link reads as a
 * bug, a labelled gap reads as a plan.
 */

type NavItem = {
  href: string;
  label: string;
  permission?: Permission;
};

type PlannedItem = { label: string; phase: number };

const FIRM_NAV: readonly NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord" },
  // First under the fold and above Matters on purpose: the short way in is the
  // one a firm needs on its first morning, and a menu is read from the top.
  { href: "/start", label: "Ouvrir un dossier", permission: "matter.view" },
  { href: "/matters", label: "Dossiers", permission: "matter.view" },
  { href: "/intake", label: "Questionnaire client", permission: "matter.view" },
  { href: "/documents", label: "Documents", permission: "document.view" },
  { href: "/tasks", label: "Tâches", permission: "matter.view" },
  { href: "/ai", label: "Assistant", permission: "ai.result.view" },
  { href: "/approvals", label: "Validations", permission: "approval.view" },
  { href: "/activity", label: "Journal d’activité", permission: "firm.audit.view" },
];

const FIRM_PLANNED: readonly PlannedItem[] = [];

const ADMIN_NAV: readonly NavItem[] = [
  { href: "/settings", label: "Réglages du cabinet", permission: "firm.settings.view" },
  { href: "/usage", label: "Consommation et coûts", permission: "firm.costs.view" },
  { href: "/onboarding", label: "Questionnaire d’installation", permission: "firm.settings.edit" },
];

// Empty, and it stays empty: nothing in the firm administration section is
// waiting on a later phase. "Integrations" was listed here until Phase 8 and is
// now removed rather than deferred — an integration means sending something
// somewhere, and Orchelio has no transport at all.
const ADMIN_PLANNED: readonly PlannedItem[] = [];

const PLATFORM_NAV: readonly NavItem[] = [
  { href: "/admin/firms", label: "Cabinets" },
  { href: "/admin/system", label: "Vue d’ensemble du système" },
  { href: "/admin/demo", label: "Données de démonstration" },
];

const PLATFORM_PLANNED: readonly PlannedItem[] = [];

function NavGroup({
  title,
  items,
  planned,
  granted,
}: {
  title: string;
  items?: readonly NavItem[];
  planned?: readonly PlannedItem[];
  granted?: ReadonlySet<Permission>;
}) {
  // A link the caller may not follow is worse than no link: it invites a
  // refusal. Server-side guards still decide; this only avoids offering.
  const visible = (items ?? []).filter(
    (item) => !item.permission || granted?.has(item.permission),
  );

  if (visible.length === 0 && (planned?.length ?? 0) === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="px-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{title}</h2>
      <ul className="mt-2 space-y-0.5">
        {visible.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-md px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              {item.label}
            </Link>
          </li>
        ))}
        {planned?.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between px-3 py-1.5 text-sm text-ink-subtle"
          >
            <span>{item.label}</span>
            <span className="text-xs">Phase {item.phase}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AppShell({
  session,
  firm,
  branding,
  roleLabel,
  permissions,
  children,
}: {
  session: Session;
  firm: SessionFirm | null;
  /** The open firm's own branding. Null when no firm is open. */
  branding: Branding | null;
  roleLabel: string;
  permissions: readonly Permission[];
  children: React.ReactNode;
}) {
  const granted = new Set(permissions);
  const accent = branding ? accentColour(branding.accent) : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <DemoBanner variant="long" />

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside
          aria-label="Espace du cabinet"
          className="border-b border-line bg-surface lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r"
        >
          <div className="border-b border-line px-4 py-4">
            {/* The wordmark is the product's and never a firm's: a firm brands
                itself here, not the software it is using. */}
            <OrchelioWordmark
              subtitle={
                firm && branding ? firmDisplayName(branding, firm.name) : "Aucun espace de cabinet"
              }
              mark={
                accent ? (
                  <span
                    aria-hidden
                    className="firm-accent size-2.5 shrink-0 rounded-full"
                    style={
                      {
                        "--firm-accent-light": accent.light,
                        "--firm-accent-dark": accent.dark,
                      } as React.CSSProperties
                    }
                  />
                ) : null
              }
            />
          </div>

          {firm ? <FirmSwitcher firms={session.user.firms} activeFirmId={firm.id} /> : null}

          <nav aria-label="Navigation principale" className="space-y-5 px-2 py-4">
            {firm ? (
              <>
                <NavGroup title="Cabinet" items={FIRM_NAV} planned={FIRM_PLANNED} granted={granted} />
                <NavGroup
                  title="Administration du cabinet"
                  items={ADMIN_NAV}
                  planned={ADMIN_PLANNED}
                  granted={granted}
                />
              </>
            ) : null}
            {session.user.isPlatformAdmin ? (
              <NavGroup
                title="Administration de la plateforme"
                items={PLATFORM_NAV}
                planned={PLATFORM_PLANNED}
              />
            ) : null}
          </nav>

          <div className="border-t border-line px-4 py-4">
            <p className="text-sm font-medium text-ink">{session.user.name}</p>
            <p className="truncate text-xs text-ink-muted">{session.user.email}</p>
            <div className="mt-2">
              <Badge tone="brand">{roleLabel}</Badge>
            </div>
            <form action={signOutAction} className="mt-3">
              <button
                type="submit"
                className="w-full rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-muted"
              >
                Se déconnecter
              </button>
            </form>
            <p className="mt-4 text-xs text-ink-subtle">{POWERED_BY}</p>
          </div>
        </aside>

        <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
