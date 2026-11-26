# Banner

A thin notice at the very top of every page of the website, above the header (e.g. "Mensa heute geschlossen"). Admins manage it at `/admin/banner`. It is not shown in the admin dashboard.

## What visitors see

- One line: an icon, the **title** in bold, then the description in muted text. A long text is cut off with "…"; the full text is in the tooltip.
- A light tint of the chosen color as background, with the ℹ icon in the full color: **Standard** (brand color) or one of the muted event colors (red, orange, yellow, green, teal, blue, purple, pink, gray).
- With a link, the whole bar is clickable (arrow at the end). Addresses of other websites open in a new tab, paths of the site (`/mensa`) open in the same tab, in the visitor's language.
- English pages show the English texts if the banner has an English title, otherwise the German ones.
- It scrolls away with the page; the header below stays sticky.

## Admin

- **Neuer Banner**: title (required), description, link, color, and optional English texts, with a live preview. Saving shows it right away and hides the previous one.
- **Angezeigt**: the visible banner with a preview and **Ausblenden**.
- **Frühere Banner**: the latest 50 hidden banners with **Einblenden** (hides the visible one) and edit. Banners are deleted on their edit page.
- Links must start with `https://`, `http://` or `/` (not `//`); other links (e.g. `javascript:`) are rejected.

## How it works

- Table `ulmiversitaet.banners` (`src/lib/db/schema/banners.ts`, migrations `0004_banners.sql` and `0005_banner-colors.sql`, which replaced the Info/Warnung style with the color). A partial unique index allows only one row with `visible = true`. Creating or showing a banner hides the visible one in the same transaction (`db.batch`).
- `getVisibleBanner()` (`src/features/banner/queries.ts`) is `"use cache: remote"` with the `banner` tag and no expiry (`cacheLife("max")`), so pages never query the database for it. Every admin action (`src/features/admin/banner/actions.ts`) calls `updateTag("banner")`, so the next page load shows the change.
- `SiteBanner` (`src/components/layout/site-banner.tsx`) renders it in the site layout (`src/app/[locale]/(site)/layout.tsx`) inside `<Suspense>`. A database error leaves the banner out instead of breaking every page; errors aren't cached.
- The bar is `BannerBar` (`src/components/layout/banner-bar.tsx`), also used for the previews in the admin.

## Where to change what

| What                          | File                                                                                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Look of the bar               | `src/components/layout/banner-bar.tsx`                                                                                                                          |
| Colors to choose from         | `src/lib/db/schema/banner-colors.ts` (new colors need a migration for the check constraint), CSS values in `src/features/banner/format.ts` → `bannerColorValue` |
| Allowed links, language rules | `src/features/banner/format.ts` → `isAllowedBannerLink`, `localizeBanner`                                                                                       |
| Maximum text lengths          | `src/features/admin/banner/schema.ts`                                                                                                                           |
| Texts                         | `src/lib/i18n/messages/{de,en}.json` → `Banner`, `Admin.banner`                                                                                                 |
