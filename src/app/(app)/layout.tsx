import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth/guards";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { readBranding } from "@/lib/data/settings";
import { actorFor } from "@/lib/auth/session";
import { permissionsFor, roleLabel } from "@/lib/auth/permissions";

/**
 * Layout for every signed-in page.
 *
 * The guard runs here, on the server, before any child renders. Each page below
 * also guards whatever it specifically needs — this layout establishes "signed
 * in", not "allowed to see this".
 *
 * The caller's permissions are passed to the shell so that the navigation
 * offers only what they may actually open. That is a courtesy, not a control:
 * the guards on each page are what decide.
 */
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const firm = await activeFirmFor(session);
  const permissions = permissionsFor(actorFor(session.user, firm?.id ?? null));

  // The firm's own display name and accent, read here so the sidebar shows what
  // the branding tab says it shows. One query, request-scoped like everything
  // else firm-specific — a firm's branding is firm data, and firm data is never
  // cached across requests.
  const branding = firm ? await readBranding(scopeFor(firm)) : null;

  return (
    <AppShell
      session={session}
      firm={firm}
      branding={branding}
      roleLabel={roleLabel(firm?.role ?? null, session.user.isPlatformAdmin)}
      permissions={permissions}
    >
      {children}
    </AppShell>
  );
}
