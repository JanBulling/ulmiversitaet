/**
 * Background colors of banners; `default` is the brand color. Its own file without database
 * imports, so the admin form can use it in the browser.
 */
export const BANNER_COLORS = [
  "default",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "gray",
] as const;

export type BannerColor = (typeof BANNER_COLORS)[number];
