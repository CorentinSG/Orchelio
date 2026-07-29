---
title: Giving a demonstration
tags: [reference, guide]
---

# Orchelio — giving a demonstration

How to show Orchelio to somebody, from a cold machine to a firm they created
themselves. Written for the person running the demonstration; the person
*watching* it wants the in-product walkthrough at
[`/guide`](http://localhost:3000/guide), which is the same twenty-one steps
with a link on each one.

---

## 1. Before anybody is watching

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run seed
npm run harness:doctor     # says whether anything is missing, and the fix
npm run dev                # http://localhost:3000
```

Five minutes on a cold machine, most of it `npm install`. Nothing needs a
network after that, no API key, no account, no cloud service, and no money.

**Check the state you are starting from.** The browser test suite creates firms
and matters as it runs, so a machine that has run `npm run test:e2e` has more
firms than the two the seed writes. That is not a problem to hide — it is
visible in Platform administration → Firms — but decide before you start whether
you want it. To go back to exactly the seeded state:

```bash
npm run reset-demo    # erases everything and re-seeds. Cannot be undone.
```

Say the last part out loud to yourself before pressing return. It erases every
firm on the instance.

---

## 2. The ten-minute version

If you have ten minutes, show the claim rather than the features. The claim is:
*one codebase, and each firm gets a different product.*

1. **Sign in** as `immigration.attorney@demo.local` (password `orchelio-demo`,
   printed on the page). Read the dashboard: status expirations, priority dates.
2. **Open a matter.** The fields are immigration fields.
3. **Run an analysis** from the Analysis tab. It takes about a second.
4. **Read what it does not say.** There is no conclusion, and no empty space
   where one would go.
5. **Go to Approvals.** The analysis is waiting for a person. Reject it, and
   watch Orchelio insist on a written reason.
6. **Sign in as `reviewer@demo.local`**, who belongs to both firms, and switch
   to the employment firm. Different cards, different fields, different words —
   "evidence collection" rather than "document collection".
7. **Paste a matter link from the first firm** into the address bar. The refusal
   is worded exactly as it would be for a matter that does not exist.

Steps 6 and 7 are the demonstration. The rest is context for them.

---

## 3. The full version

Follow [`/guide`](http://localhost:3000/guide) — twenty-one steps, about twenty
minutes, ending with the viewer creating a third firm themselves. That last part
is worth the time: a claim about configurability is much less convincing than
watching somebody produce a working firm in four minutes without anybody
touching the code.

The guide names the account for each step, so it can be handed to somebody to
follow alone.

---

## 4. What to say about the limits, and when

Say them early rather than when asked. A demonstration that has to be corrected
under questioning has already lost the argument.

| When | What to say |
| ---- | ----------- |
| Before signing in | Everything here is invented. No real client, matter, person or document exists in this build. |
| Before the first analysis | The AI is **simulated**. No key, no request, no charge, and nothing leaves this machine. The simulation derives its output from each matter's own fields, intake answers and document *names*. |
| At the first analysis result | It never opens a document. There is no OCR: Orchelio stores a filename, a type and a size. |
| At the approvals screen | Nine rules cannot be switched off by anyone, from any screen. Four of the eighteen rules are actually raised in this build, and the screen says which. |
| At any draft communication | Orchelio has no way to send anything. There is no "sent" status in the database and no transport in the code. Approving a draft means a person is content for those words to leave the firm; that person then sends them. |
| If asked about production | It is not production-ready, and the gaps are written down rather than summarised. See [Production readiness](PRODUCTION_READINESS.md). The largest is that multi-tenant isolation is enforced in the application, not by the database. |

---

## 5. Questions that come up, with honest answers

**"Is this really one codebase?"**
Yes. `src/lib/roadmap.ts`, the dashboard widgets and the matter fields are all
selected from the firm's stored configuration. Show Firm settings → AI features,
switch one off, and watch the dashboard card disappear rather than show a zero.

**"Can it do my area of law?"**
Two areas ship a full template: immigration, and employment and labour. The
questionnaire offers others and says "template coming soon" beside them, and
refuses to let a firm finish onboarding into one. Adding an area is a data
change plus a field table — see
[Architecture §8.1](ARCHITECTURE.md).

**"What would it cost to run for real?"**
This build cannot tell you, and the usage screen says so. Its token counts are
derived from the size of each matter, not measured from a model. What a real
deployment costs depends on the model, the prompt and the documents actually
sent, none of which exist here.

**"Could a firm see another firm's data?"**
Three independent layers say no, and there are integration tests with two firms
holding deliberately similar records — the same client name, the same document
filename, the same matter title — asserting that one cannot reach the other's
copy. All three layers run inside the application, so they protect against a
programming mistake and not against a compromised process. That is the honest
answer and it is the same one in
[Production readiness](PRODUCTION_READINESS.md).

**"Can I have it hosted?"**
Not from this build. It runs locally on SQLite by design, because one of the
specification's constraints was that it costs nothing to run. Moving to
PostgreSQL is a connection-string change plus a migration — see
[Architecture §8.5](ARCHITECTURE.md) — but hosting, authentication and isolation
all need real work first.

---

## 6. If something goes wrong mid-demonstration

```bash
npm run harness:doctor
```

It checks the things that actually break — a missing `.env`, an un-migrated
database, an empty seed, no browser — and prints the exact command for each.

A blank or broken screen shows a branded error page with a reference code, and
the details go to the terminal rather than to the browser: an error message is
one of the easiest places to leak another firm's data from, so the screen says
little on purpose.

---

## See also

- [Roadmap](ROADMAP.md) — what each phase delivered
- [Acceptance criteria](ACCEPTANCE.md) — and the tests that prove them
- [Production readiness](PRODUCTION_READINESS.md) — what is deliberately not done
- [Architecture](ARCHITECTURE.md) — how it is put together, and the procedures
