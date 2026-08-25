"use client";

import { useEffect } from "react";
import { loadGsap } from "@/lib/gsap";
import { useEnvironment } from "./Environment";

/**
 * Lenis, driven off GSAP's ticker so smooth scroll and ScrollTrigger share a
 * single rAF. Disabled entirely under `prefers-reduced-motion` — native scroll
 * is the accessible default, and every scrubbed timeline is skipped alongside
 * it. Both libraries load after paint (§10).
 */
export function SmoothScroll() {
  const { reduced, ready } = useEnvironment();

  useEffect(() => {
    if (!ready) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const { gsap, ScrollTrigger } = await loadGsap();
      if (cancelled) return;

      if (reduced) {
        // still let ScrollTrigger drive discrete reveals off native scroll
        ScrollTrigger.refresh();
        return;
      }

      const { default: Lenis } = await import("lenis");
      if (cancelled) return;

      const lenis = new Lenis({
        lerp: 0.11,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
        // native momentum on touch feels better than a JS approximation
        syncTouch: false,
      });

      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);

      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      // fonts settling changes section heights — recalculate once they land
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      cleanup = () => {
        lenis.off("scroll", onScroll);
        gsap.ticker.remove(raf);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reduced, ready]);

  return null;
}
