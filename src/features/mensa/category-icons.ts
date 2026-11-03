/** Icons selectable for category groups (stored by name in `category_groups.icon`) */
export const CATEGORY_ICON_NAMES = [
  "beef",
  "bird",
  "carrot",
  "cooking-pot",
  "drumstick",
  "fish",
  "gem",
  "ham",
  "hamburger",
  "ice-cream",
  "leaf",
  "pizza",
  "salad",
  "shrimp",
  "utensils",
  "vegan",
  "wheat",
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_NAMES)[number];
