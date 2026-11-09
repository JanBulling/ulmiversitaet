# Design guidelines

The reference for the look of the website is the **mensa section on the home page**. Every page should feel like it is built from the same parts. When in doubt, compare a new page side by side with the home page.

## 1. Principles

1. **Flat panels, not cards.** Content lives in panels: square, bordered, no shadow. Rounded corners are reserved for things you click to go somewhere else (tiles) and for small controls.
2. **Dense and scannable.** Rows instead of boxes, short labels, numbers right-aligned in a monospace font.
3. **Color carries meaning.** `primary` marks the brand (header icons, main action). Category and diet colors are only used for their labels and icons. Everything else is foreground or muted.
4. **One way to do each thing.** Use the shared components below instead of styling containers by hand.

## 2. Building blocks

| Component           | File                             | Use for                                                                                        |
| ------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `Page`              | `src/components/layout/page.tsx` | Every page. Width `default` (`max-w-screen-xl`) or `narrow` (`max-w-screen-lg`, reading pages) |
| `PageHeader`        | `src/components/layout/page.tsx` | Page title (`h1`) with icon, optional description and small actions                            |
| `Panel`             | `src/components/ui/panel.tsx`    | Any section of content (`as="article"` for guides)                                             |
| `PanelHeader`       | ″                                | Icon + title (`h2`) + muted meta / small button on the right                                   |
| `PanelBody`         | ″                                | Padded text content inside a panel                                                             |
| `PanelFooter`       | ″                                | Centered actions at the end (e.g. outline "Ganzer Speiseplan" button)                          |
| `PanelEmpty`        | ″                                | Empty state ("Mensa heute geschlossen")                                                        |
| `Tile` / `MoreTile` | `src/components/ui/tile.tsx`     | Links to other pages (guides, folders, "Mehr Anleitungen")                                     |
| `Button`            | `src/components/ui/button.tsx`   | Actions and navigation buttons                                                                 |
| `Skeleton`          | `src/components/ui/skeleton.tsx` | Loading placeholders                                                                           |
| `Alert`             | `src/components/ui/alert.tsx`    | Notices and errors inside content                                                              |

Use-case-specific parts (e.g. `CategoryLabel`, `MealRow`, `RatingStars` in `src/components/mensa/`, `LinkRow` in `src/components/links/`) are built from these rules and should be reused within their area. All components live in `src/components/`; `src/features/` contains only logic.

## 3. Layout

- **Page structure:** `Page` → optional back button → `PageHeader` → panels. Vertical spacing between blocks is `space-y-4` (provided by `Page`).
- **Mobile is full-bleed.** Panels touch the screen edges and only have a top/bottom border (`border-y`); from `md` they get a border on all sides. Content outside panels (headers, back buttons, tile grids) gets `px-4 md:px-0` so it lines up with the text inside panels.
- **Panel content is not padded.** Rows span the full panel width so their hover background reaches the edges; rows and `PanelBody` add `px-4` themselves.
- **Grids:**
  - Main + aside: `grid md:grid-cols-7`, `md:col-span-4` + `md:col-span-3` (home page, meal page).
  - Two equal columns: `grid md:grid-cols-2` (menu page).
  - Tiles: `grid gap-2 sm:grid-cols-2 lg:grid-cols-3`.
  - Gaps between panels: `gap-4`. Add `items-start` so panels don't stretch.

## 4. Shape

| Element                                 | Radius                                     |
| --------------------------------------- | ------------------------------------------ |
| Panels, page sections, rows             | none                                       |
| Tiles, alerts, images in guides         | `rounded-lg`                               |
| Buttons, inputs, code blocks, skeletons | `rounded-md`                               |
| Inline code                             | `rounded-sm`                               |
| Pills (allergens), diet badges, avatars | `rounded-full`                             |
| Quick-link app icons (home page)        | `rounded-2xl` (deliberately app-icon-like) |

- **No shadows.** The only exception is the built-in `shadow-xs` of buttons.
- **Borders:** the theme `border` color everywhere, also for dividers between rows: `divide-y divide-border` (or `border-t border-border`). Don't use `accent` for lines, it is too dark. Where whitespace separates items well enough (meals on the home page), leave the lines out.

## 5. Typography

