"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  addDays,
  startOfMonth,
  startOfWeek,
  toDate,
  type IsoDate,
} from "@/lib/date";
import { cn } from "@/lib/utils";

export type CalendarEvent = {
  id: string;
  title: string;
  color: string;
  startDate: IsoDate;
  endDate: IsoDate;
};

/**
 * Compact month calendar; days with events get a colored dot per event (up to three).
 * Navigates from the current month up to `monthCount - 1` months ahead.
 */
export function EventCalendar({
  events,
  today,
  monthCount,
}: {
  events: CalendarEvent[];
  today: IsoDate;
  monthCount: number;
}) {
  const t = useTranslations("HomePage.Events");
  const format = useFormatter();
  const [offset, setOffset] = useState(0);

  const month = startOfMonth(today, offset);
  const nextMonth = startOfMonth(today, offset + 1);
  const days: IsoDate[] = [];
  const lastDay = addDays(nextMonth, -1);
  for (
    let day = startOfWeek(month);
    day <= addDays(startOfWeek(lastDay), 6);
    day = addDays(day, 1)
  ) {
    days.push(day);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          disabled={offset === 0}
          onClick={() => setOffset(offset - 1)}
          aria-label={t("previousMonth")}
        >
          <ChevronLeft />
        </Button>
        <p className="font-semibold" aria-live="polite">
          {format.dateTime(toDate(month), { month: "long", year: "numeric" })}
        </p>
        <Button
          variant="ghost"
          size="icon"
          disabled={offset === monthCount - 1}
          onClick={() => setOffset(offset + 1)}
          aria-label={t("nextMonth")}
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center">
        {days.slice(0, 7).map((day) => (
          <span key={day} className="py-1 text-xs text-muted-foreground">
            {format.dateTime(toDate(day), { weekday: "short" })}
          </span>
        ))}
        {days.map((day) => {
          const dayEvents = events.filter(
            (event) => event.startDate <= day && event.endDate >= day,
          );
          const inMonth = day >= month && day < nextMonth;
          return (
            <div
              key={day}
              title={dayEvents.map((event) => event.title).join(", ")}
              className={cn(
                "flex h-10 flex-col items-center justify-center gap-1 rounded-md text-sm",
                !inMonth && "text-muted-foreground/50",
                day === today
                  ? "bg-primary font-semibold text-primary-foreground"
                  : dayEvents.length > 0 && inMonth && "bg-muted font-semibold",
              )}
            >
              <span className="font-mono leading-none">
                {toDate(day).getUTCDate()}
              </span>
              <span className="flex h-1.5 gap-0.5" aria-hidden>
                {dayEvents.slice(0, 3).map((event) => (
                  <span
                    key={event.id}
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
