/**
 * The shape a run must produce.
 *
 * WebLLM compiles this into a grammar (XGrammar) and constrains decoding to it,
 * so a 1B model cannot emit a stray "Actions:" bullet into the summary or drop
 * a header — the tokens that would do so are simply not sampleable. Everything
 * downstream can then assume valid structure instead of parsing prose.
 */
export const RUN_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 3,
    },
    actions: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          owner: { type: "string" },
          task: { type: "string" },
        },
        required: ["owner", "task"],
        additionalProperties: false,
      },
    },
    reply: { type: "string" },
  },
  required: ["summary", "actions", "reply"],
  additionalProperties: false,
} as const;

export const RUN_SCHEMA_STRING = JSON.stringify(RUN_SCHEMA);

export type RunJson = {
  summary: string[];
  actions: { owner: string; task: string }[];
  reply: string;
};
