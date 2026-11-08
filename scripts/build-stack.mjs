#!/usr/bin/env node
// Builds assets/stack.svg: one brand colour per technology, mission-control styling.
// First run extracts icon paths from the current assets/stack.svg into data/stack.json.
// Every later run builds from data/stack.json. Edit that file to change the stack.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const SVG_PATH = 'assets/stack.svg';
const DATA_PATH = 'data/stack.json';
const GOLD = '#E08C2C';
const FONT = `'Eurostile','Microgramma','Segoe UI','Helvetica Neue',Arial,sans-serif`;
const MONO = `ui-monospace,'SFMono-Regular','Cascadia Mono',Menlo,Consolas,monospace`;
const W = 1280, X0 = 222, MAXX = 1256, CH = 38, GAP = 10, ROW = 52, TOP = 72;

const BRAND = {
  'TYPESCRIPT': '#3178C6', 'JAVASCRIPT': '#F7DF1E', 'PHP': '#777BB4', 'SQL': '#F29111',
  'HTML': '#E34F26', 'CSS': '#663399', 'REACT': '#61DAFB', 'NEXT.JS': '#FFFFFF',
  'NODE.JS': '#5FA04E', 'REACT NATIVE (EXPO)': '#4630EB', 'TAILWIND CSS': '#06B6D4',
  'WORDPRESS': '#21759B', 'POSTGRESQL': '#4169E1', 'PRISMA': '#5A67D8', 'DRIZZLE': '#C5F74F',
  'SUPABASE': '#3FCF8E', 'NEON': '#00E599', 'REDIS': '#FF4438', 'STRIPE': '#635BFF',
  'VERCEL': '#FFFFFF', 'GITHUB ACTIONS': '#2088FF', 'VITEST': '#6E9F18', 'JEST': '#C21325',
  'PLAYWRIGHT': '#2EAD33',
};

