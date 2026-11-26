import { Megaphone } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page";
import {
  BannersAdmin,
  BannersAdminSkeleton,
} from "@/components/admin/banner/banners-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("banner") };
}

export default async function AdminBannerPage() {
  const t = await getTranslations("Admin");

  return (
    <>
      <PageHeader
        icon={Megaphone}
        title={t("nav.banner")}
        description={t("banner.intro")}
      />
      <Suspense fallback={<BannersAdminSkeleton />}>
        <BannersAdmin />
      </Suspense>
    </>
  );
}
