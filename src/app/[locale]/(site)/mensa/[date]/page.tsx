import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  MenuDays,
  MenuDaysPlaceholder,
  MenuView,
  MenuViewSkeleton,
} from "@/components/mensa/menu-view";
import { MensaMore } from "@/components/mensa/mensa-more";
import { getMenuRange } from "@/features/mensa/statistics";
import { isIsoDate, toDate, type IsoDate } from "@/lib/date";
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
      {/* Only waits for the route params, not for the menu */}
      <Suspense fallback={<MenuDaysPlaceholder />}>
        <DateDays params={params} />
      </Suspense>
      <Suspense fallback={<MenuViewSkeleton />}>
        <DateMenu params={params} />
      </Suspense>
      <MensaMore />
    </>
  );
}

/**
 * The route's date, or `null` if it is invalid or before the first menu, so crawlers stop
 * there instead of querying empty days. `getMenuRange` is cached, so this doesn't reach the
 * database.
 */
async function menuDay(params: Props["params"]): Promise<IsoDate | null> {
  const { date } = await params;
  if (!isIsoDate(date)) return null;
  const range = await getMenuRange();
  return !range || date >= range.first ? date : null;
}

async function DateDays({ params }: { params: Props["params"] }) {
  const date = await menuDay(params);
  return date ? <MenuDays date={date} /> : null;
}

async function DateMenu({ params }: { params: Props["params"] }) {
  const date = await menuDay(params);
  if (!date) notFound();
  return <MenuView date={date} />;
}
