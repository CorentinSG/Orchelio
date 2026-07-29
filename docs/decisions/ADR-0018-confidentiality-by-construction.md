# ADR-0018 — Confidentiality by construction, and a register of what is not

**Status:** accepted · **Phase:** post-9

## Context

A firm evaluating Orchelio asks one question before any other: *where does my
clients' data go?* The usual answers are a security page, a certification badge
and a paragraph about encryption. All three ask the firm to trust a supplier it
has known for ten minutes with material covered by professional secrecy.

That is the wrong shape of answer for this product, for a reason that is
specific to law firms rather than general good practice. A firm's obligation is
not to *believe* its supplier — it is to be able to *account* for where
privileged material is. A firm that cannot say where a client's file is has a
problem whether or not the supplier was telling the truth.

Two further things make the usual answer inadequate here.

**"Client data" is not one thing.** The fact that a matter exists, the client's
own words in an intake, and a draft letter an attorney wrote are three different
sensitivities. Treating them as one produces either theatre — everything
"encrypted", nothing usable — or a policy nobody can apply.

**The AI provider is a storage location.** The moment a document is sent to a
model, privileged material has left the firm's control. This is the largest
confidentiality decision the product makes, and it is usually buried under a
feature list.

## Decision

Confidentiality is treated as a **property of the system that can be checked**,
not a promise that is made. Four parts.

### 1. Every record is classified, in code, or the build fails

`src/lib/confidentiality/classification.ts` assigns each model one of five
classes, ordered by sensitivity:

| Class | What | Operator may read |
| ----- | ---- | ----------------- |
| `platform` | Shared catalogues, about nobody | yes |
| `identity` | The firm's own staff and their sessions | yes |
| `firm_internal` | The firm's configuration, members, usage | yes |
| `client_confidential` | That a client and a matter exist, and their shape | **no** |
| `privileged` | Documents, intake answers, analyses, drafts | **no** |

`npm run confidentiality:check` reads the model list from
`prisma/schema.prisma`, not from a hand-kept copy, and fails if a model has no
class. A new place for client data to live cannot appear under no rule.

Two judgements are recorded next to the table because a reasonable person would
place them differently. `AuditEvent` is client-confidential rather than
firm-internal: knowing that a named attorney read a named matter three times in
a week is information about a client, even though the log holds none of their
words. `Task` and `ApprovalRequest` are client-confidential rather than
privileged, because they carry a summary and a reference; `DraftCommunication`
is privileged, because it carries the exact words somebody intends to send.

### 2. Four properties are enforced by a check, not asserted

| Property | How |
| -------- | --- |
| Every model is classified | read from the schema |
| The one cross-tenant module reads no client material | `src/lib/data/platform.ts` is scanned for client-material models and for relation includes outside a `_count` |
| Nothing in `src/` can make an outbound request | an **empty** egress allow-list; an entry is a deliberate decision to send something somewhere |
| Nothing in `src/` writes a file | a document is a name, a type and a size |

All four run in `npm run verify` and in CI. All four were made to fail before
being trusted.

The second is the interesting one. "A platform administrator cannot read a
firm's matters" was previously a property of the *screens*, asserted by a browser
test against rendered output. It is now a property of the *queries*: the module
allowed to look across tenants may not name a client-confidential or privileged
model at all. A screen can be changed by anyone; this cannot be, without the
check saying so.

The comment-stripping in that script is deliberate. The platform module explains
*why* it does not call `prisma.matter.count()`, and a check that tripped on the
explanation would teach people to delete explanations.

### 3. The firm is shown the answer, including the bad half

Firm settings → **Confidentiality** is the one settings section with no form.
Confidentiality is not a preference a firm sets; what the page owes the firm is
an accurate description of the system, so it reports:

- where the data physically is, today;
- the five classes and which records are in each;
- every promise that something enforces, with the file to go and read;
- **every promise that nothing enforces yet**, in the same list, in the same
  words, marked as such;
- the two commands that let the firm verify it rather than believe it.

A page listing only the enforced half would be the same shape of lie as a zero
where a dash belongs — see ADR-0009.

### 4. The target design, for a deployment that holds real files

Not implemented, and not implementable in this build: there is no hosting, and
the specification's constraint is that Orchelio costs nothing to run. Recorded
so that the gap is a known quantity rather than a discovery.

**Storage.** Level 4 of the ladder in [Architecture §4.4](../ARCHITECTURE.md) —
one database per firm, with separate credentials and separate backups — plus
level 5 for documents: per-firm object storage with per-firm keys. The reason is
not defence in depth. It is that a legal demand served on one firm must not be
technically capable of reaching another's files. A `firmId` column does not give
that; separate credentials do.

**Keys.** A data key per firm, wrapped by a key the firm holds in its own key
service. The consequence has to be stated plainly rather than discovered: if the
platform cannot decrypt, the platform cannot index, cannot search across a
firm's documents, and cannot help when something goes wrong. The proposed line
is that **privileged** material is encrypted under the firm's key while
**client_confidential** metadata — references, dates, statuses — stays readable,
so the product still works. That is a real trade and the firm should be the one
making it.

**Deletion.** Crypto-shredding: destroy the firm's key and the data is
unreadable everywhere, backups included. It is the only deletion that can be
*proved* once backups exist, and "verified deletion on request" is currently ⛔
in the readiness register.

**Support access.** No standing platform access to client material. When support
genuinely needs it, the request goes into that firm's **own** approval queue —
the machinery already exists — is time-boxed, and every read lands in the firm's
activity log. This wants a tenth locked rule, `platformAccess`, which by
construction the platform cannot switch off.

**Residency.** The firm chooses a jurisdiction at creation and it is immutable
afterwards; the deployment refuses to start a worker for a firm outside its
region. This is the question a French firm asks first and the project currently
has no answer written down anywhere.

**The AI provider.** Three postures the firm chooses and sees on every analysis:

1. **No assistant.** Works today.
2. **Metadata only** — the assistant reads recorded fields, intake answers and
   document *names*, never contents. This is exactly what the simulation does
   now, which means posture 2 is already specified and tested.
3. **Contents**, under a vendor agreement excluding training, ideally against a
   zero-retention endpoint, with prompt-injection testing done first because a
   document is untrusted input.

Posture 2 existing already is the useful discovery: a firm can have most of the
value without a single document leaving the building.

## Consequences

- One new module, one new check, one new settings section, one new test file.
  Nothing in the running product changes behaviour — this phase makes existing
  properties provable rather than adding features.
- The egress allow-list is empty and adding to it is now a visible act. When a
  real Anthropic provider lands it must be added, with a sentence saying what it
  sends and under what agreement. That friction is the point.
- `npm run verify` gains a step. It is fast: four source scans.
- The confidentiality screen tells a prospective customer that nothing is
  encrypted at rest. That will lose an argument occasionally. It is still the
  right screen: a firm that discovers it later has been misled, and a firm that
  reads it here can decide.
- The target design is written down and not built. Anyone reading this ADR
  should assume none of §4 exists.

## See also

- [ADR-0005 — Firm scoping is enforced in three layers](ADR-0005-firm-scoping-in-three-layers.md)
- [ADR-0009 — A dash, not a zero](ADR-0009-a-dash-not-a-zero.md)
- [ADR-0012 — The simulated analysis derives rather than looks up](ADR-0012-the-simulation-derives-rather-than-looks-up.md)
- [Production readiness](../PRODUCTION_READINESS.md)
