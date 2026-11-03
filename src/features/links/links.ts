import { LINK_CATEGORIES } from "@/content/links";
import type { CategoryIconName, LinkEntry, Localized } from "@/content/links";
import { routing, type Locale } from "@/lib/i18n/routing";
import { normalize } from "./search";

/** Link data resolved for one language; plain strings only, so it can be passed to Client Components */
export type ResolvedLink = {
  id: string;
  label: string;
  href: string;
  description: string | null;
  uniNetworkOnly: boolean;
  /** Normalized text the search matches: labels and descriptions in all languages, keywords, host */
  searchText: string;
  related: { label: string; href: string }[];
  /** Internal links (`/guides/…`) open in the same tab */
  internal: boolean;
};

export type ResolvedCategory = {
  slug: string;
  title: string;
  description: string;
  icon: CategoryIconName;
  links: ResolvedLink[];
};

export function localize(value: Localized, locale: Locale): string {
  return typeof value === "string" ? value : value[locale];
}

export function isInternalHref(href: string): boolean {
  return href.startsWith("/");
}

/** All translations, so a search for "Hörsaal" also works on the English page */
function allLanguages(value: Localized | undefined): string[] {
  if (value === undefined) return [];
  return typeof value === "string"
    ? [value]
    : routing.locales.map((locale) => value[locale]);
}

function hostOf(href: string): string {
  return href.startsWith("http") ? new URL(href).hostname : "";
}

function searchText(link: LinkEntry): string {
  return normalize(
    [
      ...allLanguages(link.label),
      ...allLanguages(link.description),
      ...(link.keywords ?? []),
      ...(link.related ?? []).flatMap((related) => allLanguages(related.label)),
      hostOf(link.href),
    ].join(" "),
  );
}

function resolveLink(link: LinkEntry, locale: Locale): ResolvedLink {
  return {
    id: link.id,
    label: localize(link.label, locale),
    href: link.href,
    description: link.description ? localize(link.description, locale) : null,
    uniNetworkOnly: link.uniNetworkOnly ?? false,
    searchText: searchText(link),
    related: (link.related ?? []).map((related) => ({
      label: localize(related.label, locale),
      href: related.href,
    })),
    internal: isInternalHref(link.href),
  };
}

export function getLinkCategories(locale: Locale): ResolvedCategory[] {
  return LINK_CATEGORIES.map((category) => ({
    slug: category.slug,
    title: localize(category.title, locale),
    description: localize(category.description, locale),
    icon: category.icon,
    links: category.links.map((link) => resolveLink(link, locale)),
  }));
}

export function getLinkCategory(
  slug: string,
  locale: Locale,
): ResolvedCategory | null {
  return (
    getLinkCategories(locale).find((category) => category.slug === slug) ?? null
  );
}

/** A link by its id, e.g. for the quick links on the home page. Throws for unknown ids. */
export function getLink(id: string, locale: Locale): ResolvedLink {
  for (const category of LINK_CATEGORIES) {
    const link = category.links.find((entry) => entry.id === id);
    if (link) return resolveLink(link, locale);
  }
  throw new Error(`Unknown link id "${id}" (see src/content/links/)`);
}

/** Every link and related link, e.g. for the link checker */
export function allLinkHrefs(): { id: string; label: string; href: string }[] {
  return LINK_CATEGORIES.flatMap((category) =>
    category.links.flatMap((link) => [
      { id: link.id, label: localize(link.label, "de"), href: link.href },
      ...(link.related ?? []).map((related) => ({
        id: link.id,
        label: `${localize(link.label, "de")} → ${localize(related.label, "de")}`,
        href: related.href,
      })),
    ]),
  );
}
