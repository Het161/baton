import type { ActionItem } from "@/lib/types";
import type { RunJson } from "./schema";

export type ParsedRun = {
  summary: string[];
  actions: ActionItem[];
  draft: string;
};

const EMPTY: ParsedRun = { summary: [], actions: [], draft: "" };

/**
 * Turns a completed run into a baton.
 *
 * The happy path is JSON: decoding is grammar-constrained, so a finished run is
 * valid by construction. The prose parser below stays as a safety net for the
 * case where constrained decoding is unavailable and the engine falls back to
 * free-form text — a broken demo is not an acceptable failure mode.
 */
export function parseRun(text: string): ParsedRun {
  if (!text.trim()) return EMPTY;
  return parseJsonRun(text) ?? parseSectionRun(text);
}

/* ────────────────────────────── JSON path ────────────────────────────── */

function parseJsonRun(text: string): ParsedRun | null {
  const raw = extractJsonObject(text);
  if (!raw) return null;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;

  const run = data as Partial<RunJson>;
  const summary = Array.isArray(run.summary)
    ? run.summary.filter(isUsefulLine).map(clean).slice(0, 4)
    : [];

  const actions: ActionItem[] = Array.isArray(run.actions)
    ? run.actions
        .filter((a): a is { owner: string; task: string } => Boolean(a) && typeof a === "object")
        .map((a, i) => ({
          id: `live-${i}`,
          owner: clean(String(a.owner ?? "me")) || "me",
          task: clean(String(a.task ?? "")),
          done: false,
        }))
        .filter((a) => a.task.length > 0)
        .slice(0, 8)
    : [];

  const draft = typeof run.reply === "string" ? run.reply.trim() : "";

  if (!summary.length && !actions.length && !draft) return null;
  return { summary, actions, draft };
}

/** Finds the outermost {...} even if the model wrapped it in prose or fences. */
function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

/**
 * Drops the degenerate lines a small model emits when it loses the thread —
 * bare section labels, a name with no sentence around it, single words.
 */
function isUsefulLine(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const line = value.trim();
  if (line.length < 12) return false;
  if (/^(summary|actions?|reply|draft|owner|task)\s*:?\s*$/i.test(line)) return false;
  if (/^(owner|task)\s*:\s*\S+$/i.test(line)) return false;
  return true;
}

function clean(value: string) {
  return value
    .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .trim();
}

/* ──────────────────────── prose fallback path ──────────────────────── */

const HEADINGS = /^(SUMMARY|ACTIONS?|REPLY|DRAFT)$/i;

/**
 * A header on its own line, in any dress a model puts it in: `SUMMARY:`,
 * `- Actions:`, `**Summary:**`, `### Reply`. Stripping the decoration first is
 * far more reliable than trying to spell every ordering in one pattern.
 */
function headingOf(line: string): "summary" | "actions" | "draft" | null {
  const bare = line
    .trim()
    .replace(/^[-*•]\s*/, "")
    .replace(/^#{1,4}\s*/, "")
    .replace(/\*+/g, "")
    .replace(/:\s*$/, "")
    .trim();
  const match = bare.match(HEADINGS);
  if (!match) return null;
  const name = match[1].toUpperCase();
  return name === "SUMMARY" ? "summary" : name.startsWith("ACTION") ? "actions" : "draft";
}

/** Words that are structure, never a person. */
const LABEL_WORDS = /^(owner|task|action|actions|summary|reply|draft|note|item)$/i;

function parseSectionRun(text: string): ParsedRun {
  const lines = text.replace(/\r/g, "").split("\n");

  let section: "summary" | "actions" | "draft" | null = null;
  const summary: string[] = [];
  const actions: ActionItem[] = [];
  const draft: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const heading = headingOf(line);
    if (heading) {
      section = heading;
      continue;
    }
    if (!section) continue;

    const bullet = clean(line);

    if (section === "summary") {
      if (isUsefulLine(bullet)) summary.push(bullet);
    } else if (section === "actions") {
      if (!bullet) continue;
      const parsed = parseAction(bullet, actions.length);
      if (parsed) actions.push(parsed);
    } else {
      draft.push(line);
    }
  }

  return {
    summary: summary.slice(0, 4),
    actions: actions.slice(0, 8),
    draft: draft.join("\n").trim(),
  };
}

function parseAction(raw: string, index: number): ActionItem | null {
  const checkbox = raw.match(/^\[([ xX])\]\s*(.*)$/);
  const done = Boolean(checkbox && checkbox[1].toLowerCase() === "x");
  const body = clean(checkbox ? checkbox[2] : raw);
  if (!body) return null;

  const split = body.match(/^([A-Za-z][\w .'-]{0,28}?)\s*:\s*(.+)$/);
  const owner = split ? split[1].trim() : "me";
  const task = split ? split[2].trim() : body;

  // "Owner: Priya" is a stray label from a confused model, not an action
  if (LABEL_WORDS.test(owner)) return null;
  if (task.length < 6) return null;

  return { id: `live-${index}`, owner, task, done };
}

/** True once there is enough structure to be worth rendering as a card. */
export function isRenderable(parsed: ParsedRun) {
  return parsed.summary.length > 0 || parsed.actions.length > 0 || parsed.draft.length > 0;
}
