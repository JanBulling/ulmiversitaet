import type { MetadataRoute } from "next";

import { META_THEME_COLORS, siteConfig } from "@/lib/site";

/**
 * Web app manifest (`/manifest.webmanifest`): makes the site installable ("Add to Home Screen",
 * install button in Chrome/Edge). Next.js adds the `<link rel="manifest">` automatically.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    lang: "de",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: META_THEME_COLORS.light,
    theme_color: META_THEME_COLORS.light,
    icons: [
      { src: "/logo192.png", sizes: "192x192", type: "image/png" },
      { src: "/logo512.png", sizes: "512x512", type: "image/png" },
    ],
    // Long-press menu of the app icon (Android, Windows)
    shortcuts: [
      { name: "Mensa", url: "/mensa" },
      { name: "Parkplätze", short_name: "Parken", url: "/parking-lots" },
      { name: "Links", url: "/links" },
    ],
  };
}
