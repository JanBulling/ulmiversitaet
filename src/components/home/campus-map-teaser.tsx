import { ArrowRight, MapPinned, Route, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { KIND_ICONS } from "@/components/campus-map/kind-icon";
import { ROOMS } from "@/content/campus-map";
import { getBuilding } from "@/features/campus-map/places";
import { campusPreview } from "@/features/campus-map/preview";
import { Link } from "@/lib/i18n/navigation";

/** Uni Ost around O25, about as wide as the card (≈ 2.2 : 1) */
const BOUNDS: [number, number, number, number] = [
  9.9505, 48.4211, 9.9605, 48.4245,
];
const PREVIEW = campusPreview(BOUNDS, 1000);

/** The room shown as example: pinned on the map, its building highlighted */
const EXAMPLE = ROOMS.find((room) => room.id === "o25-h1")!;

/** Labels drawn on the preview (the smallest buildings would overlap) */
const LABELS = new Set([
  "m23",
  "m24",
  "m25",
  "m26",
  "n24",
  "n25",
  "n26",
  "n27",
  "o25",
  "o26",
  "o27",
  "mensa",
]);

/**
 * Advertises the campus map on the home page: what it does and a static (non-interactive) map of
 * the campus that links to it.
 */
export async function CampusMapTeaser() {
  const [t, tMap] = await Promise.all([
    getTranslations("HomePage.CampusMap"),
    getTranslations("CampusMap"),
  ]);
  const building = getBuilding(EXAMPLE.building)!.properties;
  const [pinX, pinY] = PREVIEW.project(EXAMPLE.lng, EXAMPLE.lat);
  const ExampleIcon = KIND_ICONS[EXAMPLE.kind];
  const features = [
    { icon: Search, text: t("features.search") },
    { icon: MapPinned, text: t("features.highlight") },
    { icon: Route, text: t("features.route") },
  ];

  return (
    <section className="grid grid-cols-1 items-center gap-4 md:grid-cols-7">
      <div className="px-4 md:col-span-3 md:px-0">
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        {/* Only next to the map on larger screens; on phones title and map are enough */}
        <ul className="mt-4 hidden space-y-2 md:block">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <Icon
                className="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden
              />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/campus-map"
        className="group relative block overflow-hidden border-y bg-muted md:col-span-4 md:rounded-lg md:border"
        aria-label={t("open")}
      >
        <svg
          viewBox={`0 0 ${PREVIEW.width} ${PREVIEW.height}`}
          preserveAspectRatio="xMidYMid slice"
          className="h-64 w-full transition-transform duration-500 group-hover:scale-[1.02] md:h-80"
          aria-hidden
        >
          <defs>
            <pattern
              id="campus-teaser-dots"
              width="16"
              height="16"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.5" className="fill-foreground/10" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#campus-teaser-dots)" />

          {PREVIEW.buildings.map(({ id, path }) => (
            <path
              key={id}
              d={path}
              fillRule="evenodd"
              className={
                id === building.id
                  ? "fill-[#2f6f96]/60 stroke-[#2f6f96] stroke-[2.5] dark:fill-[#7cc0e8]/50 dark:stroke-[#7cc0e8]"
                  : "fill-primary/30 stroke-primary/70 stroke-1"
              }
            />
          ))}

          {PREVIEW.buildings
            .filter(({ id }) => LABELS.has(id))
            .map(({ id, label, x, y }) => (
              <text
                key={id}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground/70 text-[17px] font-bold"
              >
                {label}
              </text>
            ))}

          {/* Pin of the example room, same shape and color as on the map page */}
          <g transform={`translate(${pinX - 16} ${pinY - 42})`}>
            <path
              d="M16 41s14-13.6 14-25A14 14 0 0 0 2 16c0 11.4 14 25 14 25z"
              className="fill-[#e03131] stroke-card stroke-2 dark:fill-[#ff6b6b]"
            />
            <circle cx="16" cy="16" r="5.5" className="fill-card" />
          </g>
        </svg>

        {/* What the map page shows for the example room */}
        <div className="absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-lg border bg-card px-3 py-2">
          <ExampleIcon className="size-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold">{EXAMPLE.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[
                tMap(`kinds.${EXAMPLE.kind}`),
                building.label,
                EXAMPLE.floor && tMap("floor", { floor: EXAMPLE.floor }),
                EXAMPLE.seats && tMap("seats", { count: EXAMPLE.seats }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
          {t("open")}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </Link>
    </section>
  );
}
