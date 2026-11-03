import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import { cacheLife } from "next/cache";
import { z } from "zod";

import { routing, type Locale } from "@/lib/i18n/routing";

/**
 * Guides live in `src/content/guides` as `<slug>.<locale>.mdx`, e.g. `eduroam/ios.de.mdx`.
 * Folders group guides and get their own listing page (`/guides/eduroam`).
 * A guide missing in the requested locale falls back to the default locale.
 */
const GUIDES_DIR = path.join(process.cwd(), "src", "content", "guides");
const WORDS_PER_MINUTE = 220;

const frontmatterSchema = z.object({
  title: z.string(),
  /** Longer title used on the guide page itself */
  titleWeb: z.string().optional(),
  summary: z.string(),
  description: z.string().optional(),
  publishedAt: z.coerce.date(),
  author: z.string(),
  keywords: z.string().optional(),
});

export type GuideFrontmatter = z.infer<typeof frontmatterSchema>;

export type Guide = {
  /** URL path below `/guides`, e.g. `eduroam/ios` */
  slug: string;
  /** Locale of the file that is actually rendered (may differ from the requested one) */
  locale: Locale;
  /** Path of the MDX file relative to the guides directory, without extension */
  file: string;
  frontmatter: GuideFrontmatter;
  readingTimeMin: number;
};

export type GuideFolder = {
  path: string;
  folders: string[];
  guides: Guide[];
};

async function readAllGuides(): Promise<Guide[]> {
  "use cache";
  cacheLife("max");

  const entries = await fs.readdir(GUIDES_DIR, { recursive: true });
  const files = entries.filter((entry) => entry.endsWith(".mdx"));

  return Promise.all(
    files.map(async (entry) => {
      const file = entry
        .split(path.sep)
        .join("/")
        .replace(/\.mdx$/, "");
      const match = file.match(/^(.+)\.([a-z]{2})$/);
      const slug = match?.[1] ?? file;
      const locale = (match?.[2] ?? routing.defaultLocale) as Locale;

      const raw = await fs.readFile(path.join(GUIDES_DIR, entry), "utf-8");
      const { data, content } = matter(raw);

      const parsed = frontmatterSchema.safeParse(data);
      if (!parsed.success) {
        throw new Error(
          `Invalid frontmatter in guide "${entry}": ${z.prettifyError(parsed.error)}`,
        );
      }

      const words = content.trim().split(/\s+/).length;

      return {
        slug,
        locale,
        file,
        frontmatter: parsed.data,
        readingTimeMin: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)),
      };
    }),
  );
}

/** All guides in the given locale, falling back to the default locale per guide */
export async function getGuides(locale: Locale): Promise<Guide[]> {
  const all = await readAllGuides();
  const bySlug = new Map<string, Guide>();

  for (const guide of all) {
    const existing = bySlug.get(guide.slug);
    if (guide.locale === locale) bySlug.set(guide.slug, guide);
    else if (!existing && guide.locale === routing.defaultLocale)
      bySlug.set(guide.slug, guide);
  }

  return [...bySlug.values()].sort(
    (a, b) =>
      b.frontmatter.publishedAt.getTime() - a.frontmatter.publishedAt.getTime(),
  );
}

export async function getGuide(
  slug: string,
  locale: Locale,
): Promise<Guide | null> {
  const guides = await getGuides(locale);
  return guides.find((guide) => guide.slug === slug) ?? null;
}

/** Direct children of a folder (`""` is the root). Returns `null` for unknown folders. */
export async function getGuideFolder(
  folderPath: string,
  locale: Locale,
): Promise<GuideFolder | null> {
  const guides = await getGuides(locale);
  const prefix = folderPath ? `${folderPath}/` : "";

  const folders = new Set<string>();
  const direct: Guide[] = [];

  for (const guide of guides) {
    if (!guide.slug.startsWith(prefix)) continue;
    const rest = guide.slug.slice(prefix.length).split("/");
    if (rest.length === 1) direct.push(guide);
    else folders.add(prefix + rest[0]);
  }

  if (folderPath && folders.size === 0 && direct.length === 0) return null;

  return { path: folderPath, folders: [...folders].sort(), guides: direct };
}

/** Every guide and folder path, for `generateStaticParams` and the sitemap */
export async function getGuidePaths(): Promise<string[]> {
  const guides = await readAllGuides();
  const paths = new Set<string>();

  for (const { slug } of guides) {
    paths.add(slug);
    const parts = slug.split("/");
    for (let i = 1; i < parts.length; i++) {
      paths.add(parts.slice(0, i).join("/"));
    }
  }

  return [...paths];
}

/** Compiled MDX component of a guide (compiled at build time by `@next/mdx`) */
export async function loadGuideContent(guide: Guide) {
  const mod = await import(`@/content/guides/${guide.file}.mdx`);
  return mod.default as React.ComponentType;
}

export function formatFolderName(folderPath: string) {
  return (folderPath.split("/").pop() ?? folderPath).replaceAll("_", " ");
}
