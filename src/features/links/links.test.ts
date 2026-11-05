import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { FEATURED_LINKS, QUICK_LINKS } from "@/content/home";
import { LINK_CATEGORIES } from "@/content/links";
import type { Localized } from "@/content/links";
import { allLinkHrefs, getLink, getLinkCategories } from "./links";
import { normalize, searchLinks } from "./search";

const GUIDES_DIR = path.resolve(import.meta.dirname, "../../content/guides");
/** Internal pages a link may point to (besides guides) */
const INTERNAL_PAGES = [
  "/",
  "/mensa",
  "/guides",
  "/parking-lots",
  "/links",
  "/about",
  "/exmatriculation",
];

const allLinks = LINK_CATEGORIES.flatMap((category) => category.links);

describe("link collection", () => {
  it("has unique link ids and category slugs", () => {
    const ids = allLinks.map((link) => link.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    const slugs = LINK_CATEGORIES.map((category) => category.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses url-friendly ids", () => {
    for (const link of allLinks)
      expect(link.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("only contains valid hrefs", () => {
    for (const { label, href } of allLinkHrefs()) {
      if (href.startsWith("/")) continue;
      if (href.startsWith("mailto:")) {
        expect(href, label).toMatch(/^mailto:[^@\s]+@[^@\s]+$/);
        continue;
      }
      expect(() => new URL(href), label).not.toThrow();
      expect(new URL(href).protocol, label).toMatch(/^https?:$/);
    }
  });

  it("points internal links to existing guides and pages", () => {
    for (const { label, href } of allLinkHrefs()) {
      if (!href.startsWith("/")) continue;
      if (href.startsWith("/guides/")) {
        const slug = href.slice("/guides/".length);
        const exists = ["de", "en"].some((locale) =>
          fs.existsSync(path.join(GUIDES_DIR, `${slug}.${locale}.mdx`)),
        );
        expect(
          exists,
          `${label}: guide "${slug}" not found in src/content/guides`,
        ).toBe(true);
      } else {
        expect(INTERNAL_PAGES, label).toContain(href);
      }
    }
  });

  it("has both languages for every translated text", () => {
    const check = (value: Localized | undefined, where: string) => {
      if (value === undefined || typeof value === "string") return;
      expect(value.de.trim(), where).not.toBe("");
      expect(value.en.trim(), where).not.toBe("");
    };
    for (const category of LINK_CATEGORIES) {
      check(category.title, category.slug);
      check(category.description, category.slug);
      for (const link of category.links) {
        check(link.label, link.id);
        check(link.description, link.id);
        for (const related of link.related ?? []) check(related.label, link.id);
      }
    }
  });
});

describe("home page links", () => {
  it("only reference existing link ids", () => {
    for (const { linkId } of [...QUICK_LINKS, ...FEATURED_LINKS]) {
      expect(() => getLink(linkId, "de"), linkId).not.toThrow();
    }
  });
});

describe("search", () => {
  const categories = getLinkCategories("de");
  const ids = (query: string) =>
    searchLinks(categories, query).flatMap((category) =>
      category.links.map((link) => link.id),
    );

  it("normalizes umlauts and case", () => {
    expect(normalize("Hörsaalfinder STRAẞE")).toBe("horsaalfinder strasse");
  });

  it("finds links by label, related links, keywords, and host", () => {
    expect(ids("moodle")).toEqual(["moodle"]);
    expect(ids("hörsaal")).toContain("hoersaalfinder");
    expect(ids("horsaal")).toContain("hoersaalfinder");
    expect(ids("modulhandbuch")).toContain("campusonline"); // related link
    expect(ids("drucken")).toContain("print-uni"); // keyword
    expect(ids("sona-systems")).toContain("sona"); // host
  });

  it("finds links in both languages", () => {
    const english = getLinkCategories("en");
    const idsEn = (query: string) =>
      searchLinks(english, query).flatMap((category) =>
        category.links.map((link) => link.id),
      );
    expect(idsEn("hörsaal")).toContain("hoersaalfinder");
    expect(ids("lecture hall")).toContain("hoersaalfinder");
  });

  it("requires every word to match", () => {
    expect(ids("stuve wiki")).toEqual(["stuve-wiki"]);
  });

  it("returns everything for an empty query and nothing for nonsense", () => {
    expect(searchLinks(categories, "  ")).toEqual(categories);
    expect(searchLinks(categories, "xyzzy")).toEqual([]);
  });
});

describe("link check", async () => {
  const { classify } = await import("./check");

  it("classifies responses", () => {
    expect(classify(200, "https://a.de/", "https://a.de")).toEqual({
      status: "ok",
      code: 200,
    });
    expect(classify(200, "http://a.de", "https://a.de/")).toEqual({
      status: "ok",
      code: 200,
    });
    expect(classify(200, "https://a.de/old", "https://a.de/new")).toMatchObject(
      { status: "redirected", location: "https://a.de/new" },
    );
    // Start page forwarding to its login page on the same host
    expect(classify(200, "https://a.de/", "https://a.de/login")).toEqual({
      status: "ok",
      code: 200,
    });
    expect(classify(200, "https://a.de/", "https://b.de/login")).toMatchObject({
      status: "redirected",
    });
    expect(classify(403, "https://a.de", "https://a.de")).toEqual({
      status: "restricted",
      code: 403,
    });
    expect(classify(404, "https://a.de", "https://a.de")).toEqual({
      status: "broken",
      code: 404,
    });
  });
});