| Role                                                     | Classes                                               |
| -------------------------------------------------------- | ----------------------------------------------------- |
| Page title (`PageHeader`, meal name, guide title)        | `text-2xl md:text-3xl font-bold`                      |
| Panel title (`PanelHeader`)                              | `text-xl md:text-2xl font-bold`                       |
| Item title (meal, tile, comment author)                  | `font-semibold`                                       |
| Category label                                           | `font-mono font-bold uppercase` in the category color |
| Body text                                                | default size, `leading-relaxed` for long text         |
| Meta text (dates, counts, descriptions)                  | `text-sm text-muted-foreground`                       |
| Small meta (nutrition summary, tile meta)                | `text-xs text-muted-foreground`                       |
| Numbers: prices, times, dates in lists, nutrition values | `font-mono`                                           |

- Headings are `font-bold` (titles) or `font-semibold` (items). Don't use `font-medium` or `tracking-tight` for headings.
- Markdown (`src/mdx-components.tsx`) follows the same scale: `h2` = panel title size, `h3` = `text-lg font-semibold`.

## 6. Color

- Use theme tokens from `src/app/globals.css`: `background`, `card`, `muted`, `muted-foreground`, `primary`, `accent`, `border`, `destructive`, `success`, `warning`, `info`.
- `text-primary`: header icons, the big rating, the main call to action.
- **Data colors** (category groups from the database, diet types in `src/features/mensa/codes.ts`) are applied via `style={{ color }}` to labels and icons only, never to large backgrounds. Diet badges are the one exception (small round chips).
- Unassigned categories fall back to a neutral gray (`DEFAULT_CATEGORY_COLOR`).
- Don't use the `secondary` button variant for now: the dark theme doesn't define `--secondary`, so the text is unreadable. Use `outline` for a second-level highlight (e.g. "Heute" in the day selector).

## 7. Icons

- Only `lucide-react`. Icons are decorative (`aria-hidden`) unless they are the only content of a button (then the button gets an `aria-label`).
- Panel/page header icon: `size-6 md:size-8 text-primary`, done by `PanelHeader`/`PageHeader`.
- Inline icons in meta lines: `size-4`. Category icons next to labels: 16 px. Tile icons: `size-5 text-primary`.
- Category icons are stored by name in the database; the allowed names are in `src/features/mensa/category-icons.ts`, their lucide components in `src/components/mensa/icons.tsx`.

## 8. Interaction

| Element                           | Behavior                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------- |
| Rows inside panels (meals, dates) | Whole row is the link, `hover:bg-muted`, no underline                           |
| Tiles                             | `bg-muted` → `hover:bg-background`, chevron moves `group-hover:translate-x-0.5` |
| Main action of a section          | `Button size="sm"` (default variant) in the header, e.g. "Bestellung West"      |
| "Show more" / "go to full page"   | `Button variant="outline"` with `ChevronRight` in `PanelFooter`                 |
| Back navigation                   | `Button variant="ghost" size="sm"` with `ArrowLeft`, above the page content     |
| Links in running text             | underlined (`underline underline-offset-4`)                                     |
| External links                    | open in a new tab, `ExternalLink` icon (size 3) on buttons                      |
| Link rows (`/links`)              | Title with `ExternalLink` (external, new tab) or `ChevronRight` (internal) icon |

## 8a. Forms

- Fields: `Input`, `Select` (native, styled like `Input`), and `Label` from `src/components/ui/input.tsx`. Native checkboxes get `size-4 accent-primary`.
- Dates: `DateInput` (`src/components/ui/date-input.tsx`), never `<input type="date">`. The native field shows the date in the browser's language (`11/04/2026` in an English browser); `DateInput` always shows the day first (`04.11.2026`, `04/11/2026` in English), opens the browser's calendar from its icon, and submits `YYYY-MM-DD`.
- Forms submit to Server Actions (`<form action={…}>`). Show validation errors with `useActionState`; errors are `text-sm text-destructive` below the field or next to the submit button, success as `text-success` with a check icon.
- Submit buttons are `SubmitButton` (`src/components/ui/submit-button.tsx`): disabled with a spinner while the action runs.
- Changes that apply immediately (assigning a category) use `AutoSubmitSelect` or a small form around a single button instead of a separate "save" step.
- Layout: label above field (`space-y-2`), fields in `grid gap-4 sm:grid-cols-2`, hints as `text-xs text-muted-foreground` below the field.
- Destructive actions (`variant="destructive"`) sit in their own panel with a sentence explaining the consequence.

