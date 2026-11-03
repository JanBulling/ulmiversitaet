import { ArrowLeft, FolderOpen } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { Page, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { GuideArticle } from "@/components/guides/guide-article";
import { GuideTiles } from "@/components/guides/guide-tiles";
import {
  formatFolderName,
  getGuide,
  getGuideFolder,
  getGuidePaths,
} from "@/features/guides/guides";
import { Link } from "@/lib/i18n/navigation";

type Props = PageProps<"/[locale]/guides/[...slug]">;

export async function generateStaticParams() {
  const paths = await getGuidePaths();
  return paths.map((path) => ({ slug: path.split("/") }));
}

async function resolveSlug(params: Props["params"]) {
  const { slug } = await params;
  return slug.map(decodeURIComponent).join("/");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [path, locale] = await Promise.all([resolveSlug(params), getLocale()]);
  const guide = await getGuide(path, locale);

  if (!guide) {
    const t = await getTranslations("GuidesPage");
    return { title: `${t("title")}: ${formatFolderName(path)}` };
  }

  const { title, summary } = guide.frontmatter;
  return {
    title,
    description: summary,
    openGraph: { title, description: summary, type: "article" },
  };
}

export default async function GuidePage({ params }: Props) {
  const [path, locale] = await Promise.all([resolveSlug(params), getLocale()]);
  const t = await getTranslations("GuidesPage");

  const guide = await getGuide(path, locale);
  if (guide) {
    return (
      <Page width="narrow">
        <BackToGuides label={t("backToAll")} />
        <GuideArticle guide={guide} />
      </Page>
    );
  }

  const folder = await getGuideFolder(path, locale);
  if (!folder) notFound();

  return (
    <Page>
      <BackToGuides label={t("backToAll")} />
      <PageHeader
        icon={FolderOpen}
        title={formatFolderName(path)}
        description={t("title")}
      />
      <GuideTiles folder={folder} />
    </Page>
  );
}

function BackToGuides({ label }: { label: string }) {
  return (
    <div className="px-4 md:px-0">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/guides">
          <ArrowLeft />
          {label}
        </Link>
      </Button>
    </div>
  );
}
