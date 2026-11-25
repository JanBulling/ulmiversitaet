import { formatDayFirst, type IsoDate } from "@/lib/date";

const ENDPOINT = "https://campusonline.uni-ulm.de/qislsf/rds";

/** "Veranstaltungen heute" in campusonline, linked as the source on the page */
export const OCCUPANCY_SOURCE_URL = `${ENDPOINT}?state=currentLectures&type=0&next=CurrentLectures.vm&nextdir=ressourcenManager`;

/** Fetches the list of all bookings on `date` (print view, any day can be requested) */
export async function fetchOccupancyHtml(date: IsoDate): Promise<string> {
  const params = new URLSearchParams({
    state: "currentLectures",
    type: "0",
    next: "CurrentLectures.vm",
    nextdir: "ressourcenManager",
    "P.Print": "",
    HISCalendar_Date: formatDayFirst(date),
  });

  const response = await fetch(`${ENDPOINT}?${params}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Occupancy request failed: ${response.status} (${date})`);
  }
  return response.text();
}
