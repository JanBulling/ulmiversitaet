"use client";

import { ChartColumn, ChevronRight, SquareParking } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { FEATURED_LOT, HOME_LOTS_MOBILE } from "@/content/parking/parking-lots";
import type { ParkingSnapshot } from "@/features/parking/queries";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { FreeSpaces } from "./free-spaces";
import { hasForecast, ParkingForecast } from "./parking-forecast";
import { useParkingSnapshot } from "./use-parking-snapshot";

/**
 * Home page: free spaces of the main lots in a row (5 on large screens, 3 below), and next to
 * it a narrower panel with the forecast of `FEATURED_LOT`. One refresh feeds both.
 */
export function ParkingBoard({ initial }: { initial: ParkingSnapshot }) {
  const t = useTranslations("Parking");
  const { snapshot, stale } = useParkingSnapshot(initial, "home");
  const featured = snapshot.lots.find((lot) => lot.code === FEATURED_LOT);

  return (
    <>
      <Panel className="md:col-span-4">
        <PanelHeader icon={SquareParking} title={t("title")} />
        {snapshot.failed ? (
          <p className="my-8 px-4 text-center text-muted-foreground italic">
            {t("unavailable")}
          </p>
        ) : (
          <Board snapshot={snapshot} stale={stale} />
        )}
      </Panel>
      {!snapshot.failed && featured && hasForecast(featured) && (
        <Panel className="pb-1 md:col-span-3">
          <PanelHeader
            icon={ChartColumn}
            title={t("forecast.homeTitle", {
              name: featured.name ?? featured.code,
            })}
          />
          <ParkingForecast lot={featured} updatedAt={snapshot.updatedAt} />
        </Panel>
      )}
    </>
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
  return (
    <div className="px-4">
      {stale && <p className="mb-2 text-xs text-warning">{t("stale")}</p>}
      <ol className="flex items-center justify-between gap-2">
        {snapshot.lots.map((lot) => (
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
            <p className="text-xs text-muted-foreground">
              {t("ofTotal", { total: lot.total })}
            </p>
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
