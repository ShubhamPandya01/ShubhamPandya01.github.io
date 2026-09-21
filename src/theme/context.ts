import { createContext, useContext } from "react";
import type { Daypart, Season } from "./calendar";
import type { Palette } from "./palettes";

export type Mode = "light" | "dark";

export type ThemeValue = {
  palette: Palette;
  season: Season;
  /** True when a festival is overriding the plain season palette. */
  isFestival: boolean;
  daypart: Daypart;
  greeting: string;
  now: Date;
  mode: Mode;
  toggleMode: () => void;
  /** null means "follow the calendar". Set to preview another palette. */
  override: string | null;
  setOverride: (id: string | null) => void;
  palettes: Palette[];
};

/** Lives apart from the provider so the component file only exports components. */
export const ThemeContext = createContext<ThemeValue | null>(null);

export function useSeasonalTheme(): ThemeValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error("useSeasonalTheme must be used inside ThemeProvider");
  return v;
}
