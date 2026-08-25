"use client";

import { useEffect, useRef } from "react";
import { loadGsap, type Revertible } from "@/lib/gsap";
import { useEnvironment } from "@/components/providers/Environment";
import { Eyebrow } from "@/components/ui/primitives";

const FLOW = [
  {
    key: "phone",
    title: "Phone",
    lines: ["capture", "on-device model", "baton packed"],
  },
  {
    key: "officekit",
    title: "Office Kit",
    lines: ["clipboard sync", "file drop", "screen mirror"],
  },
  {
    key: "desk",
    title: "Desk",
    lines: ["baton lands", "already organised", "one click from done"],
  },
];

/**
 * ACT III · HANDOFF
 *
 * The temperature shift lives here. `#temperature-window` is a 100vh marker
 * placed inside this act — ScrollDirector scrubs the whole token palette
 * across exactly that span, so the page cools over one viewport of scroll
 * while the light trail crosses from phone-world to desk-world.
 */
export function ActHandoff() {
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
          .from("[data-act3-copy]", { opacity: 0, y: 26, stagger: 0.1, duration: 0.5 }, 0)
          .from("[data-flow-node]", { opacity: 0, y: 20, stagger: 0.14, duration: 0.4 }, 0.45)
          .fromTo(
            "[data-flow-link]",
            { scaleX: 0, scaleY: 0 },
            { scaleX: 1, scaleY: 1, stagger: 0.14, duration: 0.4, ease: "none" },
            0.55,
          )
          // hold: everything is on screen by ~55% of the act, and stays there
          // while the trail finishes drawing and the page cools
          .to({}, { duration: 1.0 });
      }, root);

      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [ready, reduced]);

  return (
    <section id="act-3" ref={root} aria-labelledby="act-3-title" className="act">
      {/* the span over which the page cools — one viewport of scroll */}
      <div
        id="temperature-window"
        aria-hidden="true"
        className="pointer-events-none absolute left-0 w-px"
        style={{ top: "140vh", height: "100vh" }}
      />

      {/* bottom-aligned so the upper band stays clear for the light trail */}
      <div className="act-stage items-end pb-[4vh] sm:pb-[8vh]">
        <div className="shell w-full">
          <div className="grid items-end gap-7 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-5">
              <div data-act3-copy>
                <Eyebrow index="ACT III">Handoff</Eyebrow>
              </div>
              <h2 id="act-3-title" data-act3-copy className="mt-6 text-h2">
                The work lands before you sit down.
              </h2>
              <p data-act3-copy className="text-dim mt-6 max-w-[44ch] text-lead">
                The finished artifact becomes a baton — a small structured packet of summary,
                actions and draft. It rides the Office Kit flow to the machine you are walking
                toward.
              </p>
              <p data-act3-copy className="text-dim mt-5 max-w-[44ch] text-body">
                What it produces is a file and a block of text — exactly what Office Kit&apos;s
                clipboard sync and file drop already carry between an OriginOS 6 phone and the desk.
              </p>
            </div>

            {/* phone → Office Kit → desk */}
            <div className="md:col-span-6 md:col-start-7">
              <div className="hairline rounded-xl border bg-[rgb(var(--surface)/calc(var(--surface-a)*0.7))] p-4 backdrop-blur-md sm:p-7">
                <p className="eyebrow">The route</p>
                {/* stacks into rows on a phone, runs left-to-right from sm up */}
                <div className="mt-5 flex flex-col gap-1.5 sm:mt-6 sm:flex-row sm:items-stretch">
                  {FLOW.map((node, i) => (
                    <div
                      key={node.key}
                      className="flex min-w-0 flex-col items-center gap-1.5 sm:flex-1 sm:flex-row"
                    >
                      {i > 0 && (
                        <span
                          data-flow-link
                          aria-hidden="true"
                          className="h-4 w-px shrink-0 origin-top bg-[rgb(var(--accent))] sm:h-px sm:w-7 sm:origin-left"
                        />
                      )}
                      <div data-flow-node className="w-full min-w-0 sm:flex-1">
                        <div className="hairline h-full rounded-lg border bg-[rgb(var(--surface)/0.35)] px-3.5 py-3 text-left sm:px-3 sm:py-4 sm:text-center">
                          <p className="font-display text-[0.9rem] font-[700] tracking-[-0.01em] whitespace-nowrap">
                            {node.title}
                          </p>
                          <ul className="text-dim mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 font-mono text-[10px] leading-tight tracking-[0.03em] sm:mt-2.5 sm:block sm:space-y-1.5">
                            {node.lines.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-dim mt-4 font-mono text-[11px] leading-relaxed tracking-[0.05em] sm:mt-6">
                  designed around the Office Kit workflow · no third-party Office Kit API is claimed
                  or required
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
