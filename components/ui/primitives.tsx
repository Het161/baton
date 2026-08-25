import type { ReactNode } from "react";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Mono, uppercase, wide-tracked label. The connective tissue of the whole page. */
export function Eyebrow({
  children,
  className,
  index,
}: {
  children: ReactNode;
  className?: string;
  index?: string;
}) {
  return (
    <p className={cn("eyebrow flex items-center gap-3", className)}>
      {index && (
        <>
          <span className="text-[rgb(var(--accent))]">{index}</span>
          <span aria-hidden="true" className="h-px w-8 bg-[rgb(var(--line)/var(--line-a))]" />
        </>
      )}
      <span>{children}</span>
    </p>
  );
}

/** Small mono chip used for spec callouts and pillar tags. */
export function Chip({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "accent";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] whitespace-nowrap",
        tone === "accent"
          ? "border-[rgb(var(--accent)/0.45)] text-[rgb(var(--accent))]"
          : "border-[rgb(var(--line)/var(--line-a))] text-[rgb(var(--fg-dim)/var(--fg-dim-a))]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Section container with consistent rhythm. */
export function Section({
  id,
  children,
  className,
  labelledBy,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("relative py-[clamp(5rem,12vh,9rem)]", className)}
    >
      {children}
    </section>
  );
}

/**
 * Divider between dark-zone sections — a thin ember light-line that reads as
 * the baton's trail carrying on between acts (§7.4).
 */
export function TrailDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("shell", className)}>
      <div className="relative h-px w-full bg-[rgb(var(--line)/var(--line-a))]">
        <span className="absolute top-1/2 left-0 h-[3px] w-24 -translate-y-1/2 rounded-full bg-[rgb(var(--accent))] opacity-70 blur-[2px]" />
        <span className="absolute top-1/2 left-0 h-px w-24 -translate-y-1/2 bg-[rgb(var(--accent))]" />
      </div>
    </div>
  );
}
