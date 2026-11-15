import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";

import { HumanCheckPanel } from "@/components/human-check/human-check";
import { Button } from "@/components/ui/button";
import { MealView, MealViewSkeleton } from "@/components/mensa/meal-view";
import { isVerifiedHuman } from "@/features/human-check/human-check";
import { mealName } from "@/features/mensa/display";
import { getMeal, getOpenMealIds } from "@/features/mensa/queries";
import { today } from "@/lib/date";
import { Link } from "@/lib/i18n/navigation";

type Props = PageProps<"/[locale]/mensa/meal/[id]">;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Meals of the two weeks around today are open to everyone; all others need the human check
 * before they are loaded (see `features/mensa/history.ts`). Both checks don't query the
 * database: the open meals are cached, the check is a cookie. Once per request.
 */
const mealAccess = cache(
  async (id: string): Promise<"open" | "verified" | "locked"> => {
    if ((await getOpenMealIds(today())).includes(id)) return "open";
    return (await isVerifiedHuman()) ? "verified" : "locked";
  },
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!UUID.test(id)) return {};

  const access = await mealAccess(id);
  // Only humans may see older meals, so they aren't indexed
  const robots = access === "open" ? undefined : { index: false };
  if (access === "locked") return { robots };

  const [meal, locale, t] = await Promise.all([
    getMeal(id),
    getLocale(),
    getTranslations("Mensa"),
  ]);
  return meal
    ? {
        title: mealName(meal, locale),
        description: t("mealMetaDescription"),
        robots,
      }
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
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  if ((await mealAccess(id)) === "locked") return <HumanCheckPanel />;

  const meal = await getMeal(id);
  if (!meal) notFound();
  return <MealView meal={meal} />;
}
