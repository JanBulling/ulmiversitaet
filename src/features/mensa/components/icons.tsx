import {
  Beef,
  Bird,
  Carrot,
  CookingPot,
  Drumstick,
  Fish,
  Gem,
  Ham,
  Hamburger,
  IceCreamCone,
  Leaf,
  Pizza,
  Salad,
  Shrimp,
  Utensils,
  Vegan,
  Wheat,
  type LucideIcon,
} from "lucide-react";

import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { mealTypeInfo } from "../codes";

/** Icons selectable for category groups (stored by name in `category_groups.icon`) */
const ICONS: Record<string, LucideIcon> = {
  beef: Beef,
  bird: Bird,
  carrot: Carrot,
  "cooking-pot": CookingPot,
  drumstick: Drumstick,
  fish: Fish,
  gem: Gem,
  ham: Ham,
  hamburger: Hamburger,
  "ice-cream": IceCreamCone,
  leaf: Leaf,
  pizza: Pizza,
  salad: Salad,
  shrimp: Shrimp,
  utensils: Utensils,
  vegan: Vegan,
  wheat: Wheat,
};

export const ICON_NAMES = Object.keys(ICONS);

export function CategoryIcon({
  icon,
  color,
  size = 16,
  className,
}: {
  icon: string | null;
  color?: string | null;
  size?: number;
  className?: string;
}) {
  const Icon = (icon && ICONS[icon]) || Utensils;
  return (
    <Icon
      size={size}
      className={className}
      style={color ? { color } : undefined}
      aria-hidden
    />
  );
}

/** Round colored badge for a diet/meat code (vegan, pork, …) */
export function MealTypeIcon({
  code,
  locale,
  className,
}: {
  code: string;
  locale: Locale;
  className?: string;
}) {
  const type = mealTypeInfo(code, locale);
  const Icon = type.icon ? ICONS[type.icon] : null;

  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
        className,
      )}
      style={{ backgroundColor: type.color }}
      title={type.name}
    >
      {Icon ? <Icon size={13} aria-hidden /> : type.code}
      <span className="sr-only">{type.name}</span>
    </span>
  );
}
