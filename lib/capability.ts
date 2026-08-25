/**
 * Capability detection + the FPS governor.
 *
 * Everything here is defensive: the page must look finished when WebGL is
 * unavailable, when the GPU is slow, and when the visitor has asked for
 * reduced motion. Nothing in here throws.
 */

export type Quality = "high" | "low" | "none";

let cachedWebGL: boolean | null = null;

export function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  if (cachedWebGL !== null) return cachedWebGL;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    cachedWebGL = Boolean(gl);
    // release immediately — we only wanted the answer
    const lose = (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context");
    lose?.loseContext();
  } catch {
    cachedWebGL = false;
  }
  return cachedWebGL;
}

type GPUish = { requestAdapter: () => Promise<unknown> };

export function hasWebGPU(): boolean {
  if (typeof navigator === "undefined") return false;
  return "gpu" in navigator && Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
}

/**
 * `navigator.gpu` existing is not the same as WebGPU working — headless and
 * software-rendered browsers expose the object and then hand back no adapter.
 * Asking for one is the only honest check, and it costs a few milliseconds
 * once, at mount.
 */
export async function canRunWebGPU(): Promise<boolean> {
  if (!hasWebGPU()) return false;
  try {
    const gpu = (navigator as Navigator & { gpu?: GPUish }).gpu;
    const adapter = await gpu?.requestAdapter();
    return Boolean(adapter);
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return true;
  return !window.matchMedia("(pointer: fine)").matches;
}

export function isSmallViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

/** Device memory / core count heuristics, used for the *initial* particle budget. */
export function initialQuality(): Quality {
  if (!hasWebGL()) return "none";
  if (prefersReducedMotion()) return "none";
  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
  const mem =
    typeof navigator !== "undefined"
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4
      : 4;
  if (isSmallViewport() || cores <= 4 || mem <= 4) return "low";
  return "high";
}

/**
 * Samples frame timings for `sampleMs` after first paint. If the average sits
 * below `floorFps`, downgrades **once** and silently. Never upgrades — a single
 * one-way step avoids oscillating between quality levels mid-scroll.
 */
export function startFpsGovernor(
  onDowngrade: () => void,
  { sampleMs = 2000, floorFps = 45 }: { sampleMs?: number; floorFps?: number } = {},
) {
  if (typeof window === "undefined") return () => {};
  let frames = 0;
  let raf = 0;
  let stopped = false;
  const started = performance.now();

  const tick = () => {
    if (stopped) return;
    frames += 1;
    const elapsed = performance.now() - started;
    if (elapsed >= sampleMs) {
      const fps = (frames / elapsed) * 1000;
      if (fps < floorFps) onDowngrade();
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  // let the first heavy frames (font swap, hydration) pass before sampling
  const warmup = window.setTimeout(() => {
    raf = requestAnimationFrame(tick);
  }, 900);

  return () => {
    stopped = true;
    window.clearTimeout(warmup);
    cancelAnimationFrame(raf);
  };
}

/** Particle budget for a given quality tier (§7.2). */
export function particleCount(q: Quality): number {
  if (q === "high") return 3600;
  if (q === "low") return 1200;
  return 0;
}