## 8b. Site chrome and home page

- **Header** (`src/components/layout/site-header.tsx`): logo left, main navigation centered (`ghost` buttons, current section `font-semibold text-primary`), right: network badge (lg+), theme toggle and language dropdown (md+), menu button (below md). Sticky, `bg-card`, `border-b`; when scrolled it becomes translucent (`header.scrolled` in `globals.css`). New top-level pages go into `NAV_ITEMS` (`src/components/layout/nav-items.ts`).
- **Mobile menu**: full-screen sheet from the top, large centered links, language buttons and theme toggle at the bottom. Closes on navigation.
- **Footer**: logo, legal links (`link` buttons), social icons; on mobile also network badge and language switch.
- Parts that read the URL (`usePathname`) or request headers are wrapped in `<Suspense>` with a static fallback that looks the same, so pages keep their prerendered shell.
- **Home page order**: quick links (4 × 2 on phones, one row of 8 from `md`) → mensa (`md:col-span-4`) + public transport (`md:col-span-3`) + parking → campus map teaser (text `md:col-span-3`, static map `md:col-span-4`) → events (only if there are any) → featured guides + links (`md:grid-cols-2`). Content (links, featured guides) lives in `src/content/home.ts`.
- **Events**: one panel with a compact month calendar on the left (desktop only; event days marked with a dot in the event color, today in `primary`, navigation over the next three months) and the upcoming events on the right, each in its own `rounded-lg border bg-muted` box: color dot and title, then date (`font-mono`) · time · location, then the description.

## 9. States

- **Empty:** `PanelEmpty` (centered, italic, muted), inside the panel that would contain the data.
- **Loading:** skeletons with the same structure as the final page (panels with skeleton rows), so nothing jumps when the content streams in. Data that depends on the URL or "today" is wrapped in `<Suspense>` with such a skeleton; static parts (`PageHeader`) stay outside so they are part of the prerendered shell. Parts that only need "today" and no data (the mensa day selector) get no skeleton: they are cached on their own (`TODAY_CACHE_LIFE` in `src/features/mensa/cache.ts`) and rendered right away.
- **Not found:** `notFound()`; the shared `not-found.tsx` page handles the look.
- **Errors/notices:** `Alert` with the matching variant.

## 10. Text, dates, numbers

- Every string comes from `src/lib/i18n/messages/{de,en}.json`; never hard-code German or English in components.
- Format with `next-intl` (`getFormatter()` / `useFormatter()`); the time zone is `Europe/Berlin`.

| Value                        | Format                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| Price                        | `format.number(cents / 100, { style: "currency", currency: "EUR" })` → `4,65 €` / `€4.65` |
| Date in a list               | `weekday: "short", day: "2-digit", month: "2-digit"` → `Mi., 04.11.`                      |
| Date as heading              | `dateStyle: "full"` → `Mittwoch, 4. November 2026`                                        |
| Timestamp                    | `dateStyle: "medium", timeStyle: "short"`                                                 |
| Calendar date (`YYYY-MM-DD`) | convert with `toDate()` from `src/lib/date.ts` before formatting                          |

## 11. Accessibility

- Every page has exactly one `h1` (`PageHeader` or the title inside the first panel).
- Color is never the only information: category labels have text, diet badges have a `title` and screen-reader text.
- Current selection is marked with `aria-current` (day selector, language switcher).
- Disabled navigation stays in the layout (`invisible`) instead of shifting other elements.

## 12. Checklist for a new page or feature

- [ ] Wrapped in `Page`, title via `PageHeader` (or `h1` in the first panel)
- [ ] Sections are `Panel`s with `PanelHeader`; no hand-made `rounded-* border shadow` boxes
- [ ] Lists are full-width rows with `hover:bg-muted`; links to other pages are `Tile`s
- [ ] Numbers, prices, and dates in `font-mono`
- [ ] Looks right on mobile (full-bleed panels, nothing wraps awkwardly) and in dark mode
- [ ] Empty and loading states use `PanelEmpty` and matching skeletons
- [ ] All text translated in `de.json` and `en.json`

## 13. Open points

- Define dark-mode values for `--secondary`, `--accent`, and `--primary` in `globals.css` (currently inherited from light mode or commented out).
