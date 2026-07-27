import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth/guards";
import { activeFirmFor } from "@/lib/auth/firm-context";
import { roleLabel } from "@/lib/auth/permissions";

/**
 * Layout for every signed-in page.
 *
 * The guard runs here, on the server, before any child renders. Each page below
 * also guards whatever it specifically needs — this layout establishes "signed
 * in", not "allowed to see this".
 */
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const firm = await activeFirmFor(session);

  return (
    <AppShell
      session={session}
      firm={firm}
      roleLabel={roleLabel(firm?.role ?? null, session.user.isPlatformAdmin)}
    >
      {children}
    </AppShell>
  );
}
