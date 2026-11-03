import { CalendarClock, CookingPot, LayoutDashboard, Tags } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Tile } from "@/components/ui/tile";
import { countUnassignedCategories } from "@/features/mensa/admin/queries";

export default async function AdminPage() {
  const t = await getTranslations("Admin");

  return (
    <>
      <PageHeader
        icon={LayoutDashboard}
        title={t("nav.overview")}
        description={t("overview.description")}
      />
      <Suspense fallback={<Skeleton className="mx-4 h-32 md:mx-0" />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  const [t, unassigned] = await Promise.all([
    getTranslations("Admin"),
    countUnassignedCategories(), // also checks the session
  ]);

  return (
    <ul className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-2 md:px-0 lg:grid-cols-3">
      <li>
        <Tile
          href="/admin/mensa"
          icon={CookingPot}
          title={t("nav.mensa")}
          description={t("overview.mensaDescription")}
          className="h-full"
        />
      </li>
      <li>
        <Tile
          href="/admin/events"
          icon={CalendarClock}
          title={t("nav.events")}
          description={t("overview.eventsDescription")}
          className="h-full"
        />
      </li>
      <li>
        <Tile
          href="/admin/mensa/categories"
          icon={Tags}
          title={t("nav.categories")}
          description={t("overview.categoriesDescription", {
            count: unassigned,
          })}
          className="h-full"
        />
      </li>
    </ul>
  );
}
