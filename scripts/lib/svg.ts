// Shared palette and helpers. Gold sampled from the banner: rgb(224,140,44).
export const C = { bg: "#000000", fg: "#FFFFFF", gold: "#E08C2C", dim: "#8C8C8C", line: "#2A2A2A", red: "#E5484D" };
export const DISPLAY = `'Eurostile','Microgramma','Segoe UI','Helvetica Neue',Arial,sans-serif`;
export const MONO = `'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace`;
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const fmt = (n: number) => n.toLocaleString("en-US");
export function guard(svg: string, name: string) {
  if (/[–—]/.test(svg)) throw new Error(`${name}: dash character found`);
  if (Buffer.byteLength(svg) > 300 * 1024) throw new Error(`${name}: over 300 KB`);
  return svg;
}
