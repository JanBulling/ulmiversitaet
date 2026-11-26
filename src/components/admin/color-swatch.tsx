import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/** Round color button of a color picker (`role="radio"`, checkmark when selected) */
export function ColorSwatch({
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
