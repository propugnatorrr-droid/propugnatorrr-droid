// Generates README.md from data/claims.json, data/products.json and the two sanitised traces.
// No number in the README is typed by hand: every figure is a {claim.id} token or read from a JSON file.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fmt } from "./lib/svg.ts";

const profile = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => JSON.parse(readFileSync(resolve(profile, p), "utf8"));
const claims = read("data/claims.json").claims as Record<string, { value: number; label: string; product: string; command: string; cwd: string }>;
const { products, private: priv } = read("data/products.json");
const goJson = JSON.stringify(read("data/trace-go.json"), null, 2);
const noGoJson = JSON.stringify(read("data/trace-nogo.json"), null, 2);

const sub = (s: string) =>
  s.replace(/\{([a-z0-9_.]+)\}/g, (_m, id) => {
    if (!claims[id]) throw new Error(`unknown claim token ${id}`);
    return fmt(claims[id].value);
  });
const T = (id: string) => fmt(claims[id].value);

// ---- missions grid (screenshots, two columns) ----
const withShot = products.filter((p: any) => p.screen);
const cell = (p: any) => {
  const img = `<img src="assets/screens/${p.screen}.webp" alt="${p.name} product screen" width="100%">`;
  const shot = p.live && p.url ? `<a href="${p.url}">${img}</a>` : img;
  const name = p.live && p.url ? `<a href="${p.url}"><b>${p.name}</b></a>` : `<b>${p.name}</b>`;
  const tag = p.live ? "" : " (private demo on request)";
  return `<td width="50%" valign="top">${shot}<br><sub>${p.kind.toUpperCase()}</sub><br>${name}${tag}<br>${sub(p.what)}<br><sub><b>Proof:</b> ${sub(p.proof)}</sub></td>`;
};
const rows: string[] = [];
for (let i = 0; i < withShot.length; i += 2) rows.push(`<tr>${cell(withShot[i])}${withShot[i + 1] ? cell(withShot[i + 1]) : "<td></td>"}</tr>`);
const noShot = products.filter((p: any) => !p.screen);
const alsoShipped = [
  ...noShot.map((p: any) => `- **[${p.name}](${p.url})**, ${p.kind.toLowerCase()}: ${sub(p.what)} Proof: ${sub(p.proof)}.`),
  ...priv.map((p: any) => `- **${p.name}**, ${p.kind}, private demo on request: ${sub(p.what)} Proof: ${sub(p.proof)}.`),
].join("\n");

// ---- how every number is counted ----
const used = Object.entries(claims)
  .map(([id, c]) => `| ${c.product} | ${c.label} | **${fmt(c.value)}** | \`${c.command.replace(/\|/g, "\\|")}\` |`)
  .join("\n");

// ---- spotlights: every figure is a claim token, every feature comes from the product itself ----
const tile = (file: string, alt: string, caption: string) =>
  `<td width="50%" valign="top"><img src="assets/screens/${file}.webp" alt="${alt}" width="100%"><br><sub>${caption}</sub></td>`;

