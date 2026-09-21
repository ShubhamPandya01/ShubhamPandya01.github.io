import { IconContext } from "@phosphor-icons/react";
import { useEffect } from "react";
import { ThemeProvider } from "./theme/ThemeProvider";
import SeasonalField from "./components/SeasonalField";
import { ScrollProgress } from "./components/primitives";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Metrics from "./components/Metrics";
import Capabilities from "./components/Capabilities";
import Projects from "./components/Projects";
import Experience from "./components/Experience";
import Skills from "./components/Skills";
import Background from "./components/Background";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

/**
 * Every icon sits beside its own text or inside a labelled button, so all of
 * them are decorative. Setting it once keeps them out of the accessibility
 * tree without repeating the attribute at each call site.
 */
const iconDefaults = { "aria-hidden": true, weight: "regular" as const };

/** Keeps the browser UI colour in step with the active theme. */
function useThemeColorMeta() {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) return;
    const sync = () => {
      const bg = getComputedStyle(document.body).backgroundColor;
      if (bg) meta.setAttribute("content", bg);
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-palette"],
    });
    return () => mo.disconnect();
  }, []);
}

function Shell() {
  useThemeColorMeta();

  return (
    <>
      <SeasonalField />
      <ScrollProgress />
      {/* Watched by the nav's IntersectionObserver to decide when to show its border. */}
      <div id="top-sentinel" aria-hidden="true" className="absolute top-0 h-px w-full" />
      <Nav />
      <div className="relative z-10">
        <main id="main">
          <Hero />
          <Metrics />
          <Capabilities />
          <Projects />
          <Experience />
          <Skills />
          <Background />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <IconContext.Provider value={iconDefaults}>
        <Shell />
      </IconContext.Provider>
    </ThemeProvider>
  );
}
