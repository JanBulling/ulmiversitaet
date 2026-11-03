import { refreshMenus } from "@/features/mensa/sync/refresh-menus";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { isIsoDate, isWeekend, today } from "@/lib/date";

export const maxDuration = 60;

/**
 * Daily, in the morning: refreshes today's menu, because the mensa sometimes changes it
 * on short notice. `?date=YYYY-MM-DD` refreshes another day (manual use).
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const param = new URL(request.url).searchParams.get("date");
  if (param !== null && !isIsoDate(param)) {
    return new Response("Invalid date", { status: 400 });
  }

  const date = param ?? today();
  if (isWeekend(date)) {
    return Response.json({ skipped: `${date} is a weekend` });
  }

  const results = await refreshMenus([date]);
  const failed = results.some((result) => result.status === "error");
  return Response.json(results, { status: failed ? 500 : 200 });
}
