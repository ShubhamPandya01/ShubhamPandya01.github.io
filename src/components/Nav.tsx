import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { List, X, Sun, Moon } from "@phosphor-icons/react";
import { useSeasonalTheme } from "../theme/context";
import SeasonPicker from "./SeasonPicker";

const links = [
  { href: "#work", label: "Work" },
  { href: "#experience", label: "Experience" },
  { href: "#skills", label: "Skills" },
  { href: "#background", label: "Background" },
];

export default function Nav() {
  const { mode, toggleMode } = useSeasonalTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const reduce = useReducedMotion();

  // IntersectionObserver rather than a scroll listener: no work every frame.
  useEffect(() => {
    const sentinel = document.getElementById("top-sentinel");
    if (!sentinel) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(`#${e.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    for (const l of links) {
      const el = document.getElementById(l.href.slice(1));
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <a
        href="#main"
        className="btn-shape sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-fg"
      >
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled ? "border-b border-line bg-bg/90 backdrop-blur-xl" : "border-b border-transparent"
        }`}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between gap-4 px-[max(1.25rem,env(safe-area-inset-left))] sm:px-[max(2rem,env(safe-area-inset-left))]"
        >
          <a href="#top" className="group flex items-baseline gap-2 whitespace-nowrap py-1.5">
            <span className="text-[15px] font-semibold tracking-tight text-fg">Shubham Pandya</span>
            <span className="hidden font-mono text-[12px] text-fg-subtle lg:inline">
              cybersecurity + AI
            </span>
          </a>

          <div className="flex items-center gap-1.5">
            <ul className="hidden items-center gap-1 md:flex">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    aria-current={active === l.href ? "true" : undefined}
                    className={`relative rounded-[4px] px-3 py-2 text-[14px] transition-colors ${
                      active === l.href ? "text-fg" : "text-fg-muted hover:text-fg"
                    }`}
                  >
                    {l.label}
                    {active === l.href && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-3 -bottom-px h-px bg-accent"
                        transition={
                          reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }
                        }
                      />
                    )}
                  </a>
                </li>
              ))}
            </ul>

            <div className="hidden sm:block">
              <SeasonPicker />
            </div>

            <button
              onClick={toggleMode}
              aria-label={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="btn-shape border border-line p-2 text-fg-muted transition-colors hover:border-accent/50 hover:text-fg"
            >
              {mode === "dark" ? <Sun size={17} weight="bold" /> : <Moon size={17} weight="bold" />}
            </button>

            <button
              className="btn-shape border border-line p-2 text-fg md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-nav"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-b border-line bg-bg md:hidden"
            >
              <ul className="px-5 pb-4 sm:px-8">
                {links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block border-b border-line py-3 text-[15px] text-fg-muted"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
                <li className="pt-4 sm:hidden">
                  <SeasonPicker />
                </li>
                <li>
                  <a
                    href="#contact"
                    onClick={() => setOpen(false)}
                    className="btn-shape mt-3 block bg-accent px-4 py-2.5 text-center text-[15px] font-medium text-accent-fg"
                  >
                    Get in touch
                  </a>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
