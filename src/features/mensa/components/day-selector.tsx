import { ChevronLeft, ChevronRight } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import {
  addDays,
  startOfWeek,
  toDate,
  weekdaysOf,
  type IsoDate,
} from "@/lib/date";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/** Weekday links for the week of `selected`; navigation is limited to this and next week */
export async function DaySelector({
  selected,
  today,
}: {
  selected: IsoDate;
  today: IsoDate;
}) {
  const [t, format] = await Promise.all([
    getTranslations("Mensa"),
    getFormatter(),
  ]);

  const week = startOfWeek(selected);
  const currentWeek = startOfWeek(today);
  const hasPrevious = week > currentWeek;
  const hasNext = week < addDays(currentWeek, 7);

  return (
    <nav className="flex items-center justify-between gap-2 px-4 md:justify-center md:px-0">
      <WeekButton
        href={`/mensa/${addDays(week, -7)}`}
        enabled={hasPrevious}
        label={t("previousWeek")}
      >
        <ChevronLeft className="size-5" />
      </WeekButton>

      <div className="flex items-center justify-center gap-1">
        {weekdaysOf(week).map((day) => (
          <Button
            key={day}
            variant={
              day === selected ? "default" : day === today ? "outline" : "ghost"
            }
            size="sm"
            asChild
          >
            <Link
              href={`/mensa/${day}`}
              aria-current={day === selected ? "date" : undefined}
            >
              {day === today ? (
                t("today")
              ) : (
                <>
                  {/* Weekday only on small screens, so the week fits in one row */}
                  <span className="sm:hidden">
                    {format.dateTime(toDate(day), { weekday: "short" })}
                  </span>
                  <span className="hidden sm:inline">
                    {format.dateTime(toDate(day), {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </>
              )}
            </Link>
          </Button>
        ))}
      </div>

      <WeekButton
        href={`/mensa/${addDays(week, 7)}`}
        enabled={hasNext}
        label={t("nextWeek")}
      >
        <ChevronRight className="size-5" />
      </WeekButton>
    </nav>
  );
}

function WeekButton({
  href,
  enabled,
  label,
  children,
}: {
  href: string;
  enabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (!enabled) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled
        aria-label={label}
        className={cn("invisible")}
      >
        {children}
      </Button>
    );
  }
  return (
    <Button variant="outline" size="icon" asChild>
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}
