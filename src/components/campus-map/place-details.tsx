"use client";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  ExternalLink,
  Route,
  Share2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  getBuilding,
  nearestStop,
  type CampusPlace,
} from "@/features/campus-map/places";
import { roomsInBuilding } from "@/features/campus-map/search";
import { Link } from "@/lib/i18n/navigation";
import { KIND_ICONS } from "./kind-icon";
import { PlaceRow } from "./place-row";

/** Facts, nearest stop, actions, and for buildings the rooms inside */
export function PlaceDetails({
  place,
  places,
  onSelect,
  onBack,
}: {
  place: CampusPlace;
  places: CampusPlace[];
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const t = useTranslations("CampusMap");
  const Icon = KIND_ICONS[place.kind];
  const building =
    place.buildingId && place.buildingId !== place.id
      ? getBuilding(place.buildingId)?.properties
      : undefined;
  const isBuilding = place.buildingId === place.id || place.kind === "building";
  const rooms = isBuilding ? roomsInBuilding(places, place.id) : [];
  const stop = place.kind === "stop" ? null : nearestStop(place, places);

  const facts: [string, React.ReactNode][] = [];
  if (building) {
    facts.push([
      t("facts.building"),
      <button
        key="building"
        type="button"
        onClick={() => onSelect(building.id)}
        className="font-semibold underline underline-offset-4"
      >
        {building.label}
        {building.name && ` (${building.name})`}
      </button>,
    ]);
  }
  if (place.area) facts.push([t("facts.area"), t(`areas.${place.area}`)]);
  if (place.floor) facts.push([t("facts.floor"), place.floor]);
  if (place.room && place.room !== place.name)
    facts.push([t("facts.room"), place.room]);
  if (place.seats) facts.push([t("facts.seats"), place.seats]);
  if (place.printer) {
    facts.push([
      t("facts.printer"),
      `${place.printer.paper.join(", ")} · ${t(place.printer.color ? "printerColor" : "printerBlackWhite")}`,
    ]);
  }

  return (
    <div>
      <div className="px-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft aria-hidden />
          {t("back")}
        </Button>
      </div>

      <header className="mt-2 px-4">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Icon className="size-4" aria-hidden />
          {t(`kinds.${place.kind}`)}
        </p>
        <h2 className="mt-1 text-xl font-bold md:text-2xl">{place.name}</h2>
        {(place.title || place.description) && (
          <p className="text-muted-foreground">
            {place.title ?? place.description}
          </p>
        )}
      </header>

      {facts.length > 0 && (
        <dl className="mt-3 divide-y divide-border border-y">
          {facts.map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-4 px-4 py-2 text-sm"
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-mono">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {stop && (
        <button
          type="button"
          onClick={() => onSelect(stop.stop.id)}
          className="mt-3 flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-muted"
        >
          <KIND_ICONS.stop
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="flex-1">
            <span className="block text-muted-foreground">
              {t("nearestStop")}
            </span>
            <span className="font-semibold">{stop.stop.name}</span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </button>
      )}

      <div className="mt-3 flex flex-wrap gap-2 px-4">
        <Button size="sm" asChild>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=walking`}
            target="_blank"
            rel="noreferrer"
          >
            <Route aria-hidden />
            {t("route")}
          </a>
        </Button>
        <ShareButton
          title={place.title ? `${place.name} ${place.title}` : place.name}
        />
        {place.href && (
          <Button variant="outline" size="sm" asChild>
            <Link href={place.href}>
              {t(place.kind === "parking" ? "freeSpaces" : "openMenu")}
              <ChevronRight aria-hidden />
            </Link>
          </Button>
        )}
        {place.url && (
          <Button variant="outline" size="sm" asChild>
            <a href={place.url} target="_blank" rel="noreferrer">
              {t("officialPage")}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </Button>
        )}
      </div>

      {rooms.length > 0 && (
        <section className="mt-4">
          <h3 className="px-4 text-lg font-semibold">
            {t("roomsInBuilding", { building: place.name })}
          </h3>
          <ul className="mt-1 divide-y divide-border">
            {rooms.map((room) => (
              <PlaceRow key={room.id} place={room} onSelect={onSelect} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Native share sheet where available, otherwise copies the link */
function ShareButton({ title }: { title: string }) {
  const t = useTranslations("CampusMap");
  const [copied, setCopied] = useState(false);

  async function share() {
    const data = { title, url: window.location.href };
    try {
      if (navigator.share && navigator.canShare?.(data)) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(data.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Closing the share sheet is not an error
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={share}>
      {copied ? <Check aria-hidden /> : <Share2 aria-hidden />}
      {copied ? t("copied") : t("share")}
    </Button>
  );
}
