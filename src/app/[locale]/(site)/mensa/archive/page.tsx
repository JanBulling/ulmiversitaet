import { History } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { cacheLife } from "next/cache";

import { PageHeader } from "@/components/layout/page";
import { ArchiveForm } from "@/components/mensa/archive-form";
import { Panel, PanelBody, PanelEmpty } from "@/components/ui/panel";
import { TODAY_CACHE_LIFE } from "@/features/mensa/cache";
import { getMenuRange } from "@/features/mensa/statistics";
import { today, toDate, type IsoDate } from "@/lib/date";
import { BackToMenu } from "../back-to-menu";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("MensaArchive");
  return { title: t("title") };
}

/** Pick a day, then see its menu on the normal menu page */
export default async function MensaArchivePage() {
  const t = await getTranslations("MensaArchive");

  return (
    <>
      <BackToMenu />
      <PageHeader
        icon={History}
        title={t("title")}
        description={t("description")}
      />
      <Panel>
        <ArchivePicker />
      </Panel>
    </>
  );
}

/** Cached like the day selector: starts at today, which moves with the change of day */
async function ArchivePicker() {
  "use cache";
  cacheLife(TODAY_CACHE_LIFE);

  const [t, format, range] = await Promise.all([
    getTranslations("MensaArchive"),
    getFormatter(),
    getMenuRange(),
  ]);
  if (!range) return <PanelEmpty>{t("noData")}</PanelEmpty>;

  const now = today();
  const formatDate = (date: IsoDate) =>
    format.dateTime(toDate(date), { dateStyle: "medium" });

  return (
    <PanelBody className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("range", {
          first: formatDate(range.first),
          last: formatDate(range.last),
        })}
      </p>
      <ArchiveForm
        first={range.first}
        last={range.last}
        initial={now < range.last ? now : range.last}
      />
    </PanelBody>
  );
}
