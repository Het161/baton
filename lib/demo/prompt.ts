import { RUN_SCHEMA_STRING } from "./schema";

/**
 * The demo's system prompt.
 *
 * Structure is guaranteed by the grammar (see schema.ts), so this prompt only
 * has to fight for *content* quality — which is where a 1B model actually
 * struggles. Hence the explicit owner rule and the worked example: small models
 * imitate a demonstration far more reliably than they follow a description.
 */
export const SYSTEM_PROMPT = `You turn a messy capture — a voice-note transcript, meeting notes, a photographed whiteboard — into a finished work packet. Reply with JSON only.

summary: exactly three lines. Each is one complete sentence stating one fact from the input. Never a label, a name on its own, or a fragment like "Actions:".

actions: one entry per thing that must happen. "owner" is the person who has to do it — a name that appears in the input, or "me" if the speaker took it on themselves. Do not put the same owner on every action; read who was actually assigned each one. "task" is a short imperative phrase.

reply: a short professional message, under 120 words, addressed to the single most urgent person, that moves the work forward. No salutation placeholders.

Use only facts present in the input. Invent nothing.

Example input:
"caught up with Meera — the pricing page copy is still with legal, she's chasing them. I need to send the deck to Arjun before standup tomorrow. Also the staging box is out of disk, ops know."

Example output:
{"summary":["The pricing page copy is still with legal and Meera is chasing them.","The deck has to reach Arjun before tomorrow's standup.","Staging has run out of disk space and ops have been told."],"actions":[{"owner":"Meera","task":"Chase legal on the pricing page copy"},{"owner":"me","task":"Send the deck to Arjun before standup tomorrow"},{"owner":"Ops","task":"Clear disk space on the staging box"}],"reply":"Meera — anything I can do to unblock legal on the pricing copy? Happy to chase it directly if that is faster. Separately, staging is out of disk and ops are on it, so expect a slow build window this afternoon."}`;

export function buildMessages(input: string) {
  return [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: input.slice(0, 4000) },
  ];
}

/**
 * Tight and near-deterministic: the run has to finish fast on a weak GPU (§9),
 * and extraction is not a task that benefits from sampling diversity.
 */
export const GENERATION = {
  temperature: 0.2,
  top_p: 0.9,
  max_tokens: 520,
};

export const RESPONSE_FORMAT = {
  type: "json_object" as const,
  schema: RUN_SCHEMA_STRING,
};
