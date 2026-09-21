import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, EnvelopeSimple } from "@phosphor-icons/react";
import { profile } from "../data/content";

/** Shown text is derived from the link itself so the two can never disagree. */
const display = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "");

// Email spans both columns on phones: three cards in a two-column grid would
// otherwise leave an empty cell showing the divider colour.
const channels = [
  {
    label: "Email",
    value: profile.email,
    href: `mailto:${profile.email}`,
    external: false,
    span: "col-span-2 sm:col-span-1",
  },
  {
    label: "LinkedIn",
    value: display(profile.linkedin),
    href: profile.linkedin,
    external: true,
    span: "",
  },
  {
    label: "GitHub",
    value: display(profile.github),
    href: profile.github,
    external: true,
    span: "",
  },
];

export default function Contact() {
  const reduce = useReducedMotion();

  return (
    <section id="contact" className="border-t border-line">
      <div className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8 md:py-32">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15, margin: "0px 0px 12% 0px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-[34ch] text-center"
        >
          <h2 className="text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.025em] text-fg sm:text-[3rem]">
            Hiring for CyberSecurity or AI?
          </h2>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-fg-muted">
            I am in {profile.location} and looking for co-op and full-time work. I reply the same
            day.
          </p>
          <a
            href={`mailto:${profile.email}`}
            className="mt-8 inline-flex items-center gap-2 whitespace-nowrap btn-shape bg-accent px-7 py-3.5 text-[15px] font-medium text-accent-fg transition-transform active:translate-y-px"
          >
            <EnvelopeSimple size={17} weight="bold" aria-hidden="true" />
            Get in touch
          </a>
        </motion.div>

        {/* One observer on the list rather than one per item: with a
            separate observer each, a fast scroll can leave an item behind. */}
        <motion.ul
          initial={reduce ? false : "hidden"}
          whileInView="shown"
          viewport={{ once: true, amount: 0.1, margin: "0px 0px 20% 0px" }}
          variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.06 } } }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-3"
        >
          {channels.map((c) => (
            <motion.li
              key={c.label}
              variants={{
                hidden: { opacity: 0, y: 14 },
                shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
              }}
              className={`lift bg-bg-elevated ${c.span}`}
            >
              <a
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                className="group flex h-full flex-col gap-1 p-5 transition-colors hover:bg-bg-subtle"
              >
                <span className="flex items-center gap-1 font-mono text-[11.5px] text-fg-subtle">
                  {c.label}
                  {c.external && (
                    <ArrowUpRight
                      size={11}
                      weight="bold"
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-px group-hover:-translate-y-px"
                    />
                  )}
                </span>
                <span className="break-all text-[13.5px] text-fg-muted transition-colors group-hover:text-accent">
                  {c.value}
                </span>
              </a>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
