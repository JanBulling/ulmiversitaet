import {
  BUILDINGS,
  PLACES,
  ROOMS,
  STOP_BOUNDS,
  type BuildingProperties,
  type CampusArea,
  type Room,
} from "@/content/campus-map";
import type { Localized } from "@/content/links";
import { PARKING_LOTS } from "@/content/parking/parking-lots";
import stops from "@/content/public-transport/stops.json";
import { normalize } from "@/features/links/search";
import { distanceInMeters } from "@/features/public-transport/nearest-stops";
import type { Locale } from "@/lib/i18n/routing";

export type CampusKind =
  | Room["kind"]
  | "building"
  | "food"
  | "library"
  | "service"
  | "top-up"
  | "stop"
  | "parking";

/** Everything that can be found on the campus map: rooms, buildings, places, stops, parking lots */
export type CampusPlace = {
  id: string;
  kind: CampusKind;
  /** Main name in the current language */
  name: string;
  /** Extra name, e.g. "Blauer Hörsaal" or the full name of a building */
  title?: string;
  description?: string;
  /** Building whose outline is highlighted */
  buildingId?: string;
  area?: CampusArea;
  floor?: string;
  room?: string;
  seats?: number;
  printer?: { paper: string[]; color: boolean };
  lat: number;
  lng: number;
  /** Page on this website */
  href?: string;
  /** External page (Hörsaalfinder) */
  url?: string;
  /** Normalized search words, separated by spaces */
  searchText: string;
  /** Normalized names without spaces, for exact matches ("o25h1", "h1") */
  searchNames: string[];
};

/** Words that find a whole kind of place, in both languages */
const KIND_KEYWORDS: Record<CampusKind, string[]> = {
  "lecture-hall": ["Hörsaal", "Lecture hall", "HS"],
  "seminar-room": ["Seminarraum", "Seminar room", "SR", "Raum", "Room"],
  "pc-pool": ["PC-Pool", "Computer", "Rechner", "Pool"],
  printer: ["Drucker", "Printer", "Kopierer", "Drucken", "Print"],
  building: ["Gebäude", "Building"],
  food: ["Essen", "Food", "Cafeteria", "Café"],
  library: ["Bibliothek", "Library", "Bib", "UB"],
  service: [],
  "top-up": ["Aufwerter", "Aufladen", "Top-up", "Mensakarte", "Card"],
  stop: ["Haltestelle", "Stop", "Straßenbahn", "Tram", "Bus"],
  parking: ["Parkplatz", "Parking", "Parkhaus", "Parken"],
};

const PRINTER_KEYWORDS = KIND_KEYWORDS.printer;

function localize(value: Localized, locale: Locale): string {
  return typeof value === "string" ? value : value[locale];
}

