import { DoorOpen, MapPinned } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { Suspense } from "react";

import {
  FreeRoomsExplorer,
  type FreeRoomsDay,
} from "@/components/free-rooms/free-rooms-explorer";
import { Page, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { getDayOccupancy } from "@/features/free-rooms/queries";
import { getFreeRooms } from "@/features/free-rooms/rooms";
import { addDays, nextWeekday, timeOfDay, toDate, today } from "@/lib/date";
import { Link } from "@/lib/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("FreeRooms");
  return { title: t("title"), description: t("description") };
}

export default async function FreeRoomsPage() {
  const t = await getTranslations("FreeRooms");

  return (
    <Page>
      <PageHeader
        icon={DoorOpen}
        title={t("title")}
        description={t("description")}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/campus-map">
              <MapPinned aria-hidden />
              {t("map")}
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<FreeRoomsSkeleton />}>
        <FreeRooms />
      </Suspense>
    </Page>
  );
}

/** Today and the next weekday ("Morgen", or "Montag" on Fridays and weekends) */
async function FreeRooms() {
  await connection(); // per request (the bookings themselves are cached for 10 minutes)
  const [t, format, locale] = await Promise.all([
    getTranslations("FreeRooms"),
    getFormatter(),
    getLocale(),
  ]);

  const now = new Date();
  const first = today(now);
  const second = nextWeekday(addDays(first, 1));
  const [firstOccupancy, secondOccupancy] = await Promise.all([
    getDayOccupancy(first),
    getDayOccupancy(second),
  ]);

  const days: FreeRoomsDay[] = [
    { date: first, label: t("today"), occupancy: firstOccupancy },
    {
      date: second,
      label:
        second === addDays(first, 1)
          ? t("tomorrow")
          : format.dateTime(toDate(second), { weekday: "long" }),
      occupancy: secondOccupancy,
    },
  ];

  return (
    <FreeRoomsExplorer
      rooms={getFreeRooms(locale)}
      days={days}
      now={timeOfDay(now)}
    />
  );
}

/** Same layout as `FreeRoomsExplorer`: filters, then the rooms of Uni Ost and Uni West */
function FreeRoomsSkeleton() {
  return (
    <>
      <Panel className="space-y-4 px-4">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </Panel>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <Panel key={i} className="space-y-3 px-4">
            <Skeleton className="h-8 w-40" />
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </Panel>
        ))}
      </div>
    </>
  );
}
