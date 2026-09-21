import { motion, useReducedMotion } from "motion/react";
import Section from "./Section";
import { experience as job } from "../data/content";

export default function Experience() {
  const reduce = useReducedMotion();

  return (
    <Section
      id="experience"
      title="Three years on the other side of"
      accent="the alert."
      glow="left"
      lede="Before the classroom, this was the job. A small team, a hundred endpoints, and no one else to escalate to."
      tint
    >
      <div className="border-t border-line-strong pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-fg">{job.role}</h3>
            <p className="mt-1 text-[15px] text-fg-muted">
              {job.company}
              <span className="mx-2 text-line-strong">/</span>
              {job.location}
            </p>
          </div>
          <p className="tnum font-mono text-[13px] text-accent">{job.period}</p>
        </div>

        <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-fg-muted">{job.note}</p>

        <div className="mt-10 grid gap-x-12 gap-y-1 sm:grid-cols-2">
          {job.bullets.map((b, i) => (
            <motion.div
              key={b.head}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15, margin: "0px 0px 12% 0px" }}
              transition={{ duration: 0.5, delay: (i % 2) * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group relative py-4 pl-6"
            >
              {/* Rail draws itself down as the item arrives. */}
              <motion.span
                aria-hidden="true"
                initial={reduce ? false : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, amount: 0.15, margin: "0px 0px 12% 0px" }}
                transition={{ duration: 0.7, delay: 0.1 + (i % 2) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 top-0 h-full w-[2px] origin-top rounded-full bg-line-strong transition-colors duration-300 group-hover:bg-accent"
              />
              <h4 className="text-[15px] font-semibold text-fg">{b.head}</h4>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-fg-muted">{b.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
