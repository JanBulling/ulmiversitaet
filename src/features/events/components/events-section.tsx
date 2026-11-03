import { CalendarClock, CalendarDays, Clock, MapPin } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { Panel, PanelHeader } from "@/components/ui/panel";
import { today } from "@/lib/date";
import type { Event } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { formatEventDates, formatEventTimes } from "../format";
import { getUpcomingEvents } from "../queries";

export const DEFAULT_EVENT_COLOR = "#f83a22";

/** The next few events; renders nothing if there are none */
export async function EventsSection({ className }: { className?: string }) {
  await connection(); // "upcoming" depends on today
  const upcoming = await getUpcomingEvents(today());
  if (upcoming.length === 0) return null;

  const t = await getTranslations("HomePage.Events");

  return (
    <Panel className={className}>
      <PanelHeader icon={CalendarClock} title={t("title")} />
      <ul className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {upcoming.map((event) => (
          <li key={event.id}>
            <EventItem event={event} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

async function EventItem({ event }: { event: Event }) {
  const [t, format] = await Promise.all([
    getTranslations("HomePage.Events"),
    getFormatter(),
  ]);
  const color = event.color ?? DEFAULT_EVENT_COLOR;
  const times = formatEventTimes(event, (time) => t("openEnd", { time }));

  return (
    <article
      className={cn(
        "h-full space-y-1 rounded-lg border border-l-4 bg-muted px-4 py-3",
      )}
      style={{ borderLeftColor: color }}
    >
      <h3 className="font-semibold">{event.title}</h3>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 font-mono">
          <CalendarDays
            className="size-4 shrink-0"
            style={{ color }}
            aria-hidden
          />
          {formatEventDates(format, event)}
        </span>
        {times && (
          <span className="inline-flex items-center gap-1.5 font-mono">
            <Clock className="size-4 shrink-0" style={{ color }} aria-hidden />
            {times}
          </span>
        )}
      </p>
      {event.location && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {event.location}
        </p>
      )}
      {event.description && (
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {event.description}
        </p>
      )}
    </article>
  );
}
