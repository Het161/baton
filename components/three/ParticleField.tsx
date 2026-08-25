"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { journey } from "@/lib/journey";
import { particleCount, type Quality } from "@/lib/capability";
import { PARTICLE_COOL, PARTICLE_WARM } from "@/lib/temperature";
import { particleFragment, particleVertex } from "./shaders";

const DEPTH = 16;

/**
 * The page-wide particle field. Positions never leave the GPU: drift is three
 * offset sines in the vertex shader keyed off a per-particle seed, so the CPU
 * cost per frame is four uniform writes regardless of count.
 *
 * The field participates in the temperature shift and fades to nothing before
 * porcelain — no particles in the cool zone (§14).
 */
export function ParticleField({ quality }: { quality: Quality }) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const dpr = useThree((state) => state.viewport.dpr);
  const count = particleCount(quality);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      // biased toward the centre so the hero silhouette stays readable
      const r = Math.pow(Math.random(), 0.62);
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * r * 7.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = -Math.random() * DEPTH * 0.75 - 0.6;
      seeds[i] = Math.random();
      scales[i] = 0.35 + Math.random() * 0.9;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 24);
    return geo;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 1.6 },
      uPixelRatio: { value: 1 },
      uTemp: { value: 0 },
      uOpacity: { value: 1 },
      uDepth: { value: DEPTH },
      uWarm: { value: new THREE.Vector3(...PARTICLE_WARM) },
      uCool: { value: new THREE.Vector3(...PARTICLE_COOL) },
    }),
    [],
  );

  useFrame(() => {
    // three clones the uniforms R3F passes to the constructor — always write
    // through the material's own object
    const u = material.current?.uniforms;
    if (!u) return;

    u.uTime.value = journey.time;
    u.uTemp.value = journey.temp;
    u.uPixelRatio.value = dpr;
    u.uSize.value = quality === "high" ? 1.7 : 1.15;
    // gone well before the page reaches porcelain
    const cooled = Math.max(0, 1 - journey.temp * 1.45);
    u.uOpacity.value = cooled * (1 - journey.fade * 0.75);

    if (points.current) points.current.visible = u.uOpacity.value > 0.01;
  });

  if (!count) return null;

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={particleVertex}
        fragmentShader={particleFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
