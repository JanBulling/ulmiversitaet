import { ArrowLeft, CookingPot } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page";
import { OrderWestButton } from "@/components/mensa/mensa-section";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

/** Static header of the menu pages (part of the prerendered shell) */
export async function MenuHeader() {
  const t = await getTranslations("Mensa");
  return (
    <>
      <div className="px-4 md:px-0">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft />
            {t("backToHome")}
          </Link>
        </Button>
      </div>
      <PageHeader
        icon={CookingPot}
        title={t("menuTitle")}
        actions={<OrderWestButton />}
      />
    </>
  );
}
