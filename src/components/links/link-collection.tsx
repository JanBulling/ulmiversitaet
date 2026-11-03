"use client";

import { ChevronRight, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeferredValue, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { ResolvedCategory } from "@/features/links/links";
import { searchLinks } from "@/features/links/search";
import { Link } from "@/lib/i18n/navigation";
import { categoryIcon } from "./category-icon";
import { LinkRow } from "./link-row";

/** All categories with an instant search (see `searchLinks`) */
export function LinkCollection({
  categories,
}: {
  categories: ResolvedCategory[];
}) {
  const t = useTranslations("Links");
  const [query, setQuery] = useState("");
  const results = searchLinks(categories, useDeferredValue(query));
  const count = results.reduce(
    (sum, category) => sum + category.links.length,
    0,
  );

  return (
    <>
      <div className="px-4 md:px-0">
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
        {query.trim() && (
          <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
            {t("results", { count })}
          </p>
        )}
      </div>

      {results.length === 0 ? (
        <Panel>
          <p className="my-8 px-4 text-center text-muted-foreground italic">
            {t.rich("noResults", {
              a: (chunks) => (
                <a href="mailto:info@ulmiversitaet.de" className="underline">
                  {chunks}
                </a>
              ),
            })}
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          {results.map((category) => (
            <Panel key={category.slug}>
              <PanelHeader
                icon={categoryIcon(category.icon)}
                title={category.title}
              >
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    href={`/links/${category.slug}`}
                    aria-label={t("showCategory", { title: category.title })}
                  >
                    <ChevronRight />
                  </Link>
                </Button>
              </PanelHeader>
              <p className="-mt-1 mb-1 px-4 text-sm text-muted-foreground">
                {category.description}
              </p>
              <ul className="divide-y divide-accent">
                {category.links.map((link) => (
                  <LinkRow key={link.id} link={link} />
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
