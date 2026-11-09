import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

/** Back button of the archive, price tracker and ranking pages */
export async function BackToMenu() {
  const t = await getTranslations("Mensa");
  return (
    <div className="px-4 md:px-0">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/mensa">
          <ArrowLeft />
          {t("backToMenu")}
        </Link>
      </Button>
    </div>
  );
}
