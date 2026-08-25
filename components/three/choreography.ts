import { smooth } from "@/lib/journey";

/**
 * The whole scroll journey as keyframes on the 0 → 4 story clock:
 *   0 hero · 1 ACT I capture · 2 ACT II think · 3 ACT III handoff · 4 docked
 *
 * Authoring the 3D as data (rather than a pile of ScrollTriggers) means the
 * mobile pass is a multiplier on `x`, not a second timeline to maintain.
 */

export type Track = {
  t: number;
  x: number;
  y: number;
  z: number;
  s: number;
  rx?: number;
  ry?: number;
  rz?: number;
};

/**
 * Each act has a *hold* keyframe near its end. Without one the baton drifts
 * toward the next act's mark for the whole act and spends the middle of it
 * behind that act's copy; with one it stays on its mark while the section is
 * being read and only moves during the crossfade to the next.
 */
export const BATON_TRACK: Track[] = [
  // hero — right of the headline, at full size
  { t: 0.0, x: 1.62, y: 0.06, z: 0.0, s: 1.0, rz: 0.22, ry: 0.5 },
  // ACT I — beside the capture field, the chips collapse into it
  { t: 1.0, x: 1.34, y: -0.06, z: -0.35, s: 0.62, rz: 0.34, ry: 1.5 },
  { t: 1.72, x: 1.28, y: -0.02, z: -0.3, s: 0.68, rz: 0.3, ry: 2.1 },
  // ACT II — in the gutter between the readout and the copy
  { t: 2.0, x: 0.12, y: 0.02, z: 0.5, s: 0.82, rz: 0.1, ry: 2.6 },
  { t: 2.72, x: 0.16, y: 0.04, z: 0.48, s: 0.82, rz: 0.12, ry: 3.0 },
  // ACT III — departs the phone-form, arcs over, docks at the desk-form
  { t: 3.0, x: -1.42, y: 0.72, z: -0.3, s: 0.44, rz: -0.5, ry: 3.4 },
  { t: 3.55, x: 0.1, y: 1.32, z: -0.6, s: 0.38, rz: -0.2, ry: 4.4 },
  { t: 4.0, x: 1.5, y: 0.55, z: -0.55, s: 0.26, rz: 0.0, ry: 5.2 },
];

export const CAMERA_TRACK: Track[] = [
  { t: 0.0, x: 0, y: 0, z: 6.3, s: 1 },
  { t: 1.0, x: 0, y: 0, z: 4.7, s: 1 },
  { t: 2.0, x: 0, y: 0, z: 4.5, s: 1 },
  { t: 3.0, x: 0, y: 0, z: 5.1, s: 1 },
  { t: 4.0, x: 0, y: 0.05, z: 5.5, s: 1 },
];

export type Sample = {
  x: number;
  y: number;
  z: number;
  s: number;
  rx: number;
  ry: number;
  rz: number;
};

const scratch: Sample = { x: 0, y: 0, z: 0, s: 1, rx: 0, ry: 0, rz: 0 };

/** Samples a track at story-time `t`, easing between neighbouring keys. */
export function sampleTrack(track: Track[], t: number, out: Sample = scratch): Sample {
  const clamped = Math.max(track[0].t, Math.min(track[track.length - 1].t, t));

  let i = 0;
  while (i < track.length - 2 && clamped > track[i + 1].t) i += 1;

  const a = track[i];
  const b = track[i + 1];
  const span = b.t - a.t || 1;
  const k = smooth((clamped - a.t) / span);

  out.x = a.x + (b.x - a.x) * k;
  out.y = a.y + (b.y - a.y) * k;
  out.z = a.z + (b.z - a.z) * k;
  out.s = a.s + (b.s - a.s) * k;
  out.rx = (a.rx ?? 0) + ((b.rx ?? 0) - (a.rx ?? 0)) * k;
  out.ry = (a.ry ?? 0) + ((b.ry ?? 0) - (a.ry ?? 0)) * k;
  out.rz = (a.rz ?? 0) + ((b.rz ?? 0) - (a.rz ?? 0)) * k;

  return out;
}

/**
 * Portrait phones cannot hold the desktop's horizontal spread, so the scene
 * squeezes inward and lifts above the copy instead of sitting behind it.
 */
export function layoutForAspect(aspect: number) {
  const narrow = aspect < 1.0;
  return {
    // portrait squeezes the horizontal spread so the journey still crosses the
    // frame without anything leaving it
    spreadX: narrow ? 0.45 : Math.min(1, Math.max(0.62, aspect / 1.6)),
    // …flattens the vertical spread into a band…
    ySpread: narrow ? 0.34 : 1,
    // …and lifts that whole band above the copy rather than behind it
    offsetY: narrow ? 2.9 : 0,
    zoom: narrow ? 1.32 : 1,
  };
}
