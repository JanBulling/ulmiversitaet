import { Suspense } from "react";

import { SiteBanner } from "@/components/layout/site-banner";

/** The banner is only shown on the home page (`@banner` slot of the site layout) */
export default function HomeBanner() {
  return (
    <Suspense>
      <SiteBanner />
    </Suspense>
  );
}
