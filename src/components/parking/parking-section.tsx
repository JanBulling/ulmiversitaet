import { SquareParking } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { Panel, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { getParkingSnapshot } from "@/features/parking/queries";
import { cn } from "@/lib/utils";
import { ParkingBoard } from "./parking-board";

/** Free spaces of the main university parking lots and today's forecast of the campus (home page) */
export async function ParkingSection({ className }: { className?: string }) {
  await connection(); // per request (the reading itself is cached for a minute)
  const snapshot = await getParkingSnapshot();

  return <ParkingBoard initial={snapshot} className={className} />;
}

export async function ParkingSectionSkeleton({
  className,
}: {
  className?: string;
}) {
  const t = await getTranslations("Parking");
  return (
    <Panel
      className={cn(
        "py-0 md:grid md:grid-cols-[7fr_5fr] md:gap-x-8 lg:grid-cols-[5fr_3fr]",
        className,
      )}
    >
      <div className="py-4">
        <PanelHeader icon={SquareParking} title={t("title")} />
        <div className="flex justify-between gap-4 px-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 flex-1" />
          ))}
        </div>
      </div>
      <div className="space-y-3 pt-6 pb-4 md:pt-4">
        <Skeleton className="mx-4 h-10" />
        <Skeleton className="mx-4 h-28" />
      </div>
    </Panel>
  );
}
