import { ArrowLeft, GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ExmatriculationQuiz } from "@/components/exmatriculation/exmatriculation-quiz";
import { Page, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody } from "@/components/ui/panel";
import { Link } from "@/lib/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Exmatriculation");
  return { title: t("title"), description: t("description") };
}

export default async function ExmatriculationPage() {
  const t = await getTranslations("Exmatriculation");

  return (
    <Page width="narrow">
      <div className="px-4 md:px-0">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/guides/exmatrikulieren">
            <ArrowLeft />
            {t("backToHome")}
          </Link>
        </Button>
      </div>
      <PageHeader
        icon={GraduationCap}
        title={t("title")}
        description={t("description")}
      />
      <Panel>
        <PanelBody>
          <ExmatriculationQuiz />
        </PanelBody>
      </Panel>
    </Page>
  );
}
