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
import { existsSync, readFileSync, statSync } from "node:fs";
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
      "--input-type=module",
      "-e",
      `import Database from "${join(ROOT, "node_modules", "better-sqlite3", "lib", "index.js")}";
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

function newestSourceChange() {
  const files = run("git", ["ls-files", "src", "prisma", "tests", "scripts"]).split("\n");
  let newest = 0;
  for (const file of files) {
    if (!file) continue;
    try {
      newest = Math.max(newest, statSync(join(ROOT, file)).mtimeMs);
    } catch {
      // Deleted but still tracked; ignore.
    }
  }
  return newest;
}

const newestSource = newestSourceChange();

for (const [name, path, remedy] of [
  ["Code map", join(ROOT, "docs", "CODEMAP.md"), "npm run codemap"],
  ["Knowledge graph", join(ROOT, "graphify-out", "GRAPH_REPORT.md"), "npm run graph:update"],
]) {
  if (!existsSync(path)) {
    report("warn", name, "not generated yet", remedy);
  } else if (statSync(path).mtimeMs < newestSource) {
    report("warn", name, "older than the source it describes", remedy);
  } else {
    report("ok", name, "up to date");
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
