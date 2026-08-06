import Link from "next/link";

import { OrchelioWordmark } from "@/components/brand";
import { Callout } from "@/components/ui";

export const metadata = { title: "Accès refusé" };

/**
 * 403.
 *
 * The wording is deliberately identical whether the resource does not exist,
 * belongs to another firm, or exists but is beyond this role. Telling a user
 * *why* they were refused would confirm that another firm's record exists.
 * The refusal itself is recorded in the activity log.
 */
export default function ForbiddenPage() {
  return (
    <main id="main" tabIndex={-1} className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <OrchelioWordmark size="lg" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">Accès refusé</h1>
        <p className="mt-2 text-ink-muted">
          Vous n’avez pas accès à cette page. Si vous pensez qu’il s’agit d’une erreur, demandez
          à l’administrateur de votre cabinet de vérifier votre rôle.
        </p>

        <div className="mt-6 space-y-3">
          <Callout tone="neutral">
            <p>Cette tentative a été consignée dans le journal d’activité.</p>
          </Callout>
          <p className="text-sm">
            <Link href="/dashboard" className="font-medium text-brand underline underline-offset-4">
              Revenir à votre tableau de bord
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
