"use client";

import { useTranslations } from "next-intl";

import { getBuilding, type CampusPlace } from "@/features/campus-map/places";
import { cn } from "@/lib/utils";
import { KIND_ICONS } from "./kind-icon";

/** "Hörsaal · O25 · Niveau 2 · 210 Plätze" */
function usePlaceSummary() {
  const t = useTranslations("CampusMap");
  return (place: CampusPlace, { withKind = true } = {}) => {
    const building =
      place.buildingId && place.buildingId !== place.id
        ? getBuilding(place.buildingId)?.properties.label
        : undefined;
    return [
      withKind && t(`kinds.${place.kind}`),
      building,
      place.floor && t("floor", { floor: place.floor }),
      place.seats && t("seats", { count: place.seats }),
      place.buildingId === place.id && place.area && t(`areas.${place.area}`),
      place.description,
    ]
      .filter(Boolean)
      .join(" · ");
  };
}

/**
 * One place in a list: icon, name (+ extra name), summary; the whole row is clickable.
 * `option` rows belong to the search listbox (keyboard via the search field), the others are buttons.
 */
export function PlaceRow({
  place,
  option,
  active = false,
  withKind = true,
  onSelect,
}: {
  place: CampusPlace;
  option?: { id: string };
  /** Highlighted by the keyboard while searching */
  active?: boolean;
  /** Hide the kind in the summary (lists of one kind) */
  withKind?: boolean;
  onSelect: (id: string) => void;
}) {
  const summary = usePlaceSummary();
  const Icon = KIND_ICONS[place.kind];
  const className = cn(
    "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left hover:bg-muted",
    active && "bg-muted",
  );
  const content = (
    <>
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">
          {place.name}
          {place.title && (
            <span className="font-normal text-muted-foreground">
              {" "}
              {place.title}
            </span>
          )}
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {summary(place, { withKind })}
        </span>
      </span>
    </>
  );

  if (option) {
    return (
      // Keyboard selection happens in the search field (combobox pattern)
      <li
        id={option.id}
        role="option"
        aria-selected={active}
        onClick={() => onSelect(place.id)}
        className={className}
      >
        {content}
      </li>
    );
  }
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(place.id)}
        className={className}
      >
        {content}
      </button>
    </li>
  );
}
