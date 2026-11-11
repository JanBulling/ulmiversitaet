import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { Page } from "@/components/layout/page";
import { EventsSection } from "@/components/events/events-section";
import { CampusMapTeaser } from "@/components/home/campus-map-teaser";
import { FeaturedGuides } from "@/components/home/featured-guides";
import { FeaturedLinks } from "@/components/home/featured-links";
import { QuickLinks } from "@/components/home/quick-links";
import { SiteJsonLd } from "@/components/home/site-json-ld";
import {
  ParkingSection,
  ParkingSectionSkeleton,
} from "@/components/parking/parking-section";
import {
  MensaSection,
  MensaSectionSkeleton,
} from "@/components/mensa/mensa-section";
import {
  PublicTransportSection,
  PublicTransportSectionSkeleton,
} from "@/components/public-transport/public-transport-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  // Without the " | Ulmiversität" suffix, the name is already part of the title
  return { title: { absolute: t("homeTitle") } };
}

export default function HomePage() {
  return (
    <Page className="space-y-8">
      <SiteJsonLd />
      <QuickLinks />

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
        <Suspense fallback={<MensaSectionSkeleton className="md:col-span-4" />}>
          <MensaSection className="md:col-span-4" />
        </Suspense>
        <Suspense
          fallback={
            <PublicTransportSectionSkeleton className="md:col-span-3" />
          }
        >
          <PublicTransportSection className="md:col-span-3" />
        </Suspense>
        <Suspense
          fallback={<ParkingSectionSkeleton className="col-span-full" />}
        >
          <ParkingSection className="col-span-full" />
        </Suspense>
      </div>

      <CampusMapTeaser />

      {/* Renders nothing when there are no upcoming events */}
      <Suspense>
        <EventsSection />
      </Suspense>

      <div className="grid grid-cols-1 gap-x-4 gap-y-8 md:grid-cols-2">
        <FeaturedGuides />
        <FeaturedLinks />
      </div>
    </Page>
  );
}
