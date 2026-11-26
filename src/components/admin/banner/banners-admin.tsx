import { Eye, EyeOff, History, Megaphone, Pencil, Plus } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import { BannerBar } from "@/components/layout/banner-bar";
import { Button } from "@/components/ui/button";
import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
} from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { SubmitButton } from "@/components/ui/submit-button";
import { setBannerVisibility } from "@/features/admin/banner/actions";
import { listBanners } from "@/features/admin/banner/queries";
import { bannerColorValue, localizeBanner } from "@/features/banner/format";
import type { Banner } from "@/lib/db/schema";
import { Link } from "@/lib/i18n/navigation";
import { BannerForm } from "./banner-form";

export async function BannersAdmin() {
  const [t, locale, { visible, others }] = await Promise.all([
    getTranslations("Admin.banner"),
    getLocale(),
    listBanners(),
  ]);

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
      <div className="space-y-4 md:col-span-4">
        <Panel>
          <PanelHeader icon={Megaphone} title={t("visible")} />
          {visible ? (
            <div className="space-y-3">
              <div className="border-y" inert>
                <BannerBar banner={localizeBanner(visible, locale)} />
              </div>
              <BannerRow banner={visible} />
            </div>
          ) : (
            <PanelEmpty>{t("none")}</PanelEmpty>
          )}
        </Panel>
        {others.length > 0 && (
          <Panel>
            <PanelHeader icon={History} title={t("others")} />
            <ul className="divide-y divide-border">
              {others.map((banner) => (
                <li key={banner.id}>
                  <BannerRow banner={banner} />
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      <Panel className="md:col-span-3">
        <PanelHeader icon={Plus} title={t("new")} />
        <PanelBody>
          <BannerForm />
        </PanelBody>
      </Panel>
    </div>
  );
}

export function BannersAdminSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
      <Panel className="space-y-3 px-4 md:col-span-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-14 w-full" />
      </Panel>
      <Panel className="space-y-3 px-4 md:col-span-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </Panel>
    </div>
  );
}

/** Title, texts and date, with show/hide and edit */
async function BannerRow({ banner }: { banner: Banner }) {
  const [t, format] = await Promise.all([
    getTranslations("Admin.banner"),
    getFormatter(),
  ]);

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <span
        className="size-3 shrink-0 rounded-full"
        style={{ backgroundColor: bannerColorValue(banner.color) }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{banner.title}</p>
        {banner.description && (
          <p className="truncate text-sm text-muted-foreground">
            {banner.description}
          </p>
        )}
        <p className="font-mono text-xs text-muted-foreground">
          {format.dateTime(banner.createdAt, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
          {banner.titleEn && " · EN"}
          {banner.link && <span className="font-sans"> · {banner.link}</span>}
        </p>
      </div>
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
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/admin/banner/${banner.id}`} aria-label={t("edit")}>
          <Pencil />
        </Link>
      </Button>
    </div>
  );
}
