import { Eyebrow, Section } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";
import { TEAM, TEAM_META } from "@/lib/team";

export function Team() {
  return (
    <Section id="team" labelledBy="team-title">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal>
              <Eyebrow index="07">Team</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 id="team-title" className="mt-6 max-w-[16ch] text-h2">
                Two people, thirty hours, one relay.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.08}>
            <p className="text-dim font-mono text-[11px] leading-relaxed tracking-[0.06em]">
              {TEAM_META.event}
              <br />
              {TEAM_META.city} · {TEAM_META.dates}
            </p>
          </Reveal>
        </div>

        {/* one column per member — two of them share the row cleanly */}
        <Reveal stagger className="mt-12 grid gap-px sm:grid-cols-2">
          {TEAM.map((member, i) => (
            <div
              key={member.id}
              data-reveal-item
              className="hairline border-t py-7 sm:border-l sm:px-8 sm:first:border-l-0 sm:first:pl-0"
            >
              <p className="eyebrow text-[rgb(var(--accent))]">{String(i + 1).padStart(2, "0")}</p>
              <p className="font-display mt-4 text-h3">
                {member.name || <span className="text-dim">Name</span>}
              </p>
              <p className="text-dim mt-1 font-mono text-[11px] tracking-[0.06em]">{member.role}</p>
              {member.focus && (
                <p className="text-dim mt-4 max-w-[42ch] text-[0.9rem] leading-relaxed">
                  {member.focus}
                </p>
              )}
              {member.links?.length ? (
                <ul className="mt-4 flex flex-wrap gap-3">
                  {member.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="font-mono text-[11px] tracking-[0.06em] text-[rgb(var(--accent))] underline underline-offset-4"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
