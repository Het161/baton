import { Waitlist } from "./Waitlist";

const LINKS = [
  { label: "The desk", href: "/desk" },
  { label: "Live demo", href: "/#live-demo" },
  { label: "Against the brief", href: "/#why" },
];

export function SiteFooter() {
  return (
    <footer className="relative pt-[clamp(4rem,10vh,7rem)] pb-10">
      <div className="shell">
        <div className="hairline grid gap-10 border-t pt-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-display text-[1.6rem] font-[800] tracking-[-0.03em]">
              BATON
              <span
                aria-hidden="true"
                className="ml-2 inline-block h-2 w-2 rounded-full bg-[rgb(var(--accent))] align-middle"
              />
            </p>
            <p className="text-dim mt-4 max-w-[34ch] text-body">
              Your phone captures, thinks on-device, and hands finished work to your desk.
            </p>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="eyebrow transition-colors hover:text-[rgb(var(--accent))]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-6 md:col-start-7">
            <Waitlist />
          </div>
        </div>

        <div className="hairline mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-6 font-mono text-[11px] tracking-[0.06em]">
          <span className="text-dim">Built for iQOO Hackathon 2026 · Chennai Battle</span>
          <span className="text-dim">on-device · 0 bytes to cloud · offline-first</span>
          <span className="text-dim ml-auto">
            Office Kit is a VIVO/OriginOS feature; BATON is designed around its flows and is not
            affiliated with or endorsed by iQOO or VIVO.
          </span>
        </div>
      </div>
    </footer>
  );
}
