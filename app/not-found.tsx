import type { Metadata } from "next";
import { Button8D } from "@/components/ui/Button8D";
import { Eyebrow } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Dropped baton",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="content flex min-h-svh flex-col justify-center">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 42%, rgba(255,90,31,0.14) 0%, transparent 68%)",
        }}
      />

      <div className="shell relative">
        <Eyebrow index="404">Handoff failed</Eyebrow>

        <h1 className="mt-6 max-w-[12ch] text-hero">This baton was dropped.</h1>

        <p className="text-dim mt-7 max-w-[46ch] text-lead">
          Nothing at this address. The work is still on the desk, though — nothing ever left the
          device.
        </p>

        {/* the baton, on the floor, still lit */}
        <div aria-hidden="true" className="relative mt-12 mb-2 w-[13rem]">
          <div
            className="absolute -inset-x-10 -inset-y-8 rounded-full opacity-70 blur-2xl"
            style={{
              background: "radial-gradient(closest-side, rgba(255,90,31,0.42), transparent)",
            }}
          />
          <div
            className="relative h-[3.2rem] w-[13rem] rotate-[-6deg] rounded-full"
            style={{
              background: "linear-gradient(112deg, #241a15 0%, #0d0b0a 46%, #191210 100%)",
              boxShadow:
                "inset 0 2px 10px rgba(255,184,107,0.28), inset 0 -14px 28px rgba(0,0,0,0.75), 0 26px 44px -30px rgba(255,90,31,0.7)",
            }}
          >
            <div
              className="absolute top-1/2 left-[9%] h-[38%] w-[82%] -translate-y-1/2 rounded-full opacity-70 blur-[5px]"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,184,107,0.12) 0%, rgba(255,90,31,0.8) 50%, rgba(255,184,107,0.12) 100%)",
              }}
            />
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button8D href="/" variant="ember" arrow>
            Back to the start
          </Button8D>
          <Button8D href="/desk" variant="ghost">
            Open the desk
          </Button8D>
        </div>
      </div>
    </main>
  );
}
