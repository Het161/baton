"use client";

import type { MLCEngineInterface } from "@mlc-ai/web-llm";
import { buildMessages, GENERATION, RESPONSE_FORMAT } from "./prompt";

/**
 * Llama 3.2 1B at q4f16 — about 700 MB on the wire, ~880 MB of VRAM. Small
 * enough that a laptop iGPU finishes a run in seconds, which is the whole
 * point of the demo.
 */
export const MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
export const MODEL_LABEL = "Llama 3.2 1B Instruct · q4f16";
export const MODEL_SIZE = "~700 MB";

export type LoadProgress = { progress: number; text: string };

let enginePromise: Promise<MLCEngineInterface> | null = null;
let worker: Worker | null = null;

/**
 * Loads the runtime and weights. Never called on page load — only from an
 * explicit user action (§9) — and cached in IndexedDB by the engine itself, so
 * a repeat visit skips the download entirely.
 */
export async function getEngine(onProgress: (p: LoadProgress) => void) {
  if (enginePromise) return enginePromise;

  enginePromise = (async () => {
    const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");

    worker = new Worker(new URL("./webllm.worker.ts", import.meta.url), { type: "module" });

    return CreateWebWorkerMLCEngine(worker, MODEL_ID, {
      initProgressCallback: (report) => {
        onProgress({ progress: report.progress ?? 0, text: report.text ?? "" });
      },
    });
  })();

  try {
    return await enginePromise;
  } catch (error) {
    // let a later attempt retry from scratch
    enginePromise = null;
    worker?.terminate();
    worker = null;
    throw error;
  }
}

export type RunHandlers = {
  onToken: (full: string) => void;
  signal?: AbortSignal;
};

/**
 * Streams a completion, returning the final text plus timing.
 *
 * Decoding is constrained to the run schema, so the model physically cannot
 * emit a malformed packet. If the grammar cannot be compiled on this device the
 * run is retried once unconstrained — the prose parser picks up the pieces
 * rather than the visitor seeing an error.
 */
export async function runOnDevice(
  engine: MLCEngineInterface,
  input: string,
  { onToken, signal }: RunHandlers,
) {
  const started = performance.now();
  let text = "";
  let tokens = 0;
  let constrained = true;

  const open = async (withSchema: boolean) =>
    engine.chat.completions.create({
      messages: buildMessages(input),
      stream: true,
      ...GENERATION,
      ...(withSchema ? { response_format: RESPONSE_FORMAT } : {}),
    });

  let stream;
  try {
    stream = await open(true);
  } catch {
    constrained = false;
    stream = await open(false);
  }

  for await (const chunk of stream) {
    if (signal?.aborted) break;
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (!delta) continue;
    text += delta;
    tokens += 1;
    onToken(text);
  }

  const wallMs = performance.now() - started;
  return {
    text,
    tokens,
    wallMs,
    constrained,
    tokensPerSecond: tokens / Math.max(wallMs / 1000, 0.001),
  };
}

/** Frees the worker and its GPU buffers — used when the demo unmounts. */
export async function disposeEngine() {
  const current = enginePromise;
  enginePromise = null;
  try {
    const engine = await current;
    await engine?.unload();
  } catch {
    // nothing to unload
  }
  worker?.terminate();
  worker = null;
}
