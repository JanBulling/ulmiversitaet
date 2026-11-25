# Free rooms

`/free-rooms` shows which lecture halls and seminar rooms are free, today and on the next weekday ("Morgen", or "Montag" on Fridays and weekends). Pick a time ("Jetzt" or every half hour from 07:00 to 21:00), how long the room should stay free, the room type (Hörsaal/Seminarraum) and the area (Uni Ost, Uni West, Helmholtzstraße). Each free room shows until when it is free and what comes next; the row opens the room on the campus map. It is linked from the quick links on the home page and from the link collection.

## How it works

- **Rooms** are the lecture halls and seminar rooms of the campus map (`src/content/campus-map/rooms.json`) in Uni Ost, Uni West and Helmholtzstraße. The clinics at Michelsberg are left out. Each room has `qisIds`: its room id(s) in campusonline.
- **Bookings** come from campusonline's [Veranstaltungen heute](https://campusonline.uni-ulm.de/qislsf/rds?state=currentLectures&type=0&next=CurrentLectures.vm&nextdir=ressourcenManager): a public HTML table of every booking of a day at the whole university (lectures, exams, events, closures like "Sanierung Lüftungsanlage"). Any day can be requested with `HISCalendar_Date=DD.MM.YYYY`. Every row links to its room with `raum.rgid=<id>`, which is matched against `qisIds`; rows without a room are skipped.
  - `fetch-occupancy.ts` requests the print view of a day, `parse-occupancy.ts` reads the table. The parser throws if the page isn't the list of the requested day (error page, changed layout), so an outage is shown as an error and never as "everything free". Tested with real pages in `__fixtures__/` (lecturer names removed).
  - For **today**, campusonline drops bookings that have already ended. That's why the time can only be set to later times today.
- **Caching** (`queries.ts`): `getOccupancy(date)` is `"use cache"` for 10 minutes (served stale for up to an hour while it refreshes), so all visitors share one request to campusonline. Failed requests are not cached. Weekends aren't requested at all: the buildings are closed, the page says so.
- **Availability** (`availability.ts`): pure functions. A room is busy if a booking runs at the chosen time (the end time is exclusive), and stays busy through back-to-back or overlapping bookings. A free room is free until the start of its next booking or for the rest of the day. The page loads the bookings of both days once; changing day, time or filters happens in the browser (`src/components/free-rooms/free-rooms-explorer.tsx`).

## Where to change what

| What                         | File                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| Room ↔ campusonline id       | `src/content/campus-map/rooms.json` → `qisIds`                                                            |
| Areas and room types offered | `src/features/free-rooms/types.ts` → `FREE_ROOM_AREAS`, `FREE_ROOM_KINDS`                                 |
| Selectable times, durations  | `src/components/free-rooms/free-rooms-explorer.tsx` → `FIRST_TIME`, `LAST_TIME`, `TIME_STEP`, `DURATIONS` |
| Cache lifetime               | `src/features/free-rooms/queries.ts` → `getOccupancy`                                                     |
| Texts                        | `src/lib/i18n/messages/{de,en}.json` → `FreeRooms` (room types and areas from `CampusMap`)                |

## Finding the campusonline id of a room

Open the room in campusonline (e.g. from a lecture's dates, or the "Veranstaltungen heute" list): the link ends in `raum.rgid=<id>`. The room page (`https://campusonline.uni-ulm.de/qislsf/rds?state=verpublish&status=init&vmfile=no&moduleCall=webInfo&publishConfFile=webInfoRaum&publishSubDir=raum&keep=y&raum.rgid=<id>`) shows building, room number, room type and seats, so the id can be checked. Ids go up to about 650.

- Use the room itself, not the "Lernfläche" (study spots) in front of lecture halls, which have their own ids.
- If a room is also booked together with a neighbor under a separate id, add both ids.
- `"qisIds": []` means the room isn't in campusonline (currently N25/2102 and O27/2301); it is then not listed, because its bookings are unknown. `pnpm test` fails if a lecture hall or seminar room has no `qisIds` at all, or if two rooms share an id.

## Known gaps

- Only bookings made in campusonline are known. A free room can still be locked, used for an exam or booked elsewhere; the page says so.
- Public holidays and lecture-free days aren't detected; there are just fewer bookings.
- Times are taken as listed (a "10:00–12:00" lecture blocks the room until 12:00, even if it ends at 11:45).

## Ideas

- Campus map: show for a selected room whether it is free right now or which lecture is running.