// ---------- colour helpers ----------
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
const lum = c => {
  const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
// Lift very dark brand colours just enough to stay visible on black.
function readable(h, min = 0.12) {
  let c = rgb(h), t = 0;
  while (lum(c) < min && t < 1) { t += 0.05; c = rgb(h).map(v => v + (255 - v) * t); }
  return hex(c);
}
const mix = (a, b, k) => hex(rgb(a).map((v, i) => v * k + rgb(b)[i] * (1 - k)));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const chipW = l => Math.max(80, Math.ceil((46 + l.length * 9.6 + 14) / 10) * 10);

// ---------- one-time extraction from the current SVG ----------
// Reads group labels and chips in document order. A chip with no icon paths (Playwright) is kept with an empty list.
function extract(svg) {
  const re = /<text x="24"[^>]*fill="#E08C2C">([^<]+)<\/text>|<g transform="translate\(\d+,\d+\)">((?:(?!<\/text><\/g>)[\s\S])*)<\/text><\/g>/g;
  const groups = [];
  let m;
  while ((m = re.exec(svg))) {
    if (m[1]) groups.push({ name: m[1], items: [] });
    else {
      const label = /<text[^>]*>([^<]*)$/.exec(m[2])?.[1];
      if (label && groups.length) groups.at(-1).items.push({ label, paths: [...m[2].matchAll(/ d="([^"]+)"/g)].map(x => x[1]) });
    }
  }
  return groups;
}

if (!existsSync(DATA_PATH)) {
  const src = readFileSync(SVG_PATH, 'utf8');
  const groups = extract(src);
  const found = groups.flatMap(g => g.items).length;
  const desc = ((src.match(/<desc[^>]*>([^<]*)<\/desc>/) || [, ''])[1]).replace(/\.$/, '').split(', ').filter(Boolean);
  if (!found || (desc.length && found !== desc.length)) {
    throw new Error(`Parsed ${found} chips but <desc> lists ${desc.length}. Nothing written.`);
  }
  mkdirSync('data', { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(groups, null, 2));
  console.log(`Extracted ${found} icons to ${DATA_PATH}`);
}

// ---------- render ----------
const groups = JSON.parse(readFileSync(DATA_PATH, 'utf8'));

function chip(it, x, y, w, i) {
  const brand = BRAND[it.label] ?? (console.warn(`No brand colour for ${it.label}, using gold`), GOLD);
  const c = readable(brand);
  let icon;
  if (it.label === 'SQL') {
    icon = `<g transform="translate(16,10) scale(.75)" fill="none" stroke="${c}" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/></g>`;
  } else if (it.paths.length) {
    icon = `<g transform="translate(16,10) scale(.75)" fill="${c}">${it.paths.map(d => `<path d="${d}"/>`).join('')}</g>`;
  } else {
    icon = `<rect x="19" y="14" width="11" height="11" fill="${c}"/>`; // no logo available: plain square
  }
  return `<g class="chip" style="animation-delay:${(0.25 + i * 0.06).toFixed(2)}s" transform="translate(${x},${y})">`
    + `<rect width="${w}" height="${CH}" fill="${mix(c, '#0A0A0A', 0.10)}"/>`
    + `<rect x=".5" y=".5" width="${w - 1}" height="${CH - 1}" fill="none" stroke="${c}" stroke-opacity=".38"/>`
    + `<rect width="3" height="${CH}" fill="${c}"/>`
    + icon
    + `<text x="46" y="25" font-family="${FONT}" font-size="13" font-weight="700" letter-spacing="1" fill="#FFFFFF">${esc(it.label)}</text>`
    + `<circle class="led" style="animation-delay:${((i * 0.37) % 2.4).toFixed(2)}s" cx="${w - 10}" cy="10" r="2.2" fill="${c}"/>`
    + `</g>`;
}

let y = TOP, i = 0;
const rows = [], chips = [], labels = [];
groups.forEach((g, gi) => {
  if (gi > 0) rows.push(`<line x1="24" x2="${MAXX}" y1="${y - 7}" y2="${y - 7}" stroke="#141414"/>`);
  rows.push(`<text x="24" y="${y + 24}" font-family="${MONO}" font-size="11" fill="#5A5A5A">${String(gi + 1).padStart(2, '0')}</text>`
    + `<text x="50" y="${y + 24}" font-family="${FONT}" font-size="11" font-weight="700" letter-spacing="3" fill="${GOLD}">${esc(g.name)}</text>`);
  let x = X0;
  for (const it of g.items) {
    const w = chipW(it.label);
    if (x + w > MAXX) { x = X0; y += ROW; }
    chips.push(chip(it, x, y, w, i++));
    labels.push(it.label);
    x += w + GAP;
  }
  y += ROW;
});
const H = y - (ROW - CH) + 24;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
<title id="t">Languages and stack</title><desc id="d">${esc(labels.join(', '))}.</desc>
<style>
.chip{animation:boot .6s ease-out both}
@keyframes boot{0%{opacity:0}30%{opacity:.75}42%{opacity:.15}60%,100%{opacity:1}}
.led{animation:pulse 2.4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.2}}
.sweep{transform:translateX(-220px);animation:sweep 7s linear 2s infinite}
@keyframes sweep{0%{transform:translateX(-220px)}60%,100%{transform:translateX(${W + 220}px)}}
@media (prefers-reduced-motion:reduce){.chip,.led{animation:none}.sweep{display:none}}
</style>
<defs><linearGradient id="sw" x1="0" x2="1"><stop offset="0" stop-color="${GOLD}" stop-opacity="0"/><stop offset=".5" stop-color="${GOLD}" stop-opacity=".10"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="#000000"/>
<text x="24" y="34" font-family="${FONT}" font-size="13" font-weight="700" letter-spacing="4" fill="#FFFFFF">FLIGHT SYSTEMS</text>
<text x="${MAXX}" y="34" text-anchor="end" font-family="${MONO}" font-size="12" fill="#8C8C8C"><tspan fill="${GOLD}">${labels.length}</tspan> SYSTEMS ONLINE · ${groups.length} SUBSYSTEMS</text>
<line x1="24" x2="${MAXX}" y1="50" y2="50" stroke="#2A2A2A"/>
${rows.join('\n')}
${chips.join('\n')}
<rect class="sweep" x="0" y="56" width="220" height="${H - 56}" fill="url(#sw)"/>
</svg>
`;

if (/[–—]/.test(svg)) throw new Error('stack.svg contains an em or en dash');
writeFileSync(SVG_PATH, svg);
const kb = Buffer.byteLength(svg) / 1024;
console.log(`Wrote ${SVG_PATH}: ${labels.length} chips, ${W}x${H}, ${kb.toFixed(1)} KB${kb > 300 ? '  WARNING: over 300 KB' : ''}`);
