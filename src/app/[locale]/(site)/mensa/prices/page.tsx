import { TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page";
import { PriceView, PriceViewSkeleton } from "@/components/mensa/price-view";
import { BackToMenu } from "../back-to-menu";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("MensaPrices");
  return { title: t("title") };
}

/** Price tracker; the data is cached for a day (`getPriceDays`) */
export default async function MensaPricesPage() {
  const t = await getTranslations("MensaPrices");

  return (
    <>
      <BackToMenu />
      <PageHeader
        icon={TrendingUp}
        title={t("title")}
        description={t("description")}
      />
      <Suspense fallback={<PriceViewSkeleton />}>
        <PriceView />
      </Suspense>
    </>
  );
}
