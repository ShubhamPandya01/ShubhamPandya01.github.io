import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { profile } from "../data/content";
import { useSeasonalTheme } from "../theme/context";
import { Magnetic, Parallax, WordReveal } from "./primitives";

export default function Hero() {
  const reduce = useReducedMotion();
  const { palette, greeting, now, isFestival } = useSeasonalTheme();

  const fade = (delay: number) =>
    reduce
      ? { initial: false as const, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  const dateLine = new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);

  return (
    <section id="top" className="relative min-h-[72dvh] overflow-hidden pt-[68px] lg:min-h-[92dvh]">
      <div aria-hidden="true" className="aurora pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto grid max-w-[1180px] items-center gap-12 px-5 pt-14 pb-20 sm:px-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-16 lg:pt-20 lg:pb-28">
        <div>
          <motion.picture {...fade(0)} className="mb-5 block lg:hidden">
            <source
              media="(min-width: 1024px)"
              srcSet="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
            />
            <source type="image/webp" srcSet="/img/avatar-96.webp 1x, /img/avatar-192.webp 2x" />
            <img
              src="/img/avatar-192.jpg"
              srcSet="/img/avatar-96.jpg 1x, /img/avatar-192.jpg 2x"
              alt="Shubham Pandya"
              width={64}
              height={64}
              loading="eager"
              decoding="async"
              className="h-16 w-16 rounded-full border-2 border-accent/60 object-cover shadow-lg shadow-accent/20"
            />
          </motion.picture>
          <motion.div {...fade(0)} className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="flex items-center gap-2 font-mono text-[13px] text-fg-muted">
              <span className="relative flex h-1.5 w-1.5">
                {!reduce && (
                  <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-accent" />
                )}
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              {greeting}
            </span>
            <span aria-hidden="true" className="h-3 w-px bg-line-strong" />
            <span className="font-mono text-[13px] text-fg-subtle">{dateLine}</span>
            <span
              className="btn-shape border border-accent/40 bg-accent-subtle px-2.5 py-[3px] font-mono text-[12px] text-accent"
              title={palette.blurb}
            >
              {isFestival ? palette.name : `${palette.name} palette`}
            </span>
          </motion.div>

          <h1 className="mt-6 text-[2rem] font-semibold leading-[1.06] tracking-[-0.03em] text-fg sm:text-[2.6rem] lg:text-[3rem] xl:text-[3.4rem]">
            <WordReveal text="I secure systems, then build" delay={0.05} />{" "}
            <WordReveal text="what watches them." delay={0.28} gradient />
          </h1>

          <motion.p
            {...fade(0.5)}
            className="mt-7 max-w-[54ch] text-[1.05rem] leading-relaxed text-fg-muted sm:text-lg"
          >
            {profile.heroSubtext}
          </motion.p>

          <motion.div {...fade(0.62)} className="mt-9 flex flex-wrap items-center gap-3">
            <Magnetic strength={0.28}>
              <a
                href="#work"
                className="btn-shape group inline-flex items-center gap-2 whitespace-nowrap bg-accent px-6 py-3 text-[15px] font-medium text-accent-fg shadow-lg shadow-accent/20 active:translate-y-px"
              >
                See the work
                <ArrowRight
                  size={16}
                  weight="bold"
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>
            </Magnetic>
            <Magnetic strength={0.22}>
              <a
                href="#contact"
                className="btn-shape inline-flex items-center whitespace-nowrap border border-line-strong px-6 py-3 text-[15px] font-medium text-fg transition-colors hover:border-accent hover:text-accent"
              >
                Get in touch
              </a>
            </Magnetic>
          </motion.div>
        </div>

        <Parallax
          distance={28}
          className="relative hidden aspect-[4/5] lg:block"
        >
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-[4/5] overflow-hidden rounded-[10px] border border-line bg-bg-subtle"
          >
            <picture>
              {/* This panel is hidden below lg, but a hidden <img> still
                  downloads. Resolving to an inline 1px GIF there skips the
                  fetch; phones get the small avatar above the greeting. */}
              <source
                media="(max-width: 1023px)"
                srcSet="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
              />
              <source
                type="image/webp"
                srcSet="/img/portrait-680.webp 680w, /img/portrait-900.webp 900w"
                sizes="(min-width: 1280px) 380px, 340px"
              />
              <img
                src="/img/portrait-900.jpg"
                srcSet="/img/portrait-680.jpg 680w, /img/portrait-900.jpg 900w"
                sizes="(min-width: 1280px) 380px, 340px"
                alt="Shubham Pandya"
                width={900}
                height={1125}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-cover"
                style={{ filter: "saturate(0.82) contrast(1.02)" }}
              />
            </picture>
            {/* Light seasonal wash so the portrait sits in the palette without
                turning the subject grey. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  "linear-gradient(150deg, color-mix(in srgb, var(--color-accent) 60%, transparent), transparent 52%, color-mix(in srgb, var(--color-second) 45%, transparent))",
                mixBlendMode: "soft-light",
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-bg to-transparent opacity-70"
            />
          </motion.div>
        </Parallax>
      </div>
    </section>
  );
}
