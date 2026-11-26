"use client";

import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useId, useState } from "react";

import { ColorSwatch } from "@/components/admin/color-swatch";
import { BannerBar } from "@/components/layout/banner-bar";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  saveBanner,
  type BannerFormState,
} from "@/features/admin/banner/actions";
import {
  BANNER_DESCRIPTION_MAX,
  BANNER_LINK_MAX,
  BANNER_TITLE_MAX,
} from "@/features/admin/banner/schema";
import { type BannerContent, bannerColorValue } from "@/features/banner/format";
import type { Banner } from "@/lib/db/schema";
import { BANNER_COLORS, type BannerColor } from "@/lib/db/schema/banner-colors";

const TEXTAREA_CLASS =
  "w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

/** Create (without `banner`, shown right away) or edit a banner, with a live preview */
export function BannerForm({ banner }: { banner?: Banner }) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const [state, action] = useActionState<BannerFormState, FormData>(
    saveBanner,
    {},
  );
  const [preview, setPreview] = useState<BannerContent>({
    id: banner?.id ?? "",
    color: banner?.color ?? "default",
    title: banner?.title ?? "",
    description: banner?.description ?? null,
    link: banner?.link ?? null,
  });

  return (
    <form
      action={action}
      // Every change of a field updates the preview
      onInput={(event) => {
        const data = new FormData(event.currentTarget);
        const text = (name: string) => String(data.get(name) ?? "").trim();
        setPreview({
          ...preview,
          title: text("title"),
          description: text("description") || null,
          link: text("link") || null,
        });
      }}
      className="space-y-4"
    >
      <input type="hidden" name="id" value={banner?.id ?? ""} />
      <input type="hidden" name="locale" value={locale} />

      <Field label={t("banner.titleField")} htmlFor="title">
        <Input
          id="title"
          name="title"
          defaultValue={banner?.title}
          required
          maxLength={BANNER_TITLE_MAX}
        />
      </Field>
      <Field label={t("banner.description")} htmlFor="description">
        <textarea
          id="description"
          name="description"
          defaultValue={banner?.description ?? ""}
          maxLength={BANNER_DESCRIPTION_MAX}
          rows={2}
          className={TEXTAREA_CLASS}
        />
      </Field>

      <Field
        label={t("banner.link")}
        htmlFor="link"
        hint={t("banner.linkHint")}
      >
        <Input
          id="link"
          name="link"
          defaultValue={banner?.link ?? ""}
          maxLength={BANNER_LINK_MAX}
          placeholder="https://… / /mensa"
        />
      </Field>
      <BannerColorField
        value={preview.color}
        onChange={(color) => setPreview({ ...preview, color })}
      />

      <details
        className="group rounded-md border px-3 py-2"
        open={Boolean(banner?.titleEn)}
      >
        <summary className="cursor-pointer text-sm font-medium select-none">
          {t("banner.english")}
        </summary>
        <div className="mt-3 space-y-4">
          <p className="text-xs text-muted-foreground">
            {t("banner.englishHint")}
          </p>
          <Field label={t("banner.titleEn")} htmlFor="titleEn">
            <Input
              id="titleEn"
              name="titleEn"
              defaultValue={banner?.titleEn ?? ""}
              maxLength={BANNER_TITLE_MAX}
            />
          </Field>
          <Field label={t("banner.descriptionEn")} htmlFor="descriptionEn">
            <textarea
              id="descriptionEn"
              name="descriptionEn"
              defaultValue={banner?.descriptionEn ?? ""}
              maxLength={BANNER_DESCRIPTION_MAX}
              rows={2}
              className={TEXTAREA_CLASS}
            />
          </Field>
        </div>
      </details>

      {preview.title && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("banner.preview")}</p>
          {/* Not clickable in the preview */}
          <div className="overflow-hidden rounded-md border" inert>
            <BannerBar banner={preview} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>
          {banner ? t("categories.save") : t("banner.create")}
        </SubmitButton>
        {!banner && (
          <span className="text-xs text-muted-foreground">
            {t("banner.createHint")}
          </span>
        )}
        {state.saved && (
          <span className="flex items-center gap-1 text-sm text-success">
            <Check className="size-4" aria-hidden />
            {t("categories.saved")}
          </span>
        )}
        {state.error && (
          <span className="text-sm text-destructive">
            {state.error === "link"
              ? t("banner.errors.link")
              : t("invalidInput")}
          </span>
        )}
      </div>
    </form>
  );
}

/** Swatches of the banner colors; submits `color` */
function BannerColorField({
  value,
  onChange,
}: {
  value: BannerColor;
  onChange: (color: BannerColor) => void;
}) {
  const t = useTranslations("Admin");
  const labelId = useId();

  return (
    <div className="space-y-2">
      <span id={labelId} className="text-sm leading-none font-semibold">
        {t("banner.color")}
      </span>
      <input type="hidden" name="color" value={value} />
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="flex flex-wrap items-center gap-2"
      >
        {BANNER_COLORS.map((color) => (
          <ColorSwatch
            key={color}
            color={bannerColorValue(color)}
            label={
              color === "default"
                ? t("banner.defaultColor")
                : t(`events.colors.${color}`)
            }
            selected={value === color}
            onSelect={() => onChange(color)}
          />
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
