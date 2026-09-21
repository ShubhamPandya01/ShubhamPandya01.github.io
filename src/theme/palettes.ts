import {
  easterSunday,
  inRange,
  nthWeekday,
  seasonOf,
  tabulated,
  within,
  type Season,
} from "./calendar";

export type ButtonShape = "sharp" | "soft" | "pill" | "cut";
export type ParticleKind =
  | "leaves"
  | "snow"
  | "petals"
  | "embers"
  | "confetti"
  | "sparks"
  | "stars"
  | "hearts"
  | "maple"
  | "bats"
  | "none";

export type Palette = {
  id: string;
  name: string;
  kind: "season" | "festival";
  /** One short line shown next to the theme badge. */
  blurb: string;
  /** Accent used on the light background. Must clear AA against #fafaf9. */
  accentLight: string;
  /** Accent used on the dark background. Must clear AA against #0c0a09. */
  accentDark: string;
  /** Label colour sitting on top of the accent. */
  accentFgLight: string;
  accentFgDark: string;
  /** Second hue, used only for gradients and glows, never for text. */
  secondLight: string;
  secondDark: string;
  shape: ButtonShape;
  particle: ParticleKind;
  particleColors: string[];
};

const RADIUS: Record<ButtonShape, string> = {
  sharp: "2px",
  soft: "10px",
  pill: "999px",
  cut: "4px",
};

export function radiusFor(shape: ButtonShape): string {
  return RADIUS[shape];
}

export const SEASONS: Record<Season, Palette> = {
  spring: {
    id: "spring",
    name: "Spring",
    kind: "season",
    blurb: "New growth, long light",
    accentLight: "#15803d",
    accentDark: "#4ade80",
    accentFgLight: "#ffffff",
    accentFgDark: "#052e16",
    secondLight: "#db2777",
    secondDark: "#f9a8d4",
    shape: "pill",
    particle: "petals",
    particleColors: ["#f9a8d4", "#fbcfe8", "#86efac", "#fde68a"],
  },
  summer: {
    id: "summer",
    name: "Summer",
    kind: "season",
    blurb: "High sun, open water",
    accentLight: "#0369a1",
    accentDark: "#38bdf8",
    accentFgLight: "#ffffff",
    accentFgDark: "#082f49",
    secondLight: "#ca8a04",
    secondDark: "#fbbf24",
    shape: "soft",
    particle: "embers",
    particleColors: ["#38bdf8", "#fbbf24", "#a5f3fc", "#fcd34d"],
  },
  autumn: {
    id: "autumn",
    name: "Autumn",
    kind: "season",
    blurb: "Turning leaves, early dark",
    accentLight: "#b23c06",
    accentDark: "#fb923c",
    accentFgLight: "#ffffff",
    accentFgDark: "#2a1206",
    secondLight: "#a16207",
    secondDark: "#fbbf24",
    shape: "cut",
    particle: "leaves",
    particleColors: ["#fb923c", "#f59e0b", "#b45309", "#dc2626", "#a16207"],
  },
  winter: {
    id: "winter",
    name: "Winter",
    kind: "season",
    blurb: "Cold light, long nights",
    accentLight: "#1d4ed8",
    accentDark: "#93c5fd",
    accentFgLight: "#ffffff",
    accentFgDark: "#0b1a33",
    secondLight: "#6d28d9",
    secondDark: "#c4b5fd",
    shape: "sharp",
    particle: "snow",
    particleColors: ["#e0f2fe", "#bfdbfe", "#ffffff", "#c4b5fd"],
  },
};

