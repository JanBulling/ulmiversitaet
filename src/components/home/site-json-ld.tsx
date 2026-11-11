import { getLocale, getTranslations } from "next-intl/server";

import { getPathname } from "@/lib/i18n/navigation";
import { BASE_URL, siteConfig } from "@/lib/site";

/**
 * Structured data for search engines (schema.org `WebSite`): the site name shown in Google's
 * results instead of the domain, and who runs it.
 */
export async function SiteJsonLd() {
  const [t, locale] = await Promise.all([
    getTranslations("Metadata"),
    getLocale(),
  ]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: ["Ulmiversitaet", "ulmiversitaet.de"],
    url: `${BASE_URL}${getPathname({ href: "/", locale })}`,
    description: t("description"),
    inLanguage: locale,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: BASE_URL,
      logo: `${BASE_URL}/logo512.png`,
      sameAs: [siteConfig.links.instagram, siteConfig.links.github],
    },
  };

  return (
    <script
      type="application/ld+json"
      // `<` escaped, so the content can't close the script tag
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
