import Link from "next/link";

import { DemoBanner } from "@/components/demo-banner";
import { OrchelioWordmark } from "@/components/brand";
import { Badge, Callout, Card } from "@/components/ui";
import { GUIDE_STEPS, GUIDE_STEP_COUNT } from "@/lib/guide";
import { DEMO_PASSWORD } from "@/lib/demo-accounts";
import { APP_NAME, FICTIONAL_DATA_NOTICE, POWERED_BY } from "@/lib/app-config";

export const metadata = {
  title: "Guided demonstration",
  description: `A ${GUIDE_STEP_COUNT}-step walkthrough of ${APP_NAME}.`,
};

/**
 * Orchelio — the guided demonstration.
 *
 * Public, and deliberately so: somebody deciding whether to sign in should be
 * able to read what they would be shown first. Nothing on this page reads a
 * firm's data — it is the walkthrough, not the product.
 *
 * Several steps ask the reader to notice a refusal or an absence. That is not
 * modesty about an unfinished product; what Orchelio declines to do is the
 * substance of it, and a walkthrough that only showed the features would be
 * describing a different product.
 */
export default function GuidePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <DemoBanner variant="long" />

      <main id="main" className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <header>
            <OrchelioWordmark subtitle="Guided demonstration" />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
              {GUIDE_STEP_COUNT} steps through {APP_NAME}
            </h1>
            <p className="mt-2 text-ink-muted">
              In order, about twenty minutes. Each step names the account to sign in as, the screen
              to open, and — the part that matters — what to look for once you are there.
            </p>
          </header>

          <Callout tone="warning" title="Everything you are about to see is invented">
            <p>{FICTIONAL_DATA_NOTICE}</p>
            <p className="mt-2">
              Every account uses the password <span className="font-mono">{DEMO_PASSWORD}</span>,
              which is also printed on the sign-in page. No AI request is made anywhere in this
              walkthrough: the assistant is simulated, and no charge is incurred.
            </p>
          </Callout>

          <ol className="space-y-4">
            {GUIDE_STEPS.map((step) => (
              <li key={step.number}>
                <Card
                  title={
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm font-mono text-ink-subtle">
                        {String(step.number).padStart(2, "0")}
                      </span>
                      <span>{step.title}</span>
                    </span>
                  }
                >
                  <p className="text-sm text-ink">{step.action}</p>
                  <p className="mt-2 text-sm text-ink-muted">
                    <span className="font-medium text-ink">Look for:</span> {step.notice}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      href={step.href}
                      className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-muted"
                    >
                      Open {step.href}
                    </Link>
                    {step.account ? (
                      <Badge tone="neutral">
                        <span className="font-mono">{step.account}</span>
                      </Badge>
                    ) : (
                      <Badge tone="neutral">the account you just created</Badge>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ol>

          <Card title="When you reach the end">
            <p className="text-sm text-ink-muted">
              Three firms will exist, configured differently, sharing one codebase and not one row
              of data. That is the whole claim {APP_NAME} makes, and steps 18 to 21 are the ones
              that test it rather than assert it.
            </p>
            <p className="mt-3 text-sm">
              <Link href="/login" className="font-medium text-brand underline underline-offset-4">
                Start at step 1
              </Link>{" "}
              ·{" "}
              <Link href="/" className="font-medium text-brand underline underline-offset-4">
                Back to the home page
              </Link>
            </p>
          </Card>

          <p className="text-xs text-ink-subtle">{POWERED_BY}</p>
        </div>
      </main>
    </div>
  );
}
