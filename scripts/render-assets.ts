// Generates assets/telemetry.svg, assets/trace.svg (NO-GO) and assets/trace-go.svg from data/*.json.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { C, DISPLAY, MONO, esc, fmt, guard } from "./lib/svg.ts";

const profile = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => JSON.parse(readFileSync(resolve(profile, p), "utf8"));
const claims = read("data/claims.json").claims;
const v = (id: string): number => {
  if (!claims[id]) throw new Error(`missing claim ${id}`);
  return claims[id].value;
};

// ---------- telemetry ----------
type Cell = { n: number; label: string; sub: string };
const rowA: Cell[] = [
  { n: v("citeward.tools"), label: "AGENT TOOLS", sub: "CiteWard" },
  { n: v("citeward.api_routes"), label: "API ROUTES", sub: "CiteWard" },
  { n: v("citeward.commits"), label: "COMMITS", sub: "CiteWard" },
  { n: v("citeward.tests"), label: "TEST CASES", sub: `CiteWard, ${v("citeward.tests_passed")} passing` },
  { n: v("herbiix.eval_cases"), label: "AI EVAL CHECKS", sub: "Herbiix kitchen agent" },
  { n: v("kynnected.migrations"), label: "MIGRATIONS", sub: "Kynnected" },
];
const rowB: Cell[] = [
  { n: v("illyria.tables"), label: "DB TABLES", sub: "Illyria hotel OS" },
  { n: v("illyria.pages"), label: "PAGE ROUTES", sub: "Illyria hotel OS" },
  { n: v("illyria.test_cases"), label: "TEST CASES", sub: "Illyria hotel OS" },
  { n: v("ops.models"), label: "DATA MODELS", sub: `TextileWays OS CRM, from ${v("ops.models_baseline")}` },
  { n: v("hub.models"), label: "DATA MODELS", sub: "PrepsNext Hub" },
  { n: v("hub.api_routes"), label: "API ROUTES", sub: "PrepsNext Hub" },
];

