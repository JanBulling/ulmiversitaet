# Parking forecast

On `/parking-lots`, every lot with a counter can be opened (the chevron on the right; `FEATURED_LOT` is open) to show a "popular times" chart like Google Maps: one bar per 30 minutes (two model slots averaged) from 06:00 to 22:00, for today and the next six days (chips in weekday order Mo–So, "Heute" in its place; days before today are next week's), colored like the live numbers (green / amber / red). Hovering or tapping a bar shows its free spaces on the right of the headline (fixed width, so the headline doesn't rewrap while scrubbing): the number and the time ("jetzt" for the current bar). For today it also says whether the lot is busier than usual right now and when it will probably be full.

The home page shows the same chart in a compact form next to the parking board, without a heading of its own (`compact`: no day selector, a slightly lower chart, no disclaimer) for the **whole campus, today only**: the main university lots of `CAMPUS_LOTS` (P24, P10, P11, P12, P41, P44) added up, 1248 spaces. The number next to the headline is the share of these spaces that is occupied. `combineLots()` adds up their models slot by slot and the live readings are summed. Because `weight` is the same for all lots, this is the same as adding up the forecasts of the single lots. If one counter can't be read, the chart shows the typical day without the live correction.

Each lot on the home page board also gets a **trend arrow** (`free-trend.tsx`): the expected change of free spaces in the next 30 minutes from the same forecast (`expectedFreeChange()`): shown next to the capacity like a stock ticker ("von 301 ↗ +29"): green and tilted up when more will be free, red and tilted down when fewer, an amber flat arrow without a number for less than 1 % of the lot (at least 2 spaces). The 30 minutes are in the tooltip and the screen reader text, so the board needs no legend. After 23:30 there is no arrow, the forecast ends at midnight.

The forecast comes from a small model built from counter readings that [parkingsim](https://github.com/raustefan/parkingsim) recorded every 5 minutes. The site stores no data for it: it reads the live counter as before and combines that one reading with the model.

## How it works

The model (`src/content/parking/forecast.json`, ~72 KB, ~16 KB gzipped) has, per DUU counter:

- `typical[weekday][slot]`: median number of parked cars per weekday and 15-minute slot (Berlin time).
- `low` / `high`: the emptiest and the fullest day seen in that slot (currently not shown on the site).
- `weight[h]`, shared by all lots: how much of today's deviation from typical is still there `h` slots later. It is learned from the data: 1.0 now, about 0.75 after 1 h, 0.47 after 3 h, 0.15 after 8 h, then 0.

The forecast for today is `typical + (live − typical now) × weight[h]`, kept between 0 and the lot's `total`. A lot that is fuller than usual at 8:00 is expected to stay fuller for the next hours, and the difference fades towards the usual pattern. Other days show the typical week. The current slot shows the live reading. A bold line above the chart says when the lot will probably be full (or that it won't fill up). Logic is in `src/features/parking/forecast.ts` (pure functions, tested in `forecast.test.ts`), UI in `src/components/parking/parking-forecast.tsx`.

"Now" is taken from `snapshot.updatedAt`, not from the clock, so the server and the browser render the same HTML (no hydration mismatch). The forecast updates with the existing 60-second refresh of `/api/parking`, because it gets the new snapshot as props.

### How good it is

`forecast/build.py` checks the model on the recorded days (each day predicted from the other days, weekdays, forecasts made 6:00 to 20:00). The mean error is in % of the lot's capacity:

| Ahead  | "Stays as now" | Typical week | Typical + live (used) |
| ------ | -------------- | ------------ | --------------------- |
| 15 min | 2.7 %          | 3.7 %        | **1.5 %**             |
| 1 h    | 10.2 %         | 3.7 %        | **2.8 %**             |
| 3 h    | 24.8 %         | 3.6 %        | **3.5 %**             |
| 6 h    | 44.7 %         | 4.0 %        | **3.9 %**             |

On P10 (301 spaces), an error of 3 % is about 9 spaces. This was measured on 11–25 Nov 2026, two normal lecture weeks only (see below).

## Integration

From the parkingsim repo, in the root of this repo:

```bash
cp -R ../parkingsim/forecast/src/. src/
cp ../parkingsim/forecast/docs/parking-forecast.md docs/
git apply ../parkingsim/forecast/ulmiversitaet.patch   # parking-overview.tsx + de/en texts
pnpm test && pnpm typecheck && pnpm lint
```

This was tested against commit `cb3cf90`: tests, typecheck and ESLint pass, and the page renders in `next dev`. No new dependencies are needed. The patch:

- wraps each lot row of `ParkingOverview` in a native `<details>`, so the forecast opens under the row without extra state. Lots without forecast data stay plain rows (`hasForecast`);
- adds `Parking.forecast` to `src/lib/i18n/messages/{de,en}.json`.

To show the forecast somewhere else, render `<ParkingForecast lot={lot} updatedAt={snapshot.updatedAt} />` with a lot from `getParkingSnapshot()`, or `<CampusParkingForecast lots={snapshot.lots} updatedAt={snapshot.updatedAt} />` for the campus. Both are client components; `ParkingForecast` renders nothing for lots without data.

## Updating the model

The model doesn't learn by itself. To retrain it with newer data (recommended at least once per semester and after the first holidays):

```bash
cd ../parkingsim && git pull && python3 forecast/build.py   # prints the backtest, writes the JSON
cp forecast/src/content/parking/forecast.json ../ulmiversitaet/src/content/parking/
```

Deploy as usual.

## Where to change what

| What                                                      | File                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| Lots in the campus forecast (home page)                   | `parking-lots.ts` → `CAMPUS_LOTS`                                |
| Trend: how far ahead, when it shows a dash                | `free-trend.tsx` → `TREND_MINUTES`, `same`                       |
| Hours shown as bars                                       | `parking-forecast.tsx` → `FIRST_HOUR`, `LAST_HOUR`               |
| "Busier / quieter than usual" threshold (10 % of the lot) | `forecast.ts` → `comparedToUsual`                                |
| What counts as full                                       | `occupancy.ts` → `occupancyLevel` (same red as the live numbers) |
| Texts                                                     | `src/lib/i18n/messages/{de,en}.json` → `Parking.forecast`        |
| Slot size, how far the live correction reaches            | `parkingsim/forecast/build.py` → `SLOT`, `HORIZON`               |

## Known gaps

- **Holidays and lecture-free time.** The model has only seen normal lecture weeks. On public holidays, between Christmas and New Year, during exams and the semester break it will predict a normal busy day. Fix: keep recording and, once those days are in the data, give the model the number of courses scheduled that day. This repo already reads them for any date (`getDayOccupancy(date)` in `src/features/free-rooms/queries.ts`, from campusonline's `HISCalendar_Date`), so it is the natural next input.
- **Little data.** Two weeks means two samples per weekday (three for Wednesday). Retrain regularly.
- **Counter drift.** The counters drift (e.g. negative values at night). The model learns the drifted values, which matches what the live numbers show.
- **Capacities differ.** The DUU app reports 160 spaces for P16, this site uses 174 (the counter did reach 174). The forecast is always clamped to the site's `total`.
- **M1 and M2** share counter 10021 and therefore show the same forecast, like the live numbers.
- **Weekday labels** come from the reading's day in Berlin. Right after midnight the snapshot may still be from the day before for up to a minute.
