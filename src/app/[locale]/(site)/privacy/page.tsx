import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Page } from "@/components/layout/page";
import { Panel } from "@/components/ui/panel";
import Content from "@/content/legal/datenschutz.md";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Nav");
  return { title: t("privacy") };
}

// The legal text is only available in German
export default function PrivacyPage() {
  return (
    <Page width="narrow">
      <Panel as="article" className="px-4 py-6 md:px-8 md:py-8" lang="de">
        <Content />
      </Panel>
    </Page>
  );
}
