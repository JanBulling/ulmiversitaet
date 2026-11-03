# Ulmiversität

Merges [ulmiversitaet.de](https://www.ulmiversitaet.de) (`Ulmiversitaet-Web`) and [mensa.ulmiversitaet.de](https://mensa.ulmiversitaet.de) (`Ulmiversitaet-Mensa`) into one Next.js app.

## Stack

- **Next.js 16.4** (App Router, Turbopack, Cache Components + Partial Prefetching)
- **next-intl** for i18n. German is the default and lives at `/`, English at `/en`
- **Drizzle ORM** on **Neon** Postgres (serverless HTTP driver). Reuses the existing production database
- **MDX** guides compiled at build time by `@next/mdx`
- **Tailwind CSS 4**, shadcn/ui-style components (`components.json`), `next-themes`
- `@t3-oss/env-nextjs` + zod for typed env vars

## Getting started

```bash
cp .env.example .env.local   # fill in NEON_DATABASE_URL
pnpm install
pnpm dev
```

| Script                  | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| `pnpm dev`              | Dev server                                                        |
| `pnpm build`            | Production build (validates env vars)                             |
| `pnpm typecheck`        | Generate route types and run `tsc`                                |
| `pnpm test`             | Unit and database tests (Vitest + PGlite)                         |
| `pnpm lint`             | ESLint                                                            |
| `pnpm format`           | Prettier (with Tailwind class sorting)                            |
| `pnpm db:studio`        | Drizzle Studio                                                    |
| `pnpm update:transport` | Update the SWU stop list and check the line config (`--dry-run`)  |
| `pnpm check:links`      | Check every URL of the link collection for broken links/redirects |
| `pnpm db:generate`      | Generate SQL migration from schema changes                        |
| `pnpm db:migrate`       | Apply migrations                                                  |

## Project structure

```
src/
├── app/                      # Routing only: thin pages that compose components
│   ├── [locale]/             # Root layout (<html>), `locale` is a root param
│   │   ├── (site)/           # Public pages with header/footer
│   │   ├── admin/            # Admin dashboard (login + (dashboard)/…)
│   │   └── not-found.tsx
│   ├── api/cron/             # Cron jobs (Route Handlers)
│   └── global-not-found.tsx
├── components/               # All UI (.tsx), grouped by use case
│   ├── ui/                   #   Primitives: button, panel, tile, input, sheet, …
│   ├── layout/               #   Page, header, footer, navigation, theme
│   ├── mdx/                  #   Components available inside guides
│   ├── home/                 #   Quick links, featured guides/links
│   ├── mensa/                #   Menu, meal page, home section
│   ├── events/               #   Events on the home page
│   ├── guides/               #   Guide tiles and article
│   ├── public-transport/
│   ├── parking/
│   ├── links/                #   Link rows, link collection with search
│   └── admin/                #   Admin navigation, login form
│       ├── mensa/            #     Menu refresh
│       ├── mensa-categories/ #     Category assignment and display categories
│       └── events/           #     Event list and form
├── features/                 # All logic (.ts), no UI: data access, actions, parsing
│   ├── mensa/                #   Queries, scraper/, sync/, codes, display helpers
│   ├── events/               #   Queries, formatting
│   ├── public-transport/     #   SWU API client, nearest stops, formatting
│   ├── parking/              #   Parking counters, occupancy
│   ├── links/                #   Resolving links per language, search, link check
│   ├── guides/               #   Reading the MDX guides
│   └── admin/                #   Server Actions and queries of the dashboard
│       ├── auth/             #     Login, logout
│       ├── mensa/
│       ├── mensa-categories/
│       └── events/
├── content/                  # What the site says: guides (.mdx), legal texts (.md), links/, home page selection
├── lib/                      # Technical foundation, no domain logic
│   ├── auth/                 #   Admin session (token, cookie, requireAdmin)
│   ├── db/                   #   Drizzle client, schema/, migrations/, testing/
│   ├── i18n/                 #   next-intl routing, request config, navigation, messages/
│   ├── date.ts, geolocation.ts, network.ts, env.ts, site.ts, fonts.ts, utils.ts
├── mdx-components.tsx        # Markdown element styles (file location required by @next/mdx)
└── proxy.ts                  # Locale detection, admin redirect (file location required by Next.js)
```

**Dependency direction:** `app` → `components` → `features` → `lib`. Components may use features and lib; features only use `lib` and `content` (never `components`); `lib` uses neither. The folders below `components/` and `features/` mirror each other (e.g. `components/admin/events/` ↔ `features/admin/events/`).

## Conventions

### Design

- Follow `docs/design-guidelines.md`. Build pages from `Page`, `PageHeader`, `Panel`, and `Tile` (`src/components/`); the home page mensa section is the visual reference.

### i18n

- Server components use `getTranslations` / `getLocale` from `next-intl/server`. The locale comes from `next/root-params`, so `setRequestLocale` is **not** needed.
- Always use `Link`, `redirect`, `usePathname` and `useRouter` from `@/lib/i18n/navigation`, not from `next/link` / `next/navigation`.
- Message keys are typed against `src/lib/i18n/messages/de.json` (`src/lib/i18n/global.d.ts`). Add every key to both files.
- Route Handlers and Server Actions have no root params, so pass the locale explicitly: `getTranslations({ locale, namespace })`.

### Guides

- Put a file in `src/content/guides/` as `<slug>.<locale>.mdx`, e.g. `eduroam/ios.de.mdx` → `/guides/eduroam/ios`. Folders get an overview page automatically.
- Frontmatter is validated at build time (`src/features/guides/guides.ts`): `title`, `summary`, `publishedAt`, `author` are required; `titleWeb`, `description`, `keywords` are optional.
- A guide missing in English falls back to the German version.
- Available components: `Link`, `Button`, `Image`, `ThemeImage`, `StepWithImage`, `Alert`, `AlertTitle`, `AlertDescription` (see `src/mdx-components.tsx`).

### Database

- All tables live in the Postgres schema **`ulmiversitaet`** (`src/lib/db/schema/common.ts`), without table-name prefixes. Add new tables with `ulmiversitaet.table(...)` in a file per feature and export it from `schema/index.ts`.
- The database still contains the legacy tables of the old deployments (`public.mensa_*`, `public.ulmiversitaet_*`). drizzle-kit only looks at the `ulmiversitaet` schema (`schemaFilter`), so it never touches them.
- Schema changes: edit the schema, run `pnpm db:generate`, review the SQL in `src/lib/db/migrations/`, then `pnpm db:migrate`. Don't use `drizzle-kit push`.
- Statements that must be atomic go into `db.batch([...])` (one transaction over the HTTP driver).
- Read data in `"use cache"` functions with `cacheTag`/`cacheLife`; invalidate with `updateTag` (Server Actions) or `revalidateTag` (cron/Route Handlers).
- The mensa data model is documented in `docs/plans/mensa-database.md`.

### Caching / rendering

- `cacheComponents` is on: data access is dynamic by default. Cache explicitly with `"use cache"`, or wrap request-time data in `<Suspense>`.
- Content that depends on `params`/`searchParams` must sit behind a Suspense boundary (`loading.tsx` or `<Suspense>`) so navigations stay instant. The dev overlay flags violations.

### Mensa

- Menus are scraped from the Studierendenwerk endpoint (`src/features/mensa/scraper/`) and written to the database by `syncMenu` (`src/features/mensa/sync/`). The data model is described in `docs/plans/mensa-database.md`.
- Two Vercel cron jobs (`vercel.json`, times in UTC, Hobby plan runs them within the given hour):
  - `/api/cron/mensa/next-week` — Fridays: loads Monday–Friday of next week.
  - `/api/cron/mensa/today` — weekday mornings: refreshes today's menu (the mensa sometimes changes it on short notice).
- Manual run (e.g. to fill a fresh database): `curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/mensa/next-week?week=2026-11-02"` or `.../today?date=2026-11-04`.
- New categories on the menu are added automatically without a group; assign them in the admin dashboard.

### Tests

- `pnpm test` runs Vitest. Parser tests use real menu pages saved in `src/features/mensa/scraper/__fixtures__/`; when the mensa changes its markup, save a new page there and add a test.
- Database tests use `createTestDatabase()` (`src/lib/db/testing/`): an in-memory Postgres (PGlite) with all migrations applied. No Neon connection needed.

### Admin dashboard

- Lives at `/admin` (not linked anywhere, `noindex`). One account: `ADMIN_USERNAME` / `ADMIN_PASSWORD` from the environment; the session is a signed, `httpOnly` cookie (7 days, key derived from `SESSION_SECRET` + password, so changing the password logs out all sessions).
- `src/proxy.ts` redirects to `/admin/login` without a valid cookie (optimistic). The real check is `requireAdmin()` (`src/lib/auth/session.ts`), called by every admin page, query, and Server Action.
- Mensa (`/admin/mensa`): reload today, this week, next week, or a single day from the Studierendenwerk (for spontaneous menu changes the cron jobs don't catch).
- Categories (`/admin/mensa/categories`): assign menu categories to display categories, rename them (de/en), set color, icon, kind, order, and whether they appear on the home page. Changes are visible on the public pages immediately (`updateTag`), and past price averages are recomputed when a category's group or kind changes.
- Events (`/admin/events`): create, edit, and delete the events shown on the home page (`ulmiversitaet.events`); an event disappears from the home page once its end date has passed.
- Admin logic (Server Actions, queries) lives in `src/features/admin/{auth,mensa,mensa-categories,events}/`, the matching UI in `src/components/admin/…`.

### Home page

- Sections, top to bottom: quick links, mensa + public transport, parking, events (hidden when there are none), featured guides + links.
- **Parking** (`src/features/parking/`, `src/components/parking/`, page `/parking-lots`): free spaces from the university's parking guidance system, read on the server (the API is HTTP-only) and cached for a minute; the browser refreshes via `/api/parking`. Lots and their order: `src/content/parking/parking-lots.ts`. Details: `docs/parking.md`.
- **Public transport** (`src/features/public-transport/`, `src/components/public-transport/`): real-time departures from the SWU API (`api.swu.de/mobility/v1`, no key needed). The server renders the first departures of Uni Süd and the current disruption notice; the browser then refreshes every 15 s directly from SWU (the API allows cross-origin requests) and counts down every second. "Near me" uses the browser location and the stop list in `src/content/public-transport/stops.json` (3 nearest stops within 5 km). The featured stops are in `src/content/public-transport/featured-stops.ts`. How to change stops, lines, and colors (and the `pnpm update:transport` script): see `docs/public-transport.md`.
- Quick links, featured links, and featured guides are edited in `src/content/home.ts`. Quick and featured links reference entries of the link collection by id.

### Links

- The link collection (`/links`, one page per category at `/links/<slug>`) is plain TypeScript data in `src/content/links/categories/*.ts`, typed by `src/content/links/types.ts`. Add a link there; the home page, search, and category pages pick it up.
- `pnpm check:links` reports broken and moved URLs; `pnpm test` checks ids, URLs, internal links, and home page references. Details: `docs/links.md`.
- The header shows "eduroam® aktiv" / "Uni-VPN aktiv" based on the client IP (`src/lib/network.ts`).
