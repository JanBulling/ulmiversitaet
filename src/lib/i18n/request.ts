import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";

import { routing } from "./routing";

export default getRequestConfig(async ({ locale: explicitLocale }) => {
  // An explicit locale is passed where root params are unavailable
  // (Route Handlers, Server Actions), e.g. `getTranslations({ locale })`
  const locale = explicitLocale ?? (await localeParam());

  // `[locale]` matches any first segment, so unknown values must 404
  if (!hasLocale(routing.locales, locale)) notFound();

  return {
    locale,
    // Menu dates and comment timestamps are always shown in local (Ulm) time
    timeZone: "Europe/Berlin",
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
