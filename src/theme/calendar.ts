/**
 * Date maths for the seasonal theme engine. Everything here is pure so the
 * palette for any given moment can be tested without a browser.
 */

/** Anonymous Gregorian algorithm. Returns Easter Sunday for a given year. */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** The nth given weekday of a month, e.g. the 2nd Monday of October. */
export function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1);
  const shift = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + shift + (n - 1) * 7);
}

/**
 * Lunisolar festivals cannot be derived from the Gregorian calendar, so they
 * are tabulated. Outside this range the engine falls back to the season, which
 * is the correct behaviour rather than a wrong guess.
 */
export const LUNAR_TABLE: Record<string, Record<number, [number, number]>> = {
  // [month (0-indexed), day]
  diwali: {
    2025: [9, 20],
    2026: [10, 8],
    2027: [9, 29],
    2028: [9, 17],
    2029: [10, 5],
    2030: [9, 26],
  },
  holi: {
    2025: [2, 14],
    2026: [2, 3],
    2027: [2, 22],
    2028: [2, 11],
    2029: [2, 1],
    2030: [2, 19],
  },
  lunarNewYear: {
    2025: [0, 29],
    2026: [1, 17],
    2027: [1, 6],
    2028: [0, 26],
    2029: [1, 13],
    2030: [1, 3],
  },
};

export function tabulated(key: keyof typeof LUNAR_TABLE, year: number): Date | null {
  const entry = LUNAR_TABLE[key]?.[year];
  return entry ? new Date(year, entry[0], entry[1]) : null;
}

/** Whole days from `a` to `b`, ignoring clock time. */
export function daysBetween(a: Date, b: Date): number {
  const d1 = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const d2 = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((d2 - d1) / 86400000);
}

export function within(date: Date, target: Date | null, before: number, after: number): boolean {
  if (!target) return false;
  const delta = daysBetween(target, date);
  return delta >= -before && delta <= after;
}

/** Inclusive month/day range, handling ranges that wrap the new year. */
export function inRange(
  date: Date,
  [m1, d1]: [number, number],
  [m2, d2]: [number, number]
): boolean {
  const v = (date.getMonth() + 1) * 100 + date.getDate();
  const a = (m1 + 1) * 100 + d1;
  const b = (m2 + 1) * 100 + d2;
  return a <= b ? v >= a && v <= b : v >= a || v <= b;
}

export type Season = "spring" | "summer" | "autumn" | "winter";

/**
 * Meteorological seasons, not astronomical. They start on the first of the
 * month, which is how people actually describe the time of year: the 20th of
 * September reads as autumn, not as the tail of summer.
 */
export function seasonOf(date: Date): Season {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

export type Daypart = "dawn" | "day" | "dusk" | "night";

export function daypartOf(date: Date): Daypart {
  const h = date.getHours();
  if (h >= 5 && h < 9) return "dawn";
  if (h >= 9 && h < 17) return "day";
  if (h >= 17 && h < 21) return "dusk";
  return "night";
}

export function greetingFor(part: Daypart): string {
  switch (part) {
    case "dawn":
      return "Good morning";
    case "day":
      return "Good afternoon";
    case "dusk":
      return "Good evening";
    default:
      return "Working late";
  }
}
