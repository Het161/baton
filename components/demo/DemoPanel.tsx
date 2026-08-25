"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button8D } from "@/components/ui/Button8D";
import { cn } from "@/components/ui/primitives";
import { BatonCard } from "@/components/desk/BatonCard";
import { MODEL_SIZE } from "@/lib/demo/engine";
import { SAMPLES } from "@/lib/demo/samples";
import { useDemoRun } from "@/lib/demo/useDemoRun";
import { useDesk } from "@/lib/store";
import type { Baton } from "@/lib/types";

const PHASE_LABEL: Record<string, string> = {
  idle: "ready",
  loading: "loading weights",
  thinking: "prefill",
  streaming: "decoding",
  done: "complete",
  error: "fallback engaged",
};

export function DemoPanel({
  seedInput,
  seedTitle,
  onClose,
}: {
  seedInput?: string;
  seedTitle?: string;
  onClose?: () => void;
}) {
  const demo = useDemoRun(seedInput ?? SAMPLES[0].input);
  const addBaton = useDesk((state) => state.addBaton);
  const [added, setAdded] = useState(false);
  const terminal = useRef<HTMLPreElement>(null);

  // keep the newest tokens in view without hijacking the page scroll
  useEffect(() => {
    const el = terminal.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [demo.stream]);

  const busy = demo.phase === "loading" || demo.phase === "thinking" || demo.phase === "streaming";
  const simulated = demo.mode === "simulated";

  const liveBaton: Baton | null = useMemo(() => {
    if (demo.phase !== "done" || !demo.stats) return null;
    const { summary, actions, draft } = demo.parsed;
    if (!summary.length && !actions.length && !draft) return null;
    return {
      id: `live-${demo.stats.wallMs.toFixed(0)}-${actions.length}`,
      title: seedTitle ?? "Live run in your browser",
      source: "text",
      dayLabel: "Just now",
      time: "",
      raw: demo.input,
      summary,
      actions,
      draft,
      model: simulated ? "scripted preview" : demo.modelLabel,
      runtime: simulated
        ? "simulation"
        : demo.stats.constrained
          ? "WebLLM · WebGPU · schema-constrained"
          : "WebLLM · WebGPU",
      wallMs: demo.stats.wallMs,
      tokens: demo.stats.tokens,
      transport: "clipboard sync",
      status: "inbox",
      live: true,
    };
  }, [demo.input, demo.modelLabel, demo.parsed, demo.phase, demo.stats, seedTitle, simulated]);

  return (
    <div className="hairline overflow-hidden rounded-2xl border bg-[rgb(var(--surface)/var(--surface-a))]">
      {/* ── status bar ── */}
      <div className="hairline flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3 sm:px-6">
        <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.08em]">
          <span
            aria-hidden="true"
            className={cn(
              "h-2 w-2 rounded-full",
              busy
                ? "animate-pulse bg-[rgb(var(--accent))]"
                : demo.phase === "done"
                  ? "bg-[rgb(var(--accent))]"
                  : "bg-[rgb(var(--line)/0.5)]",
            )}
          />
          <span role="status">{PHASE_LABEL[demo.phase] ?? demo.phase}</span>
        </span>

        <span className="text-dim font-mono text-[11px] tracking-[0.06em]">
          {demo.mode === "unknown"
            ? "detecting webgpu…"
            : simulated
              ? "simulated preview"
              : demo.modelLabel}
        </span>

        <span className="ml-auto font-mono text-[11px] tracking-[0.06em] text-[rgb(var(--accent))]">
          bytes sent to any server: 0
        </span>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-dim rounded-md px-2 py-1 font-mono text-[11px] tracking-[0.08em] transition-colors hover:text-[rgb(var(--fg))]"
          >
            close ✕
          </button>
        )}
      </div>

      {/* honesty badge — always visible in simulation mode */}
      {simulated && (
        <p className="border-b border-[rgb(var(--accent)/0.25)] bg-[rgb(var(--accent)/0.07)] px-4 py-3 font-mono text-[11px] leading-relaxed tracking-[0.04em] sm:px-6">
          <span className="text-[rgb(var(--accent))]">simulated preview</span>
          <span className="text-dim">
            {" "}
            — a full local run needs WebGPU (desktop Chrome or Edge). Everything below plays the
            same pipeline against the same inputs; no model is loaded on this device.
          </span>
        </p>
      )}

      <div className="grid gap-px md:grid-cols-2">
        {/* ── input ── */}
        <div className="p-4 sm:p-6">
          <h3 className="eyebrow">Capture</h3>

          <div className="mt-3 flex flex-wrap gap-2">
            {SAMPLES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => demo.pickSample(sample.id)}
                aria-pressed={demo.sampleId === sample.id}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-[0.05em] transition-colors",
                  demo.sampleId === sample.id
                    ? "border-[rgb(var(--accent)/0.6)] text-[rgb(var(--accent))]"
                    : "hairline text-dim hover:border-[rgb(var(--accent)/0.4)]",
                )}
              >
                {sample.label}
                <span className="ml-2 opacity-60">{sample.meta}</span>
              </button>
            ))}
          </div>

          <label htmlFor="demo-input" className="sr-only">
            Text to process on this device
          </label>
          <textarea
            id="demo-input"
            value={demo.input}
            onChange={(event) => demo.editInput(event.target.value)}
            rows={9}
            spellCheck={false}
            className="hairline mt-4 w-full resize-y rounded-lg border bg-[rgb(var(--line)/0.035)] p-4 font-mono text-[12.5px] leading-relaxed focus-visible:border-[rgb(var(--accent)/0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))]"
            placeholder="Paste a messy voice-note transcript, meeting notes, or a whiteboard dump…"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button8D variant="ember" onClick={busy ? demo.cancel : demo.run} arrow={!busy}>
              {busy ? "Stop" : "Think on this device"}
            </Button8D>
            <span className="text-dim font-mono text-[11px] tracking-[0.05em]">
              {demo.input.trim().length} chars
            </span>
          </div>

          {demo.mode === "device" && !demo.engineReady && (
            <p className="text-dim mt-4 max-w-[46ch] font-mono text-[11px] leading-relaxed tracking-[0.03em]">
              First run downloads the model once — {MODEL_SIZE}, cached in your browser, used
              entirely on this device. Nothing you type is uploaded.
            </p>
          )}
        </div>

        {/* ── output ── */}
        <div className="bg-[rgb(var(--line)/0.03)] p-4 sm:p-6">
          <h3 className="eyebrow flex items-center gap-3">
            Output
            {demo.stats && (
              <span className="text-[rgb(var(--accent))]">
                {demo.stats.tokensPerSecond.toFixed(1)} tok/s ·{" "}
                {(demo.stats.wallMs / 1000).toFixed(2)}s
              </span>
            )}
          </h3>

          {/* model download progress */}
          {demo.phase === "loading" && (
            <div className="mt-4">
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-[rgb(var(--line)/0.15)]"
                role="progressbar"
                aria-valuenow={Math.round(demo.load.progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Model download progress"
              >
                <div
                  className="h-full rounded-full bg-[rgb(var(--accent))] transition-[width] duration-300"
                  style={{ width: `${Math.max(2, demo.load.progress * 100).toFixed(1)}%` }}
                />
              </div>
              <p className="text-dim mt-3 font-mono text-[11px] break-words">{demo.load.text}</p>
            </div>
          )}

          {/* streaming terminal */}
          {(demo.phase === "thinking" || demo.phase === "streaming" || !liveBaton) && (
            <pre
              ref={terminal}
              aria-hidden="true"
              className="hairline mt-4 h-64 overflow-auto rounded-lg border bg-[#0b0a0a] p-4 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-[#ede9e1]"
            >
              {demo.stream || (
                <span className="opacity-45">
                  {demo.phase === "thinking"
                    ? "prefill…"
                    : "Pick a capture on the left, then press “Think on this device”."}
                </span>
              )}
              {busy && <span className="ml-0.5 inline-block animate-pulse">▋</span>}
            </pre>
          )}

          {/* finished run, rendered as the same card the desk uses */}
          {liveBaton && (
            <div className="mt-4">
              <BatonCard baton={liveBaton} variant="demo" />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button8D
                  variant="ice"
                  size="sm"
                  onClick={() => {
                    addBaton(liveBaton);
                    setAdded(true);
                  }}
                  disabled={added}
                >
                  {added ? "Handed to the desk ✓" : "Hand off to the desk"}
                </Button8D>
                {added && (
                  <a
                    href="/desk"
                    className="font-mono text-[11px] tracking-[0.06em] text-[rgb(var(--accent))] underline underline-offset-4"
                  >
                    open the desk →
                  </a>
                )}
              </div>
            </div>
          )}

          {demo.error && (
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-[rgb(var(--accent))]">
              local run unavailable ({demo.error.slice(0, 120)}) — switched to simulated preview.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
