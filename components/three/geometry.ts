import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * A capsule built from a cylinder plus two hemispherical caps and merged into
 * a single buffer — one draw call, and no reliance on CapsuleGeometry's
 * availability. This is the baton.
 */
export function makeCapsule(radius: number, length: number, radialSegments = 40, capSegments = 16) {
  const half = length / 2;

  const body = new THREE.CylinderGeometry(radius, radius, length, radialSegments, 1, true);

  const top = new THREE.SphereGeometry(
    radius,
    radialSegments,
    capSegments,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );
  top.translate(0, half, 0);

  const bottom = new THREE.SphereGeometry(
    radius,
    radialSegments,
    capSegments,
    0,
    Math.PI * 2,
    Math.PI / 2,
    Math.PI / 2,
  );
  bottom.translate(0, -half, 0);

  const merged = mergeGeometries([body, top, bottom], false);
  body.dispose();
  top.dispose();
  bottom.dispose();

  merged.computeBoundingSphere();
  return merged;
}

/** Rounded-box profile used for the abstract phone and laptop forms. */
export function makeRoundedBox(w: number, h: number, d: number, radius: number, segments = 3) {
  const r = Math.min(radius, Math.min(w, h, d) / 2);
  const shape = new THREE.Shape();
  const x = -w / 2 + r;
  const y = -h / 2 + r;
  const ew = w - r * 2;
  const eh = h - r * 2;

  shape.moveTo(x, -h / 2);
  shape.lineTo(x + ew, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, y);
  shape.lineTo(w / 2, y + eh);
  shape.quadraticCurveTo(w / 2, h / 2, x + ew, h / 2);
  shape.lineTo(x, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, y + eh);
  shape.lineTo(-w / 2, y);
  shape.quadraticCurveTo(-w / 2, -h / 2, x, -h / 2);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(d - r * 0.6, 0.001),
    bevelEnabled: true,
    bevelThickness: r * 0.3,
    bevelSize: r * 0.3,
    bevelSegments: segments,
    curveSegments: segments * 3,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}
