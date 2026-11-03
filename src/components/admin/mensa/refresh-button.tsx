"use client";

import { RefreshCw } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { toDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { refreshDays, type RefreshState } from "@/features/admin/mensa/actions";

/** Scrapes the given days again and shows the result per day */
export function RefreshButton({
  dates,
  label,
  variant = "outline",
  size = "sm",
  className,
}: {
  dates: string[];
  label: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const t = useTranslations("Admin.mensa");
  const format = useFormatter();
  const [state, action] = useActionState<RefreshState, FormData>(
    refreshDays,
    {},
  );

  return (
    <form action={action} className={cn("space-y-1", className)}>
      {dates.map((date) => (
        <input key={date} type="hidden" name="date" value={date} />
      ))}
      <SubmitButton variant={variant} size={size}>
        <RefreshCw />
        {label}
      </SubmitButton>
      {state.results && (
        <ul className="text-xs text-muted-foreground">
          {state.results.map((result) => (
            <li key={result.date}>
              <span className="font-mono">
                {format.dateTime(toDate(result.date), {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
              {": "}
              {result.status === "error" ? (
                <span className="text-destructive">{t("resultError")}</span>
              ) : result.status === "closed" ? (
                t("resultClosed")
              ) : (
                <>
                  {t("resultOpen", {
                    meals: result.meals,
                    newMeals: result.newMeals,
                  })}
                  {result.soldOut > 0 &&
                    `, ${t("resultSoldOut", { count: result.soldOut })}`}
                  {result.newCategories.length > 0 && (
                    <span className="text-warning">
                      {", "}
                      {t("resultNewCategories", {
                        names: result.newCategories.join(", "),
                      })}
                    </span>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
