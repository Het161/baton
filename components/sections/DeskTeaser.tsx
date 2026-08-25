import { BatonCard } from "@/components/desk/BatonCard";
import { Button8D } from "@/components/ui/Button8D";
import { Eyebrow, Section } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";
import { SEED_BATONS } from "@/lib/seed";

/**
 * Not screenshots — the real cards, rendered from the same data and the same
 * component /desk uses, inside a window frame. They cannot drift out of date.
 */
export function DeskTeaser() {
  const preview = SEED_BATONS.slice(0, 2);

  return (
    <Section id="desk-teaser" labelledBy="desk-teaser-title">
      <div className="shell">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <Reveal>
              <Eyebrow index="06">The desk</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 id="desk-teaser-title" className="mt-6 text-h2">
                Where the batons land.
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="text-dim mt-6 max-w-[40ch] text-lead">
                An inbox of finished work rather than raw material. Every card arrived from a phone
                with its summary, its actions and its draft already written, and carries the
                transport it came in on.
              </p>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="mt-8">
                <Button8D href="/desk" variant="ice" size="lg" arrow>
                  Open the desk
                </Button8D>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="md:col-span-7">
            <div className="hairline overflow-hidden rounded-2xl border bg-[rgb(var(--line)/0.04)] shadow-[0_30px_80px_-50px_rgb(var(--line)/0.6)]">
              <div className="hairline flex items-center gap-2 border-b px-4 py-3">
                <span aria-hidden="true" className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--line)/0.22)]" />
                  ))}
                </span>
                <span className="text-dim ml-2 font-mono text-[11px] tracking-[0.06em]">
                  baton — desk
                </span>
              </div>

              {/* a real render of the real component — `inert` keeps its
                  checkboxes and buttons out of the tab order and the a11y
                  tree, since this is a picture of the desk, not the desk */}
              <div
                className="max-h-[30rem] space-y-4 overflow-hidden p-4 sm:p-5"
                aria-hidden="true"
                inert
              >
                {preview.map((baton) => (
                  <BatonCard key={baton.id} baton={baton} variant="demo" />
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
