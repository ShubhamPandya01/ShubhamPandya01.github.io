import { motion, useReducedMotion } from "motion/react";
import { metrics, marqueeTools } from "../data/content";
import { Counter } from "./primitives";

/**
 * Numeric strip plus the tools marquee. Deliberately not cards: hairline
 * dividers carry the grouping so the numbers read as one continuous fact.
 */
export default function Metrics() {
  const reduce = useReducedMotion();

  return (
    <section
      aria-label="Track record"
      className="relative z-10 border-y border-line bg-bg-subtle/85 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <dl className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15, margin: "0px 0px 12% 0px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="border-b border-line py-8 sm:border-b-0 sm:py-10 sm:pl-8 sm:first:pl-0"
            >
              <dd className="tnum font-mono text-[2.4rem] font-medium leading-none tracking-tight text-fg">
                <Counter value={m.value} decimals={m.decimals} />
                <span className="text-accent">{m.unit}</span>
              </dd>
              <dt className="mt-3 text-[13px] leading-snug text-fg-muted">{m.label}</dt>
            </motion.div>
          ))}
        </dl>
      </div>

      {/* The one marquee on the page. Carries the tool list that would
          otherwise be a long flat row nobody reads. */}
      <div className="relative flex overflow-hidden border-t border-line py-3">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-bg-subtle to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-bg-subtle to-transparent"
        />
        <ul className="marquee-track flex w-max shrink-0 items-center gap-8 pr-8">
          {[...marqueeTools, ...marqueeTools].map((tool, i) => (
            <li
              key={`${tool}-${i}`}
              aria-hidden={i >= marqueeTools.length ? "true" : undefined}
              className="flex items-center gap-8 whitespace-nowrap font-mono text-[12.5px] text-fg-subtle"
            >
              {tool}
              <span aria-hidden="true" className="text-accent/50">
                /
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
