/**
 * Places on the campus map that are not rooms: food, libraries, services.
 * Maintained by hand; coordinates from OpenStreetMap. Rooms are in `rooms.json`, building
 * outlines in `buildings.json`; tram stops and parking lots are added from their own data.
 * See docs/campus-map.md.
 */

import type { Localized } from "@/content/links";

export type PlaceKind = "food" | "library" | "service" | "top-up";

export type Place = {
  /** Used in the URL (`/campus-map?p=<id>`), must be unique across rooms, buildings and places */
  id: string;
  kind: PlaceKind;
  name: Localized;
  /** Short description below the name */
  description?: Localized;
  floor?: string;
  lat: number;
  lng: number;
  /** Page on this website, e.g. the menu */
  href?: string;
  /** External page */
  url?: string;
  /** Extra search words (any language) */
  keywords?: string[];
};

export const PLACES: Place[] = [
  // ── Food and coffee (the Mensa itself is a building, see buildings.json) ──
  { id: "cafeteria-nord", kind: "food", name: "Cafeteria Nord", description: { de: "Cafeteria des Studierendenwerks", en: "Cafeteria of the Studierendenwerk" }, floor: "2", lat: 48.42286, lng: 9.95349, keywords: ["Cafeteria B", "Kaffee", "Coffee"] },
  { id: "cafeteria-west", kind: "food", name: "Cafeteria West", description: { de: "Cafeteria des Studierendenwerks", en: "Cafeteria of the Studierendenwerk" }, floor: "1", lat: 48.42096, lng: 9.94892, keywords: ["Mensa West", "Kaffee", "Coffee"] },
  { id: "west-side-diner", kind: "food", name: "West Side Diner", description: { de: "Studierendenwerk", en: "Studierendenwerk" }, lat: 48.42115, lng: 9.94885, keywords: ["Burger"] },
  { id: "campus-diner", kind: "food", name: "Campus Diner", description: { de: "Studierendenwerk", en: "Studierendenwerk" }, lat: 48.42206, lng: 9.95634, keywords: ["Burger"] },
  { id: "southside", kind: "food", name: "Southside", description: { de: "Café des Studierendenwerks", en: "Café of the Studierendenwerk" }, floor: "2", lat: 48.42227, lng: 9.95586, keywords: ["Kaffee", "Coffee", "Café"] },
  { id: "campuccino", kind: "food", name: "Campuccino", description: { de: "Café der Studierendenvertretung", en: "Café of the student union" }, floor: "2", lat: 48.42282, lng: 9.95534, keywords: ["Kaffee", "Coffee", "Café", "StuVe"] },
  { id: "kaffeewuerfel", kind: "food", name: "Kaffeewürfel", description: { de: "Café", en: "Café" }, floor: "2", lat: 48.42299, lng: 9.95369, keywords: ["Kaffee", "Coffee"] },
  { id: "cafeteria-helmholtzstrasse", kind: "food", name: { de: "Cafeteria Helmholtzstraße", en: "Cafeteria Helmholtzstraße" }, description: { de: "Studierendenwerk", en: "Studierendenwerk" }, floor: "-1", lat: 48.42509, lng: 9.963, keywords: ["Kaffee", "Coffee"] },

  // ── Libraries (the Bibliotheks-Zentrale is a building) ──
  { id: "bibliothek-helmholtzstrasse", kind: "library", name: { de: "Bibliothek Helmholtzstraße", en: "Library Helmholtzstraße" }, lat: 48.42535, lng: 9.96357, keywords: ["Bib", "UB"] },

  // ── Services ──
  { id: "unifit", kind: "service", name: "UNIfit", description: { de: "Fitnessstudio des Hochschulsports", en: "Gym of the university sports" }, lat: 48.42235, lng: 9.95596, keywords: ["Sport", "Gym", "Fitness"] },
  { id: "fairteiler", kind: "service", name: "Fairteiler", description: { de: "Foodsharing: Lebensmittel abgeben und mitnehmen", en: "Food sharing: leave and take food" }, lat: 48.42248, lng: 9.9559, keywords: ["Foodsharing"] },
  { id: "fahrradwerkstatt", kind: "service", name: { de: "Fahrradwerkstatt", en: "Bike workshop" }, description: { de: "Selbsthilfewerkstatt der StuVe", en: "Self-service workshop of the StuVe" }, lat: 48.42449, lng: 9.95217, keywords: ["Fahrrad", "Bike", "Reparatur", "Repair", "StuVe"] },

  // ── Top-up machines for the student card (EC card) ──
  { id: "aufwerter-mensa", kind: "top-up", name: { de: "Aufwerter Mensa", en: "Top-up machine Mensa" }, lat: 48.42213, lng: 9.95544 },
  { id: "aufwerter-southside", kind: "top-up", name: { de: "Aufwerter Southside", en: "Top-up machine Southside" }, lat: 48.42217, lng: 9.95556 },
  { id: "aufwerter-cafeteria-nord", kind: "top-up", name: { de: "Aufwerter Cafeteria Nord", en: "Top-up machine Cafeteria Nord" }, floor: "2", lat: 48.4229, lng: 9.95375 },
  { id: "aufwerter-cafeteria-west", kind: "top-up", name: { de: "Aufwerter Cafeteria West", en: "Top-up machine Cafeteria West" }, floor: "1", lat: 48.42103, lng: 9.94879 },
  { id: "aufwerter-bibliothek", kind: "top-up", name: { de: "Aufwerter Bibliothek", en: "Top-up machine library" }, floor: "1", lat: 48.42132, lng: 9.94856 },
  { id: "aufwerter-helmholtzstrasse", kind: "top-up", name: { de: "Aufwerter Helmholtzstraße", en: "Top-up machine Helmholtzstraße" }, floor: "-1", lat: 48.4251, lng: 9.96306 },
];
