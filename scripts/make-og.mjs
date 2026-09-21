/**
 * Renders the 1200x630 social preview card (public/og.jpg) shown when the
 * site link is pasted into LinkedIn, Slack, iMessage and so on. It is composed
 * from the real portrait and the site's own fonts, so it matches the page.
 * Uses the autumn palette as the site's signature look; the card is a static
 * file, so unlike the page it does not change with the season.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const url = (p) => pathToFileURL(path.join(root, p)).href;

const html = `<!doctype html><html><head><style>
@font-face { font-family: Geist; src: url(${url("node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2")}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: GeistMono; src: url(${url("node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2")}) format("woff2"); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; background: #0c0a09; font-family: Geist, sans-serif; color: #fafaf9; position: relative; }
.glow { position: absolute; inset: 0;
  background:
    radial-gradient(55% 70% at 12% 10%, rgba(251,146,60,0.20), transparent 62%),
    radial-gradient(45% 60% at 95% 100%, rgba(251,191,36,0.14), transparent 65%); }
.net { position: absolute; left: 0; top: 0; width: 760px; height: 630px; opacity: .22;
  background: linear-gradient(120deg, #fb923c, #fbbf24);
  -webkit-mask: url(${url("public/img/texture-security.webp")}) center / cover no-repeat; }
.copy { position: absolute; left: 72px; top: 0; bottom: 0; width: 640px; display: flex; flex-direction: column; justify-content: center; }
.rule { width: 64px; height: 4px; border-radius: 99px; background: #fb923c; margin-bottom: 34px; }
h1 { font-size: 76px; font-weight: 650; letter-spacing: -0.035em; line-height: 1.0; }
h2 { margin-top: 20px; font-size: 38px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.15;
  background: linear-gradient(100deg, #fb923c, #fbbf24 75%); -webkit-background-clip: text; color: transparent; }
p { margin-top: 30px; font-family: GeistMono, monospace; font-size: 18px; color: #b3aca7; }
p span { color: #fb923c; margin: 0 10px; }
.photo { position: absolute; right: 72px; top: 60px; width: 408px; height: 510px; border-radius: 14px; overflow: hidden;
  border: 1px solid #3d3835; box-shadow: 0 30px 80px -30px rgba(251,146,60,.45); }
.photo img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.85); }
.photo::after { content: ""; position: absolute; inset: 0; mix-blend-mode: soft-light; opacity: .35;
  background: linear-gradient(150deg, rgba(251,146,60,.6), transparent 55%, rgba(251,191,36,.45)); }
</style></head><body>
<div class="glow"></div><div class="net"></div>
<div class="copy">
  <div class="rule"></div>
  <h1>Shubham Pandya</h1>
  <h2>CyberSecurity and AI Engineer</h2>
  <p>Oshawa, Ontario<span>/</span>Open to co-op and full-time roles</p>
</div>
<div class="photo"><img src="${url("public/img/portrait-900.jpg")}"></div>
</body></html>`;

const tmp = path.join(os.tmpdir(), `og-${process.pid}.html`);
fs.writeFileSync(tmp, html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);

const fontsOk = await page.evaluate(
  () => document.fonts.check("650 76px Geist") && document.fonts.check("400 18px GeistMono")
);
const imgOk = await page.evaluate(() => {
  const i = document.querySelector("img");
  return i.complete && i.naturalWidth > 0;
});
if (!fontsOk || !imgOk) {
  await browser.close();
  fs.unlinkSync(tmp);
  throw new Error(`og card assets failed to load (fonts ${fontsOk}, portrait ${imgOk})`);
}

const out = path.join(root, "public", "og.jpg");
await page.screenshot({ path: out, type: "jpeg", quality: 90 });
await browser.close();
fs.unlinkSync(tmp);
console.log(`og.jpg written: 1200x630, ${Math.round(fs.statSync(out).size / 1024)}KB`);
