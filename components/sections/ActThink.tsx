"use client";

import { useEffect, useRef } from "react";
import { loadGsap, type Revertible } from "@/lib/gsap";
import { useEnvironment } from "@/components/providers/Environment";
import { Chip, Eyebrow } from "@/components/ui/primitives";

const READOUT = [
  { t: "runtime", v: "litert-lm · gemma 3n e2b · int4" },
  { t: "input", v: "voice_note_0947.wav · 47s" },
  { t: "step", v: "transcribing…" },
  { t: "step", v: "extracting 4 action items" },
  { t: "step", v: "drafting reply · 118 tokens" },
  { t: "accel", v: "npu · 11 W-s burst · 2.4 s wall" },
  { t: "network", v: "0 bytes sent" },
];

const SPECS = ["LiteRT-LM", "Gemma 3n E2B", "NPU-accelerated", "GGUF fallback"];

/**
 * ACT II · THINK
 *
 * The terminal types itself out on scrub — clip-path rather than a character
 * timer, so it reverses cleanly when the visitor scrolls back up.
 */
export function ActThink() {
  const root = useRef<HTMLElement>(null);
  const { reduced, ready } = useEnvironment();

  useEffect(() => {
    if (!ready || reduced) return;

    let ctx: Revertible | null = null;
    let cancelled = false;

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !root.current) return;

      ctx = gsap.context(() => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root.current!,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });

        timeline
          .from("[data-act2-copy]", { opacity: 0, y: 26, stagger: 0.12, duration: 0.6 }, 0)
          .fromTo(
            "[data-line]",
            { clipPath: "inset(0 100% 0 0)", opacity: 0.25 },
            {
              clipPath: "inset(0 0% 0 0)",
              opacity: 1,
              duration: 0.42,
              stagger: 0.24,
              ease: "none",
            },
            0.3,
          )
          .from("[data-thermal]", { opacity: 0, y: 24, duration: 0.6 }, 1.9);
      }, root);

      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [ready, reduced]);

  return (
    <section id="act-2" ref={root} aria-labelledby="act-2-title" className="act">
      <div className="act-stage">
        <div className="shell grid w-full items-center gap-7 md:grid-cols-12 md:gap-10">
          {/* readout — cols 1-5, leaving the centre gutter free for the baton */}
          <div className="order-last md:order-none md:col-span-5">
            <div className="hairline rounded-xl border bg-[rgb(var(--surface)/0.55)] p-4 backdrop-blur-md sm:p-6">
              <div className="hairline flex items-center gap-2 border-b pb-3">
                <span className="h-2 w-2 rounded-full bg-[rgb(var(--accent))]" aria-hidden="true" />
                <span className="eyebrow">baton · on-device</span>
                <span className="text-dim ml-auto font-mono text-[11px]">airplane mode</span>
              </div>

              <ol className="mt-3.5 space-y-2 font-mono text-[12px] leading-normal sm:mt-4 sm:space-y-2.5 sm:text-[13px] sm:leading-relaxed">
                {READOUT.map((line) => (
                  <li key={line.v} data-line className="flex gap-3">
                    <span className="w-[4.5rem] shrink-0 text-[rgb(var(--accent))]">{line.t}</span>
                    <span className="text-dim">{line.v}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* one scrollable row on a phone, where the act has no vertical
                room to spare; wraps normally from sm up */}
            <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1 [&>*]:shrink-0 sm:mt-5 sm:flex-wrap sm:overflow-visible">
              {SPECS.map((spec) => (
                <Chip key={spec}>{spec}</Chip>
              ))}
            </div>
          </div>

          {/* copy — cols 8-12 */}
          <div className="md:col-span-5 md:col-start-8">
            <div data-act2-copy>
              <Eyebrow index="ACT II">Think</Eyebrow>
            </div>
            <h2 id="act-2-title" data-act2-copy className="mt-5 text-h2 sm:mt-6">
              The model runs on the phone. Not near it.
            </h2>
            <p data-act2-copy className="text-dim mt-5 max-w-[44ch] text-lead sm:mt-6">
              A Gemma 3n-class model on the LiteRT-LM runtime transcribes, pulls out the action
              items and drafts the reply — on the NPU, in airplane mode.
            </p>

            {/* the honest constraint, turned into the sponsor's moment */}
            <div
              data-thermal
              className="mt-7 rounded-lg border-l-2 border-[rgb(var(--accent))] bg-[rgb(var(--surface)/0.4)] p-4 sm:mt-9 sm:p-5"
            >
              <p className="eyebrow">The real constraint</p>
              <p className="mt-3 max-w-[46ch] text-body">
                On-device AI is limited by heat, not by intelligence — sustained inference throttles
                a phone within minutes. So BATON never runs sustained. It thinks in short bursts and
                cools between them, which is exactly what the iQOO 15&apos;s ~60 TOPS NPU and vapor
                chamber are built for.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
