"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button8D } from "@/components/ui/Button8D";
import { cn } from "@/components/ui/primitives";
import { rehydrateDesk, useDesk } from "@/lib/store";
import { setZone } from "@/lib/temperature";
import type { Baton, BatonStatus } from "@/lib/types";
import { BatonCard } from "./BatonCard";

const DemoPanel = dynamic(() => import("@/components/demo/DemoPanel").then((m) => m.DemoPanel), {
  ssr: false,
});

const RAIL: { id: BatonStatus; label: string; hint: string }[] = [
  { id: "inbox", label: "Inbox", hint: "Landed, not triaged" },
  { id: "today", label: "Today", hint: "Working on now" },
  { id: "done", label: "Done", hint: "Closed out" },
];

export function Desk() {
  const batons = useDesk((state) => state.batons);
  const toggleAction = useDesk((state) => state.toggleAction);
  const setStatus = useDesk((state) => state.setStatus);
  const resetDesk = useDesk((state) => state.resetDesk);

  const [filter, setFilter] = useState<BatonStatus>("inbox");
  const [runTarget, setRunTarget] = useState<Baton | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  // /desk is the cool zone and has no WebGL — lock the palette on entry and
  // hand it back to the pitch page on exit
  useEffect(() => {
    rehydrateDesk();
    setZone("cool");
    return () => setZone("warm");
  }, []);

  const counts = useMemo(() => {
    const base: Record<BatonStatus, number> = { inbox: 0, today: 0, done: 0 };
    for (const baton of batons) base[baton.status] += 1;
    return base;
  }, [batons]);

  const visible = useMemo(
    () => batons.filter((baton) => baton.status === filter),
    [batons, filter],
  );

  const closeRun = useCallback(() => {
    setRunTarget(null);
    opener.current?.focus();
  }, []);

  useEffect(() => {
    if (!runTarget) return;
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRun();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [runTarget, closeRun]);

  return (
    <div className="min-h-svh">
      {/* ── top bar ── */}
      <header className="hairline sticky top-0 z-20 border-b bg-[rgb(var(--page-bg)/0.85)] backdrop-blur-lg">
        <div className="shell flex items-center gap-4 py-4">
          <Link href="/" className="font-display text-[1.05rem] font-[800] tracking-[-0.02em]">
            BATON
            <span
              aria-hidden="true"
              className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))] align-middle"
            />
          </Link>
          <span className="text-dim font-mono text-[11px] tracking-[0.1em] uppercase">desk</span>
          <Link
            href="/"
            className="eyebrow ml-auto transition-colors hover:text-[rgb(var(--accent))]"
          >
            ← Back to the pitch
          </Link>
        </div>
      </header>

      <div className="shell grid gap-10 py-10 lg:grid-cols-12 lg:gap-14">
        {/* ── rail ── */}
        <nav aria-label="Baton status" className="lg:col-span-3">
          <ul className="flex gap-2 lg:sticky lg:top-24 lg:flex-col lg:gap-1">
            {RAIL.map((item) => {
              const active = filter === item.id;
              return (
                <li key={item.id} className="flex-1 lg:flex-none">
                  <button
                    type="button"
                    onClick={() => setFilter(item.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "hairline w-full rounded-lg border px-4 py-3 text-left transition-colors",
                      active
                        ? "border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--accent)/0.07)]"
                        : "hover:bg-[rgb(var(--line)/0.05)]",
                    )}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-[1rem] font-[600]">{item.label}</span>
                      <span
                        className={cn(
                          "font-mono text-[11px]",
                          active ? "text-[rgb(var(--accent))]" : "text-dim",
                        )}
                      >
                        {counts[item.id]}
                      </span>
                    </span>
                    <span className="text-dim mt-1 hidden font-mono text-[10.5px] tracking-[0.05em] lg:block">
                      {item.hint}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 hidden lg:block">
            <p className="text-dim font-mono text-[10.5px] leading-relaxed tracking-[0.05em]">
              Every card here arrived from a phone through the Office Kit flow. Nothing on this
              screen was generated in the cloud.
            </p>
            <button
              type="button"
              onClick={resetDesk}
              className="text-dim mt-4 font-mono text-[11px] tracking-[0.06em] underline underline-offset-4 transition-colors hover:text-[rgb(var(--accent))]"
            >
              reset demo data
            </button>
          </div>
        </nav>

        {/* ── list ── */}
        <main className="lg:col-span-9">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-h2">
              {RAIL.find((r) => r.id === filter)?.label}
              <span className="text-dim ml-3 font-mono text-[0.9rem] tracking-[0.06em]">
                {visible.length}
              </span>
            </h1>
          </div>

          {visible.length === 0 ? (
            <div className="hairline mt-8 rounded-xl border border-dashed p-12 text-center">
              <p className="font-display text-h3">Nothing here.</p>
              <p className="text-dim mx-auto mt-3 max-w-[36ch] text-body">
                {filter === "done"
                  ? "Close something out and it lands here."
                  : "Capture on your phone and the next baton arrives in this column."}
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {visible.map((baton) => (
                <BatonCard
                  key={baton.id}
                  baton={baton}
                  onToggleAction={(actionId) => toggleAction(baton.id, actionId)}
                  headingLevel={2}
                  onStatus={(status) => setStatus(baton.id, status)}
                  onRunLive={() => {
                    opener.current = document.activeElement as HTMLElement;
                    setRunTarget(baton);
                  }}
                />
              ))}
            </div>
          )}

          <div className="mt-10 lg:hidden">
            <Button8D variant="ghost" size="sm" onClick={resetDesk}>
              Reset demo data
            </Button8D>
          </div>
        </main>
      </div>

      {/* ── live run overlay ── */}
      {runTarget && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-[rgb(var(--page-bg)/0.86)] p-4 backdrop-blur-md sm:p-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRun();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Run ${runTarget.title} on this device`}
            tabIndex={-1}
            className="mx-auto max-w-4xl outline-none"
          >
            <DemoPanel
              seedInput={runTarget.raw}
              seedTitle={`Live re-run — ${runTarget.title}`}
              onClose={closeRun}
            />
          </div>
        </div>
      )}
    </div>
  );
}
