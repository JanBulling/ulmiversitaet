import { ArrowRight, Info } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  type BannerContent,
  bannerColorValue,
  isExternalLink,
} from "@/features/banner/format";
import { Link } from "@/lib/i18n/navigation";

/**
 * Thin one-line bar: icon, bold title, description (cut off when too long; the full text is in
 * the tooltip), on a light tint of the banner's color. With a link the whole bar is clickable.
 * Used on the site and for the previews in the admin.
 */
export function BannerBar({ banner }: { banner: BannerContent }) {
  const t = useTranslations("Banner");
  const color = bannerColorValue(banner.color);

  const content = (
    <>
      <Info className="size-4 shrink-0" style={{ color }} aria-hidden />
      <p
        className="min-w-0 flex-1 truncate"
        title={[banner.title, banner.description].filter(Boolean).join(" – ")}
      >
        <span className="font-semibold">{banner.title}</span>
        {banner.description && (
          <span className="text-muted-foreground"> · {banner.description}</span>
        )}
      </p>
      {banner.link && (
        <ArrowRight
          className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      )}
    </>
  );
  const contentClass =
    "group flex min-w-0 flex-1 items-center gap-2 py-1.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

  return (
    <aside
      aria-label={t("label")}
      className="border-b text-sm"
      // Opaque tint over the page background, so the text stays readable in both themes
      style={{
        backgroundColor: `color-mix(in oklab, ${color} 18%, var(--background))`,
        borderColor: `color-mix(in oklab, ${color} 35%, var(--background))`,
      }}
    >
      <div className="mx-auto flex min-h-9 max-w-7xl items-center px-4">
        {!banner.link ? (
          <div className={contentClass}>{content}</div>
        ) : isExternalLink(banner.link) ? (
          <a
            href={banner.link}
            target="_blank"
            rel="noopener noreferrer"
            className={contentClass}
          >
            {content}
          </a>
        ) : (
          <Link href={banner.link} className={contentClass}>
            {content}
          </Link>
        )}
      </div>
    </aside>
  );
}
