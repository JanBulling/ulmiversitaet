import { CalendarDays, CircleUserRound, Clock4 } from "lucide-react";
import { getFormatter } from "next-intl/server";

import { Panel } from "@/components/ui/panel";
import { loadGuideContent, type Guide } from "@/features/guides/guides";

/** A guide as a flat panel: title, description, meta line, then the MDX content */
export async function GuideArticle({ guide }: { guide: Guide }) {
  const [format, Content] = await Promise.all([
    getFormatter(),
    loadGuideContent(guide),
  ]);
  const { title, titleWeb, summary, description, author, publishedAt } =
    guide.frontmatter;

  return (
    <Panel as="article" className="py-6 md:py-8">
      <header className="mx-4 mb-6 border-b pb-6 md:mx-8">
        <h1 className="text-2xl font-bold md:text-3xl">{titleWeb ?? title}</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          {description ?? summary}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden />
            <span className="font-mono">
              {format.dateTime(publishedAt, { dateStyle: "long" })}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CircleUserRound className="size-4" aria-hidden />
            {author}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock4 className="size-4" aria-hidden />
            {guide.readingTimeMin} Min
          </span>
        </div>
      </header>

      <div className="px-4 md:px-8">
        <Content />
      </div>
    </Panel>
  );
}
