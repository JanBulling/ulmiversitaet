import { describe, expect, it } from "vitest";

import {
  checkLines,
  mergeStops,
  parseSwuStops,
  shortenStopName,
  type StopEntry,
} from "./base-data";

const stop = (id: number, name: string, lat: number, long: number) => ({
  StopNumber: id,
  StopName: name,
  StopCoordinates: { Latitude: lat, Longitude: long },
});

describe("stop base data", () => {
  const current: StopEntry[] = [
    {
      id: 1240,
      name: "Universität Süd",
      short_name: "Uni Süd",
      lat: 48.422,
      long: 9.9566,
    },
    {
      id: 1241,
      name: "Botanischer Garten",
      short_name: "Bot. Garten",
      lat: 48.4248,
      long: 9.9568,
    },
    {
      id: 1736,
      name: "Wiley Club",
      short_name: "Wiley Club",
      lat: 48.39,
      long: 10.02,
    },
  ];
  const network = parseSwuStops({
    StopAttributes: {
      StopData: [
        stop(1241, "Botanischer Garten", 48.4248, 9.9568),
        stop(1240, "Universität Süd", 48.4225, 9.9566), // moved ~55 m north
        stop(1712, "Heiner-Metzger-Platz", 48.39, 10.0),
        { StopNumber: 9999, StopName: "Ohne Koordinaten" },
      ],
    },
  });
  // The full list also has regional stops without SWU departures
  const all = [
    ...network,
    { id: 4101, name: "Bahnhof Senden", lat: 48.32, long: 10.05 },
  ];
  const api = { network, all };

  it("keeps short names and order, appends new stops, drops removed ones", () => {
    const { stops } = mergeStops(current, api);
    expect(stops.map((s) => [s.id, s.short_name])).toEqual([
      [1240, "Uni Süd"],
      [1241, "Bot. Garten"],
      [1712, "Heiner-Metzger-Pl."],
    ]);
    expect(stops[0].lat).toBe(48.4225);
  });

  it("reports the changes", () => {
    const { changes } = mergeStops(current, api);
    expect(changes.added.map((s) => s.id)).toEqual([1712]);
    expect(changes.removed.map((s) => s.id)).toEqual([1736]);
    expect(changes.renamed).toEqual([]);
    expect(changes.moved).toEqual([
      { id: 1240, name: "Universität Süd", meters: 56 },
    ]);
  });

  it("keeps stops that are only in the full list, and doesn't add regional stops", () => {
    const gleisselstetten = {
      id: 1323,
      name: "Gleißelstetten",
      short_name: "Gleißelst.",
      lat: 48.37,
      long: 9.95,
    };
    const { stops, changes } = mergeStops([gleisselstetten], {
      network: [],
      all: [gleisselstetten],
    });
    expect(stops).toEqual([gleisselstetten]);
    expect(changes.removed).toEqual([]);
    expect(mergeStops(current, api).stops.some((s) => s.id === 4101)).toBe(
      false,
    );
  });

  it("reports renamed stops", () => {
    const renamed = [
      { id: 1240, name: "Uni Süd (Nord)", lat: 48.422, long: 9.9566 },
    ];
    const { changes } = mergeStops(current.slice(0, 1), {
      network: renamed,
      all: renamed,
    });
    expect(changes.renamed).toEqual([
      { id: 1240, from: "Universität Süd", to: "Uni Süd (Nord)" },
    ]);
  });

  it.each([
    ["Universität Ost", "Uni Ost"],
    ["Manfred-Börner-Straße", "Manfred-Börner-Str."],
    ["Am Kraftwerk", "Kraftwerk"],
    ["Hauptbahnhof", "Hbf"],
  ])("suggests short name %s → %s", (name, short) => {
    expect(shortenStopName(name)).toBe(short);
  });
});

describe("line check", () => {
  const routes = (...items: [string, number][]) => ({
    RouteAttributes: {
      RouteData: items.map(([RouteName, RouteCategory]) => ({
        RouteName,
        RouteCategory,
      })),
    },
  });
  const config = {
    colors: { "1": "#E52129", "4": "#14816E", "16": "#DE4B95" },
    trams: ["1", "-"],
    aliases: {},
  };

  it("finds lines without color, wrong shapes, and unused colors", () => {
    expect(
      checkLines(
        routes(["1", 1], ["1", 5], ["4", 5], ["3", 1], ["N9", 5], ["-", 1]),
        config,
      ),
    ).toEqual({
      missingColor: ["3", "N9"],
      wrongShape: [{ name: "3", expected: "tram" }],
      unused: ["16"],
    });
  });
});
