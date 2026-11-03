import { StarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function RatingStars({
  value = 0,
  count,
  size = 20,
  max = 5,
  showValue = true,
  className,
}: {
  value?: number;
  /** Shown in parentheses after the value */
  count?: number;
  size?: number;
  max?: number;
  showValue?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${value.toFixed(1)} / ${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <StarIcon
          key={i}
          size={size}
          className={cn(value - 0.5 >= i && "fill-current")}
          aria-hidden
        />
      ))}
      {showValue && (
        <span className="ml-1 text-sm font-semibold">
          {value.toFixed(1)}
          {!!count && <span className="font-normal"> ({count})</span>}
        </span>
      )}
    </div>
  );
}
