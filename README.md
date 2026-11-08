<p align="center">
  <img src="assets/banner.png" alt="PROPUGNATOR. AI engineer, agentic systems and full-stack. Agents that know when not to answer." width="100%">
</p>

**Asad Baig. AI engineer in Karachi (UTC+5), open to remote roles.**

I build AI agents, CRM and ERP systems, and the products around them. Source is private for client reasons. Everything below is generated from the code or checked live.

## LAUNCH STATUS BOARD

<p align="center">
  <img src="assets/status.svg" alt="Launch status board. Each live product shows GO or NO-GO, response time in milliseconds and the last-checked time in UTC." width="100%">
</p>

A GitHub Action requests every product URL every 6 hours. If a site is down, the board says NO-GO. The script is [`scripts/check-live.ts`](scripts/check-live.ts).

## NO-GO DEMO: THE AGENT THAT KNOWS WHEN NOT TO ANSWER

Real traces from the live CiteWard pipeline, captured with its own `debug_pipeline` switch. The questions are synthetic, so no patient data is involved.

<p align="center">
  <img src="assets/trace.svg" alt="Animated terminal replay of a real CiteWard trace. Twelve sources retrieved, none naming the drug. The decision is NO-GO: dose withheld." width="100%">
</p>

<details>
<summary>Proof: raw sanitised trace JSON for the NO-GO case</summary>

```json
{
  "capturedAt": "2026-11-08",
  "request": {
    "endpoint": "POST https://citeward.com/api/oracle",
    "mode": "clinic",
    "debug_pipeline": true,
    "query": "What is the recommended adult dose of zorvaxinol for stage 3 chronic kidney disease?"
  },
  "stages": {
    "retrieve": {
      "providers": [
        "pubmed",
        "umls-expanded"
      ],
      "total_retrieved": 12,
      "sources_shown": 12,
      "top_sources": [
        {
          "id": "34272327",
          "title": "Effects of Dapagliflozin in Stage 4 Chronic Kidney Disease.",
          "year": 2021,
          "url": "https://pubmed.ncbi.nlm.nih.gov/34272327/"
        },
        {
          "id": "37216661",
          "title": "Population-Wide Screening for Chronic Kidney Disease : A Cost-Effectiveness Analysis.",
          "year": 2023,
          "url": "https://pubmed.ncbi.nlm.nih.gov/37216661/"
        },
        {
          "id": "23713082",
          "title": "Safety and tolerability of the novel non-steroidal mineralocorticoid receptor antagonist BAY 94-8862 in patients with chronic heart failure and mild or moderate chronic kidney disease: a randomized, double-blind trial.",
          "year": 2013,
          "url": "https://pubmed.ncbi.nlm.nih.gov/23713082/"
        },
        {
          "id": "41363010",
          "title": "Aprocitentan in Patients With Chronic Kidney Disease and Resistant Hypertension.",
          "year": 2026,
          "url": "https://pubmed.ncbi.nlm.nih.gov/41363010/"
        },
        {
          "id": "37960159",
          "title": "Efficacy and Safety of a High-Energy, Low-Protein Formula Replacement Meal for Pre-Dialysis Chronic Kidney Disease Patients: A Randomized Controlled Trial.",
          "year": 2023,
          "url": "https://pubmed.ncbi.nlm.nih.gov/37960159/"
        }
      ],
      "relevance": {
        "best": 0.486,
        "floor": 0.292,
        "scores": [
          0.404,
          0.486,
          0.465,
          0.461,
          0.457,
          0.442,
          0.43,
          0.429,
          0.423,
          0.422,
          0.422,
          0.42
        ],
        "dropped": 0,
        "poolOffTarget": true
      }
    },
    "draft": {
      "chars": 5763,
      "doses": [],
      "initial_violations": 0
    },
    "adversarial_review": {
      "confidence": "green",
      "reason": "The answer correctly refuses to fabricate a dose for an unidentifiable drug and provides a complete, guideline-consistent safety workup (name verification, source identification, eGFR-based renal dosing once identified, counterfeit/poisoning escalation), with no standard-of-care element omitted.",
      "flags": [],
      "get_human": false,
      "omission_detected": false,
      "absent_terms": []
    },
    "confidence_grade": {
      "strength": "strong",
      "high_quality_count": 5,
      "total_retrieved": 12,
      "total_cited": 5,
      "total_supported": 5,
      "independent_supported_sources": 5,
      "note": "Claims were supported by 5 independent cited sources, including 5 high-quality sources.",
      "citation_check_method": "semantic"
    },
    "claims": {
      "total": 33,
      "verified": 0
    }
  },
  "answer": {
    "title": "Zorvaxinol Dosing in Stage 3 CKD - No Such Drug Identified",
    "headline": "There is no established adult dose of \"zorvaxinol\" for stage 3 CKD - no such drug is identifiable, so no dose can or should be given.",
    "cited_ids": [
      "34272327",
      "23713082",
      "37960159",
      "24891437",
      "39211948"
    ]
  },
  "decision": {
    "label": "NO-GO",
    "basis": "Dose withheld. The drug does not exist in the retrieved evidence (relevance.poolOffTarget is true) and the answer refuses to invent one.",
    "note": "Label and basis are written by me from the fields above; the pipeline does not emit a GO/NO-GO string."
  }
}
```

