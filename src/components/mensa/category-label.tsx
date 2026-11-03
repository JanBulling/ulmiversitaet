import { getLocale } from "next-intl/server";

import { cn } from "@/lib/utils";
import { categoryName, DEFAULT_CATEGORY_COLOR } from "@/features/mensa/display";
import type { DisplayCategory } from "@/features/mensa/queries";
import { CategoryIcon } from "./icons";

/** Uppercase mono label in the category color, e.g. "VEGAN 🌱" */
export async function CategoryLabel({
  category,
  className,
}: {
  category: DisplayCategory;
  className?: string;
}) {
  const locale = await getLocale();

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      style={{ color: category.color ?? DEFAULT_CATEGORY_COLOR }}
    >
      <h3 className="font-mono font-bold uppercase">
        {categoryName(category, locale)}
      </h3>
      <CategoryIcon icon={category.icon} />
    </div>
  );
}
