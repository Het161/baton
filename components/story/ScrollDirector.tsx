"use client";

import { useEffect } from "react";
import { loadGsap, type Revertible } from "@/lib/gsap";
import { journey, resetJourney } from "@/lib/journey";
import { applyTemperature } from "@/lib/temperature";
import { useEnvironment } from "@/components/providers/Environment";

/**
 * The one place scroll position becomes story state.
 *
 * Every act writes a normalised 0→1 value into the `journey` signal; the WebGL
 * scene reads those inside useFrame. Sections are pinned with CSS `position:
 * sticky` rather than ScrollTrigger pinning — no pin-spacers, no layout
 * reflow at trigger boundaries, and the mobile pass becomes a CSS height
 * change instead of a second timeline.
 */
export function ScrollDirector() {
  const { reduced, ready } = useEnvironment();

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    let dispose: (() => void) | undefined;

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return;

      // Reduced motion: no scrubbing anywhere. The temperature still has to
      // change or the cool-zone sections would render on obsidian — so it
      // snaps at the handoff instead of interpolating.
      if (reduced) {
        resetJourney();
        applyTemperature(0);
        const trigger = ScrollTrigger.create({
          trigger: "#act-3",
          start: "top 45%",
          onEnter: () => applyTemperature(1),
          onLeaveBack: () => applyTemperature(0),
        });
        dispose = () => trigger.kill();
        return;
      }

      const ctx: Revertible = gsap.context(() => {
        ScrollTrigger.create({
          trigger: "#hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => {
            journey.hero = self.progress;
          },
        });

        // the stage dims through the PROBLEM beat, then comes back for ACT I
        ScrollTrigger.create({
          trigger: "#problem",
          start: "top 78%",
          end: "bottom 22%",
          scrub: true,
          onUpdate: (self) => {
            journey.fade = Math.sin(self.progress * Math.PI);
          },
        });

        /**
         * A sticky stage unsticks over its own height, so consecutive acts
         * share a one-viewport window in which the outgoing content slides up
         * and the incoming content slides in, both cropped.
         *
         * The two fades below are *complementary* over exactly that window —
         * out = 1 - e, in = e — so the pair always sums to one and the seam is
         * a dissolve. (Fading one out before the other starts leaves a frame
         * of empty page, very obvious on a phone where the window is most of
         * the act.)
         */
        const ease = (p: number) => p * p * (3 - 2 * p);

        const crossfade = (id: string) => {
          const stage = document.querySelector<HTMLElement>(`${id} .act-stage`);
          if (!stage) return;

          ScrollTrigger.create({
            trigger: id,
            start: "top bottom",
            end: "top top",
            scrub: true,
            onUpdate: (self) => {
              stage.style.opacity = ease(self.progress).toFixed(3);
            },
          });

          ScrollTrigger.create({
            trigger: id,
            start: "bottom bottom",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
              stage.style.opacity = (1 - ease(self.progress)).toFixed(3);
            },
          });
        };

        const act = (id: string, key: "act1" | "act2" | "act3") => {
          ScrollTrigger.create({
            trigger: id,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
              journey[key] = self.progress;
            },
          });
          crossfade(id);
        };

        act("#act-1", "act1");
        act("#act-2", "act2");
        act("#act-3", "act3");

        // The canvas is fixed, so once ACT III's sticky stage starts scrolling
        // away the docked scene would hang over the cool sections. It
        // dissolves on the same window the stage does.
        ScrollTrigger.create({
          trigger: "#act-3",
          start: "bottom bottom",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => {
            journey.exit = self.progress;
          },
        });

        // ── the temperature shift ──
        // One full viewport of scroll inside ACT III, driven straight into the
        // precomputed token LUT. Deliberately its own trigger so the window
        // can be tuned without touching the 3D timeline.
        ScrollTrigger.create({
          trigger: "#temperature-window",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            journey.temp = self.progress;
            applyTemperature(self.progress);
          },
        });
      });

      ScrollTrigger.refresh();
      dispose = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      dispose?.();
      resetJourney();
      applyTemperature(0);
    };
  }, [reduced, ready]);

  return null;
}
