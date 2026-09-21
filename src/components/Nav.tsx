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

  /**
   * Menu links close the menu first and then scroll. Letting the browser jump
   * to the anchor while the menu is closing is unreliable on Android Chrome:
   * the hash changes but the page never moves.
   */
  const goTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);
    requestAnimationFrame(() => {
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      history.pushState(null, "", href);
      // Move focus with the view so keyboard and screen reader users land in
      // the section they chose rather than back at the top of the page.
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  };

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
          scrolled || open
            ? "border-b border-line bg-bg/90 backdrop-blur-xl"
            : "border-b border-transparent"
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
              // Opacity and transform only. Animating height to "auto" left
              // the panel 1px tall on iPhone Safari, and the overflow clipping
              // it needed cut off the theme picker.
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="border-b border-line bg-bg md:hidden"
            >
              <ul className="px-5 pb-4 sm:px-8">
                {links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      onClick={(e) => goTo(e, l.href)}
                      className="block border-b border-line py-3 text-[15px] text-fg-muted"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
                <li className="pt-4 sm:hidden">
                  <SeasonPicker variant="sheet" />
                </li>
                <li>
                  <a
                    href="#contact"
                    onClick={(e) => goTo(e, "#contact")}
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

      {/* Dims the page under the open phone menu; tapping it closes the menu.
          Sits below the header's z-index so the menu itself stays on top. */}
      <AnimatePresence>
        {open && (
          <motion.div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
