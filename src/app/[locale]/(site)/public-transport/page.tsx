import { TramFront } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { Suspense } from "react";

import { Page, PageHeader } from "@/components/layout/page";
import { DeparturesExplorer } from "@/components/public-transport/departures-explorer";
import { DisruptionAlert } from "@/components/public-transport/public-transport-section";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { getPassengerAlert } from "@/features/public-transport/swu-api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PublicTransport");
  return { title: t("title"), description: t("description") };
}

export default async function PublicTransportPage() {
  const t = await getTranslations("PublicTransport");

  return (
    <Page>
      <PageHeader
        icon={TramFront}
        title={t("title")}
        description={t("description")}
      />
      <Suspense>
        <Disruption />
      </Suspense>
      {/* The selected stop comes from the URL (`?stop=`), so the departures are loaded in the browser */}
      <Suspense fallback={<DeparturesExplorerSkeleton />}>
        <DeparturesExplorer />
      </Suspense>
    </Page>
  );
}

/** Renders nothing when SWU reports no disruption */
async function Disruption() {
  await connection(); // real-time data, never prerendered
  const alert = await getPassengerAlert().catch(() => null);
  if (alert?.status !== "disruption") return null;
  return (
    <div className="px-4 md:px-0">
      <DisruptionAlert alert={alert} />
    </div>
  );
}

/** Same layout as `DeparturesExplorer`: tiles, saved stops and search on the left, departures on the right */
function DeparturesExplorerSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
      <div className="space-y-4 md:col-span-3">
        <div className="grid grid-cols-2 gap-2 px-4 md:px-0">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14 rounded-lg" />
          ))}
        </div>
        <Panel className="space-y-2 px-4 py-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-full" />
        </Panel>
        <Panel className="px-4 py-3">
          <Skeleton className="h-9 w-full" />
        </Panel>
      </div>
      <Panel className="space-y-2 px-4 md:col-span-4">
        <Skeleton className="mb-4 h-8 w-48" />
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </Panel>
    </div>
  );
}
