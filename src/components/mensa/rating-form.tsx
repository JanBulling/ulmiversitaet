"use client";

import { Check, Clock, StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useId, useState, useSyncExternalStore } from "react";

import { PanelBody } from "@/components/ui/panel";
import { SubmitButton } from "@/components/ui/submit-button";
import { rateMeal, type RatingFormState } from "@/features/mensa/actions";
import { ratedMealsFromCookieHeader } from "@/features/mensa/rated-meals";
import { RATING_OPENS_AT, ratingWindow } from "@/features/mensa/rating-window";
import type { IsoDate } from "@/lib/date";
import { cn } from "@/lib/utils";

const DIMENSIONS = ["taste", "look", "price"] as const;
const COMMENT_MAX_LENGTH = 1000;

/**
 * Rating with an optional comment, once per meal and day; only open on a day the meal is
 * served, from 11:30 (`servedOn`: the days it is served, at least from today on)
 */
export function RatingForm({
  mealId,
  servedOn,
}: {
  mealId: string;
  servedOn: IsoDate[];
}) {
  const t = useTranslations("Mensa");
  const [state, action] = useActionState<RatingFormState, FormData>(
    rateMeal,
    {},
  );
  const [comment, setComment] = useState("");
  const ratedToday = useRatedToday(mealId);
  const now = useNow();

  if (state.saved || ratedToday) {
    return (
      <PanelBody>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="size-4 shrink-0 text-success" aria-hidden />
          {state.saved ? t("ratingSaved") : t("alreadyRated")}
        </p>
      </PanelBody>
    );
  }

  // The time is only known in the browser
  if (now === null) return null;
  const status = ratingWindow(servedOn, new Date(now));
  if (status !== "open") {
    return (
      <PanelBody>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4 shrink-0" aria-hidden />
          {t(`ratingErrors.${status}`, { time: RATING_OPENS_AT })}
        </p>
      </PanelBody>
    );
  }

  return (
    <PanelBody>
      <form action={action} className="space-y-4">
        <input type="hidden" name="mealId" value={mealId} />
        <p className="text-sm text-muted-foreground">{t("rateMealHint")}</p>

        <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-4 gap-y-1">
          {DIMENSIONS.map((dimension) => (
            <StarInput key={dimension} name={dimension} label={t(dimension)} />
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="comment" className="text-sm font-semibold">
            {t("commentLabel")}
          </label>
          <textarea
            id="comment"
            name="comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={COMMENT_MAX_LENGTH}
            rows={3}
            placeholder={t("commentPlaceholder")}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton>{t("submitRating")}</SubmitButton>
          {state.error && (
            <span className="text-sm text-destructive">
              {t(`ratingErrors.${state.error}`, { time: RATING_OPENS_AT })}
            </span>
          )}
        </div>
      </form>
    </PanelBody>
  );
}

/** Five radio buttons shown as stars; controlled so a failed submit keeps the choice */
function StarInput({ name, label }: { name: string; label: string }) {
  const t = useTranslations("Mensa");
  const [value, setValue] = useState(0);
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;
  const labelId = useId();
  const labels = t.raw("ratingLabels") as string[];

  return (
    <>
      <span id={labelId} className="text-sm font-semibold">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="flex"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((stars) => (
          <label
            key={stars}
            className="cursor-pointer p-0.5"
            onMouseEnter={() => setHovered(stars)}
          >
            <input
              type="radio"
              name={name}
              value={stars}
              checked={value === stars}
              onChange={() => setValue(stars)}
              required
              className="peer sr-only"
            />
            <StarIcon
              aria-hidden
              className={cn(
                "size-8 rounded-sm transition-[color,scale] peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 hover:scale-110",
                shown >= stars
                  ? "fill-current text-primary"
                  : "text-muted-foreground/50",
              )}
            />
            <span className="sr-only">{t("stars", { count: stars })}</span>
          </label>
        ))}
      </div>
      {/* "Gut", "Super", … for the hovered or chosen value */}
      <span className="text-sm text-muted-foreground" aria-hidden>
        {shown > 0 && labels[shown - 1]}
      </span>
    </>
  );
}

// The cookie only changes through the rating action, which re-renders the form anyway
const subscribe = () => () => {};

const MINUTE_MS = 60 * 1000;

function subscribeToMinutes(onChange: () => void) {
  const interval = setInterval(onChange, 10 * 1000);
  return () => clearInterval(interval);
}

/**
 * The current time rounded down to the minute, updated while the page is open (so the form
 * opens at 11:30 without a reload); `null` on the server
 */
function useNow() {
  return useSyncExternalStore(
    subscribeToMinutes,
    () => Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS,
    () => null,
  );
}

/** Whether this browser rated the meal in the last 24 hours (always `false` on the server) */
function useRatedToday(mealId: string) {
  const cookieHeader = useSyncExternalStore(
    subscribe,
    () => document.cookie,
    () => "",
  );
  return ratedMealsFromCookieHeader(cookieHeader).has(mealId);
}
