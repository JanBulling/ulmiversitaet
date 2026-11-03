import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  MenuView,
  MenuViewSkeleton,
} from "@/features/mensa/components/menu-view";
import { isIsoDate, toDate } from "@/lib/date";
import { MenuHeader } from "../menu-header";

type Props = PageProps<"/[locale]/mensa/[date]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  if (!isIsoDate(date)) return {};

  const [t, format] = await Promise.all([
    getTranslations("Mensa"),
    getFormatter(),
  ]);
  return {
    title: `${t("menuTitle")} ${format.dateTime(toDate(date), { dateStyle: "medium" })}`,
  };
}

export default function MensaDatePage({ params }: Props) {
  return (
    <>
      <MenuHeader />
      <Suspense fallback={<MenuViewSkeleton />}>
        <DateMenu params={params} />
      </Suspense>
    </>
  );
}

async function DateMenu({ params }: { params: Props["params"] }) {
  const { date } = await params;
  if (!isIsoDate(date)) notFound();
  return <MenuView date={date} />;
}
