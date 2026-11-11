import { ArrowLeft, FolderOpen } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Page, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { GuideArticle } from "@/components/guides/guide-article";
import { GuideTiles } from "@/components/guides/guide-tiles";
import {
  formatFolderName,
  getGuide,
  getGuideFolder,
  getGuidePaths,
} from "@/features/guides/guides";
import { getPathname, Link } from "@/lib/i18n/navigation";
import { baseOpenGraph } from "@/lib/metadata";
import { OG_ALT, OG_SIZE } from "@/lib/og/constants";

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
  // Link preview with the guide's title (`src/app/[locale]/og/guides/[...slug]/route.tsx`)
  const images = [
    {
      url: getPathname({
        href: `/og/guides/${path.split("/").map(encodeURIComponent).join("/")}`,
        locale,
      }),
      ...OG_SIZE,
      alt: OG_ALT,
    },
  ];

  if (!guide) {
    const t = await getTranslations("GuidesPage");
    return {
      title: `${t("title")}: ${formatFolderName(path)}`,
      openGraph: { ...baseOpenGraph(locale), images },
    };
  }

  // Open Graph title and description are filled from `title` and `description`
  const { title, summary } = guide.frontmatter;
  return {
    title,
    description: summary,
    openGraph: { ...baseOpenGraph(locale), type: "article", images },
  };
}

/**
 * Every guide and folder is prerendered at build time (`generateStaticParams`). Which one to show
 * depends on the URL, so it is read inside `<Suspense>`: the route's shared shell stays instant,
 * and links to guides prefetch the prerendered content (`prefetch` on the tiles), so the fallback
 * is only seen when someone clicks before the prefetch is done.
 */
export default function GuidePage({ params }: Props) {
  return (
    <Suspense fallback={<GuideSkeleton />}>
      <GuideOrFolder params={params} />
    </Suspense>
  );
}

async function GuideOrFolder({ params }: Pick<Props, "params">) {
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

function GuideSkeleton() {
  return (
    <Page width="narrow">
      <Skeleton className="mx-4 h-8 w-48 md:mx-0" />
      <Panel className="space-y-4 px-4 md:px-8">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-64 w-full" />
      </Panel>
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
