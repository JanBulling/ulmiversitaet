import { normalize } from "@/features/links/search";
import { compact, type CampusKind, type CampusPlace } from "./places";

/** Categories offered before searching, in this order; labels in `CampusMap.categories` */
export const CATEGORIES = [
  "lecture-hall",
  "seminar-room",
  "pc-pool",
  "printer",
  "building",
  "food",
  "library",
  "top-up",
  "service",
  "stop",
  "parking",
] as const satisfies readonly CampusKind[];

export type Category = (typeof CATEGORIES)[number];

/** Places of a category; printers include the PC pools with a printer */
export function placesInCategory(
  places: CampusPlace[],
  category: Category,
): CampusPlace[] {
  return sortPlaces(
    places.filter(
      (place) =>
        place.kind === category ||
        (category === "printer" && Boolean(place.printer)) ||
        (category === "building" && place.buildingId === place.id),
    ),
  );
}

/** Rooms in a building, lecture halls first */
export function roomsInBuilding(
  places: CampusPlace[],
  buildingId: string,
): CampusPlace[] {
  return sortPlaces(
    places.filter(
      (place) => place.buildingId === buildingId && place.id !== buildingId,
    ),
  );
}

const KIND_ORDER: CampusKind[] = [
  "building",
  "lecture-hall",
  "seminar-room",
  "pc-pool",
  "printer",
  "food",
  "library",
  "top-up",
  "service",
  "stop",
  "parking",
];

const collator = new Intl.Collator("de", { numeric: true });

function sortPlaces(places: CampusPlace[]): CampusPlace[] {
  return [...places].sort(
    (a, b) =>
      KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
      collator.compare(a.name, b.name),
  );
}

/**
 * Places matching the query, best first:
 * 1. the name is the query ("h1", "O27/2201", "43.2.101", "Mensa"),
 * 2. a name starts with the query ("h1" → H10 … H16),
 * 3. every word of the query starts a word of the place (name, building, kind: "hörsaal o25").
 * Spaces, dots, slashes and dashes are ignored for names, so "o272201" finds "O27/2201".
 */
export function searchPlaces(
  places: CampusPlace[],
  query: string,
  limit = 50,
): CampusPlace[] {
  const text = normalize(query)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!text) return [];
  const queryWords = text.split(" ");
  const queryName = compact(query);

  const scored: { place: CampusPlace; score: number }[] = [];
  for (const place of places) {
    const score = scorePlace(place, queryName, queryWords);
    if (score > 0) scored.push({ place, score });
  }
  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        KIND_ORDER.indexOf(a.place.kind) - KIND_ORDER.indexOf(b.place.kind) ||
        collator.compare(a.place.name, b.place.name),
    )
    .slice(0, limit)
    .map(({ place }) => place);
}

function scorePlace(
  place: CampusPlace,
  queryName: string,
  queryWords: string[],
): number {
  // The first name is the main one ("H1"), the others are combinations ("o25h1") and titles
  const [mainName, ...otherNames] = place.searchNames;
  if (mainName === queryName) return 1000;
  if (otherNames.includes(queryName)) return 900;
  if (mainName?.startsWith(queryName)) return 500 - mainName.length;
  if (otherNames.some((name) => name.startsWith(queryName))) return 400;

  let score = 0;
  for (const word of queryWords) {
    if (place.searchText.includes(` ${word} `)) score += 3;
    else if (place.searchText.includes(` ${word}`)) score += 2;
    else if (word.length >= 3 && place.searchText.includes(word)) score += 1;
    else return 0;
  }
  return score;
}
