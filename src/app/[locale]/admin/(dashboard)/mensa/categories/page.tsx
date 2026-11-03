import { Tags } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page";
import {
  CategoriesAdmin,
  CategoriesAdminSkeleton,
} from "@/components/admin/mensa-categories/categories-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.categories");
  return { title: t("title") };
}

export default async function AdminCategoriesPage() {
  const t = await getTranslations("Admin.categories");

  return (
    <>
      <PageHeader
        icon={Tags}
        title={t("title")}
        description={t("description")}
      />
      <Suspense fallback={<CategoriesAdminSkeleton />}>
        <CategoriesAdmin />
      </Suspense>
    </>
  );
}
