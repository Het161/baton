"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  hasWebGL,
  initialQuality,
  isCoarsePointer,
  prefersReducedMotion,
  startFpsGovernor,
  type Quality,
} from "@/lib/capability";

type Env = {
  /** true once we know the visitor asked for reduced motion */
  reduced: boolean;
  /** true for touch / no hover — suppresses magnet + tilt on Button8D */
  coarse: boolean;
  /** WebGL availability */
  webgl: boolean;
  /** current render tier, may be downgraded once by the FPS governor */
  quality: Quality;
  /** true after the client has measured everything (avoids SSR flashes) */
  ready: boolean;
};

const FALLBACK: Env = {
  reduced: false,
  coarse: true,
  webgl: false,
  quality: "low",
  ready: false,
};

const EnvironmentContext = createContext<Env>(FALLBACK);

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Env>(FALLBACK);

  useEffect(() => {
    const measure = () =>
      setState((prev) => ({
        reduced: prefersReducedMotion(),
        coarse: isCoarsePointer(),
        webgl: hasWebGL(),
        // never re-upgrade past a governor downgrade
        quality: prev.quality === "low" && prev.ready ? "low" : initialQuality(),
        ready: true,
      }));

    measure();

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(pointer: fine)");
    motionQuery.addEventListener("change", measure);
    pointerQuery.addEventListener("change", measure);

    const stopGovernor = startFpsGovernor(() => {
      setState((prev) => (prev.quality === "high" ? { ...prev, quality: "low" } : prev));
    });

    return () => {
      motionQuery.removeEventListener("change", measure);
      pointerQuery.removeEventListener("change", measure);
      stopGovernor();
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
}

export function useEnvironment() {
  return useContext(EnvironmentContext);
}