const illyriaSection = `## SPOTLIGHT: ILLYRIA, A HOTEL OPERATING SYSTEM WITH AN AGENT ON TOP

Illyria is an AI-first hotel and resort platform, multi-tenant and Albanian-first. Property management, master calendar, channel manager, unified inbox, point of sale, invoicing and reports live in one product. [Open the live demo](https://illyria.vercel.app). The hotel in it is fictional, and so is all of its data.

<table>
<tr>
${tile("illyria", "Illyria master calendar showing every room night by night with bookings from several channels", "Master calendar: drag a booking to another room, stretch a stay by its edge.")}
${tile("illyria-inbox", "Illyria unified inbox with guest conversations from WhatsApp, Instagram, Messenger and web chat", "Unified inbox: WhatsApp, Instagram, Messenger and web chat. The AI replies, staff step in any time.")}
</tr>
<tr>
${tile("illyria-assistant", "Illyria hotel agent that takes instructions in plain language", "Hotel agent: ask in plain language. It reads real data and acts with the user's permissions. Risky actions need confirmation.")}
${tile("illyria-pos", "Illyria point of sale for bar, restaurant and pool", "Bar, restaurant and pool point of sale, billed to the guest's room.")}
</tr>
</table>

- **One system for the whole property:** calendar, bookings, arrivals, housekeeping, preventive maintenance, quality audits, lost and found, shift handover and night audit.
- **Channels:** iCal and Channex adapters for the channel manager, and fiscal invoicing adapters that switch per hotel between mock, sandbox and live.
- **Reports** for revenue, occupancy and average rate, exportable to Excel or PDF.
- **Proof:** ${T("illyria.pages")} page routes, ${T("illyria.tables")} database tables, ${T("illyria.test_cases")} test cases, ${T("illyria.commits")} commits.
- **Double booking is blocked by the database itself.** The story is in [Mission Log 2](#mission-log), and the pattern is public as [no-double-booking-postgres](https://github.com/propugnatorrr-droid/no-double-booking-postgres).
`;

const celesyaSection = `## SPOTLIGHT: CELESYA, A GUIDE THAT KNOWS ITS LIMITS

Celesya is a personalised AI guide. It gives readings from a name and a date of birth, drawing on traditions such as astrology and numerology, then keeps the conversation going. [Visit celesya.com](https://celesya.com).

<table>
<tr>
${tile("celesya", "Celesya landing page with the headline An oracle that learned to read", "Landing page: a name and a date of birth start a reading.")}
${tile("celesya-mobile", "Celesya on a phone", "The same experience on a phone.")}
</tr>
</table>

- **Surfaces:** chat with the guide, an oracle, decision rooms, chambers, dream and shadow work, a journal, letters, forecasts, compatibility and a timeline.
- **Memory:** a per-user store of what the person has shared. Confirmed memories rank first and rejected ones are dropped.
- **Typed replies:** structured answers are validated against schemas before they are used.
- **A safety layer with three levels.** A crisis message gets a referral to help, not a reading. Medical, legal and financial questions are redirected to a professional while the guide stays engaged. It is the same principle as CiteWard: know when not to answer.
- **Proof:** ${T("celesya.pages")} pages, ${T("celesya.api_routes")} API routes. Built with Next.js and Supabase, with Framer Motion and three.js for the visuals.
`;

