export type BatonSource = "voice" | "camera" | "screenshot" | "text";

export type Transport = "clipboard sync" | "file drop" | "notes sync";

export type ActionItem = {
  id: string;
  owner: string;
  task: string;
  done: boolean;
};

export type BatonStatus = "inbox" | "today" | "done";

export type Baton = {
  id: string;
  title: string;
  source: BatonSource;
  /** static, human-readable capture stamp — no clock reads during render */
  dayLabel: string;
  time: string;
  /** what the phone actually captured, and what the live demo runs against */
  raw: string;
  summary: string[];
  actions: ActionItem[];
  draft: string;
  /** on-device run metadata, shown as provenance */
  model: string;
  runtime: string;
  wallMs: number;
  tokens: number;
  transport: Transport;
  status: BatonStatus;
  /** true for batons produced by the in-browser demo rather than seeded */
  live?: boolean;
};

export const SOURCE_LABEL: Record<BatonSource, string> = {
  voice: "voice note",
  camera: "camera",
  screenshot: "screenshot",
  text: "quick text",
};

export const SOURCE_GLYPH: Record<BatonSource, string> = {
  voice: "◉",
  camera: "▣",
  screenshot: "▤",
  text: "▷",
};
