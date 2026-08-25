"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { canRunWebGPU } from "@/lib/capability";
import { getEngine, MODEL_LABEL, runOnDevice, type LoadProgress } from "./engine";
import { parseRun, type ParsedRun } from "./parse";
import { improviseScript, SAMPLES } from "./samples";
import { simulateStream } from "./simulate";

export type Phase = "idle" | "loading" | "thinking" | "streaming" | "done" | "error";
export type Mode = "device" | "simulated" | "unknown";

export type RunStats = {
  tokens: number;
  wallMs: number;
  tokensPerSecond: number;
  /** true when decoding was constrained to the run schema */
  constrained?: boolean;
};

export function useDemoRun(initialInput = SAMPLES[0].input) {
  const [mode, setMode] = useState<Mode>("unknown");
  const [phase, setPhase] = useState<Phase>("idle");
  const [input, setInput] = useState(initialInput);
  const [sampleId, setSampleId] = useState<string | null>(SAMPLES[0].id);
  const [stream, setStream] = useState("");
  const [stats, setStats] = useState<RunStats | null>(null);
  const [load, setLoad] = useState<LoadProgress>({ progress: 0, text: "" });
  const [error, setError] = useState<string | null>(null);
  const [engineReady, setEngineReady] = useState(false);

  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    let alive = true;
    canRunWebGPU().then((ok) => {
      if (alive) setMode(ok ? "device" : "simulated");
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(
    () => () => {
      abort.current?.abort();
    },
    [],
  );

  const parsed: ParsedRun = useMemo(() => parseRun(stream), [stream]);

  const pickSample = useCallback((id: string) => {
    const sample = SAMPLES.find((s) => s.id === id);
    if (!sample) return;
    setSampleId(sample.id);
    setInput(sample.input);
    setStream("");
    setStats(null);
    setPhase("idle");
    setError(null);
  }, []);

  const editInput = useCallback((value: string) => {
    setInput(value);
    setSampleId(null);
    setStream("");
    setStats(null);
    setPhase("idle");
  }, []);

  const cancel = useCallback(() => {
    abort.current?.abort();
    setPhase((current) => (current === "done" ? current : "idle"));
  }, []);

  const runSimulated = useCallback(
    async (controller: AbortController) => {
      setPhase("streaming");
      const sample = SAMPLES.find((s) => s.id === sampleId);
      const script = sample ? sample.scripted : improviseScript(input);
      const result = await simulateStream(script, setStream, controller.signal);
      if (controller.signal.aborted) return;
      setStats(result);
      setPhase("done");
    },
    [input, sampleId],
  );

  const run = useCallback(async () => {
    if (!input.trim()) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;

    setStream("");
    setStats(null);
    setError(null);

    if (mode !== "device") {
      await runSimulated(controller);
      return;
    }

    // ── real on-device path ──
    try {
      if (!engineReady) {
        setPhase("loading");
        setLoad({ progress: 0, text: "requesting weights…" });
      }
      const engine = await getEngine(setLoad);
      if (controller.signal.aborted) return;
      setEngineReady(true);

      setPhase("thinking");
      let firstToken = true;
      const result = await runOnDevice(engine, input, {
        signal: controller.signal,
        onToken: (text) => {
          if (firstToken) {
            firstToken = false;
            setPhase("streaming");
          }
          setStream(text);
        },
      });
      if (controller.signal.aborted) return;
      setStats(result);
      setPhase("done");
    } catch (cause) {
      if (controller.signal.aborted) return;
      // A failed local run must never become a broken demo. Switch to the
      // simulated engine, say so, and keep going in the same click — the
      // visitor should not have to press the button twice to see anything.
      setError(cause instanceof Error ? cause.message : String(cause));
      setMode("simulated");
      setStream("");
      await runSimulated(controller);
    }
  }, [engineReady, input, mode, runSimulated]);

  return {
    mode,
    phase,
    input,
    sampleId,
    stream,
    parsed,
    stats,
    load,
    error,
    engineReady,
    modelLabel: MODEL_LABEL,
    run,
    cancel,
    pickSample,
    editInput,
    setInput,
  };
}
