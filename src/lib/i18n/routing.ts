import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  // German lives at `/`, English at `/en` — same URLs as the current site
  localePrefix: "as-needed",
  localeCookie: {
    name: "LANGUAGE",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  },
});

export type Locale = (typeof routing.locales)[number];
