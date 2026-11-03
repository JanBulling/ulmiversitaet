import { refreshMenus } from "@/features/mensa/sync/refresh-menus";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { addDays, isIsoDate, startOfWeek, today, weekdaysOf } from "@/lib/date";

export const maxDuration = 60;

/**
 * Weekly: loads Monday to Friday of next week, so the menu can be shown in advance.
 * `?week=YYYY-MM-DD` loads the week containing that date instead (manual use).
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const param = new URL(request.url).searchParams.get("week");
  if (param !== null && !isIsoDate(param)) {
    return new Response("Invalid date", { status: 400 });
  }

  const monday = param ? startOfWeek(param) : addDays(startOfWeek(today()), 7);
  const results = await refreshMenus(weekdaysOf(monday));
  const failed = results.some((result) => result.status === "error");
  return Response.json(results, { status: failed ? 500 : 200 });
}
