# Parking

The home page shows the free spaces of the main university parking lots; `/parking-lots` lists all lots with a live counter, grouped by area. The numbers come from the parking guidance system of the university (DUU), which counts the cars per lot.

## How it works

1. The DUU API (`http://tsu-app.rrooaarr.biz/front/soap.php?counterid=…`) returns the number of parked cars as plain text. The counters drift and can go negative (e.g. `-4` on a nearly empty lot) or above the capacity, so free spaces are kept between 0 and the total. Unknown counters answer `-1`, which looks like a drifted counter, so check new counter ids by hand (see below). It is **HTTP-only and has no CORS headers**, so browsers can't call it from the HTTPS site; only our server does.
2. `getParkingSnapshot()` (`src/features/parking/queries.ts`) reads all counters in parallel and computes free spaces = total − parked cars, limited to 0 … total. The result is cached for one minute, so all visitors share one reading.
3. The page is rendered with that data. In the browser, `/api/parking` (Route Handler) is polled every 60 s to update the numbers (paused while the tab is hidden).

Logic lives in `src/features/parking/`, data in `src/content/parking/parking-lots.ts`, UI in `src/components/parking/`.

## Where to change what

| What                                                  | File                                                                     | Notes                                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Parking lots (name, code, counter, capacity, address) | `src/content/parking/parking-lots.ts` → `PARKING_LOTS`                   | `counterId: null` = no live data, the lot is hidden.                           |
| Lots on the home page and their order                 | `src/content/parking/parking-lots.ts` → `HOME_LOTS`                      | Shown on desktop.                                                              |
| Lots on the home page on mobile                       | `src/content/parking/parking-lots.ts` → `HOME_LOTS_MOBILE`               | Must be a subset of `HOME_LOTS`; uses `shortName`.                             |
| Areas and their order on `/parking-lots`              | `src/content/parking/parking-lots.ts` → `PARKING_AREAS`                  | Area names are translated in `Parking.areas` (`src/lib/i18n/messages/*.json`). |
| Colors and thresholds (green / amber / red)           | `src/features/parking/occupancy.ts`                                      | Red at ≤ 5 % or ≤ 2 free spaces, amber at ≤ 10 %.                              |
| Refresh interval in the browser                       | `src/components/parking/use-parking-snapshot.ts` → `REFRESH_INTERVAL_MS` | 60 s.                                                                          |
| Server cache time                                     | `src/features/parking/queries.ts` → `cacheLife(...)`                     | Re-read at most once per minute.                                               |
| API URL, timeout                                      | `src/features/parking/duu-api.ts`                                        |                                                                                |
| Texts                                                 | `src/lib/i18n/messages/{de,en}.json` → `Parking`                         |                                                                                |

## Adding or changing a lot

1. Find the counter id: the DUU overview (`http://tsu-app.rrooaarr.biz/front/mitarbeiter.html`) and the network requests of that page show the `counterid` of each lot. Check it with `curl "http://tsu-app.rrooaarr.biz/front/soap.php?counterid=<id>"`; it should print a number that changes over the day (unknown ids print `-1` or `0`).
2. Add an entry to `PARKING_LOTS` with `code`, `counterId`, `total` (number of spaces), `area`, and `address`. `name`/`shortName` are optional; lots without a name are shown by their code.
3. To show it on the home page, add its code to `HOME_LOTS` (and to `HOME_LOTS_MOBILE` for small screens).
4. `pnpm test` checks the config: unique codes, home lots exist and have a counter, every area is listed in `PARKING_AREAS`.

If the capacity of a lot changes, update `total`; free spaces are computed from it.

Note: M1 (HNO Klinik) and M2 (Klinik Michelsberg) share one counter in the DUU system, so they always show the same number.

## Error handling

- A counter that can't be read (network error, unexpected response) shows "–" for its lot; if no counter can be read at all, the panel shows an error message.
- If the browser refresh fails, the last numbers stay visible with a note that they may be out of date.
