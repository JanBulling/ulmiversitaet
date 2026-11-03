import fs from "node:fs";
import path from "node:path";

import { createFormatter } from "next-intl";
import { describe, expect, it } from "vitest";

import { countdownLabel, delayStatus, formatDelay } from "./format";
import { distanceInMeters, findNearestStops } from "./nearest-stops";
import { parseDepartures, parsePassengerAlert, SwuApiError } from "./swu-api";

const fixture = (name: string) =>
  JSON.parse(
    fs.readFileSync(
      path.join(import.meta.dirname, "__fixtures__", name),
      "utf8",
    ),
  );

describe("SWU API parsing", () => {
  it("parses departures", () => {
    const departures = parseDepartures(fixture("departures.json"));
    expect(departures).toHaveLength(8);
    expect(departures[0]).toEqual({
      route: "2",
      direction: "Science Park II",
      scheduledTime: new Date("2026-11-03T14:14:00+01:00"),
      actualTime: new Date("2026-11-03T14:16:20+01:00"),
      countdown: 6,
      deviation: 140,
    });
  });

  it("returns no departures when the API omits them", () => {
    expect(parseDepartures({ StopPassage: { State: "ok" } })).toEqual([]);
  });

  it("rejects unexpected responses", () => {
    expect(() => parseDepartures({ error: "x" })).toThrow(SwuApiError);
    expect(() => parsePassengerAlert(null)).toThrow(SwuApiError);
  });

  it("treats an alert text as a disruption even if the status says OK", () => {
    expect(parsePassengerAlert(fixture("alert-disruption.json"))).toEqual({
      status: "disruption",
      title: "Aktuelle Störungsinformation",
      messages: [expect.stringContaining("Linie 9")],
    });
  });

  it("splits multiple alert messages", () => {
    expect(
      parsePassengerAlert({
        PassengerAlert: {
          AlertData: " Linie 1 gesperrt +++ Linie 2 verspätet ",
        },
      }),
    ).toMatchObject({ messages: ["Linie 1 gesperrt", "Linie 2 verspätet"] });
  });

  it("reports no disruption without alert text", () => {
    expect(parsePassengerAlert(fixture("alert-none.json"))).toEqual({
      status: "ok",
    });
  });
});

describe("formatting", () => {
  const format = createFormatter({ locale: "de", timeZone: "Europe/Berlin" });
  const time = new Date("2026-11-03T15:30:00+01:00");

  it.each([
    [-90, { kind: "departed" }],
    [0, { kind: "now" }],
    [45, { kind: "seconds", value: 45 }],
    [61, { kind: "minutes", value: 2 }],
    [3600, { kind: "minutes", value: 60 }],
    [3700, { kind: "time", value: "15:30" }],
  ])("countdown %i", (countdown, expected) => {
    expect(countdownLabel(countdown, time, format)).toEqual(expected);
  });

  it("formats delays", () => {
    expect(formatDelay(5)).toBeNull();
    expect(formatDelay(140)).toBe("+2min 20s");
    expect(formatDelay(-30)).toBe("-30s");
    expect([delayStatus(-30), delayStatus(0), delayStatus(140)]).toEqual([
      -1, 0, 1,
    ]);
  });
});

describe("nearest stops", () => {
  const uniSued = { latitude: 48.42202388888889, longitude: 9.956625 };

  it("measures distances in meters", () => {
    // Uni Süd → Botanischer Garten is about 300 m
    const botanicalGarden = {
      latitude: 48.424839444444444,
      longitude: 9.956803055555556,
    };
    expect(distanceInMeters(uniSued, botanicalGarden)).toBeGreaterThan(280);
    expect(distanceInMeters(uniSued, botanicalGarden)).toBeLessThan(330);
  });

  it("returns the nearest stops first", () => {
    const nearest = findNearestStops(uniSued);
    expect(nearest).toHaveLength(3);
    expect(nearest[0]).toMatchObject({ stopId: 1240, name: "Uni Süd" });
    expect(nearest.map((stop) => stop.distance)).toEqual(
      [...nearest.map((stop) => stop.distance)].sort((a, b) => a - b),
    );
  });

  it("finds nothing far away from Ulm", () => {
    expect(findNearestStops({ latitude: 52.52, longitude: 13.405 })).toEqual(
      [],
    );
  });
});
