#!/usr/bin/env node
/**
 * Orchelio — acceptance coverage check.
 *
 * `docs/ACCEPTANCE.md` names, for every phase's acceptance criterion, the tests
 * that prove it. That document is the most quietly dangerous kind of prose in
 * the repository: it is a list of claims about tests, and a renamed test turns
 * it into a list of claims about nothing while it goes on reading like evidence.
 *
 * So each entry is verified — the file exists, and the test title appears in
 * it. Exit code 1 otherwise, so it can gate a commit.
 *
 * What it does not check, deliberately: whether the test proves what the
 * criterion says. No script can, and pretending otherwise would be the same
 * error one level up.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SOURCE = join(ROOT, "docs", "ACCEPTANCE.md");

if (!existsSync(SOURCE)) {
  console.log("\ndocs/ACCEPTANCE.md is missing.\n");
  process.exit(1);
}

const document = readFileSync(SOURCE, "utf8");

/** `- \`tests/e2e/x.spec.ts\` — "the title"` */
const ENTRY = /^-\s+`([^`]+)`\s+—\s+"([^"]+)"\s*$/gm;
/** `## Phase 7 — Approvals and audit` */
const PHASE = /^##\s+Phase\s+(\d+)\s/gm;

const problems = [];
const cache = new Map();
const byFile = new Map();
let entries = 0;

function read(path) {
  if (!cache.has(path)) {
    const absolute = join(ROOT, path);
    cache.set(path, existsSync(absolute) ? readFileSync(absolute, "utf8") : null);
  }
  return cache.get(path);
}

for (const match of document.matchAll(ENTRY)) {
  const [, path, title] = match;
  entries += 1;

  const source = read(path);
  if (source === null) {
    problems.push(`${path} does not exist (named for "${title}")`);
    continue;
  }

  // The title is matched inside a test declaration rather than anywhere in the
  // file, so a phrase that happens to appear in a comment does not count as
  // coverage.
  const declared =
    source.includes(`it("${title}"`) ||
    source.includes(`test("${title}"`) ||
    source.includes(`it.each`) === true && source.includes(title);

  if (!declared) {
    problems.push(`${path} has no test called "${title}"`);
  }

  byFile.set(path, (byFile.get(path) ?? 0) + 1);
}

// --- Every phase must claim something --------------------------------------

const phases = [...document.matchAll(PHASE)].map((match) => Number(match[1]));
for (let phase = 1; phase <= 9; phase += 1) {
  if (!phases.includes(phase)) {
    problems.push(`Phase ${phase} has no section in docs/ACCEPTANCE.md`);
  }
}

// A section with a criterion and no tests is the failure this file exists to
// prevent, so it is worth its own message.
const sections = document.split(/^##\s+Phase\s+/m).slice(1);
for (const section of sections) {
  const number = section.slice(0, section.indexOf(" "));
  if (!/^-\s+`[^`]+`\s+—\s+"/m.test(section)) {
    problems.push(`Phase ${number} names a criterion but no test that proves it`);
  }
}

console.log("");
if (problems.length === 0) {
  console.log(
    `Acceptance coverage OK — ${phases.length} phase(s), ${entries} named test(s) ` +
      `across ${byFile.size} file(s), all present.\n`,
  );
  process.exit(0);
}

for (const problem of problems) console.log(`  ✗ ${problem}`);
console.log(`\n${problems.length} problem(s) in docs/ACCEPTANCE.md.\n`);
process.exit(1);
