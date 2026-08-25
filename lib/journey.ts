/**
 * The journey signal.
 *
 * A single mutable module-level object that ScrollTrigger writes to and the
 * WebGL scene reads from inside useFrame. Deliberately *not* React state:
 * scroll-scrubbed values must not trigger reconciliation 60 times a second.
 */

export type JourneyState = {
  /** 0 → 1 as the hero scrolls away (drives the camera dolly past the baton) */
  hero: number;
  /** 0 → 1 across ACT I · CAPTURE */
  act1: number;
  /** 0 → 1 across ACT II · THINK */
  act2: number;
  /** 0 → 1 across ACT III · HANDOFF */
  act3: number;
  /** 0 warm (obsidian) → 1 cool (porcelain); also tints the particle field */
  temp: number;
  /** normalised pointer, -1 → 1, for the hero parallax */
  px: number;
  py: number;
  /** 0 → 1 → 0 across the PROBLEM section; dims the stage so the beat lands */
  fade: number;
  /** 0 → 1 as ACT III scrolls away; dissolves the canvas before the cool zone */
  exit: number;
  /** is any part of the story on screen — gates the render loop */
  active: boolean;
  /** seconds since mount, advanced by the render loop */
  time: number;
};

export const journey: JourneyState = {
  hero: 0,
  act1: 0,
  act2: 0,
  act3: 0,
  temp: 0,
  px: 0,
  py: 0,
  fade: 0,
  exit: 0,
  active: true,
  time: 0,
};

/**
 * The four acts run in document order and each saturates before the next
 * begins, so their sum is a single monotonic 0 → 4 story clock. Every 3D
 * keyframe below is authored against it.
 */
export function storyTime() {
  return journey.hero + journey.act1 + journey.act2 + journey.act3;
}

export function resetJourney() {
  journey.hero = 0;
  journey.act1 = 0;
  journey.act2 = 0;
  journey.act3 = 0;
  journey.temp = 0;
  journey.px = 0;
  journey.py = 0;
  journey.fade = 0;
  journey.exit = 0;
}

/** Frame-rate independent lerp. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Remap `v` from [a,b] to [0,1], clamped. */
export function range(v: number, a: number, b: number) {
  return clamp01((v - a) / (b - a));
}

/** Smoothstep, for eases that must be computed on the GPU-facing side. */
export function smooth(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}
