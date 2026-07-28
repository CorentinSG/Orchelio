#!/usr/bin/env node
/**
 * Orchelio — documentation checker.
 *
 * Two guarantees, both cheap and both easy to break by hand:
 *
 *   1. Every internal link in the documentation resolves to a file that exists.
 *   2. Every note in docs/ is reachable from docs/INDEX.md.
 *
 * The second is what stops the vault becoming a folder of orphans. A note
 * nothing links to is a note nobody finds — the exact failure a knowledge base
 * is supposed to prevent.
 *
 * This is the harness rule applied to prose: an index that can go stale must be
 * checkable. Wired into `npm run verify` and CI.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const ROOT = process.cwd();
const DOCS = join(ROOT, "docs");
const ENTRY = join(DOCS, "INDEX.md");

/** Markdown files in docs/, plus the two at the repository root. */
function markdownFiles(directory, found = []) {
  for (const entry of readdirSync(directory).sort()) {
    if (entry.startsWith(".")) continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) markdownFiles(path, found);
    else if (entry.endsWith(".md")) found.push(path);
  }
  return found;
}

const docFiles = markdownFiles(DOCS);
const rootFiles = ["README.md", "CLAUDE.md"].map((name) => join(ROOT, name)).filter(existsSync);
const allFiles = [...docFiles, ...rootFiles];

const problems = [];

/**
 * Internal Markdown links, ignoring anything that leaves the repository.
 * Anchors are stripped: this checks that the file exists, not that a heading
 * does — heading text changes far more often than filenames, and a broken
 * anchor is a smaller failure than a broken link.
 */
function linksIn(source) {
  return [...source.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)]
    .map((match) => match[1])
    .filter((href) => !/^(https?:|mailto:|#)/.test(href))
    .map((href) => href.split("#")[0])
    .filter(Boolean);
}

const graph = new Map();

for (const file of allFiles) {
  const source = readFileSync(file, "utf8");
  const targets = [];

  for (const href of linksIn(source)) {
    const target = resolve(dirname(file), href);
    if (!existsSync(target)) {
      problems.push(`${relative(ROOT, file)} → ${href} (no such file)`);
      continue;
    }
    if (target.endsWith(".md")) targets.push(target);
  }

  graph.set(file, targets);
}

// --- Reachability ----------------------------------------------------------

if (!existsSync(ENTRY)) {
  problems.push("docs/INDEX.md is missing — it is the entry point of the vault");
} else {
  const reachable = new Set([ENTRY]);
  const queue = [ENTRY];

  // The root notes are entry points in their own right: a reader arrives at the
  // README from GitHub, not from the vault index.
  for (const file of rootFiles) {
    if (!reachable.has(file)) {
      reachable.add(file);
      queue.push(file);
    }
  }

  while (queue.length > 0) {
    const current = queue.pop();
    for (const target of graph.get(current) ?? []) {
      if (!reachable.has(target)) {
        reachable.add(target);
        queue.push(target);
      }
    }
  }

  for (const file of docFiles) {
    if (!reachable.has(file)) {
      problems.push(
        `${relative(ROOT, file)} is not reachable from docs/INDEX.md — link it, or delete it`,
      );
    }
  }
}

// --- Output ----------------------------------------------------------------

const noteCount = docFiles.length;
const linkCount = [...graph.values()].reduce((total, targets) => total + targets.length, 0);

if (problems.length === 0) {
  console.log(
    `Documentation OK — ${noteCount} notes, ${linkCount} internal links, no orphans.`,
  );
  process.exit(0);
}

console.error(`Documentation has ${problems.length} problem(s):\n`);
for (const problem of problems) console.error(`  ✗ ${problem.split(sep).join("/")}`);
console.error("");
process.exit(1);
