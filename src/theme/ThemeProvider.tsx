import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { daypartOf, greetingFor } from "./calendar";
import { ALL_PALETTES, radiusFor, resolvePalette, type Palette } from "./palettes";
import { ThemeContext, type Mode, type ThemeValue } from "./context";

function readMode(): Mode {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Writes the active palette into CSS custom properties on <html>. */
function applyPalette(p: Palette, mode: Mode) {
  const root = document.documentElement;
  const accent = mode === "dark" ? p.accentDark : p.accentLight;
  const accentFg = mode === "dark" ? p.accentFgDark : p.accentFgLight;
  const second = mode === "dark" ? p.secondDark : p.secondLight;

  root.style.setProperty("--color-accent", accent);
  root.style.setProperty("--color-accent-fg", accentFg);
  root.style.setProperty("--color-second", second);
  root.style.setProperty("--color-accent-subtle", `color-mix(in srgb, ${accent} 12%, transparent)`);
  root.style.setProperty("--color-accent-faint", `color-mix(in srgb, ${accent} 6%, transparent)`);
  root.style.setProperty("--btn-radius", radiusFor(p.shape));
  root.dataset.palette = p.id;
  root.dataset.shape = p.shape;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => new Date());
  const [mode, setMode] = useState<Mode>(readMode);
  const [override, setOverrideState] = useState<string | null>(() => {
    try {
      return localStorage.getItem("palette-override");
    } catch {
      return null;
    }
  });

  // Re-read the clock every minute so the palette rolls over on its own at
  // midnight, and at the start and end of a festival window.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const resolved = useMemo(() => resolvePalette(now), [now]);

  const palette = useMemo(() => {
    if (!override) return resolved.palette;
    return ALL_PALETTES.find((p) => p.id === override) ?? resolved.palette;
  }, [override, resolved.palette]);

  useEffect(() => {
    applyPalette(palette, mode);
  }, [palette, mode]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.style.colorScheme = mode;
    try {
      localStorage.setItem("theme", mode);
    } catch {
      /* storage blocked: the class on <html> still holds for this session */
    }
  }, [mode]);

  const setOverride = useCallback((id: string | null) => {
    setOverrideState(id);
    try {
      if (id) localStorage.setItem("palette-override", id);
      else localStorage.removeItem("palette-override");
    } catch {
      /* storage blocked: the override still applies in memory */
    }
  }, []);

  const toggleMode = useCallback(() => setMode((m) => (m === "dark" ? "light" : "dark")), []);

  const daypart = daypartOf(now);

  const value: ThemeValue = {
    palette,
    season: resolved.season,
    isFestival: override ? palette.kind === "festival" : resolved.isFestival,
    daypart,
    greeting: greetingFor(daypart),
    now,
    mode,
    toggleMode,
    override,
    setOverride,
    palettes: ALL_PALETTES,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

