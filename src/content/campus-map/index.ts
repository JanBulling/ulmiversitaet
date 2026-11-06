/**
 * Data of the campus map (`/campus-map`). See docs/campus-map.md for how to add or change entries.
 *
 * - `rooms.json`: lecture halls, seminar rooms, PC pools and printers from the Hörsaalfinder of
 *   the university (one room per line).
 * - `buildings.json`: building outlines (GeoJSON, mostly from OpenStreetMap) with the label shown on the map.
 * - `places.ts`: food, libraries, services; tram stops and parking lots come from their own data.
 */
import buildingsJson from "./buildings.json";
import roomsJson from "./rooms.json";

export * from "./places";

export type CampusArea = "ost" | "west" | "helmholtz" | "michelsberg";

export type RoomKind = "lecture-hall" | "seminar-room" | "pc-pool" | "printer";

export type Room = {
  /** Used in the URL (`/campus-map?p=<id>`), unique across rooms, buildings and places */
  id: string;
  kind: RoomKind;
  /** As written on the door and in the timetable, e.g. "H4/5", "O27/2201", "43.2.101" */
  name: string;
  /** Extra name, e.g. "Blauer Hörsaal" */
  title?: { de: string; en: string };
  /** Id of the building in `buildings.json` */
  building: string;
  /** Level ("Niveau") as given by the university */
  floor?: string;
  room?: string;
  seats?: number;
  /** Printer in or next to the room */
  printer?: { paper: string[]; color: boolean };
  lat: number;
  lng: number;
  /** Page of the room in the university's Hörsaalfinder */
  url: string;
};

export type BuildingProperties = {
  /** Used in the URL and referenced by rooms */
  id: string;
  /** Short label shown on the map, e.g. "O25", "West 45" */
  label: string;
  /** Full name if the label is an abbreviation */
  name?: string;
  /** Buildings that are mainly one kind of place (Mensa, library) appear in that category */
  kind?: "food" | "library";
  area: CampusArea;
  /** Other names people search for, e.g. "Quartier 45" */
  aliases?: string[];
  /** Where the label is placed (inside the largest part of the outline), `[lng, lat]` */
  center?: [number, number];
  /** Page on this website, e.g. the menu for the Mensa */
  href?: string;
};

export type BuildingFeature = {
  type: "Feature";
  properties: BuildingProperties;
  /** `null` if the outline is not known (the building is then shown by its rooms' pins) */
  geometry:
    | { type: "Polygon"; coordinates: number[][][] }
    | { type: "MultiPolygon"; coordinates: number[][][][] }
    | null;
};

export const ROOMS = roomsJson as Room[];

export const BUILDINGS = buildingsJson as {
  type: "FeatureCollection";
  features: BuildingFeature[];
};

/** Bounds of the map (`[west, south, east, north]`): the university including Michelsberg */
export const CAMPUS_BOUNDS: [number, number, number, number] = [
  9.9, 48.395, 10.03, 48.44,
];

/** Initial view: Uni West to Uni Ost */
export const CAMPUS_VIEW = {
  bounds: [9.9435, 48.4185, 9.9595, 48.4245] as [number, number, number, number],
};

/** Main campus (Uni West to Helmholtzstraße): categories only zoom to places inside this box */
export const MAIN_CAMPUS_BOUNDS: [number, number, number, number] = [
  9.94, 48.417, 9.966, 48.427,
];

/** Tram and bus stops inside this box (Uni West to Helmholtzstraße) are shown on the campus map */
export const STOP_BOUNDS: [number, number, number, number] = [
  9.938, 48.416, 9.968, 48.43,
];
