import type { ResolvedCategory } from "./links";

/** Lower case without accents: "Hörsaalfinder" → "horsaalfinder", "Straße" → "strasse" */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Links that contain every word of the query (in label, description, keywords, related links,
 * or host name, in any language; see `searchText` in `links.ts`). Categories without matches are dropped; an empty query returns everything.
 */
export function searchLinks(
  categories: ResolvedCategory[],
  query: string,
): ResolvedCategory[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return categories;

  return categories
    .map((category) => ({
      ...category,
      links: category.links.filter((link) =>
        words.every((word) => link.searchText.includes(word)),
      ),
    }))
    .filter((category) => category.links.length > 0);
}
