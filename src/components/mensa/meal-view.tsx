import { Apple, CalendarDays, MessageSquare, Star, Wheat } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
} from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { toDate } from "@/lib/date";
import { Link } from "@/lib/i18n/navigation";
import { allergenName, mealTypeInfo } from "@/features/mensa/codes";
import { formatPrice, mealName } from "@/features/mensa/display";
import type { MealDetails } from "@/features/mensa/queries";
import { CategoryLabel } from "./category-label";
import { MealTypeIcon } from "./icons";
import { RatingStars } from "./rating-stars";

type Meal = NonNullable<MealDetails>;

export async function MealView({ meal }: { meal: Meal }) {
  return (
    <>
      <MealHeader meal={meal} />
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
        <div className="space-y-4 md:col-span-4">
          <Rating meal={meal} />
          <Comments meal={meal} />
        </div>
        <div className="space-y-4 md:col-span-3">
          <Nutrition meal={meal} />
          <Allergens meal={meal} />
          <ServedOn meal={meal} />
        </div>
      </div>
    </>
  );
}

export function MealViewSkeleton() {
  return (
    <>
      <Panel className="space-y-3 px-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-12 w-full" />
      </Panel>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
        <Panel className="space-y-3 px-4 md:col-span-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
        </Panel>
        <Panel className="space-y-3 px-4 md:col-span-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-40 w-full" />
        </Panel>
      </div>
    </>
  );
}

async function MealHeader({ meal }: { meal: Meal }) {
  const [t, format, locale] = await Promise.all([
    getTranslations("Mensa"),
    getFormatter(),
    getLocale(),
  ]);

  const prices = [
    ["student", meal.prices.studentCents],
    ["employee", meal.prices.employeeCents],
    ["guest", meal.prices.guestCents],
  ] as const;

  return (
    <Panel>
      <PanelBody>
        <CategoryLabel category={meal.category} />
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">
          {mealName(meal, locale)}
        </h1>
        {locale === "de" && meal.nameEn && (
          <p className="text-sm text-muted-foreground">{meal.nameEn}</p>
        )}

        {meal.types.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {meal.types.map((code) => {
              const type = mealTypeInfo(code, locale);
              return (
                <li key={code} className="flex items-center gap-2">
                  <MealTypeIcon code={code} locale={locale} />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: type.color }}
                  >
                    {type.name}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </PanelBody>

      <dl className="mt-4 grid grid-cols-3 divide-x border-t pt-3">
        {prices.map(([group, cents]) => (
          <div key={group} className="px-4">
            <dt className="text-xs text-muted-foreground">{t(group)}</dt>
            <dd className="font-mono text-lg font-bold">
              {formatPrice(format, cents)}
            </dd>
          </div>
        ))}
      </dl>
      {meal.prices.note && (
        <p className="mt-1 px-4 text-xs text-muted-foreground">
          {meal.prices.note}
        </p>
      )}
    </Panel>
  );
}

async function Rating({ meal }: { meal: Meal }) {
  const t = await getTranslations("Mensa");
  const count = meal.rating?.count ?? 0;

  return (
    <Panel>
      <PanelHeader icon={Star} title={t("rating")}>
        {t("ratingCount", { count })}
      </PanelHeader>
      <PanelBody className="space-y-3">
        <RatingStars
          value={meal.rating?.total}
          size={28}
          className="text-primary"
        />
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-1">
          {(["taste", "look", "price"] as const).map((dimension) => (
            <div key={dimension} className="contents">
              <dt className="text-sm font-semibold">{t(dimension)}</dt>
              <dd>
                <RatingStars size={16} value={meal.rating?.[dimension]} />
              </dd>
            </div>
          ))}
        </dl>
      </PanelBody>
    </Panel>
  );
}

async function Comments({ meal }: { meal: Meal }) {
  const [t, format] = await Promise.all([
    getTranslations("Mensa"),
    getFormatter(),
  ]);

  return (
    <Panel>
      <PanelHeader icon={MessageSquare} title={t("comments")}>
        {meal.comments.length > 0 && meal.comments.length}
      </PanelHeader>
      {meal.comments.length === 0 ? (
        <PanelEmpty>{t("noComments")}</PanelEmpty>
      ) : (
        <ul className="divide-y divide-accent">
          {meal.comments.map((comment) => (
            <li key={comment.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <RatingStars value={comment.total} size={14} />
                <time
                  className="font-mono text-xs text-muted-foreground"
                  dateTime={comment.createdAt.toISOString()}
                >
                  {format.dateTime(comment.createdAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-line">{comment.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

async function Nutrition({ meal }: { meal: Meal }) {
  const [t, format] = await Promise.all([
    getTranslations("Mensa"),
    getFormatter(),
  ]);
  const n = meal.nutrition;
  const grams = (value: number | null) =>
    value === null ? "–" : `${format.number(value)} g`;

  const rows: { label: string; value: string; nested?: boolean }[] = [
    {
      label: t("energy"),
      value: n.energyKcal === null ? "–" : `${n.energyKcal} kcal`,
    },
    { label: t("protein"), value: grams(n.proteinG) },
    { label: t("fat"), value: grams(n.fatG) },
    { label: t("saturatedFat"), value: grams(n.saturatedFatG), nested: true },
    { label: t("carbohydrates"), value: grams(n.carbohydratesG) },
    { label: t("sugar"), value: grams(n.sugarG), nested: true },
    { label: t("salt"), value: grams(n.saltG) },
  ];
  if (n.co2G !== null) {
    rows.push({ label: t("co2"), value: `${format.number(n.co2G)} g` });
  }

  return (
    <Panel>
      <PanelHeader icon={Apple} title={t("nutrition")}>
        {t("perPortion")}
      </PanelHeader>
      {n.energyKcal === null && n.proteinG === null ? (
        <PanelEmpty>{t("noNutrition")}</PanelEmpty>
      ) : (
        <dl className="text-sm">
          {rows.map((row) => (
            <div
              key={row.label}
              className={
                row.nested
                  ? "flex justify-between px-4 pb-1 pl-8 text-xs text-muted-foreground"
                  : "flex justify-between border-t border-accent px-4 py-1.5 first:border-t-0"
              }
            >
              <dt>{row.label}</dt>
              <dd className="font-mono">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Panel>
  );
}

async function Allergens({ meal }: { meal: Meal }) {
  const [t, locale] = await Promise.all([
    getTranslations("Mensa"),
    getLocale(),
  ]);

  return (
    <Panel>
      <PanelHeader icon={Wheat} title={t("allergens")} />
      {meal.allergens.length === 0 ? (
        <PanelEmpty>{t("noAllergens")}</PanelEmpty>
      ) : (
        <PanelBody>
          <ul className="flex flex-wrap gap-1.5">
            {meal.allergens.map((code) => (
              <li
                key={code}
                className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
                title={code}
              >
                {allergenName(code, locale)}
              </li>
            ))}
          </ul>
        </PanelBody>
      )}
    </Panel>
  );
}

async function ServedOn({ meal }: { meal: Meal }) {
  const [t, format] = await Promise.all([
    getTranslations("Mensa"),
    getFormatter(),
  ]);
  if (meal.servedOn.length === 0) return null;

  return (
    <Panel>
      <PanelHeader icon={CalendarDays} title={t("servedOn")} />
      <ul>
        {meal.servedOn.map((date) => (
          <li key={date}>
            <Link
              href={`/mensa/${date}`}
              className="block px-4 py-1.5 font-mono text-sm hover:bg-muted"
            >
              {format.dateTime(toDate(date), {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
