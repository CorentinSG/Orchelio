#!/usr/bin/env node
/**
 * Orchelio — environment doctor.
 *
 * Answers one question: is this checkout ready to work in? It checks the things
 * that actually go wrong — a missing `.env`, an un-migrated database, an empty
 * seed, a stale code map, a stale knowledge graph, a browser Playwright cannot
 * find — and prints the exact command to fix each one.
 *
 * Exits non-zero only for problems that stop the application running. A stale
 * index is reported and does not fail, because it slows work down rather than
 * breaking it.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const results = [];
let blocking = 0;

function report(level, name, detail, remedy) {
  results.push({ level, name, detail, remedy });
  if (level === "fail") blocking += 1;
}

function run(command, args) {
  return execFileSync(command, args, { cwd: ROOT, encoding: "utf8", stdio: "pipe" }).trim();
}

// --- Node ------------------------------------------------------------------

const [major] = process.versions.node.split(".").map(Number);
if (major >= 20) {
  report("ok", "Node.js", `v${process.versions.node}`);
} else {
  report("fail", "Node.js", `v${process.versions.node} is too old`, "Install Node.js 20.9 or later");
}

// --- Dependencies ----------------------------------------------------------

if (existsSync(join(ROOT, "node_modules"))) {
  report("ok", "Dependencies", "installed");
} else {
  report("fail", "Dependencies", "node_modules is missing", "npm install");
}

// --- Environment file ------------------------------------------------------

if (existsSync(join(ROOT, ".env"))) {
  const env = readFileSync(join(ROOT, ".env"), "utf8");
  const missing = ["DATABASE_URL", "AI_PROVIDER"].filter((key) => !env.includes(`${key}=`));
  if (missing.length === 0) {
    report("ok", "Environment", ".env present");
  } else {
    report("warn", "Environment", `.env is missing ${missing.join(", ")}`, "Compare with .env.example");
  }
} else {
  report("fail", "Environment", ".env is missing", "cp .env.example .env");
}

// --- Prisma client ---------------------------------------------------------

if (existsSync(join(ROOT, "src", "generated", "prisma", "client.ts"))) {
  report("ok", "Prisma client", "generated");
} else {
  report("fail", "Prisma client", "not generated", "npm run db:generate");
}

// --- Database --------------------------------------------------------------

const databaseFile = join(ROOT, "prisma", "orchelio-demo.db");
if (!existsSync(databaseFile)) {
  report("fail", "Database", "orchelio-demo.db is missing", "npm run db:migrate");
} else {
  try {
    const status = run("npx", ["prisma", "migrate", "status"]);
    if (/have not yet been applied|not yet been applied|drift/i.test(status)) {
      report("warn", "Database", "migrations are pending", "npm run db:migrate");
    } else {
      report("ok", "Database", "schema up to date");
    }
  } catch {
    report("warn", "Database", "could not read migration status", "npm run db:migrate");
  }

  // A migrated but unseeded database looks broken to a newcomer: the sign-in
  // page lists accounts that do not exist.
  try {
    const count = run("node", [
      "-e",
      `const Database = require("better-sqlite3");
       const db = new Database(${JSON.stringify(databaseFile)}, { readonly: true });
       process.stdout.write(String(db.prepare("select count(*) as n from users").get().n));`,
    ]);
    if (Number(count) > 0) {
      report("ok", "Demonstration data", `${count} users seeded`);
    } else {
      report("warn", "Demonstration data", "no users", "npm run seed");
    }
  } catch {
    report("warn", "Demonstration data", "could not be counted", "npm run seed");
  }
}

// --- Indexes ---------------------------------------------------------------
//
// Both checks compare *content or commit*, never modification times. A fresh
// `git clone` stamps every file with the same mtime, which made a perfectly
// current index look stale — the first thing this doctor got wrong.

if (!existsSync(join(ROOT, "docs", "CODEMAP.md"))) {
  report("warn", "Code map", "not generated yet", "npm run codemap");
} else {
  try {
    run("node", ["scripts/codemap.mjs", "--check"]);
    report("ok", "Code map", "matches the source");
  } catch {
    report("warn", "Code map", "does not match the source", "npm run codemap");
  }
}

/**
 * Files the knowledge graph is built from, changed since a commit.
 *
 * Returns `null` when the commit is not in this history — a shallow clone, or
 * a graph carried over from a rebased branch — because "cannot tell" and
 * "nothing changed" are different answers.
 */
