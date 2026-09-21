import { motion, useReducedMotion } from "motion/react";
import { SealCheck } from "@phosphor-icons/react";
import Section from "./Section";
import { education, certifications } from "../data/content";

export default function Background() {
  const reduce = useReducedMotion();

  return (
    <Section
      id="background"
      title="Study and"
      accent="certification"
      glow="left"
      lede="Two postgraduate certificates at Durham College, either side of an engineering degree."
      tint
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <ol className="relative">
            {education.map((e, i) => (
              <motion.li
                key={e.credential}
                initial={reduce ? false : { opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.15, margin: "0px 0px 12% 0px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="relative border-l border-line pb-8 pl-6 last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className={`absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full ${
                    e.status === "In progress" ? "bg-accent" : "bg-line-strong"
                  }`}
                />
                <p className="tnum font-mono text-[12px] text-fg-subtle">
                  {e.period}
                  {e.status === "In progress" && (
                    <span className="ml-2 text-accent">{e.status}</span>
                  )}
                </p>
                <h3 className="mt-2 text-[16.5px] font-semibold leading-snug text-fg">
                  {e.credential}
                </h3>
                <p className="mt-1 text-[14.5px] text-fg-muted">{e.school}</p>
                {e.detail && (
                  <p className="mt-2 max-w-[48ch] text-[13.5px] leading-relaxed text-fg-subtle">
                    {e.detail}
                  </p>
                )}
              </motion.li>
            ))}
          </ol>
        </div>

        <div className="space-y-8">
          {certifications.map((group, gi) => (
            <motion.div
              key={group.heading}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15, margin: "0px 0px 12% 0px" }}
              transition={{ duration: 0.5, delay: gi * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3 className="font-mono text-[12px] text-fg-subtle">{group.heading}</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {group.items.map((c) => (
                  <li
                    key={c.name + c.org}
                    className="lift flex items-start gap-2.5 rounded-[8px] border border-line bg-bg-elevated p-3"
                  >
                    <SealCheck
                      size={17}
                      weight="duotone"
                      className="mt-px shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-medium leading-snug text-fg">{c.name}</p>
                      <p className="mt-0.5 font-mono text-[11.5px] text-fg-subtle">
                        {c.org}
                        <span className="mx-1.5 text-line-strong">/</span>
                        {c.note}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
