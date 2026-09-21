import { motion, useReducedMotion } from "motion/react";
import { ShieldCheck, Brain, Cloud, ChartBar, Check } from "@phosphor-icons/react";
import Section from "./Section";
import { capabilities } from "../data/content";

const icons = { shield: ShieldCheck, brain: Brain, cloud: Cloud, chart: ChartBar };

// 4 items, 4 cells, no empty tiles. Wide cells carry the visual variation.
const spans = ["md:col-span-2", "md:col-span-1", "md:col-span-1", "md:col-span-2"];

export default function Capabilities() {
  const reduce = useReducedMotion();

  return (
    <Section
      id="capabilities"
      title="Four things I do, and"
      accent="the evidence for each."
      glow="left"
      lede="Security is where I started and where the instinct comes from. The rest is what I have been building since."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {capabilities.map((c, i) => {
          const Icon = icons[c.icon];
          const wide = i === 0 || i === 3;
          return (
            <motion.article
              key={c.title}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15, margin: "0px 0px 12% 0px" }}
              transition={{ duration: 0.55, delay: (i % 2) * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`spotlight lift relative isolate overflow-hidden rounded-[10px] border border-line bg-bg-elevated p-6 transition-colors hover:border-accent/40 sm:p-7 ${spans[i]}`}
              onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
              }}
            >
              {i === 0 && (
                <>
                  {/* Network artwork masked over the accent, kept to the right
                      half so it never sits behind the copy. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 right-0 -z-10 w-3/5 opacity-50"
                    style={{
                      background:
                        "linear-gradient(120deg, var(--color-accent), var(--color-second))",
                      WebkitMaskImage: "url(/img/texture-security.webp)",
                      maskImage: "url(/img/texture-security.webp)",
                      WebkitMaskSize: "cover",
                      maskSize: "cover",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                    }}
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 bg-gradient-to-r from-bg-elevated from-35% via-bg-elevated/70 to-transparent"
                  />
                </>
              )}
              {i === 3 && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_100%_0%,var(--color-accent-subtle),transparent_60%)]"
                />
              )}

              <Icon size={24} weight="duotone" className="text-accent" />
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-fg">{c.title}</h3>
              <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed text-fg-muted">{c.body}</p>

              <ul className={`mt-5 grid gap-x-6 gap-y-2 ${wide ? "sm:grid-cols-2" : ""}`}>
                {c.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-[13.5px] text-fg-muted">
                    <Check
                      size={14}
                      weight="bold"
                      className="mt-[3px] shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.article>
          );
        })}
      </div>
    </Section>
  );
}
