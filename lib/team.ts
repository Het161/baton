/**
 * Team roster.
 *
 * Every surface that renders the team reads from here — change a name or a
 * role and the site follows. Add a `links` array to any member to surface
 * GitHub / LinkedIn / portfolio links on their card.
 */
export type Member = {
  id: string;
  name: string;
  role: string;
  focus: string;
  links?: { label: string; href: string }[];
};

export const TEAM: Member[] = [
  {
    id: "het",
    name: "Het Patel",
    role: "Android · on-device ML",
    focus:
      "LiteRT-LM integration, model packaging, the NPU delegate and the thermal budget that makes bursty inference viable.",
    links: [{ label: "GitHub", href: "https://github.com/Het161" }],
  },
  {
    id: "utkarsh",
    name: "Utkarsh Rajput",
    role: "Product · design · handoff",
    focus:
      "Capture flows, the baton format, the desk UI, and packaging artifacts so they travel the Office Kit flow.",
  },
];

export const TEAM_META = {
  city: "Chennai",
  event: "iQOO Hackathon 2026 · City Battle 03",
  dates: "12–13 September",
};