</details>

And a question the evidence can answer. Confidence is amber, and the agent says why.

<p align="center">
  <img src="assets/trace-go.svg" alt="Animated terminal replay of a real CiteWard trace. Sixty sources retrieved, reviewer confidence amber, six of ten cited sources supported. The decision is GO." width="100%">
</p>

<details>
<summary>Proof: raw sanitised trace JSON for the GO case</summary>

```json
{
  "capturedAt": "2026-11-08",
  "request": {
    "endpoint": "POST https://citeward.com/api/oracle",
    "mode": "research",
    "debug_pipeline": true,
    "query": "What is the evidence that SGLT2 inhibitors reduce heart failure hospitalisation in HFpEF?"
  },
  "stages": {
    "retrieve": {
      "providers": [
        "pubmed",
        "europepmc",
        "openalex",
        "umls-expanded"
      ],
      "total_retrieved": 60,
      "sources_shown": 18,
      "top_sources": [
        {
          "id": "34449189",
          "title": "Empagliflozin in Heart Failure with a Preserved Ejection Fraction.",
          "year": 2021,
          "url": "https://pubmed.ncbi.nlm.nih.gov/34449189/"
        },
        {
          "id": "40037646",
          "title": "Empagliflozin in resistant hypertension and heart failure with preserved ejection fraction: the EMPEROR-Preserved trial.",
          "year": 2025,
          "url": "https://pubmed.ncbi.nlm.nih.gov/40037646/"
        },
        {
          "id": "37062851",
          "title": "Cardiac and kidney benefits of empagliflozin in heart failure across the spectrum of kidney function: Insights from the EMPEROR-Preserved trial.",
          "year": 2023,
          "url": "https://pubmed.ncbi.nlm.nih.gov/37062851/"
        },
        {
          "id": "34731652",
          "title": "EMPEROR-Preserved: A promise fulfilled.",
          "year": 2021,
          "url": "https://pubmed.ncbi.nlm.nih.gov/34731652/"
        },
        {
          "id": "36216487",
          "title": "SGLT2 Inhibitors and Heart Failure with Preserved Ejection Fraction.",
          "year": 2022,
          "url": "https://pubmed.ncbi.nlm.nih.gov/36216487/"
        }
      ],
      "relevance": null
    },
    "draft": {
      "chars": 21367,
      "doses": [
        "10 mg",
        "10 mg"
      ],
      "initial_violations": 0
    },
    "adversarial_review": {
      "confidence": "amber",
      "reason": "Citation verification: 4 cited sources did not pass claim-level semantic support checking; semantic citation-support verification was unavailable, so support for 2 cited sources could not be confirmed either way (they are retained, not rejected). Verify the affected claims against the primary sources before relying on them.",
      "flags": [],
      "get_human": false
    },
    "confidence_grade": {
      "strength": "limited",
      "high_quality_count": 4,
      "total_retrieved": 60,
      "total_cited": 10,
      "total_supported": 6,
      "independent_supported_sources": 6,
      "note": "4 cited sources did not pass claim-support checking.",
      "citation_check_method": "semantic"
    },
    "claims": {
      "total": 125,
      "verified": 12
    }
  },
  "answer": {
    "title": "In adults with heart failure and preserved ejection fraction (HFpEF), do SGLT2 inhibitors reduce heart failure hospitalisation compared with placebo?",
    "headline": "The evidence that SGLT2 inhibitors reduce heart failure hospitalisation in HFpEF is strong and comes principally from EMPEROR-Preserved, the first trial to show a favourable outcome effect in this population.",
    "cited_ids": [
      "37062851",
      "38771475",
      "39453357",
      "37674356",
      "37606866",
      "38558521"
    ]
  },
  "decision": {
    "label": "GO",
    "basis": "Answer delivered with citations. Reviewer confidence amber: 4 of 10 cited sources did not pass claim-level support checking.",
    "note": "Label and basis are written by me from the fields above; the pipeline does not emit a GO/NO-GO string."
  }
}
```

