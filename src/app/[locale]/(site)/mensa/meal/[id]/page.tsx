import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { MealView, MealViewSkeleton } from "@/components/mensa/meal-view";
import { mealName } from "@/features/mensa/display";
import { getMeal } from "@/features/mensa/queries";
import { Link } from "@/lib/i18n/navigation";

type Props = PageProps<"/[locale]/mensa/meal/[id]">;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadMeal(params: Props["params"]) {
  const { id } = await params;
  return UUID.test(id) ? getMeal(id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [meal, locale, t] = await Promise.all([
    loadMeal(params),
    getLocale(),
    getTranslations("Mensa"),
  ]);
  return meal
    ? { title: mealName(meal, locale), description: t("mealMetaDescription") }
    : {};
}

export default async function MealPage({ params }: Props) {
  const t = await getTranslations("Mensa");

  return (
    <>
      <div className="px-4 md:px-0">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/mensa">
            <ArrowLeft />
            {t("backToMenu")}
          </Link>
        </Button>
      </div>
      <Suspense fallback={<MealViewSkeleton />}>
        <Meal params={params} />
      </Suspense>
    </>
  );
}

async function Meal({ params }: { params: Props["params"] }) {
  const meal = await loadMeal(params);
  if (!meal) notFound();
  return <MealView meal={meal} />;
}
