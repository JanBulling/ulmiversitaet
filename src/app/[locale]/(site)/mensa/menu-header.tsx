import { CookingPot } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page";
import { OrderWestButton } from "@/components/mensa/mensa-section";

/** Static header of the menu pages (part of the prerendered shell) */
export async function MenuHeader() {
  const t = await getTranslations("Mensa");
  return (
    <PageHeader
      icon={CookingPot}
      title={t("menuTitle")}
      actions={<OrderWestButton />}
    />
  );
}
