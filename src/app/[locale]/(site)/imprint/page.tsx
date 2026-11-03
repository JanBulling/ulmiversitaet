import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Page } from "@/components/layout/page";
import { Panel } from "@/components/ui/panel";
import Content from "@/content/legal/impressum.md";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Nav");
  return { title: t("imprint") };
}

// The legal text is only available in German
export default function ImprintPage() {
  return (
    <Page width="narrow">
      <Panel as="article" className="px-4 py-6 md:px-8 md:py-8" lang="de">
        <Content />
      </Panel>
    </Page>
  );
}
