# Explaining a phase to somebody who is not a developer

The user who commissioned Orchelio is not a developer. The explanation is part
of what a phase delivers, not a note appended to it. A phase that works and
cannot be understood has not been delivered.

## The shape that has worked

1. **One sentence on what the phase is for.** Not what was built — what it is
   *for*. "This is the phase where the product stops doing things and starts
   asking."
2. **What was added**, in the order somebody would meet it in the interface.
   Name the screen, then say what it does. Skip the module names.
3. **The one or two things worth understanding**, explained properly. Usually a
   design decision with a reason a non-developer can weigh: *why is there no
   function that closes a matter?*
4. **Anything found and fixed.** Say what it looked like and what it was. This
   is where trust comes from.
5. **How to see it** — the exact commands, the exact account, the exact matter
   to open, and what to look at when it opens.
6. **The tests**, as a number and what it means.
7. **What was not done**, ending with the phase not started.

## Rules

**Explain, do not translate.** "The approval row is the single source of truth"
is jargon. "There is no second flag saying the analysis was approved, because
two copies of the same answer can disagree" is the same idea, said.

**Name the thing on screen.** Not `latestAnalysisForMatter` — "the AI Analysis
tab". A reader should be able to follow the explanation with the product open.

**Give the demonstration, not the feature list.** "Open IMM-2026-002 and run the
analysis. The record says the client last entered on 11 February 2024; the I-94
on file is named `...2024-03-04.pdf`. Both are shown. Orchelio does not say
which is right."

**State a limitation as a fact, not an apology.** "Four approval rules of
eighteen are raised; the screen lists the rest." Not "unfortunately I only had
time to…".

**Correct a claim if a later phase invalidated it.** Plainly, once, and move on.

## What not to write

- File paths as the main content. One or two where they genuinely help.
- Line counts, module counts, "comprehensive", "robust", "production-ready".
- A wall of bullets. Two or three short sections read; twelve bullets do not.
- Hedging on something that was verified. If the suite passed, say it passed.
- Praise for the work. Say what it does and let it be judged.

## A test of whether it is good enough

Could the reader, with only this explanation, open the application and find the
thing you are proudest of without asking a follow-up question?

If not, the explanation is not finished.
