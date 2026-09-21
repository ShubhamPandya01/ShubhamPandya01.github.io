import { useEffect, useRef } from "react";
import { useSeasonalTheme } from "../theme/context";
import type { ParticleKind } from "../theme/palettes";

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  colour: string;
  phase: number;
  sway: number;
};

/** How each kind behaves. Rising kinds start at the bottom and drift upward. */
const BEHAVIOUR: Record<
  ParticleKind,
  { rising: boolean; count: number; speed: number; size: [number, number]; spin: number }
> = {
  leaves: { rising: false, count: 26, speed: 0.55, size: [7, 14], spin: 0.02 },
  snow: { rising: false, count: 60, speed: 0.4, size: [1.5, 3.8], spin: 0 },
  petals: { rising: false, count: 30, speed: 0.4, size: [5, 10], spin: 0.015 },
  embers: { rising: true, count: 28, speed: 0.4, size: [1.5, 3.5], spin: 0 },
  confetti: { rising: false, count: 44, speed: 0.75, size: [4, 9], spin: 0.06 },
  sparks: { rising: true, count: 40, speed: 0.5, size: [1.5, 3.2], spin: 0 },
  stars: { rising: false, count: 50, speed: 0.04, size: [1, 2.4], spin: 0 },
  hearts: { rising: true, count: 22, speed: 0.35, size: [6, 12], spin: 0.01 },
  maple: { rising: false, count: 20, speed: 0.6, size: [8, 15], spin: 0.025 },
  bats: { rising: false, count: 14, speed: 0.7, size: [9, 16], spin: 0 },
  none: { rising: false, count: 0, speed: 0, size: [0, 0], spin: 0 },
};

function drawShape(
  ctx: CanvasRenderingContext2D,
  kind: ParticleKind,
  s: number,
  t: number
) {
  switch (kind) {
    case "leaves": {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.9, -s * 0.2, 0, s);
      ctx.quadraticCurveTo(-s * 0.9, -s * 0.2, 0, -s);
      ctx.fill();
      break;
    }
    case "maple": {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
        const r = i % 2 === 0 ? s : s * 0.42;
        ctx[i === 0 ? "moveTo" : "lineTo"](Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "petals": {
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "confetti": {
      ctx.fillRect(-s / 2, -s / 4, s, s / 2);
      break;
    }
    case "hearts": {
      const k = s / 10;
      ctx.beginPath();
      ctx.moveTo(0, 3 * k);
      ctx.bezierCurveTo(-6 * k, -2 * k, -3 * k, -8 * k, 0, -4 * k);
      ctx.bezierCurveTo(3 * k, -8 * k, 6 * k, -2 * k, 0, 3 * k);
      ctx.fill();
      break;
    }
    case "bats": {
      ctx.beginPath();
      const w = Math.sin(t * 5) * s * 0.25;
      ctx.moveTo(-s, w);
      ctx.quadraticCurveTo(-s * 0.4, -s * 0.5, 0, -s * 0.1);
      ctx.quadraticCurveTo(s * 0.4, -s * 0.5, s, w);
      ctx.quadraticCurveTo(s * 0.4, s * 0.25, 0, s * 0.18);
      ctx.quadraticCurveTo(-s * 0.4, s * 0.25, -s, w);
      ctx.fill();
      break;
    }
    case "sparks":
    case "embers": {
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Ambient particle layer keyed to the active palette. Fixed behind the page,
 * never interactive, and fully disabled under reduced motion or when the tab
 * is hidden so it costs nothing in the background.
 */
export default function SeasonalField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { palette, daypart } = useSeasonalTheme();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const kind = palette.particle;
    const spec = BEHAVIOUR[kind];
    const colours = palette.particleColors;
    if (kind === "none" || spec.count === 0 || colours.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Night gets a slightly denser field; daytime keeps it subtle.
    const density = daypart === "night" ? 1.15 : daypart === "day" ? 0.8 : 1;

    let raf = 0;
    let running = true;
    let particles: P[] = [];
    let w = 0;
    let h = 0;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    // The nav is transparent at the top of the page and carries small text,
    // so particles dissolve over the top band instead of drifting behind it.
    const NAV_CLEAR = 76;
    const FADE = 90;
    const navFade = (y: number) => Math.min(1, Math.max(0, (y - NAV_CLEAR) / FADE));

    const spawn = (initial: boolean): P => {
      const size = rand(spec.size[0], spec.size[1]);
      return {
        x: Math.random() * w,
        y: spec.rising
          ? initial
            ? Math.random() * h
            : h + size * 2
          : initial
            ? Math.random() * h
            : -size * 2,
        vx: rand(-0.25, 0.25),
        vy: spec.rising ? -rand(spec.speed * 0.5, spec.speed) : rand(spec.speed * 0.5, spec.speed),
        size,
        rot: Math.random() * Math.PI * 2,
        vr: rand(-spec.spin, spec.spin),
        colour: colours[Math.floor(Math.random() * colours.length)],
        phase: Math.random() * Math.PI * 2,
        sway: rand(0.3, 1.1),
      };
    };

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(
        Math.min(spec.count, Math.max(8, (w * h) / 26000)) * density
      );
      particles = Array.from({ length: target }, () => spawn(true));
    };

    let t = 0;
    const frame = () => {
      if (!running) return;
      t += 0.016;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx + Math.sin(t * p.sway + p.phase) * 0.35;
        p.y += p.vy;
        p.rot += p.vr;

        const out = spec.rising ? p.y < -p.size * 2 : p.y > h + p.size * 2;
        if (out || p.x < -60 || p.x > w + 60) {
          particles[i] = spawn(false);
          continue;
        }

        const twinkle =
          kind === "stars" || kind === "sparks" || kind === "embers"
            ? 0.35 + Math.abs(Math.sin(t * 1.6 + p.phase)) * 0.65
            : 1;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = 0.45 * twinkle * navFade(p.y);
        ctx.fillStyle = p.colour;
        if (kind === "sparks" || kind === "embers") {
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.colour;
        }
        drawShape(ctx, kind, p.size, t + p.phase);
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };

    resize();

    if (reduced) {
      // Draw a single still frame so the season still reads, then stop.
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = 0.3 * navFade(p.y);
        ctx.fillStyle = p.colour;
        drawShape(ctx, kind, p.size, 0);
        ctx.restore();
      }
    } else {
      raf = requestAnimationFrame(frame);
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced && !running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [palette, daypart]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      data-particles=""
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