function telemetry(): string {
  const W = 1280;
  const cw = W / 6;
  const cells = (row: Cell[], y: number) =>
    row
      .map((c, i) => {
        const x = i * cw;
        return `<g transform="translate(${x},${y})">
<rect x="10" y="0" width="${cw - 20}" height="132" fill="#0A0A0A" stroke="${C.line}"/>
<rect x="10" y="0" width="${cw - 20}" height="3" fill="${C.gold}"/>
<text x="${cw / 2}" y="66" text-anchor="middle" font-family="${MONO}" font-size="50" font-weight="700" fill="${C.fg}">${fmt(c.n)}</text>
<text x="${cw / 2}" y="94" text-anchor="middle" font-family="${DISPLAY}" font-size="13" font-weight="700" letter-spacing="3" fill="${C.gold}">${esc(c.label)}</text>
<text x="${cw / 2}" y="116" text-anchor="middle" font-family="${DISPLAY}" font-size="12" fill="${C.dim}">${esc(c.sub)}</text></g>`;
      })
      .join("");
  return guard(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 410" width="${W}" height="410" role="img" aria-labelledby="t d">
<title id="t">Telemetry</title><desc id="d">Twelve counted figures from the codebases: CiteWard ${v("citeward.tools")} tools, ${v("citeward.api_routes")} API routes, ${fmt(v("citeward.commits"))} commits, ${v("citeward.tests")} test cases; Illyria ${v("illyria.tables")} tables; TextileWays OS ${v("ops.models")} data models.</desc>
<rect width="${W}" height="410" fill="${C.bg}"/>
<text x="24" y="38" font-family="${DISPLAY}" font-size="15" font-weight="700" letter-spacing="6" fill="${C.gold}">TELEMETRY</text>
<text x="${W - 24}" y="38" text-anchor="end" font-family="${MONO}" font-size="13" fill="${C.dim}">counted from source, see data/claims.json</text>
<text x="24" y="78" font-family="${DISPLAY}" font-size="12" letter-spacing="4" fill="${C.fg}">AGENTS AND AI</text>
${cells(rowA, 90)}
<text x="24" y="250" font-family="${DISPLAY}" font-size="12" letter-spacing="4" fill="${C.fg}">CRM, ERP AND OPERATING SYSTEMS</text>
${cells(rowB, 262)}
</svg>`,
    "telemetry",
  );
}

// ---------- trace replay ----------
type Seg = { t: string; c?: string; b?: boolean };
type Line = { segs: Seg[]; at: number };

function trace(
  name: string,
  title: string,
  lines: Line[],
  decision: { label: string; color: string; text: string; at: number },
  alt: string,
): string {
  const W = 1280;
  const lh = 28;
  const top = 96;
  const cycle = 24;
  const pct = (s: number) => (s / cycle) * 100;
  let css = `.m{font-family:${MONO};font-size:16px}.l{opacity:0}`;
  const all = [...lines.map((l) => l.at), decision.at];
  all.forEach((at, i) => {
    css += `.k${i}{animation:k${i} ${cycle}s linear infinite}@keyframes k${i}{0%,${pct(at).toFixed(2)}%{opacity:0}${(pct(at) + 0.4).toFixed(2)}%,95%{opacity:1}100%{opacity:0}}`;
  });
  css += `@media (prefers-reduced-motion:reduce){.l{animation:none!important;opacity:1!important}}`;
  const body = lines
    .map((l, i) => {
      const y = top + i * lh;
      const spans = l.segs
        .map((s) => `<tspan fill="${s.c ?? C.fg}"${s.b ? ' font-weight="700"' : ""}>${esc(s.t)}</tspan>`)
        .join("");
      return `<text class="m l k${i}" x="32" y="${y}" xml:space="preserve">${spans}</text>`;
    })
    .join("");
  const dy = top + lines.length * lh + 14;
  const H = dy + 100;
  const di = lines.length;
  return guard(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title><desc id="d">${esc(alt)}</desc>
<style>${css}</style>
<rect width="${W}" height="${H}" fill="${C.bg}"/>
<rect x="8" y="8" width="${W - 16}" height="${H - 16}" fill="none" stroke="${C.line}"/>
<rect x="8" y="8" width="${W - 16}" height="44" fill="#0A0A0A"/>
<rect x="24" y="22" width="14" height="14" fill="${C.gold}"/>
<text x="52" y="35" font-family="${DISPLAY}" font-size="14" font-weight="700" letter-spacing="5" fill="${C.fg}">${esc(title)}</text>
<text x="${W - 28}" y="35" text-anchor="end" font-family="${MONO}" font-size="13" fill="${C.dim}">real capture, 2026-11-08</text>
${body}
<g class="l k${di}"><rect x="24" y="${dy - 8}" width="${W - 48}" height="84" fill="#0A0A0A" stroke="${decision.color}" stroke-width="2"/>
<text x="48" y="${dy + 30}" font-family="${DISPLAY}" font-size="30" font-weight="700" letter-spacing="3" fill="${decision.color}">${esc(decision.label)}</text>
<text x="48" y="${dy + 60}" font-family="${MONO}" font-size="15" fill="${C.fg}">${esc(decision.text)}</text></g>
</svg>`,
    name,
  );
}

const dim = (t: string): Seg => ({ t, c: C.dim });
const gold = (t: string): Seg => ({ t, c: C.gold, b: true });

