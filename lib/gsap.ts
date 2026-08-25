"use client";

import type { gsap as GsapNamespace } from "gsap";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";
import type { SplitText as SplitTextType } from "gsap/SplitText";

export type GsapBundle = {
  gsap: typeof GsapNamespace;
  ScrollTrigger: typeof ScrollTriggerType;
  SplitText: typeof SplitTextType;
};

/** Anything with a revert() — enough to clean up a gsap.context without
 *  pulling GSAP's types into the first-load bundle. */
export type Revertible = { revert: () => void };

let bundle: Promise<GsapBundle> | null = null;

/**
 * GSAP is loaded on demand rather than imported at the top of every section.
 *
 * It is only ever needed inside an effect — after paint, after hydration — so
 * keeping ~46 KB of it out of the first-load bundle costs nothing visible and
 * buys most of the performance budget in §10.
 */
export function loadGsap(): Promise<GsapBundle> {
  if (!bundle) {
    bundle = Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("gsap/SplitText"),
    ]).then(([core, scroll, split]) => {
      const { gsap } = core;
      gsap.registerPlugin(scroll.ScrollTrigger, split.SplitText);
      gsap.defaults({ ease: "power3.out", duration: 0.7 });
      return { gsap, ScrollTrigger: scroll.ScrollTrigger, SplitText: split.SplitText };
    });
  }
  return bundle;
}

/** Refresh every ScrollTrigger, if GSAP has been loaded at all. */
export async function refreshScrollTriggers() {
  const loaded = await bundle;
  loaded?.ScrollTrigger.refresh();
}
