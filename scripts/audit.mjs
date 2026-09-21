import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = process.env.TARGET || "http://localhost:5174";
// Screenshots land next to this script regardless of where npm is invoked from.
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "shots");
fs.mkdirSync(OUT, { recursive: true });

const fail = [];
const warn = [];
const ok = [];
const note = (arr, msg) => arr.push(msg);

/**
 * WCAG contrast measurement, serialised and run inside the page.
 * Walks up the ancestor chain to resolve the effective background, so
 * semi-transparent layers are composited the way the eye actually sees them.
 */
function contrastProbe() {
  const srgbToLin = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lum = (rgb) =>
    0.2126 * srgbToLin(rgb[0]) + 0.7152 * srgbToLin(rgb[1]) + 0.0722 * srgbToLin(rgb[2]);
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(",").map((s) => parseFloat(s.trim()));
    return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (fg, bg) => [0, 1, 2].map((i) => fg.rgb[i] * fg.a + bg[i] * (1 - fg.a));
  const effBg = (el) => {
    let node = el;
    let acc = null;
    while (node && node !== document.documentElement) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0) {
        acc = acc ? { rgb: over(acc, c.rgb), a: 1 } : c;
        if (acc.a >= 1) return acc.rgb;
      }
      node = node.parentElement;
    }
    const html = parse(getComputedStyle(document.documentElement).backgroundColor);
    const base = html && html.a > 0 ? html.rgb : [255, 255, 255];
    return acc ? over(acc, base) : base;
  };
  const ratio = (el) => {
    const fg = parse(getComputedStyle(el).color);
    if (!fg) return null;
    const bg = effBg(el);
    const f = lum(over(fg, bg));
    const b = lum(bg);
    return (Math.max(f, b) + 0.05) / (Math.min(f, b) + 0.05);
  };

  const out = [];
  const els = [...document.querySelectorAll("body *")].filter((el) => {
    if (!el.offsetParent && getComputedStyle(el).position !== "fixed") return false;
    const hasText = [...el.childNodes].some(
      (n) => n.nodeType === 3 && (n.textContent || "").trim().length > 1
    );
    if (!hasText) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.15) continue;
    // Gradient-clipped headlines paint from background-image and report a
    // transparent `color`. The painted-background pass covers those instead.
    if (cs.webkitBackgroundClip === "text" || cs.backgroundClip === "text") continue;
    if (cs.color === "rgba(0, 0, 0, 0)" || cs.color === "transparent") continue;
    const cr = ratio(el);
    if (cr === null) continue;
    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3.0 : 4.5;
    if (cr < need) {
      out.push({
        text: (el.textContent || "").trim().slice(0, 45),
        ratio: +cr.toFixed(2),
        need,
        size,
      });
    }
  }
  return out;
}

/**
 * Contrast measured against the real painted background rather than computed
 * styles. The seasonal aurora and the masked artwork sit behind text as
 * painted layers that a colour-only check cannot see. For each sampled element
 * this hides its glyphs, photographs its box, averages what remains, and
 * compares that with the text colour. Decoding happens in the page so no image
 * library is needed.
 *
 * The particle canvas is hidden while measuring. It moves, so including it
 * would grade whichever random frame the screenshot caught; its effect on text
 * is handled in the component instead, by fading particles out under the nav.
 */
