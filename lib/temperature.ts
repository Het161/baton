/**
 * The temperature shift.
 *
 * One scrubbed value (0 = obsidian/warm, 1 = porcelain/cool) drives every
 * surface token on :root, so the dark→light move is a single continuous
 * interpolation rather than a set of per-section swaps.
 *
 * The interpolation is precomputed into a 61-step lookup table at module load.
 * At scroll time we snap to the nearest step and bail out entirely when the
 * step has not changed — which is most frames.
 */

type Stop = {
  pageBg: [number, number, number];
  fg: [number, number, number];
  fgDimA: number;
  lineA: number;
  surface: [number, number, number];
  surfaceA: number;
  accent: [number, number, number];
  grain: number;
};

const WARM: Stop = {
  pageBg: [11, 10, 10], // --obsidian
  fg: [237, 233, 225], // --bone
  fgDimA: 0.6,
  lineA: 0.13,
  surface: [23, 20, 18], // --graphite
  surfaceA: 0.6,
  accent: [255, 90, 31], // --ember
  grain: 1,
};

const COOL: Stop = {
  pageBg: [244, 243, 239], // --porcelain
  fg: [20, 22, 26], // --ink
  fgDimA: 0.62,
  lineA: 0.14,
  surface: [255, 255, 255],
  surfaceA: 0.72,
  accent: [51, 96, 122], // --ice-deep, AA-safe on porcelain
  grain: 0,
};

const STEPS = 61;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: [number, number, number], b: [number, number, number], t: number) =>
  `${Math.round(lerp(a[0], b[0], t))} ${Math.round(lerp(a[1], b[1], t))} ${Math.round(lerp(a[2], b[2], t))}`;

/**
 * Surfaces ease across; ink does not.
 *
 * If foreground and background both interpolate linearly they meet in the
 * middle as the same mid-grey and the copy briefly disappears. So the
 * background eases (smoothstep is fastest exactly through the midpoint, which
 * shortens the ambiguous window) while text, rules and the accent cut over in
 * one step as the background passes 50% lightness. During a scrubbed scroll
 * the cut is imperceptible; the contrast never is.
 */
const surfaceCurve = (t: number) => t * t * (3 - 2 * t);
const inkCurve = (t: number) => (t < 0.52 ? 0 : 1);

const LUT: Array<Array<[string, string]>> = Array.from({ length: STEPS }, (_, i) => {
  const t = i / (STEPS - 1);
  const s = surfaceCurve(t);
  const k = inkCurve(t);
  return [
    ["--page-bg", mix3(WARM.pageBg, COOL.pageBg, s)],
    ["--fg", mix3(WARM.fg, COOL.fg, k)],
    ["--fg-dim", mix3(WARM.fg, COOL.fg, k)],
    ["--fg-dim-a", lerp(WARM.fgDimA, COOL.fgDimA, k).toFixed(3)],
    ["--line", mix3(WARM.fg, COOL.fg, k)],
    ["--line-a", lerp(WARM.lineA, COOL.lineA, k).toFixed(3)],
    ["--surface", mix3(WARM.surface, COOL.surface, s)],
    ["--surface-a", lerp(WARM.surfaceA, COOL.surfaceA, s).toFixed(3)],
    ["--accent", mix3(WARM.accent, COOL.accent, k)],
    ["--scrollbar", mix3(WARM.accent, COOL.accent, k)],
    ["--grain-opacity", lerp(WARM.grain, COOL.grain, s).toFixed(3)],
  ];
});

let lastStep = -1;

export function applyTemperature(t: number) {
  if (typeof document === "undefined") return;
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  const step = Math.round(clamped * (STEPS - 1));
  if (step === lastStep) return;
  lastStep = step;

  const root = document.documentElement;
  for (const [prop, value] of LUT[step]) root.style.setProperty(prop, value);
  // keeps native form controls / scrollbars in the right register
  root.style.colorScheme = clamped >= 0.52 ? "light" : "dark";
}

/** Force a stop without animating — used by /desk and the reduced-motion path. */
export function setZone(zone: "warm" | "cool") {
  lastStep = -1;
  applyTemperature(zone === "cool" ? 1 : 0);
}

/** RGB triples the WebGL scene needs for its own temperature mixes. */
export const PARTICLE_WARM = [1.0, 0.353, 0.122] as const; // ember
export const PARTICLE_COOL = [0.616, 0.722, 0.78] as const; // ice

/**
 * The baton itself does not cool. It is the one warm thing that survives the
 * journey and lands on the porcelain desk — which is both the better story and
 * the only way a glowing object stays legible once the page turns light.
 */
export const BATON_WARM = [1.0, 0.353, 0.122] as const;
export const BATON_COOL = [1.0, 0.42, 0.18] as const;

/** The trail has to read on porcelain too, so it cools to ice-deep, not ice. */
export const TRAIL_WARM = [1.0, 0.353, 0.122] as const;
export const TRAIL_COOL = [0.2, 0.376, 0.478] as const; // --ice-deep
