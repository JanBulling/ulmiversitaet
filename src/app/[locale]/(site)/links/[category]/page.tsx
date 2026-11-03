import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { Page, PageHeader } from "@/components/layout/page";
import { categoryIcon } from "@/components/links/category-icon";
import { LinkRow } from "@/components/links/link-row";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { LINK_CATEGORIES } from "@/content/links";
import { getLinkCategory } from "@/features/links/links";
import { Link } from "@/lib/i18n/navigation";

type Props = PageProps<"/[locale]/links/[category]">;

export function generateStaticParams() {
  return LINK_CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ category: slug }, locale] = await Promise.all([params, getLocale()]);
  const category = getLinkCategory(slug, locale);
  return category
    ? { title: category.title, description: category.description }
    : {};
}

export default async function LinkCategoryPage({ params }: Props) {
  const [{ category: slug }, locale, t] = await Promise.all([
    params,
    getLocale(),
    getTranslations("Links"),
  ]);
  const category = getLinkCategory(slug, locale);
  if (!category) notFound();

  return (
    <Page>
      <div className="px-4 md:px-0">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/links">
            <ArrowLeft />
            {t("backToAll")}
          </Link>
        </Button>
      </div>
      <PageHeader
        icon={categoryIcon(category.icon)}
        title={category.title}
        description={category.description}
      />
      <Panel>
        <ul className="divide-y divide-accent">
          {category.links.map((link) => (
            <LinkRow key={link.id} link={link} />
          ))}
        </ul>
      </Panel>
    </Page>
  );
}
