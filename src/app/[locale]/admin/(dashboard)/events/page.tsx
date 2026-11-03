import { CalendarClock } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page";
import {
  EventsAdmin,
  EventsAdminSkeleton,
} from "@/features/events/admin/components/events-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("events") };
}

export default async function AdminEventsPage() {
  const t = await getTranslations("Admin");

  return (
    <>
      <PageHeader
        icon={CalendarClock}
        title={t("nav.events")}
        description={t("events.intro")}
      />
      <Suspense fallback={<EventsAdminSkeleton />}>
        <EventsAdmin />
      </Suspense>
    </>
  );
}
