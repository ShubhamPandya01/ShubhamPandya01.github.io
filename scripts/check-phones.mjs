/**
 * Real phone interactions, in both engines that matter: Chromium for Android
 * and WebKit for iPhone. Uses taps, not clicks, and checks outcomes (did the
 * page actually land on the section, is the sheet actually on screen) rather
 * than just whether something rendered.
 *
 * WebKit is not the default Playwright download. Install it once with
 *   npx playwright install webkit chromium
 *
 * Every check here corresponds to a bug that shipped once and was missed by a
 * Chromium-only desktop audit:
 *   - the menu opened 1px tall on iPhone (height:auto animation)
 *   - menu links changed the URL but never scrolled on Android
 *   - the theme picker was cropped inside the menu
 *   - the gradient headline words were invisible on iPhone
 */
import { chromium, webkit, devices } from "playwright";

const SITE = process.env.TARGET || "http://localhost:5175";
let fails = 0;
const check = (cond, msg) => {
  console.log(`${cond ? " ok " : "FAIL"} ${msg}`);
  if (!cond) fails++;
};

/** Count accent-coloured pixels inside an element, from a real screenshot. */
async function accentPixels(page, selector) {
  const box = await page.locator(selector).boundingBox();
  const buf = await page.screenshot({ clip: box });
  return page.evaluate(async (url) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      const [r, gg, b] = [d[i], d[i + 1], d[i + 2]];
      if (r > 190 && gg > 90 && b < 140 && r - b > 90) n++;
    }
    return n;
  }, `data:image/png;base64,${buf.toString("base64")}`);
}

const PHONES = [
  ["Android (Pixel 7)", chromium, devices["Pixel 7"]],
  ["iPhone 14 (Safari engine)", webkit, devices["iPhone 14"]],
  ["small Android (360px)", chromium, { ...devices["Galaxy S9+"], viewport: { width: 360, height: 640 } }],
];

const MENU = [
  ["#work", "Work"],
  ["#experience", "Experience"],
  ["#skills", "Skills"],
  ["#background", "Background"],
  ["#contact", "Get in touch"],
];

for (const [name, engine, device] of PHONES) {
  const browser = await engine.launch();
  // Autumn is pinned so the accent-pixel check has a known colour to look for.
  const ctx = await browser.newContext({ ...device, colorScheme: "dark" });
  await ctx.addInitScript(() => {
    try {
      localStorage.clear();
      localStorage.setItem("palette-override", "autumn");
    } catch {
      /* ignore */
    }
  });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  await p.goto(SITE, { waitUntil: "networkidle" });
  await p.waitForTimeout(1800);
  const size = await p.evaluate(() => `${innerWidth}x${innerHeight}`);
  console.log(`\n===== ${name}, ${size} =====`);

  const painted = await accentPixels(p, "h1");
  check(painted > 400, `headline "what watches them." is painted (${painted} accent pixels)`);

  const burger = p.locator('button[aria-controls="mobile-nav"]');
  for (const [href, label] of MENU) {
    await p.evaluate(() => scrollTo(0, 0));
    await p.waitForTimeout(300);
    await burger.tap();
    await p.waitForTimeout(450);
    if (href === "#work") {
      const h = await p.evaluate(() =>
        Math.round(document.getElementById("mobile-nav")?.getBoundingClientRect().height || 0)
      );
      check(h > 200, `menu opens to full height (${h}px)`);
    }
    await p.tap(`#mobile-nav a[href="${href}"]`);
    await p.waitForTimeout(1500);
    const r = await p.evaluate(
      (id) => ({
        top: Math.round(document.getElementById(id).getBoundingClientRect().top),
        menuOpen: !!document.getElementById("mobile-nav"),
      }),
      href.slice(1)
    );
    check(r.top >= 0 && r.top < 160 && !r.menuOpen, `menu "${label}" scrolls to its section (top ${r.top}px) and closes`);
  }

  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(300);
  await burger.tap();
  await p.waitForTimeout(450);
  const vp = await p.evaluate(() => ({ w: innerWidth, h: innerHeight }));
  await p.touchscreen.tap(Math.round(vp.w / 2), vp.h - 30);
  await p.waitForTimeout(600);
  check((await p.locator("#mobile-nav").count()) === 0, "tapping the dimmed page closes the menu");

  for (const [href, text] of [["#work", "See the work"], ["#contact", "Get in touch"]]) {
    await p.evaluate(() => scrollTo(0, 0));
    await p.waitForTimeout(400);
    await p.tap(`#top a[href="${href}"]`);
    await p.waitForTimeout(1500);
    const top = await p.evaluate((id) => Math.round(document.getElementById(id).getBoundingClientRect().top), href.slice(1));
    check(top >= 0 && top < 160, `hero "${text}" scrolls to its section (top ${top}px)`);
  }

  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(300);
  await burger.tap();
  await p.waitForTimeout(450);
  await p.tap('#mobile-nav button[aria-haspopup="dialog"]');
  await p.waitForTimeout(700);
  const sheet = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    if (!d) return null;
    const r = d.getBoundingClientRect();
    return {
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      left: Math.round(r.left),
      right: Math.round(r.right),
      vw: innerWidth,
      vh: innerHeight,
      outsideHeader: d.closest("header") === null,
    };
  });
  check(
    !!sheet && sheet.top >= 0 && sheet.bottom <= sheet.vh + 1 && sheet.left >= 0 && sheet.right <= sheet.vw + 1,
    `theme picker fits on screen ${sheet ? `(${sheet.top}-${sheet.bottom} of ${sheet.vh}px)` : "(did not open)"}`
  );
  check(!!sheet && sheet.outsideHeader, "theme picker renders outside the header, so nothing clips it");

  await p.tap('[role="dialog"] button:has-text("Winter")');
  await p.waitForTimeout(600);
  check((await p.evaluate(() => document.documentElement.dataset.palette)) === "winter", "picking Winter applies it");

  const back = p.locator('[role="dialog"] button:has-text("Back to today")');
  await back.scrollIntoViewIfNeeded();
  await back.tap();
  await p.waitForTimeout(600);
  // Asserts the override is gone rather than naming a season, so this stays
  // correct whatever time of year it runs.
  const cleared = await p.evaluate(() => ({
    stored: localStorage.getItem("palette-override"),
    buttonGone: ![...document.querySelectorAll('[role="dialog"] button')].some((b) =>
      b.textContent.includes("Back to today")
    ),
  }));
  check(
    cleared.stored === null && cleared.buttonGone,
    `"Back to today" is reachable and returns to the calendar palette`
  );

  await p.tap('[role="dialog"] button[aria-label="Close theme preview"]');
  // Safari finishes the slide-out more slowly than Chromium.
  await p.waitForTimeout(1000);
  check((await p.locator('[role="dialog"]').count()) === 0, "close button dismisses the picker");
  check((await p.evaluate(() => document.body.style.overflow)) === "", "page scrolling is restored after closing");
  check(errors.length === 0, `no page errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);

  await browser.close();
}

console.log(fails ? `\n${fails} phone check(s) failed` : "\nAll phone checks pass on Android and iPhone");
process.exit(fails ? 1 : 0);
