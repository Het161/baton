"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { Quality } from "@/lib/capability";
import Scene from "./Scene";

/**
 * The single <Canvas> for the whole pitch page. Everything the story needs
 * lives inside it; sections are staged by scroll progress rather than by
 * mounting and unmounting scenes.
 *
 * The canvas starts fully transparent and is ramped up by StageClock, so the
 * hero headline (the LCP element) paints first and the 3D arrives behind it.
 */
export default function CanvasStage({
  quality,
  drift,
  active,
}: {
  quality: Quality;
  drift: boolean;
  active: boolean;
}) {
  return (
    <Canvas
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ gl }) => {
        gl.domElement.style.opacity = "0";
      }}
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      gl={{
        antialias: quality === "high",
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.NoToneMapping,
        stencil: false,
      }}
      camera={{ fov: 38, near: 0.1, far: 40, position: [0, 0, 6.3] }}
    >
      <Scene quality={quality} drift={drift} />
    </Canvas>
  );
}
