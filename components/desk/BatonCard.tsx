"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button8D } from "@/components/ui/Button8D";
import { cn } from "@/components/ui/primitives";
import { SOURCE_GLYPH, SOURCE_LABEL, type Baton } from "@/lib/types";

type Props = {
  baton: Baton;
  onToggleAction?: (actionId: string) => void;
  onStatus?: (status: Baton["status"]) => void;
  onRunLive?: () => void;
  /** demo output has no desk controls */
  variant?: "desk" | "demo";
  /**
   * Where the card sits in the document outline. On /desk the page heading is
   * the column name, so cards are h2; inside a section that already has an h2
   * they are h3. Section labels follow one level below.
   */
  headingLevel?: 2 | 3;
  className?: string;
};

function useCopy() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard can be blocked by permissions policy — fail quietly, the
      // draft is selectable text either way
      setCopied(false);
    }
  }, []);

  return { copied, copy };
}

export function BatonCard({
  baton,
  onToggleAction,
  onStatus,
  onRunLive,
  variant = "desk",
  headingLevel = 3,
  className,
}: Props) {
  const Title = (headingLevel === 2 ? "h2" : "h3") as "h2" | "h3";
  const SectionLabel = (headingLevel === 2 ? "h3" : "h4") as "h3" | "h4";
  const { copied, copy } = useCopy();
  const done = baton.actions.filter((a) => a.done).length;
  const headingId = `baton-${baton.id}-title`;

  return (
    <article
      aria-labelledby={headingId}
      className={cn(
        "group relative rounded-xl border bg-[rgb(var(--surface)/var(--surface-a))] transition-shadow duration-300",
        "hairline shadow-[0_1px_2px_rgb(var(--line)/0.06),0_12px_28px_-20px_rgb(var(--line)/0.35)]",
        "hover:shadow-[0_1px_2px_rgb(var(--line)/0.08),0_22px_46px_-24px_rgb(var(--line)/0.45)]",
        "focus-within:ring-2 focus-within:ring-[rgb(var(--accent)/0.5)] focus-within:ring-offset-2 focus-within:ring-offset-[rgb(var(--page-bg))]",
        className,
      )}
    >
      {/* ── header ── */}
      <header className="hairline flex flex-wrap items-start gap-x-4 gap-y-2 border-b p-5 sm:p-6">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[rgb(var(--accent)/0.35)] text-[rgb(var(--accent))]"
        >
          {SOURCE_GLYPH[baton.source]}
        </span>

        <div className="min-w-0 flex-1">
          <Title
            id={headingId}
            className="font-display text-[1.05rem] font-[600] tracking-[-0.015em]"
          >
            {baton.title}
          </Title>
          <p className="text-dim mt-1 font-mono text-[11px] tracking-[0.06em]">
            {SOURCE_LABEL[baton.source]} · {baton.dayLabel} {baton.time}
          </p>
        </div>

        {baton.live ? (
          <span className="rounded-full border border-[rgb(var(--accent)/0.5)] px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] text-[rgb(var(--accent))] uppercase">
            live run
          </span>
        ) : (
          <span className="text-dim rounded-full border border-[rgb(var(--line)/var(--line-a))] px-2.5 py-1 font-mono text-[10px] tracking-[0.08em]">
            {baton.transport}
          </span>
        )}
      </header>

      <div className="space-y-6 p-5 sm:p-6">
        {/* ── summary ── */}
        <section>
          <SectionLabel className="eyebrow">Summary</SectionLabel>
          <ul className="mt-3 space-y-2">
            {baton.summary.map((line, i) => (
              <li key={i} className="flex gap-3 text-body">
                <span
                  aria-hidden="true"
                  className="mt-[0.7em] h-px w-3 shrink-0 bg-[rgb(var(--accent))]"
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── action items ── */}
        <section>
          <SectionLabel className="eyebrow flex items-center gap-2">
            Action items
            <span className="text-[rgb(var(--accent))]">
              {done}/{baton.actions.length}
            </span>
          </SectionLabel>
          <ul className="mt-3 space-y-1">
            {baton.actions.map((action) => (
              <li key={action.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 -mx-2 transition-colors",
                    "hover:bg-[rgb(var(--line)/0.05)]",
                    !onToggleAction && "cursor-default",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={action.done}
                    disabled={!onToggleAction}
                    onChange={() => onToggleAction?.(action.id)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[rgb(var(--accent))]"
                  />
                  <span className="min-w-0 text-body">
                    <span className="font-mono text-[11px] tracking-[0.06em] text-[rgb(var(--accent))]">
                      {action.owner}
                    </span>
                    <span aria-hidden="true" className="text-dim mx-2 font-mono text-[11px]">
                      ·
                    </span>
                    <span className={cn(action.done && "text-dim line-through")}>
                      {action.task}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* ── drafted output ── */}
        <section>
          <div className="flex items-center justify-between gap-3">
            <SectionLabel className="eyebrow">Drafted reply</SectionLabel>
            <button
              type="button"
              onClick={() => copy(baton.draft)}
              className="text-dim rounded-md px-2 py-1 font-mono text-[11px] tracking-[0.06em] transition-colors hover:text-[rgb(var(--accent))]"
            >
              {copied ? "copied ✓" : "copy"}
            </button>
          </div>
          <pre className="hairline mt-3 max-h-52 overflow-auto rounded-lg border bg-[rgb(var(--line)/0.035)] p-4 font-sans text-[0.9rem] leading-relaxed whitespace-pre-wrap">
            {baton.draft}
          </pre>
        </section>

        {/* ── provenance ── */}
        <footer className="hairline flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4 font-mono text-[10.5px] tracking-[0.06em]">
          <span className="text-dim">{baton.runtime}</span>
          <span className="text-dim">{baton.model}</span>
          <span className="text-dim">{(baton.wallMs / 1000).toFixed(2)}s</span>
          <span className="text-dim">{baton.tokens} tok</span>
          <span className="ml-auto text-[rgb(var(--accent))]">0 bytes to cloud</span>
        </footer>

        {/* ── desk controls ── */}
        {variant === "desk" && (onStatus || onRunLive) && (
          <div className="flex flex-wrap items-center gap-2">
            {onRunLive && (
              <Button8D variant="ghost" size="sm" onClick={onRunLive}>
                Run live
              </Button8D>
            )}
            {onStatus && baton.status !== "done" && (
              <Button8D variant="ice" size="sm" onClick={() => onStatus("done")}>
                Mark done
              </Button8D>
            )}
            {onStatus && baton.status === "done" && (
              <Button8D variant="ghost" size="sm" onClick={() => onStatus("inbox")}>
                Reopen
              </Button8D>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