export const FESTIVALS: Palette[] = [
  {
    id: "newyear",
    name: "New Year",
    kind: "festival",
    blurb: "Fresh start",
    accentLight: "#8a6d0b",
    accentDark: "#fcd34d",
    accentFgLight: "#ffffff",
    accentFgDark: "#2a2005",
    secondLight: "#be185d",
    secondDark: "#f472b6",
    shape: "pill",
    particle: "confetti",
    particleColors: ["#fcd34d", "#f472b6", "#60a5fa", "#4ade80", "#ffffff"],
  },
  {
    id: "lunar",
    name: "Lunar New Year",
    kind: "festival",
    blurb: "Red envelopes and lanterns",
    accentLight: "#b91c1c",
    accentDark: "#fca5a5",
    accentFgLight: "#ffffff",
    accentFgDark: "#2c0707",
    secondLight: "#a16207",
    secondDark: "#fcd34d",
    shape: "pill",
    particle: "sparks",
    particleColors: ["#fca5a5", "#fcd34d", "#f87171"],
  },
  {
    id: "valentines",
    name: "Valentine's Day",
    kind: "festival",
    blurb: "Warm regards",
    accentLight: "#be123c",
    accentDark: "#fda4af",
    accentFgLight: "#ffffff",
    accentFgDark: "#2c0713",
    secondLight: "#9d174d",
    secondDark: "#f9a8d4",
    shape: "pill",
    particle: "hearts",
    particleColors: ["#fda4af", "#f9a8d4", "#fb7185"],
  },
  {
    id: "holi",
    name: "Holi",
    kind: "festival",
    blurb: "Festival of colours",
    accentLight: "#a21caf",
    accentDark: "#f0abfc",
    accentFgLight: "#ffffff",
    accentFgDark: "#2e0733",
    secondLight: "#0f766e",
    secondDark: "#5eead4",
    shape: "pill",
    particle: "confetti",
    particleColors: ["#f0abfc", "#5eead4", "#fcd34d", "#fda4af", "#93c5fd", "#86efac"],
  },
  {
    id: "easter",
    name: "Easter",
    kind: "festival",
    blurb: "Pastels and new light",
    accentLight: "#6d28d9",
    accentDark: "#c4b5fd",
    accentFgLight: "#ffffff",
    accentFgDark: "#1e1235",
    secondLight: "#ca8a04",
    secondDark: "#fde68a",
    shape: "soft",
    particle: "petals",
    particleColors: ["#c4b5fd", "#fde68a", "#a7f3d0", "#fbcfe8"],
  },
  {
    id: "canada",
    name: "Canada Day",
    kind: "festival",
    blurb: "Red and white",
    accentLight: "#b91c1c",
    accentDark: "#fca5a5",
    accentFgLight: "#ffffff",
    accentFgDark: "#2c0707",
    secondLight: "#57534e",
    secondDark: "#e7e5e4",
    shape: "sharp",
    particle: "maple",
    particleColors: ["#fca5a5", "#f87171", "#ffffff"],
  },
  {
    id: "halloween",
    name: "Halloween",
    kind: "festival",
    blurb: "After dark",
    accentLight: "#9a3412",
    accentDark: "#fb923c",
    accentFgLight: "#ffffff",
    accentFgDark: "#1c0a02",
    secondLight: "#6b21a8",
    secondDark: "#c084fc",
    shape: "cut",
    particle: "bats",
    particleColors: ["#fb923c", "#c084fc", "#a3a3a3"],
  },
  {
    id: "thanksgiving",
    name: "Thanksgiving",
    kind: "festival",
    blurb: "Harvest table",
    accentLight: "#92400e",
    accentDark: "#fcd34d",
    accentFgLight: "#ffffff",
    accentFgDark: "#2a1a05",
    secondLight: "#b45309",
    secondDark: "#fdba74",
    shape: "soft",
    particle: "leaves",
    particleColors: ["#fcd34d", "#fdba74", "#b45309"],
  },
  {
    id: "remembrance",
    name: "Remembrance Day",
    kind: "festival",
    blurb: "Lest we forget",
    accentLight: "#991b1b",
    accentDark: "#f87171",
    accentFgLight: "#ffffff",
    accentFgDark: "#2c0707",
    secondLight: "#44403c",
    secondDark: "#a8a29e",
    shape: "sharp",
    particle: "none",
    particleColors: [],
  },
  {
    id: "diwali",
    name: "Diwali",
    kind: "festival",
    blurb: "Festival of lights",
    accentLight: "#a16207",
    accentDark: "#fbbf24",
    accentFgLight: "#ffffff",
    accentFgDark: "#2a1d03",
    secondLight: "#be123c",
    secondDark: "#fb7185",
    shape: "pill",
    particle: "sparks",
    particleColors: ["#fbbf24", "#fb7185", "#fcd34d", "#fdba74"],
  },
  {
    id: "christmas",
    name: "Christmas",
    kind: "festival",
    blurb: "Evergreen and candlelight",
    accentLight: "#15803d",
    accentDark: "#6ee7b7",
    accentFgLight: "#ffffff",
    accentFgDark: "#052e16",
    secondLight: "#b91c1c",
    secondDark: "#fca5a5",
    shape: "soft",
    particle: "snow",
    particleColors: ["#ffffff", "#a7f3d0", "#fca5a5", "#e0f2fe"],
  },
];

const byId = (id: string) => FESTIVALS.find((f) => f.id === id)!;

export const ALL_PALETTES: Palette[] = [...Object.values(SEASONS), ...FESTIVALS];

export type Resolved = {
  palette: Palette;
  season: Season;
  /** True when a festival is overriding the plain season palette. */
  isFestival: boolean;
};

/**
 * Picks the palette for a moment. Festivals win over seasons, and narrower
 * windows win over wider ones, so Christmas beats winter and Diwali beats
 * autumn. Dates outside the lunisolar table simply fall through to the season.
 */
export function resolvePalette(date: Date): Resolved {
  const season = seasonOf(date);
  const y = date.getFullYear();

  // Ordered most specific first.
  const candidates: Array<[boolean, string]> = [
    [inRange(date, [11, 30], [0, 2]), "newyear"],
    [within(date, tabulated("lunarNewYear", y), 1, 2), "lunar"],
    [inRange(date, [1, 13], [1, 14]), "valentines"],
    [within(date, tabulated("holi", y), 1, 1), "holi"],
    [within(date, easterSunday(y), 2, 1), "easter"],
    [inRange(date, [6, 1], [6, 1]), "canada"],
    [inRange(date, [9, 26], [9, 31]), "halloween"],
    [within(date, nthWeekday(y, 9, 1, 2), 2, 1), "thanksgiving"],
    [inRange(date, [10, 11], [10, 11]), "remembrance"],
    [within(date, tabulated("diwali", y), 2, 2), "diwali"],
    [inRange(date, [11, 10], [11, 26]), "christmas"],
  ];

  for (const [active, id] of candidates) {
    if (active) return { palette: byId(id), season, isFestival: true };
  }
  return { palette: SEASONS[season], season, isFestival: false };
}
