import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import Section from "./Section";
import { useUrlState } from "../hooks/useUrlState";
import { skillDomains } from "../data/content";

const domainIds = skillDomains.map((d) => d.id) as [string, ...string[]];

/**
 * Tabs rather than one long list: there are ~70 entries here and a flat list of
 * that length is unreadable. Implements the APG tab pattern, including arrow
 * key navigation and a roving tabindex.
 */
export default function Skills() {
  const [activeId, setActiveId] = useUrlState("skills", domainIds, domainIds[0]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduce = useReducedMotion();
  const active = Math.max(
    0,
    skillDomains.findIndex((d) => d.id === activeId)
  );
  const domain = skillDomains[active];

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = skillDomains.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = active === last ? 0 : active + 1;
    if (e.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    setActiveId(skillDomains[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <Section
      id="skills"
      title="What I"
      accent="reach for"
      glow="right"
      lede="Grouped by the problem it solves rather than by how impressive the list looks."
    >
      <div
        role="tablist"
        aria-label="Skill areas"
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-1 border-b border-line"
      >
        {skillDomains.map((d, i) => (
          <button
            key={d.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            id={`tab-${d.id}`}
            aria-selected={active === i}
            aria-controls={`panel-${d.id}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActiveId(d.id)}
            className={`relative -mb-px px-4 py-3 text-[14.5px] transition-colors ${
              active === i ? "text-fg" : "text-fg-muted hover:text-fg"
            }`}
          >
            {d.label}
            {active === i && (
              <motion.span
                layoutId="skills-tab"
                className="absolute inset-x-0 -bottom-px h-[2px] bg-accent"
                transition={
                  reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }
                }
              />
            )}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${domain.id}`}
        aria-labelledby={`tab-${domain.id}`}
        tabIndex={0}
        className="rounded-[4px] pt-8"
      >
        <motion.div
          key={domain.id}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="max-w-[56ch] text-[15px] leading-relaxed text-fg-muted">{domain.summary}</p>

          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {domain.groups.map((g) => (
              <div key={g.heading}>
                <h3 className="font-mono text-[12px] text-fg-subtle">{g.heading}</h3>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {g.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-[4px] border border-line bg-bg-elevated px-2.5 py-1 text-[13px] text-fg-muted"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
