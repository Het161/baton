import { Eyebrow, Section } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";

const LINES = [
  {
    head: "Voice notes you never replay.",
    body: "The idea was clear for ninety seconds in traffic. It has been in the recorder for three weeks.",
  },
  {
    head: "Whiteboard photos rotting in the gallery.",
    body: "Eleven megapixels of someone else's handwriting, filed between a lunch receipt and a dog.",
  },
  {
    head: "The same thoughts, retyped at a laptop.",
    body: "The capture took four seconds. Turning it into work takes forty minutes, later, from memory.",
  },
];

/**
 * No 3D here on purpose — the stage dims across this section (ScrollDirector
 * writes `journey.fade`) so ACT I lands harder when it comes back.
 */
export function Problem() {
  return (
    <Section id="problem" labelledBy="problem-title" className="pt-[clamp(6rem,18vh,12rem)]">
      <div className="shell">
        <Reveal>
          <Eyebrow index="02">The problem</Eyebrow>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 id="problem-title" className="mt-6 max-w-[17ch] text-h2">
            Everything you capture on your phone dies on your phone.
          </h2>
        </Reveal>

        <Reveal stagger className="mt-14 grid gap-px md:mt-20 md:grid-cols-3">
          {LINES.map((line, i) => (
            <div
              key={line.head}
              data-reveal-item
              className="hairline border-t py-8 md:border-l md:px-7 md:first:border-l-0 md:first:pl-0"
            >
              <p className="eyebrow text-[rgb(var(--accent))]">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-5 text-h3">{line.head}</p>
              <p className="text-dim mt-3 max-w-[38ch] text-body">{line.body}</p>
            </div>
          ))}
        </Reveal>

        <Reveal delay={0.1}>
          <p className="text-dim mt-14 max-w-[52ch] border-l-2 border-[rgb(var(--accent))] pl-5 text-lead">
            Cloud assistants solve the second half of this. They also need a signal, a subscription,
            and permission to read everything you said.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
