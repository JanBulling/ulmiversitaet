import { Page } from "@/components/layout/page";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";

// Shown on client navigations while the guide streams in; the prerendered HTML already contains the guide
export default function GuideLoading() {
  return (
    <Page width="narrow">
      <Skeleton className="mx-4 h-8 w-48 md:mx-0" />
      <Panel className="space-y-4 px-4 md:px-8">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-64 w-full" />
      </Panel>
    </Page>
  );
}
