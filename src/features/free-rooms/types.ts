import type { CampusArea, RoomKind } from "@/content/campus-map";

/** Areas with lecture halls and seminar rooms (the clinics at Michelsberg are left out) */
export const FREE_ROOM_AREAS = [
  "ost",
  "west",
  "helmholtz",
] as const satisfies readonly CampusArea[];

export type FreeRoomArea = (typeof FREE_ROOM_AREAS)[number];

export const FREE_ROOM_KINDS = [
  "lecture-hall",
  "seminar-room",
] as const satisfies readonly RoomKind[];

export type FreeRoomKind = (typeof FREE_ROOM_KINDS)[number];

/** A lecture hall or seminar room as shown on `/free-rooms` */
export type FreeRoom = {
  /** Id on the campus map (`/campus-map?p=<id>`) */
  id: string;
  kind: FreeRoomKind;
  name: string;
  title?: string;
  /** Label of the building, e.g. "O25", "West 45" */
  building: string;
  area: FreeRoomArea;
  seats?: number;
};
