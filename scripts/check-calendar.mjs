/**
 * End-to-end test of the seasonal engine. Freezes the browser clock at known
 * dates, loads the real page, and reads back which palette it chose. This
 * exercises the shipped code rather than a reimplementation of the rules.
 */
import { chromium } from "playwright";

const SITE = process.env.TARGET || "http://localhost:5175";

// [label, ISO date, expected palette id, expected button shape]
const CASES = [
  ["today (autumn)", "2026-09-20T18:00:00", "autumn", "cut"],
  ["mid spring", "2026-04-20T10:00:00", "spring", "pill"],
  ["mid summer", "2026-07-15T10:00:00", "summer", "soft"],
  ["deep winter", "2026-01-20T10:00:00", "winter", "sharp"],
  ["New Year's Day", "2026-01-01T10:00:00", "newyear", "pill"],
  ["Lunar New Year", "2026-02-17T10:00:00", "lunar", "pill"],
  ["Valentine's Day", "2026-02-14T10:00:00", "valentines", "pill"],
  ["Holi", "2026-03-03T10:00:00", "holi", "pill"],
  ["Easter Sunday", "2026-04-05T10:00:00", "easter", "soft"],
  ["Canada Day", "2026-07-01T10:00:00", "canada", "sharp"],
  ["Canadian Thanksgiving", "2026-10-12T10:00:00", "thanksgiving", "soft"],
  ["Halloween", "2026-10-31T20:00:00", "halloween", "cut"],
  ["Remembrance Day", "2026-11-11T10:00:00", "remembrance", "sharp"],
  ["Diwali", "2026-11-08T19:00:00", "diwali", "pill"],
  ["Christmas Day", "2026-12-25T09:00:00", "christmas", "soft"],
  ["Boxing Day still festive", "2026-12-26T09:00:00", "christmas", "soft"],
  ["quiet December day", "2026-12-05T09:00:00", "winter", "sharp"],
  ["year with no lunar data", "2035-11-02T10:00:00", "autumn", "cut"],
];

// [label, ISO time, expected greeting]
const DAYPARTS = [
  ["early morning", "2026-09-20T06:30:00", "Good morning"],
  ["midday", "2026-09-20T13:00:00", "Good afternoon"],
  ["evening", "2026-09-20T19:00:00", "Good evening"],
  ["after midnight", "2026-09-20T01:30:00", "Working late"],
];

const browser = await chromium.launch();
let failures = 0;

console.log("Palette by date\n");
for (const [label, iso, expectPalette, expectShape] of CASES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => {
    try {
      localStorage.removeItem("palette-override");
    } catch {
      /* ignore */
    }
  });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date(iso));
  await page.goto(SITE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const got = await page.evaluate(() => ({
    palette: document.documentElement.dataset.palette,
    shape: document.documentElement.dataset.shape,
  }));
  const okPalette = got.palette === expectPalette;
  const okShape = got.shape === expectShape;
  if (!okPalette || !okShape) failures++;
  const mark = okPalette && okShape ? " ok " : "FAIL";
  console.log(
    `${mark} ${label.padEnd(26)} ${iso.slice(0, 10)} -> ${String(got.palette).padEnd(13)} ${got.shape}` +
      (okPalette && okShape ? "" : `   expected ${expectPalette}/${expectShape}`)
  );
  await ctx.close();
}

console.log("\nGreeting by time of day\n");
for (const [label, iso, expected] of DAYPARTS) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date(iso));
  await page.goto(SITE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const text = await page.evaluate(() => document.querySelector("#top")?.textContent || "");
  const good = text.includes(expected);
  if (!good) failures++;
  console.log(`${good ? " ok " : "FAIL"} ${label.padEnd(18)} ${iso.slice(11, 16)} -> "${expected}"`);
  await ctx.close();
}

await browser.close();
console.log(
  failures ? `\n${failures} calendar failure(s)` : `\nAll ${CASES.length + DAYPARTS.length} calendar cases pass`
);
process.exit(failures ? 1 : 0);