async function pixelContrast(page, label, fail, ok) {
  await page.evaluate(() => {
    const c = document.querySelector("canvas[data-particles]");
    if (c) c.style.visibility = "hidden";
  });
  // Tag candidates once so they can be addressed reliably afterwards.
  const count = await page.evaluate(() => {
    const sel = "h1, h2, h3, h4, p, a[href], button, dt, dd, li, span";
    let n = 0;
    for (const el of document.querySelectorAll(sel)) {
      const own = [...el.childNodes].some(
        (x) => x.nodeType === 3 && (x.textContent || "").trim().length > 2
      );
      if (!own) continue;
      const cs = getComputedStyle(el);
      // Gradient-clipped text paints from background-image, not `color`; its
      // legibility is governed by the accent pair, gated in check-palettes.
      if (cs.webkitBackgroundClip === "text" || cs.backgroundClip === "text") continue;
      if (cs.color === "rgba(0, 0, 0, 0)" || cs.color === "transparent") continue;
      if (cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.9) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 30 || r.height < 10 || r.height > 200) continue;
      el.setAttribute("data-cc", String(n++));
    }
    return n;
  });

  const stride = Math.max(1, Math.floor(count / 36));
  const bad = [];
  let measured = 0;

  for (let i = 0; i < count; i += stride) {
    const prep = await page.evaluate((idx) => {
      const el = document.querySelector(`[data-cc="${idx}"]`);
      if (!el) return null;
      el.scrollIntoView({ block: "center", behavior: "instant" });
      const r = el.getBoundingClientRect();
      if (r.width < 30 || r.height < 10) return null;
      if (r.top < 0 || r.bottom > window.innerHeight) return null;
      const cs = getComputedStyle(el);
      return {
        text: (el.textContent || "").trim().slice(0, 38),
        color: cs.color,
        size: parseFloat(cs.fontSize),
        weight: parseInt(cs.fontWeight) || 400,
        box: {
          x: Math.round(r.left),
          y: Math.round(r.top),
          width: Math.round(r.width),
          height: Math.round(r.height),
        },
      };
    }, i);
    if (!prep) continue;

    // Photograph the element's box with its own glyphs made invisible. What
    // remains is the true background: aurora, artwork, surfaces, everything.
    await page.evaluate((idx) => {
      const el = document.querySelector(`[data-cc="${idx}"]`);
      if (el) el.style.setProperty("color", "transparent", "important");
    }, i);
    await page.waitForTimeout(40);

    let shot = null;
    try {
      shot = await page.screenshot({ clip: prep.box });
    } catch {
      /* clipped out of view between measure and capture */
    }

    await page.evaluate((idx) => {
      const el = document.querySelector(`[data-cc="${idx}"]`);
      if (el) el.style.removeProperty("color");
    }, i);
    if (!shot) continue;

    const bg = await page.evaluate(async (url) => {
      const img = new Image();
      img.src = url;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const { data } = g.getImageData(0, 0, c.width, c.height);
      let r = 0;
      let gg = 0;
      let b = 0;
      const n = data.length / 4;
      for (let p = 0; p < data.length; p += 4) {
        r += data[p];
        gg += data[p + 1];
        b += data[p + 2];
      }
      return [r / n, gg / n, b / n];
    }, `data:image/png;base64,${shot.toString("base64")}`);

    const fg = prep.color.match(/rgba?\(([^)]+)\)/);
    if (!fg) continue;
    const fgRgb = fg[1].split(",").map((s) => parseFloat(s.trim()));
    const lin = (v) => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
    const lf = lum(fgRgb);
    const lb = lum(bg);
    const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
    const large = prep.size >= 24 || (prep.size >= 18.66 && prep.weight >= 700);
    const need = large ? 3.0 : 4.5;
    measured++;
    if (ratio < need) {
      bad.push(`"${prep.text}" ${ratio.toFixed(2)}:1 (needs ${need}, ${prep.size}px)`);
      // Keep the evidence: the background exactly as measured, plus context.
      const tag = `${label}-${bad.length}`;
      fs.writeFileSync(path.join(OUT, `contrast-fail-${tag}.png`), shot);
      const ctx = await page.evaluate(() => ({
        scrollY: Math.round(window.scrollY),
        header: getComputedStyle(document.querySelector("header")).backgroundColor,
        smooth: getComputedStyle(document.documentElement).scrollBehavior,
      }));
      console.log(`  [debug] contrast-fail-${tag}.png box=${JSON.stringify(prep.box)} ${JSON.stringify(ctx)}`);
    }
  }

  await page.evaluate(() => {
    document.querySelectorAll("[data-cc]").forEach((el) => el.removeAttribute("data-cc"));
    const c = document.querySelector("canvas[data-particles]");
    if (c) c.style.visibility = "";
    window.scrollTo(0, 0);
  });

  if (bad.length) {
    note(fail, `[${label}] contrast against painted background fails on ${bad.length}: ${bad.slice(0, 5).join(" | ")}`);
  } else {
    note(ok, `[${label}] contrast against painted background passes on ${measured} sampled elements`);
  }
}

/**
 * Scroll the whole page so IntersectionObserver reveals fire and lazy images
 * load. Without this, whileInView content stays at opacity 0 and a fullPage
 * screenshot captures a blank document.
 */
async function revealAll(page) {
  // The site uses smooth scrolling. Left on, every scrollTo here starts an
  // animation that the next one interrupts, so measurements land on a page
  // that is still moving. The audit checks layout, not scroll feel.
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
  });
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.5);
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    // Re-read scrollHeight every iteration: lazy images make the page grow
    // while we scroll, so a height captured up front stops short of the bottom.
    let y = 0;
    let guard = 0;
    while (guard++ < 200) {
      window.scrollTo(0, y);
      await sleep(140);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (y >= max) break;
      y = Math.min(y + step, max);
    }
    // settle at the true bottom, then come back up
    for (let i = 0; i < 3; i++) {
      window.scrollTo(0, document.documentElement.scrollHeight);
      await sleep(300);
    }
    window.scrollTo(0, 0);
    await sleep(300);
  });
  // let any in-flight lazy images settle
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(800);
}

