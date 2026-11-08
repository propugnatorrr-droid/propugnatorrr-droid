// Requests each live product URL and renders assets/status.svg as a launch status board.
// Runs in GitHub Actions every 6 hours. It rewrites files only when a GO/NO-GO state flips
// or the last write is older than 24 hours, so the commit history stays quiet.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { C, DISPLAY, MONO, esc, guard } from "./lib/svg.ts";

const profile = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const products = JSON.parse(readFileSync(resolve(profile, "data/products.json"), "utf8")).products.filter((p: any) => p.live);
const statusFile = resolve(profile, "data/status.json");
const previous = existsSync(statusFile) ? JSON.parse(readFileSync(statusFile, "utf8")) : null;

type Row = { name: string; url: string; go: boolean; ms: number | null; code: number | null };

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
const same = previous && previous.rows.length === rows.length && previous.rows.every((r: Row, i: number) => r.go === rows[i].go);
const fresh = previous && Date.now() - Date.parse(previous.checkedAt) < 24 * 3600 * 1000;
if (same && fresh && existsSync(resolve(profile, "assets/status.svg"))) {
  console.log("no state change and board is under 24h old: nothing written");
  process.exit(0);
}

const W = 1280;
const rh = 50;
const H = 150 + rows.length * rh;
const goCount = rows.filter((r) => r.go).length;
const utc = checkedAt.slice(0, 16).replace("T", " ") + " UTC";
const body = rows
  .map((r, i) => {
    const y = 120 + i * rh;
    const col = r.go ? C.gold : C.red;
    return `<g transform="translate(0,${y})">
<line x1="24" x2="${W - 24}" y1="0" y2="0" stroke="${C.line}"/>
<text x="32" y="32" font-family="${DISPLAY}" font-size="19" font-weight="700" letter-spacing="2" fill="${C.fg}">${esc(r.name.toUpperCase())}</text>
<rect x="470" y="9" width="120" height="30" fill="${col}"/>
<text x="530" y="31" text-anchor="middle" font-family="${DISPLAY}" font-size="17" font-weight="700" letter-spacing="3" fill="#000000">${r.go ? "GO" : "NO-GO"}</text>
<text x="640" y="31" font-family="${MONO}" font-size="18" fill="${C.fg}">${r.ms === null ? "no response" : r.ms + " ms"}</text>
<text x="800" y="31" font-family="${MONO}" font-size="15" fill="${C.dim}">${esc(r.url.replace("https://", ""))}</text></g>`;
  })
  .join("");
const svg = guard(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
<title id="t">Launch status board</title><desc id="d">${goCount} of ${rows.length} products responding at ${utc}. ${rows.map((r) => `${r.name} ${r.go ? "GO" : "NO-GO"}`).join(", ")}.</desc>
<rect width="${W}" height="${H}" fill="${C.bg}"/>
<text x="24" y="42" font-family="${DISPLAY}" font-size="15" font-weight="700" letter-spacing="6" fill="${C.gold}">LAUNCH STATUS BOARD</text>
<text x="${W - 24}" y="42" text-anchor="end" font-family="${MONO}" font-size="14" fill="${C.fg}">${goCount} OF ${rows.length} GO  |  last checked ${utc}</text>
<text x="32" y="98" font-family="${DISPLAY}" font-size="12" letter-spacing="4" fill="${C.dim}">PRODUCT</text>
<text x="470" y="98" font-family="${DISPLAY}" font-size="12" letter-spacing="4" fill="${C.dim}">STATUS</text>
<text x="640" y="98" font-family="${DISPLAY}" font-size="12" letter-spacing="4" fill="${C.dim}">RESPONSE</text>
<text x="800" y="98" font-family="${DISPLAY}" font-size="12" letter-spacing="4" fill="${C.dim}">ENDPOINT</text>
${body}
<line x1="24" x2="${W - 24}" y1="${H - 20}" y2="${H - 20}" stroke="${C.line}"/>
</svg>`,
  "status",
);
writeFileSync(resolve(profile, "assets/status.svg"), svg);
writeFileSync(statusFile, JSON.stringify({ checkedAt, rows }, null, 2) + "\n");
console.log(rows.map((r) => `${r.name}: ${r.go ? "GO" : "NO-GO"} ${r.ms ?? "-"} ms (${r.code ?? "no response"})`).join("\n"));
