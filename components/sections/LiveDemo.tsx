"use client";

import dynamic from "next/dynamic";
import { Eyebrow, Section } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";

const DemoPanel = dynamic(() => import("@/components/demo/DemoPanel").then((m) => m.DemoPanel), {
  ssr: false,
  loading: () => (
    <div
      className="hairline h-[32rem] animate-pulse rounded-2xl border bg-[rgb(var(--surface)/var(--surface-a))]"
      aria-hidden="true"
    />
  ),
});

export function LiveDemo() {
  return (
    <Section id="live-demo" labelledBy="demo-title">
      <div className="shell">
        <Reveal>
          <Eyebrow index="04">Live demo</Eyebrow>
        </Reveal>

        <div className="mt-6 grid gap-8 md:grid-cols-12">
          <Reveal className="md:col-span-6">
            <h2 id="demo-title" className="text-h2">
              Don&apos;t take our word. Watch your own browser think.
            </h2>
          </Reveal>
          <Reveal delay={0.06} className="md:col-span-5 md:col-start-8 md:self-end">
            <p className="text-dim text-lead">
              A small instruct model loads into this page and runs on your GPU. Same shape as the
              phone build — capture in, structured work out, nothing over the network.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-10">
          <DemoPanel />
        </Reveal>

        <Reveal delay={0.05}>
          <p className="text-dim mt-6 max-w-[70ch] font-mono text-[11px] leading-relaxed tracking-[0.04em]">
            On the phone the same job runs on LiteRT-LM with a Gemma 3n-class model on the NPU. In a
            browser we use WebLLM over WebGPU, because that is the runtime a browser has — the
            thesis being demonstrated is the same one: the model is on the device you are holding.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
