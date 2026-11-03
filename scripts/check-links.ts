/**
 * Checks every external link of the link collection (src/content/links/).
 *
 *   pnpm check:links
 *
 * Exits with code 1 if a link is broken, so it can run in CI. Links marked `uniNetworkOnly`
 * are expected to fail outside the university network and only produce a warning.
 * See docs/links.md.
 */
import { LINK_CATEGORIES } from "../src/content/links";
import { checkUrl, type LinkCheckResult } from "../src/features/links/check";
import { allLinkHrefs } from "../src/features/links/links";

const CONCURRENCY = 6;

async function main() {
  const uniOnly = new Set(
    LINK_CATEGORIES.flatMap((c) => c.links)
      .filter((l) => l.uniNetworkOnly)
      .map((l) => l.id),
  );
  const targets = allLinkHrefs().filter(({ href }) => /^https?:/.test(href));
  // The same URL can appear in several places
  const unique = [
    ...new Map(targets.map((target) => [target.href, target])).values(),
  ];

  console.log(`Checking ${unique.length} links …\n`);
  const results: {
    label: string;
    href: string;
    id: string;
    result: LinkCheckResult;
  }[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < unique.length) {
        const target = unique[next++];
        results.push({ ...target, result: await checkUrl(target.href) });
      }
    }),
  );

  const group = (status: LinkCheckResult["status"]) =>
    results.filter((r) => r.result.status === status);
  const failing = [...group("broken"), ...group("unreachable")];
  const broken = failing.filter((r) => !uniOnly.has(r.id));
  const expected = failing.filter((r) => uniOnly.has(r.id));

  section(
    "❌ Broken",
    broken,
    (r) => `${r.label}\n      ${r.href}\n      ${describe(r.result)}`,
  );
  section(
    "⚠️  Not reachable from here (marked as uni network only)",
    expected,
    (r) => `${r.label} – ${describe(r.result)}`,
  );
  section(
    "↪️  Redirected (consider updating)",
    group("redirected"),
    (r) =>
      `${r.label}\n      ${r.href}\n      → ${r.result.status === "redirected" ? r.result.location : ""}`,
  );
  section(
    "🔒 Login required / blocks bots (usually fine)",
    group("restricted"),
    (r) => `${r.label} (${describe(r.result)})`,
  );

  console.log(
    `\n✅ ${group("ok").length} ok, ${group("redirected").length} redirected, ${group("restricted").length} restricted, ${broken.length} broken`,
  );
  if (broken.length > 0) process.exit(1);
}

function describe(result: LinkCheckResult): string {
  if (result.status === "unreachable") return `unreachable: ${result.error}`;
  return `HTTP ${result.code}`;
}

function section<T>(title: string, items: T[], line: (item: T) => string) {
  if (items.length === 0) return;
  console.log(`${title}:`);
  for (const item of items) console.log(`  - ${line(item)}`);
  console.log();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
