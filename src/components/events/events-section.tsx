import { CalendarClock } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { Panel, PanelHeader } from "@/components/ui/panel";
import { addDays, startOfMonth, today } from "@/lib/date";
import type { Event } from "@/lib/db/schema";
import {
  DEFAULT_EVENT_COLOR,
  formatEventDates,
  formatEventTimes,
} from "@/features/events/format";
import { getEventsBetween, getUpcomingEvents } from "@/features/events/queries";
import { EventCalendar } from "./event-calendar";

/** Months the calendar can show, starting with the current one */
const CALENDAR_MONTHS = 3;

/**
 * Month calendar with the event days marked, next to the list of upcoming events
 * (like on the previous site). Renders nothing if there are no upcoming events.
 */
export async function EventsSection({ className }: { className?: string }) {
  await connection(); // "upcoming" depends on today
  const now = today();
  const [upcoming, calendarEvents] = await Promise.all([
    getUpcomingEvents(now),
    getEventsBetween(
      startOfMonth(now),
      addDays(startOfMonth(now, CALENDAR_MONTHS), -1),
    ),
  ]);
  if (upcoming.length === 0) return null;

  const t = await getTranslations("HomePage.Events");

  return (
    <Panel className={className}>
      <PanelHeader icon={CalendarClock} title={t("title")} />
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 px-4 md:grid-cols-2">
        {/* Desktop only; on mobile the list alone is enough */}
        <div className="hidden md:block">
          <EventCalendar
            today={now}
            monthCount={CALENDAR_MONTHS}
            events={calendarEvents.map((event) => ({
              ...event,
              color: event.color ?? DEFAULT_EVENT_COLOR,
            }))}
          />
        </div>
        <div>
          <h3 className="hidden h-9 items-center font-semibold md:flex">
            {t("futureEvents")}
          </h3>
          <ul className="space-y-2 md:mt-2">
            {upcoming.map((event) => (
              <li key={event.id}>
                <EventRow event={event} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

/** Light-gray box: color dot and title, then date · time · location, then the description */
async function EventRow({ event }: { event: Event }) {
  const [t, format] = await Promise.all([
    getTranslations("HomePage.Events"),
    getFormatter(),
  ]);
  const times = formatEventTimes(event, (time) => t("openEnd", { time }));

  return (
    <article className="flex gap-3 rounded-lg border bg-muted px-4 py-3">
      <span
        className="mt-1.5 size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: event.color ?? DEFAULT_EVENT_COLOR }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <h4 className="font-semibold">{event.title}</h4>
        <p className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
          <span className="font-mono">{formatEventDates(format, event)}</span>
          {times && (
            <>
              <span aria-hidden>·</span>
              <span className="font-mono">{times}</span>
            </>
          )}
          {event.location && (
            <>
              <span aria-hidden>·</span>
              <span>{event.location}</span>
            </>
          )}
        </p>
        {event.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {event.description}
          </p>
        )}
      </div>
    </article>
  );
}
