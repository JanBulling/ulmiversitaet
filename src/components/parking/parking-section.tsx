import { ChartColumn, SquareParking } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { Panel, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { getParkingSnapshot } from "@/features/parking/queries";
import { cn } from "@/lib/utils";
import { ParkingBoard } from "./parking-board";

/** Free spaces of the main university parking lots and the forecast of one of them (home page) */
export async function ParkingSection({ className }: { className?: string }) {
  await connection(); // per request (the reading itself is cached for a minute)
  const snapshot = await getParkingSnapshot("home");

  return (
    <div
      className={cn(
        "grid grid-cols-1 items-start gap-4 md:grid-cols-7",
        className,
      )}
    >
      <ParkingBoard initial={snapshot} />
    </div>
  );
}

export async function ParkingSectionSkeleton({
  className,
}: {
  className?: string;
}) {
  const t = await getTranslations("Parking");
  return (
    <div
      className={cn(
        "grid grid-cols-1 items-start gap-4 md:grid-cols-7",
        className,
      )}
    >
      <Panel className="md:col-span-4">
        <PanelHeader icon={SquareParking} title={t("title")} />
        <div className="flex justify-between gap-4 px-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 flex-1" />
          ))}
        </div>
      </Panel>
      <Panel className="space-y-3 md:col-span-3">
        <PanelHeader icon={ChartColumn} title={t("forecast.show")} />
        <Skeleton className="mx-4 h-8" />
        <Skeleton className="mx-4 h-32" />
      </Panel>
    </div>
  );
}
