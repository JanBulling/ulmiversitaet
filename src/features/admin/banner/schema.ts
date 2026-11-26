import { z } from "zod";

import { isAllowedBannerLink } from "@/features/banner/format";
import { BANNER_COLORS } from "@/lib/db/schema";
import { routing } from "@/lib/i18n/routing";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);

export const BANNER_TITLE_MAX = 120;
export const BANNER_DESCRIPTION_MAX = 300;
export const BANNER_LINK_MAX = 500;

/** Form fields of a banner; empty optional fields become `null` */
export const bannerSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  title: z.string().trim().min(1).max(BANNER_TITLE_MAX),
  description: optionalText(BANNER_DESCRIPTION_MAX),
  titleEn: optionalText(BANNER_TITLE_MAX),
  descriptionEn: optionalText(BANNER_DESCRIPTION_MAX),
  link: optionalText(BANNER_LINK_MAX).refine(
    (link) => link === null || isAllowedBannerLink(link),
    { message: "link" },
  ),
  color: z.enum(BANNER_COLORS),
  locale: z.enum(routing.locales).catch(routing.defaultLocale),
});
