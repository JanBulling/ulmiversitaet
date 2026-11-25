import { parse } from "node-html-parser";

import type { IsoDate } from "@/lib/date";

/**
 * Parses the "Veranstaltungen heute" page of campusonline (QIS/LSF): every booking of a day
 * at the university, one table row each. Columns: start, end, number, title, building, room,
 * parallel group, lecturers. The room cell links to the room page with its id (`raum.rgid=36`);
 * bookings without a room (clinical blocks) have `raum.rgid=%20` and are skipped.
 *
 * For today, bookings that have already ended are no longer listed.
 */

export type Booking = {
  /** Room id in campusonline (`raum.rgid`) */
  qisId: number;
  /** `HH:MM` */
  start: string;
  /** `HH:MM`, exclusive: the room is free again at this time */
  end: string;
  title: string;
};

export class OccupancyParseError extends Error {
  name = "OccupancyParseError";
}

const HEADING = /Veranstaltungen am \S+ (\d{2})\.(\d{2})\.(\d{4})/;
const ROOM_ID = /raum\.rgid=(\d+)/;
const TIME = /^(\d{1,2}):(\d{2})$/;

/**
 * Bookings on `date`. Throws if the page isn't the list of that day (an error page, a
 * changed layout, or a different date), so a broken page never looks like a day without
 * bookings.
 */
export function parseOccupancy(html: string, date: IsoDate): Booking[] {
  const root = parse(html);

  const heading = root.querySelector("h2")?.text.match(HEADING);
  if (!heading) throw new OccupancyParseError("Missing date heading");
  const [, day, month, year] = heading;
  if (`${year}-${month}-${day}` !== date) {
    throw new OccupancyParseError(
      `Expected bookings of ${date}, got ${year}-${month}-${day}`,
    );
  }

  const table = root.querySelector("table");
  if (!table) {
    if (root.text.includes("Keine aktuellen Veranstaltungen")) return [];
    throw new OccupancyParseError("Missing booking table");
  }

  const header = table.querySelectorAll("th").map((th) => th.text.trim());
  if (header[0] !== "Beginn" || header[1] !== "Ende" || header[5] !== "Raum") {
    throw new OccupancyParseError(`Unexpected columns: ${header.join(", ")}`);
  }

  const bookings: Booking[] = [];
  for (const row of table.querySelectorAll("tr")) {
    const cells = row.querySelectorAll("td");
    if (cells.length < 6) continue; // header row

    const qisId = cells[5]
      .querySelector("a")
      ?.getAttribute("href")
      ?.match(ROOM_ID);
    if (!qisId) continue; // no room

    const start = time(cells[0].text);
    const end = time(cells[1].text);
    if (!start || !end) {
      throw new OccupancyParseError(
        `Unexpected times: "${cells[0].text.trim()}" – "${cells[1].text.trim()}"`,
      );
    }
    if (end <= start) continue; // nothing to block

    bookings.push({
      qisId: Number(qisId[1]),
      start,
      end,
      title: cells[3].text.replace(/\s+/g, " ").trim(),
    });
  }
  return bookings;
}

/** `" 8:00"` → `"08:00"` (zero-padded, so times compare as strings) */
function time(text: string): string | null {
  const match = text.trim().match(TIME);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : null;
}
