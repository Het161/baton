"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { damp, journey } from "@/lib/journey";
import { storyTime } from "@/lib/journey";
import { PARTICLE_COOL, PARTICLE_WARM } from "@/lib/temperature";
import type { Quality } from "@/lib/capability";
import { CAMERA_TRACK, layoutForAspect, sampleTrack } from "./choreography";
import { Baton } from "./Baton";
import { DeviceForms } from "./DeviceForms";
import { ParticleField } from "./ParticleField";
import { fogFragment, glowVertex } from "./shaders";

/**
 * A 64×32 canvas gradient promoted to an equirectangular environment map.
 * Gives the glass shell something to refract and the clearcoat something to
 * reflect, with no HDR download and no drei Environment dependency.
 */
function ProceduralEnvironment() {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const base = ctx.createLinearGradient(0, 0, 0, 32);
    base.addColorStop(0, "#2a1810");
    base.addColorStop(0.45, "#0d0b0a");
    base.addColorStop(1, "#05070a");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 64, 32);

    const ember = ctx.createRadialGradient(13, 11, 0, 13, 11, 15);
    ember.addColorStop(0, "rgba(255,124,54,1)");
    ember.addColorStop(1, "rgba(255,124,54,0)");
    ctx.fillStyle = ember;
    ctx.fillRect(0, 0, 64, 32);

    const fill = ctx.createRadialGradient(48, 19, 0, 48, 19, 17);
    fill.addColorStop(0, "rgba(157,184,199,0.75)");
    fill.addColorStop(1, "rgba(157,184,199,0)");
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.environment = texture;

    return () => {
      scene.environment = null;
      texture.dispose();
    };
  }, [scene]);

  return null;
}

/** Camera choreography + pointer parallax. */
function Rig({ drift }: { drift: boolean }) {
  const camera = useThree((state) => state.camera);
  const aspect = useThree((state) => state.viewport.aspect);
  const layout = useMemo(() => layoutForAspect(aspect), [aspect]);
  const target = useRef(new THREE.Vector3());
  const angle = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const pose = sampleTrack(CAMERA_TRACK, storyTime());
    const z = pose.z * layout.zoom;

    // ±3° of lerped parallax. Touch devices get a gentle autonomous drift
    // instead — we never ask for device-orientation permission (§7.1).
    const px = drift ? Math.sin(journey.time * 0.19) * 0.65 : journey.px;
    const py = drift ? Math.cos(journey.time * 0.13) * 0.35 : journey.py;
    const wantY = px * 0.052;
    const wantX = -py * 0.036;
    angle.current.y = damp(angle.current.y, wantY, 4, dt);
    angle.current.x = damp(angle.current.x, wantX, 4, dt);

    camera.position.x = Math.sin(angle.current.y) * z;
    camera.position.y = pose.y + layout.offsetY * 0.5 + Math.sin(angle.current.x) * z;
    camera.position.z = Math.cos(angle.current.y) * z;

    target.current.set(0, layout.offsetY * 0.5, 0);
    camera.lookAt(target.current);
  });

  return null;
}

/** Warm rim + cool fill, both lerped across the temperature shift. */
function Lights() {
  const rim = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);

  const warmRim = useMemo(() => new THREE.Color("#ff7a3c"), []);
  const coolRim = useMemo(() => new THREE.Color("#dfe7ec"), []);
  const warmFill = useMemo(() => new THREE.Color("#5d7c8d"), []);
  const coolFill = useMemo(() => new THREE.Color("#9db8c7"), []);

  useFrame(() => {
    const t = journey.temp;
    if (rim.current) {
      rim.current.color.copy(warmRim).lerp(coolRim, t);
      rim.current.intensity = 2.6 + t * 1.4;
    }
    if (fill.current) {
      fill.current.color.copy(warmFill).lerp(coolFill, t);
      fill.current.intensity = 0.9 + t * 1.1;
    }
    if (ambient.current) ambient.current.intensity = 0.28 + t * 0.9;
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.28} />
      <directionalLight ref={rim} position={[-3.2, 2.4, 1.4]} intensity={2.6} />
      <directionalLight ref={fill} position={[3.4, -1.2, 2.2]} intensity={0.9} />
    </>
  );
}

/** Soft ground fog so the baton reads as sitting in a space, not on nothing. */
function GroundFog() {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTemp: { value: 0 },
      uOpacity: { value: 0.2 },
      uWarm: { value: new THREE.Vector3(...PARTICLE_WARM) },
      uCool: { value: new THREE.Vector3(...PARTICLE_COOL) },
    }),
    [],
  );

  useFrame(() => {
    const u = material.current?.uniforms;
    if (!u) return;
    u.uTemp.value = journey.temp;
    u.uOpacity.value = 0.2 * (1 - journey.temp) * (1 - journey.fade * 0.8);
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.55, -0.4]}>
      <planeGeometry args={[16, 12]} />
      <shaderMaterial
        ref={material}
        vertexShader={glowVertex}
        fragmentShader={fogFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/**
 * Advances the shared clock and owns the canvas's opacity — both the intro
 * fade-in behind the already-painted headline and the dip across the PROBLEM
 * beat. One writer, so the two never fight.
 */
function StageClock() {
  const gl = useThree((state) => state.gl);
  const current = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    journey.time += dt;
    const want = (1 - journey.fade * 0.88) * (1 - journey.exit);
    current.current = damp(current.current, want, 3.4, dt);
    gl.domElement.style.opacity = current.current.toFixed(3);
  });

  return null;
}

export default function Scene({ quality, drift }: { quality: Quality; drift: boolean }) {
  return (
    <>
      <StageClock />
      <Rig drift={drift} />
      <Lights />
      {quality === "high" && <ProceduralEnvironment />}
      <ParticleField quality={quality} />
      <GroundFog />
      <DeviceForms quality={quality} />
      <Baton quality={quality} />
    </>
  );
}
