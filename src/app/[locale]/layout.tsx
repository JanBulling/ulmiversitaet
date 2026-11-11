import "../globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { baseOpenGraph } from "@/lib/metadata";
import { META_THEME_COLORS, siteConfig } from "@/lib/site";
import { routing } from "@/lib/i18n/routing";
import { fontMono, fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// `maximumScale: 1`: iOS Safari doesn't zoom in when a search field is focused (it still allows
// pinch zoom; Android Chrome doesn't).
// `cover`: the page reaches under the iPhone home indicator and notch, so `env(safe-area-inset-*)`
// has values. The mobile tab bar uses them to stay above the home indicator.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

/**
 * Defaults for every page. Open Graph and Twitter title/description are left out on purpose:
 * Next.js then fills them from each page's own `title` and `description`, so shared links show
 * the page instead of the site. The images come from the `opengraph-image.tsx` files.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("Metadata"),
    getLocale(),
  ]);

  return {
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    metadataBase: new URL(siteConfig.url),
    description: t("description"),
    keywords: t.raw("keywords") as string[],
    authors: [
      { name: "Jan Bulling", url: "https://jan-bulling.com" },
      { name: "Stefan Rau" },
    ],
    creator: "Jan Bulling",
    openGraph: baseOpenGraph(locale),
    twitter: { card: "summary_large_image" },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    // Home screen app on iOS (the manifest is `src/app/manifest.ts`)
    appleWebApp: {
      capable: true,
      title: siteConfig.name,
      statusBarStyle: "default",
    },
  };
}

export default async function RootLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]').setAttribute('content', '${META_THEME_COLORS.dark}')
                }
              } catch (_) {}
            `,
          }}
        />
        <meta name="theme-color" content={META_THEME_COLORS.light} />
      </head>
      <body
        className={cn(
          // Side padding keeps content clear of the notch in landscape (`viewportFit: "cover"`)
          "min-h-svh bg-background pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] font-sans text-foreground antialiased",
          fontSans.variable,
          fontMono.variable,
        )}
      >
        <NextIntlClientProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
        {/* Page views, without cookies; only active on Vercel deployments */}
        <Analytics />
        {/* Core Web Vitals of real visits; only active on Vercel deployments */}
        <SpeedInsights />
      </body>
    </html>
  );
}
