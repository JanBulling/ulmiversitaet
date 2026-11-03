import { BookOpen, GraduationCap, MapPin, Users, type LucideIcon } from "lucide-react";

/**
 * Content of the home page: quick links, featured links, and featured guides.
 * Labels are proper names or `{ de, en }` pairs.
 */

type Localized = string | { de: string; en: string };

export type QuickLink = {
  label: Localized;
  href: string;
  /** Image in `public/`; falls back to `lucideIcon` */
  image?: string;
  lucideIcon?: LucideIcon;
};

export const QUICK_LINKS: QuickLink[] = [
  { label: "Moodle", href: "https://moodle.uni-ulm.de", image: "/icons/quick-links/moodle.png" },
  {
    label: "Campus Online",
    href: "https://campusonline.uni-ulm.de",
    image: "/icons/quick-links/campusonline.png",
  },
  { label: "Campus4", href: "https://campus4.uni-ulm.de", image: "/icons/quick-links/campus4.png" },
  { label: "SOGo", href: "https://sogo.uni-ulm.de", image: "/icons/quick-links/mail.png" },
  { label: "Print@Uni", href: "https://print.uni-ulm.de", image: "/icons/quick-links/print.png" },
  {
    label: "CloudStore",
    href: "https://cloudstore.uni-ulm.de",
    image: "/icons/quick-links/nextcloud.png",
  },
  {
    label: { de: "Bibliothek", en: "Library" },
    href: "https://ulm.ibs-bw.de/",
    lucideIcon: BookOpen,
  },
  {
    label: { de: "Hörsaalfinder", en: "Lecture halls" },
    href: "https://www.uni-ulm.de/einrichtungen/kiz/weiteres/campus-navigation/hoersaalfinder/",
    lucideIcon: MapPin,
  },
];

/** Labels and descriptions are keys in `HomePage.Featured.links` */
export const FEATURED_LINKS = [
  {
    key: "exmatriculation",
    href: "/guides/exmatrikulieren",
    icon: GraduationCap,
  },
  { key: "library", href: "https://ulm.ibs-bw.de/", icon: BookOpen },
  {
    key: "lectureHalls",
    href: "https://www.uni-ulm.de/einrichtungen/kiz/weiteres/campus-navigation/hoersaalfinder/",
    icon: MapPin,
  },
  { key: "stuve", href: "https://stuve.de/", icon: Users },
] as const;

/** Guide slugs shown on the home page, in this order */
export const FEATURED_GUIDES = ["email-einrichten", "eduroam/ios", "Uni_VPN/mac", "mfa"];

export function localized(label: Localized, locale: "de" | "en") {
  return typeof label === "string" ? label : label[locale];
}
