// Draws assets/status.svg: the mission-control launch status board.
// Pure function of the check results, so the board can never be edited by hand or drift from the data.
import { guard } from "./svg.ts";

export type Row = { name: string; url: string; go: boolean; ms: number | null; code: number | null };

// Display order on the board, by product name. Anything not listed goes last, in the order it was checked.
const ORDER = ["CiteWard", "Illyria", "PrepsNext Hub", "PrepsNext Coach Portal", "TextileWays", "NovoStitches", "Herbiix", "Celesya"];

const GOLD = "#E08C2C";
const RED = "#E5484D";
const ROW_H = 56;
const ROWS_Y = 262;
const BAR_X = 640;
const BAR_W = 240; // 1000 ms fills the track

// Compact CSS time: .3 not 0.3, 1 not 1.00
const t = (v: number) => String(+v.toFixed(2)).replace(/^0\./, ".");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return Math.round(s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2);
}

export function renderStatus(input: Row[], checkedAt: string): string {
  const rows = [...input].sort((a, b) => {
    const ia = ORDER.indexOf(a.name);
    const ib = ORDER.indexOf(b.name);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });
  const n = rows.length;
  const goCount = rows.filter((r) => r.go).length;
  const responding = rows.filter((r) => r.ms !== null) as (Row & { ms: number })[];
  const med = responding.length ? median(responding.map((r) => r.ms)) : null;
  const fastest = responding.length ? responding.reduce((a, b) => (b.ms < a.ms ? b : a)) : null;
  const slowest = responding.length ? responding.reduce((a, b) => (b.ms > a.ms ? b : a)) : null;
  const bottom = ROWS_Y + n * ROW_H;
  const H = bottom + 70;
  const date = checkedAt.slice(0, 10);
  const clock = `${checkedAt.slice(11, 16)} UTC`;
  const allGo = goCount === n;
  const state = allGo ? { label: "GO", color: GOLD } : goCount === 0 ? { label: "NO-GO", color: RED } : { label: "DEGRADED", color: RED };

  const desc =
    `${goCount} of ${n} products responding at ${date} ${clock}.` +
    (med !== null ? ` Median response ${med} ms.` : "") +
    ` ${rows.map((r) => `${r.name} ${r.go ? `${r.ms} ms` : "NO-GO"}`).join(", ")}.` +
    (allGo ? " All GO." : ` ${n - goCount} NO-GO.`);

  const row = (r: Row, i: number): string => {
    const y = ROWS_Y + i * ROW_H;
    const id = `M-${String(i + 1).padStart(2, "0")}`;
    const nameSize = r.name.length > 20 ? 16 : 17;
    const col = r.go ? GOLD : RED;
    const pillFill = r.go ? "#140D04" : "#140404";
    const dot = r.go
      ? `<circle cx="490" cy="28" r="4" fill="${GOLD}" class="ring"${i ? ` style="animation-delay:${t(i * 0.3)}s"` : ""}/><circle cx="490" cy="28" r="4" fill="${GOLD}"/>`
      : `<circle cx="490" cy="28" r="4" fill="${RED}"/>`;
    const bar =
      r.ms !== null && r.go
        ? `\n<rect x="${BAR_X}" y="24" width="${+(Math.min(r.ms, 1000) * 0.24).toFixed(1)}" height="8" fill="url(#bar)" class="bar" style="animation-delay:${t(0.4 + i * 0.1)}s"/>`
        : "";
    const reading = r.ms === null ? "no response" : r.go ? `${r.ms} ms` : `HTTP ${r.code}`;
    return `<g transform="translate(0,${y})"><g class="row" style="animation-delay:${t((i + 1) * 0.1)}s">
<line x1="24" x2="1256" stroke="#1F1F1F"/>
<text x="32" y="35" class="m" font-size="13" fill="#5E5E5E">${id}</text>
<text x="104" y="35" class="f" font-size="${nameSize}" font-weight="700" letter-spacing="2" fill="#FFFFFF">${esc(r.name.toUpperCase())}</text>
<rect x="470" y="13" width="120" height="30" rx="2" fill="${pillFill}" stroke="${col}"/>
${dot}
<text x="544" y="34" text-anchor="middle" class="f" font-size="15" font-weight="700" letter-spacing="4" fill="${col}">${r.go ? "GO" : "NO-GO"}</text>
<rect x="${BAR_X}" y="24" width="${BAR_W}" height="8" fill="#151515"/>${bar}
<text x="900" y="35" class="m" font-size="${r.go ? 17 : 14}" fill="${r.go ? "#FFFFFF" : RED}">${reading}</text>
<text x="1010" y="35" class="m" font-size="14" fill="#8C8C8C">${esc(r.url.replace(/^https?:\/\//, ""))}</text>
</g></g>`;
  };

  // Summary strip. The label after each value sits just to its right.
  const valueW = (s: string, size: number) => Math.round(size * 0.6 * s.length);
  const medText = med !== null ? `${med} ms` : "n/a";
  const fastText = fastest ? `${fastest.ms} ms` : "n/a";
  const slowText = slowest ? `${slowest.ms} ms` : "n/a";
  const fastName = fastest ? `<text x="${356 + valueW(fastText, 24) + 18}" y="192">${esc(fastest.name.toUpperCase())}</text>` : "";
  const slowName = slowest ? `<text x="${664 + valueW(slowText, 24) + 18}" y="192">${esc(slowest.name.toUpperCase())}</text>` : "";
  const dateX = 972 + valueW(clock, 24) + 22;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 ${H}" width="1280" height="${H}" role="img" aria-labelledby="t d">
<title id="t">Launch status board</title>
<desc id="d">${esc(desc)}</desc>
<defs>
  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#0E0E0E"/></pattern>
  <linearGradient id="bar" x1="0" x2="1"><stop offset="0" stop-color="#5A3A12"/><stop offset=".7" stop-color="#E08C2C"/><stop offset="1" stop-color="#FFC46B"/></linearGradient>
  <linearGradient id="scan" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#E08C2C" stop-opacity="0"/><stop offset=".5" stop-color="#E08C2C" stop-opacity=".07"/><stop offset="1" stop-color="#E08C2C" stop-opacity="0"/></linearGradient>
</defs>
<style>
  .f{font-family:'Eurostile','Microgramma','Segoe UI','Helvetica Neue',Arial,sans-serif}
  .m{font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace}
  .row{opacity:0;animation:in .5s ease-out forwards}
  @keyframes in{from{opacity:0}to{opacity:1}}
  .bar{transform-box:fill-box;transform-origin:left center;transform:scaleX(0);animation:grow 1.1s cubic-bezier(.2,.8,.2,1) forwards}
  @keyframes grow{to{transform:scaleX(1)}}
  .ring{transform-box:fill-box;transform-origin:center;animation:ping 2.4s ease-out infinite}
  @keyframes ping{0%{transform:scale(1);opacity:.8}100%{transform:scale(3.2);opacity:0}}
  .sweep{transform-box:fill-box;transform-origin:center;animation:spin 4s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .scan{animation:scan 6s linear 2s infinite}
  @keyframes scan{from{transform:translateY(0)}to{transform:translateY(${n * ROW_H - 40}px)}}
  @media (prefers-reduced-motion:reduce){
    .row{opacity:1;animation:none}.bar{transform:none;animation:none}
    .ring,.sweep,.scan{animation:none}.ring{opacity:0}.scan{display:none}
  }
</style>

<rect width="1280" height="${H}" fill="#000"/>
<rect width="1280" height="${H}" fill="url(#grid)"/>

<!-- HEADER -->
<text x="24" y="44" class="f" font-size="12" font-weight="700" letter-spacing="5" fill="#E08C2C">MISSION CONTROL  /  LIVE TELEMETRY</text>
<text x="24" y="88" class="f" font-size="30" font-weight="700" letter-spacing="6" fill="#FFFFFF">LAUNCH STATUS BOARD</text>
<text x="24" y="112" class="m" font-size="12" fill="#6B6B6B">Every product is requested automatically. Nothing on this board is edited by hand.</text>

<text x="1140" y="56" text-anchor="end" class="f" font-size="12" font-weight="700" letter-spacing="5" fill="#8C8C8C">ALL SYSTEMS</text>
<text x="1060" y="96" text-anchor="end" class="f" font-size="34" font-weight="700" letter-spacing="4" fill="${state.color}">${state.label}</text>
<text x="1140" y="94" text-anchor="end" class="m" font-size="22" fill="#FFFFFF">${goCount} / ${n}</text>

<g stroke="#2A2A2A" fill="none">
  <circle cx="1206" cy="66" r="14"/><circle cx="1206" cy="66" r="28"/><circle cx="1206" cy="66" r="42"/>
  <line x1="1164" y1="66" x2="1248" y2="66"/><line x1="1206" y1="24" x2="1206" y2="108"/>
</g>
<g class="sweep">
  <circle cx="1206" cy="66" r="42" fill="none"/>
  <path d="M1206 66 L1206 24 A42 42 0 0 1 1235.7 36.3 Z" fill="#E08C2C" fill-opacity=".28"/>
  <line x1="1206" y1="66" x2="1235.7" y2="36.3" stroke="#E08C2C" stroke-width="1.5"/>
</g>
<circle cx="1206" cy="66" r="3" fill="#E08C2C"/>

<!-- SUMMARY STRIP -->
<rect x="24.5" y="132.5" width="1231" height="76" fill="#050505" stroke="#2A2A2A"/>
<g stroke="#2A2A2A"><line x1="332" y1="132" x2="332" y2="208"/><line x1="640" y1="132" x2="640" y2="208"/><line x1="948" y1="132" x2="948" y2="208"/></g>
<g class="f" font-size="11" font-weight="700" letter-spacing="4" fill="#8C8C8C">
  <text x="48" y="160">MEDIAN RESPONSE</text><text x="356" y="160">FASTEST</text><text x="664" y="160">SLOWEST</text><text x="972" y="160">LAST CHECK</text>
</g>
<g class="m" font-size="24" fill="#FFFFFF">
  <text x="48" y="193">${medText}</text><text x="356" y="193">${fastText}</text><text x="664" y="193">${slowText}</text><text x="972" y="193">${clock}</text>
</g>
<g class="m" font-size="12" fill="#E08C2C">
  ${fastName}${slowName}<text x="${dateX}" y="192">${date}</text>
</g>

<!-- COLUMN HEADERS -->
<g class="f" font-size="11" font-weight="700" letter-spacing="4" fill="#6B6B6B">
  <text x="32" y="246">ID</text><text x="104" y="246">PRODUCT</text><text x="470" y="246">STATUS</text><text x="640" y="246">RESPONSE</text><text x="1010" y="246">ENDPOINT</text>
</g>

<!-- LATENCY GUIDES -->
<g stroke="#1C1C1C" stroke-dasharray="2 4">
  <line x1="712" y1="262" x2="712" y2="${bottom}"/><line x1="832" y1="262" x2="832" y2="${bottom}"/><line x1="880" y1="262" x2="880" y2="${bottom}"/>
</g>

<!-- ROWS -->
${rows.map(row).join("\n\n")}

<line x1="24" x2="1256" y1="${bottom}" y2="${bottom}" stroke="#2A2A2A"/>
<rect class="scan" x="24" y="262" width="1232" height="40" fill="url(#scan)"/>

<!-- SCALE AND FOOTER -->
<g class="m" font-size="10" fill="#5E5E5E" text-anchor="middle">
  <text x="640" y="${bottom + 16}">0</text><text x="712" y="${bottom + 16}">300 ms</text><text x="832" y="${bottom + 16}">800 ms</text><text x="880" y="${bottom + 16}">1 s</text>
</g>
<text x="24" y="${bottom + 40}" class="m" font-size="12" fill="#6B6B6B">GO = HTTP 2XX OR 3XX WITHIN 15 S   ·   NO-GO = NETWORK ERROR, 4XX, 5XX OR TIMEOUT, AFTER 3 TRIES</text>
<text x="24" y="${bottom + 58}" class="m" font-size="12" fill="#6B6B6B">RESPONSE TIME IS MEASURED FROM A GITHUB ACTIONS RUNNER, SO IT INCLUDES NETWORK DISTANCE.   AUTO-CHECKED EVERY 6 HOURS.</text>
</svg>
`;
  return guard(svg, "status");
}
