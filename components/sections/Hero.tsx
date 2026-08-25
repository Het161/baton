"use client";

import { useEffect, useRef } from "react";
import { loadGsap, type Revertible } from "@/lib/gsap";
import { useEnvironment } from "@/components/providers/Environment";
import { Button8D } from "@/components/ui/Button8D";
import { Eyebrow } from "@/components/ui/primitives";

const PILLARS = ["on-device", "0 bytes to cloud", "offline-first", "built for iQOO 15"];

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  const { reduced, ready } = useEnvironment();

  useEffect(() => {
    if (!ready || reduced) return;
    const el = headline.current;
    if (!el) return;

    let split: Revertible | null = null;
    let ctx: Revertible | null = null;
    let cancelled = false;
    const startedAt = performance.now();

    // Wait two frames before splitting so the headline — the LCP element —
    // has already painted from the server HTML (§10).
    const twoFrames = new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    Promise.all([loadGsap(), twoFrames]).then(([{ gsap, SplitText }]) => {
      if (cancelled) return;

      // The entrance hides text that is already on screen, so it is only worth
      // playing if it can start immediately. If GSAP arrived late — slow
      // network, slow device — the headline simply stays where it is rather
      // than blinking out and back a second after the visitor began reading.
      const late = performance.now() - startedAt > 500;

      ctx = gsap.context(() => {
        if (!late) {
          // one typographic set-piece: characters assemble once, fast, never loops
          const instance = new SplitText(el, {
            type: "chars,lines",
            linesClass: "overflow-hidden",
          });
          split = instance;

          gsap.from(instance.chars, {
            yPercent: 118,
            rotate: 5.5,
            opacity: 0,
            duration: 0.62,
            ease: "power3.out",
            stagger: { each: 0.008, from: "start" },
          });
        }

        gsap.from("[data-hero-fade]", {
          opacity: 0,
          y: 18,
          duration: 0.8,
          delay: late ? 0 : 0.34,
          ease: "power3.out",
          stagger: 0.09,
        });
      }, root);
    });

    return () => {
      cancelled = true;
      split?.revert();
      ctx?.revert();
    };
  }, [ready, reduced]);

  return (
    <section
      id="hero"
      ref={root}
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] flex-col justify-between pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      {/* slim masthead — no chrome, just orientation */}
      <div className="shell flex items-center justify-between gap-4" data-hero-fade>
        <span className="font-display text-[1.05rem] font-[800] tracking-[-0.02em]">
          BATON
          <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))] align-middle" />
        </span>
        <nav aria-label="Primary" className="flex items-center gap-5">
          <a
            href="#live-demo"
            className="eyebrow hidden transition-colors hover:text-[rgb(var(--fg))] sm:inline"
          >
            Live demo
          </a>
          <a href="/desk" className="eyebrow transition-colors hover:text-[rgb(var(--fg))]">
            The desk
          </a>
        </nav>
      </div>

      {/* headline block — sits low so the baton owns the upper frame on phones */}
      <div className="shell pt-[23vh] md:pt-0">
        <div data-hero-fade>
          <Eyebrow index="01">iQOO Hackathon 2026 · Chennai Battle</Eyebrow>
        </div>

        <h1
          id="hero-title"
          ref={headline}
          className="font-display mt-5 max-w-[9ch] text-hero font-[800] sm:max-w-[11ch]"
        >
          The pocket is the office now.
        </h1>

        <p data-hero-fade className="text-dim mt-7 max-w-[42ch] text-lead text-pretty">
          Your phone captures, thinks on-device, and hands finished work to your desk.
        </p>

        <div data-hero-fade className="mt-8 flex flex-wrap items-center gap-3">
          <Button8D href="#live-demo" variant="ember" size="lg" arrow>
            See it think
          </Button8D>
          <Button8D href="/desk" variant="ghost" size="lg">
            Open the desk
          </Button8D>
        </div>
      </div>

      {/* pillar strip */}
      <div className="shell" data-hero-fade>
        <ul className="hairline flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4 font-mono text-[11px] tracking-[0.1em] text-[rgb(var(--fg-dim)/var(--fg-dim-a))]">
          {PILLARS.map((pillar, i) => (
            <li key={pillar} className="flex items-center gap-4">
              {i > 0 && (
                <span aria-hidden="true" className="text-[rgb(var(--accent))]">
                  ·
                </span>
              )}
              <span>{pillar}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
