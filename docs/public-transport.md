# Public transport (SWU)

The home page shows real-time departures of the university stops from the public API of Stadtwerke Ulm (SWU). No API key is needed. The departures page (`/public-transport`, linked via "Mehr Abfahrten" below the home panel) shows more departures for any stop.

## How it works

1. **Server** (`src/components/public-transport/public-transport-section.tsx`): on every request, loads the departures of the default stop and the current disruption notice, so the panel is filled on first paint.
2. **Browser** (`src/components/public-transport/departures-board.tsx`): refreshes the selected stop every 15 s directly from the SWU API (it allows cross-origin requests) and counts the departures down every second (`use-departures.ts`). "Near me" asks for the location and switches to the nearest stops.
3. **Departures page** (`src/components/public-transport/departures-explorer.tsx`): the featured stops as a 2×2 grid of tiles, a panel with the saved stops (yellow star), and a panel to search or find stops nearby on the left; up to 20 departures with platform and scheduled time on the right. The selected stop is in the URL (`?stop=1240`), so it can be shared. Saved stops are kept in the browser's `localStorage` (`saved-stops`, `use-saved-stops.ts`), never sent to the server.

Logic lives in `src/features/public-transport/`, data in `src/content/public-transport/`.

## Where to change what

| What                                                 | File                                                                                                           | Notes                                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Stops shown as tabs (Uni Süd, Bot. Garten, Uni West) | `src/content/public-transport/featured-stops.ts`                                                               | `stopId` = SWU stop number (see `stops.json`). The first one is the default.          |
| All stops (for "near me")                            | `src/content/public-transport/stops.json`                                                                      | Update with `pnpm update:transport`, don't edit names/coordinates by hand.            |
| Short stop names (tab labels)                        | `src/content/public-transport/stops.json` → `short_name`                                                       | Maintained by hand; the update script keeps them. Keep them short (≈ 14 characters).  |
| Line colors                                          | `src/content/public-transport/lines.ts` → `LINE_COLORS`                                                        | Key = line name as shown in departures (`"2"`, `"13"`, `"N5"`).                       |
| Tram (square) vs. bus (round) badge                  | `src/content/public-transport/lines.ts` → `TRAM_LINES`                                                         | Every line not listed is a bus.                                                       |
| Lines shown under a different name                   | `src/content/public-transport/lines.ts` → `LINE_ALIASES`                                                       | E.g. internal `"101"` (line 1 operated by bus) → `"1"`.                               |
| Refresh interval in the browser                      | `src/components/public-transport/use-departures.ts` → `REFRESH_INTERVAL_MS`                                    | SWU updates its data every 15 s; going lower doesn't help.                            |
| Number of departures (home page)                     | `src/features/public-transport/swu-api.ts` → `getDepartures(stopId, limit = 8)`                                |                                                                                       |
| Number of departures / nearby stops (page)           | `src/components/public-transport/departures-explorer.tsx` → `DEPARTURES_LIMIT`, `NEARBY_COUNT`                 | The API returns at most the next ~2 hours, whatever the limit.                        |
| Stop search (page)                                   | `src/features/public-transport/stops.ts` → `searchStops`                                                       | Searches full and short names from `stops.json`.                                      |
| "Near me": number of stops and radius                | `src/features/public-transport/nearest-stops.ts` → `findNearestStops(position, count = 3, maxDistance = 5000)` | Distance in meters.                                                                   |
| When a departure counts as on time                   | `src/features/public-transport/format.ts` → `ON_TIME_TOLERANCE_SECONDS`                                        | Currently 10 s.                                                                       |
| Countdown format ("Jetzt", "45 s", "3 min", time)    | `src/features/public-transport/format.ts` → `countdownLabel`                                                   | Labels are translated in `HomePage.PublicTransport` (`src/lib/i18n/messages/*.json`). |
| Texts and error messages                             | `src/lib/i18n/messages/{de,en}.json` → `HomePage.PublicTransport`                                              | `errors.location.*` for the "near me" errors.                                         |
| Texts of the departures page                         | `src/lib/i18n/messages/{de,en}.json` → `PublicTransport`                                                       | Departure rows reuse `HomePage.PublicTransport`.                                      |
| API base URL, timeout                                | `src/features/public-transport/swu-api.ts`                                                                     |                                                                                       |

## Updating the stops

SWU publishes its stops as base data (updated daily). The update script compares it with `stops.json`:

```bash
pnpm update:transport --dry-run   # show what would change
pnpm update:transport             # write src/content/public-transport/stops.json
```

What it does:

- **New stops** are taken from the stops served by SWU lines and appended at the end of the file, with a suggested short name (`Straße` → `Str.`, `Universität` → `Uni`, …). Check the suggestion and adjust it by hand.
- **Existing stops** get the current name and coordinates from SWU. Their short name is kept. Renamed stops are listed so you can check the short name.
- **Removed stops** are only dropped once SWU doesn't know them at all anymore (regional stops without SWU departures are neither added nor removed).
- The order of existing entries stays the same, so the git diff only shows real changes.

After running it: review the output and the diff, fix the short names of new or renamed stops, and commit `stops.json`. If a featured stop was renamed or removed, update `featured-stops.ts` too.

## Updating the lines

The SWU API lists all lines (`/route/attributes/BaseData`), but not their colors. The same script checks the configuration and prints:

- **Missing color** – a line runs that has no entry in `LINE_COLORS`. It would be shown as a white badge. Add its color from the SWU network map (swu.de → Liniennetz).
- **Wrong badge shape** – SWU lists the line as a tram but it isn't in `TRAM_LINES` (or the other way round).
- **Not in the SWU network anymore** – colors that can be removed (keeping them doesn't hurt).

Example: SWU introduces bus line 3 in light blue → add `"3": "#3BA9E0"` to `LINE_COLORS`. A new tram line 3 → additionally add `"3"` to `TRAM_LINES`.

## API endpoints

Base URL `https://api.swu.de/mobility/v1`:

| Endpoint                                               | Used for                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| `/stop/passage/Departures?StopNumber=1240&Limit=8`     | Departures of a stop (home page and departures page, every 15 s) |
| `/passenger/alert/UnplannedAlert?ContentScope=minimal` | Current disruption notice (home page)                            |
| `/stop/attributes/BaseData?ContentScope=extended`      | Stops served by SWU lines (update script)                        |
| `/stop/attributes/BaseData`                            | All stops incl. regional ones (update script)                    |
| `/route/attributes/BaseData`                           | All lines with their category, 1 = tram, 5 = bus (update script) |

Note: the disruption endpoint can report `"CurrentStatus": "OK"` while sending an alert text; the text decides whether a disruption is shown.

## Tests

`pnpm test` covers parsing (with real responses in `src/features/public-transport/__fixtures__/`), formatting, the nearest-stop search, the stop search, and the update logic. If SWU changes its response format, save a new response there and adjust the parser in `swu-api.ts`.
