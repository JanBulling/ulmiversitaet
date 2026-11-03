import { TramFront } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Panel, PanelEmpty, PanelHeader } from "@/components/ui/panel";

// TODO: real-time departures (SWU API), see Ulmiversitaet-Web/src/lib/public-transport
export async function PublicTransportSection({
  className,
}: {
  className?: string;
}) {
  const t = await getTranslations("HomePage.PublicTransport");

  return (
    <Panel className={className}>
      <PanelHeader icon={TramFront} title={t("title")} />
      <PanelEmpty>{t("comingSoon")}</PanelEmpty>
    </Panel>
  );
}
