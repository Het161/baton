import { Eyebrow, Section } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";

const CRITERIA = [
  {
    n: "01",
    name: "Phone-first execution",
    answer:
      "The phone is not a remote control for a laptop app — it is where capture, inference and packaging all happen. The desktop only receives.",
  },
  {
    n: "02",
    name: "AI integration",
    answer:
      "A local LLM on LiteRT-LM doing transcription, extraction and drafting, NPU-accelerated, with a GGUF/llama.cpp fallback path. Nothing calls a cloud model.",
  },
  {
    n: "03",
    name: "Office Kit usage",
    answer:
      "BATON's output is deliberately shaped as a file plus a text block, so it travels on Office Kit's own clipboard sync and file drop. Designed around the flow, not around an API.",
  },
  {
    n: "04",
    name: "Real-world relevance",
    answer:
      "Every knowledge worker already captures on a phone and re-types at a desk. This removes the re-typing, and it keeps working in a basement, a flight, or an NDA meeting.",
  },
  {
    n: "05",
    name: "Final pitch quality",
    answer:
      "You are reading it. The demo above runs a real model in your browser rather than showing a video of one.",
  },
];

/**
 * The scoring homework, done for the committee. Quiet, editorial, one line per
 * published criterion — no adjectives, no claims we cannot show.
 */
export function WhyWins() {
  return (
    <Section id="why" labelledBy="why-title">
      <div className="shell">
        <Reveal>
          <Eyebrow index="05">Against the brief</Eyebrow>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 id="why-title" className="mt-6 max-w-[20ch] text-h2">
            The five things this is judged on.
          </h2>
        </Reveal>

        <Reveal stagger className="mt-12 md:mt-16">
          <dl>
            {CRITERIA.map((row) => (
              <div
                key={row.n}
                data-reveal-item
                className="hairline grid gap-x-8 gap-y-2 border-t py-7 md:grid-cols-12 md:py-8"
              >
                <dt className="md:col-span-4">
                  <span className="eyebrow flex items-center gap-3">
                    <span className="text-[rgb(var(--accent))]">{row.n}</span>
                  </span>
                  <span className="font-display mt-2 block text-h3">{row.name}</span>
                </dt>
                <dd className="text-dim max-w-[60ch] text-body md:col-span-7 md:col-start-6 md:self-center">
                  {row.answer}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </Section>
  );
}
