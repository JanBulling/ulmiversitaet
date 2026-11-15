import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { HumanCheckForm } from "./human-check-form";

/**
 * Shown instead of content that would query the database for old data (archive, old menus
 * and meals), until the visitor solved the human check (`features/human-check`)
 */
export async function HumanCheck() {
  const t = await getTranslations("HumanCheck");

  return (
    <>
      <PanelHeader icon={ShieldCheck} title={t("title")} as="h3" />
      <PanelBody className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <HumanCheckForm />
      </PanelBody>
    </>
  );
}

/** The human check in its own panel, for pages without a surrounding panel */
export function HumanCheckPanel() {
  return (
    <Panel>
      <HumanCheck />
    </Panel>
  );
}
