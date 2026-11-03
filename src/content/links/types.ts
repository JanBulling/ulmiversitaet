/**
 * Data model of the link collection (`/links`). See docs/links.md for how to add links.
 */

/** A text in both languages, or one text used for both (e.g. a product name like "Moodle") */
export type Localized = string | { de: string; en: string };

export type RelatedLink = {
  label: Localized;
  /** `https://…`, `mailto:…`, or an internal path like `/guides/ASQ` */
  href: string;
};

export type LinkEntry = {
  /** Stable id, used to reference the link from other places (e.g. the home page quick links) */
  id: string;
  label: Localized;
  /** `https://…`, `mailto:…`, or an internal path like `/guides/exmatrikulieren` */
  href: string;
  description?: Localized;
  /** Only reachable from the university network or via VPN (shown as a hint) */
  uniNetworkOnly?: boolean;
  /** Extra search terms that don't appear in label or description */
  keywords?: string[];
  /** Sub-pages and related links, shown below the link */
  related?: RelatedLink[];
};

/** lucide icon names available for categories (mapped in `src/components/links/category-icon.tsx`) */
export type CategoryIconName = "graduation-cap" | "user-cog" | "users" | "globe";

export type LinkCategory = {
  /** URL of the category page: `/links/<slug>` */
  slug: string;
  title: Localized;
  description: Localized;
  icon: CategoryIconName;
  links: LinkEntry[];
};
