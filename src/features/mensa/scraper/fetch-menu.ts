import { addDays, startOfWeek, type IsoDate } from "@/lib/date";

const ENDPOINT =
  "https://sw-ulm-spl51.maxmanager.xyz/inc/ajax-php_konnektor.inc.php";

/** `locationId` of the Mensa of Ulm University */
const MENSA_LOCATION_ID = 1;

/** Fetches the raw menu HTML for one day (the same request the Studierendenwerk website makes) */
export async function fetchMenuHtml(
  date: IsoDate,
  lang: "de" | "en",
): Promise<string> {
  const monday = startOfWeek(date);
  const body = new URLSearchParams({
    func: "make_spl",
    locId: String(MENSA_LOCATION_ID),
    lang,
    date,
    // Required by the endpoint, otherwise the response is empty
    startThisWeek: monday,
    startNextWeek: addDays(monday, 7),
  });

  const response = await fetch(ENDPOINT, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(
      `Menu request failed: ${response.status} (${date}, ${lang})`,
    );
  }

  const html = await response.text();
  if (!html.trim()) throw new Error(`Empty menu response (${date}, ${lang})`);
  return html;
}