</details>

## TELEMETRY

<p align="center">
  <img src="assets/telemetry.svg" alt="Twelve counted readouts: CiteWard 32 tools, 158 API routes, 1,272 commits and 322 test cases; Illyria 114 tables and 520 test cases; TextileWays OS 105 data models." width="100%">
</p>

<details>
<summary>How every number is counted</summary>

Each figure is produced by a command run against the real repository, written to [`data/claims.json`](data/claims.json) by [`scripts/collect-claims.ts`](scripts/collect-claims.ts), and this README is generated from that file.

| Product | What | Value | Command | Run in |
| --- | --- | ---: | --- | --- |
| CiteWard | Tools in the in-app directory | **32** | `grep -cE "^[[:space:]]*[{] label:" app/tools/page.tsx` | `aescula` |
| CiteWard | API routes | **158** | `find app/api -name route.ts \| wc -l` | `aescula` |
| CiteWard | Commits | **1,272** | `git rev-list --count HEAD` | `aescula` |
| CiteWard | Test cases (vitest) | **322** | `node -e "console.log(require('./data/citeward-tests.json').numTotalTests)"` | `this repo` |
| CiteWard | Test cases passing | **318** | `node -e "console.log(require('./data/citeward-tests.json').numPassedTests)"` | `this repo` |
| CiteWard | Test files | **35** | `node -e "console.log(require('./data/citeward-tests.json').numTestFiles)"` | `this repo` |
| Illyria | Page routes | **125** | `find src/app -name page.tsx \| wc -l` | `hotel-demo` |
| Illyria | Database tables | **114** | `grep -rhoE "pgTable[(]" src/db \| wc -l` | `hotel-demo` |
| Illyria | Test cases | **520** | `grep -rhoE "await t[(]" scripts/test \| wc -l` | `hotel-demo` |
| Illyria | Test files | **56** | `ls scripts/test/*.test.ts \| wc -l` | `hotel-demo` |
| Illyria | Commits | **559** | `git rev-list --count HEAD` | `hotel-demo` |
| TextileWays OS | Data models | **105** | `grep -c "^model " prisma/schema.prisma` | `textileways-ops` |
| TextileWays OS | Data models in the upstream baseline | **84** | `git show 393ccb4:prisma/schema.prisma \| grep -c "^model "` | `textileways-ops` |
| PrepsNext Hub | Data models | **23** | `grep -c "^model " prisma/schema.prisma` | `prepsnext-athlete-hub` |
| PrepsNext Hub | API routes | **18** | `find src -name route.ts \| wc -l` | `prepsnext-athlete-hub` |
| PrepsNext Hub | Page routes | **64** | `find src/app -name page.tsx \| wc -l` | `prepsnext-athlete-hub` |
| PrepsNext Hub | Commits | **278** | `git rev-list --count HEAD` | `prepsnext-athlete-hub` |
| PrepsNext Hub | Migrations | **22** | `ls -d prisma/migrations/*/ \| wc -l` | `prepsnext-athlete-hub` |
| PrepsNext Coach Portal | Data models | **15** | `grep -c "^model " prisma/schema.prisma` | `prepsnext-coach-portal` |
| PrepsNext Coach Portal | Page routes | **32** | `find src/app -name page.tsx \| wc -l` | `prepsnext-coach-portal` |
| Kynnected | Screens | **56** | `find app -name "*.tsx" ! -name "_layout.tsx" \| wc -l` | `kynnected` |
| Kynnected | Migrations | **24** | `ls supabase/migrations \| wc -l` | `kynnected` |
| Herbiix | AI evaluation prompts with asserted checks | **25** | `grep -E "^[[:space:]]*prompt:" tests/ai/evals.ts \| grep -vc "prompt: string"` | `herbiix` |
| TextileWays | Permanent redirects for renamed pages | **71** | `grep -c "{ from:" content/configuration/slug-redirects.ts` | `textileways` |
| NovoStitches | Required fields in the quote form | **4** | `grep -cE " required" app/public/wp-content/plugins/novostitches-core/includes/class-rfq-form.php` | `novostitches` |

