# BATON

**Your phone captures, thinks on-device, and hands the finished work to your desk.**

Pitch site and working prototype for the **iQOO Hackathon 2026 — City Battle 03, Chennai**.
Two surfaces in one Next.js app:

| Route   | What it is                                                                                   |
| ------- | -------------------------------------------------------------------------------------------- |
| `/`     | The pitch. A scroll-driven, 3D, three-act story: **capture → think → handoff**.              |
| `/desk` | The desktop prototype. Where batons land — summary, action items, drafted reply, provenance. |

Embedded in both: a **live on-device demo** that loads a small instruct model into the visitor's
own browser and streams a real run, with a `bytes sent to any server: 0` counter beside it.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm run start
```

Node 20+. No environment variables are required; `NEXT_PUBLIC_SITE_URL` sets the canonical origin
for metadata and Open Graph if you want absolute URLs in a preview deployment.

To open it on your phone, both devices on the same Wi-Fi:

```bash
npx next dev -H 0.0.0.0          # then browse to http://<your-mac-ip>:3000
```

> **On an exFAT volume** (this project lives on an external SSD) Turbopack's on-disk cache writes
> fine on the first run and then fails to reopen on the next one:
> `Failed to open database — invalid digit found in string`. `next.config.ts` turns that cache off
> (`experimental.turbopackFileSystemCacheForDev` / `…ForBuild`) and gives dev its own `distDir`,
> so `dev` and `build` never contend either. You should never need to `rm -rf .next`.
>
> The cost is a cold compile on each start — a few hundred milliseconds here. On an APFS volume you
> can have the cache back with `BATON_FS_CACHE=1 npm run dev`.

---

## The one big idea — "The Handoff"

The whole page is a single continuous handoff. One glowing **baton** is born in the hero, travels
down the page through the three acts, and docks into the desk world. The palette travels with it:
warm ember/near-black at the top (phone, pocket, movement), cooling to porcelain/ice by the
handoff (desk, calm, arrival).

Everything else is deliberately restrained so that one move lands.

### How the story is wired

`lib/journey.ts` holds a **single mutable signal** — `hero`, `act1`, `act2`, `act3`, `temp`,
`fade`, `exit`. `components/story/ScrollDirector.tsx` is the only place that writes to it, from
scrubbed ScrollTriggers; the WebGL scene reads it inside `useFrame`. Scroll values never become
React state, so nothing reconciles at 60 fps.

The four acts run in document order and each saturates before the next begins, so their sum is a
monotonic **0 → 4 story clock**. Every 3D keyframe in `components/three/choreography.ts` is
authored against that clock, including a _hold_ keyframe per act so the baton stays on its mark
while the section is being read and only moves during the crossfade.

Acts are pinned with CSS `position: sticky`, not ScrollTrigger's `pin` — no pin-spacers, no reflow
at trigger boundaries, and the mobile pass is a CSS height change rather than a second timeline.

### The temperature shift

`lib/temperature.ts` precomputes a 61-step lookup table of every design token between the warm and
cool palettes; the ACT III scrub snaps to the nearest step and bails out when it has not changed.

Surfaces ease across, **ink cuts over in one step**. Interpolating both linearly makes foreground
and background meet as the same mid-grey and the copy briefly vanishes; a hard cut as the
background passes 50% lightness keeps contrast at every point of the scroll.

---

## What is real, and what is claimed

This matters more than the visuals, so it is stated plainly:

- **On-device stack.** The phone build targets **LiteRT-LM** (Google's current on-device runtime)
  with a **Gemma 3n E2B/E4B-class** model, NPU-accelerated, with a GGUF/llama.cpp fallback path.
  The deprecated MediaPipe LLM Inference API is not part of this and is never referenced.
- **Office Kit.** There is no public third-party Office Kit API and none is claimed. BATON is
  _designed around_ the flow: what it produces is a file plus a block of text, which is exactly
  what Office Kit's clipboard sync and file drop already carry between an OriginOS 6 phone and a
  desk.
- **Thermals.** On-device AI's real constraint is heat. BATON runs in short bursts and cools
  between them — the workload the iQOO 15's NPU and vapor chamber are built for. Stated as a
  constraint we designed around, not a feature.
- **The browser demo** runs WebLLM over WebGPU, because that is the runtime a browser has. It is
  a demonstration of the same thesis (the model is on the device you are holding), not a claim
  that the phone build uses WebLLM.
- **Zero cloud.** No AI request leaves the device anywhere in this codebase. The only network
  endpoint is `POST /api/waitlist`.

---

## The live demo

`components/demo/DemoPanel.tsx` + `lib/demo/*`.

- Feature-detects WebGPU by **actually requesting an adapter** — `navigator.gpu` existing is not
  the same as WebGPU working.
- **Real mode:** `@mlc-ai/web-llm` running `Llama-3.2-1B-Instruct-q4f16_1` in a **Web Worker**, so
  the decode loop never touches the thread driving the page. Weights (~700 MB) download **only on
  an explicit click**, with a progress bar and a plain-language notice, and are cached in
  IndexedDB by the engine, so a second visit is instant.
- **Decoding is grammar-constrained** to `lib/demo/schema.ts` via XGrammar
  (`response_format: { type: "json_object", schema }`). A 1B model asked politely for three
  sections will happily emit `Owner: Priya` as a summary bullet and put every action on the same
  person; constrained to a schema it cannot — the tokens that would break the shape are not
  sampleable. The prompt is then free to spend its budget on _content_ quality (an explicit owner
  rule plus one worked example), and the card renders from parsed JSON rather than from prose.
- **Simulation mode:** when WebGPU is unavailable — most phones today — the same UI plays a
  pre-written run at a believable token rate, badged `simulated preview` in the panel the whole
  time. Free-pasted text gets an _extractive_ script built from the visitor's own sentences, so it
  is still about what they typed. A real run that fails falls back to simulation mid-click rather
  than stranding anyone on an error.
- `lib/demo/parse.ts` reads the JSON, and keeps a hardened prose parser behind it for the case
  where the grammar cannot be compiled and the engine retries unconstrained. Both paths drop
  degenerate output (bare labels, `Owner:` masquerading as a person) rather than rendering it.
  Output goes through the **same `BatonCard` component `/desk` uses**, then can be handed to the
  desk for real.

---

## Performance

Measured with Lighthouse (mobile preset) against `next start`:

| Page    | Performance | Accessibility | Best practices | SEO | CLS | TBT     |
| ------- | ----------- | ------------- | -------------- | --- | --- | ------- |
| `/`     | 93          | 100           | 100            | 100 | 0   | ~110 ms |
| `/desk` | 96          | 100           | 100            | 100 | 0   | ~30 ms  |

No failing accessibility, SEO or best-practices audits on either route.

- **First-load JS: ~145 KB gzipped**, excluding the lazily-loaded 3D and WebLLM chunks.
- **LCP is the hero headline** (real observed LCP ≈ 1.0 s under 4× CPU / 1.6 Mbps throttling), and
  the canvas fades in behind text that has already painted.
- **GSAP, Lenis, Three/R3F and WebLLM all load after paint.** GSAP is only ever needed inside an
  effect, so importing it lazily keeps ~46 KB off the critical path.
- **The WebGL scene arms on the visitor's first sign of presence** — a scroll, a pointer moving
  over the page, a key, a tap. Building it is one long main-thread task; running it during
  hydration is what makes a page feel dead on a mid-range phone, and it buys nothing, because the
  3D exists to tell a scroll story. Until then the static composition _is_ the design.
- An **FPS governor** samples for two seconds after load and downgrades the render tier **once**,
  silently, if the page is below 45 fps. On the low tier: fewer particles, no transmission, a
  cheaper shell material (shader compilation, not fill rate, is the expensive part), no procedural
  environment.

### Fallbacks (all verified)

| Condition                | What happens                                                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| No WebGL                 | Styled CSS composition with an ember field and a CSS baton. No blank space.                                                                         |
| `prefers-reduced-motion` | No Lenis, no scrubbing, no canvas. Acts become ordinary stacked sections; the temperature snaps at the handoff so the cool zone keeps its contrast. |
| No WebGPU                | Demo runs in badged simulation mode.                                                                                                                |
| Low-end device           | Render tier downgraded once by the FPS governor.                                                                                                    |

---

## Layout

```
app/
  page.tsx              the pitch — warm zone (#story) then the opaque cool zone
  desk/page.tsx         the dashboard prototype
  api/waitlist/route.ts POST { email } — validated, rate-limited, best-effort log
  globals.css           design tokens, the two temperature palettes, the 8D button
  fonts.ts              Technor (variable) · Satoshi · JetBrains Mono, self-hosted
  opengraph-image.jpg   1200×630, rendered from the real type and palette
components/
  three/                one <Canvas> for the whole page — baton, particles, device
                        forms, light trail, camera rig, procedural environment
  story/                ScrollDirector: the only writer of the journey signal
  sections/             hero · problem · three acts · demo · brief · desk · team
  desk/                 Desk shell and BatonCard (shared with the demo)
  demo/                 DemoPanel
  ui/                   Button8D, Reveal, primitives
lib/
  journey.ts            the scroll signal
  temperature.ts        the warm→cool token LUT
  capability.ts         WebGL/WebGPU detection, FPS governor, quality tiers
  demo/                 engine · worker · prompt · parser · samples · simulation
  seed.ts store.ts      six seeded batons, zustand + localStorage
  team.ts               ← drop real names, roles and links in here
```

## Before submitting

- [ ] Put the team's real names, roles and links in `lib/team.ts`.
- [ ] Set `NEXT_PUBLIC_SITE_URL` on the deployment so OG URLs are absolute.
- [ ] Paste the deployed link into WhatsApp and check the card renders.

---

## Notes on the 3D

All geometry is **procedural** — no downloaded models. The baton is a cylinder plus two
hemispherical caps merged into a single buffer; the device forms are extruded rounded-box
profiles; the light trail is a `TubeGeometry` along a Catmull-Rom curve whose shader draws itself
as ACT III scrubs. The environment map is a 64×32 canvas gradient promoted to an equirectangular
texture, so the glass has something to refract with no HDR download.

Two things worth knowing if you touch this code:

1. **R3F hands `ShaderMaterial` its uniforms through the constructor, and three clones them
   there.** Per-frame writes must go through `materialRef.current.uniforms`, never the object you
   passed in — mutating the latter silently does nothing.
2. **`smoothstep(a, b, x)` with `a > b` is undefined in GLSL.** Some drivers return the value you
   expected and some return NaN. Every falloff here is written as `1.0 - smoothstep(lo, hi, x)`.