const ng = read("data/trace-nogo.json");
const g = read("data/trace-go.json");
const rel = ng.stages.retrieve.relevance;
const ngr = ng.stages.adversarial_review;
const ngg = ng.stages.confidence_grade;
const noGoSvg = trace(
  "trace",
  "CITEWARD  /  NO-GO REPLAY",
  [
    { at: 0.5, segs: [dim("$ "), { t: "POST /api/[redacted]  mode=clinic" }] },
    { at: 1.5, segs: [gold("QUERY     "), { t: ng.request.query }] },
    { at: 3, segs: [gold("T-0  RETRIEVE   "), { t: `${ng.stages.retrieve.total_retrieved} sources from ${ng.stages.retrieve.providers.join(", ")}` }] },
    { at: 4.5, segs: [dim("     relevance   "), { t: `best ${rel.best}  floor ${rel.floor}  pool_off_target=${rel.poolOffTarget}`, c: C.red }] },
    { at: 6.5, segs: [gold("T+1  DRAFT      "), { t: `${fmt(ng.stages.draft.chars)} chars, doses in draft: ${ng.stages.draft.doses.length}` }] },
    { at: 8.5, segs: [gold("T+2  REVIEW     "), { t: `adversarial critic: confidence ${ngr.confidence}, flags ${ngr.flags.length}, get_human ${ngr.get_human}` }] },
    { at: 10.5, segs: [gold("T+3  GRADE      "), { t: `evidence strength ${ngg.strength}, ${ngg.total_supported} of ${ngg.total_cited} cited sources passed support check` }] },
    { at: 12.5, segs: [gold("T+4  ANSWER     "), { t: `"${ng.answer.headline.split(" - ")[0].replace(/"/g, "")}."` }] },
  ],
  { label: "NO-GO: DOSE WITHHELD", color: C.red, text: "No retrieved source names this drug. The agent refuses to invent a dose.", at: 14.5 },
  "Animated terminal replay of a real CiteWard trace. Retrieval finds 12 sources, none naming the drug. The reviewer grades the refusal green. The decision is NO-GO: dose withheld.",
);

const gr = g.stages.adversarial_review;
const gg = g.stages.confidence_grade;
const goSvg = trace(
  "trace-go",
  "CITEWARD  /  GO REPLAY",
  [
    { at: 0.5, segs: [dim("$ "), { t: "POST /api/[redacted]  mode=research" }] },
    { at: 1.5, segs: [gold("QUERY     "), { t: g.request.query }] },
    { at: 3, segs: [gold("T-0  RETRIEVE   "), { t: `${g.stages.retrieve.total_retrieved} sources from ${g.stages.retrieve.providers.join(", ")}` }] },
    { at: 4.5, segs: [gold("T+1  DRAFT      "), { t: `${fmt(g.stages.draft.chars)} chars, doses in draft: ${g.stages.draft.doses.join(", ")}` }] },
    { at: 6.5, segs: [gold("T+2  REVIEW     "), { t: `adversarial critic: confidence ${gr.confidence}, flags ${gr.flags.length}` }] },
    { at: 8.5, segs: [gold("T+3  GRADE      "), { t: `evidence strength ${gg.strength}, ${gg.total_supported} of ${gg.total_cited} cited sources passed support check` }] },
    { at: 10.5, segs: [gold("T+4  ANSWER     "), { t: `"${g.answer.headline.slice(0, 96)}..."` }] },
  ],
  {
    label: "GO: ANSWER WITH CITATIONS",
    color: C.gold,
    text: `Confidence amber: ${gg.total_cited - gg.total_supported} of ${gg.total_cited} cited sources did not pass claim-level checking, and it says so.`,
    at: 12.5,
  },
  "Animated terminal replay of a real CiteWard trace. Sixty sources retrieved, a long draft, reviewer confidence amber, six of ten cited sources supported. The decision is GO, with the weakness stated.",
);

// assets/stack.svg is built by scripts/build-stack.mjs (data/stack.json), not here.
writeFileSync(resolve(profile, "assets/telemetry.svg"), telemetry());
writeFileSync(resolve(profile, "assets/trace.svg"), noGoSvg);
writeFileSync(resolve(profile, "assets/trace-go.svg"), goSvg);
console.log("wrote telemetry.svg, trace.svg, trace-go.svg");
