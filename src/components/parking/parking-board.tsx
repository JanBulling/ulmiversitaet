"use client";

import { ChevronRight, SquareParking } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { HOME_LOTS, HOME_LOTS_MOBILE } from "@/content/parking/parking-lots";
import type { ParkingSnapshot } from "@/features/parking/queries";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { FreeSpaces } from "./free-spaces";
import { FreeTrend } from "./free-trend";
import { CampusParkingForecast } from "./parking-forecast";
import { useParkingSnapshot } from "./use-parking-snapshot";

/**
 * Home page, one panel: free spaces of the main lots in a row (4 on large screens, 3 below) with
 * the trend of the next 30 minutes, and next to it (below on phones) today's forecast of all
 * campus lots together. One refresh feeds both.
 */
export function ParkingBoard({
  initial,
  className,
}: {
  initial: ParkingSnapshot;
  className?: string;
}) {
  const t = useTranslations("Parking");
  const { snapshot, stale } = useParkingSnapshot(initial);

  return (
    <Panel
      className={cn(
        "py-0 md:grid md:grid-cols-[7fr_5fr] md:gap-x-8 lg:grid-cols-[5fr_3fr]",
        className,
      )}
    >
      {/* As high as the forecast next to it; the lots are centered */}
      <div className="flex flex-col py-4">
        <PanelHeader icon={SquareParking} title={t("title")} />
        {snapshot.failed ? (
          <p className="my-8 px-4 text-center text-muted-foreground italic">
            {t("unavailable")}
          </p>
        ) : (
          <Board snapshot={snapshot} stale={stale} />
        )}
      </div>
      {!snapshot.failed && (
        <div className="pt-6 pb-4 md:pt-4">
          <CampusParkingForecast
            lots={snapshot.lots}
            updatedAt={snapshot.updatedAt}
          />
        </div>
      )}
    </Panel>
  );
}

function Board({
  snapshot,
  stale,
}: {
  snapshot: ParkingSnapshot;
  stale: boolean;
}) {
  const t = useTranslations("Parking");
  const lots = HOME_LOTS.map((code) =>
    snapshot.lots.find((lot) => lot.code === code)!,
  );
  return (
    <div className="flex flex-1 flex-col justify-center px-4">
      {stale && <p className="mb-2 text-xs text-warning">{t("stale")}</p>}
      <ol className="flex items-center justify-between gap-2">
        {lots.map((lot) => (
          <li
            key={lot.code}
            className={cn(
              "flex min-w-0 flex-col items-center text-center",
              !HOME_LOTS_MOBILE.includes(lot.code) && "hidden lg:flex",
            )}
          >
            <h3 className="font-semibold">
              <span className="lg:hidden">
                {lot.shortName ?? lot.name ?? lot.code}
              </span>
              <span className="hidden lg:inline">{lot.name ?? lot.code}</span>{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({lot.code})
              </span>
            </h3>
            <FreeSpaces free={lot.free} total={lot.total} className="my-1" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">
                {t("ofTotal", { total: lot.total })}
              </span>
              <FreeTrend lot={lot} updatedAt={snapshot.updatedAt} />
            </div>
          </li>
        ))}
        <li>
          <Button variant="outline" size="icon" asChild>
            <Link
              href="/parking-lots"
              aria-label={t("allLots")}
              title={t("allLots")}
            >
              <ChevronRight />
            </Link>
          </Button>
        </li>
      </ol>
    </div>
  );
}
