"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { loadGsap, type Revertible } from "@/lib/gsap";
import { useEnvironment } from "@/components/providers/Environment";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** stagger direct descendants marked with data-reveal-item */
  stagger?: boolean;
  delay?: number;
  y?: number;
  start?: string;
};

/**
 * Entrance reveal. Fires once, never loops (§5.4). Under reduced motion the
 * content is simply present — no transform, no opacity gate — so nothing is
 * ever hidden from a visitor who never triggers the animation.
 */
export function Reveal({
  children,
  className,
  stagger = false,
  delay = 0,
  y = 22,
  start = "top 82%",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, ready } = useEnvironment();

  useEffect(() => {
    if (!ready || reduced) return;
    const el = ref.current;
    if (!el) return;

    let ctx: Revertible | null = null;
    let cancelled = false;

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !ref.current) return;

      const targets = stagger
        ? Array.from(el.querySelectorAll<HTMLElement>("[data-reveal-item]"))
        : [el];
      if (!targets.length) return;

      ctx = gsap.context(() => {
        gsap.set(targets, { opacity: 0, y });
        gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration: 0.85,
          delay,
          ease: "power3.out",
          stagger: stagger ? 0.085 : 0,
          scrollTrigger: { trigger: el, start, once: true },
        });
      }, el);

      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [ready, reduced, stagger, delay, y, start]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
