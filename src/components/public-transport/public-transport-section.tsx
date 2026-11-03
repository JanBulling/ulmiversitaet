import { AlertTriangle, Rss, TramFront } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_STOP } from "@/content/public-transport/featured-stops";
import {
  getDepartures,
  getPassengerAlert,
} from "@/features/public-transport/swu-api";
import { DeparturesBoard } from "./departures-board";

/** Real-time departures of the university stops, plus current SWU disruptions */
export async function PublicTransportSection({
  className,
}: {
  className?: string;
}) {
  await connection(); // real-time data, never prerendered
  const [t, departures, alert] = await Promise.all([
    getTranslations("HomePage.PublicTransport"),
    getDepartures(DEFAULT_STOP.stopId).catch((error) => {
      console.error("[public-transport] Loading departures failed", error);
      return null;
    }),
    getPassengerAlert().catch(() => null),
  ]);

  return (
    <Panel className={className}>
      <Header />
      {alert?.status === "disruption" && (
        <div className="mb-2 px-4">
          <Alert variant="destructive" icon={AlertTriangle}>
            <AlertTitle>{alert.title ?? t("disruption")}</AlertTitle>
            <AlertDescription>
              {alert.messages.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </AlertDescription>
          </Alert>
        </div>
      )}
      <DeparturesBoard initialDepartures={departures} />
    </Panel>
  );
}

export function PublicTransportSectionSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <Panel className={className}>
      <Header />
      <div className="space-y-2 px-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </Panel>
  );
}

async function Header() {
  const t = await getTranslations("HomePage.PublicTransport");
  return (
    <PanelHeader icon={TramFront} title={t("title")}>
      {/* "Live" indicator */}
      <span className="relative flex size-4" title={t("live")}>
        <span className="absolute inline-flex size-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-primary opacity-50" />
        <Rss className="relative size-4 text-primary" aria-hidden />
      </span>
    </PanelHeader>
  );
}
