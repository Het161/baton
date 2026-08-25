"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { clamp01, journey, range } from "@/lib/journey";
import { PARTICLE_COOL, PARTICLE_WARM, TRAIL_COOL, TRAIL_WARM } from "@/lib/temperature";
import type { Quality } from "@/lib/capability";
import { layoutForAspect } from "./choreography";
import { makeRoundedBox } from "./geometry";
import { trailFragment, trailVertex } from "./shaders";

/**
 * Abstract device forms — a phone-shaped slab and a desk-shaped slab. Stylised
 * on purpose: no photoreal handset replicas (§14), and the abstraction reads
 * better at the scale these appear on screen.
 */

const screenVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const screenFragment = /* glsl */ `
precision mediump float;
uniform float uTime;
uniform float uActivity;
uniform float uOpacity;
uniform vec3  uColor;
varying vec2 vUv;

void main() {
  // a soft glow from the top edge, plus a slow band of "work" moving down
  float body = (1.0 - smoothstep(0.1, 1.05, vUv.y)) * 0.5 + 0.12;
  float band = 1.0 - smoothstep(0.0, 0.16, abs(fract(vUv.y - uTime * 0.12) - 0.5));
  float scan = 0.94 + 0.06 * sin(vUv.y * 220.0);
  float a = (body + band * 0.55 * uActivity) * scan;
  gl_FragColor = vec4(uColor * (0.32 + uActivity * 0.5), a * uOpacity);
}
`;

function useScreenUniforms(color: readonly [number, number, number]) {
  return useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Vector3(...color) },
    }),
    [color],
  );
}