Test cases are counted, not test files. CiteWard is a vitest run of 35 files. Illyria counts its own `await t(` cases.

</details>

## MISSIONS FLOWN

<table>
<tr><td width="50%" valign="top"><a href="https://citeward.com"><img src="assets/screens/citeward.webp" alt="CiteWard product screen" width="100%"></a><br><sub>AI AGENT</sub><br><a href="https://citeward.com"><b>CiteWard</b></a><br>Medical AI agent that cites every claim, grades its own answer and refuses when the evidence is missing.<br><sub><b>Proof:</b> 32 tools, 158 API routes, 322 test cases</sub></td><td width="50%" valign="top"><a href="https://illyria.vercel.app"><img src="assets/screens/illyria.webp" alt="Illyria product screen" width="100%"></a><br><sub>ERP AND AI AGENT</sub><br><a href="https://illyria.vercel.app"><b>Illyria</b></a><br>Multi-tenant hotel operating system. An AI inbox answers guests across WhatsApp, Instagram, Messenger and web chat.<br><sub><b>Proof:</b> 114 database tables, 520 test cases</sub></td></tr>
<tr><td width="50%" valign="top"><a href="https://herbiix.com"><img src="assets/screens/herbiix.webp" alt="Herbiix product screen" width="100%"></a><br><sub>AI AGENT</sub><br><a href="https://herbiix.com"><b>Herbiix</b></a><br>Food store with a tool-calling AI kitchen agent that recommends only real recipes and defers on medical questions.<br><sub><b>Proof:</b> 25 asserted AI evaluation checks</sub></td><td width="50%" valign="top"><a href="https://celesya.com"><img src="assets/screens/celesya.webp" alt="Celesya product screen" width="100%"></a><br><sub>AI AGENT</sub><br><a href="https://celesya.com"><b>Celesya</b></a><br>Personalised conversational AI guide with profile-based readings, chat and decision rooms.<br><sub><b>Proof:</b> Next.js, Vercel AI SDK, Groq</sub></td></tr>
<tr><td width="50%" valign="top"><img src="assets/screens/kynnected.webp" alt="Kynnected product screen" width="100%"><br><sub>AI AGENT, MOBILE</sub><br><b>Kynnected</b> (private demo on request)<br>Expo and React Native accountability app with AI mentors. Private demo on request.<br><sub><b>Proof:</b> 56 screens, 24 migrations</sub></td><td width="50%" valign="top"><a href="https://coaches.prepsnext.com"><img src="assets/screens/coach.webp" alt="PrepsNext Coach Portal product screen" width="100%"></a><br><sub>CRM</sub><br><a href="https://coaches.prepsnext.com"><b>PrepsNext Coach Portal</b></a><br>Recruiting CRM for college coaches: watchlists, evaluations and outreach in one dashboard.<br><sub><b>Proof:</b> 32 pages, 15 data models</sub></td></tr>
<tr><td width="50%" valign="top"><a href="https://prepsnext.com/hub"><img src="assets/screens/hub.webp" alt="PrepsNext Hub product screen" width="100%"></a><br><sub>PLATFORM</sub><br><a href="https://prepsnext.com/hub"><b>PrepsNext Hub</b></a><br>Recruiting platform for high school athletes with a promotion auction paid through Stripe.<br><sub><b>Proof:</b> 23 data models, 18 API routes, 278 commits</sub></td><td width="50%" valign="top"><a href="https://www.textileways.com"><img src="assets/screens/textileways.webp" alt="TextileWays product screen" width="100%"></a><br><sub>SITE AND SEO SYSTEM</sub><br><a href="https://www.textileways.com"><b>TextileWays</b></a><br>Manufacturer site with an SEO control system: the build fails on duplicate titles, descriptions or H1s.<br><sub><b>Proof:</b> 71 permanent redirects for renamed pages</sub></td></tr>
</table>

