import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarBlank, Check, X } from "@phosphor-icons/react";
import { useSeasonalTheme } from "../theme/context";
import type { Palette } from "../theme/palettes";

/**
 * Shows the palette the calendar picked for today and lets a visitor preview
 * any of the others. Without this the seasonal work is invisible for most of
 * the year, which is the whole point of building it.
 *
 * `dropdown` anchors under the button (desktop nav). `sheet` slides up from the
 * bottom of the screen (phone menu): the list is taller than the space under
 * the button on a phone, and a dropdown inside the fixed header can neither
 * scroll nor escape it, so it was being cropped.
 */
export default function SeasonPicker({ variant = "dropdown" }: { variant?: "dropdown" | "sheet" }) {
  const { palette, palettes, override, setOverride, isFestival, now } = useSeasonalTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Dropdown only: close on a press outside it. The sheet has its own backdrop.
  useEffect(() => {
    if (!open || variant !== "dropdown") return;
    const onPress = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPress);
    return () => window.removeEventListener("pointerdown", onPress);
  }, [open, variant]);

  // Sheet only: hold the page still behind it, move focus in, and hand focus
  // back to the trigger when it closes.
  useEffect(() => {
    if (!open || variant !== "sheet") return;
    const trigger = triggerRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      trigger?.focus();
    };
  }, [open, variant]);

  const dateLabel = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric" }).format(now);

  const trigger = (
    <button
      ref={triggerRef}
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
      <span className="tnum font-mono text-[11px] text-fg-subtle">{dateLabel}</span>
    </button>
  );

  const content = (
    <PickerContent
      palette={palette}
      palettes={palettes}
      override={override}
      setOverride={setOverride}
    />
  );

  if (variant === "sheet") {
    return (
      <div ref={wrapRef}>
        {trigger}
        {createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  key="backdrop"
                  aria-hidden="true"
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[80] bg-black/55"
                />
                <motion.div
                  key="sheet"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Theme preview"
                  initial={reduce ? { opacity: 0 } : { y: "100%" }}
                  animate={reduce ? { opacity: 1 } : { y: 0 }}
                  exit={reduce ? { opacity: 0 } : { y: "100%" }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-x-0 bottom-0 z-[81] max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-[16px] border-t border-line bg-bg-elevated px-5 pt-3 shadow-2xl"
                  style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
                >
                  <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[15px] font-semibold text-fg">Theme</p>
                    <button
                      ref={closeRef}
                      onClick={() => setOpen(false)}
                      aria-label="Close theme preview"
                      className="btn-shape border border-line p-2 text-fg-muted"
                    >
                      <X size={16} weight="bold" />
                    </button>
                  </div>
                  {content}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Theme preview"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-[calc(100%+10px)] z-50 max-h-[calc(100dvh-90px)] w-[min(92vw,340px)] origin-top-right overflow-y-auto overscroll-contain rounded-[10px] border border-line bg-bg-elevated p-4 shadow-2xl shadow-black/20"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PickerContent({
  palette,
  palettes,
  override,
  setOverride,
}: {
  palette: Palette;
  palettes: Palette[];
  override: string | null;
  setOverride: (id: string | null) => void;
}) {
  const seasons = palettes.filter((p) => p.kind === "season");
  const festivals = palettes.filter((p) => p.kind === "festival");
  return (
    <>
      <p className="text-[13px] leading-relaxed text-fg-muted">
        The palette, button shape and background all follow the calendar. Today is{" "}
        <span className="font-medium text-fg">{palette.name}</span>. Preview another:
      </p>

      <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-fg-subtle">Seasons</p>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {seasons.map((p) => (
          <Swatch key={p.id} p={p} active={palette.id === p.id} onPick={() => setOverride(p.id)} />
        ))}
      </div>

      <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-fg-subtle">Festivals</p>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {festivals.map((p) => (
          <Swatch key={p.id} p={p} active={palette.id === p.id} onPick={() => setOverride(p.id)} />
        ))}
      </div>

      {override && (
        <button
          onClick={() => setOverride(null)}
          className="btn-shape mt-4 flex w-full items-center justify-center gap-2 bg-accent px-3 py-2.5 text-[13px] font-medium text-accent-fg"
        >
          <CalendarBlank size={14} weight="bold" />
          Back to today
        </button>
      )}
    </>
  );
}

function Swatch({ p, active, onPick }: { p: Palette; active: boolean; onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      aria-pressed={active}
      className={`flex min-h-[40px] items-center gap-2 rounded-[6px] border px-2 py-1.5 text-left text-[12.5px] transition-colors ${
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
