import { Suspense } from "react";

import { Page } from "@/components/layout/page";
import { EventsSection } from "@/features/events/components/events-section";
import { FeaturedGuides } from "@/features/home/components/featured-guides";
import { FeaturedLinks } from "@/features/home/components/featured-links";
import { QuickLinks } from "@/features/home/components/quick-links";
import {
  MensaSection,
  MensaSectionSkeleton,
} from "@/features/mensa/components/mensa-section";
import { PublicTransportSection } from "@/features/public-transport/components/public-transport-section";

export default function HomePage() {
  return (
    <Page className="space-y-8">
      <QuickLinks />

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
        <Suspense fallback={<MensaSectionSkeleton className="md:col-span-4" />}>
          <MensaSection className="md:col-span-4" />
        </Suspense>
        <PublicTransportSection className="md:col-span-3" />
      </div>

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
