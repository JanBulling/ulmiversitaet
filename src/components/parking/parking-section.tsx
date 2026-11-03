import { SquareParking } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { Panel, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { getParkingSnapshot } from "@/features/parking/queries";
import { ParkingBoard } from "./parking-board";

/** Free spaces of the main university parking lots (home page) */
export async function ParkingSection({ className }: { className?: string }) {
  await connection(); // per request (the reading itself is cached for a minute)
  const [t, snapshot] = await Promise.all([
    getTranslations("Parking"),
    getParkingSnapshot("home"),
  ]);

  return (
    <Panel className={className}>
      <PanelHeader icon={SquareParking} title={t("title")} />
      <ParkingBoard initial={snapshot} />
    </Panel>
  );
}

export async function ParkingSectionSkeleton({
  className,
}: {
  className?: string;
}) {
  const t = await getTranslations("Parking");
  return (
    <Panel className={className}>
      <PanelHeader icon={SquareParking} title={t("title")} />
      <div className="flex justify-between gap-4 px-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 flex-1" />
        ))}
      </div>
    </Panel>
  );
}
