import type { RunJson } from "./schema";

export type Sample = {
  id: string;
  label: string;
  meta: string;
  input: string;
  /** what Simulation mode streams back — the same JSON a real run produces */
  scripted: string;
};

const script = (run: RunJson) => JSON.stringify(run, null, 2);

export const SAMPLES: Sample[] = [
  {
    id: "standup",
    label: "Standup notes",
    meta: "voice · 0:52",
    input: `ok standup, quick. Priya's payments migration is blocked on sandbox creds, she needs them from Rahul by tomorrow or we slip the date. I said I'd chase it. Android release build is failing on CI, only the release variant, Karthik thinks proguard, he's on it today. Client asked about the analytics dashboard again, I said end of month but we have not actually scoped it, someone needs to do that this week. And book the offsite room before Friday.`,
    scripted: script({
      summary: [
        "Priya's payments migration is blocked on sandbox credentials from Rahul and slips if they do not arrive by tomorrow.",
        "The Android release-variant build is failing on CI, suspected Proguard, and Karthik is on it today.",
        "The client analytics dashboard has been promised for end of month but has never been scoped.",
      ],
      actions: [
        { owner: "Rahul", task: "Send Priya the sandbox credentials by tomorrow" },
        { owner: "me", task: "Chase Rahul for the credentials today" },
        { owner: "Karthik", task: "Fix the Proguard failure on the release variant" },
        { owner: "me", task: "Scope the client analytics dashboard this week" },
        { owner: "me", task: "Book the offsite room before Friday" },
      ],
      reply:
        "Rahul — Priya's payments migration is blocked on the sandbox credentials. If she has them by tomorrow we hold the date; after that we slip. Can you send them across today?",
    }),
  },
  {
    id: "client",
    label: "Client call excerpt",
    meta: "voice · 1:34",
    input: `…right, so Sandeep asked three things. First, is November twelfth still safe — I said I'd confirm. Second, their legal wants the DPA signed before go-live, which we haven't started. Third he wants CSV export moved into phase one, he thinks it's small, it isn't, it's about two days on the critical path. Oh and they need a named contact for after go-live, their ops team keeps asking. I need to come back to him tomorrow with all four.`,
    scripted: script({
      summary: [
        "Sandeep wants confirmation that the 12 November date still holds.",
        "Their legal team requires the DPA signed before go-live and it has not been started.",
        "CSV export has been requested for phase 1, but it is roughly two days on the critical path.",
      ],
      actions: [
        { owner: "me", task: "Confirm or move the 12 November date" },
        { owner: "Legal", task: "Start and turn around the DPA before go-live" },
        { owner: "me", task: "Price CSV export as phase 1 versus phase 2" },
        { owner: "me", task: "Name a post-go-live contact for their ops team" },
      ],
      reply:
        "Sandeep — 12 November still holds. The DPA goes to our legal team today and will be signed well before go-live. CSV export we can do, but it adds about two days to the critical path, so I would rather ship it in the first week after go-live than put the date at risk. Your ops team will have a named contact from day one; I will confirm who tomorrow.",
    }),
  },
  {
    id: "whiteboard",
    label: "Whiteboard OCR dump",
    meta: "camera · 4032×3024",
    input: `RETENTION - where do they go?
D1 62% -> D7 31% -> D30 11%
drop is D2-D4 (!!)
h1: onboarding too long (9 screens)
h2: no reason to come back day 2
h3: notifications off by default
--> test: cut onboarding to 4 screens
--> test: day-2 "here's what you missed" push
owner: Anjali, 2 wk
need: event instrumentation screens 5-9 FIRST
blocker: analytics SDK version`,
    scripted: script({
      summary: [
        "Retention falls off hardest between D2 and D4 rather than at install, going from 62 percent at D1 to 11 percent at D30.",
        "Three hypotheses are on the board: onboarding length, no day-2 reason to return, and notifications off by default.",
        "Both proposed tests depend on instrumenting onboarding screens 5 to 9, which is blocked on the analytics SDK version.",
      ],
      actions: [
        { owner: "Anjali", task: "Run the four-screen onboarding test over two weeks" },
        { owner: "Anjali", task: "Ship the day-2 “here's what you missed” push" },
        { owner: "me", task: "Unblock the analytics SDK upgrade before instrumentation" },
      ],
      reply:
        "Anjali — the board photo is attached. The bleed is D2 to D4, so onboarding length and day-2 pull are the two things worth testing. Both need events on onboarding screens 5 to 9, which needs the analytics SDK bump first. I will take that, and your two weeks start the moment it lands.",
    }),
  },
];

/**
 * Simulation mode for text the visitor pasted themselves.
 *
 * Extractive, not generative: it pulls real sentences and real imperative lines
 * out of the input rather than inventing anything. Badged as simulated either
 * way — but it should still be *about* what they typed.
 */
export function improviseScript(input: string): string {
  const clean = input.replace(/\s+/g, " ").trim();
  const sentences = clean
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  const summary = (sentences.length ? sentences : [clean])
    .slice(0, 3)
    .map((s) => (s.length > 190 ? `${s.slice(0, 187)}…` : s));

  const VERBS =
    /\b(need|needs|should|must|chase|send|book|fix|ship|scope|confirm|check|follow up|remind|ask|write|call|review|update|decide|prepare)\b/i;
  const candidates = sentences.filter((s) => VERBS.test(s)).slice(0, 4);

  const actions = (candidates.length ? candidates : summary.slice(0, 2)).map((s) => {
    const name = s.match(/\b([A-Z][a-z]{2,12})\b/);
    const owner = name && !/^(The|This|That|And|But|We|I)$/.test(name[1]) ? name[1] : "me";
    const task = s.length > 110 ? `${s.slice(0, 107)}…` : s;
    return { owner, task };
  });

  return script({
    summary,
    actions,
    reply:
      "Following up on the notes above. The points that need a decision are captured as actions; the rest is context. Tell me which of these you want to own and I will take the remainder.",
  });
}
