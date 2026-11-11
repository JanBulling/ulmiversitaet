import { Suspense } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { TabBar, TabBarFallback } from "@/components/layout/tab-bar";

export default function SiteLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    // Bottom padding on mobile: room for the fixed tab bar (`h-14`) and the home indicator
    <div className="relative flex min-h-svh flex-col bg-background pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <Suspense fallback={<TabBarFallback />}>
        <TabBar />
      </Suspense>
    </div>
  );
}
