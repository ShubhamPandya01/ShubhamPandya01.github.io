# Shubham Pandya, portfolio (v2)

A second, from-scratch portfolio. The original build is untouched in the parent
directory; nothing here shares code or config with it.

**Stack:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Motion, Phosphor
Icons, Geist and Geist Mono (self-hosted via Fontsource, no font CDN at
runtime).

## Commands

```bash
npm run dev             # dev server on :5174
npm run build           # type-check and build to dist/
npm run preview         # serve the production build on :5175
npm run lint            # oxlint
npm run check:palettes  # contrast gate for all 15 palettes (no browser needed)
npm run check:calendar  # freezes the clock at 22 dates and checks the result
npm run audit           # 58 browser checks (a11y, contrast, images, layout, perf)
npm run verify          # everything above, in order
npm run make:art        # regenerate the project and capabilities artwork
npm run make:og         # regenerate the 1200x630 social preview card
```

## The seasonal theme engine

The accent colour, the second hue, the button shape, the background wash and
the falling particles are all chosen from the date and time. Nothing is
hardcoded to a season; `resolvePalette(date)` decides.

**Seasons** are meteorological, not astronomical, so autumn starts on 1
September rather than the equinox. That matches how people actually describe
the time of year.

**Festivals override the season** while they are running, narrowest window
first, so Christmas beats winter and Diwali beats autumn:

| Festival | Window | Button shape |
|---|---|---|
| New Year | 30 Dec to 2 Jan | pill |
| Lunar New Year | table, +/- 2 days | pill |
| Valentine's Day | 13 to 14 Feb | pill |
| Holi | table, +/- 1 day | pill |
| Easter | computed, +/- 2 days | soft |
| Canada Day | 1 Jul | sharp |
| Thanksgiving (CA) | 2nd Mon Oct, +/- 2 days | soft |
| Halloween | 26 to 31 Oct | cut |
| Remembrance Day | 11 Nov | sharp |
| Diwali | table, +/- 2 days | pill |
| Christmas | 10 to 26 Dec | soft |

Easter is computed with the anonymous Gregorian algorithm and Thanksgiving from
an nth-weekday rule, so both are correct for any year. The lunisolar dates
(Diwali, Holi, Lunar New Year) cannot be derived from the Gregorian calendar,
so they are tabulated in `src/theme/calendar.ts` for **2025 to 2030**. Outside
that range the engine falls back to the plain season, which is the right
behaviour rather than a wrong guess. Extend `LUNAR_TABLE` to go further.

**Time of day** sets the greeting and nudges particle density; the palette
re-resolves every minute so it rolls over on its own at midnight.

Visitors can preview any palette from the picker in the nav. That override is
remembered until they choose "Back to today".

### Adding a festival

Add a `Palette` to `FESTIVALS` in `src/theme/palettes.ts`, then add one line to
the `candidates` array in `resolvePalette` (earlier in the array wins). Run
`npm run check:palettes` to confirm the colours clear AA before committing.

## Verification

Three gates, all runnable locally and all exiting non-zero on failure:

- **`check:palettes`** does the colour maths for all 15 palettes with no
  browser: each accent against its own page background and card surface, and
  each button label against its own accent, in both light and dark. 30 checks.
- **`check:calendar`** freezes the browser clock at 22 dates and times and
  asserts which palette and button shape the real shipped page chose.
- **`audit`** drives Chromium through the page: WCAG AA contrast twice over
  (once from computed styles, once by hiding each element's glyphs and
  photographing the true painted background behind it, which is the only way to
  see through the aurora and the masked artwork), heading order, focus rings,
  the skip link, icon accessibility, tap targets, horizontal overflow at 375px,
  hero fold behaviour, every request returning 2xx (a missing mask file would
  otherwise render a silently blank card), all artwork actually loading, the
  social card, that phones never download the desktop portrait and desktops
  never download the phone avatar, particles staying clear of the nav, the
  project filter, the skills tabs and their keyboard navigation, deep links,
  the season picker, reduced motion, and Core Web Vitals.

  The particle canvas is hidden while contrast is photographed: it moves, so
  including it would grade a random frame. Its effect on text is handled in the
  component, where particles dissolve before reaching the nav.

```bash
npm run build
npm run preview &
TARGET=http://localhost:5175 PERF_TARGET=http://localhost:5175 npm run audit
```

Performance is only measured when `PERF_TARGET` points at a production
preview; the dev server serves unminified modules and would report meaningless
numbers.

## Motion

Everything respects `prefers-reduced-motion`: the particle canvas paints one
still frame and stops, the marquee halts, and every reveal renders at full
opacity immediately. The canvas also stops entirely when the tab is hidden.

Pointer-driven effects (magnetic buttons, spotlight card borders) use motion
values and CSS custom properties rather than React state, so moving the mouse
never re-renders the tree, and they are disabled on coarse pointers.

## Content

Every visible string lives in [`src/data/content.ts`](src/data/content.ts).
Edit there; no component changes needed.

## Images

Every image is local; the page makes no third-party requests.

| File | Used for | Made from |
|---|---|---|
| `public/img/portrait-680/900.{webp,jpg}` | Desktop hero panel (4:5) | Your photo, cropped |
| `public/img/avatar-96/192.{webp,jpg}` | Phone hero avatar | Your photo, face crop |
| `public/img/work/*.webp` | Project cards, one per slug | `npm run make:art` |
| `public/img/texture-security.webp` | Security capability panel | `npm run make:art` |
| `public/og.jpg` | Link preview on LinkedIn, Slack, etc. | `npm run make:og` |

The hero panel is desktop-only and the avatar phone-only. Each `<picture>`
resolves to an inline 1px GIF where it is hidden, because a hidden `<img>`
still downloads; the audit verifies neither device fetches the other's image.

**The project artwork is generated, not photographed.** Each file is
white-on-transparent and used as a CSS mask over the seasonal accent gradient,
so one set of files recolours itself for every season and festival. It is
deliberately abstract (a cluster plot for the ML work, a commit graph for
SmartCodeBot, a radar sweep for the home lab) and does not claim to show the
project. To use a real screenshot for a project instead, replace the masked
`div` in `Thumb` (`src/components/Projects.tsx`) with an `<img>`; a masked
screenshot would render as a flat silhouette.

## Deploying

Hosted free on GitHub Pages at **https://shubhampandya01.github.io/**. The repo
is named `ShubhamPandya01.github.io`, which GitHub serves at the root of that
domain, so the site's absolute `/img/...` paths work with no base-path config.

Every push to `main` runs `.github/workflows/deploy.yml`: install, lint,
type-check and build, the palette contrast gate, then publish `dist/`. A
failure at any step stops the deploy, so a broken build never replaces the live
site. Watch runs under the repo's **Actions** tab.

The canonical URL, `og:url`, `og:image` and `twitter:image` in `index.html`
are absolute and point at that address, because LinkedIn and most crawlers
ignore relative URLs. Change all four if the site moves to a custom domain.

To publish a change:

```bash
git add -A
git commit -m "Describe the change"
git push
```
