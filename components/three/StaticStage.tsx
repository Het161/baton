/**
 * The no-WebGL / reduced-motion / still-loading composition.
 *
 * Deliberately not "a blank space where the 3D should be": a styled ember
 * field with a CSS baton, so the page reads as finished in every failure mode
 * (§7 global rules).
 *
 * Anchored to the first viewport rather than fixed — in the fallback paths
 * there is no travelling baton to follow the scroll, and a fixed blob hanging
 * over the porcelain sections would be worse than no blob at all.
 */
export function StaticStage({ dimmed = false }: { dimmed?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[100svh] overflow-hidden"
      style={{
        opacity: dimmed ? 0 : 1,
        transition: "opacity 700ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 62% at 72% 50%, rgba(255,90,31,0.20) 0%, rgba(255,90,31,0.05) 36%, transparent 68%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 45% at 18% 96%, rgba(255,184,107,0.10) 0%, transparent 68%)",
        }}
      />

      {/* the baton, as CSS — parked where the WebGL one sits in the hero */}
      <div className="absolute top-[26%] left-[70%] -translate-x-1/2 -translate-y-1/2 md:top-1/2 md:left-[72%]">
        <div className="relative">
          <div
            className="absolute -inset-x-24 -inset-y-16 rounded-full opacity-70 blur-3xl"
            style={{
              background: "radial-gradient(closest-side, rgba(255,90,31,0.5), transparent)",
            }}
          />
          <div
            className="relative h-[clamp(9rem,26vh,15rem)] w-[clamp(3.4rem,9vh,4.8rem)] rotate-[14deg] rounded-full"
            style={{
              background: "linear-gradient(158deg, #241a15 0%, #0d0b0a 45%, #191210 100%)",
              boxShadow:
                "inset 0 2px 12px rgba(255,184,107,0.28), inset 0 -18px 36px rgba(0,0,0,0.75), 0 30px 70px -30px rgba(255,90,31,0.5)",
            }}
          >
            <div
              className="absolute top-[10%] bottom-[10%] left-1/2 w-[42%] -translate-x-1/2 rounded-full opacity-80 blur-[6px]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,184,107,0.15) 0%, rgba(255,90,31,0.85) 50%, rgba(255,184,107,0.15) 100%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
