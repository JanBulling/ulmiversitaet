# SEO and link previews

How the site describes itself to search engines and in link previews (WhatsApp, Signal, Instagram, Slack, …).

## Titles and descriptions

- Every page sets `title` and `description` in `generateMetadata` (texts in `src/lib/i18n/messages/{de,en}.json`). The root layout (`src/app/[locale]/layout.tsx`) adds ` | Ulmiversität` to the title and holds the defaults: site description and keywords (`Metadata.*`), Open Graph type, site name, and locale.
- The layout deliberately sets **no** Open Graph/Twitter title or description: Next.js then fills them from the page's own `title` and `description`. Setting them in the layout would show the home page text for every shared link.
- A page that sets its own `openGraph` replaces the layout's completely. Spread `baseOpenGraph(locale)` from `src/lib/metadata.ts` back in (see the guide page).
- The home page title is `Metadata.homeTitle` (without the suffix).

## Open Graph images

Generated with `ImageResponse` from `next/og` at build time. All of them use the template `src/lib/og/og-image.tsx` (logo, title, description, section icon or tags).

| Image                                                          | File                                                                                            |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Default (home page and pages without their own)                | `src/app/[locale]/opengraph-image.tsx`                                                          |
| Mensa, departures, parking, campus map, links, guides overview | `src/app/[locale]/(site)/<section>/opengraph-image.tsx` (used by all pages below the section)   |
| Single guide or guide folder                                   | `src/app/[locale]/og/guides/[...slug]/route.tsx`, linked in the guide page's `generateMetadata` |

Things to know:

- Each `opengraph-image.tsx` exports `generateStaticParams` (the locales), otherwise Next.js renders it on every request instead of at build time.
- `opengraph-image.tsx` can't live below a catch-all segment (`[...slug]`); Turbopack crashes. That's why guides use a route handler.
- Next.js links the images with the locale (`/de/opengraph-image`). `src/proxy.ts` skips these paths, so next-intl doesn't redirect them.
- Satori (the renderer) only handles flexbox and a subset of CSS, and can't render client components. lucide-react icons are client components, so the section icons are copied as SVG paths into `src/lib/og/icons.ts`.
- To see an image locally, open the page, copy the `og:image` URL from the HTML, and open it. Or open the guide image directly, e.g. `/og/guides/eduroam/ios`.

### Fonts

Satori can't read variable fonts, and it misapplies Geist's kerning table (wide gaps between some words). `src/lib/og/Geist-Regular.ttf` and `Geist-ExtraBold.ttf` are static instances without kerning, subset to Latin. To recreate them (needs `pip install fonttools`):

```python
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

for weight, name in [(400, "Regular"), (800, "ExtraBold")]:
    font = instancer.instantiateVariableFont(TTFont("public/fonts/Geist.ttf"), {"wght": weight})
    del font["GPOS"]
    options = subset.Options(); options.layout_features = []; options.name_IDs = ["*"]
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=[*range(0x20, 0x7F), *range(0xA0, 0x180), 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x201E, 0x2022, 0x2026, 0x20AC])
    subsetter.subset(font)
    font.save(f"src/lib/og/Geist-{name}.ttf")
```

## Sitemap, robots, hreflang

- `src/app/sitemap.ts` → `/sitemap.xml`: all public pages, link categories and guides, each with its German and English URL. **Add new top-level pages to `PAGES` there.** Single meals and menu days are left out on purpose.
- `src/app/robots.ts` → `/robots.txt`: everything except `/admin` and `/api/`, plus the sitemap.
- hreflang: next-intl's proxy sends a `Link` header with the German, English and `x-default` URL on every page; the sitemap repeats it.

## Structured data

The home page renders a schema.org `WebSite` (`src/components/home/site-json-ld.tsx`), so Google can show "Ulmiversität" as the site name.

## After deploying

- Register the site in the [Google Search Console](https://search.google.com/search-console) and submit `https://www.ulmiversitaet.de/sitemap.xml` (same for Bing Webmaster Tools).
- Check previews with e.g. [opengraph.xyz](https://www.opengraph.xyz). Messengers cache previews, so an old link can keep the old image for a while.
