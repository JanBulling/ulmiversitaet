import { ArrowLeft, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BannerForm } from "@/components/admin/banner/banner-form";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  deleteBanner,
  setBannerVisibility,
} from "@/features/admin/banner/actions";
import { getBanner } from "@/features/admin/banner/queries";
import { Link } from "@/lib/i18n/navigation";

type Props = PageProps<"/[locale]/admin/banner/[id]">;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditBannerPage({ params }: Props) {
  const t = await getTranslations("Admin.banner");

  return (
    <>
      <div className="px-4 md:px-0">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/banner">
            <ArrowLeft />
            {t("back")}
          </Link>
        </Button>
      </div>
      <Suspense
        fallback={
          <Panel className="space-y-3 px-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </Panel>
        }
      >
        <EditBanner params={params} />
      </Suspense>
    </>
  );
}

async function EditBanner({ params }: { params: Props["params"] }) {
  const { id } = await params;
  const banner = UUID.test(id) ? await getBanner(id) : null;
  if (!banner) notFound();

  const [t, locale] = await Promise.all([
    getTranslations("Admin.banner"),
    getLocale(),
  ]);

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
      <Panel className="md:col-span-4">
        <PanelHeader icon={Pencil} title={banner.title} as="h1" />
        <PanelBody>
          <BannerForm banner={banner} />
        </PanelBody>
      </Panel>
      <Panel className="md:col-span-3">
        <PanelBody className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {banner.visible ? t("statusVisible") : t("statusHidden")}
            </p>
            <form action={setBannerVisibility}>
              <input type="hidden" name="id" value={banner.id} />
              <input
                type="hidden"
                name="visible"
                value={banner.visible ? "false" : "true"}
              />
              <SubmitButton variant="outline" size="sm">
                {banner.visible ? <EyeOff /> : <Eye />}
                {banner.visible ? t("hide") : t("show")}
              </SubmitButton>
            </form>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("deleteHint")}</p>
            <form action={deleteBanner}>
              <input type="hidden" name="id" value={banner.id} />
              <input type="hidden" name="locale" value={locale} />
              <SubmitButton variant="destructive" size="sm">
                <Trash2 />
                {t("delete")}
              </SubmitButton>
            </form>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
