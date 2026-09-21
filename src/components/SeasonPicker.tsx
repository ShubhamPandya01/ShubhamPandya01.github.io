import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarBlank, Check } from "@phosphor-icons/react";
import { useSeasonalTheme } from "../theme/context";

/**
 * Shows the palette the calendar picked for today and lets a visitor preview
 * any of the others. Without this the seasonal work is invisible for most of
 * the year, which is the whole point of building it.
 */
export default function SeasonPicker() {
  const { palette, palettes, override, setOverride, isFestival, now } = useSeasonalTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const dateLabel = new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
  }).format(now);

  const seasons = palettes.filter((p) => p.kind === "season");
  const festivals = palettes.filter((p) => p.kind === "festival");

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="btn-shape group flex items-center gap-2 border border-line px-3 py-[7px] text-[13px] text-fg-muted transition-colors hover:border-accent/50 hover:text-fg"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          {isFestival && !reduce && (
            <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-accent" />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
        <span className="whitespace-nowrap font-medium text-fg">{palette.name}</span>
        <span className="hidden tnum font-mono text-[11px] text-fg-subtle sm:inline">
          {dateLabel}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Theme preview"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(92vw,340px)] origin-top-right rounded-[10px] border border-line bg-bg-elevated p-4 shadow-2xl shadow-black/20"
          >
            <p className="text-[13px] leading-relaxed text-fg-muted">
              The palette, button shape and background all follow the calendar. Today is{" "}
              <span className="font-medium text-fg">{palette.name}</span>. Preview another:
            </p>

            <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-fg-subtle">
              Seasons
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {seasons.map((p) => (
                <Swatch
                  key={p.id}
                  p={p}
                  active={palette.id === p.id}
                  onPick={() => setOverride(p.id)}
                />
              ))}
            </div>

            <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-fg-subtle">
              Festivals
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {festivals.map((p) => (
                <Swatch
                  key={p.id}
                  p={p}
                  active={palette.id === p.id}
                  onPick={() => setOverride(p.id)}
                />
              ))}
            </div>

            {override && (
              <button
                onClick={() => setOverride(null)}
                className="btn-shape mt-4 flex w-full items-center justify-center gap-2 bg-accent px-3 py-2 text-[13px] font-medium text-accent-fg"
              >
                <CalendarBlank size={14} weight="bold" />
                Back to today
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Swatch({
  p,
  active,
  onPick,
}: {
  p: { id: string; name: string; accentDark: string; secondDark: string };
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      onClick={onPick}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-[6px] border px-2 py-1.5 text-left text-[12.5px] transition-colors ${
        active
          ? "border-accent bg-accent-subtle text-fg"
          : "border-line text-fg-muted hover:border-line-strong hover:text-fg"
      }`}
    >
      <span
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0 rounded-full"
        style={{ background: `linear-gradient(135deg, ${p.accentDark}, ${p.secondDark})` }}
      />
      <span className="truncate">{p.name}</span>
      {active && <Check size={12} weight="bold" className="ml-auto shrink-0 text-accent" />}
    </button>
  );
}
