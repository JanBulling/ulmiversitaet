import { SquareParking } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { Suspense } from "react";

import { Page, PageHeader } from "@/components/layout/page";
import { ParkingOverview } from "@/components/parking/parking-overview";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { getParkingSnapshot } from "@/features/parking/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Parking");
  return { title: t("title"), description: t("description") };
}

export default async function ParkingLotsPage() {
  const t = await getTranslations("Parking");

  return (
    <Page>
      <PageHeader
        icon={SquareParking}
        title={t("title")}
        description={t("description")}
      />
      <Suspense
        fallback={
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
            {[0, 1].map((i) => (
              <Panel key={i} className="space-y-3 px-4">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </Panel>
            ))}
          </div>
        }
      >
        <Overview />
      </Suspense>
    </Page>
  );
}

async function Overview() {
  await connection(); // per request (the reading itself is cached for a minute)
  return <ParkingOverview initial={await getParkingSnapshot("all")} />;
}
