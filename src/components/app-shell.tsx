import Link from "next/link";

import { OrchelioWordmark } from "@/components/brand";
import { DemoBanner } from "@/components/demo-banner";
import { FirmSwitcher } from "@/components/firm-switcher";
import { Badge } from "@/components/ui";
import { signOutAction } from "@/app/login/actions";
import { POWERED_BY } from "@/lib/app-config";
import type { Permission } from "@/lib/auth/permissions";
import type { Session, SessionFirm } from "@/lib/auth/session";

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

const FIRM_NAV: readonly NavItem[] = [{ href: "/dashboard", label: "Dashboard" }];

const FIRM_PLANNED: readonly PlannedItem[] = [
  { label: "Matters", phase: 5 },
  { label: "Intake", phase: 5 },
  { label: "Documents", phase: 5 },
  { label: "Tasks", phase: 5 },
  { label: "AI Workspace", phase: 6 },
  { label: "Approvals", phase: 7 },
  { label: "Activity Log", phase: 7 },
];

const ADMIN_PLANNED: readonly PlannedItem[] = [
  { label: "Firm Settings", phase: 4 },
  { label: "Workflows", phase: 4 },
  { label: "Users and Roles", phase: 8 },
  { label: "AI Settings", phase: 6 },
  { label: "Usage and Costs", phase: 8 },
  { label: "Integrations", phase: 8 },
];

const PLATFORM_NAV: readonly NavItem[] = [{ href: "/admin/firms", label: "Firms" }];

const PLATFORM_PLANNED: readonly PlannedItem[] = [
  { label: "System Overview", phase: 8 },
  { label: "Demo Management", phase: 8 },
];

function NavGroup({
  title,
  items,
  planned,
}: {
  title: string;
  items?: readonly NavItem[];
  planned?: readonly PlannedItem[];
}) {
  if ((items?.length ?? 0) === 0 && (planned?.length ?? 0) === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="px-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{title}</h2>
      <ul className="mt-2 space-y-0.5">
        {items?.map((item) => (
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
  roleLabel,
  children,
}: {
  session: Session;
  firm: SessionFirm | null;
  roleLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <DemoBanner variant="long" />

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="border-b border-line bg-surface lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="border-b border-line px-4 py-4">
            <OrchelioWordmark subtitle={firm?.name ?? "No firm workspace"} />
          </div>

          {firm ? <FirmSwitcher firms={session.user.firms} activeFirmId={firm.id} /> : null}

          <nav aria-label="Main" className="space-y-5 px-2 py-4">
            {firm ? (
              <>
                <NavGroup title="Firm" items={FIRM_NAV} planned={FIRM_PLANNED} />
                <NavGroup title="Firm administration" planned={ADMIN_PLANNED} />
              </>
            ) : null}
            {session.user.isPlatformAdmin ? (
              <NavGroup
                title="Platform administration"
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
                Sign out
              </button>
            </form>
            <p className="mt-4 text-xs text-ink-subtle">{POWERED_BY}</p>
          </div>
        </aside>

        <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
