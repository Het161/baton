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
   * When the scene is allowed to build.
   *
   * Building it is one long main-thread task — geometry, six shader programs,
   * a first frame. Doing that during hydration costs seconds of blocking on a
   * weak device, so it never runs inside the critical window. After that the
   * device decides:
   *
   * - A capable machine arms as soon as the browser goes idle, so the baton is
   *   moving before anyone touches anything. The 3D is the pitch; a visitor
   *   who sits still for a moment should still see it.
   * - A constrained one waits for a real signal of intent — a scroll, a
   *   pointer, a tap — because there the build is a multi-second stall and the
   *   static composition is a genuinely good hero on its own.
   *
   * Either way the first interaction arms it immediately.
   */
  useEffect(() => {
    if (armed || !ready) return;
    const arm = () => setArmed(true);

    const events = ["scroll", "pointerdown", "pointermove", "keydown", "touchstart"] as const;
    for (const type of events) window.addEventListener(type, arm, { passive: true, once: true });

    let idle = 0;
    let timer = 0;
    const eager = quality === "high";

    const schedule = () => {
      const ric = window.requestIdleCallback;
      if (ric) idle = ric(arm, { timeout: 1200 });
      else timer = window.setTimeout(arm, 1200);
    };

    if (eager) {
      if (document.readyState === "complete") schedule();
      else window.addEventListener("load", schedule, { once: true });
    }

    return () => {
      for (const type of events) window.removeEventListener(type, arm);
      window.removeEventListener("load", schedule);
      if (idle) window.cancelIdleCallback?.(idle);
      if (timer) window.clearTimeout(timer);
    };
  }, [armed, ready, quality]);

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
