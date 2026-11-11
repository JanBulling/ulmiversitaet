import { BookText } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { Page, PageHeader } from "@/components/layout/page";
import { GuideTiles } from "@/components/guides/guide-tiles";
import { getGuideFolder } from "@/features/guides/guides";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("GuidesPage");
  return { title: t("title"), description: t("metaDescription") };
}

export default async function GuidesPage() {
  const locale = await getLocale();
  const [t, folder] = await Promise.all([
    getTranslations("GuidesPage"),
    getGuideFolder("", locale),
  ]);

  return (
    <Page>
      <PageHeader
        icon={BookText}
        title={t("title")}
        description={t.rich("description", {
          a: (chunks) => (
            <a href="mailto:info@ulmiversitaet.de" className="underline">
              {chunks}
            </a>
          ),
        })}
      />
      <GuideTiles folder={folder!} />
    </Page>
  );
}
