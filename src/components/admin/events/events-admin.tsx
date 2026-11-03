import { CalendarClock, History, Pencil, Plus } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { Button } from "@/components/ui/button";
import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
} from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { today } from "@/lib/date";
import type { Event } from "@/lib/db/schema";
import { Link } from "@/lib/i18n/navigation";
import { DEFAULT_EVENT_COLOR } from "@/features/events/format";
import { formatEventDates, formatEventTimes } from "@/features/events/format";
import { listEvents } from "@/features/admin/events/queries";
import { EventForm } from "./event-form";

export async function EventsAdmin() {
  await connection(); // split into upcoming/past by today
  const [t, { upcoming, past }] = await Promise.all([
    getTranslations("Admin.events"),
    listEvents(today()),
  ]);

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
      <div className="space-y-4 md:col-span-4">
        <Panel>
          <PanelHeader icon={CalendarClock} title={t("upcoming")}>
            {upcoming.length}
          </PanelHeader>
          {upcoming.length === 0 ? (
            <PanelEmpty>{t("noUpcoming")}</PanelEmpty>
          ) : (
            <EventList events={upcoming} />
          )}
        </Panel>
        {past.length > 0 && (
          <Panel>
            <PanelHeader icon={History} title={t("past")} />
            <EventList events={past} />
          </Panel>
        )}
      </div>

      <Panel className="md:col-span-3">
        <PanelHeader icon={Plus} title={t("new")} />
        <PanelBody>
          <EventForm />
        </PanelBody>
      </Panel>
    </div>
  );
}

export function EventsAdminSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
      <Panel className="space-y-3 px-4 md:col-span-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </Panel>
      <Panel className="space-y-3 px-4 md:col-span-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </Panel>
    </div>
  );
}

async function EventList({ events }: { events: Event[] }) {
  const [t, tHome, format] = await Promise.all([
    getTranslations("Admin.events"),
    getTranslations("HomePage.Events"),
    getFormatter(),
  ]);

  return (
    <ul className="divide-y divide-accent">
      {events.map((event) => (
        <li key={event.id} className="flex items-center gap-3 px-4 py-2">
          <span
            className="size-3 shrink-0 rounded-full"
            style={{ backgroundColor: event.color ?? DEFAULT_EVENT_COLOR }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{event.title}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {formatEventDates(format, event)}
              {(() => {
                const times = formatEventTimes(event, (time) =>
                  tHome("openEnd", { time }),
                );
                return times ? ` · ${times}` : "";
              })()}
              {event.location && (
                <span className="font-sans"> · {event.location}</span>
              )}
            </p>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/events/${event.id}`} aria-label={t("edit")}>
              <Pencil />
            </Link>
          </Button>
        </li>
      ))}
    </ul>
  );
}