async function run() {
  const browser = await chromium.launch();

  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: theme,
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedReq = [];
    const badStatus = [];
    const images = new Set();
    page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
    page.on("pageerror", (e) => pageErrors.push(String(e)));
    page.on("requestfailed", (r) => failedReq.push(`${r.url()} ${r.failure()?.errorText}`));
    // A CSS mask pointing at a missing file renders a silently blank card with
    // no console error, so HTTP status is the only reliable signal.
    page.on("response", (r) => {
      if (r.status() >= 400) badStatus.push(`${r.status()} ${new URL(r.url()).pathname}`);
      if (r.request().resourceType() === "image" && !r.url().startsWith("data:")) images.add(r.url());
    });

    await page.goto(SITE, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1200);
    await revealAll(page);

    // ---- every section actually became visible after scrolling ----
    const hidden = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll("main section").forEach((s) => {
        const id = s.id || "(unnamed)";
        const heads = s.querySelectorAll("h2,h3,h4,p,li");
        let invisible = 0;
        heads.forEach((el) => {
          const cs = getComputedStyle(el);
          if (parseFloat(cs.opacity) < 0.9) invisible++;
        });
        if (invisible > 0) bad.push(`${id}:${invisible}`);
      });
      return bad;
    });
    if (hidden.length) note(fail, `[${theme}] content stuck below full opacity after scroll: ${hidden.join(", ")}`);
    else note(ok, `[${theme}] every section reveals to full opacity`);

    // ---- console / runtime ----
    if (pageErrors.length) note(fail, `[${theme}] page errors: ${pageErrors.join(" | ")}`);
    if (consoleErrors.length) note(fail, `[${theme}] console errors: ${consoleErrors.join(" | ")}`);
    const realFailed = failedReq.filter((u) => !u.includes("favicon"));
    if (realFailed.length) note(warn, `[${theme}] failed requests: ${realFailed.slice(0, 5).join(" | ")}`);
    if (!pageErrors.length && !consoleErrors.length) note(ok, `[${theme}] no console or runtime errors`);

    if (badStatus.length) note(fail, `[${theme}] HTTP errors: ${badStatus.slice(0, 6).join(" | ")}`);
    else note(ok, `[${theme}] every request returned 2xx/3xx (${images.size} images loaded)`);
    const origin = new URL(SITE).origin;
    const paths = new Set([...images].map((u) => new URL(u).pathname));
    const external = [...images].filter((u) => new URL(u).origin !== origin);
    const expectedArt = [
      "/img/portrait-680.webp",
      "/img/texture-security.webp",
      ...["agripulse", "smartcodebot", "cloud-pipeline", "forensics", "pentest", "homelab", "data-pipeline", "ml-anomaly"].map(
        (s) => `/img/work/${s}.webp`
      ),
    ];
    const missing = expectedArt.filter((p) => !paths.has(p) && !(p.includes("portrait") && paths.has("/img/portrait-900.webp")));
    if (missing.length) note(fail, `[${theme}] expected images never loaded: ${missing.join(", ")}`);
    else note(ok, `[${theme}] portrait, texture and all 8 project artworks loaded`);
    if (external.length) note(fail, `[${theme}] unexpected external images: ${external.join(", ")}`);
    const avatarOnDesktop = [...paths].filter((p) => p.includes("avatar"));
    if (avatarOnDesktop.length) note(fail, `[${theme}] desktop downloaded the hidden mobile avatar: ${avatarOnDesktop.join(", ")}`);
    else note(ok, `[${theme}] hidden mobile avatar is never downloaded on desktop`);

    // ---- em-dash / en-dash ban (rendered text, not source) ----
    const dashes = await page.evaluate(() => {
      const bad = [];
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walk.nextNode())) {
        const t = n.textContent || "";
        if (t.includes("—") || t.includes("–")) bad.push(t.trim().slice(0, 70));
      }
      // also attribute text users can see
      document.querySelectorAll("[alt],[aria-label],[title],[placeholder]").forEach((el) => {
        ["alt", "aria-label", "title", "placeholder"].forEach((a) => {
          const v = el.getAttribute(a);
          if (v && (v.includes("—") || v.includes("–"))) bad.push(`${a}="${v.slice(0, 50)}"`);
        });
      });
      return bad;
    });
    if (dashes.length) note(fail, `[${theme}] em/en-dash found (${dashes.length}): ${dashes.slice(0, 4).join(" | ")}`);
    else note(ok, `[${theme}] zero em-dashes and en-dashes`);

    // ---- contrast: every visible text node's element ----
    const contrast = await page.evaluate(contrastProbe);
    if (contrast.length) {
      note(
        fail,
        `[${theme}] contrast failures (${contrast.length}): ` +
          contrast.slice(0, 6).map((c) => `"${c.text}" ${c.ratio}:1 <${c.need} (${c.size}px)`).join(" | ")
      );
    } else note(ok, `[${theme}] all visible text passes WCAG AA contrast`);

    // Same question asked of the painted result, which catches the seasonal
    // aurora and the particle layer that a colour-only check cannot see.
    await pixelContrast(page, theme, fail, ok);

    // The nav is transparent at the top of the page, so the particle layer must
    // stay clear of that band. Read the canvas directly across several frames.
    const navBand = await page.evaluate(async () => {
      const c = document.querySelector("canvas[data-particles]");
      if (!c) return { present: false };
      const g = c.getContext("2d");
      const dpr = c.width / c.clientWidth;
      const band = Math.floor(70 * dpr);
      let lit = 0;
      let below = 0;
      for (let f = 0; f < 6; f++) {
        await new Promise((r) => setTimeout(r, 180));
        const top = g.getImageData(0, 0, c.width, band).data;
        for (let i = 3; i < top.length; i += 4) if (top[i] > 8) lit++;
        const rest = g.getImageData(0, band * 2, c.width, c.height - band * 2).data;
        for (let i = 3; i < rest.length; i += 16) if (rest[i] > 8) below++;
      }
      return { present: true, lit, below };
    });
    if (!navBand.present) note(fail, `[${theme}] particle canvas missing`);
    else if (navBand.lit > 0) note(fail, `[${theme}] particles drawn behind the nav (${navBand.lit} px across 6 frames)`);
    else if (navBand.below === 0) note(fail, `[${theme}] particle canvas is empty everywhere`);
    else note(ok, `[${theme}] particles animate but stay clear of the nav band (0 px in 6 frames)`);

    // ---- layout: horizontal overflow ----
    const overflow = await page.evaluate(() => {
      const de = document.documentElement;
      const bad = [];
      if (de.scrollWidth > de.clientWidth + 1) {
        document.querySelectorAll("body *").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.right > de.clientWidth + 1 || r.left < -1) {
            bad.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().slice(0, 40)}`);
          }
        });
      }
      return { scrollW: de.scrollWidth, clientW: de.clientWidth, culprits: bad.slice(0, 5) };
    });
    if (overflow.scrollW > overflow.clientW + 1)
      note(fail, `[${theme}] horizontal overflow ${overflow.scrollW}>${overflow.clientW}: ${overflow.culprits.join(", ")}`);
    else note(ok, `[${theme}] no horizontal page scroll at 1440px`);

    // ---- nav: single line + height ----
    const nav = await page.evaluate(() => {
      const header = document.querySelector("header");
      const n = header?.querySelector("nav");
      if (!n) return null;
      const r = n.getBoundingClientRect();
      // A wrapped nav shows items whose vertical centres are far apart.
      // Baseline-aligned items differ by a few px, so allow a 24px band.
      const items = [...n.querySelectorAll("a,button")].filter((e) => e.offsetParent);
      const centres = items.map((e) => {
        const b = e.getBoundingClientRect();
        return b.top + b.height / 2;
      });
      const spread = Math.max(...centres) - Math.min(...centres);
      return { height: Math.round(r.height), spread: Math.round(spread), rows: spread > 24 ? 2 : 1 };
    });
    if (!nav) note(fail, `[${theme}] no nav found`);
    else {
      if (nav.height > 80) note(fail, `[${theme}] nav height ${nav.height}px > 80px cap`);
      else note(ok, `[${theme}] nav height ${nav.height}px within cap`);
      if (nav.rows > 1) note(fail, `[${theme}] nav wraps at desktop (centre spread ${nav.spread}px)`);
      else note(ok, `[${theme}] nav renders on one line (centre spread ${nav.spread}px)`);
    }

    // ---- hero fits viewport (CTA visible without scroll) ----
    const hero = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      // Scope to the hero: the nav also has an a[href="#work"].
      const cta = document.querySelector('#top a[href="#work"]');
      if (!h1 || !cta) return null;
      const cs = getComputedStyle(h1);
      const lines = Math.round(h1.getBoundingClientRect().height / parseFloat(cs.lineHeight));
      return {
        h1Lines: lines,
        ctaBottom: Math.round(cta.getBoundingClientRect().bottom),
        vh: window.innerHeight,
      };
    });
    if (hero) {
      if (hero.ctaBottom > hero.vh)
        note(fail, `[${theme}] hero CTA below fold (${hero.ctaBottom}px > ${hero.vh}px)`);
      else note(ok, `[${theme}] hero CTA visible without scrolling (${hero.ctaBottom}/${hero.vh}px)`);
      if (hero.h1Lines > 2) note(fail, `[${theme}] hero headline is ${hero.h1Lines} lines, cap is 2`);
      else note(ok, `[${theme}] hero headline is ${hero.h1Lines} lines`);
    }

    // ---- images: alt + intrinsic size (CLS) + actually loaded ----
    const imgs = await page.evaluate(() =>
      [...document.querySelectorAll("img")].map((i) => ({
        src: i.currentSrc || i.src,
        hasAlt: i.hasAttribute("alt"),
        w: i.getAttribute("width"),
        h: i.getAttribute("height"),
        loaded: i.complete && i.naturalWidth > 0,
      }))
    );
    const noAlt = imgs.filter((i) => !i.hasAlt);
    const noDim = imgs.filter((i) => !i.w || !i.h);
    const broken = imgs.filter((i) => !i.loaded);
    if (noAlt.length) note(fail, `[${theme}] ${noAlt.length} img without alt attribute`);
    if (noDim.length) note(fail, `[${theme}] ${noDim.length} img without width/height (CLS risk)`);
    if (broken.length) note(fail, `[${theme}] ${broken.length} img failed to load: ${broken[0]?.src}`);
    if (!noAlt.length && !noDim.length && !broken.length)
      note(ok, `[${theme}] all ${imgs.length} images have alt + dimensions and loaded`);

    // ---- heading order ----
    const headings = await page.evaluate(() =>
      [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => ({
        lvl: +h.tagName[1],
        text: (h.textContent || "").trim().slice(0, 40),
      }))
    );
    const h1count = headings.filter((h) => h.lvl === 1).length;
    if (h1count !== 1) note(fail, `[${theme}] expected exactly one h1, found ${h1count}`);
    else note(ok, `[${theme}] exactly one h1`);
    let skip = null;
    for (let i = 1; i < headings.length; i++) {
      if (headings[i].lvl - headings[i - 1].lvl > 1) {
        skip = `${headings[i - 1].lvl}->${headings[i].lvl} at "${headings[i].text}"`;
        break;
      }
    }
    if (skip) note(fail, `[${theme}] heading level skipped: ${skip}`);
    else note(ok, `[${theme}] heading hierarchy has no skipped levels`);

    // ---- eyebrow count (skill rule: <= ceil(sections/3)) ----
    const eyebrows = await page.evaluate(() => {
      const secs = document.querySelectorAll("main section").length;
      let count = 0;
      document.querySelectorAll("main *").forEach((el) => {
        const cs = getComputedStyle(el);
        const txt = (el.textContent || "").trim();
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent || "").trim());
        if (!own || !txt) return;
        const tracking = parseFloat(cs.letterSpacing);
        if (cs.textTransform === "uppercase" && tracking > 0.5 && parseFloat(cs.fontSize) < 15) count++;
      });
      return { sections: secs, eyebrows: count };
    });
    const cap = Math.ceil(eyebrows.sections / 3);
    if (eyebrows.eyebrows > cap)
      note(fail, `[${theme}] ${eyebrows.eyebrows} eyebrows across ${eyebrows.sections} sections, cap ${cap}`);
    else note(ok, `[${theme}] ${eyebrows.eyebrows} eyebrows across ${eyebrows.sections} sections (cap ${cap})`);

    // ---- screenshots ----
    await page.screenshot({ path: path.join(OUT, `${theme}-desktop-hero.png`) });
    await page.screenshot({ path: path.join(OUT, `${theme}-desktop-full.png`), fullPage: true });

    await ctx.close();
  }

  // ---------- mobile ----------
  const mctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    colorScheme: "dark",
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mp = await mctx.newPage();
  const mobileImgs = [];
  mp.on("request", (r) => r.resourceType() === "image" && mobileImgs.push(new URL(r.url()).pathname));
  await mp.goto(SITE, { waitUntil: "networkidle", timeout: 60000 });
  await mp.waitForTimeout(900);

  // Phones show the small avatar and must not download the desktop portrait.
  const avatar = await mp.evaluate(() => {
    const img = document.querySelector('#top img[src*="avatar"]');
    if (!img) return { found: false };
    const r = img.getBoundingClientRect();
    return { found: true, w: Math.round(r.width), loaded: img.complete && img.naturalWidth > 1, src: img.currentSrc.split("/").pop() };
  });
  const portraitFetched = mobileImgs.filter((p) => p.includes("portrait"));
  if (avatar.found && avatar.loaded && avatar.w >= 48)
    note(ok, `[mobile] avatar visible (${avatar.w}px, ${avatar.src})`);
  else note(fail, `[mobile] avatar problem: ${JSON.stringify(avatar)}`);
  if (portraitFetched.length) note(fail, `[mobile] downloaded the hidden desktop portrait: ${portraitFetched.join(", ")}`);
  else note(ok, `[mobile] hidden desktop portrait is never downloaded`);

  await revealAll(mp);

  const mOverflow = await mp.evaluate(() => {
    const de = document.documentElement;
    const bad = [];
    if (de.scrollWidth > de.clientWidth + 1) {
      document.querySelectorAll("body *").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > de.clientWidth + 1) bad.push(`${el.tagName.toLowerCase()}.${(el.className||"").toString().slice(0,40)}`);
      });
    }
    return { s: de.scrollWidth, c: de.clientWidth, bad: bad.slice(0, 5) };
  });
  if (mOverflow.s > mOverflow.c + 1)
    note(fail, `[mobile] horizontal overflow ${mOverflow.s}>${mOverflow.c}: ${mOverflow.bad.join(", ")}`);
  else note(ok, `[mobile] no horizontal scroll at 375px`);

  // tap targets
  const taps = await mp.evaluate(() => {
    const small = [];
    document.querySelectorAll("a,button,[role=tab]").forEach((el) => {
      if (!el.offsetParent) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      // Skip-links are visually hidden until focused, and links sitting inside a
      // run of text are exempt from target-size rules (WCAG 2.5.8 inline exception).
      const cs = getComputedStyle(el);
      if (cs.clipPath !== "none" || r.width <= 1 || r.height <= 1) return;
      const parentText = (el.parentElement?.textContent || "").trim();
      const ownText = (el.textContent || "").trim();
      if (el.tagName === "A" && parentText.length > ownText.length + 3) return;
      if (r.height < 24 || r.width < 24) {
        small.push(`${el.tagName.toLowerCase()} "${(el.textContent||"").trim().slice(0,22)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    });
    return small;
  });
  if (taps.length) note(warn, `[mobile] ${taps.length} tap targets under 24px: ${taps.slice(0, 4).join(" | ")}`);
  else note(ok, `[mobile] all tap targets >= 24px`);

  await mp.screenshot({ path: path.join(OUT, "mobile-hero.png") });
  await mp.screenshot({ path: path.join(OUT, "mobile-full.png"), fullPage: true });

  // mobile menu works
  const menuBtn = mp.locator('button[aria-controls="mobile-nav"]');
  if (await menuBtn.count()) {
    await menuBtn.click();
    await mp.waitForTimeout(400);
    const expanded = await menuBtn.getAttribute("aria-expanded");
    const visible = await mp.locator("#mobile-nav").isVisible();
    if (expanded === "true" && visible) note(ok, `[mobile] menu opens and exposes aria-expanded`);
    else note(fail, `[mobile] menu did not open (expanded=${expanded}, visible=${visible})`);
    await mp.screenshot({ path: path.join(OUT, "mobile-menu.png") });
    await mp.keyboard.press("Escape");
    await mp.waitForTimeout(300);
    const afterEsc = await menuBtn.getAttribute("aria-expanded");
    if (afterEsc === "false") note(ok, `[mobile] Escape closes the menu`);
    else note(warn, `[mobile] Escape did not close the menu`);
  }
  await mctx.close();

  // ---------- interaction: filters + tabs + keyboard ----------
  const ictx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
  const ip = await ictx.newPage();
  await ip.goto(SITE, { waitUntil: "networkidle", timeout: 60000 });
  await ip.waitForTimeout(900);

  // project filter
  const before = await ip.locator("#work article").count();
  await ip.locator('#work button:has-text("Security")').click();
  await ip.waitForTimeout(700);
  const afterSec = await ip.locator("#work article").count();
  const secTitles = await ip.locator("#work article h3").allTextContents();
  if (afterSec < before && afterSec > 0)
    note(ok, `[filter] Security narrows ${before} -> ${afterSec}: ${secTitles.join(", ")}`);
  else note(fail, `[filter] broken: ${before} -> ${afterSec}`);

  await ip.locator('#work button:has-text("All")').click();
  await ip.waitForTimeout(700);
  const restored = await ip.locator("#work article").count();
  if (restored === before) note(ok, `[filter] All restores ${restored} projects`);
  else note(fail, `[filter] All did not restore (${restored} vs ${before})`);

  // tabs keyboard
  const firstTab = ip.locator('[role="tab"]').first();
  await firstTab.focus();
  await ip.keyboard.press("ArrowRight");
  await ip.waitForTimeout(400);
  const selected = await ip.locator('[role="tab"][aria-selected="true"]').textContent();
  const secondLabel = await ip.locator('[role="tab"]').nth(1).textContent();
  if (selected?.trim() === secondLabel?.trim())
    note(ok, `[tabs] ArrowRight moves selection to "${selected?.trim()}"`);
  else note(fail, `[tabs] ArrowRight failed (selected "${selected}")`);

  // every icon is hidden from assistive tech or has an accessible name
  const svgA11y = await ip.evaluate(() => {
    const svgs = [...document.querySelectorAll("svg")];
    const exposed = svgs.filter((s) => {
      if (s.getAttribute("aria-hidden") === "true") return false;
      if (s.getAttribute("role") === "img" && s.querySelector("title")) return false;
      const host = s.closest("button,a");
      return !(host && host.getAttribute("aria-label"));
    });
    return { total: svgs.length, exposed: exposed.length };
  });
  if (svgA11y.exposed === 0)
    note(ok, `[a11y] all ${svgA11y.total} icons hidden from assistive tech`);
  else note(fail, `[a11y] ${svgA11y.exposed}/${svgA11y.total} icons exposed without a label`);

  // theme-color meta tracks the theme
  const themeMeta = await ip.evaluate(() => {
    const m = document.querySelector('meta[name="theme-color"]');
    return m ? m.getAttribute("content") : null;
  });
  if (themeMeta) note(ok, `[meta] theme-color present and synced (${themeMeta})`);
  else note(fail, `[meta] theme-color missing`);

  // social preview card: declared, served, and the size LinkedIn expects
  const og = await ip.evaluate(async () => {
    const href = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
    if (!href) return { declared: false };
    // Crawlers need an absolute URL, but the deployed host may not exist yet,
    // so check the form of the URL and fetch the same path from this build.
    const absolute = /^https:\/\//.test(href);
    if (!absolute) return { declared: true, href, absolute };
    const res = await fetch(new URL(href).pathname);
    const blob = await res.blob();
    const bmp = await createImageBitmap(blob);
    return { declared: true, href, absolute, status: res.status, type: blob.type, w: bmp.width, h: bmp.height };
  });
  if (og.declared && og.absolute && og.status === 200 && og.w === 1200 && og.h === 630)
    note(ok, `[meta] og:image ${og.href} served ${og.w}x${og.h} ${og.type}`);
  else note(fail, `[meta] og:image problem: ${JSON.stringify(og)}`);

  // deep-linkable filter state
  await ip.locator('#work button:has-text("Cloud")').click();
  await ip.waitForTimeout(500);
  const urlAfter = new URL(ip.url()).searchParams.get("work");
  if (urlAfter === "Cloud") note(ok, `[url] filter writes ?work=Cloud`);
  else note(fail, `[url] filter did not update the URL (got ${urlAfter})`);

  await ip.goto(ip.url(), { waitUntil: "networkidle" });
  await ip.waitForTimeout(700);
  const restoredCount = await ip.locator("#work article").count();
  const pressed = await ip
    .locator('#work button[aria-pressed="true"]')
    .textContent();
  if (pressed?.trim() === "Cloud" && restoredCount === 1)
    note(ok, `[url] reload restores the Cloud filter (${restoredCount} project)`);
  else note(fail, `[url] reload did not restore filter (pressed=${pressed}, n=${restoredCount})`);

  // skills tab deep link
  await ip.goto(SITE + "?skills=cloud", { waitUntil: "networkidle" });
  await ip.waitForTimeout(700);
  const tabSel = await ip.locator('[role="tab"][aria-selected="true"]').textContent();
  if (tabSel?.trim() === "Cloud and DevOps")
    note(ok, `[url] ?skills=cloud opens the Cloud and DevOps tab`);
  else note(fail, `[url] skills deep link failed (got "${tabSel?.trim()}")`);

  await ip.goto(SITE, { waitUntil: "networkidle" });
  await ip.waitForTimeout(600);

  // seasonal picker: opens, switches palette and button shape, and resets
  const beforePal = await ip.evaluate(() => document.documentElement.dataset.palette);
  const pickerBtn = ip.locator('button[aria-haspopup="dialog"]').first();
  await pickerBtn.click();
  await ip.waitForTimeout(350);
  const dialogOpen = await ip.locator('[role="dialog"]').isVisible();
  await ip.locator('[role="dialog"] button:has-text("Winter")').click();
  await ip.waitForTimeout(700);
  const afterWinter = await ip.evaluate(() => ({
    pal: document.documentElement.dataset.palette,
    shape: document.documentElement.dataset.shape,
    radius: getComputedStyle(document.documentElement).getPropertyValue("--btn-radius").trim(),
    accent: getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim(),
  }));
  if (dialogOpen && afterWinter.pal === "winter" && afterWinter.radius === "2px")
    note(
      ok,
      `[seasons] picker switched ${beforePal} -> winter, buttons ${afterWinter.radius}, accent ${afterWinter.accent}`
    );
  else note(fail, `[seasons] picker failed: ${JSON.stringify(afterWinter)} (dialog ${dialogOpen})`);

  await ip.locator('[role="dialog"] button:has-text("Back to today")').click();
  await ip.waitForTimeout(700);
  const backToToday = await ip.evaluate(() => document.documentElement.dataset.palette);
  if (backToToday === beforePal) note(ok, `[seasons] "Back to today" restores ${backToToday}`);
  else note(fail, `[seasons] reset failed (${backToToday} vs ${beforePal})`);
  await ip.keyboard.press("Escape");
  await ip.waitForTimeout(250);

  // focus visibility
  const focusRing = await ip.evaluate(() => {
    const el = document.querySelector('#top a[href="#work"]');
    el.focus();
    const cs = getComputedStyle(el);
    return { outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle, outlineColor: cs.outlineColor };
  });
  if (focusRing.outlineStyle !== "none" && parseFloat(focusRing.outlineWidth) > 0)
    note(ok, `[a11y] visible focus ring (${focusRing.outlineWidth} ${focusRing.outlineStyle})`);
  else note(fail, `[a11y] no visible focus ring on primary CTA`);

  // skip link
  await ip.keyboard.press("Tab");
  const skipLink = await ip.evaluate(() => {
    const a = document.activeElement;
    return { text: (a?.textContent || "").trim(), href: a?.getAttribute?.("href") };
  });
  note(ok, `[a11y] first Tab stop: "${skipLink.text}" -> ${skipLink.href}`);

  await ictx.close();

  // ---------- reduced motion ----------
  const rctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
    reducedMotion: "reduce",
  });
  const rp = await rctx.newPage();
  const rErrors = [];
  rp.on("pageerror", (e) => rErrors.push(String(e)));
  await rp.goto(SITE, { waitUntil: "networkidle", timeout: 60000 });
  await rp.waitForTimeout(800);
  await revealAll(rp);
  const rmVisible = await rp.evaluate(() => {
    const h1 = document.querySelector("h1");
    const cs = getComputedStyle(h1);
    return { opacity: cs.opacity, transform: cs.transform };
  });
  if (parseFloat(rmVisible.opacity) > 0.95)
    note(ok, `[reduced-motion] content renders fully visible without animation`);
  else note(fail, `[reduced-motion] h1 opacity ${rmVisible.opacity}, content may stay hidden`);
  if (rErrors.length) note(fail, `[reduced-motion] page errors: ${rErrors.join(" | ")}`);
  await rp.screenshot({ path: path.join(OUT, "reduced-motion.png"), fullPage: true });
  await rctx.close();

  // ---------- skip link is genuinely the first tab stop ----------
  const kctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const kp = await kctx.newPage();
  await kp.goto(SITE, { waitUntil: "networkidle" });
  await kp.waitForTimeout(600);
  // Check tab ORDER from the DOM rather than relying on where the browser
  // chrome puts initial focus, then focus the link to confirm it un-hides.
  const skip = await kp.evaluate(() => {
    const sel =
      'a[href]:not([tabindex="-1"]), button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const tabbable = [...document.querySelectorAll(sel)].filter((el) => {
      const cs = getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden";
    });
    const firstEl = tabbable[0];
    const link = document.querySelector('a[href="#main"]');
    if (!link) return { found: false };
    const before = link.getBoundingClientRect();
    link.focus();
    const after = link.getBoundingClientRect();
    return {
      found: true,
      isFirst: firstEl === link,
      firstText: (firstEl?.textContent || "").trim().slice(0, 30),
      hiddenWhenBlurred: before.width <= 1 || before.height <= 1,
      visibleWhenFocused: after.width > 1 && after.height > 1,
      focused: document.activeElement === link,
      target: !!document.getElementById("main"),
    };
  });
  if (skip.found && skip.isFirst && skip.visibleWhenFocused && skip.focused && skip.target)
    note(
      ok,
      `[a11y] skip link is first in tab order, hidden until focused, and targets #main`
    );
  else
    note(
      fail,
      `[a11y] skip link problem: ${JSON.stringify({ ...skip, firstText: skip.firstText })}`
    );
  await kctx.close();

  // ---------- performance ----------
  // Measured against PERF_TARGET (the production preview) when provided; the
  // dev server ships unminified modules and would report meaningless numbers.
  const perfTarget = process.env.PERF_TARGET;
  if (!perfTarget) {
    note(warn, `[perf] skipped: set PERF_TARGET to the production preview URL`);
    await browser.close();
    return report();
  }
  const pctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pp = await pctx.newPage();
  // LCP and layout-shift entries are only retained if an observer is watching
  // from the very start, so register before any script on the page runs.
  await pp.addInitScript(() => {
    window.__lcp = 0;
    window.__cls = 0;
    new PerformanceObserver((l) => {
      const e = l.getEntries();
      window.__lcp = e[e.length - 1].startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await pp.goto(perfTarget, { waitUntil: "load" });
  await pp.waitForTimeout(2500);
  const perf = await pp.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null;
    return {
      fcp: fcp ? Math.round(fcp) : null,
      lcp: window.__lcp ? Math.round(window.__lcp) : null,
      cls: +(window.__cls || 0).toFixed(4),
      domInteractive: Math.round(nav.domInteractive),
      transferKB: Math.round(
        performance.getEntriesByType("resource").reduce((a, r) => a + (r.transferSize || 0), 0) / 1024
      ),
    };
  });
  note(
    ok,
    `[perf] FCP ${perf.fcp}ms, LCP ${perf.lcp}ms, CLS ${perf.cls}, DOM interactive ${perf.domInteractive}ms, transfer ${perf.transferKB}KB`
  );
  if (perf.cls > 0.1) note(fail, `[perf] CLS ${perf.cls} exceeds 0.1`);
  if (perf.lcp && perf.lcp > 2500) note(warn, `[perf] LCP ${perf.lcp}ms exceeds the 2500ms target`);
  await pctx.close();

  await browser.close();
  return report();
}

function report() {
  // ---------- report ----------
  const line = "=".repeat(64);
  console.log(line + "\nPASS (" + ok.length + ")\n" + line);
  ok.forEach((m) => console.log("  ok   " + m));
  if (warn.length) {
    console.log("\n" + line + "\nWARN (" + warn.length + ")\n" + line);
    warn.forEach((m) => console.log("  warn " + m));
  }
  console.log("\n" + line + "\nFAIL (" + fail.length + ")\n" + line);
  if (!fail.length) console.log("  none");
  fail.forEach((m) => console.log("  FAIL " + m));
  console.log("\nScreenshots -> " + OUT);
  process.exit(fail.length ? 1 : 0);
}

run().catch((e) => {
  console.error("audit crashed:", e);
  process.exit(2);
});
