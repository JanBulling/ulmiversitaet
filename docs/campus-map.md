# Campus map

`/campus-map` is a searchable map of the university: lecture halls, seminar rooms, PC pools, printers, buildings, food, libraries, top-up machines, tram stops and parking lots. Type a room ("H4/5", "O27/2201", "43.2.101") or a building ("O25", "Quartier 45"), or pick a category. The selected place is highlighted on the map (its building outline and a pin) and shown with its facts, the nearest stop, a route link (Google Maps, walking) and the page in the university's Hörsaalfinder. The selection is part of the URL (`/campus-map?p=o25-h1`), so it can be shared or linked from elsewhere (e.g. an event location).

## How it works

- **Data** (`src/content/campus-map/`), all local, no API:
  - `rooms.json`: 117 rooms, generated once from the [Hörsaalfinder](https://www.uni-ulm.de/einrichtungen/kiz/weiteres/campus-navigation/hoersaalfinder/) (building, level, room number, seats, printer, the pin from its OpenStreetMap link). One room per line, edited by hand from now on. Contact persons from the Hörsaalfinder are deliberately not copied.
  - `buildings.json`: building outlines as GeoJSON with the label shown on the map. Mostly from OpenStreetMap; `center` is where the label sits. Buildings without a known outline (N23, O23, AEA 12, Frauenklinik) have `geometry: null` and are shown by the pins of their rooms.
  - `places.ts`: food, libraries, services and top-up machines (coordinates from OpenStreetMap).
  - Tram/bus stops come from `src/content/public-transport/stops.json` (inside `STOP_BOUNDS`), parking lots from `src/content/parking/parking-lots.ts`.
- **Search** (`src/features/campus-map/`): `getCampusPlaces(locale)` turns everything into one list; `searchPlaces()` ranks exact names first, then names starting with the query, then places where every word matches (name, building, aliases, kind words in German and English, "Hörsaal"/"Hoersaal"). Runs in the browser, nothing is sent anywhere. Tested in `campus-map.test.ts` (also checks unique ids, existing buildings, coordinates in bounds).
- **Map** (`src/components/campus-map/map-view.tsx`): [MapLibre GL](https://maplibre.org) with vector tiles from [OpenFreeMap](https://openfreemap.org) (free, no API key, no cookies; light "positron" and "dark" style follow the site theme). It is only loaded on this page. The worker file of maplibre-gl 6 is referenced with `new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url)`, so the bundler ships it as a static file. If WebGL or the style is unavailable, a notice is shown and the search still works.

## Where to change what

| What                                   | File                                                               | Notes                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Add or fix a room                      | `src/content/campus-map/rooms.json`                                | See below.                                                                                                       |
| Building label, name, aliases, outline | `src/content/campus-map/buildings.json`                            | `aliases` are search words ("Quartier 45"). Outlines can be drawn or edited on [geojson.io](https://geojson.io). |
| Cafeterias, services, top-up machines  | `src/content/campus-map/places.ts`                                 | `kind`: `food`, `library`, `service`, `top-up`.                                                                  |
| Which stops appear                     | `src/content/campus-map/index.ts` → `STOP_BOUNDS`                  |                                                                                                                  |
| Initial view, map bounds               | `src/content/campus-map/index.ts` → `CAMPUS_VIEW`, `CAMPUS_BOUNDS` |                                                                                                                  |
| Area a category zooms to               | `src/content/campus-map/index.ts` → `MAIN_CAMPUS_BOUNDS`           | Places outside (Michelsberg, stops in the city) are listed but don't zoom the map out.                           |
| Categories and their order             | `src/features/campus-map/search.ts` → `CATEGORIES`                 | Labels in `CampusMap.categories`.                                                                                |
| Search words for a kind ("Drucker")    | `src/features/campus-map/places.ts` → `KIND_KEYWORDS`              |                                                                                                                  |
| Map colors, base map style             | `src/components/campus-map/map-view.tsx` → `COLORS`, `STYLES`      | Colors derived from `--primary`.                                                                                 |
| Icons per kind                         | `src/components/campus-map/kind-icon.tsx`                          |                                                                                                                  |
| Texts                                  | `src/lib/i18n/messages/{de,en}.json` → `CampusMap`                 |                                                                                                                  |

## Adding a room

Add one line to `rooms.json`:

```json
{
  "id": "o27-2205",
  "kind": "seminar-room",
  "name": "O27/2205",
  "building": "o27",
  "floor": "2",
  "room": "2205",
  "seats": 30,
  "lat": 48.42301,
  "lng": 9.95745,
  "url": "https://www.uni-ulm.de/…"
}
```

- `id`: lowercase, letters/digits/dashes, unique (it is the URL: `?p=o27-2205`).
- `kind`: `lecture-hall`, `seminar-room`, `pc-pool` or `printer`.
- `name`: as on the door and in the timetable. Lecture halls are found as "H1", "Hörsaal 1" and "O25 H1" automatically; rooms as "O27 2205" and "2205".
- `building`: an `id` from `buildings.json`.
- `title` (optional): extra name in both languages, e.g. `{"de": "Blauer Hörsaal", "en": "Blue lecture hall"}`.
- `printer` (optional): `{"paper": ["A4", "A3"], "color": true}`.
- Coordinates: right-click in OpenStreetMap or Google Maps → copy. `url` is the Hörsaalfinder page; leave it out if there is none.

`pnpm test` checks the ids, the building references and that the coordinates lie in the map area.

## Known gaps

- Some Hörsaalfinder pins don't lie inside the outline of the building they name (PC-Pool 8 "M25" is in O26, O25/346 is in N25). The pins and building codes are kept as the university publishes them.
- N23/O23 (clinic buildings with Hörsaal Chirurgie, Hörsaal Innere Medizin and four seminar rooms) have no outline yet.
- Offices (Studierendensekretariat, StuVe, International Office, …) are not on the map yet; add them to `places.ts` (new `kind` if needed).
