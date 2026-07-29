#!/usr/bin/env node
/**
 * Orchelio — firm-scope audit.
 *
 * ## What this proves, and what it does not
 *
 * It does **not** prove that every query is correctly scoped. That is the
 * runtime guard's job (`src/lib/data/firm-scope.ts`), and the integration
 * suite's. A grep cannot know whether `where: { firmId }` names the *right*
 * firm.
 *
 * What it does is a ratchet: every place that reaches Prisma from outside the
 * data layer, and every exported data-layer function that does not take a
 * `FirmScope`, is listed below with the reason it is allowed. A new one is a
 * finding. The value is not the list — it is that adding to the list is a
 * deliberate act somebody has to justify, rather than a line that slips in.
 *
 * Exit code 1 on an unexplained exception, so it can gate a commit.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const ROOT = process.cwd();

/**
 * Files outside `src/lib/data/` that may touch Prisma directly, and why.
 *
 * Adding an entry means writing down why the data layer was not the right
 * place. If the reason is "it was quicker", that is not a reason.
 */
const PRISMA_OUTSIDE_DATA_LAYER = {
  "src/lib/audit.ts":
    "Writes the activity log. Platform-level events carry no firm, so a firm-scoped repository would be the wrong shape.",
  "src/lib/auth/session.ts":
    "Sessions and users are platform models, not firm-scoped ones. A session exists before any firm is chosen.",
  "src/lib/system-status.ts":
    "Counts rows for the public home page's status panel. Platform-wide by definition and reads no firm data.",
  "src/app/login/actions.ts":
    "Sign-in, which happens before a firm exists in the request. Reads users, writes sessions.",
  "src/app/(app)/admin/firms/page.tsx":
    "Platform administration lists every firm. Cross-firm by design, behind requirePlatformAdmin, and reads no matter, document or analysis.",
  "src/lib/ai/run.ts":
    "Writes a UsageRecord naming the firm. Worth moving behind a repository when the cost screens land in Phase 8.",
  "src/lib/approvals/raise.ts":
    "Creates the task a rejected analysis produces, naming the firm. Same note as above.",
};

/**
 * Exported functions in `src/lib/data/` that take no `FirmScope`, and why.
 *
 * Three legitimate shapes: a platform catalogue (`PracticeArea`, `MatterType`,
 * `WorkflowTemplate` — shared by every firm), a pure helper that touches no
 * database at all, and the guard itself.
 */
const UNSCOPED_DATA_EXPORTS = {
  "catalogues.matterTypesForPracticeAreas": "Platform catalogue. Shared by every firm.",
  "catalogues.workflowTemplatesFor": "Platform catalogue. Shared by every firm.",
  "onboarding.matterTypeOptions": "Platform catalogue, read while a firm is being configured.",
  "firms.getFirm": "Takes the firm identifier directly; the firm is the subject, not the scope.",
  "usage.formatCost": "Pure formatting. Touches nothing.",
  "scope.isFirmScope": "Type guard. Touches nothing.",
  "approvals.knownAction": "Reads the action catalogue in memory. Touches nothing.",
  "firm-scope.assertFirmScoped": "The guard itself.",
  "firm-scope.withFirmScopeGuard": "The guard itself.",
};

const findings = [];
const stale = [];

// --- 1. Who reaches Prisma from outside the data layer? --------------------

const prismaUsers = grep("prisma\\.", ["src"])
  .filter((path) => !path.startsWith("src/generated/"))
  .filter((path) => !path.startsWith("src/lib/data/"))
  .filter((path) => path !== "src/lib/prisma.ts");

for (const path of prismaUsers) {
  if (!(path in PRISMA_OUTSIDE_DATA_LAYER)) {
    findings.push({
      what: `${path} reaches Prisma directly`,
      why: "Everything firm-scoped goes through src/lib/data, whose functions take the firm as a required argument. If this file genuinely cannot, add it to PRISMA_OUTSIDE_DATA_LAYER in this script with the reason.",
    });
  }
}
for (const path of Object.keys(PRISMA_OUTSIDE_DATA_LAYER)) {
  if (!prismaUsers.includes(path)) stale.push(`${path} no longer uses Prisma — remove its exception`);
}

// --- 2. Which data-layer exports take no firm? -----------------------------

const seen = new Set();
for (const path of listFiles("src/lib/data")) {
  const moduleName = path.replace(/^src\/lib\/data\//, "").replace(/\.ts$/, "");
  const source = readFileSync(path, "utf8");

  for (const match of source.matchAll(/export (?:async )?function (\w+)\(([^)]*)\)/gs)) {
    const [, name, params] = match;
    if (/FirmScope|\bscope\b/.test(params)) continue;

    const key = `${moduleName}.${name}`;
    seen.add(key);
    if (!(key in UNSCOPED_DATA_EXPORTS)) {
      findings.push({
        what: `${path}: ${name}() takes no FirmScope`,
        why: "Every firm-scoped read and write names its firm. If this is a platform catalogue or a pure helper, add it to UNSCOPED_DATA_EXPORTS in this script with the reason.",
      });
    }
  }
}
for (const key of Object.keys(UNSCOPED_DATA_EXPORTS)) {
  if (!seen.has(key)) stale.push(`${key} is no longer an unscoped export — remove its exception`);
}

// --- 3. An OR that is not fully scoped -------------------------------------
//
// Reported, never asserted. `OR: [{ firmId }, { status }]` returns the whole
// database, so the runtime guard requires *every* branch of an OR to be
// scoped — but whether a given OR is safe cannot be settled by reading text,
// and a check that guesses would train people to ignore it.

const orSites = grep("OR: \\[", ["src/lib/data"]);

// ---------------------------------------------------------------------------

console.log("\nOrchelio — firm-scope audit\n");

if (findings.length === 0) {
  console.log(`  ✓ No new route to Prisma outside the data layer`);
  console.log(`  ✓ Every firm-scoped data-layer export names its firm`);
} else {
  for (const finding of findings) {
    console.log(`  ✗ ${finding.what}`);
    console.log(`      ${finding.why}\n`);
  }
}

for (const note of stale) {
  console.log(`  ! ${note}`);
}

console.log(
  `\n  ${Object.keys(PRISMA_OUTSIDE_DATA_LAYER).length} reviewed exception(s) outside the data layer, ` +
    `${Object.keys(UNSCOPED_DATA_EXPORTS).length} unscoped export(s).`,
);
if (orSites.length > 0) {
  console.log(
    `  ${orSites.length} file(s) build an OR in the data layer — read each one: every branch must name the firm.`,
  );
  for (const path of orSites) console.log(`      ${path}`);
}

console.log(
  "\n  This is a ratchet, not a proof. Correct scoping is enforced at runtime by\n" +
    "  src/lib/data/firm-scope.ts and proved by tests/integration/isolation.test.ts.\n",
);

process.exit(findings.length === 0 ? 0 : 1);

// ---------------------------------------------------------------------------

function grep(pattern, paths) {
  try {
    // --untracked, deliberately: a file written but not yet staged is exactly
    // when this check is worth running, and the default would give it a
    // false all-clear until somebody committed it.
    return execFileSync("git", ["grep", "-l", "--untracked", "-E", pattern, "--", ...paths], {
      cwd: ROOT,
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    // git grep exits 1 when nothing matches, which is not an error here.
    return [];
  }
}

function listFiles(directory) {
  try {
    return execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard", `${directory}/*.ts`],
      { cwd: ROOT, encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}
