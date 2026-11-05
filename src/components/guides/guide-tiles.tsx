import { FileText, FolderOpen } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { Tile } from "@/components/ui/tile";
import { formatFolderName, type GuideFolder } from "@/features/guides/guides";

/** Folders first (large tiles with their guide count), then the guides of a folder */
export async function GuideTiles({ folder }: { folder: GuideFolder }) {
  const [t, format] = await Promise.all([
    getTranslations("GuidesPage"),
    getFormatter(),
  ]);
  const grid =
    "grid grid-cols-1 gap-2 px-4 sm:grid-cols-2 md:px-0 lg:grid-cols-3";

  return (
    <div className="space-y-6">
      {folder.folders.length > 0 && (
        <ul className={grid}>
          {folder.folders.map(({ path, guideCount }) => (
            <li key={path}>
              <Tile
                href={`/guides/${path}`}
                icon={FolderOpen}
                size="lg"
                title={formatFolderName(path)}
                description={t("guideCount", { count: guideCount })}
                className="h-full"
              />
            </li>
          ))}
        </ul>
      )}
      <ul className={grid}>
        {folder.guides.map((guide) => {
          const { title, summary, author, publishedAt } = guide.frontmatter;
          return (
            <li key={guide.slug}>
              <Tile
                href={`/guides/${guide.slug}`}
                icon={FileText}
                title={title}
                description={summary}
                meta={
                  <>
                    <span className="font-mono">
                      {format.dateTime(publishedAt, { dateStyle: "medium" })}
                    </span>
                    {" · "}
                    {author}
                    {" · "}
                    {guide.readingTimeMin} Min
                  </>
                }
                className="h-full"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
