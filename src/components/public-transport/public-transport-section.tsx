import { AlertTriangle, TramFront } from "lucide-react";
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
import type { PassengerAlert } from "@/features/public-transport/types";
import { DeparturesBoard } from "./departures-board";
import { LiveIndicator } from "./live-indicator";

/** Real-time departures of the university stops, plus current SWU disruptions */
export async function PublicTransportSection({
  className,
}: {
  className?: string;
}) {
  await connection(); // real-time data, never prerendered
  const [departures, alert] = await Promise.all([
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
          <DisruptionAlert alert={alert} />
        </div>
      )}
      <DeparturesBoard initialDepartures={departures} />
    </Panel>
  );
}

/** Current SWU disruption notice (home page and departures page) */
export async function DisruptionAlert({
  alert,
}: {
  alert: Extract<PassengerAlert, { status: "disruption" }>;
}) {
  const t = await getTranslations("HomePage.PublicTransport");
  return (
    <Alert variant="destructive" icon={AlertTriangle}>
      <AlertTitle>{alert.title ?? t("disruption")}</AlertTitle>
      <AlertDescription>
        {alert.messages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </AlertDescription>
    </Alert>
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
        <Skeleton className="mx-auto mt-4 h-9 w-40" />
      </div>
    </Panel>
  );
}

async function Header() {
  const t = await getTranslations("HomePage.PublicTransport");
  return (
    <PanelHeader icon={TramFront} title={t("title")}>
      <LiveIndicator label={t("live")} />
    </PanelHeader>
  );
}
