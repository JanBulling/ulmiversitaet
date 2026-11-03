import { FileText, FolderOpen } from "lucide-react";
import { getFormatter } from "next-intl/server";

import { Tile } from "@/components/ui/tile";
import { formatFolderName, type GuideFolder } from "../guides";

/** Folders first, then the guides of a folder, as link tiles */
export async function GuideTiles({ folder }: { folder: GuideFolder }) {
  const format = await getFormatter();

  return (
    <ul className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-2 md:px-0 lg:grid-cols-3">
      {folder.folders.map((path) => (
        <li key={path}>
          <Tile
            href={`/guides/${path}`}
            icon={FolderOpen}
            title={formatFolderName(path)}
            className="h-full"
          />
        </li>
      ))}
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
  );
}