/** "O27/2201" → "o27 2201", "H4/5" → "h4 5" */
function words(text: string): string {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function compact(text: string): string {
  return words(text).replace(/ /g, "");
}

/** "Hörsaal" is also found as "Hoersaal" */
function withTransliteration(text: string): string[] {
  const transliterated = text
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue");
  return transliterated === text ? [text] : [text, transliterated];
}

function searchFields(
  names: (string | undefined)[],
  keywords: (string | undefined)[],
) {
  const all = [...names, ...keywords]
    .filter((text): text is string => Boolean(text))
    .flatMap(withTransliteration);
  return {
    searchText: ` ${all.map(words).join(" ")} `,
    searchNames: [
      ...new Set(
        names
          .filter((name): name is string => Boolean(name))
          .flatMap(withTransliteration)
          .map(compact),
      ),
    ],
  };
}

function buildingKeywords(building: BuildingProperties | undefined): string[] {
  if (!building) return [];
  return [building.label, building.name, ...(building.aliases ?? [])].filter(
    (text): text is string => Boolean(text),
  );
}

const buildingsById = new Map(
  BUILDINGS.features.map((feature) => [feature.properties.id, feature]),
);

export function getBuilding(id: string) {
  return buildingsById.get(id);
}

function roomPlace(room: Room, locale: Locale): CampusPlace {
  const building = buildingsById.get(room.building)?.properties;
  const label = building?.label;
  // "H1" is also found as "Hörsaal 1", "O25 H1" and "O25/H1"
  const lectureHallNumber =
    room.kind === "lecture-hall"
      ? room.name.match(/^H(\d[\d./]*)$/)?.[1]
      : null;
  const names = [
    room.name,
    label && `${label} ${room.name}`,
    label && room.room && `${label} ${room.room}`,
    room.room,
    lectureHallNumber ? `Hörsaal ${lectureHallNumber}` : undefined,
    room.title?.de,
    room.title?.en,
  ];
  return {
    id: room.id,
    kind: room.kind,
    name: room.name,
    title: room.title?.[locale],
    buildingId: room.building,
    area: building?.area,
    floor: room.floor,
    room: room.room,
    seats: room.seats,
    printer: room.printer,
    lat: room.lat,
    lng: room.lng,
    url: room.url,
    ...searchFields(names, [
      ...buildingKeywords(building),
      ...KIND_KEYWORDS[room.kind],
      ...(room.printer ? PRINTER_KEYWORDS : []),
    ]),
  };
}

function buildingPlaces(): CampusPlace[] {
  return BUILDINGS.features.map(({ properties: building, geometry }) => {
    // Buildings without outline are placed in the middle of their rooms
    const rooms = ROOMS.filter((room) => room.building === building.id);
    const [lng, lat] = building.center ?? [
      rooms.reduce((sum, room) => sum + room.lng, 0) / rooms.length,
      rooms.reduce((sum, room) => sum + room.lat, 0) / rooms.length,
    ];
    return {
      id: building.id,
      kind: building.kind ?? "building",
      name: building.label,
      title: building.name,
      buildingId: geometry ? building.id : undefined,
      area: building.area,
      lat,
      lng,
      href: building.href,
      ...searchFields(
        [building.label, building.name, ...(building.aliases ?? [])],
        KIND_KEYWORDS[building.kind ?? "building"],
      ),
    };
  });
}

function isNearCampus(lat: number, lng: number): boolean {
  const [west, south, east, north] = STOP_BOUNDS;
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

function stopPlaces(): CampusPlace[] {
  return stops
    .filter((stop) => isNearCampus(stop.lat, stop.long))
    .map((stop) => ({
      id: `stop-${stop.id}`,
      kind: "stop" as const,
      name: stop.name,
      lat: stop.lat,
      lng: stop.long,
      ...searchFields([stop.name, stop.short_name], KIND_KEYWORDS.stop),
    }));
}

function parkingPlaces(): CampusPlace[] {
  return PARKING_LOTS.map((lot) => ({
    id: `parking-${lot.code.toLowerCase()}`,
    kind: "parking" as const,
    name: lot.name ? `${lot.code} ${lot.name}` : lot.code,
    description: lot.address,
    lat: lot.lat,
    lng: lot.lng,
    href: lot.counterId ? "/parking-lots" : undefined,
    ...searchFields(
      [lot.code, lot.name, lot.shortName],
      [...KIND_KEYWORDS.parking, lot.address],
    ),
  }));
}

/** All places of the campus map in the given language */
export function getCampusPlaces(locale: Locale): CampusPlace[] {
  return [
    ...buildingPlaces(),
    ...ROOMS.map((room) => roomPlace(room, locale)),
    ...PLACES.map((place) => ({
      id: place.id,
      kind: place.kind,
      name: localize(place.name, locale),
      description: place.description && localize(place.description, locale),
      floor: place.floor,
      lat: place.lat,
      lng: place.lng,
      href: place.href,
      url: place.url,
      ...searchFields(
        [
          typeof place.name === "string" ? place.name : place.name.de,
          typeof place.name === "string" ? undefined : place.name.en,
        ],
        [
          ...KIND_KEYWORDS[place.kind],
          ...(place.keywords ?? []),
          ...(place.description
            ? [
                localize(place.description, "de"),
                localize(place.description, "en"),
              ]
            : []),
        ],
      ),
    })),
    ...stopPlaces(),
    ...parkingPlaces(),
  ];
}

/** The nearest tram/bus stop to a place, with the walking distance in meters (as the crow flies) */
export function nearestStop(
  place: Pick<CampusPlace, "lat" | "lng">,
  places: CampusPlace[],
): { stop: CampusPlace; meters: number } | null {
  let best: { stop: CampusPlace; meters: number } | null = null;
  for (const stop of places) {
    if (stop.kind !== "stop") continue;
    const meters = distanceInMeters(
      { latitude: place.lat, longitude: place.lng },
      { latitude: stop.lat, longitude: stop.lng },
    );
    if (!best || meters < best.meters) best = { stop, meters };
  }
  return best;
}
