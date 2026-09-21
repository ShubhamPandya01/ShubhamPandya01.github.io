import { useCallback, useEffect, useState } from "react";

/**
 * Mirrors a piece of UI state in a query parameter so filters and tabs are
 * shareable and survive back/forward navigation. Falls back to plain local
 * state if the History API is unavailable.
 */
export function useUrlState<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T
) {
  const read = useCallback((): T => {
    try {
      const v = new URLSearchParams(window.location.search).get(key);
      return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
    } catch {
      return fallback;
    }
  }, [key, allowed, fallback]);

  const [value, setValue] = useState<T>(read);

  // Keep in step with back/forward.
  useEffect(() => {
    const onPop = () => setValue(read());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [read]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        const url = new URL(window.location.href);
        if (next === fallback) url.searchParams.delete(key);
        else url.searchParams.set(key, next);
        // replaceState: filtering is not a navigation step worth a history entry.
        window.history.replaceState(null, "", url);
      } catch {
        /* history unavailable: state still updates in memory */
      }
    },
    [key, fallback]
  );

  return [value, set] as const;
}
