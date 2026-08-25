"use client";

import { useEffect, useRef } from "react";
import { loadGsap, type Revertible } from "@/lib/gsap";
import { useEnvironment } from "@/components/providers/Environment";
import { Eyebrow } from "@/components/ui/primitives";

const CHIPS = [
  { icon: "◉", label: "voice note", meta: "0:47", x: -26, y: -30 },
  { icon: "▣", label: "whiteboard", meta: "4032×3024", x: 22, y: -12 },
  { icon: "▤", label: "screenshot", meta: "client thread", x: -20, y: 16 },
  { icon: "▷", label: "quick text", meta: "22 words", x: 26, y: 32 },
];

const NOTES = [
  "voice · camera · screenshot · text",
  "capture works with the screen off",
  "stored on device, never uploaded",
];

/**
 * ACT I · CAPTURE
 *
 * The chips are pure DOM — crisper text than drei's <Html>, and free for the
 * renderer — driven by the same scrubbed trigger that feeds the 3D. They
 * scatter into the field, then collapse into its centre, which is where the
 * baton sits at this point in the journey.
 */
export function ActCapture() {
  const root = useRef<HTMLElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const { reduced, ready } = useEnvironment();

  useEffect(() => {
    if (!ready || reduced) return;

    let ctx: Revertible | null = null;
    let cancelled = false;

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !root.current) return;

      ctx = gsap.context(() => {
        const chips = gsap.utils.toArray<HTMLElement>("[data-chip]");
        gsap.set(chips, { xPercent: -50, yPercent: -50 });

        // scatter offsets are a share of the field's box, so they survive resize
        const scatterX = (_i: number, el: Element) =>
          ((field.current?.clientWidth ?? 0) * Number((el as HTMLElement).dataset.x ?? 0)) / 100;
        const scatterY = (_i: number, el: Element) =>
          ((field.current?.clientHeight ?? 0) * Number((el as HTMLElement).dataset.y ?? 0)) / 100;

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root.current!,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .from("[data-act1-copy]", { opacity: 0, y: 26, stagger: 0.12, duration: 0.6 }, 0)
          .fromTo(
            chips,
            { x: scatterX, y: scatterY, opacity: 0, scale: 0.8 },
            {
              x: scatterX,
              y: scatterY,
              opacity: 1,
              scale: 1,
              stagger: 0.1,
              duration: 0.5,
            },
            0.2,
          )
          // absorbed into the baton, which sits right of the field's centre
          .to(
            chips,
            {
              x: () => (field.current?.clientWidth ?? 0) * 0.19,
              y: 0,
              opacity: 0,
              scale: 0.28,
              stagger: 0.09,
              duration: 0.7,
              ease: "power2.in",
            },
            1.15,
          );
      }, root);

      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [ready, reduced]);

  return (
    <section id="act-1" ref={root} aria-labelledby="act-1-title" className="act">
      <div className="act-stage">
        <div className="shell grid w-full items-center gap-7 md:grid-cols-12 md:gap-10">
          <div className={reduced ? "md:col-span-9" : "md:col-span-5"}>
            <div data-act1-copy>
              <Eyebrow index="ACT I">Capture</Eyebrow>
            </div>
            <h2 id="act-1-title" data-act1-copy className="mt-6 text-h2">
              One tap, in the four seconds you actually have.
            </h2>
            <p data-act1-copy className="text-dim mt-6 max-w-[42ch] text-lead">
              Hold the volume key and talk. Shoot the whiteboard. Share a screenshot straight into
              BATON. Nothing to name, nothing to file, nothing to open later.
            </p>

            <ul data-act1-copy className="mt-9 space-y-3 font-mono text-[12px] tracking-[0.06em]">
              {NOTES.map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span aria-hidden="true" className="mt-[7px] h-px w-4 bg-[rgb(var(--accent))]" />
                  <span className="text-dim">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* the capture field — chips converge on the baton's ACT I position.
              Purely decorative, so it sits out the reduced-motion path entirely. */}
          <div
            ref={field}
            aria-hidden="true"
            hidden={reduced}
            className="pointer-events-none relative order-first h-[36svh] md:order-none md:col-span-7 md:h-[62vh]"
          >
            {CHIPS.map((chip) => (
              <span
                key={chip.label}
                data-chip
                data-x={chip.x}
                data-y={chip.y}
                className="hairline absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-full border bg-[rgb(var(--surface)/0.72)] px-3.5 py-2 font-mono text-[11px] tracking-[0.06em] whitespace-nowrap backdrop-blur-md"
              >
                <span className="text-[rgb(var(--accent))]">{chip.icon}</span>
                <span>{chip.label}</span>
                <span className="text-dim">{chip.meta}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
