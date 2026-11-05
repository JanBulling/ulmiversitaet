"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Panel, PanelHeader } from "@/components/ui/panel";
import {
  PARKING_AREAS,
  PARKING_SOURCE_URL,
} from "@/content/parking/parking-lots";
import type { ParkingSnapshot } from "@/features/parking/queries";
import { FreeSpaces } from "./free-spaces";
import { useParkingSnapshot } from "./use-parking-snapshot";

/** All lots with a live counter, grouped by area (parking page) */
export function ParkingOverview({ initial }: { initial: ParkingSnapshot }) {
  const t = useTranslations("Parking");
  const format = useFormatter();
  const { snapshot, stale } = useParkingSnapshot(initial, "all");

  return (
    <>
      <p className="px-4 text-sm text-muted-foreground md:px-0">
        {t("updatedAt", {
          time: format.dateTime(new Date(snapshot.updatedAt), {
            hour: "2-digit",
            minute: "2-digit",
          }),
        })}
        {stale && <span className="ml-2 text-warning">{t("stale")}</span>}
      </p>

      {snapshot.failed ? (
        <Panel>
          <p className="my-8 px-4 text-center text-muted-foreground italic">
            {t("unavailable")}
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          {PARKING_AREAS.map((area) => {
            const lots = snapshot.lots.filter((lot) => lot.area === area);
            if (lots.length === 0) return null;
            return (
              <Panel key={area}>
                <PanelHeader title={t(`areas.${area}`)} />
                <ul className="divide-y divide-border">
                  {lots.map((lot) => (
                    <li
                      key={lot.code}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <h3 className="font-bold">
                          {lot.name ?? lot.code}{" "}
                          {lot.name && (
                            <span className="text-sm font-normal text-muted-foreground">
                              ({lot.code})
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {lot.address}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("spaces", { count: lot.total })}
                        </p>
                      </div>
                      <FreeSpaces free={lot.free} total={lot.total} />
                    </li>
                  ))}
                </ul>
              </Panel>
            );
          })}
        </div>
      )}

      <p className="px-4 text-sm text-muted-foreground md:px-0">
        {t.rich("source", {
          link: (chunks) => (
            <a
              href={PARKING_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
    </>
  );
}
