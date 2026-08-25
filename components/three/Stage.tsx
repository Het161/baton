"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { journey } from "@/lib/journey";
import { useEnvironment } from "@/components/providers/Environment";
import { StaticStage } from "./StaticStage";

const CanvasStage = dynamic(() => import("./CanvasStage"), { ssr: false });

/**
 * Mounts the WebGL stage only when it can actually run, keeps the static
 * composition underneath it in every case, and parks the render loop whenever
 * the story is off screen or the tab is hidden.
 */
export function Stage() {
  const { webgl, reduced, quality, coarse, ready } = useEnvironment();
  const [active, setActive] = useState(true);
  const [armed, setArmed] = useState(false);

  /**
   * The scene arms on the visitor's first sign of presence — a scroll, a
   * pointer moving over the page, a key, a tap.
   *
   * Building it is one long main-thread task: geometry, six shader programs
   * and a first frame. Running that during hydration is what makes a page feel
   * dead on a mid-range phone, and it buys nothing: the 3D exists to tell a
   * *scroll* story, and until someone scrolls the static composition is the
   * design. In practice a real visitor arms it within a second of arriving; a
   * visitor who never touches the page never pays for it.
   */
  useEffect(() => {
    if (armed) return;
    const arm = () => setArmed(true);
    const events = ["scroll", "pointerdown", "pointermove", "keydown", "touchstart"] as const;
    for (const type of events) window.addEventListener(type, arm, { passive: true, once: true });
    return () => {
      for (const type of events) window.removeEventListener(type, arm);
    };
  }, [armed]);

  // pointer parallax source — fine pointers only
  useEffect(() => {
    if (coarse || reduced) return;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      journey.px = (event.clientX / window.innerWidth) * 2 - 1;
      journey.py = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [coarse, reduced]);

  // render-loop gating
  useEffect(() => {
    const story = document.getElementById("story");
    let onScreen = true;
    let visible = !document.hidden;
    const sync = () => {
      journey.active = onScreen && visible;
      setActive(journey.active);
    };

    let observer: IntersectionObserver | undefined;
    if (story) {
      observer = new IntersectionObserver(
        (entries) => {
          onScreen = entries[0]?.isIntersecting ?? true;
          sync();
        },
        { rootMargin: "20% 0px" },
      );
      observer.observe(story);
    }

    const onVisibility = () => {
      visible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const canRender = ready && armed && webgl && !reduced && quality !== "none";

  // The static composition holds the frame until WebGL has something to show,
  // then cross-fades out underneath it — never a blank beat, never both.
  return (
    <>
      <StaticStage dimmed={canRender} />
      {canRender && (
        <div className="stage">
          <CanvasStage quality={quality} drift={coarse} active={active} />
        </div>
      )}
    </>
  );
}
