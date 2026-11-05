import { BookOpen, LinkIcon, MapIcon, Users, type LucideIcon } from "lucide-react";

import type { Localized } from "@/content/links";

/**
 * Content of the home page. Links reference the link collection (`src/content/links/`) by id,
 * so every URL exists only once; `pnpm test` fails if an id doesn't exist.
 */

export type QuickLink = {
  /** Id of a link in `src/content/links/` */
  linkId: string;
  /** Shorter label for the icon grid (default: the link's label) */
  label?: Localized;
  /** Image in `public/`; falls back to `lucideIcon` */
  image?: string;
  lucideIcon?: LucideIcon;
};

/** App-icon style shortcuts (7 + "Mehr Links" fill one row on desktop) */
export const QUICK_LINKS: QuickLink[] = [
  { linkId: "moodle", image: "/icons/quick-links/moodle.png" },
  { linkId: "campusonline", label: "Campus Online", image: "/icons/quick-links/campusonline.png" },
  { linkId: "campus4", image: "/icons/quick-links/campus4.png" },
  { linkId: "sogo", image: "/icons/quick-links/mail.png" },
  { linkId: "print-uni", image: "/icons/quick-links/print.png" },
  { linkId: "cloudstore", image: "/icons/quick-links/nextcloud.png" },
  { linkId: "bibliothekskatalog", label: { de: "Bibliothek", en: "Library" }, lucideIcon: BookOpen },
];

/**
 * "Weitere Links" on the home page; label and description come from the link collection.
 * Icons as on the previous site (`MapIcon` was its campus map, the closest to the lecture hall finder).
 */
export const FEATURED_LINKS: { linkId: string; icon: LucideIcon }[] = [
  { linkId: "exmatrikulation", icon: LinkIcon },
  { linkId: "bibliothekskatalog", icon: BookOpen },
  { linkId: "hoersaalfinder", icon: MapIcon },
  { linkId: "stuve-website", icon: Users },
];

/** Guide slugs shown on the home page, in this order */
export const FEATURED_GUIDES = ["email-einrichten", "eduroam/ios", "Uni_VPN/mac", "mfa"];
