import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Section header. Headline and lede stack vertically on purpose: the
 * "big headline left, small paragraph floating right" split is a tell.
 * The accent rule draws itself in as the header arrives, which gives each
 * section an entrance without adding another label to read.
 */
export default function Section({
  id,
  title,
  accent,
  lede,
  children,
  tint = false,
  glow = "left",
}: {
  id: string;
  title: string;
  /** Trailing fragment of the title rendered in the seasonal accent. */
  accent?: string;
  lede?: string;
  children: ReactNode;
  tint?: boolean;
  glow?: "left" | "right" | "none";
}) {
  const reduce = useReducedMotion();
  const reveal = {
    initial: reduce ? false : { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15, margin: "0px 0px 12% 0px" } as const,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  };

  return (
    <section
      id={id}
      className={`relative border-t border-line ${tint ? "bg-bg-subtle/85 backdrop-blur-sm" : ""}`}
    >
      {glow !== "none" && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={`absolute -top-24 h-[420px] w-[520px] rounded-full blur-[130px] ${
              glow === "left" ? "-left-32" : "-right-32"
            }`}
            style={{ background: "var(--color-accent-subtle)" }}
          />
        </div>
      )}

      <div className="relative mx-auto max-w-[1180px] px-5 py-20 sm:px-8 md:py-28">
        <motion.div {...reveal} className="max-w-[54ch]">
          <motion.span
            aria-hidden="true"
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.15, margin: "0px 0px 12% 0px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 block h-[3px] w-16 origin-left rounded-full bg-accent"
          />
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.025em] text-fg sm:text-[2.6rem]">
            {title}
            {accent && <span className="accent-gradient-text"> {accent}</span>}
          </h2>
          {lede && <p className="mt-4 text-[1.05rem] leading-relaxed text-fg-muted">{lede}</p>}
        </motion.div>
        <div className="mt-12 md:mt-16">{children}</div>
      </div>
    </section>
  );
}
