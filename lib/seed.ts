import type { Baton } from "./types";

/**
 * Six batons that have already landed on the desk. Written as real work rather
 * than lorem — a judge should be able to read any card and recognise their own
 * week in it.
 */
export const SEED_BATONS: Baton[] = [
  {
    id: "btn-standup",
    title: "Standup, walking to the metro",
    source: "voice",
    dayLabel: "Today",
    time: "09:47",
    raw: `ok so standup — uh, Priya said the payments migration is blocked on the sandbox creds, she needs them from Rahul by tomorrow otherwise we slip. I said I'd chase it. Second thing, the Android build is failing on CI but only on the release variant, Karthik thinks it's proguard, he's on it today. Third — client asked again about the analytics dashboard, I told them end of month but honestly we haven't scoped it, someone needs to actually scope it this week. And uh remind me to book the offsite room before Friday, the big one, not the one with the broken AC.`,
    summary: [
      "Payments migration is blocked on sandbox credentials from Rahul; Priya needs them by tomorrow or the date slips.",
      "Release-variant CI build is failing, suspected Proguard; Karthik is on it today.",
      "The client analytics dashboard has been promised for end of month but has never been scoped.",
    ],
    actions: [
      { id: "a1", owner: "me", task: "Chase Rahul for the sandbox credentials today", done: true },
      {
        id: "a2",
        owner: "Karthik",
        task: "Fix the Proguard failure on the release variant",
        done: false,
      },
      {
        id: "a3",
        owner: "me",
        task: "Scope the client analytics dashboard this week",
        done: false,
      },
      { id: "a4", owner: "me", task: "Book the large offsite room before Friday", done: false },
    ],
    draft: `Hi Rahul — quick one. Priya's payments migration is blocked on the sandbox credentials. If we can get those to her by tomorrow we hold the date; after that we slip. Can you send them across today?

Thanks,`,
    model: "Gemma 3n E2B · int4",
    runtime: "LiteRT-LM",
    wallMs: 2410,
    tokens: 318,
    transport: "clipboard sync",
    status: "today",
  },
  {
    id: "btn-whiteboard",
    title: "Whiteboard — retention teardown",
    source: "camera",
    dayLabel: "Today",
    time: "11:20",
    raw: `RETENTION — where do they go?
D1 62% -> D7 31% -> D30 11%
drop is D2-D4 (!!)
hypothesis 1: onboarding too long (9 screens)
hypothesis 2: no reason to come back day 2
hypothesis 3: notifications off by default
--> test: cut onboarding to 4 screens
--> test: day-2 "here's what you missed" push
owner: Anjali, 2 wk
need: event instrumentation on screens 5-9 FIRST
blocker: analytics SDK version`,
    summary: [
      "Retention falls off hardest between D2 and D4, not at install; D1 62% to D30 11%.",
      "Three hypotheses on the board: onboarding length, no day-2 reason to return, notifications off by default.",
      "Both proposed tests depend on instrumenting onboarding screens 5 to 9 first, which is blocked on the analytics SDK version.",
    ],
    actions: [
      {
        id: "b1",
        owner: "Anjali",
        task: "Run the 4-screen onboarding test (2 weeks)",
        done: false,
      },
      {
        id: "b2",
        owner: "Anjali",
        task: "Ship the day-2 “here's what you missed” push",
        done: false,
      },
      {
        id: "b3",
        owner: "me",
        task: "Unblock the analytics SDK upgrade before instrumentation",
        done: true,
      },
    ],
    draft: `Anjali — photo of the board is attached, here's the short version.

The bleed is D2 to D4, so onboarding length and day-2 pull are the two things worth testing. Both need events on onboarding screens 5 to 9, which needs the analytics SDK bump first — I'll take that. Two weeks from the moment the SDK lands.`,
    model: "Gemma 3n E4B · int4",
    runtime: "LiteRT-LM",
    wallMs: 3980,
    tokens: 402,
    transport: "file drop",
    status: "today",
  },
  {
    id: "btn-client",
    title: "Client thread — Meridian scope",
    source: "screenshot",
    dayLabel: "Yesterday",
    time: "18:02",
    raw: `[14:31] Sandeep (Meridian): hi, quick question — is the Nov 12 date still safe?
[14:33] Sandeep (Meridian): also our legal wants the DPA signed before we go live, is that a problem
[14:34] Sandeep (Meridian): and can we add the CSV export to phase 1? feels small
[16:58] me: let me check and come back tomorrow
[17:40] Sandeep (Meridian): also — who's the point of contact after go-live? our ops team is asking`,
    summary: [
      "Meridian are asking whether 12 November still holds and want the DPA signed before go-live.",
      "They have asked to move CSV export into phase 1, described by them as small.",
      "They also need a named post-go-live point of contact for their ops team.",
    ],
    actions: [
      { id: "c1", owner: "me", task: "Confirm or move the 12 November date", done: false },
      {
        id: "c2",
        owner: "Legal",
        task: "Turn around the Meridian DPA before go-live",
        done: false,
      },
      {
        id: "c3",
        owner: "me",
        task: "Price CSV export as phase 1 vs phase 2 and reply",
        done: false,
      },
      {
        id: "c4",
        owner: "me",
        task: "Name a post-go-live point of contact for Meridian ops",
        done: false,
      },
    ],
    draft: `Hi Sandeep,

Taking these in order:

1. 12 November still holds.
2. The DPA is with our legal team; we will have it signed well before go-live.
3. CSV export we can do, but it moves two days into the critical path — I would rather ship it in the first week after go-live than risk the date. Happy to do it in phase 1 if you would prefer the opposite trade.
4. Your ops team will have a named contact and an escalation address from day one; I will confirm the name tomorrow.

Best,`,
    model: "Gemma 3n E2B · int4",
    runtime: "LiteRT-LM",
    wallMs: 2870,
    tokens: 356,
    transport: "clipboard sync",
    status: "inbox",
  },
  {
    id: "btn-interview",
    title: "User interview — P07, in the car park",
    source: "voice",
    dayLabel: "Yesterday",
    time: "16:44",
    raw: `just finished P07. She's a site supervisor, fifty-ish, uses the app on a phone with cracked glass in gloves. Two things stood out. One, she never uses search, she scrolls, because search needs both hands and she's usually holding something. Two, she takes photos of the printed schedule every morning because the in-app schedule is three taps deep and loads slowly on site wifi. She said and I quote "I trust the photo". That's — that's a problem for us. Also she's never once opened the notifications tab.`,
    summary: [
      "P07 is a site supervisor who uses the app one-handed, in gloves, on cracked glass — search is effectively unusable for her.",
      "She photographs the printed schedule each morning because the in-app schedule is three taps deep and slow on site wifi.",
      "Her words: “I trust the photo.” She has never opened the notifications tab.",
    ],
    actions: [
      {
        id: "d1",
        owner: "me",
        task: "Put today's schedule on the app's first screen",
        done: false,
      },
      {
        id: "d2",
        owner: "Design",
        task: "Test a one-handed reachable layout with glove input",
        done: false,
      },
      {
        id: "d3",
        owner: "me",
        task: "Add “I trust the photo” to the research readout",
        done: true,
      },
    ],
    draft: `Team — P07 is the clearest signal we have had so far.

She photographs the printed schedule every morning rather than opening ours, because ours is three taps deep and slow on site wifi. She said “I trust the photo”. Search is a non-starter for her: she is one-handed and in gloves.

Proposal: today's schedule becomes the first screen, and we test a reachable one-handed layout before we touch anything else.`,
    model: "Gemma 3n E2B · int4",
    runtime: "LiteRT-LM",
    wallMs: 3120,
    tokens: 371,
    transport: "notes sync",
    status: "inbox",
  },
  {
    id: "btn-invoice",
    title: "Vendor quote — cooling rig",
    source: "camera",
    dayLabel: "Mon",
    time: "10:12",
    raw: `THERMALS LAB PVT LTD — QUOTATION #Q-4471
Vapor chamber test rig, benchtop      1 x  ₹ 2,84,000
Thermocouple harness (12 ch)          1 x  ₹   46,500
Calibration + install                 1 x  ₹   38,000
Annual service (optional)             1 x  ₹   55,000
Subtotal                                    ₹ 3,68,500
GST 18%                                     ₹   66,330
TOTAL                                       ₹ 4,34,830
Validity: 21 days from 08 Sep
Lead time: 6-8 weeks ex-Chennai`,
    summary: [
      "Thermals Lab quote Q-4471 totals ₹4,34,830 including GST for a benchtop vapor chamber test rig.",
      "Optional annual service is ₹55,000 of that; excluding it brings the total to ₹3,69,930.",
      "The quote is valid 21 days from 8 September and lead time is 6 to 8 weeks ex-Chennai.",
    ],
    actions: [
      {
        id: "e1",
        owner: "me",
        task: "Decide on the optional annual service line before the quote expires",
        done: false,
      },
      {
        id: "e2",
        owner: "Finance",
        task: "Raise the PO — 6 to 8 week lead time is on the critical path",
        done: false,
      },
    ],
    draft: `Finance — attaching quote Q-4471 from Thermals Lab, ₹4,34,830 inc. GST.

Lead time is 6 to 8 weeks ex-Chennai and the quote expires 21 days from 8 September, so the PO is on the critical path. I am inclined to drop the ₹55,000 annual service in year one.`,
    model: "Gemma 3n E4B · int4",
    runtime: "LiteRT-LM",
    wallMs: 4260,
    tokens: 289,
    transport: "file drop",
    status: "done",
  },
  {
    id: "btn-idea",
    title: "Half-thought, 23:51",
    source: "text",
    dayLabel: "Sun",
    time: "23:51",
    raw: `the reason nobody uses the export button is that export is a destination, not an action. people don't want a file. they want the thing to already be where they were going. stop building exports. build arrivals.`,
    summary: [
      "Export is framed as a destination when users experience it as a detour.",
      "The underlying want is not a file — it is for the work to already be where they were heading.",
      "Reframing: stop building exports, build arrivals.",
    ],
    actions: [
      {
        id: "f1",
        owner: "me",
        task: "Open the positioning doc with “build arrivals, not exports”",
        done: true,
      },
    ],
    draft: `Nobody uses the export button because export is a destination, not an action. People do not want a file; they want the work to already be where they were going.

We should stop building exports and start building arrivals.`,
    model: "Gemma 3n E2B · int4",
    runtime: "LiteRT-LM",
    wallMs: 1180,
    tokens: 142,
    transport: "clipboard sync",
    status: "done",
  },
];
