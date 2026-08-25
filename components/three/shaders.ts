/** GLSL for the three custom materials in the scene. Kept in one file so the
 *  ember→ice temperature mix is defined once and shared. */

export const TEMP_MIX = /* glsl */ `
vec3 tempMix(vec3 warm, vec3 cool, float t) {
  return mix(warm, cool, smoothstep(0.0, 1.0, t));
}
`;

/* ── the baton's inner core: emissive, slow 4s pulse, ACT II ripple ── */

export const coreVertex = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vPosL;
varying vec3 vViewDir;

void main() {
  vPosL = position;
  vNormalW = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

export const coreFragment = /* glsl */ `
precision mediump float;

uniform float uTime;
uniform float uPulse;    // 0..1 — ACT II ripple energy
uniform float uTemp;     // 0 warm .. 1 cool
uniform float uOpacity;
uniform float uGain;     // trimmed on the low tier, where the shell is thinner
uniform vec3  uWarm;
uniform vec3  uCool;

varying vec3 vNormalW;
varying vec3 vPosL;
varying vec3 vViewDir;

${TEMP_MIX}

void main() {
  // very slow breathing glow — 4s period, the one permitted loop (§5.4)
  float breathe = 0.84 + 0.16 * sin(uTime * 1.5707963);

  // ripple travelling along the baton's long axis while it is thinking
  float wave = sin(vPosL.y * 9.0 - uTime * 6.0);
  float ripple = uPulse * (0.35 + 0.65 * wave * wave);

  // rim brightening so the core reads as volume, not a flat pill
  float fres = pow(1.0 - clamp(dot(normalize(vNormalW), vViewDir), 0.0, 1.0), 1.6);

  vec3 col = tempMix(uWarm, uCool, uTemp);
  float energy = (breathe * (0.85 + 1.05 * fres) + ripple) * uGain;

  gl_FragColor = vec4(col * energy, uOpacity * clamp(energy, 0.0, 1.4));
}
`;

/* ── the additive glow billboard behind the baton (our only "bloom") ── */

export const glowVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const glowFragment = /* glsl */ `
precision mediump float;

uniform float uTime;
uniform float uTemp;
uniform float uStrength;
uniform vec3  uWarm;
uniform vec3  uCool;

varying vec2 vUv;

${TEMP_MIX}

void main() {
  vec2 p = vUv - 0.5;
  // squashed radial falloff — the glow hugs the capsule's silhouette
  float d = length(vec2(p.x * 1.85, p.y * 0.92));
  float a = 1.0 - smoothstep(0.02, 0.5, d);
  a = pow(a, 2.1);

  float breathe = 0.86 + 0.14 * sin(uTime * 1.5707963);
  vec3 col = tempMix(uWarm, uCool, uTemp);

  gl_FragColor = vec4(col, a * uStrength * breathe);
}
`;

/* ── the drifting particle field ── */

export const particleVertex = /* glsl */ `
precision mediump float;

uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uTemp;
uniform float uDepth;

attribute float aSeed;
attribute float aScale;

varying float vSeed;
varying float vFade;

void main() {
  vSeed = aSeed;

  vec3 pos = position;
  float t = uTime * 0.09 + aSeed * 6.2831853;

  // cheap wander: three offset sines, no CPU work per particle per frame
  pos.x += sin(t * 1.13) * 0.32;
  pos.y += cos(t * 0.87) * 0.28 + mod(uTime * 0.012 + aSeed, 1.0) * 0.0;
  pos.z += sin(t * 0.61) * 0.24;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);

  // fade the field out at the near and far planes so nothing pops in
  float dist = -mv.z;
  vFade = smoothstep(0.4, 2.0, dist) * (1.0 - smoothstep(uDepth * 0.55, uDepth, dist));

  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * aScale * uPixelRatio * (3.4 / max(dist, 0.35));
}
`;

export const particleFragment = /* glsl */ `
precision mediump float;

uniform float uTemp;
uniform float uOpacity;
uniform vec3  uWarm;
uniform vec3  uCool;

varying float vSeed;
varying float vFade;

${TEMP_MIX}

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c);
  if (d > 0.25) discard;

  float a = 1.0 - smoothstep(0.0, 0.25, d);

  // per-particle offset so the field crosses the temperature line as a
  // gradient rather than all at once
  float t = clamp(uTemp * 1.35 - vSeed * 0.35, 0.0, 1.0);
  vec3 col = tempMix(uWarm, uCool, t);

  gl_FragColor = vec4(col, a * vFade * uOpacity * (0.35 + vSeed * 0.65));
}
`;

/* ── the light trail that draws itself from phone-world to desk-world ── */

export const trailVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const trailFragment = /* glsl */ `
precision mediump float;

uniform float uProgress;  // how much of the trail has been drawn
uniform float uTime;
uniform float uTemp;
uniform float uOpacity;
uniform vec3  uWarm;
uniform vec3  uCool;

varying vec2 vUv;

${TEMP_MIX}

void main() {
  // uv.x runs along the tube, uv.y around its circumference
  float x = clamp(vUv.x, 0.0, 1.0);
  float y = clamp(vUv.y, 0.0, 1.0);

  // everything behind the draw front is drawn
  float drawn = 1.0 - smoothstep(uProgress - 0.004, uProgress + 0.004, x);

  // bright head at the draw front
  float head = 1.0 - smoothstep(0.0, 0.07, abs(x - uProgress));

  // travelling dashes behind the head
  float dash = 0.55 + 0.45 * sin(x * 90.0 - uTime * 5.0);

  // brightest along the tube's facing centreline, softer at its silhouette
  float edge = clamp(1.0 - abs(y - 0.5) * 2.0, 0.0, 1.0);

  float a = drawn * (0.5 + 0.4 * dash) * (0.45 + 0.55 * edge) + head * 0.9;

  // Normal blending, not additive: the trail has to stay visible after the
  // page cools, and additive over porcelain is invisible.
  vec3 col = tempMix(uWarm, uCool, uTemp) + head * 0.45;
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uOpacity);
}
`;

/* ── ground fog: a single radial-gradient plane under the scene ── */

export const fogFragment = /* glsl */ `
precision mediump float;

uniform float uTemp;
uniform float uOpacity;
uniform vec3  uWarm;
uniform vec3  uCool;

varying vec2 vUv;

${TEMP_MIX}

void main() {
  vec2 p = vUv - 0.5;
  float d = length(vec2(p.x * 0.85, p.y * 1.6));
  float a = 1.0 - smoothstep(0.05, 0.5, d);
  vec3 col = tempMix(uWarm, uCool, uTemp);
  gl_FragColor = vec4(col, a * a * uOpacity);
}
`;