export function DeviceForms({ quality }: { quality: Quality }) {
  const aspect = useThree((state) => state.viewport.aspect);
  const layout = useMemo(() => layoutForAspect(aspect), [aspect]);

  const phone = useRef<THREE.Group>(null);
  const laptop = useRef<THREE.Group>(null);
  const phoneBody = useRef<THREE.MeshStandardMaterial>(null);
  const laptopBody = useRef<THREE.MeshStandardMaterial>(null);
  const laptopPanel = useRef<THREE.MeshStandardMaterial>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  // three clones the uniforms handed to a ShaderMaterial constructor, so every
  // animated uniform is written through the material's own object
  const phoneScreenMat = useRef<THREE.ShaderMaterial>(null);
  const deskScreenMat = useRef<THREE.ShaderMaterial>(null);
  const trailMat = useRef<THREE.ShaderMaterial>(null);

  const segments = quality === "high" ? 4 : 2;
  const slab = useMemo(() => makeRoundedBox(0.68, 1.38, 0.085, 0.12, segments), [segments]);
  const deskBase = useMemo(() => makeRoundedBox(1.5, 0.055, 0.98, 0.03, segments), [segments]);
  const deskPanel = useMemo(() => makeRoundedBox(1.46, 0.92, 0.05, 0.05, segments), [segments]);

  const phoneScreen = useScreenUniforms(PARTICLE_WARM);
  const deskScreen = useScreenUniforms(PARTICLE_COOL);

  // Anchor points, recomputed whenever the viewport aspect changes. Both forms
  // sit in the upper band of ACT III so the copy can own the lower half.
  const anchors = useMemo(() => {
    const sx = layout.spreadX;
    const sy = layout.ySpread;
    return {
      phone: new THREE.Vector3(-1.55 * sx, layout.offsetY + 0.74 * sy, -0.95),
      desk: new THREE.Vector3(1.62 * sx, layout.offsetY + 0.56 * sy, -1.05),
    };
  }, [layout]);

  const trailGeometry = useMemo(() => {
    const { phone: a, desk: b } = anchors;
    const sy = layout.ySpread;
    const curve = new THREE.CatmullRomCurve3([
      a.clone().add(new THREE.Vector3(0.2, 0.1 * sy, 0.12)),
      new THREE.Vector3(a.x * 0.45, a.y + 0.55 * sy, 0.35),
      new THREE.Vector3(b.x * 0.42, b.y + 0.72 * sy, -0.1),
      b.clone().add(new THREE.Vector3(-0.16, 0.4 * sy, 0.1)),
    ]);
    return new THREE.TubeGeometry(curve, quality === "high" ? 96 : 48, 0.028, 8, false);
  }, [anchors, layout.ySpread, quality]);

  const trailUniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uTemp: { value: 0 },
      uOpacity: { value: 0 },
      uWarm: { value: new THREE.Vector3(...TRAIL_WARM) },
      uCool: { value: new THREE.Vector3(...TRAIL_COOL) },
    }),
    [],
  );

  useFrame(() => {
    const t = journey.time;

    // ── phone form: the handoff's origin. It only appears in ACT III — ACTs I
    // and II already have the chips and the readout carrying their beat, and a
    // slab sitting behind that copy read as clutter.
    const phoneIn = range(journey.act3, 0.0, 0.16);
    const phoneOut = 1 - range(journey.act3, 0.62, 0.96);
    const phoneAlpha = clamp01(phoneIn * phoneOut);

    if (phone.current) {
      phone.current.position.copy(anchors.phone);
      phone.current.rotation.y = 0.42;
      phone.current.rotation.z = -0.05;
      phone.current.visible = phoneAlpha > 0.01;
      phone.current.scale.setScalar(0.56 + phoneIn * 0.1);
    }
    if (phoneBody.current) phoneBody.current.opacity = phoneAlpha;
    const phoneU = phoneScreenMat.current?.uniforms;
    if (phoneU) {
      phoneU.uTime.value = t;
      phoneU.uOpacity.value = phoneAlpha;
      // the screen dims as the work leaves it
      phoneU.uActivity.value = 1 - range(journey.act3, 0.1, 0.5);
    }

    // ── desk form: fades up as the handoff crosses, screen lights on docking
    const deskAlpha = clamp01(range(journey.act3, 0.14, 0.52));
    if (laptop.current) {
      laptop.current.position.copy(anchors.desk);
      laptop.current.rotation.y = -0.4;
      laptop.current.visible = deskAlpha > 0.01;
      laptop.current.scale.setScalar(0.56 + deskAlpha * 0.1);
    }
    if (laptopBody.current) laptopBody.current.opacity = deskAlpha;
    if (laptopPanel.current) laptopPanel.current.opacity = deskAlpha * 0.94;
    const deskU = deskScreenMat.current?.uniforms;
    if (deskU) {
      deskU.uTime.value = t;
      deskU.uOpacity.value = deskAlpha;
      deskU.uActivity.value = clamp01(range(journey.act3, 0.6, 0.95));
    }

    // ── the trail draws itself as ACT III scrubs
    const trailAlpha = clamp01(range(journey.act3, 0.04, 0.2)) * (1 - range(journey.act3, 0.94, 1));
    const trailU = trailMat.current?.uniforms;
    if (trailU) {
      trailU.uTime.value = t;
      trailU.uTemp.value = journey.temp;
      trailU.uProgress.value = range(journey.act3, 0.08, 0.86);
      trailU.uOpacity.value = trailAlpha;
    }
    if (trailRef.current) trailRef.current.visible = trailAlpha > 0.01;
  });

  return (
    <group>
      {/* ── phone-form ── */}
      <group ref={phone} visible={false}>
        <mesh geometry={slab}>
          <meshStandardMaterial
            ref={phoneBody}
            color="#15110f"
            roughness={0.42}
            metalness={0.6}
            transparent
            opacity={0}
          />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[0.58, 1.24]} />
          <shaderMaterial
            ref={phoneScreenMat}
            vertexShader={screenVertex}
            fragmentShader={screenFragment}
            uniforms={phoneScreen}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* ── desk-form ── */}
      <group ref={laptop} visible={false}>
        <mesh geometry={deskBase} position={[0, -0.44, 0.34]}>
          <meshStandardMaterial
            ref={laptopBody}
            color="#1d232a"
            roughness={0.5}
            metalness={0.45}
            transparent
            opacity={0}
          />
        </mesh>
        <group position={[0, 0.02, -0.06]} rotation={[-0.18, 0, 0]}>
          <mesh geometry={deskPanel}>
            <meshStandardMaterial
              ref={laptopPanel}
              color="#1d232a"
              roughness={0.5}
              metalness={0.45}
              transparent
              opacity={0}
            />
          </mesh>
          <mesh position={[0, 0, 0.035]}>
            <planeGeometry args={[1.34, 0.8]} />
            <shaderMaterial
              ref={deskScreenMat}
              vertexShader={screenVertex}
              fragmentShader={screenFragment}
              uniforms={deskScreen}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      </group>

      {/* ── the light trail ── */}
      <mesh ref={trailRef} geometry={trailGeometry} visible={false} frustumCulled={false}>
        <shaderMaterial
          ref={trailMat}
          vertexShader={trailVertex}
          fragmentShader={trailFragment}
          uniforms={trailUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
