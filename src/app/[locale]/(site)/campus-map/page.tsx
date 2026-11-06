import { MapPinned } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CampusMap } from "@/components/campus-map/campus-map";
import { Page, PageHeader } from "@/components/layout/page";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("CampusMap");
  return { title: t("title"), description: t("description") };
}

export default async function CampusMapPage() {
  const t = await getTranslations("CampusMap");

  return (
    <Page>
      <PageHeader
        icon={MapPinned}
        title={t("title")}
        description={t("description")}
      />
      {/* The selected place comes from the URL (`?p=`), so the map is rendered in the browser */}
      <Suspense fallback={<CampusMapSkeleton />}>
        <CampusMap />
      </Suspense>
    </Page>
  );
}

/** Same layout as `CampusMap`: search, map, list */
function CampusMapSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:h-[calc(100dvh-14rem)] lg:min-h-[560px] lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-y-0">
      <Panel className="py-3 lg:col-start-1 lg:row-start-1 lg:border-b-0">
        <div className="px-4">
          <Skeleton className="h-9 w-full" />
        </div>
      </Panel>
      <Panel className="h-[55dvh] min-h-80 py-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-auto">
        <Skeleton className="size-full rounded-none" />
      </Panel>
      <Panel className="space-y-3 px-4 py-3 lg:col-start-1 lg:row-start-2 lg:border-t-0 lg:pt-0">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </Panel>
    </div>
  );
}
