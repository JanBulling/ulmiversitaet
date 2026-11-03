"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { HOME_LOTS_MOBILE } from "@/content/parking/parking-lots";
import type { ParkingSnapshot } from "@/features/parking/queries";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { FreeSpaces } from "./free-spaces";
import { useParkingSnapshot } from "./use-parking-snapshot";

/** Free spaces of the main lots in a row (5 on desktop, 3 on mobile) */
export function ParkingBoard({ initial }: { initial: ParkingSnapshot }) {
  const t = useTranslations("Parking");
  const { snapshot, stale } = useParkingSnapshot(initial, "home");

  if (snapshot.failed) {
    return (
      <p className="my-8 px-4 text-center text-muted-foreground italic">
        {t("unavailable")}
      </p>
    );
  }

  return (
    <div className="px-4">
      {stale && <p className="mb-2 text-xs text-warning">{t("stale")}</p>}
      <ol className="flex items-center justify-between gap-2">
        {snapshot.lots.map((lot) => (
          <li
            key={lot.code}
            className={cn(
              "flex min-w-0 flex-col items-center text-center",
              !HOME_LOTS_MOBILE.includes(lot.code) && "hidden md:flex",
            )}
          >
            <h3 className="font-semibold">
              <span className="md:hidden">
                {lot.shortName ?? lot.name ?? lot.code}
              </span>
              <span className="hidden md:inline">{lot.name ?? lot.code}</span>{" "}
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