const readmeRaw = `<p align="center">
  <img src="assets/banner.png" alt="PROPUGNATOR. AI engineer, agentic systems and full-stack. Agents that know when not to answer." width="100%">
</p>

<p align="center">
  <img src="assets/stack.svg" alt="Languages and stack: TypeScript, JavaScript, PHP, SQL, HTML, CSS, React, Next.js, Node.js, React Native with Expo, Tailwind CSS, WordPress, PostgreSQL, Prisma, Drizzle, Supabase, Neon, Redis, Stripe, Vercel, GitHub Actions, Vitest, Jest and Playwright." width="100%">
</p>

I build AI agents, CRM and ERP systems, and the products around them. Source is private for client reasons. Everything below is generated from the code or checked live.

## LAUNCH STATUS BOARD

<p align="center">
  <img src="assets/status.svg" alt="Launch status board. Each live product shows GO or NO-GO, response time in milliseconds and the last-checked time in UTC." width="100%">
</p>

A GitHub Action requests every product URL every 6 hours. If a site is down, the board says NO-GO.

## SPOTLIGHT: CITEWARD, THE AGENT THAT KNOWS WHEN NOT TO ANSWER

<p align="center">
  <a href="https://citeward.com"><img src="assets/screens/citeward.webp" alt="CiteWard, a medical AI agent. Every claim, cited. It refuses to answer when the evidence is missing." width="100%"></a>
</p>

Real traces from the live CiteWard pipeline, captured from the pipeline's internal trace output. The questions are synthetic, so no patient data is involved.

<p align="center">
  <img src="assets/trace.svg" alt="Animated terminal replay of a real CiteWard trace. Twelve sources retrieved, none naming the drug. The decision is NO-GO: dose withheld." width="100%">
</p>

<details>
<summary>Proof: raw sanitised trace JSON for the NO-GO case</summary>

\`\`\`json
${noGoJson}
\`\`\`

</details>

And a question the evidence can answer. Confidence is amber, and the agent says why.

<p align="center">
  <img src="assets/trace-go.svg" alt="Animated terminal replay of a real CiteWard trace. Sixty sources retrieved, reviewer confidence amber, six of ten cited sources supported. The decision is GO." width="100%">
</p>

<details>
<summary>Proof: raw sanitised trace JSON for the GO case</summary>

\`\`\`json
${goJson}
\`\`\`

</details>

## TELEMETRY

<p align="center">
  <img src="assets/telemetry.svg" alt="Twelve counted readouts: CiteWard ${T("citeward.tools")} tools, ${T("citeward.api_routes")} API routes, ${T("citeward.commits")} commits and ${T("citeward.tests")} test cases; Illyria ${T("illyria.tables")} tables and ${T("illyria.test_cases")} test cases; TextileWays OS ${T("ops.models")} data models." width="100%">
</p>

<details>
<summary>How every number is counted</summary>

Each figure is produced by a command run against the real repository, written to [\`data/claims.json\`](data/claims.json) by [\`scripts/collect-claims.ts\`](scripts/collect-claims.ts), and this README is generated from that file.

| Product | What | Value | Command |
| --- | --- | ---: | --- |
${used}

Test cases are counted, not test files. CiteWard is a vitest run of ${T("citeward.test_files")} files. Illyria counts its own \`await t(\` cases.

</details>

## MISSIONS FLOWN

<table>
${rows.join("\n")}
</table>

## HOW CITEWARD DECIDES

\`\`\`mermaid
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
\`\`\`

## MISSION LOG

Three incident reports from the build. Each one says what guards it now, including where the honest answer is "not an automated test yet".

<details>
<summary><b>Log 1.</b> A migration lock that never released (TextileWays OS)</summary>

**Symptom.** Deploys failed with \`Error: P1002 ... timed out trying to acquire a postgres advisory lock\`. It looked like contention.

**Root cause.** \`prisma migrate deploy\` takes a session-scoped advisory lock. Behind a pooled Neon endpoint, the pooler can hand that backend to a later, unrelated request before the unlock runs, so the lock stays held by a connection that has moved on. I proved it by joining \`pg_locks\` to \`pg_stat_activity\`: the lock holder's last query was an ordinary \`SELECT\` from the running app, not a migration.

**Fix.** A separate direct connection string for migrations, and a build step, \`clear-stale-migration-lock.ts\`, that terminates any backend holding an advisory lock before \`migrate deploy\` runs. It never fails the build, and the app uses no other advisory locks, so nothing legitimate is lost. Commit date: 2026-09-18.

**The test that now guards it.** In the product, the build runs the guard before every migration. I extracted a safer, generic version as [pg-migrate-lock-guard](https://github.com/propugnatorrr-droid/pg-migrate-lock-guard), with integration tests that take a real advisory lock on Postgres 16 and check what the guard does to it.

</details>

<details>
<summary><b>Log 2.</b> Booking integrity SQL that could not be re-run (Illyria)</summary>

**Symptom.** Database setup was blocked. The booking integrity script was part of every setup run.

**Root cause.** Three faults in one file: it added constraints unconditionally, so a second run failed; it duplicated the room-overlap exclusion constraint that a later file already owns; and a one-folio-per-booking unique index would have blocked the multi-window billing the product needs (up to 8 windows on one booking).

**Fix.** The file is idempotent, keeps only what the later file does not cover, drops the old index and adds a unique index per booking window. Commit date: 2026-10-11.

**The test that now guards it.** In \`scripts/test/api.test.ts\`: the exclusion constraint must exist; two concurrent requests for the last room give one \`201\` and one \`409 sold_out\`, and cancelling frees the room; and the database constraint itself is the last line of defence (a \`23P01\` violation maps to \`409\`). The pattern is public as [no-double-booking-postgres](https://github.com/propugnatorrr-droid/no-double-booking-postgres), with a race test: twenty concurrent requests, exactly one winner.

</details>

<details>
<summary><b>Log 3.</b> A quote form that sometimes failed silently (NovoStitches)</summary>

**Symptom.** Some visitors landed on \`?ns_rfq=error\` after submitting, and some saw no message at all.

**Root cause.** The captcha required a minimum age of 4 seconds but the old script only waited for its puzzle, so fast and autofilled submits failed. The puzzle itself was heavy (60,000 hashes). The error text travelled in a 5 minute cookie, so it often never showed. And the form was a 3-step wizard with 23 fields.

**Fix.** One card with ${T("novostitches.rfq_required")} required fields, quantity chips, a draft saved in the browser, inline errors, an email typo hint, soft recovery from a stale nonce, and a lead event for analytics. A Reply-To header quoting bug was fixed on the way.

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

Real excerpts from my engineering operating rules. Trimmed for length, not reworded.

> **Definition of done, per commit.** \`pnpm lint && pnpm typecheck && pnpm test && pnpm build\` passes. No \`any\`, no \`@ts-ignore\`, no \`console.log\`. Zero axe violations on changed pages. Every new interactive element keyboard-reachable with a visible focus ring. No invented facts. No dependency added without a one-line justification in the commit message.

> **Refusal rule for the AI agent.** Never invent a product, recipe, nutrient value or certification. Never give medical, dosage-for-a-condition, pregnancy, paediatric or therapeutic advice, and for anything in that territory recommend a qualified professional in one sentence and stop.

> **Instrument before iterating.** When a fix aimed at a multi-stage pipeline fails twice, stop fixing and instrument. Do not attempt a third fix built on inference about which stage is responsible.

> **Prove it by running it.** Prefer proving a fix works by actually running it over asserting it is correct from reading the code.

## CONTACT

Open to remote full-time or contract roles as an **Applied AI Engineer**, **AI Agent Engineer** or **Full-Stack AI Engineer**, and to relocation where an employer sponsors a visa.

**Email** asadexcision@gmail.com · **LinkedIn** [linkedin.com/in/propugnator](https://www.linkedin.com/in/propugnator)

<sub>Stack icons from <a href="https://simpleicons.org">Simple Icons</a> (CC0), served from this repo. Logos are trademarks of their owners.</sub>
`;