Also shipped:

- **[NovoStitches](https://novostitches.com)**, site: Denim and leather manufacturer site on a custom WordPress theme and plugin. Proof: Quote form with 4 required fields.
- **TextileWays OS**, CRM, private demo on request: Sales CRM for the manufacturer: signed idempotent website-to-CRM ingestion, round-robin lead assignment and a 24 hour follow-up SLA task. Built on an MIT-licensed upstream. Proof: 105 data models, extended from 84.

## HOW CITEWARD DECIDES

```mermaid
flowchart LR
    Q[Clinical question] --> R[Retrieve live from FDA, DailyMed, PubMed, Europe PMC, CPIC, ClinicalTrials.gov]
    R --> D[Draft from retrieved sources only]
    D --> A[Adversarial review: anchoring bias, premature closure, missed contraindications]
    A --> G[Confidence grade]
    G --> O{Evidence enough?}
    O -- GO --> C[Answer with a citation for every claim]
    O -- NO-GO --> X[Abstain instead of guessing]
    classDef step fill:#000000,stroke:#E08C2C,stroke-width:2px,color:#FFFFFF
    classDef gate fill:#000000,stroke:#FFFFFF,stroke-width:2px,color:#FFFFFF
    classDef go fill:#E08C2C,stroke:#E08C2C,color:#000000
    classDef nogo fill:#E5484D,stroke:#E5484D,color:#000000
    class Q,R,D,A,G step
    class O gate
    class C go
    class X nogo
```

## MISSION LOG

Three incident reports from the build. Each one says what guards it now, including where the honest answer is "not an automated test yet".

<details>
<summary><b>Log 1.</b> A migration lock that never released (TextileWays OS)</summary>

**Symptom.** Deploys failed with `Error: P1002 ... timed out trying to acquire a postgres advisory lock`. It looked like contention.

**Root cause.** `prisma migrate deploy` takes a session-scoped advisory lock. Behind a pooled Neon endpoint, the pooler can hand that backend to a later, unrelated request before the unlock runs, so the lock stays held by a connection that has moved on. I proved it by joining `pg_locks` to `pg_stat_activity`: the lock holder's last query was an ordinary `SELECT` from the running app, not a migration.

**Fix.** A separate direct connection string for migrations, and a build step, `clear-stale-migration-lock.ts`, that terminates any backend holding an advisory lock before `migrate deploy` runs. It never fails the build, and the app uses no other advisory locks, so nothing legitimate is lost. Commit date: 2026-09-18.

**The test that now guards it.** In the product, the build runs the guard before every migration. I extracted a safer, generic version as [pg-migrate-lock-guard](https://github.com/propugnatorrr-droid/pg-migrate-lock-guard), with integration tests that take a real advisory lock on Postgres 16 and check what the guard does to it.

</details>

<details>
<summary><b>Log 2.</b> Booking integrity SQL that could not be re-run (Illyria)</summary>

**Symptom.** Database setup was blocked. The booking integrity script was part of every setup run.

**Root cause.** Three faults in one file: it added constraints unconditionally, so a second run failed; it duplicated the room-overlap exclusion constraint that a later file already owns; and a one-folio-per-booking unique index would have blocked the multi-window billing the product needs (up to 8 windows on one booking).

**Fix.** The file is idempotent, keeps only what the later file does not cover, drops the old index and adds a unique index per booking window. Commit date: 2026-10-11.

**The test that now guards it.** In `scripts/test/api.test.ts`: the exclusion constraint must exist; two concurrent requests for the last room give one `201` and one `409 sold_out`, and cancelling frees the room; and the database constraint itself is the last line of defence (a `23P01` violation maps to `409`). The pattern is public as [no-double-booking-postgres](https://github.com/propugnatorrr-droid/no-double-booking-postgres), with a race test: twenty concurrent requests, exactly one winner.

</details>

<details>
<summary><b>Log 3.</b> A quote form that sometimes failed silently (NovoStitches)</summary>

**Symptom.** Some visitors landed on `?ns_rfq=error` after submitting, and some saw no message at all.

**Root cause.** The captcha required a minimum age of 4 seconds but the old script only waited for its puzzle, so fast and autofilled submits failed. The puzzle itself was heavy (60,000 hashes). The error text travelled in a 5 minute cookie, so it often never showed. And the form was a 3-step wizard with 23 fields.

**Fix.** One card with 4 required fields, quantity chips, a draft saved in the browser, inline errors, an email typo hint, soft recovery from a stale nonce, and a lead event for analytics. A Reply-To header quoting bug was fixed on the way.

**The test that now guards it.** No automated test yet. I verified it with real test enquiries through to the dashboard, and an automated end-to-end check is an open item.

</details>

## OPEN SOURCE

Small pieces extracted from the products above, with the client code left out. Each has tests that run in CI.

| Repo | What it does |
| --- | --- |
| [pg-migrate-lock-guard](https://github.com/propugnatorrr-droid/pg-migrate-lock-guard) | Finds and, only on request, clears stale Postgres advisory locks that block migrations. Dry run by default. |
| [no-double-booking-postgres](https://github.com/propugnatorrr-droid/no-double-booking-postgres) | A gist exclusion constraint that makes double booking impossible, proven under concurrent requests. |
| [llm-eval-harness](https://github.com/propugnatorrr-droid/llm-eval-harness) | Fixed prompts and plain checks for what an LLM endpoint must never do. No LLM judge, no dependencies. |

## FLIGHT RULES

Real excerpts from the operating rules I give my coding agents. Trimmed for length, not reworded.

> **Definition of done, per commit.** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` passes. No `any`, no `@ts-ignore`, no `console.log`. Zero axe violations on changed pages. Every new interactive element keyboard-reachable with a visible focus ring. No invented facts. No dependency added without a one-line justification in the commit message.

> **Refusal rule for the AI agent.** Never invent a product, recipe, nutrient value or certification. Never give medical, dosage-for-a-condition, pregnancy, paediatric or therapeutic advice, and for anything in that territory recommend a qualified professional in one sentence and stop.

> **Instrument before iterating.** When a fix aimed at a multi-stage pipeline fails twice, stop fixing and instrument. Do not attempt a third fix built on inference about which stage is responsible.

> **Prove it by running it.** Prefer proving a fix works by actually running it over asserting it is correct from reading the code.

## STACK

`TypeScript` `Next.js` `Node.js` `React` `React Native (Expo)` `PostgreSQL` `Prisma` `Drizzle` `Supabase` `Redis` `Stripe` `Playwright` `Vitest` `Jest` `WordPress` `Vercel`

## CONTACT

Open to remote full-time or contract roles as an **Applied AI Engineer**, **AI Agent Engineer** or **Full-Stack AI Engineer**, and to relocation where an employer sponsors a visa.

**Email** asadexcision@gmail.com · **LinkedIn** [linkedin.com/in/propugnator](https://www.linkedin.com/in/propugnator)