function sourceFilesChangedSince(commit) {
  try {
    // Against the *working tree*, not `commit..HEAD`. The graph is built from
    // the files on disk, so an uncommitted edit makes it stale exactly as a
    // committed one does.
    const changed = run("git", ["diff", "--name-only", commit]);
    return changed
      .split("\n")
      .filter(Boolean)
      .filter((path) => /^(src|prisma|scripts|tests)\/.*\.(ts|tsx|mjs|js|prisma)$/.test(path));
  } catch {
    return null;
  }
}

const graphReport = join(ROOT, "graphify-out", "GRAPH_REPORT.md");
if (!existsSync(graphReport)) {
  report("warn", "Knowledge graph", "not built yet", "npm run graph");
} else {
  // The report records the commit it was built from; Graphify puts it there
  // precisely so staleness can be checked without rebuilding.
  const built = readFileSync(graphReport, "utf8").match(/Built from commit:\s*`?([0-9a-f]+)`?/i);
  let head = "";
  try {
    head = run("git", ["rev-parse", "HEAD"]);
  } catch {
    head = "";
  }

  if (!built) {
    report("ok", "Knowledge graph", "built (no commit recorded)");
  } else if (head && !head.startsWith(built[1])) {
    // HEAD having moved is not the question — the graph's *own* commit moves
    // it, so committing a fresh graph made it instantly stale. Three phases
    // running. What matters is whether any file the graph indexes has changed
    // since it was built.
    const changed = sourceFilesChangedSince(built[1]);

    if (changed === null) {
      report(
        "warn",
        "Knowledge graph",
        `built at ${built[1]}, which is not in this history`,
        "npm run graph:update",
      );
    } else if (changed.length === 0) {
      report("ok", "Knowledge graph", `current (built at ${built[1]}, no source changed since)`);
    } else {
      report(
        "warn",
        "Knowledge graph",
        `${changed.length} source file(s) changed since ${built[1]}`,
        "npm run graph:update",
      );
    }
  } else {
    report("ok", "Knowledge graph", "current with HEAD");
  }
}

// --- Acceptance coverage ---------------------------------------------------

if (!existsSync(join(ROOT, "docs", "ACCEPTANCE.md"))) {
  report("warn", "Acceptance map", "not written yet", "See docs/INDEX.md");
} else {
  try {
    const output = run("node", ["scripts/acceptance-check.mjs"]);
    const named = /(\d+) named test\(s\)/.exec(output);
    report("ok", "Acceptance map", `${named ? named[1] : "?"} named test(s) present`);
  } catch {
    report(
      "warn",
      "Acceptance map",
      "names a test that has moved or been renamed",
      "npm run acceptance:check",
    );
  }
}

// --- Skills ----------------------------------------------------------------

if (!existsSync(join(ROOT, ".claude", "skills"))) {
  report("warn", "Skills", "none installed", "See docs/HARNESS.md");
} else {
  try {
    const output = run("node", ["scripts/skills-check.mjs"]);
    const count = /(\d+) skill\(s\)/.exec(output);
    report("ok", "Skills", `${count ? count[1] : "?"} available, references resolve`);
  } catch {
    report("warn", "Skills", "a skill points at something missing", "npm run skills:check");
  }
}

// --- Browser ---------------------------------------------------------------

const chromium = process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"];
if (chromium && existsSync(chromium)) {
  report("ok", "Browser", `using ${chromium}`);
} else if (existsSync(join(process.env["HOME"] ?? "", ".cache", "ms-playwright"))) {
  report("ok", "Browser", "Playwright browsers installed");
} else {
  report(
    "warn",
    "Browser",
    "no browser found — end-to-end tests will not run",
    "npx playwright install chromium (or set PLAYWRIGHT_CHROMIUM_EXECUTABLE)",
  );
}

// --- Output ----------------------------------------------------------------

const symbol = { ok: "✓", warn: "!", fail: "✗" };
const width = Math.max(...results.map((entry) => entry.name.length));

console.log("\nOrchelio — environment check\n");
for (const entry of results) {
  const detail = entry.detail ? ` — ${entry.detail}` : "";
  console.log(`  ${symbol[entry.level]} ${entry.name.padEnd(width)}${detail}`);
  if (entry.remedy) console.log(`      fix: ${entry.remedy}`);
}

const warnings = results.filter((entry) => entry.level === "warn").length;
console.log(
  `\n${blocking === 0 ? "Ready to work." : `${blocking} blocking problem(s).`}` +
    (warnings > 0 ? ` ${warnings} warning(s).` : "") +
    "\n",
);

process.exit(blocking === 0 ? 0 : 1);
