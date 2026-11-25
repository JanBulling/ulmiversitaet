import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { roomStatus, freeMinutes, type Slot } from "./availability";
import { OccupancyParseError, parseOccupancy } from "./parse-occupancy";
import { getFreeRooms, slotsByRoom, TEACHING_ROOMS } from "./rooms";

const fixture = (name: string) =>
  fs.readFileSync(path.join(import.meta.dirname, "__fixtures__", name), "utf8");

describe("parseOccupancy", () => {
  const bookings = parseOccupancy(fixture("2026-11-26.html"), "2026-11-26");

  it("reads every booking with a room", () => {
    // 33 rows, two of them without a room
    expect(bookings).toHaveLength(31);
    expect(bookings[0]).toEqual({
      qisId: 9,
      start: "06:00",
      end: "22:00",
      title: "Sanierung Lüftungsanlage",
    });
    expect(bookings).toContainEqual({
      qisId: 475,
      start: "10:00",
      end: "12:00",
      title: "Personalauswahl und berufliche Eignungsdiagnostik",
    });
  });

  it("reads a weekend day", () => {
    const sunday = parseOccupancy(fixture("2026-11-29.html"), "2026-11-29");
    expect(sunday.length).toBeGreaterThan(0);
    expect(sunday.every((b) => b.start < b.end)).toBe(true);
  });

  it("returns nothing for a day without bookings", () => {
    expect(
      parseOccupancy(fixture("2031-01-01.empty.html"), "2031-01-01"),
    ).toEqual([]);
  });

  it("rejects pages of another day and error pages", () => {
    expect(() =>
      parseOccupancy(fixture("2026-11-26.html"), "2026-11-27"),
    ).toThrow(OccupancyParseError);
    expect(() =>
      parseOccupancy(fixture("invalid-date.html"), "2026-11-26"),
    ).toThrow(OccupancyParseError);
    expect(() => parseOccupancy("<html></html>", "2026-11-26")).toThrow(
      OccupancyParseError,
    );
  });
});

describe("roomStatus", () => {
  const slots: Slot[] = [
    { start: "08:00", end: "10:00", title: "A" },
    { start: "10:00", end: "12:00", title: "B" },
    { start: "11:00", end: "12:30", title: "C" },
    { start: "16:00", end: "18:00", title: "D" },
  ];

  it("is free without bookings for the rest of the day", () => {
    const status = roomStatus([], "09:00");
    expect(status).toEqual({ free: true, until: null, next: null });
    expect(freeMinutes(status, "09:00")).toBe(Infinity);
  });

  it("is free until the next booking", () => {
    const status = roomStatus(slots, "13:00");
    expect(status).toEqual({ free: true, until: "16:00", next: "D" });
    expect(freeMinutes(status, "13:00")).toBe(180);
    expect(roomStatus(slots, "07:00")).toMatchObject({ until: "08:00" });
  });

  it("is busy until the end of back-to-back and overlapping bookings", () => {
    expect(roomStatus(slots, "09:00")).toEqual({
      free: false,
      until: "12:30",
      title: "A",
    });
  });

  it("treats the end of a booking as free", () => {
    expect(roomStatus(slots, "12:30")).toMatchObject({ free: true });
    expect(roomStatus(slots, "18:00")).toEqual({
      free: true,
      until: null,
      next: null,
    });
    expect(roomStatus(slots, "16:00")).toMatchObject({ free: false });
  });
});

describe("rooms", () => {
  it("knows the campusonline ids of all lecture halls and seminar rooms", () => {
    // An empty list means the room isn't in campusonline (it is then left out)
    for (const room of TEACHING_ROOMS) {
      expect(room.qisIds, room.id).toBeDefined();
    }
    const ids = TEACHING_ROOMS.flatMap((room) => room.qisIds ?? []);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("lists only rooms with known bookings", () => {
    const rooms = getFreeRooms("de");
    expect(rooms.length).toBeGreaterThan(90);
    expect(rooms.map((room) => room.id)).not.toContain("n25-2102");
    expect(new Set(rooms.map((room) => room.area))).toEqual(
      new Set(["ost", "west", "helmholtz"]),
    );
  });

  it("assigns bookings to the rooms of the campus map", () => {
    const slots = slotsByRoom(
      parseOccupancy(fixture("2026-11-26.html"), "2026-11-26"),
    );
    expect(slots["o27-121"].map((slot) => slot.start)).toEqual([
      "08:00",
      "10:00",
      "12:00",
      "16:00",
    ]);
    expect(slots["o25-h4-5"]).toHaveLength(6);
    expect(slots["h47-0-501"]).toHaveLength(5);
    expect(roomStatus(slots["o27-121"], "09:00")).toMatchObject({
      free: false,
      until: "14:00",
    });
    expect(roomStatus(slots["o27-121"], "14:30")).toMatchObject({
      free: true,
      until: "16:00",
    });
  });

  it("lists a booking for several parallel groups once", () => {
    const booking = { qisId: 33, start: "08:00", end: "10:00", title: "A" };
    expect(slotsByRoom([booking, booking])["o27-121"]).toHaveLength(1);
  });
});
