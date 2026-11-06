"use client";

import { Check, Pipette } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { EVENT_COLOR_PRESETS } from "@/features/events/format";
import { cn } from "@/lib/utils";

/** Muted preset swatches plus a native color picker for any other color; submits `name` */
export function EventColorField({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  const t = useTranslations("Admin.events");
  const [color, setColor] = useState(defaultValue.toLowerCase());
  const labelId = useId();
  const custom = !EVENT_COLOR_PRESETS.some((preset) => preset.value === color);

  return (
    <div className="space-y-2">
      <span id={labelId} className="text-sm leading-none font-semibold">
        {t("color")}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="flex flex-wrap items-center gap-2"
      >
        {EVENT_COLOR_PRESETS.map((preset) => (
          <Swatch
            key={preset.value}
            color={preset.value}
            label={t(`colors.${preset.name}`)}
            selected={color === preset.value}
            onSelect={() => setColor(preset.value)}
          />
        ))}
        {/* Opens the system color picker; shows the chosen color once it isn't a preset */}
        <label
          title={t("customColor")}
          className={cn(
            "relative flex size-7 cursor-pointer items-center justify-center rounded-full border text-muted-foreground transition-shadow has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50",
            custom &&
              "text-white ring-2 ring-foreground ring-offset-2 ring-offset-background",
          )}
          style={custom ? { backgroundColor: color } : undefined}
        >
          {custom ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Pipette className="size-3.5" aria-hidden />
          )}
          <input
            type="color"
            name={name}
            value={color}
            onChange={(event) => setColor(event.target.value.toLowerCase())}
            aria-label={t("customColor")}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}

function Swatch({
  color,
  label,
  selected,
  onSelect,
}: {
  color: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onSelect}
      className={cn(
        "flex size-7 items-center justify-center rounded-full text-white transition-shadow outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        selected &&
          "ring-2 ring-foreground ring-offset-2 ring-offset-background",
      )}
      style={{ backgroundColor: color }}
    >
      {selected && <Check className="size-4" aria-hidden />}
    </button>
  );
}
