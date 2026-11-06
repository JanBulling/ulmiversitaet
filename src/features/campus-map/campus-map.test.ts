import { describe, expect, it } from "vitest";

import { BUILDINGS, CAMPUS_BOUNDS, PLACES, ROOMS } from "@/content/campus-map";
import { getCampusPlaces, nearestStop } from "./places";
import { placesInCategory, roomsInBuilding, searchPlaces } from "./search";

const places = getCampusPlaces("de");
const names = (query: string, limit?: number) =>
  searchPlaces(places, query, limit).map((place) => place.name);

describe("campus map data", () => {
  it("has unique ids across rooms, buildings and places", () => {
    const ids = places.map((place) => place.id);
    expect(ids.length).toBe(new Set(ids).size);
    // ids are used in the URL
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("only references existing buildings", () => {
    const buildingIds = new Set(
      BUILDINGS.features.map((feature) => feature.properties.id),
    );
    for (const room of ROOMS) expect(buildingIds).toContain(room.building);
  });

  it("places everything inside the map bounds", () => {
    const [west, south, east, north] = CAMPUS_BOUNDS;
    for (const place of [...ROOMS, ...PLACES, ...places]) {
      expect(place.lng).toBeGreaterThan(west);
      expect(place.lng).toBeLessThan(east);
      expect(place.lat).toBeGreaterThan(south);
      expect(place.lat).toBeLessThan(north);
    }
  });

  it("gives every building with an outline a label position", () => {
    for (const { properties, geometry } of BUILDINGS.features) {
      if (geometry) expect(properties.center, properties.id).toBeDefined();
    }
  });
});

describe("campus search", () => {
  it("finds a room by its name first", () => {
    expect(names("H1")[0]).toBe("H1");
    expect(names("h4/5")[0]).toBe("H4/5");
    expect(names("43.2.101")[0]).toBe("43.2.101");
    expect(names("O27/2201")[0]).toBe("O27/2201");
  });

  it("ignores spaces, slashes and the order of building and room", () => {
    expect(names("o27 2201")[0]).toBe("O27/2201");
    expect(names("o272201")[0]).toBe("O27/2201");
    expect(names("O25 H1")[0]).toBe("H1");
    expect(names("Hörsaal 1")[0]).toBe("H1");
    expect(names("hoersaal 22")[0]).toBe("H22");
  });

  it("lists more rooms that start with the query after the exact match", () => {
    expect(names("H1", 8)).toEqual([
      "H1",
      "H10",
      "H11",
      "H12",
      "H13",
      "H14",
      "H15",
      "H16",
    ]);
  });

  it("finds buildings by label and alias, and the rooms inside", () => {
    expect(names("O27")[0]).toBe("O27");
    expect(names("O27")).toContain("H20");
    expect(names("Quartier 45")[0]).toBe("West 45");
    expect(names("blauer hörsaal")[0]).toBe("H45.1");
  });

  it("finds places by kind words in both languages", () => {
    expect(names("Mensa")[0]).toBe("Mensa");
    expect(names("drucker")).toEqual(
      expect.arrayContaining(["O27/2204", "PC-Pool 1"]),
    );
    expect(names("printer")).toEqual(expect.arrayContaining(["O27/2204"]));
    expect(names("kaffee")).toContain("Campuccino");
    expect(names("Uni Süd")).toContain("Universität Süd");
    expect(names("P20")[0]).toBe("P20 Parkhaus Mitte");
  });

  it("returns nothing for an empty or unknown query", () => {
    expect(names("  ")).toEqual([]);
    expect(names("xyz123")).toEqual([]);
  });
});

describe("campus categories", () => {
  it("lists printers including PC pools with a printer", () => {
    const printers = placesInCategory(places, "printer").map((p) => p.name);
    expect(printers).toEqual(expect.arrayContaining(["PC-Pool 1", "O27/2204"]));
    expect(printers).not.toContain("PC-Pool 10");
  });

  it("lists the Mensa and the library also as buildings", () => {
    const buildings = placesInCategory(places, "building").map((p) => p.id);
    expect(buildings).toEqual(
      expect.arrayContaining(["o25", "mensa", "bibliothek"]),
    );
  });

  it("lists the rooms of a building, lecture halls first", () => {
    const rooms = roomsInBuilding(places, "o25").map((place) => place.name);
    expect(rooms.slice(0, 4)).toEqual(["H1", "H2", "H4/5", "H7"]);
    expect(rooms).toContain("O25/151");
  });

  it("finds the nearest stop", () => {
    const h1 = places.find((place) => place.id === "o25-h1")!;
    const result = nearestStop(h1, places);
    expect(result?.stop.name).toBe("Universität Süd");
    expect(result?.meters).toBeLessThan(300);
  });
});
