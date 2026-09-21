/**
 * Static contrast gate for every seasonal palette. Runs without a browser so a
 * bad colour can never reach the page: each accent must clear WCAG AA against
 * its own page background, and each button label against its own accent.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, "../src/theme/palettes.ts"), "utf8");

const BG_LIGHT = "#fafaf9";
const BG_DARK = "#0c0a09";
const SURFACE_LIGHT = "#ffffff";
const SURFACE_DARK = "#1a1817";

const hex = (h) => {
  const s = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const lin = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const lum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const ratio = (a, b) => {
  const [l1, l2] = [lum(hex(a)), lum(hex(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// Pull every palette object literal out of the source.
const palettes = [];
const re = /id:\s*"([^"]+)",\s*\n\s*name:\s*"([^"]+)"/g;
let m;
while ((m = re.exec(src))) {
  const start = m.index;
  const slice = src.slice(start, start + 1400);
  const field = (k) => slice.match(new RegExp(`${k}:\\s*"([^"]+)"`))?.[1];
  palettes.push({
    id: m[1],
    name: m[2],
    accentLight: field("accentLight"),
    accentDark: field("accentDark"),
    accentFgLight: field("accentFgLight"),
    accentFgDark: field("accentFgDark"),
  });
}

const AA = 4.5;
const rows = [];
let failures = 0;

for (const p of palettes) {
  const checks = {
    "accent on light page": ratio(p.accentLight, BG_LIGHT),
    "accent on light card": ratio(p.accentLight, SURFACE_LIGHT),
    "label on light accent": ratio(p.accentFgLight, p.accentLight),
    "accent on dark page": ratio(p.accentDark, BG_DARK),
    "accent on dark card": ratio(p.accentDark, SURFACE_DARK),
    "label on dark accent": ratio(p.accentFgDark, p.accentDark),
  };
  const bad = Object.entries(checks).filter(([, v]) => v < AA);
  failures += bad.length;
  rows.push({ name: p.name, checks, bad });
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`Checking ${palettes.length} palettes against WCAG AA (${AA}:1)\n`);
for (const r of rows) {
  const worst = Math.min(...Object.values(r.checks));
  const mark = r.bad.length ? "FAIL" : " ok ";
  console.log(`${mark} ${pad(r.name, 18)} worst ${worst.toFixed(2)}:1`);
  for (const [label, v] of r.bad) {
    console.log(`       -> ${label} is ${v.toFixed(2)}:1`);
  }
}

console.log(
  failures
    ? `\n${failures} contrast failure(s) across ${palettes.length} palettes`
    : `\nAll ${palettes.length} palettes pass AA in both themes`
);
process.exit(failures ? 1 : 0);
