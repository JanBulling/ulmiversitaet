import { Trophy } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page";
import {
  RankingView,
  RankingViewSkeleton,
} from "@/components/mensa/ranking-view";
import { BackToMenu } from "../back-to-menu";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("MensaRanking");
  return { title: t("title") };
}

/** Best and worst main dishes; the data is cached for a day (`getMealRanking`) */
export default async function MensaRankingPage() {
  const t = await getTranslations("MensaRanking");

  return (
    <>
      <BackToMenu />
      <PageHeader
        icon={Trophy}
        title={t("title")}
        description={t("description")}
      />
      <Suspense fallback={<RankingViewSkeleton />}>
        <RankingView />
      </Suspense>
    </>
  );
}
