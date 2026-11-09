"use client";

import { CalendarDays } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { formatDayFirst, parseDayFirst, type IsoDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { Input } from "./input";

/**
 * Date field that always shows the day first (`04.11.2026`, in English `04/11/2026`). The
 * native `<input type="date">` uses the browser's language instead, so an English browser
 * shows `11/04/2026`. The date can be typed or picked in the browser's calendar; forms get
 * it as `YYYY-MM-DD` (hidden input `name`), like from a native date input.
 */
export function DateInput({
  id,
  name,
  defaultValue = "",
  onValueChange,
  min,
  max,
  required,
  className,
}: {
  id?: string;
  /** Name of the hidden input with the ISO date, for forms */
  name?: string;
  defaultValue?: IsoDate;
  /** The ISO date, or `""` while the field is empty or invalid */
  onValueChange?: (value: IsoDate | "") => void;
  min?: IsoDate;
  max?: IsoDate;
  required?: boolean;
  className?: string;
}) {
  const t = useTranslations("DateInput");
  const separator = useLocale() === "de" ? "." : "/";
  const format = (date: IsoDate) => formatDayFirst(date, separator);
  const [text, setText] = useState(defaultValue && format(defaultValue));
  // Marked as invalid only after leaving the field, not while typing
  const [touched, setTouched] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const picker = useRef<HTMLInputElement>(null);

  const parsed = parseDayFirst(text);
  const inRange =
    parsed !== null && (!min || parsed >= min) && (!max || parsed <= max);
  const value = inRange ? parsed : "";
  const error = !text.trim()
    ? ""
    : parsed === null
      ? t("invalid", { example: format("2026-11-04") })
      : !inRange
        ? t("outOfRange", {
            min: min ? format(min) : "…",
            max: max ? format(max) : "…",
          })
        : "";

  // The browser blocks the form with this message, like for a native date input
  useEffect(() => field.current?.setCustomValidity(error), [error]);

  function change(next: string) {
    setText(next);
    const date = parseDayFirst(next);
    onValueChange?.(
      date && (!min || date >= min) && (!max || date <= max) ? date : "",
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        value={text}
        onChange={(event) => change(event.target.value)}
        // Shows the typed date in the usual form, e.g. "4.11.26" → "04.11.2026"
        onBlur={() => {
          setTouched(true);
          if (parsed) setText(format(parsed));
        }}
        ref={field}
        aria-invalid={(touched && Boolean(error)) || undefined}
        placeholder={t("placeholder")}
        autoComplete="off"
        required={required}
        className="pr-10 font-mono"
      />
      {name && <input type="hidden" name={name} value={value} />}

      {/* Invisible native date input: only used to open the browser's calendar below the field */}
      <input
        ref={picker}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => {
          if (event.target.value) change(format(event.target.value));
        }}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0"
      />
      <button
        type="button"
        onClick={() => picker.current?.showPicker()}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        aria-label={t("openCalendar")}
      >
        <CalendarDays className="size-4" aria-hidden />
      </button>
    </div>
  );
}