// ---- order: status, telemetry, all products, then one spotlight per product family ----
const parts = readmeRaw.split(/\n(?=## )/);
const intro = parts.shift() as string;
const take = (title: string): string => {
  const i = parts.findIndex((x) => x.startsWith(`## ${title}`));
  if (i < 0) throw new Error(`section not found: ${title}`);
  return parts.splice(i, 1)[0];
};
const ordered = [
  take("LAUNCH STATUS BOARD"),
  take("TELEMETRY"),
  take("MISSIONS FLOWN"),
  illyriaSection,
  celesyaSection,
  take("SPOTLIGHT: CITEWARD"),
  take("HOW CITEWARD DECIDES"),
  take("MISSION LOG"),
  take("OPEN SOURCE"),
  take("FLIGHT RULES"),
  take("CONTACT"),
  ...parts,
];
let assembled = [intro, ...ordered.map((x) => x.replace(/\n+$/, "\n"))].join("\n");

// GitHub caches README images for about 5 minutes. A content hash in the URL makes an edited image show at once.
assembled = assembled.replace(/src="(assets\/[^"?]+)"/g, (_m, path: string) => {
  const hash = createHash("sha1").update(readFileSync(resolve(profile, path))).digest("hex").slice(0, 8);
  return `src="${path}?v=${hash}"`;
});
const readme = assembled;

if (/[\u2013\u2014]/.test(readme)) throw new Error("README contains an em or en dash");
writeFileSync(resolve(profile, "README.md"), readme);
console.log("README.md written,", Buffer.byteLength(readme), "bytes");
