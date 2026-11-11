/**
 * Section icons of the Open Graph images, copied from lucide (ISC license, lucide.dev).
 * The lucide-react components are client components and can't be rendered in an image route.
 */
export const OG_ICONS = {
  cookingPot: [
    ["path", { d: "M2 12h20" }],
    ["path", { d: "M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" }],
    ["path", { d: "m4 8 16-4" }],
    [
      "path",
      {
        d: "m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8",
      },
    ],
  ],
  tramFront: [
    ["rect", { width: "16", height: "16", x: "4", y: "3", rx: "2" }],
    ["path", { d: "M4 11h16" }],
    ["path", { d: "M12 3v8" }],
    ["path", { d: "m8 19-2 3" }],
    ["path", { d: "m18 22-2-3" }],
    ["path", { d: "M8 15h.01" }],
    ["path", { d: "M16 15h.01" }],
  ],
  squareParking: [
    ["path", { d: "M9 12h4a2 2 0 0 0 0-4H9.5a.5.5 0 0 0-.5.5V16" }],
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
  ],
  mapPinned: [
    [
      "path",
      {
        d: "M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 01-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0112 0",
      },
    ],
    [
      "path",
      {
        d: "M4.474 15h-.197a1 1 0 00-.969.753l-1.097 4.35a1.5 1.5 0 001.444 1.898L20.344 22a1.5 1.5 0 001.446-1.897l-1.098-4.35a1 1 0 00-.969-.753h-.197",
      },
    ],
    ["circle", { cx: "12", cy: "8", r: "2" }],
  ],
  link: [
    [
      "path",
      { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" },
    ],
    [
      "path",
      { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" },
    ],
  ],
  bookText: [
    [
      "path",
      {
        d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20",
      },
    ],
    ["path", { d: "M8 11h8" }],
    ["path", { d: "M8 7h6" }],
  ],
} satisfies Record<string, [string, Record<string, string>][]>;

export type OgIcon = keyof typeof OG_ICONS;
