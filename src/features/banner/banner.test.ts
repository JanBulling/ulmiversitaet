import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { bannerSchema } from "@/features/admin/banner/schema";
import { BANNER_COLORS, banners, type Banner } from "@/lib/db/schema";
import { createTestDatabase } from "@/lib/db/testing/test-database";
import {
  bannerColorValue,
  isAllowedBannerLink,
  isExternalLink,
  localizeBanner,
} from "./format";

const BANNER: Banner = {
  id: "8b1f3c2e-0d4a-4b7e-9c55-2f1a6e7d9b10",
  title: "Mensa heute geschlossen",
  description: "Wegen einer Betriebsversammlung",
  titleEn: null,
  descriptionEn: null,
  link: null,
  color: "orange",
  visible: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("banner links", () => {
  it("allows web addresses and paths of the site", () => {
    expect(isAllowedBannerLink("https://uni-ulm.de/mensa")).toBe(true);
    expect(isAllowedBannerLink("http://example.com")).toBe(true);
    expect(isAllowedBannerLink("/free-rooms")).toBe(true);
  });

  it("rejects other links", () => {
    expect(isAllowedBannerLink("javascript:alert(1)")).toBe(false);
    expect(isAllowedBannerLink("data:text/html,hi")).toBe(false);
    expect(isAllowedBannerLink("//evil.example")).toBe(false);
    expect(isAllowedBannerLink("uni-ulm.de")).toBe(false);
  });

  it("opens other websites in a new tab", () => {
    expect(isExternalLink("https://uni-ulm.de")).toBe(true);
    expect(isExternalLink("/mensa")).toBe(false);
  });
});

describe("banner colors", () => {
  it("has a CSS color for every color", () => {
    for (const color of BANNER_COLORS) {
      expect(bannerColorValue(color), color).toMatch(
        /^(#[0-9a-f]{6}|var\(--primary\))$/,
      );
    }
  });
});

describe("localizeBanner", () => {
  it("shows the German texts without English ones", () => {
    expect(localizeBanner(BANNER, "en")).toMatchObject({
      title: "Mensa heute geschlossen",
      description: "Wegen einer Betriebsversammlung",
    });
  });

  it("shows the English texts on English pages", () => {
    const banner = { ...BANNER, titleEn: "Mensa closed today" };
    expect(localizeBanner(banner, "en")).toMatchObject({
      title: "Mensa closed today",
      // No German description under an English title
      description: null,
    });
    expect(localizeBanner(banner, "de").title).toBe("Mensa heute geschlossen");
  });
});

describe("banner form", () => {
  const form = {
    id: "",
    title: "  Titel ",
    description: "",
    titleEn: "",
    descriptionEn: "",
    link: "",
    color: "default",
    locale: "de",
  };

  it("trims texts and turns empty fields into null", () => {
    expect(bannerSchema.parse(form)).toMatchObject({
      title: "Titel",
      description: null,
      titleEn: null,
      link: null,
    });
  });

  it("rejects a missing title, unsafe links and unknown colors", () => {
    expect(bannerSchema.safeParse({ ...form, title: " " }).success).toBe(false);
    expect(
      bannerSchema.safeParse({ ...form, link: "javascript:alert(1)" }).success,
    ).toBe(false);
    expect(bannerSchema.safeParse({ ...form, color: "neon" }).success).toBe(
      false,
    );
  });
});

describe("banners table", () => {
  let test: Awaited<ReturnType<typeof createTestDatabase>>;
  beforeAll(async () => {
    test = await createTestDatabase();
  });
  afterAll(() => test.close());

  it("allows only one visible banner", async () => {
    const { db } = test;
    await db
      .insert(banners)
      .values([{ title: "A", visible: true }, { title: "B" }, { title: "C" }]);
    await expect(
      db.insert(banners).values({ title: "D", visible: true }),
    ).rejects.toThrow();

    // Showing another banner: hide the current one first (one transaction in the action)
    await db.transaction(async (tx) => {
      await tx
        .update(banners)
        .set({ visible: false })
        .where(eq(banners.visible, true));
      await tx
        .update(banners)
        .set({ visible: true })
        .where(eq(banners.title, "B"));
    });
    const visible = await db
      .select({ title: banners.title })
      .from(banners)
      .where(eq(banners.visible, true));
    expect(visible).toEqual([{ title: "B" }]);
  });

  it("rejects unknown colors", async () => {
    await expect(
      test.db.execute(
        "insert into ulmiversitaet.banners (title, color) values ('X', 'neon')",
      ),
    ).rejects.toThrow();
  });
});
