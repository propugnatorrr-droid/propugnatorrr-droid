// Turns a raw CiteWard SSE capture (data/raw/*.sse) into a small sanitised trace JSON.
// Kept: stage metadata, source ids and titles, grades, counts, first sentence of the answer.
// Dropped: full source text, the full answer body, the evidence ledger.
// The queries are synthetic questions typed by me. No patient data was ever involved.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const profile = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const noDashes = (v: unknown): unknown =>
  typeof v === "string" ? v.replace(/\s*[–—]\s*/g, " - ")
  : Array.isArray(v) ? v.map(noDashes)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, noDashes(x)]))
  : v;

function events(file: string): Record<string, any> {
  const ev: Record<string, any> = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.startsWith("data: ")) continue;
    try { const d = JSON.parse(line.slice(6)); const k = Object.keys(d)[0]; ev[k] = d[k]; } catch { /* partial line */ }
  }
  return ev;
}

function build(file: string, query: string, mode: string, label: "GO" | "NO-GO", basis: string) {
  const ev = events(resolve(profile, "data/raw", file));
  const answer = JSON.parse(ev.delta);
  const providers = /from: ([^\n.]+)/.exec(ev.thinking)?.[1] ?? "";
  const bottom = answer.blocks.find((b: any) => b.type === "bottom_line")?.verdict
    ?? answer.blocks.find((b: any) => b.heading === "Bottom line")?.body ?? "";
  const firstSentence = String(bottom).replace(/\*/g, "").split(/(?<=[.!?])\s/)[0];
  return noDashes({
    capturedAt: "2026-11-08",
    request: { endpoint: "POST https://citeward.com/api/oracle", mode, debug_pipeline: true, query },
    stages: {
      retrieve: {
        providers: providers.split(", "),
        total_retrieved: ev.evidence_meta.total_retrieved,
        sources_shown: ev.sources.length,
        top_sources: ev.sources.slice(0, 5).map((s: any) => ({ id: s.id, title: s.title ?? s.guideline_name, year: s.year, url: s.url })),
        relevance: ev.pipeline_debug.relevance,
      },
      draft: { chars: ev.pipeline_debug.draftLength, doses: ev.pipeline_debug.draftDoses, initial_violations: ev.pipeline_debug.initialViolations.length },
      adversarial_review: ev.critique,
      confidence_grade: { ...ev.evidence_meta },
      claims: ev.claim_totals,
    },
    answer: { title: answer.title, headline: firstSentence, cited_ids: ev.cited_ids },
    decision: { label, basis, note: "Label and basis are written by me from the fields above; the pipeline does not emit a GO/NO-GO string." },
  });
}

const go = build("go1.sse", "What is the evidence that SGLT2 inhibitors reduce heart failure hospitalisation in HFpEF?", "research", "GO",
  "Answer delivered with citations. Reviewer confidence amber: 4 of 10 cited sources did not pass claim-level support checking.");
const nogo = build("nogo1.sse", "What is the recommended adult dose of zorvaxinol for stage 3 chronic kidney disease?", "clinic", "NO-GO",
  "Dose withheld. The drug does not exist in the retrieved evidence (relevance.poolOffTarget is true) and the answer refuses to invent one.");
writeFileSync(resolve(profile, "data/trace-go.json"), JSON.stringify(go, null, 2) + "\n");
writeFileSync(resolve(profile, "data/trace-nogo.json"), JSON.stringify(nogo, null, 2) + "\n");
console.log("wrote trace-go.json and trace-nogo.json");
