"use client";

import { ChartColumn, ChevronDown } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Panel, PanelHeader } from "@/components/ui/panel";
import {
  FEATURED_LOT,
  PARKING_AREAS,
  PARKING_SOURCE_URL,
} from "@/content/parking/parking-lots";
import type {
  ParkingLotStatus,
  ParkingSnapshot,
} from "@/features/parking/queries";
import { FreeSpaces } from "./free-spaces";
import { hasForecast, ParkingForecast } from "./parking-forecast";
import { useParkingSnapshot } from "./use-parking-snapshot";

/** All lots with a live counter, grouped by area (parking page) */
export function ParkingOverview({ initial }: { initial: ParkingSnapshot }) {
  const t = useTranslations("Parking");
  const format = useFormatter();
  const { snapshot, stale } = useParkingSnapshot(initial, "all");
  const areas = PARKING_AREAS.filter((area) =>
    snapshot.lots.some((lot) => lot.area === area),
  );

  return (
    <>
      <div className="space-y-3 px-4 md:px-0">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex size-2" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          {t("updatedAt", {
            time: format.dateTime(new Date(snapshot.updatedAt), {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })}
          {stale && <span className="text-warning">{t("stale")}</span>}
        </p>
        {/* Jump to an area: saves a lot of scrolling on phones */}
        {!snapshot.failed && (
          <nav
            aria-label={t("jumpTo")}
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden"
          >
            {areas.map((area) => (
              <a
                key={area}
                href={`#${area.toLowerCase()}`}
                className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-sm font-semibold whitespace-nowrap hover:bg-muted"
              >
                {t(`areas.${area}`)}
              </a>
            ))}
          </nav>
        )}
      </div>

      {snapshot.failed ? (
        <Panel>
          <p className="my-8 px-4 text-center text-muted-foreground italic">
            {t("unavailable")}
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          {areas.map((area) => (
            <Panel key={area} id={area.toLowerCase()} className="scroll-mt-20">
              <PanelHeader title={t(`areas.${area}`)} />
              <ul className="divide-y divide-border">
                {snapshot.lots
                  .filter((lot) => lot.area === area)
                  .map((lot) => (
                    <li key={lot.code}>
                      {hasForecast(lot) ? (
                        <details
                          className="group"
                          open={lot.code === FEATURED_LOT}
                        >
                          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 select-none hover:bg-muted [&::-webkit-details-marker]:hidden">
                            <LotRow lot={lot} />
                            <ChevronDown
                              className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                              aria-hidden
                            />
                          </summary>
                          <div className="border-t border-dashed border-border bg-muted/40">
                            <ParkingForecast
                              lot={lot}
                              updatedAt={snapshot.updatedAt}
                            />
                          </div>
                        </details>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3">
                          <LotRow lot={lot} />
                          <span className="size-5 shrink-0" aria-hidden />
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}

      <p className="px-4 text-sm text-muted-foreground md:px-0">
        {t.rich("source", {
          link: (chunks) => (
            <a
              href={PARKING_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
    </>
  );
}

/** Name, address and capacity on the left, free spaces on the right */
function LotRow({ lot }: { lot: ParkingLotStatus }) {
  const t = useTranslations("Parking");
  return (
    <>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold">
          {lot.name ?? lot.code}{" "}
          {lot.name && (
            <span className="font-mono text-sm font-normal text-muted-foreground">
              {lot.code}
            </span>
          )}
        </h3>
        <p className="truncate text-xs text-muted-foreground">{lot.address}</p>
        <p className="text-xs text-muted-foreground">
          {t("spaces", { count: lot.total })}
        </p>
        {hasForecast(lot) && (
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary">
            <ChartColumn className="size-3.5" aria-hidden />
            <span className="group-open:hidden">{t("forecast.show")}</span>
            <span className="hidden group-open:inline">
              {t("forecast.hide")}
            </span>
          </p>
        )}
      </div>
      <FreeSpaces free={lot.free} total={lot.total} />
    </>
  );
}
