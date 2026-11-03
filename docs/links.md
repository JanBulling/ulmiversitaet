# Links

The link collection at `/links` lists the university services (Moodle, CampusOnline, StuVe, International Office, …), grouped into categories, with a search. Every category also has its own page at `/links/<slug>`. The home page quick links and "More links" tiles reference the same entries, so a URL only has to be changed in one place.

## Where things live

| What                                      | File                                                               |
| ----------------------------------------- | ------------------------------------------------------------------ |
| The links, one file per category          | `src/content/links/categories/*.ts`                                |
| Order of the categories                   | `src/content/links/index.ts` → `LINK_CATEGORIES`                   |
| Data model (all fields with comments)     | `src/content/links/types.ts`                                       |
| Category icons                            | `src/components/links/category-icon.tsx`                           |
| Quick links and "More links" on home page | `src/content/home.ts` → `QUICK_LINKS`, `FEATURED_LINKS`            |
| Page texts (title, search, "uni network") | `src/lib/i18n/messages/{de,en}.json` → `Links`                     |
| Resolving, search, link check (logic)     | `src/features/links/{links,search,check}.ts`                       |
| UI (row, collection with search)          | `src/components/links/`, pages in `src/app/[locale]/(site)/links/` |

## Adding a link

Add an entry to the `links` array of the matching category file. The position in the array is the position on the page.

```ts
{
  id: "zoom",                                   // unique, lowercase, a-z 0-9 and "-"
  label: "Zoom",                                // same text in both languages …
  href: "https://uni-ulm.zoom-x.de/",
  description: {                                // … or one per language
    de: "Videokonferenzen der Uni.",
    en: "Video conferences of the university.",
  },
  keywords: ["video", "meeting", "konferenz"], // optional, extra search terms
  uniNetworkOnly: false,                        // optional, shows "Nur im Uni-Netz"
  related: [                                    // optional, sub-links below the entry
    { label: { de: "Anleitung", en: "Guide" }, href: "/guides/zoom" },
  ],
},
```

- **`id`** never changes once other places use it (home page, possibly later bookmarks). Rename the label instead.
- **`label` / `description`**: a plain string is used for both languages (product names); otherwise give `{ de, en }`. Both languages are required, the type checker enforces it.
- **`href`**: `https://…`, `mailto:…`, or an internal path without locale (`/guides/exmatrikulieren`). Internal links stay in the app and get the current language prefix; external links open in a new tab.
- **`keywords`**: only words that are _not_ already in the label or description, e.g. synonyms ("drucken" for Print@Uni) or what people search for ("raum" for the Hörsaalfinder). The search covers labels, descriptions, and related links in **both** languages plus the host name, ignores case and umlauts ("horsaal" finds "Hörsaal"), and requires every word of the query to match.
- **`uniNetworkOnly`**: for services that only work on eduroam or via VPN. The link checker then expects them to be unreachable from outside instead of reporting them as broken.
- **`related`**: sub-pages of the same service (course catalog, reset password, …). They are shown as small links below the entry and are searchable, but can't be referenced from the home page.

## Adding a category

1. Create `src/content/links/categories/<name>.ts` (copy an existing one) with a unique `slug`. The slug is the URL (`/links/<slug>`), so keep it short and don't change it later.
2. Add it to `LINK_CATEGORIES` in `src/content/links/index.ts` at the position it should appear.
3. Pick an icon. To use a new one: add the name to `CategoryIconName` in `types.ts` and map it to the lucide component in `category-icon.tsx`.

The category page is generated at build time (`generateStaticParams`); nothing else to register.

## Home page

`src/content/home.ts` only references links by id:

- `QUICK_LINKS`: the app-icon row at the top. `label` overrides the name if it's too long for the icon (`"Campus Online"`), `image` or `lucideIcon` sets the icon.
- `FEATURED_LINKS`: the "More links" tiles next to the guides, with a lucide icon each.

Both lists end with a tile to `/links`. If a referenced id is removed or misspelled, `pnpm test` fails (and `getLink` throws at build time).

## Checking the links

```bash
pnpm check:links
```

requests every link and related link (6 at a time, HEAD with GET fallback) and groups the result:

- **Broken** (404, 5xx, unreachable): fix or remove. The script exits with code 1.
- **Not reachable from here (uni network only)**: expected for `uniNetworkOnly` entries when you're off campus. Run it on eduroam or VPN to really check them.
- **Redirected**: the link works but ends up somewhere else. Update the URL if the page moved; leave it if it's a login redirect (e.g. single sign-on). Redirects from a start page to a page on the same host (`/` → `/login`) are not reported.
- **Restricted** (401/403): login wall or bot protection, usually fine. Open it in the browser to be sure.

Run it every few months and before the start of a semester, the university moves pages regularly. Known redirects that are fine: the course catalog (SSO → CampusOnline) and the StuVe account request (→ cloud login).

## Tests

`pnpm test` (`src/features/links/links.test.ts`) checks that ids and slugs are unique and URL-friendly, all URLs are valid, internal links point to an existing guide or page (pages outside the guides are whitelisted in `INTERNAL_PAGES`), the home page only references existing ids, and the search behaves as described above.
