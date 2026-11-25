import {
  BUILDINGS,
  ROOMS,
  type CampusArea,
  type Room,
} from "@/content/campus-map";
import type { Locale } from "@/lib/i18n/routing";
import type { Slot } from "./availability";
import type { Booking } from "./parse-occupancy";
import {
  FREE_ROOM_AREAS,
  FREE_ROOM_KINDS,
  type FreeRoom,
  type FreeRoomArea,
  type FreeRoomKind,
} from "./types";

const buildings = new Map(
  BUILDINGS.features.map(({ properties }) => [properties.id, properties]),
);

const isFreeRoomKind = (kind: Room["kind"]): kind is FreeRoomKind =>
  (FREE_ROOM_KINDS as readonly string[]).includes(kind);

const isFreeRoomArea = (area: CampusArea): area is FreeRoomArea =>
  (FREE_ROOM_AREAS as readonly string[]).includes(area);

/** Lecture halls and seminar rooms in the listed areas, from the campus map */
export const TEACHING_ROOMS = ROOMS.filter(
  (room) =>
    isFreeRoomKind(room.kind) &&
    isFreeRoomArea(buildings.get(room.building)!.area),
);

export function getFreeRooms(locale: Locale): FreeRoom[] {
  return TEACHING_ROOMS.filter((room) => room.qisIds?.length).map((room) => {
    const building = buildings.get(room.building)!;
    return {
      id: room.id,
      kind: room.kind as FreeRoomKind,
      name: room.name,
      title: room.title?.[locale],
      building: building.label,
      area: building.area as FreeRoomArea,
      seats: room.seats,
    };
  });
}

/** Bookings per room id of the campus map, sorted by start (only rooms with bookings) */
export function slotsByRoom(bookings: Booking[]): Record<string, Slot[]> {
  const rooms = new Map<number, string[]>();
  for (const room of TEACHING_ROOMS) {
    for (const qisId of room.qisIds ?? []) {
      rooms.set(qisId, [...(rooms.get(qisId) ?? []), room.id]);
    }
  }

  const result: Record<string, Slot[]> = {};
  for (const { qisId, start, end, title } of bookings) {
    for (const roomId of rooms.get(qisId) ?? []) {
      // Parallel groups are listed as separate rows with the same time and title
      const slots = (result[roomId] ??= []);
      if (
        !slots.some(
          (s) => s.start === start && s.end === end && s.title === title,
        )
      ) {
        slots.push({ start, end, title });
      }
    }
  }
  for (const slots of Object.values(result)) {
    slots.sort(
      (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end),
    );
  }
  return result;
}
