/**
 * Updates the SWU stop list and checks the line config against the SWU network.
 *
 *   pnpm update:transport             # update src/content/public-transport/stops.json
 *   pnpm update:transport --dry-run   # only print what would change
 *   pnpm update:transport --output /tmp/stops.json
 *
 * Stop names and coordinates come from SWU; the hand-written short names are kept.
 * Line colors are not part of the SWU API: missing ones are reported and have to be added to
 * src/content/public-transport/lines.ts by hand. See docs/public-transport.md.
 */
import fs from "node:fs";
import path from "node:path";

import {
  LINE_ALIASES,
  LINE_COLORS,
  TRAM_LINES,
} from "../src/content/public-transport/lines";
import {
  ALL_STOPS_ENDPOINT,
  checkLines,
  LINES_ENDPOINT,
  mergeStops,
  NETWORK_STOPS_ENDPOINT,
  parseSwuStops,
  type StopEntry,
} from "../src/features/public-transport/base-data";
import { requestSwu } from "../src/features/public-transport/swu-api";

const STOPS_FILE = path.resolve(
  import.meta.dirname,
  "../src/content/public-transport/stops.json",
);

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const outputIndex = args.indexOf("--output");
  const output =
    outputIndex >= 0 ? path.resolve(args[outputIndex + 1]) : STOPS_FILE;

  const current: StopEntry[] = JSON.parse(fs.readFileSync(STOPS_FILE, "utf8"));
  const [networkJson, allJson, linesJson] = await Promise.all([
    requestSwu(NETWORK_STOPS_ENDPOINT),
    requestSwu(ALL_STOPS_ENDPOINT),
    requestSwu(LINES_ENDPOINT),
  ]);

  // ── Stops ──
  const { stops, changes } = mergeStops(current, {
    network: parseSwuStops(networkJson),
    all: parseSwuStops(allJson),
  });
  console.log(`\nStops: ${current.length} → ${stops.length}`);
  section(
    "Added (check the suggested short name in stops.json)",
    changes.added,
    (s) => `${s.id} ${s.name} → "${s.short_name}"`,
  );
  section(
    "Removed (no longer known to SWU)",
    changes.removed,
    (s) => `${s.id} ${s.name}`,
  );
  section(
    "Renamed (check the short name)",
    changes.renamed,
    (s) => `${s.id} "${s.from}" → "${s.to}"`,
  );
  section("Moved", changes.moved, (s) => `${s.id} ${s.name} (${s.meters} m)`);

  const changed =
    changes.added.length +
      changes.removed.length +
      changes.renamed.length +
      changes.moved.length >
    0;
  if (!changed) {
    console.log("  Up to date.");
  } else if (dryRun) {
    console.log("\n  Dry run: nothing written.");
  } else {
    fs.writeFileSync(output, `${JSON.stringify(stops, null, 2)}\n`);
    console.log(`\n  Written to ${path.relative(process.cwd(), output)}`);
  }

  // ── Lines ──
  const issues = checkLines(linesJson, {
    colors: LINE_COLORS,
    trams: TRAM_LINES,
    aliases: LINE_ALIASES,
  });
  console.log("\nLines (src/content/public-transport/lines.ts):");
  section(
    "Missing color → add to LINE_COLORS",
    issues.missingColor,
    (name) => name,
  );
  section(
    "Wrong badge shape → adjust TRAM_LINES",
    issues.wrongShape,
    (s) => `${s.name} should be a ${s.expected}`,
  );
  section(
    "Not in the SWU network anymore (can be removed from LINE_COLORS)",
    issues.unused,
    (name) => name,
  );
  if (
    !issues.missingColor.length &&
    !issues.wrongShape.length &&
    !issues.unused.length
  ) {
    console.log("  All lines are configured.");
  }
  console.log();
}

function section<T>(title: string, items: T[], line: (item: T) => string) {
  if (items.length === 0) return;
  console.log(`  ${title}:`);
  for (const item of items) console.log(`    - ${line(item)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
