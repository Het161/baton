/**
 * Simulation mode.
 *
 * When WebGPU is missing — which is most phones today — the demo plays a
 * pre-written run through the identical UI at a believable token rate, badged
 * so nobody mistakes it for a live inference. The visitor still sees the
 * experience; we still tell the truth (§9).
 */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type SimulatedRun = {
  text: string;
  tokens: number;
  wallMs: number;
  tokensPerSecond: number;
};

export async function simulateStream(
  script: string,
  onToken: (full: string) => void,
  signal?: AbortSignal,
): Promise<SimulatedRun> {
  const pieces = script.match(/\S+\s*/g) ?? [script];
  const started = performance.now();

  // a beat of "loading the graph" before the first token, as on real hardware
  await sleep(420);

  let text = "";
  for (const piece of pieces) {
    if (signal?.aborted) break;
    text += piece;
    onToken(text);
    // ~26–40 tok/s with jitter, plus a longer pause at paragraph breaks
    const base = 1000 / (26 + Math.random() * 14);
    await sleep(piece.includes("\n\n") ? base + 110 : base);
  }

  const wallMs = performance.now() - started;
  return {
    text,
    tokens: pieces.length,
    wallMs,
    tokensPerSecond: pieces.length / Math.max(wallMs / 1000, 0.001),
  };
}
