import { Link as LinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { Page, PageHeader } from "@/components/layout/page";
import { LinkCollection } from "@/components/links/link-collection";
import { getLinkCategories } from "@/features/links/links";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Links");
  return { title: t("title"), description: t("metaDescription") };
}

export default async function LinksPage() {
  const [t, locale] = await Promise.all([
    getTranslations("Links"),
    getLocale(),
  ]);

  return (
    <Page>
      <PageHeader
        icon={LinkIcon}
        title={t("title")}
        description={t.rich("description", {
          a: (chunks) => (
            <a href="mailto:info@ulmiversitaet.de" className="underline">
              {chunks}
            </a>
          ),
        })}
      />
      <LinkCollection categories={getLinkCategories(locale)} />
    </Page>
  );
}
