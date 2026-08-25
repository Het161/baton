/**
 * One pointermove listener and one rAF loop for every magnetic element on the
 * page. Registering each button separately would mean N listeners and N forced
 * reflows per frame; here rects are cached and only invalidated on scroll or
 * resize, and the loop parks itself as soon as everything has settled.
 */

type Entry = {
  el: HTMLElement;
  radius: number;
  strength: number;
  onUpdate: (x: number, y: number) => void;
  cx: number;
  cy: number;
  tx: number;
  ty: number;
  rect: DOMRect | null;
};

const entries = new Set<Entry>();

let pointerX = -9999;
let pointerY = -9999;
let raf = 0;
let rectsDirty = true;
let bound = false;

const EPS = 0.01;

function onPointerMove(event: PointerEvent) {
  if (event.pointerType !== "mouse") return;
  pointerX = event.clientX;
  pointerY = event.clientY;
  start();
}

function invalidate() {
  rectsDirty = true;
  start();
}

function bind() {
  if (bound || typeof window === "undefined") return;
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("scroll", invalidate, { passive: true });
  window.addEventListener("resize", invalidate, { passive: true });
  bound = true;
}

function unbind() {
  if (!bound) return;
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("scroll", invalidate);
  window.removeEventListener("resize", invalidate);
  bound = false;
}

function start() {
  if (!raf && entries.size) raf = requestAnimationFrame(tick);
}

function tick() {
  raf = 0;
  let moving = false;

  // read phase — all rects up front, so writes below never interleave with reads
  if (rectsDirty) {
    for (const entry of entries) entry.rect = entry.el.getBoundingClientRect();
    rectsDirty = false;
  }

  // write phase
  for (const entry of entries) {
    const rect = entry.rect;
    if (rect) {
      const midX = rect.left + rect.width / 2;
      const midY = rect.top + rect.height / 2;
      const dx = pointerX - midX;
      const dy = pointerY - midY;
      // distance measured from the element's edge, not its centre, so wide
      // buttons attract along their whole face
      const edgeX = Math.max(0, Math.abs(dx) - rect.width / 2);
      const edgeY = Math.max(0, Math.abs(dy) - rect.height / 2);
      const dist = Math.hypot(edgeX, edgeY);

      if (dist < entry.radius) {
        const pull = 1 - dist / entry.radius;
        const norm = Math.max(1, Math.hypot(dx, dy));
        entry.tx = (dx / norm) * entry.strength * pull;
        entry.ty = (dy / norm) * entry.strength * pull;
      } else {
        entry.tx = 0;
        entry.ty = 0;
      }
    }

    entry.cx += (entry.tx - entry.cx) * 0.18;
    entry.cy += (entry.ty - entry.cy) * 0.18;

    if (Math.abs(entry.cx - entry.tx) < EPS && Math.abs(entry.cy - entry.ty) < EPS) {
      entry.cx = entry.tx;
      entry.cy = entry.ty;
    } else {
      moving = true;
    }

    entry.onUpdate(entry.cx, entry.cy);
  }

  if (moving) raf = requestAnimationFrame(tick);
}

export function registerMagnet(
  el: HTMLElement,
  onUpdate: (x: number, y: number) => void,
  { radius = 90, strength = 8 }: { radius?: number; strength?: number } = {},
) {
  const entry: Entry = { el, radius, strength, onUpdate, cx: 0, cy: 0, tx: 0, ty: 0, rect: null };
  entries.add(entry);
  rectsDirty = true;
  bind();
  start();

  return () => {
    entries.delete(entry);
    onUpdate(0, 0);
    if (!entries.size) {
      unbind();
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}
