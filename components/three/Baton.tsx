"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { journey, storyTime } from "@/lib/journey";
import { BATON_COOL, BATON_WARM } from "@/lib/temperature";
import type { Quality } from "@/lib/capability";
import { BATON_TRACK, layoutForAspect, sampleTrack } from "./choreography";
import { makeCapsule } from "./geometry";
import { coreFragment, coreVertex, glowFragment, glowVertex } from "./shaders";

/**
 * The baton. One capsule of dark glass with an emissive core inside it, plus a
 * single additive billboard behind — that billboard is the entire "bloom"
 * budget for the page (§7).
 */
export function Baton({ quality }: { quality: Quality }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  // R3F hands ShaderMaterial its uniforms through the constructor, and three
  // clones them there — so per-frame writes must go through the material's own
  // uniforms object, never the one we passed in.
  const coreMat = useRef<THREE.ShaderMaterial>(null);
  const glowMat = useRef<THREE.ShaderMaterial>(null);

  const shell = useMemo(() => makeCapsule(0.225, 1.1, quality === "high" ? 48 : 28), [quality]);
  const core = useMemo(() => makeCapsule(0.155, 0.98, quality === "high" ? 36 : 20), [quality]);

  const coreUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPulse: { value: 0 },
      uTemp: { value: 0 },
      uOpacity: { value: 1 },
      uGain: { value: 1 },
      uWarm: { value: new THREE.Vector3(...BATON_WARM) },
      uCool: { value: new THREE.Vector3(...BATON_COOL) },
    }),
    [],
  );

  const glowUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTemp: { value: 0 },
      uStrength: { value: 0.78 },
      uWarm: { value: new THREE.Vector3(...BATON_WARM) },
      uCool: { value: new THREE.Vector3(...BATON_COOL) },
    }),
    [],
  );

  useFrame(({ camera, viewport }, delta) => {
    if (!group.current || !spin.current) return;

    const st = storyTime();
    const pose = sampleTrack(BATON_TRACK, st);
    const { spreadX, ySpread, offsetY } = layoutForAspect(viewport.aspect);

    // a slow float, damped out as the baton starts travelling
    const settle = 1 - Math.min(1, Math.max(0, st - 2.6));
    const float = Math.sin(journey.time * 0.9) * 0.045 * settle;

    group.current.position.set(pose.x * spreadX, pose.y * ySpread + offsetY + float, pose.z);
    group.current.scale.setScalar(pose.s);

    spin.current.rotation.y = pose.ry + journey.time * 0.11;
    spin.current.rotation.z = pose.rz;
    spin.current.rotation.x = Math.sin(journey.time * 0.5) * 0.05 * settle;

    // ACT II drives the ripple; it decays as soon as the handoff begins
    const think = Math.min(journey.act2, 1) * (1 - Math.min(1, journey.act3 * 2));

    const coreU = coreMat.current?.uniforms;
    if (coreU) {
      coreU.uPulse.value = think;
      coreU.uTime.value = journey.time;
      coreU.uTemp.value = journey.temp;
      // without transmission the shell is thin, so the filament is dialled back
      coreU.uGain.value = quality === "high" ? 1 : 0.42;
    }

    const halo = glowMat.current?.uniforms;
    if (halo) {
      halo.uTime.value = journey.time;
      halo.uTemp.value = journey.temp;
      // On a phone the copy shares the frame with the baton rather than
      // sitting beside it, so the halo is pulled back to keep text legible.
      halo.uStrength.value = (0.72 + think * 0.5) * (ySpread < 1 ? 0.55 : 1);
    }

    if (glow.current) {
      // billboard the glow without pulling in a helper component
      glow.current.quaternion.copy(camera.quaternion);
    }

    void delta;
  });

  /**
   * On the low tier the shell drops to MeshStandardMaterial. Not just for
   * fill-rate: MeshPhysicalMaterial compiles a far larger program (transmission,
   * clearcoat and iridescence branches), and shader compilation is the single
   * most expensive thing this scene does on a weak device.
   */
  const shellMaterial =
    quality === "high" ? (
      <meshPhysicalMaterial
        color="#0d0b0a"
        transmission={0.92}
        thickness={0.45}
        ior={1.46}
        roughness={0.14}
        metalness={0}
        clearcoat={1}
        clearcoatRoughness={0.06}
        attenuationDistance={2.4}
        attenuationColor={new THREE.Color("#ff6a2a")}
        transparent
      />
    ) : (
      <meshStandardMaterial
        color="#100c0a"
        roughness={0.24}
        metalness={0.45}
        transparent
        opacity={0.78}
      />
    );

  return (
    <group ref={group}>
      {/* additive glow — sits behind, always faces camera */}
      <mesh ref={glow} position={[0, 0, -0.28]} scale={[2.4, 2.9, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={glowMat}
          vertexShader={glowVertex}
          fragmentShader={glowFragment}
          uniforms={glowUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <group ref={spin}>
        {/* dark glass shell */}
        <mesh geometry={shell} renderOrder={1}>
          {shellMaterial}
        </mesh>

        {/* Emissive core. Drawn *after* the shell and with depth testing off:
            transmission resolves against a pre-pass that the core's additive
            pass never survives, so compositing it on top is the only way the
            filament reads consistently against a dark background. */}
        <mesh geometry={core} renderOrder={3}>
          <shaderMaterial
            ref={coreMat}
            vertexShader={coreVertex}
            fragmentShader={coreFragment}
            uniforms={coreUniforms}
            transparent
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
}
