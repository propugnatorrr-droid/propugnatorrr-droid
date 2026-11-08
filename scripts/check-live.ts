// Requests each live product URL and renders assets/status.svg as a launch status board.
// Runs in GitHub Actions every 6 hours. It rewrites files only when a GO/NO-GO state flips
// or the last write is older than 24 hours, so the commit history stays quiet.
// The drawing lives in scripts/lib/status-svg.ts.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderStatus, type Row } from "./lib/status-svg.ts";

const profile = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const products = JSON.parse(readFileSync(resolve(profile, "data/products.json"), "utf8")).products.filter((p: any) => p.live);
const statusFile = resolve(profile, "data/status.json");
const previous = existsSync(statusFile) ? JSON.parse(readFileSync(statusFile, "utf8")) : null;

// A site is NO-GO only after three failed attempts, so one network flake cannot show a false outage.
async function probe(p: any): Promise<Row> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const t0 = performance.now();
    try {
      const res = await fetch(p.url, { redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "user-agent": "propugnator-status-board/1.0" } });
      const ms = Math.round(performance.now() - t0);
      if (res.status < 500 || attempt === 3) return { name: p.name, url: p.url, go: res.status < 400, ms, code: res.status };
    } catch {
      if (attempt === 3) break;
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return { name: p.name, url: p.url, go: false, ms: null, code: null };
}

const rows: Row[] = await Promise.all(products.map(probe));
const checkedAt = new Date().toISOString();
const states = (list: Row[]) => list.map((r) => `${r.name}:${r.go}`).sort().join("|");
const same = previous && states(previous.rows) === states(rows);
const fresh = previous && Date.now() - Date.parse(previous.checkedAt) < 24 * 3600 * 1000;
if (same && fresh && existsSync(resolve(profile, "assets/status.svg"))) {
  console.log("no state change and board is under 24h old: nothing written");
  process.exit(0);
}

writeFileSync(resolve(profile, "assets/status.svg"), renderStatus(rows, checkedAt));
writeFileSync(statusFile, JSON.stringify({ checkedAt, rows }, null, 2) + "\n");
console.log(rows.map((r) => `${r.name}: ${r.go ? "GO" : "NO-GO"} ${r.ms ?? "-"} ms (${r.code ?? "no response"})`).join("\n"));
